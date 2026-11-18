---
kind: docs
locale: en
title: "Implementation status"
sourcePath: docs/en/implementation-status.md
---

# Current implementation status

The first release is not published. Java/Maven namespace:`io.github.rivomesh`. [SDD](/docs/en/sdd/spec.html) · [Tasks](/docs/en/sdd/tasks.html) · [中文](/docs/zh/reference/implementation-status.html).

48 requirements: **13 DONE,30 PARTIAL,5 NEW;35 open**. Each accepted item is limited to its declared profile rather than every product/version/deployment combination.

## Accepted

| Scope | Result |
|---|---|
| CP-01 | Unified registry,roles,versions,heartbeat and ownership |
| SE-01–05 | Reload persistence,expiry/revocation,secure cookies/CSRF,cross-entry sessions and API identity rules |
| CP-07 | Separated control/execution;bounded original-Worker continuity during management outages |
| RC-02 | Durable transaction evidence,authorized pagination,historical schemas and images |
| RC-05 | Native commit verification and acknowledgment recovery without reapplying rows |
| RC-03 | Complete cross-database skip,native commit/source ACK failure,original-Agent SIGKILL/reopen and cross-entry recovery;pauses/gaps retained |
| RC-08 | Durable gaps,reviewed verification,cross-entry approval/cancellation and honest incremental progress;bounded SQL profile |
| RC-06 | Before-image compensation with cross-entry approval and explicit resume. Bounded SQL profile |
| RC-07 | Typed entry, JSON import, before/after preview and cross-entry approval. Bounded SQL profile |

The [single verification baseline](/docs/zh/evidence/baseline.html) retains scoped provenance rather than repeated development snapshots. Cleanup validation is distinguished from earlier acceptance.

## Existing capabilities and limits

| Capability | Current boundary |
|---|---|
| Replication | MySQL multi-database mappings/fan-out,table creation,chunked snapshot-to-stream,durable progress,keyless/JSON/supported generated columns |
| Management | Bilingual wizard,configuration revisions,isolated Workers,durable cross-entry commands,accounts/grants/audit |
| Compare/repair | Common-cut row comparison and reviewed repair plans;bounded MySQL/PostgreSQL profiles |
| Gap verification | Reviewed plans,administrator confirmation,fresh scans,atomic receipts and cross-entry cancellation;bounded PG/MySQL,see [guide](/docs/en/reference/gap-verification.html) for acceptance |
| Transaction compensation | Administrator review and approval for PostgreSQL and MySQL with atomic target receipts and original transaction replay. See the [operator guide](/docs/en/reference/transaction-compensation.html) |
| Relational targets | Actual MySQL/PostgreSQL/openGauss profiles;experimental DM/Kingbase/GBase8c profiles;OceanBase full recovery and distributed GaussDB remain open |
| Analytical targets | Initial ClickHouse/Doris/Hive materialization/recovery;production clustering,security/performance remain open |
| Messaging | Kafka/Pulsar/RabbitMQ/RocketMQ/Classic/Artemis/Redis Streams/NATS JetStream have bounded confirmation/recovery profiles;complete cluster/TLS matrices remain open |
| Deployment | Linux,Docker,Helm,native Kubernetes YAML;liveK8s/CSI/node-fault acceptance remains open |
| Java | Java8 build baseline;partial five-JRE profiles,not the full source/target/driver/TLS/recovery matrix |

See [design](/docs/en/reference/platform-design.html),[console operations](/docs/en/reference/console-and-deployment.html) and product guides for constraints. Protocol/data-format numbers identify internal modes,not compatibility promises for unreleased builds.

## Cleanup

Historical-binary probes,automatic control-mode migration and duplicate development snapshots are removed. Namespaces are created in the configured mode and refuse mismatches without silent migration/fallback.73 affected contracts pass. SDKs are installed in the Maven cache,so application-only iterations avoid rebuilding them.

The V2/V3 execution branches,wizard and configuration fixtures still share dependencies;their consolidation is a separate pending batch. Business data and current state-integrity checks were not removed.

## Next work

1. Distributed recovery jobs and recovery protocols for other destinations.
2. Automatic Agent relocation,draining,global diagnostics and storage reachability.
3. PostgreSQL/Oracle sources,MySQL8.2 and complete5.7/8.0/8.4 profiles.
4. Distributed GaussDB and complete vendor/messaging/analytical production matrices.
5. Large transactions/catalogs,hardware benchmarks,liveK8s,complete JDK matrix and bilingual docs.
