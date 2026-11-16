---
kind: docs
locale: en
title: "ClickHouse"
sourcePath: docs/en/clickhouse-v3.md
---

# ClickHouse versioned materialization

中文：[ClickHouse 手册](/docs/zh/reference/clickhouse-v3.html).

V3 supports a direct ClickHouse HTTP/HTTPS destination alongside transactional
databases and message destinations. The accepted initial server is ClickHouse
25.8.33.6, using Atomic databases, local MergeTree receipts and
ReplacingMergeTree data. The business names are query views using `FINAL` and
filtering tombstones. This profile serves analytical queries; transactional
business takeover requires its own database/application compatibility assessment.

## Configure and start

Use [the complete example](/files/config/clickhouse-v3.yml). Set `product:
CLICKHOUSE`, a direct `http://host:8123` or `https://host:8443` endpoint, separate
username/password, an exclusive metadata database and explicit source-database
to target-database mappings. Authentication material is never placed in the URL.
The endpoint accepts no credentials, query parameters or non-root path. Use the
normal V3 multi-target wizard or YAML import; credentials are masked in previews.

```bash
export RIVOMESH_NODE_ID=worker-1
export MYSQL_PASSWORD='source password'
export CLICKHOUSE_PASSWORD='target password'
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/clickhouse-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/clickhouse-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar status config/clickhouse-v3.yml
```

`check` reads source/catalog capabilities and checks ClickHouse UInt128,
canonical-query formatting and required MergeTree settings. It creates no target
database/table. `run` requires database/table/view creation, INSERT and SELECT
permissions, including access to the relevant system catalog. Existing
non-Atomic databases and foreign business objects are rejected. A missing
initialized object is not silently recreated at an old checkpoint.

One deployment can configure several target instances and independently mapped
databases. Use a fixed direct server endpoint for this profile. Load-balancing
between independent servers, Distributed/Replicated/Shared engines, Keeper
failover and ClickHouse Cloud require separate profiles and acceptance.

## Data and indexes

| Source representation | Initial ClickHouse storage |
|---|---|
| Boolean | UInt8, retaining NULL where allowed |
| Signed / unsigned integers | Int64 / UInt64 |
| Decimal | Decimal with source precision/scale, up to 76 digits |
| Float32 / Float64 | Native binary floating point; nonfinite values rejected |
| Text / JSON | String; JSON number text remains lossless |
| Binary / geometry | Raw String bytes, decoded from the internal base64 wire value |
| Date / time / datetime / timestamp | Lossless String, including values outside native temporal ranges |
| SQL NULL | Nullable flag; distinct from JSON literal `null` |
| Generated columns | Source/normalizer-computed values, stored as ordinary columns |

Temporal text avoids truncating MySQL's wide calendar range and TIME durations.
Use explicit analytical conversion expressions where appropriate. Original
schema details remain in the owned metadata. MySQL collation, default-expression
and generated-expression execution semantics are not installed in ClickHouse.

Logical identity keys feed stable row identities; source sequence and row ordinal
select the latest version. Identical keyless occurrences retain separate
identities, and a delete removes one occurrence. PK moves delete the old identity
and insert the new one. Query business views to obtain the logical current rows;
underlying physical parts can contain earlier versions and replay duplicates.

`uniquePolicy: DOWNGRADE_BUSINESS` is required. Business UNIQUE constraints are
not enforced in ClickHouse. Source PK/identity selection is retained through the
versioned view. All target writes during synchronization belong to the
synchronization service, as agreed for constraint downgrades.

### Secondary index conversion

The new-task wizard and example explicitly set
`clickhouse.secondaryIndexes: DATA_SKIPPING`. For backward compatibility, omitted
options retain the earlier NONE data-only profile.
`check` returns `clickhouseIndexPlans`, with each source index, action, reason and
physical index names. The accepted table schema record persists that plan.

| Source secondary index | Physical access structure |
|---|---|
| BTREE, business UNIQUE, simple column GSI/GLOBAL/GLOBAL_BTREE | One non-unique skipping index per indexed column |
| Numeric/boolean/decimal column | `minmax`, granularity 1 |
| Text/binary/temporal-text column | `bloom_filter(0.01)`, granularity 1 |
| Composite or descending index | Split into per-column structures; source ordering is not reproduced |
| Repeated column across indexes | One shared physical index |
| Expression, prefix, FULLTEXT/SPATIAL or unsupported column type | `REQUIRES_PLAN`; automatic table creation stops |
| Source primary/identity key | Retained by stable row identity; never weakened into optional acceleration |

