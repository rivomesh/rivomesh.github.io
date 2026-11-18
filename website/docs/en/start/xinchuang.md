---
kind: docs
locale: en
title: Database compatibility validation
---

# Database compatibility validation

Use a MySQL snapshot and continuous changes to evaluate database compatibility, run parallel checks and prepare a migration in an independent target environment.

<ConnectorCatalog adaptation />

See the [connector catalog](connectors) for product manuals and exact boundaries. These are target adapters, not capture sources or vendor certification.

Start with an empty target and representative business tables. Validate Chinese text, NULL/empty strings, temporal precision, decimal values, JSON, keyless duplicates, generated columns and index/constraint conversions. Rehearse outages and restart recovery. Application SQL compatibility, constraints, write cutover and rollback need their own plan. Managed row-level validation and repair currently have a MySQL/PostgreSQL acceptance profile.

## Source expansion

MySQL is the implemented capture source. PostgreSQL and Oracle sources are planned and are not currently runnable. The source adapter interface allows additional database types to be added with their own snapshot, transaction-log and recovery-position semantics. Each additional source requires its own implementation and validation.

[Multi-node deployment](multi-node) · [Compatibility](compatibility) · [Roadmap](roadmap) · [Platform design](../reference/platform-design)
