---
kind: docs
locale: en
title: Introduction
---

# What is RivoMesh?

RivoMesh synchronizes existing MySQL data and subsequent inserts, updates and deletes to supported target systems. It combines snapshots, CDC, persistent journals, independent target acknowledgements and web task management.

The implemented capture source is MySQL. Targets include relational databases, analytical systems and messaging systems. Availability depends on the exact product, version and profile; PostgreSQL as a target does not imply PostgreSQL source support.

Start with a small test database and an independent empty target. Check actual values, incremental changes and restart recovery before expanding the scope.

[Quick start](quick-start) · [Compatibility](compatibility) · [Platform design](../reference/platform-design)
