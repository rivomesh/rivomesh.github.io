---
kind: docs
locale: en
title: Introduction
---

# What is RivoMesh?

RivoMesh synchronizes existing database rows and subsequent inserts, updates and deletes to supported target systems. It combines snapshots, CDC, persistent journals, independent target acknowledgements and web task management.

MySQL is the primary capture source. [PostgreSQL logical replication](../reference/postgresql-source) and [Oracle archived redo capture](../reference/oracle-source) have experimental profiles. Relational, analytical and messaging destinations each define how they acknowledge and recover transactions. See [compatibility](compatibility) for exact versions and topology.

Start with a small test database and an independent empty target. Check actual values, incremental changes and restart recovery before expanding the scope.

[Quick start](quick-start) · [Compatibility](compatibility) · [Capture mechanics](replication) · [Architecture and data flow](architecture)
