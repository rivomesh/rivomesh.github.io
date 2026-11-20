---
kind: docs
locale: en
title: Database compatibility validation
---

# Database compatibility validation

Use a MySQL snapshot and continuous changes to evaluate database compatibility, run parallel checks and prepare a migration in an independent target environment.

<ConnectorCatalog adaptation />

This catalog covers destination adapters. See the [connector catalog](connectors) for exact product profiles and manuals.

Start with an empty target and representative business tables. Validate Chinese text, NULL/empty strings, temporal precision, decimal values, JSON, keyless duplicates, generated columns and index/constraint conversions. Rehearse outages and restart recovery. Application SQL compatibility, constraints, write cutover and rollback need their own plan. Managed row-level validation and repair currently have a MySQL/PostgreSQL acceptance profile.

## Capture source profiles

MySQL is the main path for the target profiles above. Experimental [PostgreSQL 17/18 capture](../reference/postgresql-source) writes to PostgreSQL or MySQL. Experimental [Oracle 26ai Free capture](../reference/oracle-source) uses Flashback snapshots and archived changes from a single PDB with a PostgreSQL destination. See the [detailed compatibility matrix](../reference/compatibility).

[Multi-node deployment](multi-node) · [Compatibility](compatibility) · [Roadmap](roadmap) · [Platform design](architecture)
