---
kind: docs
locale: en
title: Compatibility
---

# Compatibility and capability boundaries

The [connector catalog](connectors) is generated from the source capability registry. AVAILABLE, PARTIALLY_VERIFIED, EXPERIMENTAL and PLANNED are distinct states, not certification for every version or cluster.

MySQL is the implemented capture source. PostgreSQL and Oracle source adapters remain tracked separately in SDD. Historical Java 8/11/17/21/25 SQL/session records do not cover the entire platform and every driver.

Multiple targets acknowledge independently and do not form one distributed atomic transaction. Message delivery is confirmed at least once; consumers must handle duplicates according to the protocol. Unsupported DDL or types can block progress.

First-use business targets must be empty and exclusively written by the service. Managed COMMON_CUT repair has a limited MySQL/PostgreSQL acceptance profile. Shared node observation and shared accounts/sessions/audit have acceptance records. Public task operations remain local while global task control is being integrated. See [multi-node deployment](multi-node).

[Domestic database adaptation](xinchuang) covers target profiles and source expansion. MySQL is currently the implemented source; PostgreSQL and Oracle sources remain planned. Additional database types require independent source adapters and acceptance.

Read [implementation status](../reference/implementation-status), [performance](../reference/performance), [node registry](../reference/node-registry), [shared access](../reference/shared-access) and the [SDD requirements](../sdd/spec) for exact scope.
