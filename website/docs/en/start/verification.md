---
kind: docs
locale: en
title: Verified environments and behavior
description: RivoMesh verification by source database, runtime, recovery procedure and deployment profile.
---

# Verified environments and behavior

Each result applies to the tested sources, destinations, drivers, journal storage and deployment topology. Match your versions and topology against the [compatibility matrix](../reference/compatibility), then verify data, permissions and failure recovery with the intended configuration.

| Scope | Verified behavior | Configuration and reproduction |
| --- | --- | --- |
| MySQL capture | Temurin 21 tests cover standalone, asynchronous GTID promotion and three-member single-primary Group Replication on 5.7.44, 8.0.46, 8.2.0 and 8.4.13. | [MySQL configuration and failover](../reference/pipeline-v3) |
| PostgreSQL capture | Experimental. Scoped tests cover synchronized-slot promotion on 17.12 and stored generated columns on 18.7. | [PostgreSQL source](../reference/postgresql-source) |
| Oracle capture | Experimental. The Oracle Free 26ai single-PDB profile delivers Flashback snapshots and archived LogMiner changes to PostgreSQL and resumes from the original SCN. | [Oracle source](../reference/oracle-source) |
| Data comparison and recovery | Common-cut row comparison has scoped MySQL-to-transactional-SQL coverage. PostgreSQL and MySQL destinations have separate verified recovery profiles. | [Data validation and repair](data-validation) · [Destination recovery](troubleshooting) |
| Messaging and analytics | Scoped tests cover broker acknowledgements, materialization receipts and restart recovery. Consumer acknowledgement, deduplication and retention follow the destination protocol. | [Connector catalog](connectors) · [Destination receipt review](../reference/failed-transactions) |
| Multi-node deployment | Scoped two-node Kubernetes tests cover image replacement, configuration and Secret updates, original volume remounts and resumption with an external journal. | [Multi-node deployment](multi-node) · [Execution lifecycle](../reference/execution-lifecycle) |
| Build and runtime | Controller, Agent and Worker use Eclipse Temurin 21 LTS. | [Installation](install) |

When reproducing a result, record the versions, topology, artifact and checkpoints before and after recovery. For capacity planning, also record row width, transaction size and backlog at the slowest destination. [Performance environments, results and reproduction commands](../reference/performance)
