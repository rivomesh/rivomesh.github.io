---
kind: docs
locale: en
title: Compatibility
---

# Compatibility and capability boundaries

The [connector catalog](connectors) is generated from the source capability registry. The directory distinguishes verified profiles, limited evidence, experimental implementations, partial implementations and planned adapters.

MySQL 5.7.44 and 8.4 have current-format source evidence. MySQL 8.0 has legacy single-target HA evidence. MySQL 8.2.0 has a development integration run. Baseline acceptance and the full failover and recovery matrix are still open. PostgreSQL and Oracle source adapters remain planned. Historical Java 8/11/17/21/25 SQL/session records do not cover the entire platform and every driver.

Multiple targets acknowledge independently and do not form one distributed atomic transaction. Message delivery is confirmed at least once; consumers must handle duplicates according to the protocol. Unsupported DDL or types can block progress.

First-use business targets must be empty and exclusively written by the service. Managed COMMON_CUT repair has a limited MySQL/PostgreSQL acceptance profile. Shared node observation and shared accounts/sessions/audit have acceptance records. Task operations are local by default. Optional fixed-owner global controls are integrated; an explicit separated controller/Agent profile has initial acceptance, while automatic cross-Agent relocation and the full HA matrix remain open. See [multi-node deployment](multi-node).

[Database compatibility validation](xinchuang) covers openGauss, commercial GaussDB, DM, KingbaseES, GBase 8c and OceanBase target profiles. See [reviewed SQL recovery](troubleshooting#review-a-persisted-transaction-failure) for the separate PostgreSQL/MySQL transaction operations.

Read [implementation status](../reference/implementation-status), [performance](../reference/performance), [node registry](../reference/node-registry), [shared access](../reference/shared-access) and the [SDD requirements](../sdd/spec) for exact scope.
