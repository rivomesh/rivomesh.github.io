---
kind: docs
locale: zh
title: "11-16-common-cut-repair · COMMON_CUT SQL repair / 共同校验点 SQL 修复"
sourcePath: docs/verification/2026-11-16-common-cut-repair/README.md
---

# COMMON_CUT SQL repair / 共同校验点 SQL 修复

The first COMMON_CUT repair CLI passed the complete four-journal native matrix on2026-11-16. Managed repair UI/jobs are not implemented. Business targets in this matrix are MySQL8.4 and PostgreSQL17, never distributed GaussDB. Full Rivomesh completion is not claimed.

Final candidate JAR SHA256 `154e2b0dc0896bf8aba7d73079eed6f2030310debd71834e22bde51082275872`,187736240bytes. Root build:198app+2Classic SDK=200cases,zero failures/errors/skips. Actual-JAR-first:198app cases independently pass. DOM:46pass. Artifact and static deployment/preview checks pass. Private preserved binary:target/release-evidence/repair-core-final.jar.

The receipt primary-key validation initially failed six H2 fixture cases because unquoted column names are exposed in uppercase. receipt-key-case-failed.log retains this failure. The final code normalizes vendor metadata names before comparing the exact four-column key; it does not bypass key validation. New tests also reject missing receipt primary keys and modified receipt roots. Nine repair-focused unit cases pass in the final build; repeated runs are not extra distinct scenarios.

## Real databases, process loss and replay

native-local/mysql/postgresql/gauss.log run the complete previous cut, source seal, typed SQL comparison and managed HTTP/cancellation/retry suite, then add repair. Journals are LOCAL/H2 and EXTERNAL MySQL,PostgreSQL,openGauss. Business targets remain MySQL8.4/PostgreSQL17. Source is MySQL8.4 across two databases. The actual distributable stays frozen across all profiles; no fake business backend or production fault hook is used. Matrix host process exits0 after all three external profiles; LOCAL also exits0. Each log includes the final artifact gate and fixture removal.

1. The managed third validation selects both SQL targets after intentional missing/extra/changed keyed rows and wrong keyless occurrence IDs. Scope has four differing target/table pairs; an untouched ledger on each target still matches. Administrator raw-detail paging/VIEWER refusal still passes.
2. The source MySQL container is actually stopped before planning/execution and restarted only after repair checks. The actual fat-JAR CLI produces/persists a plan; a changed approval hash is refused. The plan binds report seal,cut,scope,counts,roots and limits without exposing raw rows.
3. Additional live PostgreSQL drift is refused,then restored to the historical before state. A real PostgreSQL CHECK rejects the missing-row insert after repair deletes;the whole table rolls back to its original root. Removing that fixture CHECK permits retry.
4. A native-only JDBC wrapper delegates every statement and real PostgreSQL commit,then throws SQLRecoverableException to simulate the lost reply. The destination really contains the repaired root. This is a commit-reply injection over a real database,not a TCP proxy/network-fault claim.
5. Actual child JVMs repair MySQL. The test wrapper blocks immediately before real commit,or immediately after real commit and before the caller receives its reply. The parent observes the respective marker and sends SIGKILL. Before-commit kill leaves the original root;after-commit kill leaves the repaired root. Child report/journal/target resources release sufficiently for real retry.
6. Normal execution resolves the two committed receipts and repairs the remaining keyless tables. All four target roots exactly equal sealed-source roots,including signed microsecond TIME,JSON and keyless occurrence IDs. Every destination checkpoint remains byte-for-byte equal to its saved epoch/sequence/transaction ID/hash. A separate actual fat-JAR CLI replay returns alreadyApplied=true for all four tables.
7. The controller is closed/reopened; desired PAUSED and historical reports/audit survive. Repair never automatically resumes or changes the old report to MATCH.

receipt-results.log independently reads private persisted CLI receipt responses/controller registries/report summaries without exporting business values. Each mode has4receipts,6deletes,6inserts,confirmed before/after commit child markers,8managed operations and3historical reports containing14,16,27staged rows. Last report still records4missing/4extra/2changed across6table results after repair,as historical evidence should.

## Limits and security boundaries

These are small,specified profiles with synchronizer-created tables and no triggers/foreign keys. Dependency discovery/adoption is not complete; operators must verify no such objects were added later. Initial CLI actor IDs are trusted host assertions,not Web authentication or controller audit. Authenticated reviewed repair UI/durable jobs/cancellation,failed-transaction before-image compensation,manual skip,full dependency plans,nonempty takeover,cutover and complete vendor/security/capacity/HA matrices remain pending.

Each table commits locally with its own native receipt;previously committed tables are not rolled back if a later table fails. Journal pause locking is not distributed2PC. Logical quotas do not replace filesystem hard limits;SIGKILL can leave private probe directories and full retention/cleanup remains pending. Receipts resolve historical commits,not current equality after later resume. Other SQL vendors,analytical/queue repair and distributed GaussDB targets are not established by this matrix. CLI plan metadata currently retains full certificates (8MiB ceiling);huge-catalog planning remains open.

Docker preview health/readiness,seven exact assets,ADMIN authentication/unauthorized refusal and copied JAR hash pass after native acceptance. Only the requested preview remains;all owned temporary fixture containers,volumes and networks were removed. Unrelated services were untouched. No browser screenshot/accessibility acceptance is claimed. TODO remains unchanged,SHA256 `0e77e9ea608a9fedd041851753dc6b59f462c49ee86151b750692bac7e6ad4f7`.

[中文操作手册](/docs/zh/reference/common-cut-repair.html) / [English handbook](/docs/en/reference/common-cut-repair.html).
