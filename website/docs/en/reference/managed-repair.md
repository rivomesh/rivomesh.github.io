---
kind: docs
locale: en
title: "Managed repair"
sourcePath: docs/en/managed-repair.md
---

# Managed data repair

The first managed workflow passed real HTTP/Worker/database acceptance across LOCAL/H2 and external MySQL/PostgreSQL/openGauss journals,with MySQL8.4/PostgreSQL17 business destinations. [Evidence](/docs/en/start/verification.html). Full vendor,cluster,capacity and security acceptance remains incomplete.

## Workflow

1. Complete V3 row validation, keep the task paused and open its differing report.
2. Explicitly select differing destination/table pairs and create a plan. Initial profiles are MySQL/PostgreSQL,with a200table selection ceiling. Nothing is selected by default.
3. Open Review repair plan. Check destinations,tables,missing/extra/changed counts,creator and budgets. Explicitly check confirmation and execute. The browser sends the exact server-read plan hash rather than constructing business changes.
4. Inspect job results/target commit receipts. After failure/cancellation,review and retry the same plan;committed tables resolve from receipts without repeating DML.
5. Explicitly resume only after review and obtain a fresh validation when appropriate. Repair does not resume replication,change historical differences to MATCH or authorize cutover.

Only authenticated ADMIN may create,review,execute or cancel. The server derives actor identity from authentication. Task/config revisions,request identity,plan hash,report seal and physical checkpoints constrain execution.

## Durable work and cancellation

Admission persists the explicit scope,report and predetermined plan UUID before queuing. Restart reuses that identity. A saved plan with an unfinished controller operation is loaded and checked against its original creator,time and scope. A bounded maintenance queue is separate from normal controls;each task has at most one pending operation.

Cancellation persists first,then interrupts the worker. Checkpoint/dependency waits and target scans/DML observe interruption. The current uncommitted table rolls back;previous commits remain. A cancellation can race a successful commit,so a cancelled result does not prove that nothing changed. Review/retry the same plan to resolve native receipts.

Completion records per-table counts,original checkpoints and whether a prior attempt committed. Controller audit links authenticated actor,request and plan hashes. Raw business values never enter operations/audit. CLI actor assertions retain their separate host-trust model.

The controller data directory contains operations,plans and sealed row reports;an external journal does not replace it. Persist/back up this directory for Linux,Docker and K8s. Local disk loss,multiple controllers on a shared PVC and live K8s node faults require separate acceptance. Never bypass identity/hash checks while restoring older files or metadata.

## Dependency refusal

Plan creation and each table mutation check dependencies. Initial execution rejects incoming/outgoing foreign keys and triggers. PostgreSQL also rejects row security,partitions/inheritance and extra rewrite rules,and takes a table lock during these checks. Nothing is automatically disabled or dropped.

MySQL trigger metadata requires TRIGGER privilege;an empty result with insufficient privilege cannot establish absence. See the [official MySQL8.4 documentation](https://dev.mysql.com/doc/refman/8.4/en/information-schema-triggers-table.html). Initial visibility checks conservatively require direct global SELECT and TRIGGER grants and reject observed partial revokes. Role-only/schema/table-level combinations are not resolved yet and may return REPAIR_METADATA_VISIBILITY_REQUIRED. Use an organization-reviewed migration account/profile rather than bypassing inspection.

The synchronizer must remain the exclusive business writer. Arbitrary concurrent DDL/external writes are outside this contract. Changed roots produce REPAIR_TARGET_DRIFTED and require a new validation/plan. These checks do not establish arbitrary vendor/procedure/dependency coverage.

## API

Use existing authentication,X-Request-ID and current expectedRevision with POST /api/tasks/TASK_ID/actions:

```json
{"action":"REPAIR_PLAN","expectedRevision":"TASK_REVISION","repair":{"reportId":"REPORT_UUID","scope":["target/TABLE_ID"]}}
```

The202response already persists operations[].repair.planId. Wait for REPAIR_PLAN_READY,then GET /api/tasks/TASK_ID/validations/REPORT_UUID/repairs/PLAN_UUID. This review projection contains counts/budgets,no raw rows or guarantee of current eligibility.

```json
{"action":"REPAIR_EXECUTE","expectedRevision":"CURRENT_TASK_REVISION","repair":{"reportId":"REPORT_UUID","planId":"PLAN_UUID","approvedHash":"EXACT_PLAN_SHA256"}}
```

Execution requires controller desired PAUSED. Cancel with REPAIR_CANCEL and no repair payload. Idempotent replay uses the original request ID,body,revision and identity. A new request with a stale revision is rejected before creating another job.

## FAQ and boundaries

A reviewed plan can become ineligible:execution rechecks current data,schema,configuration and pause cut. Wrong hashes are refused by the executor;stale revisions are refused at admission.

Retry the same plan to resolve commits after cancellation. A complete real-time progress catalog,independent receipt browsing,report/scratch retention and cleanup remain pending.

This mode requires a common cut. For a failed transaction, see [compensation](/docs/en/reference/transaction-compensation.html) or [reviewed skip](/docs/en/reference/transaction-skip.html). Nonempty adoption, constraint restoration and cutover remain open. Plans display default CLI repair budgets;UI budget editing is not implemented. Full vendor/version/cluster/capacity/security/controller-HA matrices remain incomplete.

[COMMON_CUT foundations](/docs/en/reference/common-cut-repair.html) · [Managed validation](/docs/en/reference/managed-validation.html)

Development note:the existing general shape guard initially rejected triggers before the repair-specific check,producing a generic console failure. The guard remains intact;repair dependency checks now run first to return the explicit refusal. The corrected specified profiles pass;the failure and correction remain in the evidence.
