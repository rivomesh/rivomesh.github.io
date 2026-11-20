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

## Review a capture failure

Open the capture recovery review on the task's failure card. Verify the original checkpoint, source admission and affected destinations. If logs are missing, preserve the journal, coordinates and available source logs. Check GTID and binlog for MySQL, the logical slot, timeline and WAL for PostgreSQL, or the original source identity, SCN and archive coverage for Oracle. If the original checkpoint cannot be recovered, review a replacement baseline and affected destinations.

The documented MySQL profile can verify and retain the original binlog transaction. Separate administrator approval can exclude one verified source transaction. The task remains paused, with a recorded gap for its affected destinations. See [capture recovery](../reference/capture-recovery).

## Review the preceding destination commit

The Kafka notice profile enrolls the business Topic UUID before first send. It requires Kafka 4.1 or later with transaction version 2 finalized and Produce v13. Pause the task, review the preceding acknowledgment, and approve the notice for the exact failure. Check sender prerequisites and the control Topic before dispatch. If the response is lost, reuse the request ID to resolve the native receipt. The notice leaves the failed transaction and consumer offsets at their original positions. See [messaging targets](../reference/messaging-v3).

ClickHouse, Doris, Hive, ActiveMQ Artemis, ActiveMQ Classic, RocketMQ, Redis Streams, NATS JetStream and Pulsar have scoped read-only predecessor receipt checks. Pause the task and select **Check destination receipt** on the failed subscription. Keep the complete failed incremental transaction, the preceding acknowledged commit, the original destination and the matching error generation. A match verifies the previous commit. Resolve the failed transaction separately. Classic can still resume an existing task with older receipts. Its next confirmed COMMIT provides the digest required for exact review. Redis Streams reads the saved entry ID, JetStream checks the original stream identity and sequence, and Pulsar reads the saved ledger entry. Keep those records available through review. RabbitMQ relies on retained consumer evidence after acknowledgement. [Console, API and CLI receipt review](../reference/failed-transactions)
