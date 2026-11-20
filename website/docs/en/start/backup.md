---
kind: docs
locale: en
title: Backup and recovery
---

# Preserve state for recovery

A recovery plan must retain task configuration and identity, journal events and checkpoints, destination business and management state, and private Controller and Agent data. Retain the source logs through the outage and catch-up window. Keep the MySQL binlog and GTID, the PostgreSQL slot, WAL and LSN, or the Oracle archives and SCN for the saved cut.

## Back up together

- Controller state, account/audit data, configuration history, reports and task-specific keys.
- Local journal directories or external journal storage, including snapshot artifacts and unacknowledged events.
- Target business tables and their atomic checkpoint/receipt state.
- Shared control database and original node directories/keys when shared or global mode is enabled.

Choose a coordinated backup/restore plan. Restoring a checkpoint alone cannot reconstruct already removed events, and an old consistent backup can reintroduce old permissions that need review.

Stop the task and close all connections before copying an H2 journal. For separated deployments, also preserve original Agent directory identity, keys, receipts and private evidence. See [first-release operations](../reference/first-release) and [capture recovery](../reference/capture-recovery).

## Rehearse recovery

Stop according to the operation plan, preserve directories/volumes, reopen the original identities and verify snapshot/CDC content and target acknowledgements. For global mode, inspect the original command/report receipt and restore the fixed owner's matching directory and key. An empty directory cannot impersonate that owner.

Cross-host continuation uses an external journal. For a global task, use the documented handoff if its original writer was durably frozen before the Agent became unavailable. Otherwise recover the original Agent and its private state. Treat database source promotion and Worker ownership as separate operations.

[Multi-node guide](multi-node) · [Pipeline journal requirements](../reference/pipeline-v3) · [Recovery reference](../reference/recovery)
