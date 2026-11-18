---
kind: docs
locale: en
title: "金仓 Kingbase"
sourcePath: docs/en/kingbase-v3.md
---

# Kingbase destination and FAQ

中文：[金仓 V3](/docs/zh/reference/kingbase-v3.html). Example: [kingbase-v3.yml](/files/config/kingbase-v3.yml).

## Scope and connection

V3 configuration, CLI, explicit mappings, independent fan-out workers and the bilingual wizard accept `product: KINGBASE`. The first profile targets **PG compatibility mode** and remains **EXPERIMENTAL**. The first Java8/Kingbase V009R001C001B0025 PG/UTF8 native transaction and MySQL8.4.13+PostgreSQL17.12 mixed recovery profile passed; see [evidence](/docs/zh/evidence/baseline.html). Existing PostgreSQL results do not prove Kingbase compatibility. Other modes, RAC/distributed products, all versions and capacity remain pending.

The pinned Java8 driver is `cn.com.kingbase:kingbase8:9.0.1`, with `com.kingbase8.Driver` and `jdbc:kingbase8://`, normally port54321. The vendor namespace coexists with PostgreSQL. Maven Central's vendor POM declares Apache-2.0; a complete distribution license/NOTICE review is still required.

Every physical sink connection checks the actual product, `version()`, `SHOW database_mode`, UTF8 encoding, empty-string preservation, case/trailing-space comparisons and writability before metadata access. It sets UTC, standard strings and `synchronous_commit=on`. Only `pg` passes. The service never changes compatibility mode, global settings or database roles. Local synchronous commit still requires reliable server storage and suitable replication configuration; it does not prove multi-node failover durability.

Have the DBA provision a UTF8 database, account and writable endpoint first. Each MySQL database explicitly maps to a schema within that Kingbase database. Rivomesh may create mapped schemas/tables/indexes and its metadata, but does not install the database or provision accounts. Provide metadata access and relevant schema/table/index creation plus business/checkpoint read/write privileges. A connection check does not prove all DDL/DML privileges.

```bash
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/kingbase-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/kingbase-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar status config/kingbase-v3.yml
```

Use `MYSQL_PASSWORD`/`KINGBASE_PASSWORD` environment references or protected configuration. In the UI choose V3 and KingbaseES(PG), then explicit mappings. V2 does not enable this adapter. Linux, Docker, Helm and native Kubernetes use the same task document; deployment manifests do not deploy Kingbase.

## Data, indexes and recovery

Business changes and the destination checkpoint commit in one local transaction, with metadata row locks and epoch fencing. An uncertain commit is resolved by rereading the destination checkpoint. Other targets acknowledge independently; this is not a distributed atomic commit. LOCAL Journal supports same-host recovery; cross-host worker takeover requires an already-supported external PostgreSQL/openGauss/MySQL journal. An unverified Kingbase journal backend is explicitly rejected.

Keyless tables gain `_rivomesh_row_id` to retain duplicate multiplicity. Supported generated expressions follow source-adapter support and their values become ordinary destination columns. UINT64 uses DECIMAL(20,0), decimals retain declared precision, JSON uses JSONB, binary uses BYTEA, microsecond times use TIMESTAMP(6), and signed/over24hour MySQL durations use INTERVAL. Procedures, triggers, foreign keys, partition layouts and arbitrary generated expressions are not automatically reproduced.

`DOWNGRADE_BUSINESS` turns business UNIQUE into ordinary indexes; primary/actual identity keys remain unique. Plain BTREE/simple business GSI can use the ordinary-index plan, losing global routing/global uniqueness. Expression, prefix, descending, fulltext and spatial methods require a separate plan. Downgrading assumes valid source constraints, complete ordered replication and exclusive synchronization writes. Reconcile and rebuild required constraints before takeover. Existing UNIQUE constraints are never silently dropped. Nonempty/incompatible targets require an adoption plan; the complete automated takeover workflow remains pending.

Transient connection failures back off and reconnect; other sinks continue until journal backpressure applies. Deterministic SQL failures pause only that subscription. Repair the cause, then resume in the UI or with `resume config/kingbase-v3.yml kingbase-business <errorGeneration>` using the current status value and the same `java -jar ...` prefix. This retries the original transaction. Restart does not skip a pause. Missing tables/ownership/checkpoints refuse reuse of old progress; normal resume cannot repair lost data.