These structures do not enforce uniqueness, provide a B-tree point lookup,
reproduce MySQL collation/order, or retain GSI routing/global uniqueness. They
accelerate matching analytical predicates where data distribution permits; a
planner may choose not to use them. Temporal String indexes accelerate equality,
not native calendar-range operations. Bloom false positives add reads, not rows.
See the [official skipping-index guide](https://github.com/ClickHouse/clickhouse-docs/blob/main/docs/guides/best-practices/skipping-indexes.md).

Generated views explicitly enable `use_skip_indexes_if_final=1` and
`use_skip_indexes_if_final_exact_mode=1`. Exact mode expands candidate ranges to
include newer versions before FINAL; disabling it can resurrect stale matches.
The [accepted server's settings source](https://github.com/ClickHouse/ClickHouse/blob/v25.8.33.6-lts/src/Core/Settings.cpp)
describes that requirement. Do not edit the owned view or query physical history
as if it were the current business table. New table creation checks the complete
canonical definition, including indexes, before persisting schema confirmation.
Index/view alterations after confirmation pause this target.

**Earlier data-only ClickHouse tasks:** omitted options or explicit
`clickhouse.secondaryIndexes: NONE` retain the original configuration fingerprint
and existing layout. This is an
explicit index omission, recorded as `OMIT_BY_CONFIGURATION`, not a completed
conversion. Changing from NONE to DATA_SKIPPING changes the fingerprint; it does
not run ALTER against initialized data. Use a separately planned new generation
and snapshot/rebuild. Do not erase journal metadata to bypass this guard. The UI
wizard uses DATA_SKIPPING for new tasks; importing YAML supports either mode.
Omitted fields in earlier task files do not trigger an automatic layout migration.

## Confirmation and recovery

Rows use native RowBinary, bounded requests and synchronous inserts. Each batch
groups rows by table; writes precede a durable native receipt, which precedes
the fenced application-journal checkpoint. Receipt/data tables request
`fsync_after_insert=1`, `fsync_part_directory=1` and
`min_rows_to_fsync_after_merge=1`. Actual power-loss and storage-controller
behavior still require hardware testing.

HTTP 200 alone cannot confirm a ClickHouse query. The client checks exception
headers, complete JSON/count/shape and an empty command response; it rejects
trailing error bodies and redirects. The HTTP client does not automatically
repeat a request after losing its response. The sink replays through stable
versions and receipt checks, without claiming SQL transaction atomicity.

`VERSIONED_MATERIALIZATION` means rows and tables within one source transaction
may become visible in separate batches. Full-copy rows can also be visible
before snapshot completion. Monitor the durable target checkpoint and snapshot
acknowledgements when deciding whether a dataset has caught up.

Each target has independent checkpoints and error generations. Network failures
retry automatically; permanent SQL/schema/ownership failures pause that target
and retain its original events. Other targets continue until shared journal
capacity/backpressure requires intervention. After correcting a retryable plan
or permission issue, use the console's generation-bound target resume. Resume
retries the original data and never skips it.

Shared pause reports `UNCONFIRMED_IN_FLIGHT_MATERIALIZATION`: it fences the
application journal but cannot retract an HTTP write already running on the
server. A business cutover must establish quiescence and reconciliation first.
Do not infer a transactional target's exact local SQL fence here.

## Operational FAQ

**Why are both metadata and physical data tables present?** The service owns
generation/fingerprint comments, stable object UUIDs, schema records and native
batch receipts. Keep them with the data. They are part of recovery, not disposable
temporary tables. Their retention/compaction and large-catalog capacity work
remain explicit platform backlog.

**Can consumers read only the business view?** The view uses invoker security.
Grant the consumer SELECT on that view and its specific underlying physical data
table, without INSERT/ALTER/DROP. `SHOW CREATE TABLE target_database.table`
identifies the physical dependency. Queries should use the business view's
version/tombstone selection. Credentials, grants and user management remain the
database administrator's responsibility.

**The target restored an older nonempty backup. Can it resume?** Startup checks
the saved native receipt and schema/object identities. Missing or changed
confirmed history raises a rebuild-required error, even if old UUIDs remain.
Retain the journal and investigate the backup boundary. Reconciliation/rebuild
planning is required; deleting receipt rows or creating empty replacement views
does not repair a checkpoint. Arbitrary earlier-row corruption is not proven
absent by checking the latest receipt.

**What if journal storage disappears?** LOCAL requires its original persistent
directory; shared/multi-host operation requires an EXTERNAL transactional
journal. Target rows alone cannot reconstruct keyless identities, capture
positions and all receipts. Restore coordinated metadata or plan a full rebuild;
independent metadata rollback is not an automatic recovery contract.

**Why does a decimal string omit trailing zeros?** ClickHouse formatting can
omit them. Verify the numeric value and declared precision/scale; the native
acceptance checks both, including Decimal(65,30).

**Can I edit schemas, clear tombstones or write target rows?** Synchronization
assumes exclusive service writes. Schema/UUID changes are checked; arbitrary
external DML can invalidate materialization. Preserve tombstones and receipt
history. Live source DDL, nonempty foreign-target adoption, automatic repair and
business takeover remain separate planned workflows.

## Recorded acceptance

`target/clickhouse-native-protocol-decimal.log`: real server typed boundaries,
binary/JSON/NULL, UInt128 version replay, restart identity/history and deletion.
`target/clickhouse-materializer-release.log`: actual release JAR, read-only check,
automatic tables/views, PK move, keyless multiplicity/delete, duplicate replay,
client/server restart and refusal after restoring an older nonempty target.

`target/clickhouse-pipeline-first.log`: 24 executions passed, including a real
MySQL 8.4 → ClickHouse + PostgreSQL release-JAR pipeline with LOCAL H2 journal, JSON/unsigned/decimal/
binary/generated columns, target outage with SQL continuing, automatic catch-up,
worker kill/restart, and missing-view isolation. `target/ui-clickhouse-first.log`:
18 DOM cases passed. These do not establish replicated/cluster/TLS/power-loss,
large-catalog/soak or all-JRE ClickHouse acceptance.

Final compatibility acceptance: `target/clickhouse-index-compat-unit.log`58PASS/0fail/error/skip and `target/ui-clickhouse-index-compat.log`19PASS. `target/clickhouse-index-native-compat.log` actual-release Java8 native acceptance passed explicit NONE create/reopen without indexes plus indexed FINAL/replay/restart/old-volume rollback protection. Omitted config options retain NONE and the old fingerprint; new wizard/example explicitly opt into DATA_SKIPPING. Current artifact144098892bytes SHA25695dbdbb462929ed1a262072e80d1db885696fa53007d5315c38c4d951c193212. Earlier28-pipeline acceptance predates this default-only compatibility adjustment. All own test resources cleaned.
