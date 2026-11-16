---
sourcePath: docs/verification/2026-11-16-managed-validation/README.md
---

# Managed validation jobs / 管理界面校验作业首批验收

2026-11-16. The first console workflow now starts/cancels/retries SQL row validation and reads table summaries with task grants, revision/request checks and report-linked audit. **Raw row detail/editing, reviewed repair, manual skip, constraint restoration, takeover/cutover and the full Rivomesh objective remain incomplete.** [中文手册](/reference/zh-CN/managed-validation.html) / [English manual](/reference/en/managed-validation.html).

## Final runtime and gates

Final JAR SHA256 `34a4675fe853e2976392d1909a9b45d551f0d939e9c82ae448988a6d7a93ce4b`,187705360bytes. `package-final.log`:185application+2Classic SDK=187root Java/SDK cases pass,0failure/error/skip. `release-unit-final.log`:185application cases pass independently with the actual distributable first. Repeated runs are not additional distinct scenarios. `ui.log`:44DOM cases pass. Deployment static checks pass. Artifact gates before/after native acceptance verify Java8 class levels, seven exact UI resources, SDK/driver integrity and runtime entries.

Production Java/UI stayed frozen from this accepted build through the complete native matrix. Session39940 exited0 after MYSQL,LOCAL,POSTGRESQL,GAUSS sequential runs; session44041 exited0 for release-first tests. Preserved private binary:target/release-evidence/managed-validation-final.jar. TODO remains SHA256 `0e77e9ea608a9fedd041851753dc6b59f462c49ee86151b750692bac7e6ad4f7`.

## Actual SQL/controller acceptance

`native-mysql.log`,`native-local.log`,`native-postgresql.log`,`native-gauss.log` repeat the same full scenario using EXTERNAL MySQL,LOCAL/H2,EXTERNAL PostgreSQL and EXTERNAL openGauss journals. MySQL8.4 is the source across two databases; PostgreSQL17 and a separate MySQL8.4 are destinations. openGauss here is a journal profile, not distributed GaussDB target acceptance.

The prior native cut/row suite passes on this runtime:actual source/metadata lock waits, MVCC after later source writes, deadlines, SIGKILL/unfinished cursor release, keyless negative-subsecond snapshot/CDC and virtual TIME values, private source seal, target-reader-holder SIGKILL and partial-scan discard, normal matches, actual SQL divergence and wrong occurrence IDs, comparison with the source actually stopped, physical fences, independent target outage/SQL repair/retry, CLI, persisted pause and missing-metadata refusal.

The new portion uses the real ConsoleServer/TaskService, real HTTP, actual fat-JAR Worker JVMs and actual databases; it does not inject a fake backend:

1. Create a fresh managed V3 task and observe a successful uninitialized status. For the MySQL journal, independently query information_schema and prove its new namespace is still absent before START. Worker START creates it and completes snapshots/CDC.
2. Submit ADMIN VALIDATE with revision,request ID,selected target and limits. The accepted response already contains the persisted report UUID. Replay the exact request; no extra job is created. Wait for actual row equality and read the summary by HTTP.
3. Explicitly resume using the current error version and publish another source row. Both real SQL targets must reach it before the next validation, proving the Worker completed preparation/CDC.
4. Hold an actual PostgreSQL ACCESS EXCLUSIVE table lock, submit another validation and observe pg_stat_activity waiting on a relation lock in its SQL reader. POST cancellation. The job records VALIDATION_CANCELLED; the complete source seal survives.
5. Release the external fixture lock, POST VALIDATE_RETRY and obtain equality using the same report UUID and original cut. This proves cancellation releases the reader's checkpoint connection rather than only changing UI state.
6. Close/reopen the actual controller and HTTP server. The completed report and desired PAUSED state survive. Read paged audit at a fixed through boundary and verify a VALIDATE_CANCEL event linked to that report ID. No restart automatically resumes the pipeline.

`managed-results.log` independently inspects the four private controller registries and eight complete summary projections without exporting raw values. Every mode has the exact six-operation sequence START,VALIDATE,RESUME,VALIDATE(cancelled),VALIDATE_CANCEL,VALIDATE_RETRY; two unique report IDs, with retry reusing the cancelled report. The reports contain14and16staged source+target rows,three table results each,zero differences,and final controller desired PAUSED.

## Unit/API and UI scope

The four ManagedValidationTest cases use a controllable fake database backend to verify durable request/scope/idempotency, stale revision refusal, other-task controls progressing while validation is blocked, persisted cancellation/audit/no resume, pending operation report-ID replay on controller restart,and actual HTTP ADMIN mutation/task-scoped summary authorization. Their restart case models the controller's completion gap by modifying a fixture registry; it is not an OS-level controller SIGKILL claim. Core source/target staging SIGKILL is separately native-tested above. Native controller reopen is graceful; broader controller/PVC/node-loss matrices remain open.

Three added DOM cases verify explicit SQL target/budget submission (excluding MQ), operator/viewer mutation restrictions and cancellation revision/action semantics. Existing41DOM cases also pass. `visual-status.log`:browser automation was unavailable and native Chrome connection attempts timed out; no screenshot-level visual/accessibility acceptance is claimed.

## Retained failures and corrections

- `path-fixture-failed.log`:the new unit fixture serialized a standalone local-journal path into a managed task and was correctly rejected with LOCAL_JOURNAL_MIGRATION_REQUIRED. Four tests failed before reaching the workflow. The fixture now omits the path,as the existing managed importer requires; no migration protection was weakened. Focused and full final tests pass.
- `ui-bridge-failed.log`:the initial module accessed private app bindings directly; the strict DOM harness raised messages-is-not-defined. It now uses the existing public RivomeshConfiguration bridge. Final44DOM cases pass.
- `runtime-interrupted.log`:an external execution-runtime reset terminated a matrix host command with143. That run is not accepted; no surviving host test process was found and its own fixtures were cleaned before a complete rerun.
- `new-mysql-journal-failed.log` and `new-mysql-journal-state.log`:intermediate runtime b90a801f… could not START a task using a fresh external MySQL namespace because its read-only metadata check returned SQL_42000_1049. The final code recognizes exactly1049/42000 only during qualified metadata verification after a successful connection,and only for an EXTERNAL MYSQL journal. Connection/default-catalog errors and other42000errors still propagate. Status performs no DDL; the Worker owns initialization. The final native MySQL case proves both no pre-START namespace creation and successful initialization/validation/recovery.

## Deployment and remaining boundaries

`preview.log`,`preview-http.log`,`preview-post-native.log`:Docker preview is healthy at http://127.0.0.1:18088 and serves this copied final backend/driver JAR plus seven source UI files. ADMIN authentication and unauthorized API refusal pass. Credentials stay private and are omitted. All temporary native containers/networks/volumes were removed; only the development console is intentionally retained. Unrelated services were untouched; no global prune or sysctl changes.

ADMIN starts/cancels/retries; task-granted VIEWER/OPERATOR read summaries. Report storage is private plaintext local H2,not encrypted or externally anchored. Native acceptance covers small specified profiles,not capacity/soak/security/cluster matrices. Physical quotas still need filesystem limits; source MVCC lost before sealing needs a new cut. Source DB/vendor/version extensions,all vendor row-reader modes,raw-row permissions/UI,reviewed idempotent repair receipts,full report catalogs/retention,nonempty adoption/manual compensation/skip,cutover/failback,controller HA/live K8s/CSI,hardware standards and remaining project-wide work stay open.
