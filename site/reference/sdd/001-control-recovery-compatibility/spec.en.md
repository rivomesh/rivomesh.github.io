---
sourcePath: docs/sdd/001-control-recovery-compatibility/spec.en.md
---

# Rivomesh SDD requirements and incomplete scope

RM-SDD-001 · v0.1 · 2026-11-16 · DRAFT_REQUIREMENTS

This change inventories requirements,gaps,tasks and acceptance;it does not implement runtime behavior. NEW means absent;PARTIAL means foundations/specific evidence exist but the whole requirement is incomplete. P0/P1/P2 are proposed priorities,not an approved schedule. All48items below remain incomplete;existing capabilities are baseline,not new delivery.

[Baseline/decisions](/reference/sdd/001-control-recovery-compatibility/plan.en.html) · [Tasks](/reference/sdd/001-control-recovery-compatibility/tasks.en.html) · [Acceptance](/reference/sdd/001-control-recovery-compatibility/acceptance.en.html) · [中文](/reference/sdd/001-control-recovery-compatibility/spec.html)

## Unified cluster control

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| CP-01 | P0 / PARTIAL | Global node registry and state | Task owner/leases exist;global node inventory/heartbeats do not. |
| CP-02 | P0 / NEW | Global task/configuration authority | Controller registry,configuration history,report paths and locks are local. |
| CP-03 | P0 / NEW | Durable cross-node command routing | The Worker factory launches/stops local JVMs only. |
| CP-04 | P0 / PARTIAL | Failover,fencing and placement | Worker leases/epochs exist;global scheduling,remote lifecycle and rolling-upgrade protocols do not. |
| CP-05 | P0 / NEW | Shared authorization,audit and secret references | Accounts and operation audit persist locally without cluster-wide authority. |
| CP-06 | P1 / PARTIAL | Cluster logs,metrics and diagnostics | Local task/backlog/error UI exists without remote aggregation. |
| CP-07 | P0 / NEW | Control-plane HA and worker independence | A local controller lock is not HA;controller shutdown stops child workers. |

## Persistent login

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| SE-01 | P0 / NEW | Session survives page reload | Token/session exist only in page memory and disappear on reload. |
| SE-02 | P0 / NEW | Session expiry,logout and revocation | No independent server-session lifecycle. |
| SE-03 | P0 / NEW | Secure session transport and CSRF protection | Persisting a long-lived admin token in Web Storage is not an acceptable refresh fix. |
| SE-04 | P0 / NEW | Session continuity across controllers | No shared session authority for load-balanced controllers. |
| SE-05 | P1 / PARTIAL | CLI/API compatibility and identity conflicts | Bearer tokens,roles and grants exist;new sessions must preserve them. |

## Manual recovery,skip and corrective data

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| RC-01 | P0 / PARTIAL | Phase-aware fault classification | Error isolation/resume exists without complete skip/compensation diagnostics. |
| RC-02 | P0 / PARTIAL | Failed-transaction inspection and evidence retention | Journal/history details exist but not a full failed-queue transaction review. |
| RC-03 | P0 / NEW | Skip a complete destination transaction | Resume retries the original transaction;manual skipping is absent. |
| RC-04 | P0 / NEW | Controlled capture/decode gap recovery | Destination skipping cannot fix failures before complete events exist. |
| RC-05 | P0 / PARTIAL | Uncertain commit and checkpoint reconciliation | Automatic apply reconciles commits leading ACK;manual recovery has not reused it. |
| RC-06 | P0 / NEW | Failed-transaction before-image compensation | COMMON_CUT repair exists but does not reconstruct the failed transaction pre-state. |
| RC-07 | P0 / PARTIAL | Guided manual corrective data entry | Report-driven repair exists without independent failed-transaction/manual patches. |
| RC-08 | P0 / NEW | Consistency-gap ledger and honest watermarks | No durable distinction between applied/skipped history or gap lifecycle. |
| RC-09 | P0 / PARTIAL | Durable distributed recovery jobs | COMMON_CUT has local durable operations/receipts;distributed/new modes do not. |
| RC-10 | P1 / PARTIAL | Destination-specific recovery and retention | SQL,analytical and queue consistency protocols differ. |

