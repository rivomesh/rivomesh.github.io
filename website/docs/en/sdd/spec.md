---
kind: docs
locale: en
title: "Requirements"
sourcePath: docs/sdd/001-control-recovery-compatibility/spec.en.md
---

# Rivomesh SDD requirements and incomplete scope

RM-SDD-001 · v0.9 · 2026-11-17 · IMPLEMENTING

Implementation:48requirements,13DONE,30PARTIAL,5NEW;35open. RC-02/RC-05/RC-03/RC-06/RC-07/RC-08 bounded profiles are accepted;automatic takeover, recovery jobs and complete matrices remain tracked.

[Baseline/decisions](/docs/en/sdd/plan.html) · [Tasks](/docs/en/sdd/tasks.html) · [Acceptance](/docs/en/sdd/acceptance.html) · [中文](/docs/zh/sdd/spec.html)

## Unified cluster control

| ID | Priority/status | Requirement | Gap |
|---|---|---|---|
| CP-01 | P0 / DONE | Global node registry and state | Shared registry passes PostgreSQL/MySQL two-node,kill/rejoin and storage-outage acceptance;global task authority/commands remain CP-02/03. |
| CP-02 | P0 / PARTIAL | Global task/configuration authority | Opt-in fixed-owner global HTTP/UI,shared configuration and history are wired;legacy import,complete business and scale acceptance remain open. |
| CP-03 | P0 / PARTIAL | Durable cross-node command routing | Public durable commands,offline STOP,actual multi-target validation/repair and original UNKNOWN upgrade recovery accepted;complete cancellation/fault/migration/capacity matrices remain open. |
| CP-04 | P0 / PARTIAL | Failover,fencing and placement | Worker leases/epochs exist;global scheduling,remote lifecycle and rolling-upgrade protocols do not. |
| CP-05 | P0 / PARTIAL | Shared authorization,audit and secret references | Shared accounts/grants/hash-chained audit and Worker environment filtering exist; complete remote correlation, least-secret references and process/filesystem isolation remain open. |
| CP-06 | P1 / PARTIAL | Cluster logs,metrics and diagnostics | Global observations,owner/unknown state,pagination and maintenance results exist;complete node/target filters,remote logs and diagnostics search remain open. Worker process liveness versus journal-claim readiness needs clearer presentation. |
| CP-07 | P0 / DONE | Control-plane HA and worker independence | Protocol4 separated profile accepted on PG/MySQL control stores,all-controller loss/pending-command recovery,store outage,same-Worker continuation and nonroot runtime;default combined remains coupled and failover/other storage-adapter profiles are separate. |

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
| RC-01 | P0 / PARTIAL | Phase-aware fault classification | Initial destination preparation/snapshot and delivery phases pass dual-entry native fault/restart acceptance;complete source phases and manual-action diagnostics remain open. |
| RC-02 | P0 / DONE | Failed-transaction inspection and evidence retention | Accepted bounded MySQL8.4,fixed original Agent/LOCAL journal,PG/MySQL control profile:ADMIN whole-transaction review,positions/historical columns/images,authorized pages and durable evidence surviving restart/journal GC. Catalog automation,other profiles,Agent migration and execution semantics remain separately tracked. |
| RC-03 | P0 / DONE | Skip a complete destination transaction | Protocol7 bounded profile accepted:Java8,MySQL8.4 two-database source,original Agent/LOCAL journal,PostgreSQL business target and PG/MySQL control stores. Complete transaction skip,native commit/source ACK failure,Agent SIGKILL/reopen and cross-entry recovery pass. Other targets/full matrices remain RC-10/LG-01. |
| RC-04 | P0 / NEW | Controlled capture/decode gap recovery | Destination skipping cannot fix failures before complete events exist. |
| RC-05 | P0 / DONE | Uncertain commit and checkpoint reconciliation | Protocol6 original-Agent/LOCAL-journal bounded profile accepted on PG/MySQL control stores:whole-task pause,fresh evidence,native fencing,cross-entry ADMIN confirmation,atomic ACK/receipt and idempotent retry,with both pauses retained. Skip,compensation and full additional matrices remain separate. |
| RC-06 | P0 / DONE | Failed-transaction before-image compensation | The bounded SQL profile passed. Administrators review table scope and mutation counts across entries, restore the before-images and explicitly resume the original transaction. PostgreSQL passes real CDC and MySQL passes native contracts. RC-10 tracks other destinations. |
| RC-07 | P0 / DONE | Guided manual corrective data entry | The bounded SQL profile passed. Typed entry and JSON import support administrator review of before/after values, exact identities, atomic batches and resumption of the original transaction. PostgreSQL passes real CDC and MySQL passes native checks. RC-10 tracks other destinations. |
| RC-08 | P0 / DONE | Consistency-gap ledger and honest watermarks | First SQL profile accepted:durable gaps,reviewed plans,cross-entry approval/cancellation,fresh full-table scans,atomic receipts and distinct safe coverage/contiguous application. Verification preserves SKIP and the original applied prefix without resuming. Other target protocols remain RC-10/LG-03/LG-04. |
| RC-09 | P0 / PARTIAL | Durable distributed recovery jobs | Cross-node planning, approval, evidence and destination receipts are available. Cancellation and process termination at compensation/correction commit boundaries remain open. |
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
| LG-08 | P1 / PARTIAL | Historical DDL,types,indexes and state migration | Supported objects and UNIQUE/GSI conversion exist;full dynamic DDL,complex types and backup/restore profiles remain open. The first release does not retain prerelease-candidate compatibility. |
| LG-09 | P1 / PARTIAL | Report retention and real-browser acceptance | Summaries/details/DOM/HTTP exist;full catalogs,cleanup,visual/accessibility evidence do not. |
| LG-10 | P2 / PARTIAL | External identity,immutable audit and Apache preparation | Local accounts/hash-chained audit exist;external identity/anchors,licenses/NOTICE/SBOM/contribution workflows remain open. |

