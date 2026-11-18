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

Raw capture reserves its normalization copy, keyless row IDs and potential identity additions. Normalization consumes that reservation atomically, preventing raw backlog from using the space needed to drain itself. When a slow destination exhausts available capacity, capture waits without advancing unpersisted GTIDs; deliveries, GC and lease heartbeats continue. Recovering consumers free space and capture resumes automatically. Local backpressure does not trigger the source-idle watchdog. Close/pause cancels the blocked receiver before waiting for the dump connection to finish.

If one transaction and workspace exceed the entire quota, `TRANSACTION_EXCEEDS_JOURNAL_QUOTA` preserves the old position. Insufficient snapshot/identity workspace, or old unreserved history that cannot be normalized after upgrade, raises `JOURNAL_WORKSPACE_REQUIRES_QUOTA_PLAN`. Source snapshots are currently all built before delivery; streaming reclamation across a large table, partial snapshot rebasing and oversized-transaction staging are unfinished. Expand capacity or use an explicit plan; never delete journal parts to make room. Quota is excluded from semantic identity: stop affected workers, change/reload configuration, then resume with the current global error generation. See [configuration revisions](/docs/en/reference/configuration-editor.html) for supported console changes.

## Journal choices

`LOCAL` uses Java-8-compatible H2 2.2.224. `path` is a private directory, relative to the configuration file; it contains sensitive rows and receives mode 0700. Automatic server mode allows same-host CLI status/resume. It is not a cross-host database service. Preserve the whole directory/volume; do not copy a live `.mv.db` alone. Use `EXTERNAL` for cross-host takeover; shared-filesystem H2 has not been accepted as a cluster journal.

`EXTERNAL` supports PostgreSQL, openGauss or a separate MySQL instance. Workers share journal instance/namespace/pipelineId and target configuration, with distinct nodeIds. Database-clock leases and epochs fence ownership. MySQL storage must use InnoDB and retain acknowledged commits across restart. External HA systems promote/fence database nodes; Rivomesh does not promote them. V3 worker-crash recovery, MySQL 8.4 async promotion and MGR election during snapshot passed; other versions/soak matrices still need acceptance. V2 results do not prove all V3 variants.

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
