---
kind: docs
locale: en
title: "Requirements & decisions"
sourcePath: docs/en/requirements-and-decisions.md
---

# Rivomesh requirements, decisions, and implementation boundaries

Updated: 2026-11-16. 中文：[需求与决策](/docs/zh/reference/requirements-and-decisions.html).

This document records scope and implementation status. **Accepted requirements are not released features.** See the [README](https://github.com/rivomesh/rivomesh/blob/main/README.md) for current operation and [platform design](/docs/en/reference/platform-design.html) for capabilities and scenarios.

New/clarified scope and gaps use [SDD baseline RM-SDD-001](/docs/en/sdd/spec.html):48traceable requirements,tasks and acceptance contracts. Current behavior remains governed by [implementation status](/docs/en/reference/implementation-status.html) and evidence.

## Confirmed decisions

| ID | Decision | Current implementation |
|---|---|---|
| D01 | Each independent task configuration binds one logical source, initially MySQL; the platform may manage multiple configurations/independent sources, with standalone task deployment retained | Web/CLI support v2/v3, multi-database/target wizard, independent recovery and journal selection |
| D02 | Select multiple databases per topology with explicit target instance/database/schema mappings | Web/CLI v3 implement `databases` and per-target `mappings`; see V3 manual |
| D03 | Fan out one source to multiple targets/products | Web/CLI v3 implement independent target ACKs, fault isolation and recovery |
| D04 | Support MySQL5.7/8.0/8.2/8.4 sources;accept standalone/GTID ASYNC/single-primary MGR per profile | Basic5.7,historical8.0 V2/HA and representative8.4 V3 evidence exist;8.2 dedicated acceptance and the full matrix remain |
| D05 | Broad MySQL,PostgreSQL,openGauss,distributed GaussDB,DM,Kingbase,OceanBase and GBase product/version/mode scope | Specified initial MySQL/PG/openGauss/DM/Kingbase/GBase8c profiles exist;distributed GaussDB,full OceanBase recovery,GBase8a/8s and more modes remain |
| D06 | Relax Gauss business secondary UNIQUE to ordinary indexes, avoiding GSI solely for those indexes; permit relaxation for compatibility issues on other targets | V3 ordinary secondary indexes/business UNIQUE downgrade implemented; GSI has model plans; distributed hardware acceptance pending |
| D07 | Only the synchronization service writes subscribed target tables; validate and restore required constraints before takeover | Exclusive writes currently required; takeover workflow planned |
| D08 | Automatic recovery does not skip;manual skip/compensation requires review,original evidence and gaps;database promotion stays external | Some ASYNC/MGR/worker takeover and original-transaction retry pass;manual skip/failed-transaction compensation are not implemented |
| D09 | Linux manual, Docker, Kubernetes Helm Chart and native manifests, comprehensive bilingual manuals/FAQ | Deployment files and bilingual operations manual provided; live K8s/full-platform acceptance remain |
| D10 | Final name Rivomesh, directory `rivomesh`, Java package/Maven groupId `io.rivomesh` | Renamed in this change; no claim of domain/trademark clearance or Apache status |
| D11 | Include no-PK tables, JSON, and STORED/VIRTUAL generated columns in first-release scope | V3 keyless multisets, JSON, STORED and whitelisted VIRTUAL materialization implemented/tested |
| D12 | Optional independent log storage; deployment with or without it | V3 H2 local and PostgreSQL/openGauss/MySQL external journals with independent ACKs/safe reclamation implemented |
| D13 | Broad support for existing nonempty targets, object differences, and takeover | Initial targets must be empty;COMMON_CUT repair exists while nonempty adoption/merge remains pending |
| D14 | Publish reproducible hardware/workload/performance standards instead of universal TPS promises | Benchmark tooling and small SQL/JDK smoke evidence exist;representative capacity standards and soak remain |
| D15 | Complete bilingual UI,wizards,diagnostics and guided recovery | Local workbench,grants,configuration,validation and MySQL/PG COMMON_CUT repair exist;global control,persistent login,skip/patch and cutover remain |
| D16 | Government/enterprise domestic-database migration, staged switching, and parallel environments | One-way mirroring is the foundation; ownership/takeover/failback boundaries in platform design |
| D17 | ClickHouse,Apache Doris,Apache Hive and extensible analytical destinations | All three have initial materialization/recovery profiles;cluster/security/capacity/all-JDK gates remain without relational-transaction promises |
| D18 | Kafka,Pulsar,RabbitMQ,RocketMQ,ActiveMQ Classic/Artemis,Redis Streams and NATS JetStream | All have initial transport/recovery evidence;complete cluster/TLS/capacity and new skip/compensation protocols need per-adapter acceptance |
| D19 | PostgreSQL and Oracle sources are committed implementation scope,with neutral SPI/events/positions retained | Actual sources remain MySQL;PG/Oracle SOURCE is PLANNED and native snapshot/CDC/recovery remains |
| D20 | Unified multi-node inventory/control;any entry manages remote tasks | Worker lease/owner foundations exist;global registry,remote command plane and control HA do not |
| D21 | Login survives reload with logout,expiry,revocation and cross-controller policy | Current token is page-memory-only;server sessions/reload restoration remain |
| D22 | Reviewed transaction skip,controlled source-gap recovery and guided manual corrective data | COMMON_CUT repair is not failed-transaction compensation;new modes,gap ledger and UI/API remain |
| D23 | Java8/11/17/21/25 require real current-release profile evidence | Java8 baseline and an older ten-profile SQL matrix exist;complete current-platform/driver/recovery matrix remains |
| D24 | Use SDD specification/design/task/acceptance tracing and complete bilingual docs | RM-SDD-001 v0.2 closes4single-controller session requirements;44remain tracked |

The platform boundary is **one source per task, multiple tasks per platform**. No implicit source merging or cross-source transactions. Isolated workers may run under one console or as separate deployments.

`source.nodes` still lists candidates in one topology. Isolate task IDs, state namespaces, quotas, and replication client server IDs; reject overlapping target tables by default.

## Multiple databases and targets

This example expresses product intent. For runnable configuration see the [V3 manual](/docs/en/reference/pipeline-v3.html) and `config/pipeline-v3.yml`:

| Task | MySQL database | Target instance | Target namespace |
|---|---|---|---|
| sales | orders | gauss-a | app / orders |
| sales | crm | gauss-a | app / crm |
| sales | orders | doris-b | analytics / orders |
| legacy | finance | dm-c | Explicit product-specific namespace |

Version mappings and check case rules, reserved words, shortened names, and collisions. New subscriptions establish their own baseline rather than reusing another cursor. Independent configurations capture separately by default; sharing requires explicit association and compatible source identity, filters, security, and storage policies.

Within a v3 task, the runner shares ordered logs and routes events with independent snapshot, delivery/application/visibility positions and errors per target. One target's SQL failure should not pause others; shared decoding failures may affect all targets in that task.

Apply complete source transactions atomically where the relational target supports that scope. No cross-target XA is introduced. Probe Doris single/multi-table transaction support per version; use dedicated batch/materialization protocols for ClickHouse/Hive. Reject unmet task consistency requirements, or require an explicit weaker mode explained by the UI.

## Recovery and log storage

Preserve atomic data/local-checkpoint commits and owner fencing for transactional sinks. Other sinks require replayable batches, resolved commit acknowledgments, deduplication/versioning, and visibility watermarks. Advancing an external checkpoint first is not a substitute.

| Mode | No extra independent store | Failure boundary |
|---|---|---|
| Local durable journal | Yes; persistent directory/volume | Process recovery; permanent disk loss is not guaranteed lossless; cross-node takeover requires original logs and reliable fencing |
| Target-hosted journal | Yes, for targets with required transactional/state capabilities | Failure of that target can block capture; arbitrary analytics engines cannot host the current Gauss metadata unchanged |
| Independent shared journal | No; an explicitly supported HA backend | Enables cross-node worker recovery, subject to journal availability/capacity |

Persist logs before capture GTID advances. Reclaim only after all active subscriptions and baseline dependencies permit it. Alert/backpressure at quotas rather than silently discard unconsumed data. Per-task quotas must prevent one offline target from exhausting the platform.

Failover verifies captured and all relevant snapshot-read dependency GTIDs. CDC cannot recover permanently lost source transactions; editing GTIDs must not bypass gaps. Distributed metadata needs compatible keys/constraints and a durable stream sequence, not CN-generated IDs, timestamps, or lexical GTID ordering.

## Compatibility and index policy

Broad support means capability detection and a matrix identifying product/version/mode/engine/driver, objects, and consistency level. Distinguish verified, experimental, unverified, and unsupported. JDBC connectivity does not prove replication support; a feature in one release cannot be assumed for older versions.

Other targets may relax incompatible business secondary UNIQUE constraints into ordinary indexes or supported access structures, with an explicit difference manifest. Report the absence of an equivalent structure honestly. Candidate identity keys on no-PK tables, technical keys, and Doris/ClickHouse materialization keys are not optional business secondary constraints. See [Gauss index policy](/docs/en/reference/gaussdb-index-policy.html) and [platform design](/docs/en/reference/platform-design.html).

## Decisions no longer blocking design

Broad product coverage, hardware-based performance standards, optional storage, no-PK/JSON/generated columns, existing targets, conditional UNIQUE relaxation, Rivomesh naming, independent configurations, and Web UI are confirmed. Do not repeatedly ask whether these features are needed.

An onboarding wizard obtains actual versions, modes, namespaces, volumes, and privileges and produces compatibility/sizing reports. Listing every future customer environment now is unnecessary. Conflict priorities for existing data, destructive changes, and production switching still require task-specific choices; broad compatibility does not authorize arbitrary overwrites/deletions.

Classify DDL by operation/capability: additions, compatible changes, destructive changes, generated-expression changes, and partition changes, with automatic, planned-migration, or blocked outcomes. Including the three requested object types does not imply every MySQL engine/function/DDL is automatically compatible.

## Delivery and acceptance

Suggested order: rename → capability/task isolation → identity/JSON/generated columns/DDL → optional journals/adapters → UI recovery/validation → takeover → full benchmark/delivery matrix. Deliver UI operations alongside core features rather than waiting for every adapter.

Test task isolation, cross-database transactions, target-specific recovery, journal GC/backpressure, duplicate counts on keyless tables, historical generated expressions, JSON precision, existing-target reconciliation, analytics retry/visibility, source failover, and stale owners. [Validation](/docs/en/reference/validation.html) separately records v2 HA, v3 three-target/two-journal, HTTP/DOM and broker tests. Repeated executions are not summed as distinct cases; remaining scope needs dedicated acceptance.

## FAQ

**Can configurations connect to independent MySQL sources?** Yes. The platform now loads independent configurations and manages isolated workers/checkpoints. Standalone CLI remains. See [console manual](/docs/en/reference/console-and-deployment.html) for boundaries.

**Do parallel environments imply writes to the same table on both sides?** No. Start with one writer/multiple readers, shadow validation, or explicit domain ownership. Independent writers require additional source capture, conflict resolution, loop prevention, and application routing beyond current one-way MySQL CDC.

**Can every target share identical DDL/write SQL?** No. Reuse the event model; adapters own types, indexes, transactions, batch commits, and reading semantics.

**Are all new features available now?** No. Renaming, v3 fan-out, keyless/JSON/supported generated columns, optional journals, Web and Kafka/RabbitMQ/NATS/Redis Streams/Pulsar/RocketMQ are implemented. Complete DDL, remaining adapters, permissions/repair and business switching remain in development. Enable features according to the implementation/validation matrices.
