---
kind: docs
locale: en
title: Compatibility
---

# Compatibility and capability boundaries

Choose a profile by **source version and topology, destination product and mode, and Java runtime**. Filter by direction and status in the [connector catalog](connectors). Use the product manuals and [detailed compatibility matrix](../reference/compatibility) to check the selected configuration before deploying.

## Capture sources and runtime

| Capture source | Available scope | Check before use |
| --- | --- | --- |
| MySQL 5.7.44, 8.0.46, 8.2.0 and 8.4.13 | Each has Temurin 21 evidence for standalone, async GTID promotion and three-member single-primary Group Replication. Destination coverage varies by topology. | InnoDB, GTID, ROW/FULL images, replication and snapshot privileges, and binlog retention. See [pipeline configuration](../reference/pipeline-v3). |
| PostgreSQL 17.12 / 18.7 | Experimental `pgoutput` capture into PostgreSQL or MySQL. Native evidence covers synchronized-slot promotion on 17.12 and materialization of stored generated columns on 18.7. | One source database per task, explicit publication tables, `REPLICA IDENTITY FULL`, replication slots, WAL retention and supported types. See [source configuration](../reference/postgresql-source). |
| Oracle 26ai Free 23.26.4.0.0 | Experimental Flashback snapshots and single-PDB, single-thread archived LogMiner CDC into PostgreSQL. | Supply Oracle JDBC separately. Verify CDB and PDB services, supplemental logging, privileges, archive coverage and types. See [source configuration](../reference/oracle-source). |

Eclipse Temurin 21 LTS is the sole supported build and runtime for the current candidate, including Controllers, Agents and Workers. Historical driver and destination tests keep their original runtime. Check the exact build, target and driver in the [compatibility matrix](../reference/compatibility).

## Destinations and operations

- **Relational databases.** Destinations acknowledge independently. Native MySQL 8.4 and PostgreSQL 17 profiles commit business data and a destination checkpoint together. Start ordinary tasks with empty business tables. For an existing PostgreSQL copy, use the [read-only adoption preview](../reference/nonempty-target-preview) and check the separate conditions for reviewed single-table adoption.
- **Database adaptation.** Verify exact versions, drivers and compatibility modes for openGauss, DM, KingbaseES, GBase 8c and OceanBase. Commercial distributed GaussDB requires native multi-node verification. See the [database adaptation guide](xinchuang).
- **Analytics and messaging.** ClickHouse, Doris and Hive use engine-specific materialization and receipts. Messaging uses confirmed at-least-once publication. Track consumer completion separately and deduplicate using stable event IDs. See [messaging targets](../reference/messaging-v3).
- **Validation and recovery.** Common-cut comparison, reviewed repair, transaction compensation and gap verification each have bounded MySQL/PostgreSQL profiles. Kafka receipt review and failure notices use a [separate messaging protocol](../reference/messaging-v3). For unsupported DDL or types, preserve and review the failure and durable position. See [troubleshooting](troubleshooting).

## Multi-node deployment

Nodes can share accounts, sessions, audit and task views. Separated deployments have specific SQL profiles for automatic initial Agent placement and administrator-approved transfer of a frozen task. Cross-host continuation requires external journaling and a valid execution lease. See [multi-node deployment](multi-node).

Linux, Docker, Helm and Kubernetes deployment files are available. Live two-node Kubernetes runs cover configuration and Secret updates, same-volume remounts and recovery with an external journal. Check cross-node volume availability, failure modes and capacity separately. See [execution lifecycle](../reference/execution-lifecycle) and [implementation status](../reference/implementation-status).
