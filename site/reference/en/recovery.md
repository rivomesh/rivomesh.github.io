---
sourcePath: docs/en/recovery.md
---

# V2 recovery, primary failover and consistency

中文：[恢复、主库切换与一致性](/reference/recovery.html). This document describes the **v2 single-database, single-target core**. V3 uses MVCC snapshot artifacts, a separate journal and independent destinations: follow the [V3 manual](/reference/en/pipeline-v3.html) and [message contract](/reference/en/messaging-v3.html). V2 state cannot be adopted simply by setting `formatVersion: 3`.

## Service ownership

Processes create v2 metadata idempotently, handling concurrent catalog creation separately. Initial task configuration and discovered-table manifests are inserted atomically. Conditional updates claim the owner and lease; a separate heartbeat renews the lease, and data/progress transactions check the same owner. Each new work session uses a new owner identity so callbacks from an older replication connection cannot commit into the new session.

The task-row lock serializes capture, snapshot and application commits. After ownership transfers, the old owner is rejected before business writes and cannot pause or release the new owner's task. Standby nodes do not open binlog connections; a healthy task normally has one replication client.

## Persistent GTID state

- `capture_gtid`: the initial baseline plus committed source transactions durably queued or irrelevant to the selected business database.
- `required_gtid`: the union of captured transactions and the GTIDs required by source state already read during snapshot/discovery.
- `applied_sequence`: the queued transaction sequence already applied to business tables.

Physical UUIDs and file positions support diagnostics and backend validation; cross-server recovery uses GTIDs. A complete source commit is persisted before adding its GTID to `capture_gtid`. The connector's possibly earlier in-memory GTID is never copied directly over persistent progress. Duplicate GTIDs are checked under the task lock and do not enqueue the same durable transaction twice.

## Primary failover during a snapshot

After recording baseline B0, capture FULL row images while scanning by primary-key cursor. Every chunk records a source GTID watermark after reading; its business rows, last key and read dependency commit together. Discovery and initial scan-upper-bound reads also contribute to `required_gtid`.

A snapshot may have read a transaction from the former primary before the capture connection persisted it. Validating only `capture_gtid` would miss that dependency. A failover candidate must therefore include `required_gtid`.

After all chunks complete, record B1, wait until `capture_gtid` includes B1, then replay the queue in source commit order. The scan imports unchanged rows; the final full row image or DELETE establishes the result for changed rows. Primary-key changes remove the old key and write the new key. Logs cover inserts before the scan cursor and beyond the initial upper bound.

During snapshot and early replay, the target is not a consistent image of one source instant. During continuous incremental application, every source transaction, including cross-table changes, is applied in one destination transaction. This v2 cursor approach differs from v3's restart/rebase of an incomplete MVCC snapshot.

## Primary discovery and selection

1. Probe candidate addresses for UUID, server_id, read-only state, GTID mode, executed/purged sets and replication health.
2. In ordinary primary/replica topologies, select only a writable node without active upstream threads or residual replication errors.
3. For Group Replication, require ONLINE, PRIMARY, writable and single-primary mode.
4. Multiple writable primaries require external isolation; the service does not arbitrarily choose one.
5. Require `required_gtid ⊆ candidate.gtid_executed`; otherwise wait for catch-up.
6. Require `candidate.gtid_purged ⊆ capture_gtid`; otherwise necessary uncaptured history may already be unavailable, so block progress.
7. Reconnect with persistent GTID auto-positioning. Automatic fallback to the purged set is disabled.

JDBC queries validate physical UUID and writability; the replication connection validates its handshake server_id before processing events. If a router/VIP sends these connections to different backends, abandon the session and rediscover. Heartbeat expiry, disconnection or source role changes also establish a new session from persistent GTIDs.

Operators must ensure candidates belong to the same logical topology, replicate all selected data, and have no filtering or forged GTIDs. Equal GTID sets cannot detect every manual data modification. CDC cannot reconstruct permanently lost asynchronous transactions that never reached a surviving candidate. Rivomesh does not promote MySQL nodes.

## Transaction boundaries

| Operation | Contents committed in one destination transaction |
|---|---|
| Create task | Configuration fingerprint, B0, table manifest, scan upper bounds and discovery watermark |
| Snapshot chunk | Business rows, cursor, row count, completion state and read-dependency GTIDs |
| Capture commit | Complete ordered row events, origin, GTID, capture/required sets |
| Apply commit | All row changes, applied_sequence, phase changes and queue deletion |
| Record failure | Error history, shared run_state, safe context and owner release |

An uncertain commit ends the current work session. The new session rereads persistent progress instead of reusing an old in-memory cursor/GTID. Business tables, queues and state tables must be backed up/restored as one recovery unit.

## SQL errors and shared pause

Connection/serialization SQL states 08/40, lock waits and recoverable resource failures retry with backoff. Data, constraints, permissions and syntax errors pause. Safe error context includes table, source GTID, queued transaction sequence, SQLState and vendor code; row payloads and SQL literals are excluded.

A failed destination transaction rolls back completely and retains the queue head. Capture may already have safely persisted later commits; application does not pass the failed transaction. PAUSED is shared database state: restarting or adding standby processes cannot bypass it. Repair the cause, then resume the original transaction. Resume does not skip rows, alter GTIDs or empty queues.

Database operators repair source replication SQL errors. The service does not execute SQL_SLAVE_SKIP_COUNTER, inject empty GTIDs or RESET. A failed replica does not interrupt capture from a healthy primary; promotion of that unhealthy replica is rejected until repaired and caught up.

V1 file-position tasks lack complete GTIDs and read dependencies. Automatic in-place upgrade is refused and old state is preserved. Consult [validation](/reference/en/validation.html) for accepted versions and fault profiles; manual repair/skip, v2-to-v3 migration and automated business cutover remain unfinished.
