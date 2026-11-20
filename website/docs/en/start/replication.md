---
kind: docs
locale: en
title: How source replication works
description: How RivoMesh connects consistent snapshots, change capture, and restart positions for MySQL, PostgreSQL, and Oracle.
---

# How source replication works

RivoMesh takes a consistent source snapshot and delivers committed changes. The Worker persists snapshot parts, transactions and capture positions in the journal. Each destination delivers from its own subscription and checkpoint. To tell whether a task has caught up, check the source position, journal backlog and confirmation position for each destination. [Architecture diagram](architecture)

| Source | Snapshot-to-CDC boundary | Preserve for recovery | Native test scope |
| --- | --- | --- | --- |
| [MySQL](#mysql) | Per-table InnoDB read view and GTID set | Original journal, required binlogs and destination receipts | 5.7.44, 8.0.46, 8.2.0 and 8.4.13 in scoped standalone, asynchronous GTID and single-primary Group Replication profiles |
| [PostgreSQL](#postgresql) | Per-table exported MVCC snapshot and logical replication LSN | Original durable slot, required WAL, timeline and journal generation | Experimental. Scoped pgoutput profiles on 17.12 and 18.7 with PostgreSQL or MySQL targets |
| [Oracle](#oracle) | Flashback SCN and closed archived redo | Archives from the retained floor, CDB/PDB identity and journal checkpoint | Experimental. Oracle Free 26ai with one PDB and one redo thread, delivering to PostgreSQL |

## MySQL

1. **Check the source.** A task connects to one logical MySQL topology. List source databases in `databases` and route them with each destination’s `mappings`. The profile requires InnoDB, GTID, ROW binlogs and FULL row images. Untagged GTIDs and complete row images allow recovery of committed changes and matching of duplicate occurrences in keyless tables.
2. **Establish a consistent view per table.** The Worker saves the capture start position and opens the binlog stream. For each table it briefly uses `FLUSH TABLES WITH READ LOCK`, opens an InnoDB consistent read, verifies the schema, records the GTID set and opens a cursor. It releases the global read lock before reading batches from the same view. A large scan can still retain undo history and metadata locks.
3. **Apply from each table baseline.** The binlog reader assembles and persists committed transactions during the snapshot. After a destination finishes a table snapshot, the Worker excludes changes already represented in that snapshot. Subscribed rows retain the source transaction boundary across databases. Use a common cut when checking consistency across tables with different baselines.
4. **Resume from the original GTID.** The journal commits each transaction with its capture position. Restart reuses complete snapshots and rescans a table if its incomplete snapshot lost the read view. An external system promotes an asynchronous replica. MySQL elects the primary in Group Replication. RivoMesh checks the writable role, GTID history and log coverage. A missing required binlog pauses capture at the last durable position.

Start with the current primary, the saved GTID set and `gtid_purged`, then check whether a paused target pins journal space. Preserve the original binlogs and checkpoint evidence. [Pipeline configuration and failover profiles](../reference/pipeline-v3) · [Capture recovery](../reference/capture-recovery)

## PostgreSQL

1. **Set the publication scope.** A task captures one PostgreSQL database. Here `databases` lists source schemas. Set `wal_level=logical`, publish INSERT, UPDATE and DELETE for selected tables, use `REPLICA IDENTITY FULL` and reserve capacity for the durable slot and a temporary snapshot slot.
2. **Export each table’s snapshot.** The Worker creates a temporary logical slot and reads its `snapshot_name` and `consistent_point`. A separate `REPEATABLE READ` connection imports the snapshot and reads the table in batches. The consistent-point LSN becomes the table’s CDC boundary. The durable streaming slot is bound to the task’s journal generation.
3. **Decode committed changes.** `pgoutput` supplies Relation, Begin, row changes and Commit messages. The decoder uses the publication scope and registered schema. The Worker reports applied and flushed LSNs only after the complete transaction reaches the journal. Keepalives and WAL outside the publication leave the business transaction checkpoint unchanged. Out-of-line TOAST values follow the supported row-image rules.
4. **Validate the original slot and timeline.** Reconnection checks the system identifier, database, timeline, slot and LSN. The scoped PostgreSQL 17.12 test resumed after promotion with a synchronized failover slot. Missing slots or WAL and timeline regression protect the last durable position. Follow the supported review process when a schema change pauses capture.

Monitor durable capture position, replication slot WAL retention and destination backlog together. [PostgreSQL source configuration, failover and type coverage](../reference/postgresql-source)

## Oracle

1. **Bind the source identity and determine the SCN.** Preflight connects separately to the CDB root and the selected writable PDB. It checks DBID, resetlogs and PDB identity, archive mode, force logging, supplemental logging and Flashback access. Declare uppercase `OWNER.TABLE` names and map owners to PostgreSQL schemas.
2. **Read the Flashback snapshot.** The Worker records a snapshot SCN for the capture start. It reads selected tables with `AS OF SCN` and stores snapshot parts. Complete snapshots can be reused. An interrupted unfinished snapshot can restart using a new Flashback view.
3. **Decode closed archives.** The Worker checks archive coverage and reads committed changes with LogMiner’s `COMMITTED_DATA_ONLY`. It groups changes by XID and orders typed row images by commit SCN and transaction order. Redo and undo supply the images. A transaction open at snapshot time can hold the retained archive floor back until closed archives cover the required transaction boundary.
4. **Resume from the original SCN and archive floor.** The durable position binds the source identity, captured SCN and archive floor. On restart the Worker checks archive continuity and readability. Missing logs, unsupported records, ambiguous commit order or unreviewed DDL pause capture at the previous durable position. Archive rotation affects CDC latency.

The experimental profile uses one PDB, one redo thread and closed archives. Online redo, RAC, source promotion, native binary JSON and LOBs require separate coverage. [Oracle source privileges, scalar types and strict textual JSON](../reference/oracle-source)

## Delivery, checkpoints and repair

The Worker normalizes row changes in source transaction order, then delivers each subscription independently. Transactional SQL destinations commit rows and their local checkpoint together. Analytics destinations recover through engine-specific materialization receipts. Messaging uses broker confirmations and stable event IDs to handle redelivery.

If capture advances while one destination stalls, inspect that destination’s error generation and receipt first. For row comparisons, run [data validation](data-validation) at a supported common cut. Preserve the journal, destination metadata and relevant source history before recovery. [Troubleshooting workflows](troubleshooting)
