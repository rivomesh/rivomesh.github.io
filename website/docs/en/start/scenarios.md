---
kind: docs
locale: en
title: Use cases and evaluation
---

# Choose a representative evaluation

Begin with a defined business scope and an independent test target, then preserve configuration and measured results for review.

## Cross-database and heterogeneous integration

Replicate MySQL data to supported database targets with explicit database/schema mappings. Review text, NULL values, temporal precision, decimals, JSON, keyless duplicates, generated columns, indexes and constraints. Each product/mode has its own [connector profile](connectors).

## Continuously updated analytics

Deliver snapshots and changes to ClickHouse, Doris or Hive. Validate update/delete behavior, views and materialization before measuring latency under your workload. These targets do not all use transactional JDBC semantics.

## Multiple downstream systems

Deliver one logical source to independently acknowledged targets. Rehearse a slow or failed destination and plan retained journal capacity. Message consumers must interpret snapshot/transaction boundaries and handle duplicates.

## Migration and parallel validation

Populate an independent environment while preserving the original business database. Review actual values, object differences, restarts and recovery. Application SQL, write cutover, rollback and business constraints require their own plan.

For openGauss, DM, KingbaseES, GBase 8c and OceanBase, use the [domestic database adaptation guide](xinchuang). Managed row validation/repair has a MySQL/PostgreSQL acceptance profile; do not assume all domestic target profiles support the same maintenance workflow.

[Performance measurement](../reference/performance) · [Multi-node evaluation](multi-node) · [Compatibility boundaries](compatibility)
