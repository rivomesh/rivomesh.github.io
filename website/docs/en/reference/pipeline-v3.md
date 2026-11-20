---
kind: docs
locale: en
title: "Multi-database pipelines"
sourcePath: docs/en/pipeline-v3.md
---

# multi-database, multi-target pipelines

This manual covers multi-database, multi-target synchronization. `formatVersion: 3` (V3 in some console labels) identifies the task configuration format, not a database version or development phase. Keep the default for new tasks; changing the number does not migrate an existing task.

中文：[V3 运行手册](/docs/zh/reference/pipeline-v3.html). Updated 2026-11-15. V3 runs through the CLI and Web console. The wizard defaults to v3 and retains v2 single-database tasks. Formats/metadata are isolated; automatic v2 state migration is not implemented.

## Web wizard and recovery

After signing in, create a task:

1. Keep V3 selected, enter the logical source, comma-separated databases, replication serverId and credentials.
2. Map each database explicitly. Add target instances with distinct IDs and their mappings. Select local or external transactional journals and quota. The plan masks every password, including JDBC URL passwords. Saving leaves the task stopped; check before starting.
3. Inspect snapshot/backlog and each subscriber's ACK. “Resume this target” uses its own error generation; global “Resume after repair” uses the pipeline generation. They are distinct operations.
4. Local stop only stops this worker. Shared pause blocks standby claims and attempts target-local fence confirmation. Unreachable targets remain unconfirmed, not falsely declared settled. Global resume does not clear independent target SQL pauses.

Web local journals use the controller's private `journals/<pipelineId>` directory. New YAML omits `journal.path`; imports selecting an existing CLI journal path are rejected until a journal/target migration plan is prepared. Do not delete old state to bypass this check. External journals can be imported directly. Controller restart retains task/pause intent and the same managed journal/checkpoints.

VIEWER/OPERATOR/ADMIN,local accounts/token rotation,exact task grants,configuration editing/history restore and durable audit are implemented. [Managed validation](/docs/en/reference/managed-validation.html) and [report-driven repair](/docs/en/reference/managed-repair.html) have explicit accepted profiles. Transactional PostgreSQL and MySQL have scoped profiles for [commit confirmation](/docs/en/reference/commit-acknowledgement.html), [transaction skipping](/docs/en/reference/transaction-skip.html), [gap verification](/docs/en/reference/gap-verification.html), [compensation](/docs/en/reference/transaction-compensation.html) and [manual correction](/docs/en/reference/manual-correction.html). Configure the corresponding gates in the [first-release baseline](/docs/en/reference/first-release.html). Plan business cutover separately. See [failed transactions](/docs/en/reference/failed-transactions.html) for phase diagnostics and recovery boundaries. DOM and real HTTP/database controls passed;visual and live Kubernetes UI acceptance remain pending.

## Configure and start

Use [pipeline-v3.yml](/files/config/pipeline-v3.yml). List databases within one logical MySQL topology in `databases`. Each target explicitly maps source databases to destination schemas/databases with `mappings`. Targets may subscribe to different subsets; every source database needs at least one target. Transactional products include `GAUSS`, `POSTGRESQL`, and `MYSQL`, plus first experimental [KINGBASE](/docs/en/reference/kingbase-v3.html), [DM](/docs/en/reference/dm-v3.html) and [OCEANBASE](/docs/en/reference/oceanbase-v3.html) profiles within their documented acceptance boundaries; `KAFKA`/`RABBITMQ`/`NATS_JETSTREAM`/`REDIS_STREAMS`/`PULSAR` use the [messaging protocol](/docs/en/reference/messaging-v3.html) and map to message namespaces. Each target owns a delivery thread so stalled I/O cannot block others. MySQL journal/targets must be separate physical instances from the source: `server_uuid` checks reject feedback loops even through address aliases.

```bash
export RIVOMESH_NODE_ID=node-a
export MYSQL_PASSWORD='source-password'
export POSTGRES_PASSWORD='target-password'
export GAUSS_PASSWORD='target-password'
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/pipeline-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/pipeline-v3.yml
```

`check` reads source objects and target connections without initializing state or creating tables. It does not establish all DDL/snapshot privileges. Running creates metadata and missing business tables. Existing tables must match, be empty, and have no foreign keys/triggers. Nonempty targets require a migration plan and are blocked without clearing data.

The synchronizer exclusively writes subscribed business tables. Sources require GTID, ROW/FULL, replica-update logging, no transaction compression/partial JSON images, and no anonymous/tagged GTIDs. Snapshots additionally need permission for short `FLUSH TABLES WITH READ LOCK`: establish the InnoDB read view, verify schema, record GTIDs and open the cursor before releasing the lock. Reading a large table retains its MVCC view and metadata lock; monitor source undo history and waiting DDL.

