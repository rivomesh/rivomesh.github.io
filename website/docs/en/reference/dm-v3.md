---
kind: docs
locale: en
title: "达梦 DM"
sourcePath: docs/en/dm-v3.md
---

# DM destination and FAQ

中文：[达梦 V3](/docs/zh/reference/dm-v3.html). Example: [dm-v3.yml](/files/config/dm-v3.yml).

## Scope and instance requirements

`product: DM` is wired into V3 configuration, CLI, bilingual wizard, independent transactional destinations and type plans. Availability remains **EXPERIMENTAL**. The first DM8.1.4.80 ARM64/vendor Java8 JDBC8.1.3.140 native transaction and actual MySQL8.4.13+PostgreSQL17.12 snapshot/CDC/outage/catchup/worker-kill/separate-SQL-repair/missing-table isolation profile passed; see [evidence](/docs/zh/evidence/baseline.html). Empty-layout guards, text-key case/trailing spaces and four-byte Unicode also passed. PostgreSQL-protocol results do not prove DM support.

Use `dm.jdbc.driver.DmDriver`, `jdbc:dm://host:5236`, and pinned Maven Central `com.dameng:DmJdbcDriver18:8.1.3.140`. The vendor POM declares Apache-2.0; full distribution license/NOTICE review remains pending. Database installation packages/licenses are not distributed with Rivomesh.

The first profile requires COMPATIBLE_MODE=0, UNICODE_FLAG=1(UTF8), CASE_SENSITIVE=1, BLANK_PAD_MODE=1, NORMAL/PRIMARY and OPEN instance state, and IMMEDIATE/BATCH,WAIT COMMIT_WRITE. Each physical connection verifies vendor/version, instance role and these conditions, sets session UTC and checks empty strings remain distinct from NULL. It never changes global parameters or promotes a replica. WAIT is local log-flush durability, not a substitute for storage, replication or fencing policy.

Encoding/blank-padding are initialization choices. They protect quoted identifiers, VARCHAR primary keys and trailing-space identities from merging. Other mode/parameter combinations need separate adaptation. Have the DBA assess existing instances and migration/provisioning; do not disguise them as PostgreSQL or reset checkpoints to bypass checks.

## Configuration and operation

Provision the instance and account first. The destination needs mapped-schema/table/index creation, business/checkpoint read/write and directory/instance/parameter read permissions. Apply least privilege in production rather than copying fixture SYSDBA. A successful connection check does not prove every DDL/DML privilege.

Each MySQL database maps explicitly to a DM schema; PostgreSQL, messaging and other targets may run independently in the same pipeline. Source GTID/ROW/FULL requirements are in the [V3 handbook](/docs/en/reference/pipeline-v3.html). Use `MYSQL_PASSWORD`/`DM_PASSWORD` environment references or protected configuration.

```bash
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/dm-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/dm-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar status config/dm-v3.yml
```

`check` returns `dmStoragePlans`. JSON and precision>38decimals require `dm.acknowledgeTextConversions: true`; the wizard explains and requires this acknowledgement. Advanced configurations containing only native types may keep the default false. Acknowledgement does not change layout identity or permit pretending an existing layout is another type.

Linux, Docker, Helm and native Kubernetes share the task document; manifests do not deploy DM itself. V2 and the DM Journal backend are not enabled. `journal.product: DM` is rejected. LOCAL Journal supports same-host recovery; cross-host workers use supported external PostgreSQL/openGauss/MySQL journals.

## Types and indexes

| Source model | First DM mapping |
|---|---|
| BOOLEAN / INT64 / UINT64 | BIT / BIGINT / DECIMAL(20,0) |
| DECIMAL precision≤38 | Declared precision/scale |
| DECIMAL precision>38 | VARCHAR(precision+3), lossless decimal text at source scale; acknowledgement required |
| JSON | CLOB preserving JSON text/numeric precision; acknowledgement required, not native JSONB |
| STRING | Bounded VARCHAR(n CHAR), large text CLOB |
| Bounded binary / large binary | VARBINARY / BLOB |
| DATE / DATETIME / TIMESTAMP | DATE / TIMESTAMP(6) |
| MySQL TIME | INTERVAL DAY(2) TO SECOND(6), preserving sign/microseconds/over24hours |

Wide decimal text preserves values, not native numeric ordering/comparison/aggregation. Review SQL/types before takeover. JSON text is not equivalent to every vendor JSON type/version. Supported generated expressions follow source support and become ordinary columns. Keyless tables retain `_rivomesh_row_id` and duplicate multiplicity.

Business UNIQUE defaults to ordinary indexes under valid source constraints, complete ordered replication and exclusive synchronization writes. Primary/actual identity keys remain. Simple business GSI can become ordinary indexes, losing global routing/uniqueness. Prefix/expression/descending/fulltext/spatial indexes need plans. CLOB/BLOB indexes cannot be silently copied: DM_LOB_INDEX_REQUIRES_PLAN. Existing UNIQUE is never automatically dropped. Arbitrary nonempty adoption, procedures/triggers/foreign keys/partitioning and full DDL evolution still need migration workflows.

## Transactions, failures and FAQ

Business changes and the destination checkpoint commit in one DML transaction, using metadata row locks and increasing epochs to fence old workers. DM DDL may auto-commit; preparation reacquires the fence and never inserts DDL into the business transaction. Targets acknowledge independently rather than using a global atomic commit.

- **Network/instance outage:** recognized transient connection errors back off/reconnect; other sinks continue until journal backpressure. Database operations promote/route primaries. Full primary/replica cluster acceptance is separate.
- **SQL failure:** only that subscription pauses. Repair permissions/constraints/types, then resume in the UI or with `resume config/dm-v3.yml dm-business <errorGeneration>` using the current status and the same JAR prefix. Original transactions retry; restart does not skip failures or bypass a pause.
- **Missing table/owner/checkpoint:** refuses an empty replacement under old progress. Preserve evidence and plan a rebuild/reconciliation.
- **Precision overflow:** do not force65digits into38. Review the lossless text plan and business SQL, acknowledge, then recheck.
- **Character capacity:** VARCHAR may default to bytes. Existing layouts check ALL_TAB_COLUMNS CHAR_USED/CHAR_LENGTH/DATA_LENGTH; byte-based VARCHAR must have worst-case four-byte UTF8 capacity. Binary width is checked and intervals need at least DAY(2)/SECOND(6). Character semantics, large values and page/row limits still need assessment; identical length numbers alone do not prove compatibility.
- **Case/empty-string/trailing-space differences:** check actual initialization/compatibility parameters. Existing custom column rules require separate assessment.
- **Existing rows/extra constraints:** never overwrites rows or silently removes constraints. Normal resume is not the full adoption tool. Reconciliation/repair/cutover workbench remains pending.
- **Trial expiry:** supply a lawfully licensed vendor build. Initialization may report trial limits; no license files/checks are bypassed or modified.

Run `bash tests/dm-pipeline-run.sh` with a locally supplied lawful image, or override `RIVOMESH_DM_IMAGE` for the same-layout build. The test creates an isolated project and removes only its own containers/volumes, without privileged mode/host parameter changes. Different images/versions require acceptance; fixture resource limits are not hardware capacity standards.

Official references: [JDBC](https://eco.dameng.com/document/dm/zh-cn/pm/jdbc-rogramming-guide.html), [initialization](https://eco.dameng.com/document/dm/zh-cn/pm/dminit-parameters), [SQL definitions](https://eco.dameng.com/document/dm/zh-cn/pm/definition-statement.html), [storage/commit settings](https://eco.dameng.com/document/dm/zh-cn/pm/physical-storage).
