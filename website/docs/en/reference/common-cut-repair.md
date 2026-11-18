---
kind: docs
locale: en
title: "COMMON_CUT repair"
sourcePath: docs/en/common-cut-repair.md
---

# COMMON_CUT repair: initial CLI

The first MySQL8.4/PostgreSQL17 repair profile passed all four real journal modes. [Evidence](/docs/zh/evidence/baseline.html). Broader production/vendor/capacity acceptance remains incomplete. The console now offers authenticated plan review,execution,cancellation and retry;see [Managed repair](/docs/en/reference/managed-repair.html).

A completed, sealed SQL row report and its unchanged globally PAUSED cut are required. Initial execution is limited to MySQL/PostgreSQL transactional destinations owned by this task with completed snapshots and matching schemas. Only the synchronizer may write business tables, including during repair. Accepted initial tables are synchronizer-created with no triggers/foreign keys. The executor rejects detected triggers,incoming/outgoing FKs and PostgreSQL row policies/inheritance;MySQL requires verifiable metadata visibility. Full dependency migration planning is not implemented;see the managed handbook. Other vendors, analytical destinations and queues need separate repair protocols/acceptance.

A destination blocked on an earlier failed transaction cannot necessarily reach this cut. Fixing the SQL cause and retrying the original transaction remains its recovery path. Failed-transaction before-image compensation, manual skipping and explicit consistency-gap handling are pending; do not change GTIDs/checkpoints to bypass errors.

## Review and execution

Use the effective V3 task configuration and private report directory:

```sh
java -jar rivomesh.jar repair-plan config.yml /private/reports REPORT_UUID targetA/TABLE_ID,targetB/TABLE_ID operator-id
java -jar rivomesh.jar repair-execute config.yml /private/reports REPORT_UUID PLAN_UUID APPROVED_SHA256 operator-id REQUEST_UUID
```

Select explicit nonmatching target/table identities from the report, not SQL table names. The first command writes `REPORT_UUID/repair-plans/PLAN_UUID.json` and prints its review content/hash. Review exact table scope, schema/data roots, missing/extra/changed counts and budgets before passing its SHA256 to execution. Plans bind source seal, configuration fingerprint, generation, epoch, sequence, error version and physical destination checkpoints; they contain no raw business values. Keep report/plan files private. REQUEST_UUID is a UUID generated for this request.

CLI actor IDs are trusted host-operator assertions, not Web authentication, dual approval or controller audit. Do not expose this CLI through an anonymous HTTP wrapper. Authenticated managed repair with revision checks/durable jobs is separately implemented in the managed handbook.

Defaults:100000 differing identities,1GiB probe budget per table,4MiB row limit,a10minute paused write-phase budget. Report integrity checks and connection preflight take additional time;this is not a10minute whole-job deadline. Plans retain the full certificate with an8MiB file ceiling. Compact certificates/paged planning and UI budget editing remain pending. Logical quotas require filesystem/container hard quotas for physical enforcement.

## Transactions and recovery

Reports are rechecked for source seal, raw-row integrity, historical destination roots and plan identity. A journal job-row lock prevents concurrent resume/ownership changes. Each table keeps one physical destination checkpoint lock/connection through a full live scan, private disk sort, business DML, full post-scan and receipt commit. The live root/count must match the reported before state. Extra/changed rows are deleted first, then missing/changed source rows inserted. Keyless occurrence IDs are preserved exactly, including duplicate rows.

Post-scan root/count must equal the sealed source. Business changes and `rm3_sink_repair` receipt commit in the same local transaction without advancing stream sequence, GTID, transaction ID/hash. Receipts contain plan/schema/before/after hashes, unchanged checkpoint, counts, actor assertion, request hash and timestamp; no business values.

Explicit preparation creates only receipt metadata, never missing job/schema/ownership metadata. MySQL DDL may implicitly commit, so fences are reacquired before business work; business tables and all three metadata tables must use InnoDB. Existing receipt columns and primary key are checked; do not drop metadata to bypass identity errors.

- SQL failure, drift, corrupt report, count mismatch, quota or deadline rolls back the current table and leaves the pipeline paused. Retry the same plan after fixing its cause; changed target contents require a new validation/plan.
- Lost commit reply or process restart:retry the same plan/hash. A matching destination receipt returns `alreadyApplied=true` without repeating DML.
- Multiple tables/targets use separate local transactions. Earlier tables may already be committed when a later table fails. Receipts support partial-progress retry; there is no cross-destination ACID promise.
- Once every table is committed, historical receipts can resolve even after resume. They do not prove current live equality.

No automatic resume occurs. Review receipts/results, explicitly resume with existing controls and obtain a new cut/report when needed. The original report remains historical and retains its differences.

## FAQ and boundaries

Arbitrary nonempty adoption/schema changes, dependency ordering for foreign keys/triggers, constraint restoration and cutover remain separate work. Deleting changed identities before inserts permits same-table UNIQUE value swaps, but does not establish cross-table/vendor compatibility. SQL failures roll back the current table.

Normal exit removes owned probe files. SIGKILL may leave private scratch directories; retry creates fresh probes and never accepts incomplete sorted output. Full scratch retention/cleanup remains pending; never remove active directories.

The journal and destination are not a distributed transaction. Journal pause locks guard controls, while destination locks/checkpoints and receipts guard local ordering/commit identity. Extended journal-disconnect/network-partition/node-loss matrices remain pending.
