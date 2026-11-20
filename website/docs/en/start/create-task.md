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

<ScreenshotPreview name="task-wizard" locale="en" alt="Pipeline wizard in the RivoMesh English-language console." />

1. Choose **Create task** and keep the default multi-database, multi-target format.
2. Assign stable task and logical source identities, then enter MySQL details.
3. Add one PostgreSQL target and explicit mappings for each source database.
4. Select a persistent journal. Local storage is suitable for same-host trials; cross-host continuation requires the external journal profile.
5. Save, check connections and objects, then start. A check does not validate every runtime or snapshot privilege.

A saved task remains stopped until started. In optional global mode, select an Agent or use automatic placement on an [eligible profile](multi-node#assign-a-new-task-automatically). Check the original command receipt for the execution outcome.

## Validate the first run

Watch snapshot, catch-up and target delivery. Insert, update and delete a test row and compare actual destination values. Restart the worker and confirm it continues from its persisted state. Keep task identity, journals and target state for recovery.

[Monitoring](monitoring) · [Troubleshooting](troubleshooting) · [Pipeline reference](../reference/pipeline-v3)

See [MySQL capture mechanics](replication#mysql) for the transition from snapshot to CDC and the position used after restart. The [architecture diagram](architecture) shows the responsibilities of each node and store.

## Configure another capture source

- **PostgreSQL 17/18.** Select PostgreSQL in the V3 wizard. Enter one database, the source schemas, publication and slot prefix. Prepare explicit publication tables with `REPLICA IDENTITY FULL`, set `wal_level=logical`, and allow for slot capacity and WAL retention. Choose a MySQL or PostgreSQL destination and run the check on the owning Agent. See [logical capture configuration](../reference/postgresql-source).
- **Oracle 26ai Free.** Select Oracle in the V3 wizard. Enter the CDB-root and writable PDB services, PDB name and uppercase `OWNER.TABLE` entries. Map each owner to a PostgreSQL schema. Supply Oracle JDBC to the runtime that launches the Worker and check Flashback privileges, all-column supplemental logging and archive coverage. See [archived capture configuration](../reference/oracle-source).

For details, see [PostgreSQL slots, WAL and LSNs](replication#postgresql) and [Oracle snapshots, archives and SCNs](replication#oracle).

## Evaluate a populated PostgreSQL target

If MySQL data was already copied into PostgreSQL, use [`preview-adoption`](../reference/nonempty-target-preview) for a read-only comparison of mapped tables. It reports equal, missing, extra and changed rows. Schedule the brief MySQL write gate needed to establish the two read views.

When the compared rows match, `plan-adoption` can prepare a digest for the bounded single-table MySQL 8.4 to PostgreSQL 17 profile. Keep the source frozen and all application and task writers stopped through approval and durable receipt confirmation. The adopted task starts paused. Moving application write authority requires a separate review.
