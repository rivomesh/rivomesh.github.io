---
kind: docs
locale: en
title: Troubleshooting
---

# Troubleshoot a synchronization task

Preserve the error, task identity and persisted state. Fix the cause before retrying; do not reset GTID, checkpoints or queues to bypass an error.

| Symptom | First checks |
| --- | --- |
| Console unavailable | Service startup logs, bind/port, token/session configuration, HTTPS proxy |
| Source connection fails | Container/network address, credentials, GTID, replication privileges and required logs |
| Target SQL pause | Exact SQL error, privileges, type mapping, table structure and target identity |
| Backlog grows | Slowest target, independent target errors, journal quota and disk headroom |
| Source waits after failover | Candidate topology, writable role, required executed/purged GTID history |
| Global command pending/unknown | Original request receipt, owner availability, control database and matching private directory/key |

Temporary connectivity, locking and serialization errors may retry under policy. Deterministic SQL/type/DDL errors need intervention. Recovery retries the original transaction; it does not skip records.

If logs or state are lost, restore a coordinated backup or create an explicit rebuild plan. Never delete controller or journal state and reuse a nonempty target as if it were a new task.

[Recovery rules](../reference/recovery) · [Backup and restore](backup) · [Global control](../reference/global-control) · [Report an issue](/en/community.html)

## Review a persisted transaction failure

For supported transactional PostgreSQL/MySQL profiles, an administrator can retain and inspect [failure evidence](../reference/failure-review), check [whether the destination already committed](../reference/commit-acknowledgement), and then choose [before-image compensation](../reference/transaction-compensation) or [typed row corrections](../reference/manual-correction). These paths require a whole-task pause, a confirmed destination fence and fresh evidence. Approval keeps the task paused. After checking the result, explicitly resume delivery of the original transaction.

[Whole-transaction skip](../reference/transaction-skip) is a separate approval that records a durable data gap. [Gap verification](../reference/gap-verification) reviews equality at a common historical cut. It preserves skip history and the contiguous applied watermark. See the [first-release gates](../reference/first-release) before enabling these controls.