## Snapshot, CDC and recovery

The UI separates source snapshot preparation from destination delivery. `TARGET_SNAPSHOT` remains active until every subscription has confirmed the current source manifests. “Source snapshot rows” counts source artifacts; each target has its own confirmed-table count. A message confirmation is still not consumer completion. Each completed target table is acknowledged immediately, allowing its source parts to be reclaimed once all targets confirm that table.

Source commits and capture positions are journaled atomically. Each table has an independent snapshot baseline and checksummed parts. Completed artifacts are reusable; an incomplete source snapshot restarts the whole table because a lost MVCC read view cannot resume. Target part checkpoints resume committed parts without duplicates.

Keyless tables preserve every duplicate occurrence using `_rivomesh_row_id`; source columns conflicting with this name are rejected. Complete before images match one occurrence. Identity mutations and normalized events commit once in source order, and every target reuses that result. Slow replay never mutates identities again. JSON comparison ignores object order/numeric scale while preserving SQL NULL versus JSON null.

Stored generated values come from the log. Whitelisted deterministic virtual expressions use versioned expressions and historical logged inputs, never current source rows. Destination columns are ordinary materialized columns. Evaluation pins the snapshot SQL mode and UTC. Unlisted functions, missing base images, or historical schema mismatches stop progress. This does not promise arbitrary client-session SQL-mode query semantics. Plan native generated columns and application writes before takeover.

Each transactional target commits data and its checkpoint together under an epoch fence. Targets acknowledge independently; one paused target does not stop others. An uncertain commit is resolved by checking the destination transaction ID/content hash before acknowledging the journal. Multiple targets are not one distributed atomic transaction. Table snapshots can have different baselines; cross-table takeover requires a common catch-up point. The MySQL+transactional-SQL common-cut Java service passed initial native acceptance; see [Reconciliation foundation](/docs/en/reference/reconciliation-workflow.html). See [managed validation](/docs/en/reference/managed-validation.html) and [reviewed repair](/docs/en/reference/managed-repair.html) for the initial SQL profiles. Business cutover remains open.

Retention follows the slowest subscriber, including paused ones. Snapshot parts are reclaimed only after every target confirms completion; manifests, baselines and keyless identities remain. Losing target metadata after artifact reclamation requires a rebuild plan. `maxBytes` covers logical event, normalized event, snapshot and identity payloads, including unconsumed normalization workspace reservations. Database indexes, WAL, metadata and free pages need additional capacity; reclamation does not immediately shrink physical files. Large-catalog pagination, physical headroom alerts, receipt compaction and oversized-transaction staging remain unfinished. Logical quotas are not total disk quotas.

An open [transaction gap](/docs/en/reference/transaction-skip.html) or a prepared skip pins the exact raw and normalized transaction in the journal. Other fully acknowledged transactions can still be reclaimed. A verified gap releases its pin after the common-cut receipt is checked. If the pinned evidence fills the journal, capture waits without advancing the source position and the Worker records `JOURNAL_BACKPRESSURE`. If capture needs more space to reach a fresh common cut, increase logical capacity before verifying the gap. Verification of an existing valid paused cut does not add event payload to the journal. Keep the original evidence and journal together during recovery.

Raw capture reserves its normalization copy, keyless row IDs and potential identity additions. Normalization consumes that reservation atomically, preventing raw backlog from using the space needed to drain itself. When a slow destination exhausts available capacity, capture waits without advancing unpersisted GTIDs; deliveries, GC and lease heartbeats continue. Recovering consumers free space and capture resumes automatically. Local backpressure does not trigger the source-idle watchdog. Close/pause cancels the blocked receiver before waiting for the dump connection to finish.

If one transaction and workspace exceed the entire quota, `TRANSACTION_EXCEEDS_JOURNAL_QUOTA` preserves the old position. Insufficient snapshot/identity workspace, or old unreserved history that cannot be normalized after upgrade, raises `JOURNAL_WORKSPACE_REQUIRES_QUOTA_PLAN`. Source snapshots are currently all built before delivery; streaming reclamation across a large table, partial snapshot rebasing and oversized-transaction staging are unfinished. Expand capacity or use an explicit plan; never delete journal parts to make room. Quota is excluded from semantic identity: stop affected workers, change/reload configuration, then resume with the current global error generation. See [configuration revisions](/docs/en/reference/configuration-editor.html) for supported console changes.

