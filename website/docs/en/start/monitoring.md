---
kind: docs
locale: en
title: Progress and daily operations
---

# Read progress and operate tasks

Check both the synchronization phase and each target's confirmed position. A running process does not mean all destinations are caught up.

| State | Meaning |
| --- | --- |
| Snapshot | Existing data is being read/prepared or delivered; target data may be incomplete |
| Streaming | Incremental changes are being handled; lag can still exist |
| Target paused | Inspect that target's error and repair the cause before retrying |
| Shared pipeline paused | Standby claims are blocked; inspect target isolation confirmation |
| Local worker stopped | Only this machine's process is stopped; inspect shared state separately |
| UNKNOWN in global mode | The owner or reliable receipt is unavailable; do not infer success or a stopped process |

## Daily checks

Watch phase, backlog trends, per-target acknowledgements, SQL errors, connectivity, disk space and source binlog retention. The slowest destination determines retained journal history; a healthy fast target cannot free another target's unacknowledged events.

## Stop, pause or recover

- **Stop local worker** stops only the local process.
- **Pause shared pipeline** blocks ordinary standby claims; unreachable targets still need isolation verification.
- **Resume this target** retries that target's original transaction after its error is fixed.
- **Resume after repair** handles the pipeline-level error; it does not silently clear independent target pauses.

Optional fixed-owner global mode routes commands to the execution owner. HTTP 202 means accepted, not finished; inspect the original command receipt. An offline STOP waits until the original owner can recover it.

Administrators can review configuration history and restore versions according to identity/state restrictions. [Configuration revisions](../reference/configuration-editor) · [Global control](../reference/global-control) · [Backup](backup)
