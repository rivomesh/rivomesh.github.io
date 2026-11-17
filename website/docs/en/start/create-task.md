---
kind: docs
locale: en
title: Create a synchronization task
---

# Create your first synchronization task

This walkthrough uses **MySQL → PostgreSQL**, a small source and an independent empty target. Additional destinations have their own [connector profiles](connectors).

## Prepare connection details

For MySQL, collect host, port, databases, credentials and a unique replication client `serverId`. It must differ from database node IDs and other replication clients. For the target, collect host, port, database/schema, credentials and the intended source-to-target mappings.

The source must meet snapshot and replication requirements. Target business tables must be empty and exclusively written by this task.

## Configure and check

1. Choose **Create task** and keep the default multi-database, multi-target format.
2. Assign stable task and logical source identities, then enter MySQL details.
3. Add one PostgreSQL target and explicit mappings for each source database.
4. Select a persistent journal. Local storage is suitable for same-host trials; cross-host continuation requires the external journal profile.
5. Save, check connections and objects, then start. A check does not validate every runtime or snapshot privilege.

A saved task remains stopped until started. In optional global mode, choose the actual execution node; an accepted command is not evidence that execution has finished. See [global control](../reference/global-control).

## Validate the first run

Watch snapshot, catch-up and target delivery. Insert, update and delete a test row and compare actual destination values. Restart the worker and confirm it continues from its persisted state. Keep task identity, journals and target state for recovery.

[Monitoring](monitoring) · [Troubleshooting](troubleshooting) · [Pipeline reference](../reference/pipeline-v3)