Use `source.type: MYSQL` in task configuration and the Web wizard. Identify the logical source cluster with `source.clusterId` and select its databases with `databases`. Set `source.expectedVersion: "8.2.0"` to require a patch version or `"8.2"` to accept that major and minor release. Preflight checks the candidate server version. Leaving the field empty enables detection.

## Journal choices

`LOCAL` uses Java-8-compatible H2 2.2.224. `path` is a private directory, relative to the configuration file; it contains sensitive rows and receives mode 0700. Automatic server mode binds to loopback by default so the Worker and CLI can share the same local journal without depending on the host’s external name resolution. It is not a cross-host database service. Preserve the whole directory/volume; do not copy a live `.mv.db` alone. Use `EXTERNAL` for cross-host takeover; shared-filesystem H2 has not been accepted as a cluster journal.

`EXTERNAL` supports PostgreSQL, openGauss or a separate MySQL instance. Workers share journal instance/namespace/pipelineId and target configuration, with distinct nodeIds. Database-clock leases and epochs fence ownership. MySQL storage must use InnoDB and retain acknowledged commits across restart. External HA systems promote/fence database nodes; Rivomesh does not promote them. V3 worker-crash recovery, MySQL 8.4 async promotion and MGR election during snapshot passed; other versions/soak matrices still need acceptance. V2 results do not prove all V3 variants.

### MySQL 8.2.0 source regression

Run `tests/matrix.sh --v3 8.2.0` for the V3 standalone, GTID async and single-primary group replication suites. The tests use Docker Compose, the `mysql:8.2.0` source image and reports under `target/matrix-v3/8.2.0/`. The source uses GTID, ROW binlog and FULL row images. In the async suite, the fixture promotes a caught-up replica and Rivomesh validates the required history before resuming from the original position.

### MySQL 8.4 binlog profile

MySQL 8.4 uses untagged GTIDs, ROW binlogs and FULL row images. Preflight refuses anonymous-capable mode, tagged history, partial JSON and transaction compression. Capture stops before the failing transaction if it sees partial JSON or a compressed event. Review the retained logs and available source history before resuming or building a new baseline.

Use `tests/mysql84-profile-run.sh` to reproduce the admission and live refusal checks. The fixture writes a tagged test transaction in its disposable database and cleans up afterward.