## Source compatibility

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| SO-01 | P0 / PARTIAL | Source protocol and capability configuration | Neutral events/positions exist but factories/UI remain MySQL-oriented. |
| SO-02 | P1 / PARTIAL | MySQL5.7 supported profile | 5.7.44 basic evidence does not cover the required current-platform object/recovery/runtime matrix. |
| SO-03 | P1 / PARTIAL | MySQL8.0 current V3 acceptance | Historical8.0.46 V2/HA evidence is not current full V3 acceptance. |
| SO-04 | P1 / NEW | MySQL8.2 compatibility and acceptance | No dedicated complete8.2 native evidence found;8.0/8.4 cannot substitute. |
| SO-05 | P1 / PARTIAL | MySQL8.4 expanded compatibility | Representative8.4 V3/recovery evidence is not every log/auth/topology/destination combination. |
| SO-06 | P1 / NEW | PostgreSQL source adapter | Catalog says PLANNED;a PG sink driver is not a PG source. |
| SO-07 | P1 / NEW | Oracle source adapter | Catalog says PLANNED;no native snapshot/CDC implementation. |

## Java runtime compatibility

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| JV-01 | P0 / PARTIAL | Java8/11/17/21/25 runnable releases | Java8 baseline and an older ten-profile SQL matrix exist;current full release is not covered. |
| JV-02 | P1 / PARTIAL | Cross-JDK source/sink/recovery matrix | Ten profiles cover one keyed ASCII table/PG sink,not all adapters. |
| JV-03 | P1 / PARTIAL | Driver isolation,dependencies and TLS compatibility | Vendor isolation/artifact checks exist without all-JDK coverage. |
| JV-04 | P1 / NEW | Multi-JDK deployment and mixed-version upgrades | Benchmarks select JREs;production/mixed-cluster upgrade policies are not accepted. |

## Complete documentation

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| DO-01 | P0 / PARTIAL | Bilingual traceable SDD baseline | This change creates the v0.1 inventory;module designs,spec change control and implementation evidence closure remain open. |
| DO-02 | P1 / PARTIAL | Deployment and cluster operations docs | Existing deployment artifacts do not cover new cluster control/session models. |
| DO-03 | P1 / PARTIAL | Recovery scenarios and FAQ | Existing reconciliation FAQ does not cover new skip,patch and distributed faults. |
| DO-04 | P1 / PARTIAL | Configuration/API/compatibility and upgrade docs | Partial handbooks lack new APIs and a unified profile index. |
| DO-05 | P1 / PARTIAL | Documentation and evidence release gates | Archives/hash/preview checks exist without a complete requirement release gate. |

