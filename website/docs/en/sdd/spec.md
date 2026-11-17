---
kind: docs
locale: en
title: "Requirements"
sourcePath: docs/sdd/001-control-recovery-compatibility/spec.en.md
---

# Rivomesh SDD requirements and incomplete scope

RM-SDD-001 · v0.5 · 2026-11-17 · IMPLEMENTING

Implementation in progress:48 tracked requirements,6 DONE,42 open (9 NEW,33 PARTIAL). SE-04 shared sessions accepted; CP-05 partial; global task authority/remote execution remain open. See [shared-access evidence](/docs/zh/evidence/2026-11-16-shared-access.html).

[Baseline/decisions](/docs/en/sdd/plan.html) · [Tasks](/docs/en/sdd/tasks.html) · [Acceptance](/docs/en/sdd/acceptance.html) · [中文](/docs/zh/sdd/spec.html)

## Unified cluster control

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| CP-01 | P0 / DONE | Global node registry and state | Shared registry passes PostgreSQL/MySQL two-node,kill/rejoin and storage-outage acceptance;global task authority/commands remain CP-02/03. |
| CP-02 | P0 / PARTIAL | Global task/configuration authority | Shared configuration authority,authorized paging,observations and internal cross-entry control accepted;public runtime/UI,migration/import and full configuration integration remain open. |
| CP-03 | P0 / PARTIAL | Durable cross-node command routing | Durable admission,fixed-owner TaskService execution,receipt recovery and cancellation have native SQL evidence;public cross-node HTTP,startup recovery and full business-chain acceptance remain open. |
| CP-04 | P0 / PARTIAL | Failover,fencing and placement | Worker leases/epochs exist;global scheduling,remote lifecycle and rolling-upgrade protocols do not. |
| CP-05 | P0 / PARTIAL | Shared authorization,audit and secret references | Shared accounts/grants/hash-chained audit and Worker environment filtering exist; complete remote correlation, least-secret references and process/filesystem isolation remain open. |
| CP-06 | P1 / PARTIAL | Cluster logs,metrics and diagnostics | Local task/backlog/error UI exists without remote aggregation. |
| CP-07 | P0 / NEW | Control-plane HA and worker independence | A local controller lock is not HA;controller shutdown stops child workers. |