[MySQL GTID format](https://dev.mysql.com/doc/refman/8.4/en/replication-gtids-concepts.html) · [Binary log options](https://dev.mysql.com/doc/refman/8.4/en/replication-options-binary-log.html)

### Automatic continuation after MySQL 8.4 primary failure

Set `source.topology: ASYNC` and supply the primary and replica as candidate `source.nodes` within one GTID replication topology. The external database HA service fences the failed primary and promotes a caught-up replica. Rivomesh verifies the promoted source's available GTID history and reconnects from the saved position. If the replica is still read-only or replication has an I/O error, investigate the topology while retaining the journal and target checkpoints.

The Java 21 native profile used MySQL 8.4.13 asynchronous GTID replication, an external PostgreSQL journal, two management entries and PostgreSQL and MySQL destinations. After the old primary was killed, both entries showed the capture interruption and the two target checkpoints held. External promotion returned a writable source. Rivomesh delivered the new primary's GTID to both destinations with the original configuration revision, journal generation and snapshot IDs. Reproduce with `python3 tests/global-control-pipeline.py --separate-execution --mysql-async-failover --source-expected-version 8.4.13 --artifact <release jar> --output target/mysql-async-proof`. [Verification archive](/docs/en/start/verification.html)

A separate Temurin 21 test runs the same packaged JAR with MySQL 5.7.44, 8.0.46, 8.2.0 and 8.4.13, each with a PostgreSQL 17.12 destination and journal. It terminates the original Worker, induces a real replica SQL-thread error 1032, verifies that the unhealthy replica is refused, restores replication and shuts down the original primary. After external promotion it verifies the original snapshot ID and new target rows. Purging an uncaptured binlog range keeps the prior journal checkpoint and pauses capture. To reproduce after building the release JAR and test classes, run `RIVOMESH_TEST_PREBUILT=1 SYNC_V3_HA_POSTGRES_ONLY=1 SYNC_MYSQL_IMAGE=mysql:8.2.0 bash tests/v3-ha-run.sh`. For 5.7 add `SYNC_MYSQL57=1 SYNC_MYSQL57_IMAGE=mysql:5.7`.

### MySQL 8.4 single-primary Group Replication recovery

Set `source.topology: GROUP_REPLICATION` and list the members of one single-primary group in `source.nodes`. MySQL elects the writable member. Rivomesh checks that the candidate is online and writable and retains the required GTID history. Protect a restarted former primary with MySQL super-read-only until it rejoins. Group Replication requires a primary key or equivalent unique key on replicated tables. [Single-primary mode](https://dev.mysql.com/doc/refman/8.4/en/group-replication-single-primary-mode.html) · [Group Replication requirements](https://dev.mysql.com/doc/refman/8.4/en/group-replication-requirements.html)

The Java 21 native test uses MySQL 8.4.13, an external PostgreSQL journal and a PostgreSQL 17.12 destination. It kills the primary, records a different server UUID and verifies that the same Worker delivers both subsequent transactions. The journal generation, two snapshot IDs and full destination rows agree. The former primary restarts read-only with a missing group GTID. MySQL refuses writes. The released JDBC driver reaches the old member at the unchanged endpoint and verifies its UUID and read-only flags before source preflight returns `SOURCE_NO_PRIMARY`. After it catches up as a secondary, capture continues on the elected primary.

Reproduce with a Java 21 JDK, Docker Compose and local `mysql:8.4` and `postgres:17` images.

```bash
python3 tests/mysql-group-failover-native.py --artifact rivomesh.jar \
  --java "$JAVA_HOME/bin/java" --output target/mysql-group-failover-proof
```

A second Temurin 21 profile runs the same release JAR on MySQL 5.7.44, 8.0.46, 8.2.0 and 8.4.13. It shuts down the original primary while a snapshot is still being built. After MySQL elects a replacement, Rivomesh rebuilds the unfinished snapshot and both SQL destinations receive the pre-election update and subsequent insert, delete and update. Both journal ACKs reach the captured sequence. Reproduce with the prebuilt JAR and compiled tests using `RIVOMESH_TEST_PREBUILT=1 SYNC_V3_GROUP_SQL_TARGETS=1 SYNC_MYSQL_IMAGE=mysql:8.2.0 bash tests/v3-group-run.sh`. For MySQL 5.7 add `SYNC_MYSQL57=1 SYNC_MYSQL57_IMAGE=mysql:5.7`. [Version-specific evidence](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/baseline.json)

### Verified TLS for MySQL capture and delivery

Configure `source.sslMode: VERIFY_IDENTITY` for the binlog channel and include `sslMode=VERIFY_IDENTITY` in `source.jdbcOptions` for discovery and snapshots. Each MySQL target has its own JDBC URL and TLS options. Install the CA roots in the execution JDK trust store available to the Agent and its Worker JVMs. Use the certificate's DNS names in the source candidates and target URLs. The verified binlog modes negotiate through the JDK and can connect to a TLS 1.3-only MySQL endpoint. [Connector/J TLS properties](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html)

On MySQL 8.4.13, the real binlog and target JDBC sessions reported TLS 1.3. Preflight rejected a wrong source DNS name. After process termination the Worker reused the original GTID and snapshot, and the targets matched exactly. Reproduce with `python3 tests/mysql-tls-run.py --java-home <Temurin 21 directory> --artifact <release jar> --output target/mysql-tls-proof`. [Verification archive](/docs/en/start/verification.html)

## Standalone writer transfer with a PostgreSQL journal

For a new standalone MySQL pipeline, set `journal.mode: EXTERNAL`, `journal.product: POSTGRESQL` and `journal.writerAssignment` to a fresh UUID. Use up to eight PostgreSQL/MySQL targets and 256 source tables. Keep the journal, target metadata and source logs accessible on both Workers, and reserve an independent private directory for any report files you generate separately.

```bash
java -jar rivomesh.jar init-writer original.yml
java -jar rivomesh.jar run original.yml
```

`init-writer` creates the initial placement of a new pipeline. An enrolled Worker opens the existing journal on restart. A missing journal or placement requires restoring the original state. The command rejects enrollment on a previously created ordinary journal. Earlier application builds refuse the enrolled journal format.

Wait for the original snapshot and every target acknowledgment to catch up. Stop the original Worker cleanly, or wait for its database-clock lease to expire after a failure. Use `status original.yml` to obtain `generation`, `epoch` and `writerPlacement.assignment`. Create a private candidate configuration with the same pipeline and destination settings, a different `nodeId` if changing hosts, and a fresh `journal.writerAssignment`. Ensure the candidate can read the original source logs and native target metadata.

```bash
java -jar rivomesh.jar transfer-writer candidate.yml "$previous_assignment" "$journal_generation" "$expected_epoch"
java -jar rivomesh.jar run candidate.yml
```

The command verifies GTID history, the original snapshot IDs and target receipts before changing the placement. A live lease, incomplete snapshot, lagging/paused targets, or an unresolved skip intent blocks transfer. If confirmation is lost, repeat the exact original command to recover its durable receipt. A successful transfer keeps the capture position and target acknowledgments. The candidate claims a newer lease. The former configuration cannot claim or renew a lease, and a retired assignment UUID cannot be reused. Use a new UUID for any later transfer, including a move back to the original host. A paused or incomplete job must recover on its currently assigned Worker first.

The cluster console manages Agent assignments separately. This CLI workflow covers the standalone Worker, the existing shared journal and transactional targets. It leaves report files and Agent ownership in their original locations.

## Troubleshooting and FAQ

- **SQL errors:** only that subscriber pauses with an error generation. Repair privileges/schema/data, then resume the original transaction using the current generation from `status`. Resume never skips data or edits GTIDs.
- **Connection loss/deadlocks:** transient errors retry; local destination fencing blocks stale owners. Source reconnect validates candidate GTIDs and snapshot dependencies. Missing logs/multiple writers block or wait without rewinding progress.
- **Journal quota:** CDC backlog uses the backpressure/recovery path above; snapshots or indivisible oversized commits need capacity/error-generation plans. Budget snapshot/identity copies, normalization reservation and the backlog window. Backpressure cannot reconstruct permanently lost storage or source binlogs purged before they were read.
- **Live DDL:** currently blocks safely, including potentially unrelated-database SQL that could reference selected objects. Historical DDL evolution and explicit skip plans are unfinished.
- **UNIQUE(email):** `DOWNGRADE_BUSINESS` creates an ordinary secondary index. Source constraints, exclusive sync writes and transactional/idempotent checkpoints jointly preserve source uniqueness. Validate and restore constraints before application writes. Primary, identity and internal keys are never downgraded.
- **GSI:** business GSI model entries can become ordinary indexes, losing global routing/uniqueness. Identity GSIs require a distribution plan. Existing GSIs/unique constraints are never blindly dropped. Commercial distributed GaussDB is not hardware-validated.
- **Expression/prefix/descending/special indexes:** require a separate plan; the target pauses instead of silently omitting them. Unsupported indexes block before creating a missing table.
- **Types:** common integers/unsigned, decimal/floating point, text/binary, YEAR, DATE/DATETIME/TIMESTAMP and JSON are covered. V3 now implements signed microsecond MySQL TIME durations with matching JDBC snapshot and TIME/TIME2 row-event text. Relational targets use INTERVAL/MySQL TIME(6); analytical/event targets retain duration text. See the [Kingbase guide](/docs/en/reference/kingbase-v3.html) and [DM guide](/docs/en/reference/dm-v3.html) for first native acceptance scope. BIT, ENUM/SET, spatial/zero dates, non-InnoDB and other objects need extension/testing.
- **V2 migration:** continue the old configuration to retain v2 checkpoints. Adding `formatVersion: 3` cannot take over a populated old target. Explicit data/state migration planning remains necessary.

```bash
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar status config/pipeline-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar resume config/pipeline-v3.yml gauss 1
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar pause config/pipeline-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar resume-pipeline config/pipeline-v3.yml 1
```

Replace `1` with the relevant subscriber or pipeline error generation. Stale requests are rejected. Permanent source errors persist as ERROR and block standby claims; pause reports each fence confirmation. RBAC/local accounts/configuration editing/audit are implemented. See [implementation status](/docs/en/reference/implementation-status.html) for scoped recovery.

### LOCAL connection lifetime and controller memory

The controller retains a stable connection to each opened LOCAL journal, including paused/stopped tasks, until configuration replacement or controller shutdown. On restart it opens existing files; inspecting a never-started task does not create its journal. Same-host CLI/certificate/repair operations therefore share a stable H2 automatic-server endpoint.

Each opened journal has a 4 MiB page-cache setting plus schema/index metadata and connection-thread overhead. Worker heaps, control-store connections and IAM/audit state consume additional memory. Docker/Linux/Helm controller defaults now use a 512 MiB maximum heap; Helm exposes `controllerHeapMiB`. Size by initialized LOCAL journal count, schema volume and measured heap use; `maxTasks` limits task count. External transactional journals are available for larger installations.

Optional protocol5 adds administrator evidence creation,raw/normalized pages and typed image review. See [review operations](/docs/en/reference/failure-review.html) for activation/upgrade and deployment profiles. Default legacy profiles do not upgrade automatically. See [implementation status](/docs/en/reference/implementation-status.html) for scoped recovery.