## Preserved earlier scope

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| LG-01 | P1 / PARTIAL | Domestic transactional database matrix | Initial openGauss/DM/Kingbase/GBase8c profiles exist;distributed GaussDB,complete OceanBase recovery and GBase8a/8s remain open. |
| LG-02 | P1 / PARTIAL | Nonempty adoption,constraints,cutover/failback | Initial destinations must be empty;repair completion is not cutover. |
| LG-03 | P1 / PARTIAL | ClickHouse/Doris/Hive production profiles | Initial materialization/recovery exists;cluster/security/capacity/JDK/new recovery profiles remain open. |
| LG-04 | P1 / PARTIAL | Queue cluster and recovery profiles | Initial transports exist for all confirmed queues;complete cluster/TLS/capacity coverage is open. |
| LG-05 | P0 / PARTIAL | Optional storage and cross-node reachability | Local/external journals exist;authority/reports/sessions/control-store relocation and HA boundaries are not unified. |
| LG-06 | P1 / PARTIAL | Live K8s/CSI and node-fault acceptance | Helm/native static checks do not establish live-cluster safety. |
| LG-07 | P1 / PARTIAL | Large catalogs,transactions and hardware standards | Small benchmark tools exist;large-transaction/catalog/cache/capacity standards remain incomplete. |
| LG-08 | P1 / PARTIAL | Historical DDL,types,indexes and state migration | Supported objects/index conversion and v2 compatibility exist;full dynamic DDL,types and explicit migration/rollback remain open. |
| LG-09 | P1 / PARTIAL | Report retention and real-browser acceptance | Summaries/details/DOM/HTTP exist;full catalogs,cleanup,visual/accessibility evidence do not. |
| LG-10 | P2 / PARTIAL | External identity,immutable audit and Apache preparation | Local accounts/hash-chained audit exist;external identity/anchors,licenses/NOTICE/SBOM/contribution workflows remain open. |

## Baseline evidence index