## TIME and native acceptance scope

MySQL TIME is a signed duration, not a java.sql.Time/LocalTime wall clock. V3 snapshots and binlog events normalize it as `[-]HH:MM:SS.ffffff`. The pinned0.30.3 SDK uses duration overrides for ordinary/extended INSERT, UPDATE and DELETE row events; other fields retain its existing codecs. Native tests cover TIME2 precision0..6, negative fractions, over24hours and keyless identity. V2's accepted type range is unchanged.

The real pipeline compares integer microseconds for positive/negative25hours, every fractional precision and negative1microsecond. Boundaries/malformed binary have unit coverage. Source reference SQL uses `TIMESTAMPDIFF(MICROSECOND,...,ADDTIME(...))`; this environment's integer TIME_TO_SEC result and default four-place SQL division are unsuitable microsecond oracles. This Kingbase version returns float8 from EXTRACT(EPOCH), so readback first casts to NUMERIC(20,6), then compares integer microseconds. A generic duration-text mapping does not imply native TIME acceptance for every other adapter.

The same actual release also passed cross-schema business/checkpoint rollback, replay, alias ownership, old-epoch refusal, writable checks, PostgreSQL masquerade refusal, snapshot/CDC, target outage while PostgreSQL continues and subsequent catchup, worker SIGKILL preserving generation/snapshot, separate SQL constraint repair/retry on both targets, persistent SQL pause through restart, missing-table isolation and final transactional fences. Other versions/modes, primary/replica clusters/routing, TLS, other JDKs, old nonempty physical backup restore, power loss, soak and hardware capacity remain pending. Existing custom column collations and application takeover require separate assessment.

## FAQ

- **Other compatibility modes?** They need separate semantics, catalog/type adaptation and native acceptance. Changing an existing instance's mode is not an automatic compatibility fix.
- **Product/mode mismatch?** Check the actual endpoint and `SHOW database_mode`. Do not disguise it as a PostgreSQL target to bypass validation.
- **SQL_ASCII or other encoding?** Older vendor images may initialize SQL_ASCII. Have the DBA provision a UTF8 database or migrate encoding, then recheck; Rivomesh does not rewrite database encoding in place.
- **Read-only endpoint?** A retryable connection error waits for a writable primary. Database operations perform promotion and endpoint routing; do not reset checkpoints.
- **String comparison rejected?** Check case/trailing-space settings. This profile requires distinct comparisons and never changes global comparison rules.
- **Existing rows/constraints?** Use an explicit adoption plan. Do not clear metadata or drop constraints to continue an old task.
- **Concurrent business writes?** The downgrade profile requires exclusive synchronization writes. Bidirectional conflict handling and the takeover workbench remain pending.
- **Database installation/license?** Supply a properly licensed vendor build for the architecture. Rivomesh does not distribute database binaries/licenses or bypass authorization. Test containers do not require privileged mode.

## Reproducible native fixture and references

With a lawful compatible image available, run `bash tests/kingbase-pipeline-run.sh`; override `RIVOMESH_KINGBASE_IMAGE` for the same-layout build. The test uses actual release-JAR workers with isolated MySQL8.4/PostgreSQL17/Kingbase services and removes only its own project/volumes. Initialization explicitly selects PG/UTF8 without case-insensitive initialization, running the native server as the image's kingbase user, without sudo/systemd/privileged. Different image layouts require fixture changes; replacing a version tag alone is not acceptance.

- [Official JDBC guide](https://docs.kingbase.com.cn/cn/KES-V9R1C10/quick_start/access_tool/java/jdbc/)
- [Official Docker guide](https://help.kingbase.com.cn/v8/install-updata/install-docker/install-docker-1.html)
- [Official parameter guide](https://help.kingbase.com.cn/v8/faq/faq-new/parameter.html)
- [Pinned JDBC POM](https://repo.maven.apache.org/maven2/cn/com/kingbase/kingbase8/9.0.1/kingbase8-9.0.1.pom)
