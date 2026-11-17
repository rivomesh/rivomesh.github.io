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