## Baseline evidence index

| ID | Existing evidence/code (not completion) |
|---|---|
| CP-01 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/TaskService.java) / [TaskWorker.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/TaskWorker.java) |
| CP-02 | P0 / PARTIAL | Global task/configuration authority | Opt-in fixed-owner global HTTP/UI,shared configuration and history are wired;legacy import,complete business and scale acceptance remain open. |
| CP-03 | P0 / PARTIAL | Durable cross-node command routing | Public durable commands,offline STOP,actual multi-target validation/repair and original UNKNOWN upgrade recovery accepted;complete cancellation/fault/migration/capacity matrices remain open. |
| CP-04 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [TaskService.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/TaskService.java) |
| CP-05 | P0 / PARTIAL | Shared authorization,audit and secret references | Shared accounts/grants/hash-chained audit and Worker environment filtering exist; complete remote correlation, least-secret references and process/filesystem isolation remain open. |
| CP-06 | P1 / PARTIAL | Cluster logs,metrics and diagnostics | Global observations,owner/unknown state,pagination and maintenance results exist;complete node/target filters,remote logs and diagnostics search remain open. Worker process liveness versus journal-claim readiness needs clearer presentation. |
| CP-07 | [README.md](/docs/zh/evidence/baseline.html) / [OwnerRuntime.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/OwnerRuntime.java) |
| SE-01 | [app.js](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/resources/console/app.js) |
| SE-02 | [app.js](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/resources/console/app.js) / [account-management.md](/docs/zh/reference/account-management.html) |
| SE-03 | [app.js](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/resources/console/app.js) / [ConsoleServer.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/ConsoleServer.java) |
| SE-04 | [README.md](/docs/zh/evidence/baseline.html) / [browser-sessions.md](/docs/en/reference/browser-sessions.html) |
| SE-05 | [app.js](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/resources/console/app.js) / [AccessControl.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AccessControl.java) |
| RC-01 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [FanoutDispatcher.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/FanoutDispatcher.java) |
| RC-02 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [managed-validation.md](/docs/zh/reference/managed-validation.html) |
| RC-03 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [JdbcSink.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcSink.java) |
| RC-04 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [reconciliation-workflow.md](/docs/zh/reference/reconciliation-workflow.html) |
| RC-05 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [FanoutDispatcher.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/FanoutDispatcher.java) / [README.md](/docs/zh/evidence/baseline.html) |
| RC-06 | [transaction-compensation.md](/docs/en/reference/transaction-compensation.html) / [TransactionCompensation.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/TransactionCompensation.java) |
| RC-07 | [manual-correction.md](/docs/en/reference/manual-correction.html) / [CorrectionBatch.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/CorrectionBatch.java) |
| RC-08 | [gap-verification.md](/docs/en/reference/gap-verification.html) / [README.md](/docs/zh/evidence/baseline.html) |
| RC-09 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/TaskService.java) / [README.md](/docs/zh/evidence/baseline.html) |
| RC-10 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [messaging-v3.md](/docs/zh/reference/messaging-v3.html) |
| SO-01 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java) / [SourceAdapter.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/SourceAdapter.java) |
| SO-02 | [validation.md](/docs/zh/reference/validation.html) / [mysql57-run.sh](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/mysql57-run.sh) |
| SO-03 | [validation.md](/docs/zh/reference/validation.html) / [matrix.sh](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/matrix.sh) |
| SO-04 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java) / [matrix.sh](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/matrix.sh) |
| SO-05 | [validation.md](/docs/zh/reference/validation.html) / [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) |
| SO-06 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java) / [SourceAdapter.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/SourceAdapter.java) |
| SO-07 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java) |
| JV-01 | [performance.md](/docs/zh/reference/performance.html) / [baseline.json](/files/docs/verification/baseline.json) |
| JV-02 | [performance.md](/docs/zh/reference/performance.html) |
| JV-03 | [verify-artifact.py](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/verify-artifact.py) / [performance.md](/docs/zh/reference/performance.html) |
| JV-04 | [performance.md](/docs/zh/reference/performance.html) / [values.yaml](/files/deploy/helm/rivomesh/values.yaml) |
| DO-01 | [requirements-and-decisions.md](/docs/zh/reference/requirements-and-decisions.html) / [implementation-status.md](/docs/zh/reference/implementation-status.html) |
| DO-02 | [rivomesh](https://github.com/rivomesh/rivomesh/tree/5c545222c4175e8407196636725063861a69d4b2/deploy/helm/rivomesh) / [kubernetes](https://github.com/rivomesh/rivomesh/tree/5c545222c4175e8407196636725063861a69d4b2/deploy/kubernetes) / [console-and-deployment.md](/docs/zh/reference/console-and-deployment.html) |
| DO-03 | [managed-repair.md](/docs/zh/reference/managed-repair.html) / [recovery.md](/docs/zh/reference/recovery.html) |
| DO-04 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [validation.md](/docs/en/reference/validation.html) |
| DO-05 | [verify-artifact.py](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/verify-artifact.py) / [README.md](/docs/zh/evidence/baseline.html) |
| LG-01 | [implementation-status.md](/docs/zh/reference/implementation-status.html) / [gaussdb-index-policy.md](/docs/zh/reference/gaussdb-index-policy.html) |
| LG-02 | [platform-design.md](/docs/zh/reference/platform-design.html) / [gaussdb-index-policy.md](/docs/zh/reference/gaussdb-index-policy.html) |
| LG-03 | [clickhouse-v3.md](/docs/zh/reference/clickhouse-v3.html) / [doris-v3.md](/docs/zh/reference/doris-v3.html) / [hive-v3.md](/docs/zh/reference/hive-v3.html) |
| LG-04 | [messaging-v3.md](/docs/zh/reference/messaging-v3.html) / [classic-v3.md](/docs/zh/reference/classic-v3.html) |
| LG-05 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) |
| LG-06 | [rivomesh](https://github.com/rivomesh/rivomesh/tree/5c545222c4175e8407196636725063861a69d4b2/deploy/helm/rivomesh) / [kubernetes](https://github.com/rivomesh/rivomesh/tree/5c545222c4175e8407196636725063861a69d4b2/deploy/kubernetes) |
| LG-07 | [performance.md](/docs/zh/reference/performance.html) / [benchmark.py](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/benchmark.py) |
| LG-08 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [rename-migration.md](/docs/zh/reference/rename-migration.html) |
| LG-09 | [README.md](/docs/zh/evidence/baseline.html) / [managed-validation.md](/docs/zh/reference/managed-validation.html) |
| LG-10 | [account-management.md](/docs/zh/reference/account-management.html) / [security-audit.md](/docs/zh/reference/security-audit.html) |
