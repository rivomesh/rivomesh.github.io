---
kind: docs
locale: en
title: Documentation
---

# RivoMesh documentation

RivoMesh is a Java-based database synchronization platform. It delivers snapshots and ongoing changes to databases, analytics systems and message brokers. MySQL is the primary source, with experimental profiles for PostgreSQL and Oracle.

## Start here

[Introduction](introduction) · [Quick start](quick-start) · [Compatibility](compatibility) · [Connector catalog](connectors) · [Roadmap](roadmap)

## Find the next task

| Goal | Read |
| --- | --- |
| Install and sign in | [Installation](install) and [quick start](quick-start) |
| Create a synchronization pipeline | [Create a task](create-task) |
| Check progress or recover after an error | [Monitoring](monitoring), [troubleshooting](troubleshooting) and [backup](backup) |
| Compare data and review a repair | [Validation and reviewed repair](data-validation) |
| Evaluate database compatibility | [Database adaptation](xinchuang) |
| Deploy multiple nodes and shared access | [Multi-node deployment](multi-node) |
| Manage user access | [Accounts and permissions](access) |
| Understand snapshots, change logs and restart positions | [MySQL, PostgreSQL and Oracle capture](replication) |
| Trace the control plane, execution and storage | [Architecture and data flow](architecture) |
| Evaluate an experimental capture source | [PostgreSQL](../reference/postgresql-source) or [Oracle](../reference/oracle-source) |

Start with a small test source and an empty, dedicated target. Check inserts, updates, deletes and restart behavior before expanding the scope.

Detailed configuration is available in the reference section. Find architecture, verification and contribution material in [project resources](/en/project.html).