## Persistent login

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| SE-01 | P0 / DONE | Session survives page reload | Single-controller reload/new-page restoration complete;cross-controller continuity remains SE-04. |
| SE-02 | P0 / DONE | Session expiry,logout and revocation | Expiry,logout,directory-revision revocation and optional browser persistence complete;memory sessions expire on controller restart. |
| SE-03 | P0 / DONE | Secure session transport and CSRF protection | Protected cookies,Origin/CSRF and real TLS-proxy acceptance complete;the proxy terminates production TLS. |
| SE-04 | P0 / DONE | Session continuity across controllers | Shared SQL sessions passed two-controller HTTPS/revocation/kill/reopen/store-outage acceptance on PostgreSQL/MySQL; global task control remains CP-02/03. |
| SE-05 | P1 / DONE | CLI/API compatibility and identity conflicts | Bearer compatibility,no-fallback/conflict rules,grant checks,logout races and self-rotation complete. |

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
| DO-01 | P0 / PARTIAL | Bilingual traceable SDD baseline | This change creates the v0.5 inventory;module designs,spec change control and implementation evidence closure remain open. |
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
| CP-01 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) / [TaskWorker.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskWorker.java) |
| CP-02 | P0 / PARTIAL | Global task/configuration authority | Shared configuration authority,authorized paging,observations and internal cross-entry control accepted;public runtime/UI,migration/import and full configuration integration remain open. |
| CP-03 | P0 / PARTIAL | Durable cross-node command routing | Durable admission,fixed-owner TaskService execution,receipt recovery and cancellation have native SQL evidence;public cross-node HTTP,startup recovery and full business-chain acceptance remain open. |
| CP-04 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) |
| CP-05 | P0 / PARTIAL | Shared authorization,audit and secret references | Shared accounts/grants/hash-chained audit and Worker environment filtering exist; complete remote correlation, least-secret references and process/filesystem isolation remain open. |
| CP-06 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) / [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) |
| CP-07 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) / [TaskWorker.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskWorker.java) |
| SE-01 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) |
| SE-02 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) / [account-management.md](/docs/zh/reference/account-management.html) |
| SE-03 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) / [ConsoleServer.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/ConsoleServer.java) |
| SE-04 | P0 / DONE | Session continuity across controllers | Shared SQL sessions passed two-controller HTTPS/revocation/kill/reopen/store-outage acceptance on PostgreSQL/MySQL; global task control remains CP-02/03. |
| SE-05 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) / [AccessControl.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AccessControl.java) |
| RC-01 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [FanoutDispatcher.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/FanoutDispatcher.java) |
| RC-02 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [managed-validation.md](/docs/zh/reference/managed-validation.html) |
| RC-03 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [JdbcSink.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcSink.java) |
| RC-04 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [reconciliation-workflow.md](/docs/zh/reference/reconciliation-workflow.html) |
| RC-05 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [FanoutDispatcher.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/FanoutDispatcher.java) / [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) |
| RC-06 | [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) / [common-cut-repair.md](/docs/zh/reference/common-cut-repair.html) |
| RC-07 | [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) / [RepairRequest.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/RepairRequest.java) |
| RC-08 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [reconciliation-workflow.md](/docs/zh/reference/reconciliation-workflow.html) |
| RC-09 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) / [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) |
| RC-10 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [messaging-v3.md](/docs/zh/reference/messaging-v3.html) |
| SO-01 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java) / [SourceAdapter.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/SourceAdapter.java) |
| SO-02 | [validation.md](/docs/zh/reference/validation.html) / [mysql57-run.sh](https://github.com/rivomesh/rivomesh/blob/main/tests/mysql57-run.sh) |
| SO-03 | [validation.md](/docs/zh/reference/validation.html) / [matrix.sh](https://github.com/rivomesh/rivomesh/blob/main/tests/matrix.sh) |
| SO-04 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java) / [matrix.sh](https://github.com/rivomesh/rivomesh/blob/main/tests/matrix.sh) |
| SO-05 | [validation.md](/docs/zh/reference/validation.html) / [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) |
| SO-06 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java) / [SourceAdapter.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/SourceAdapter.java) |
| SO-07 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java) |
| JV-01 | [performance.md](/docs/zh/reference/performance.html) / [matrix.json](/files/docs/benchmarks/2026-11-15-runtime/matrix.json) |
| JV-02 | [performance.md](/docs/zh/reference/performance.html) |
| JV-03 | [verify-artifact.py](https://github.com/rivomesh/rivomesh/blob/main/tests/verify-artifact.py) / [performance.md](/docs/zh/reference/performance.html) |
| JV-04 | [performance.md](/docs/zh/reference/performance.html) / [values.yaml](/files/deploy/helm/rivomesh/values.yaml) |
| DO-01 | [requirements-and-decisions.md](/docs/zh/reference/requirements-and-decisions.html) / [implementation-status.md](/docs/zh/reference/implementation-status.html) |
| DO-02 | [rivomesh](https://github.com/rivomesh/rivomesh/tree/main/deploy/helm/rivomesh) / [kubernetes](https://github.com/rivomesh/rivomesh/tree/main/deploy/kubernetes) / [console-and-deployment.md](/docs/zh/reference/console-and-deployment.html) |
| DO-03 | [managed-repair.md](/docs/zh/reference/managed-repair.html) / [recovery.md](/docs/zh/reference/recovery.html) |
| DO-04 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [validation.md](/docs/en/reference/validation.html) |
| DO-05 | [verify-artifact.py](https://github.com/rivomesh/rivomesh/blob/main/tests/verify-artifact.py) / [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) |
| LG-01 | [implementation-status.md](/docs/zh/reference/implementation-status.html) / [gaussdb-index-policy.md](/docs/zh/reference/gaussdb-index-policy.html) |
| LG-02 | [platform-design.md](/docs/zh/reference/platform-design.html) / [gaussdb-index-policy.md](/docs/zh/reference/gaussdb-index-policy.html) |
| LG-03 | [clickhouse-v3.md](/docs/zh/reference/clickhouse-v3.html) / [doris-v3.md](/docs/zh/reference/doris-v3.html) / [hive-v3.md](/docs/zh/reference/hive-v3.html) |
| LG-04 | [messaging-v3.md](/docs/zh/reference/messaging-v3.html) / [classic-v3.md](/docs/zh/reference/classic-v3.html) |
| LG-05 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) |
| LG-06 | [rivomesh](https://github.com/rivomesh/rivomesh/tree/main/deploy/helm/rivomesh) / [kubernetes](https://github.com/rivomesh/rivomesh/tree/main/deploy/kubernetes) |
| LG-07 | [performance.md](/docs/zh/reference/performance.html) / [benchmark.py](https://github.com/rivomesh/rivomesh/blob/main/tests/benchmark.py) |
| LG-08 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [rename-migration.md](/docs/zh/reference/rename-migration.html) |
| LG-09 | [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) / [managed-validation.md](/docs/zh/reference/managed-validation.html) |
| LG-10 | [account-management.md](/docs/zh/reference/account-management.html) / [security-audit.md](/docs/zh/reference/security-audit.html) |

v0.5: CP-02/03 PARTIAL · [Internal foundations evidence](/docs/zh/evidence/2026-11-17-global-control-foundations.html). Public runtime integration remains open.
