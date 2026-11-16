---
kind: docs
locale: zh
title: "11-16-managed-repair · Managed repair / 管理界面修复"
sourcePath: docs/verification/2026-11-16-managed-repair/README.md
---

# Managed repair / 管理界面修复

The first managed-repair profiles passed native acceptance on2026-11-16. Final candidate SHA256 `10d95a3990835f2286f036b962d88fc8533ade427753ad9961ef1429988a88e2`,187749622bytes. Root package passes205app+2Classic SDK=207cases;actual-JAR-first independently passes205app cases;49DOM pass. The accepted native results below use this exact final candidate;the old69c07f7d… runtime failed its first dependency-message case and is not accepted here.

[中文操作手册](/docs/zh/reference/managed-repair.html) / [English handbook](/docs/en/reference/managed-repair.html).

## Retained intermediate failures

- pause-fixture-failed.log:the fake backend did not override V3 pause and attempted an actual database connection. The new paused-admission test timed out. Only the fixture was corrected;the requirement to pause before repair execution remains.
- unexpected-plan-failed.log:the real PostgreSQL trigger was correctly refused by the older general shape guard,but its TARGET_TRIGGERS_REQUIRE_PLAN was mapped to CONTROL_FAILED. The expected explicit dependency-code assertion failed. No business repair occurred in that case.
- unexpected-plan-diagnosis.log:the same69c07f7d… binary was reproduced in a focused native run with a test-only backend wrapper delegating real database work unchanged. The trace identified JdbcSink.validateShape before the new dependency check. After capturing it,the diagnostic test container was intentionally killed;its137termination is not a passing result. All own fixtures were removed.
- outgoing-read-fixture-failed.log:the added unit case already observed REPAIR_DEPENDENCY_PLAN_REQUIRED,but its follow-up equality read was correctly refused by the ordinary reader's existing foreign-key guard. The fixture now verifies no receipt,removes only its temporary FK,and then verifies the unchanged root. Production read/repair guards were not weakened.

The final code runs repair dependency checks before general shape checks,both during planning/preflight and under the write transaction fence. General guards remain for normal synchronization/validation.

## Actual native scope

LOCAL/H2 runs the full existing barrier suite plus all managed workflows. EXTERNAL MYSQL,POSTGRESQL and openGauss journals run RIVOMESH_MANAGED_ONLY=true:typed real destination reads,the complete managed validation/cancellation/retry/difference workflow,the CLI repair commit-fault suite,and the new managed repair workflow. These focused runs do not repeat the separate source-lock-holder/process-loss and standalone pipeline sections. The new repair scenarios are identical across all four journals. Host LOCAL and the sequential external matrix both exit0. No production Java/UI changed across these runs. Preserved private binary:target/release-evidence/managed-repair-final.jar.

Source is MySQL8.4 across two databases;business destinations are PostgreSQL17 and MySQL8.4. openGauss is a journal profile,not distributed GaussDB business-target acceptance. The test-only TracingBackend delegates real database operations unchanged and emits diagnostics only for unexpected generic failures;this is not a fake business backend. Actual Worker JVMs use the distributable first.

## Managed repair acceptance

1. Resume after the prior actual CLI repair,create fresh keyed value divergence and wrong keyless occurrence identities on both SQL destinations,then submit real HTTP VALIDATE for both targets. Its sealed fourth report contains four differing destination/table pairs.
2. Add a real PostgreSQL DELETE trigger and separately a cascading incoming FK;both HTTP plan jobs fail with REPAIR_DEPENDENCY_PLAN_REQUIRED before writes. The FK child row remains. A real MySQL DELETE trigger is similarly refused. A temporary MySQL account with global SELECT and destination DML but without global TRIGGER is refused with REPAIR_METADATA_VISIBILITY_REQUIRED rather than treating hidden metadata as empty. Temporary objects/account are removed by the fixture.
3. Submit an authenticated plan request;the202response already contains the persistent plan UUID. Wait for completion and GET the review. The saved creator is the authenticated legacy-admin identity. A task-granted VIEWER cannot read the review or mutate repair. OPERATOR/VIEWER authorization is additionally tested through actual HTTP unit cases before backend invocation.
4. A wrong approval hash produces a failed job without repair. A stale task revision returns409 before admission. Stop the source MySQL container to prove the sealed report is sufficient for the remaining repair flow.
5. Hold a real PostgreSQL ACCESS EXCLUSIVE relation lock,submit correct REPAIR_EXECUTE,and observe the maintenance connection waiting in pg_stat_activity. Submit REPAIR_CANCEL and obtain REPAIR_CANCELLED while the external lock is still held. Release it and retry the exact same plan/hash through a new durable request.
6. The retry commits four destination-table receipts. Actual live roots equal sealed source roots,including keyless occurrence IDs. Root reads require the saved physical checkpoints;independent persisted receipt inspection also matches each checkpoint to the original plan certificate. No GTID/sequence is rewritten and desired state stays PAUSED.
7. Close/reopen the real controller and HTTP server. The reviewed plan,repair completion,old historical reports and durable pause survive. Audit remains readable. This is graceful controller reopen;the unit pending-operation recovery case models its completion gap by changing fixture status,not an OS controller SIGKILL claim.

The shared CLI portion additionally injects lost PostgreSQL commit replies over an actual vendor connection and SIGKILLs actual MySQL repair JVMs immediately before/after real commit. Native receipts resolve retry,with unchanged checkpoints. It restores both keyed and keyless data while the source is actually stopped.

managed-results.log independently reads private controller registries,plan files and report projections. Every profile has18operations,four final repair receipts,4deletes/4inserts,matching approval/plan/receipt hashes and original checkpoints,and desired PAUSED. Four historical reports retain14,16,27,27staged rows;repair does not rewrite their old differences. Raw business values,credentials and private databases are not exported.

## Unit,UI and deployment boundaries

Final package:205app+2Classic SDK=207root cases,zero failures/errors/skips. Actual-JAR-first:205app cases independently pass.49DOM cases pass,including explicit repair scope,current revision/hash submission,confirmation gating,text-only hostile names,logout clearing and restricted roles.12repair-core cases include outgoing/incoming FK refusal,trigger refusal,rollback,drift,receipt integrity and replay. Four managed-repair unit cases cover persisted plan identity/request replay,other-task progress,cancellation,modeled pending-plan restart and actual HTTP authorization/audit. Passing these cases does not establish all failure timings or capacity.

Docker preview runs this copied runtime plus seven exact source assets. Health/readiness,ADMIN authentication,unauthorized refusal,artifact integrity and static deployment checks pass. All own temporary containers/volumes/networks were removed;only the requested preview remains. Unrelated services were untouched. No screenshot/accessibility acceptance is claimed. TODO is unchanged,SHA256 `0e77e9ea608a9fedd041851753dc6b59f462c49ee86151b750692bac7e6ad4f7`.

Remaining:complete dependency planning (current behavior is refusal),role-only/granular MySQL metadata grants,repair budget UI,real-time receipt catalogs/retention,scratch cleanup,failed-transaction before-image compensation,manual skip/consistency gaps,nonempty adoption,constraint restoration,cutover,other vendors/security/capacity/controller-HA/liveK8s and the full Rivomesh objective. Local per-table receipts are not cross-database ACID. Journal disconnect/network partition and OS controller/node-loss matrices remain open.
