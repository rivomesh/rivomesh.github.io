---
kind: docs
locale: en
title: "Implementation status"
sourcePath: docs/en/implementation-status.md
---

# Current implementation status

The first release is not published. Java/Maven namespace:`io.github.rivomesh`.[中文](/docs/zh/reference/implementation-status.html).

## Existing capabilities and limits

| Capability | Current boundary |
|---|---|
| Replication | MySQL multi-database fan-out, automatic tables, chunked snapshot, durable progress, keyless rows, JSON and supported generated columns. Async GTID promotion and three-member single-primary Group Replication pass on Temurin 21 for MySQL 5.7.44, 8.0.46, 8.2.0 and 8.4.13. Both SQL destinations catch up after election in all four group profiles. |
| PostgreSQL source | Synchronized-slot promotion on 17.12 and stored generated columns on 18.7 passed. Native 17.12 REAL, DOUBLE PRECISION and BYTEA resume into PostgreSQL and MySQL. BYTEA accepts source server hex and escape defaults, preserving keyless multiplicity and out-of-line values. [Operator guide](/docs/en/reference/postgresql-source.html) |
| Oracle source | Oracle Free 26ai single-PDB Flashback and archived LogMiner CDC. Two PostgreSQL subscriptions preserve original SCNs through savepoint rollback and forced restart. The profile accepts strict text JSON and the tested AL32UTF8 and AL16UTF16 character declarations. Preflight blocks native JSON when redo images are missing. [Source guide](/docs/en/reference/oracle-source.html) |
| Capture recovery | Inspect the original position and affected targets, verify MySQL GTID boundaries and original binlog bytes, and approve one verified source transaction exclusion on the bounded profile. [Operator guide](/docs/en/reference/capture-recovery.html) |
| Management | Bilingual wizard, shared revisions, isolated Workers and cross-entry control. MySQL and PostgreSQL sources verify Agent JVM, components and external PostgreSQL journal reachability before automatic placement. Real Chrome verified retained sessions, report and receipt lookup, and approved report recovery. Keycloak 26.7.4 passed HTTPS code login with S256 PKCE and cross-entry revocation. [Global control](/docs/en/reference/global-control.html) · [OIDC](/docs/en/reference/oidc-login.html) |
| Interrupted journal ACK | With a PostgreSQL journal, native tests cover a committed MySQL or PostgreSQL target. After the original Agent reconnects, explicit START completes only the missing ACK. For a stopped task with an already frozen writer and complete closed receipts, the same-store offline handoff preserves both SQL cuts through candidate start. [Operator guide](/docs/en/reference/global-control.html#asymmetric-control-network-partition) |
| Compare/repair | Common-cut row comparison and reviewed repair plans;bounded MySQL/PostgreSQL profiles |
| Gap verification | Reviewed plans,administrator confirmation,fresh scans,atomic receipts and cross-entry cancellation;bounded PG/MySQL,see [guide](/docs/en/reference/gap-verification.html) for acceptance |
| Transaction compensation | Administrator review and approval for PostgreSQL and MySQL with atomic target receipts and original transaction replay. See the [operator guide](/docs/en/reference/transaction-compensation.html) |
| Relational targets | MySQL, PostgreSQL and openGauss have native profiles. DM, Kingbase, GBase8c and OceanBase MySQL mode have bounded native transaction and mixed restart profiles. Distributed GaussDB and other vendor modes remain open. |
| Analytical targets | ClickHouse, Doris and Hive have materialization and recovery profiles. On Temurin 21, ClickHouse 25.8.33.6 retains the newer journal position and refuses to write after restoring an older nonempty volume. Production clusters, TLS and capacity require separate acceptance. |
| Messaging | Eight broker profiles use confirmed at-least-once delivery. Native profiles include Kafka signed receipt readback, ActiveMQ Classic and Artemis shared-store failover, NATS TLS/quorum, RabbitMQ quorum and externally promoted Redis Streams. RocketMQ 5.5.0 opt-in publisher failover passed with three data replicas and a minimum of two synchronized replicas. [Messaging guide](/docs/en/reference/messaging-v3.html) |
| Deployment | Linux, Docker, Helm and native Kubernetes. Two live nodes verified same-volume remount, image replacement, configuration rollout, Secret rotation, cross-node automatic CDC and stale Worker fencing with an external journal. |
| Java | Eclipse Temurin 21 LTS is the sole supported build and runtime. Connector, deployment and security protocol acceptance uses the exact Java 21 candidate. |

See [design](/docs/en/start/architecture.html),[console operations](/docs/en/reference/console-and-deployment.html) and product guides for constraints. Protocol/data-format numbers identify internal modes,not compatibility promises for unreleased builds.

[Verified environments](/docs/en/start/verification.html) · [Product roadmap](/docs/en/start/roadmap.html)
