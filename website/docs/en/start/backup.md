---
kind: docs
locale: en
title: Backup and recovery
---

# Preserve state for recovery

A recovery plan must retain task configuration and identity, journal events/checkpoints, target business and management state, and the controller's private data. Keep source binlogs long enough for the outage and catch-up window.

## Back up together

- Controller state, account/audit data, configuration history, reports and task-specific keys.
- Local journal directories or external journal storage, including snapshot artifacts and unacknowledged events.
- Target business tables and their atomic checkpoint/receipt state.
- Shared control database and original node directories/keys when shared or global mode is enabled.

Choose a coordinated backup/restore plan. Restoring a checkpoint alone cannot reconstruct already removed events, and an old consistent backup can reintroduce old permissions that need review.

## Rehearse recovery

Stop according to the operation plan, preserve directories/volumes, reopen the original identities and verify snapshot/CDC content and target acknowledgements. For global mode, inspect the original command/report receipt and restore the fixed owner's matching directory and key. An empty directory cannot impersonate that owner.

Cross-host synchronization continuation uses the external journal profile. Source database promotion, worker journal ownership and global controller relocation are separate concerns. Explicit separated controller/Agent deployment has its own initial acceptance profile. Automatic owner relocation and the full HA matrix remain open.

[Multi-node guide](multi-node) · [Pipeline journal requirements](../reference/pipeline-v3) · [Recovery reference](../reference/recovery)