| ID | Existing evidence/code (not completion) |
|---|---|
| CP-01 | [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) / [TaskWorker.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskWorker.java.txt) |
| CP-02 | [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) |
| CP-03 | [TaskWorker.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskWorker.java.txt) / [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) |
| CP-04 | [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) / [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) |
| CP-05 | [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) / [account-management.md](/reference/zh-CN/account-management.html) / [security-audit.md](/reference/zh-CN/security-audit.html) |
| CP-06 | [app.js](/reference-files/sync-app/src/main/resources/console/app.js.txt) / [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) |
| CP-07 | [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) / [TaskWorker.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskWorker.java.txt) |
| SE-01 | [app.js](/reference-files/sync-app/src/main/resources/console/app.js.txt) |
| SE-02 | [app.js](/reference-files/sync-app/src/main/resources/console/app.js.txt) / [account-management.md](/reference/zh-CN/account-management.html) |
| SE-03 | [app.js](/reference-files/sync-app/src/main/resources/console/app.js.txt) / [ConsoleServer.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/ConsoleServer.java.txt) |
| SE-04 | [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) |
| SE-05 | [app.js](/reference-files/sync-app/src/main/resources/console/app.js.txt) / [AccessControl.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/AccessControl.java.txt) |
| RC-01 | [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) / [FanoutDispatcher.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/FanoutDispatcher.java.txt) |
| RC-02 | [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) / [managed-validation.md](/reference/zh-CN/managed-validation.html) |
| RC-03 | [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) / [JdbcSink.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcSink.java.txt) |
| RC-04 | [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) / [reconciliation-workflow.md](/reference/zh-CN/reconciliation-workflow.html) |
| RC-05 | [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) / [FanoutDispatcher.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/FanoutDispatcher.java.txt) / [README.md](/reference/verification/2026-11-16-managed-repair/README.html) |
| RC-06 | [README.md](/reference/verification/2026-11-16-managed-repair/README.html) / [common-cut-repair.md](/reference/zh-CN/common-cut-repair.html) |
| RC-07 | [README.md](/reference/verification/2026-11-16-managed-repair/README.html) / [RepairRequest.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/RepairRequest.java.txt) |
| RC-08 | [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) / [reconciliation-workflow.md](/reference/zh-CN/reconciliation-workflow.html) |
| RC-09 | [TaskService.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/TaskService.java.txt) / [README.md](/reference/verification/2026-11-16-managed-repair/README.html) |
| RC-10 | [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) / [messaging-v3.md](/reference/zh-CN/messaging-v3.html) |
| SO-01 | [AdapterCatalog.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java.txt) / [SourceAdapter.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/SourceAdapter.java.txt) |
| SO-02 | [validation.md](/reference/validation.html) / [mysql57-run.sh](/reference-files/tests/mysql57-run.sh.txt) |
| SO-03 | [validation.md](/reference/validation.html) / [matrix.sh](/reference-files/tests/matrix.sh.txt) |
| SO-04 | [AdapterCatalog.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java.txt) / [matrix.sh](/reference-files/tests/matrix.sh.txt) |
| SO-05 | [validation.md](/reference/validation.html) / [pipeline-v3.md](/reference/zh-CN/pipeline-v3.html) |
| SO-06 | [AdapterCatalog.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java.txt) / [SourceAdapter.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/SourceAdapter.java.txt) |
| SO-07 | [AdapterCatalog.java](/reference-files/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java.txt) |
| JV-01 | [performance.md](/reference/zh-CN/performance.html) / [matrix.json](/reference-files/docs/benchmarks/2026-11-15-runtime/matrix.json) |
| JV-02 | [performance.md](/reference/zh-CN/performance.html) |
| JV-03 | [verify-artifact.py](/reference-files/tests/verify-artifact.py.txt) / [performance.md](/reference/zh-CN/performance.html) |
| JV-04 | [performance.md](/reference/zh-CN/performance.html) / [values.yaml](/reference-files/deploy/helm/rivomesh/values.yaml) |
| DO-01 | [requirements-and-decisions.md](/reference/zh-CN/requirements-and-decisions.html) / [implementation-status.md](/reference/zh-CN/implementation-status.html) |
| DO-02 | [rivomesh](https://github.com/zhangjiayin/rivomesh/tree/main/deploy/helm/rivomesh) / [kubernetes](https://github.com/zhangjiayin/rivomesh/tree/main/deploy/kubernetes) / [console-and-deployment.md](/reference/zh-CN/console-and-deployment.html) |
| DO-03 | [managed-repair.md](/reference/zh-CN/managed-repair.html) / [recovery.md](/reference/recovery.html) |
| DO-04 | [pipeline-v3.md](/reference/zh-CN/pipeline-v3.html) / [validation.md](/reference/en/validation.html) |
| DO-05 | [verify-artifact.py](/reference-files/tests/verify-artifact.py.txt) / [README.md](/reference/verification/2026-11-16-managed-repair/README.html) |
| LG-01 | [implementation-status.md](/reference/zh-CN/implementation-status.html) / [gaussdb-index-policy.md](/reference/zh-CN/gaussdb-index-policy.html) |
| LG-02 | [platform-design.md](/reference/zh-CN/platform-design.html) / [gaussdb-index-policy.md](/reference/zh-CN/gaussdb-index-policy.html) |
| LG-03 | [clickhouse-v3.md](/reference/zh-CN/clickhouse-v3.html) / [doris-v3.md](/reference/zh-CN/doris-v3.html) / [hive-v3.md](/reference/zh-CN/hive-v3.html) |
| LG-04 | [messaging-v3.md](/reference/zh-CN/messaging-v3.html) / [classic-v3.md](/reference/zh-CN/classic-v3.html) |
| LG-05 | [pipeline-v3.md](/reference/zh-CN/pipeline-v3.html) / [JdbcJournal.java](/reference-files/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java.txt) |
| LG-06 | [rivomesh](https://github.com/zhangjiayin/rivomesh/tree/main/deploy/helm/rivomesh) / [kubernetes](https://github.com/zhangjiayin/rivomesh/tree/main/deploy/kubernetes) |
| LG-07 | [performance.md](/reference/zh-CN/performance.html) / [benchmark.py](/reference-files/tests/benchmark.py.txt) |
| LG-08 | [pipeline-v3.md](/reference/zh-CN/pipeline-v3.html) / [rename-migration.md](/reference/zh-CN/rename-migration.html) |
| LG-09 | [README.md](/reference/verification/2026-11-16-managed-repair/README.html) / [managed-validation.md](/reference/zh-CN/managed-validation.html) |
| LG-10 | [account-management.md](/reference/zh-CN/account-management.html) / [security-audit.md](/reference/zh-CN/security-audit.html) |
