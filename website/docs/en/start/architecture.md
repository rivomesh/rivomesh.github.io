---
kind: docs
locale: en
title: Replication architecture
description: How the RivoMesh console, Controller, Agent, Worker, journal, and destinations work together.
---

# Replication architecture

Controllers authorize requests and persist configuration and commands. Agents execute commands assigned to their node and manage Worker processes. Workers capture and deliver data. The control store and journal record management state and data progress respectively.

[Open the interactive architecture diagram](/architecture/en.html)

<iframe class="architecture-diagram" src="/architecture/en.html?embed=1" title="Interactive RivoMesh replication architecture" loading="lazy"></iframe>

## Control and execution

| Component | Responsibility and durable state |
| --- | --- |
| Web console and API | Accept browser sessions and Bearer tokens. Roles and per-task grants govern visibility and actions. |
| Controller | Accepts new tasks, configuration revisions and operations. Records commands and audit history. Global mode exposes the same task owner and command outcome through multiple entries. |
| Shared control store | Records task ownership, registered nodes, shared sessions and cross-entry command state. The owning Agent claims durable global commands and records the outcome. |
| Agent | Registers and sends heartbeats, claims commands for its node and supervises separate Workers with available configuration, drivers and credentials. Scoped profiles support automatic assignment for new tasks. |
| Worker | Checks source and targets, holds the journal lease and writer epoch, and captures, normalizes and delivers changes per subscription. Participates in task-level validation and recovery. |

Standalone mode combines the Controller and Agent in one service process and still runs tasks in separate Workers. The separated profile lets an existing Worker continue through a management-entry outage within its tested scope. Automatic placement of a new task and approved transfer of a frozen task have separate requirements. [Multi-node deployment and handoff](multi-node) · [Global control and durable commands](../reference/global-control)

## Data movement and recovery

1. **Source.** MySQL uses GTID/binlog, PostgreSQL uses logical slots and pgoutput, and Oracle uses Flashback and archived LogMiner. [Snapshot boundaries, decoders and restart coordinates](replication)
2. **Durable journal.** Local H2 covers standalone storage. An external journal supports scoped multi-node profiles. The journal stores snapshot parts, committed transactions, capture positions, subscription acknowledgements and the writer lease. A paused subscription can keep history pinned.
3. **Destination delivery.** Transactional SQL destinations commit business rows and the checkpoint together. Analytics products use native materialization receipts. Messaging relies on broker confirmations and stable event IDs. Each subscription progresses independently. [Connector catalog](connectors)
4. **Validation and recovery.** Supported MySQL-to-transactional-SQL profiles compare rows at a common cut. Reviewed repair, commit confirmation and transaction skip each bind to the relevant report, receipt, error generation and destination scope. [Data validation](data-validation) · [Troubleshooting](troubleshooting)

[Platform design manual](../reference/platform-design) · [Detailed compatibility matrix](../reference/compatibility)
