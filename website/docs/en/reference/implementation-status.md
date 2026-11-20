---
kind: docs
locale: en
title: "Implementation status"
sourcePath: docs/en/implementation-status.md
---

# Current implementation status

The first release is not published. Java/Maven namespace:`io.github.rivomesh`.[中文](/docs/zh/reference/implementation-status.html).

The verification archive defines the database, version and deployment profile for each accepted result.[Verification archive](/docs/zh/evidence/baseline.html)

## Accepted

| Scope | Result |
|---|---|
| DO-03 | Bilingual runbook covers promotion, logs, storage, nodes, sessions and manual recovery. |
| CP-01–03 | Global node registry, shared task configuration and request-bound cross-entry commands. |
| CP-05–06 | Cross-entry revocation, audit correlation, scoped Worker credentials and bounded, redacted diagnostics. |
| SE-01–05 | Reload persistence,expiry/revocation,secure cookies/CSRF,cross-entry sessions and API identity rules |
| CP-07 | Separated control/execution;bounded original-Worker continuity during management outages |
| RC-02 | Durable transaction evidence,authorized pagination,historical schemas and images |
| RC-05 | Native commit verification and acknowledgment recovery without reapplying rows |
| RC-03 | Complete cross-database skip,native commit/source ACK failure,original-Agent SIGKILL/reopen and cross-entry recovery;pauses/gaps retained |
| RC-08 | Durable gaps,reviewed verification,cross-entry approval/cancellation and honest incremental progress;bounded SQL profile |
| RC-06 | Before-image compensation with cross-entry approval and explicit resume. Bounded SQL profile |
| RC-07 | Typed entry, JSON import, before/after preview and cross-entry approval. Bounded SQL profile |
| RC-01 | MySQL source, journal and target fault phases across entries and restart |
| RC-09 | Cross-entry cancellation and original-request recovery across compensation and correction commit boundaries |
| JV-01 | Temurin 21 is the current release baseline for Controller, Agent and Worker. |
| LG-07 | Verified capacity matrix, 256 database mappings, large transactions and shared-journal backpressure with resume. |
| SO-02 | Temurin 21 passes standalone, async GTID promotion, three-member single-primary Group Replication, replica SQL failure and binlog-loss refusal on MySQL 5.7.44. |
| SO-03 | Temurin 21 passes standalone, async GTID promotion and three-member single-primary Group Replication on MySQL 8.0.46. Cross-entry manual recovery has a separate profile. |
| SO-05 | MySQL 8.4.13 V3 topologies, log profile admission and unsupported live events |
| SO-04 | Temurin 21 passes standalone, async GTID promotion and three-member single-primary Group Replication on MySQL 8.2.0. |

The [single verification baseline](/docs/zh/evidence/baseline.html) retains scoped provenance rather than repeated development snapshots. Cleanup validation is distinguished from earlier acceptance.

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

See [design](/docs/en/reference/platform-design.html),[console operations](/docs/en/reference/console-and-deployment.html) and product guides for constraints. Protocol/data-format numbers identify internal modes,not compatibility promises for unreleased builds.

## Cleanup

The first-release runbooks describe the current artifact and state formats. Use coordinated Controller, journal and target backups and verify their identity before restoring. Temporary fixture containers and duplicate build artifacts are cleaned after verification. [First-release operations](/docs/en/reference/first-release.html)

## Remaining acceptance

| Scope | Completion condition |
|---|---|
| CP-04, LG-05 | Verify fencing and recovery after losing the original Agent before a freeze. Takeover after permanent disk loss requires independently retained directory identity, closed receipts, failure evidence and audit history. Separate control and journal databases require native durable fencing and replay verification. |
| RC-10, LG-04 | Verify message intent with a real source and broker, and complete per-target gap notice and fault tests. Record the native receipt and consumer deduplication boundary for each broker. |
| SO-06, SO-07, LG-08 | Complete reviewed schema changes and common-cut verification. Extend Oracle LOB/RAC, complex types and coordinated restore profiles. |
| JV-02, JV-03, LG-01, LG-03 | Verify drivers, TLS, clusters and recovery by target on Temurin 21. Commercial distributed GaussDB requires a real multi-CN/DN installation. Analytical products require their production cluster profiles. |
| LG-10 | Verify production external identity, revocation and audit retention. Confirm distribution rights, LICENSE and NOTICE. |
