---
kind: docs
locale: en
title: "Controlled transaction skipping"
sourcePath: docs/en/transaction-skip.md
---

# Complete-transaction skipping and gap recovery

For apply failures caused by target drift, see [transaction compensation](/docs/en/reference/transaction-compensation.html).

Transaction skipping and gap verification have verified profiles with a MySQL 8.4 source, the original Agent and LOCAL journal, a PostgreSQL business target, and PostgreSQL/MySQL control stores. Those archived runs used Java 8. Release builds and deployments use Eclipse Temurin 21 LTS. Native MySQL target contracts passed. Its full public skip matrix and other destinations remain in progress. Shared cluster skip is opt-in. Administrators must retain complete evidence and explicitly approve execution. [Evidence](/docs/en/start/verification.html) · [中文](/docs/zh/reference/transaction-skip.html)

Gap verification API/UI are integrated,with54 native contracts passing on each of PostgreSQL/MySQL;27 real-CDC checks pass with each PG/MySQL control store. See the [operator guide](/docs/en/reference/gap-verification.html) for approval,cancellation and status semantics.

## Scope and consequences

The initial scope is a MySQL source and transactional PostgreSQL/MySQL destinations. The next complete incremental transaction must have retained raw and normalized evidence. Only the synchronization service may write the destination. Schema, snapshot, ownership and dependency checks must pass. Cross-table transactions cannot be split. Snapshot, capture/decode, unknown transaction boundaries and other destination products are excluded.

Repair the underlying fault first. Missing binlogs require restored logs, a qualified source or a new baseline;never change GTIDs to simulate success. A proven native APPLY commit requires [acknowledgment reconciliation](/docs/en/reference/commit-acknowledgement.html), not skipping.

Skipping performs no business DML for that transaction. It records a native SKIPPED receipt and a durable gap for the selected subscriber, then advances only that subscriber acknowledgment. Source logs and other subscriber ACKs are unchanged. Later updates may fail because of missing rows, keyless identities or business dependencies. Continuing replication does not establish data equality.

## UI workflow

1. Pause the whole task and wait for destination fencing. A paused subscriber alone is insufficient.
2. Retain fresh transaction evidence for the failed destination;review the complete raw/normalized events, source position and scope. Historical observations do not authorize execution.
3. The observation must show CHECKPOINT_NOT_ADVANCED and TARGET_APPLY, with current epoch, error generation and ACK. If no skip form appears, check capability, state and evidence;do not edit metadata to bypass guards.
4. An ADMIN enters an 8–1000-character reason, explicitly accepts the data gap and submits.202 means accepted;inspect the final operation result.
5. Both task and subscriber remain paused. Review the plan and gap, then explicitly resume only after checking subsequent transactions and recovery conditions.

Open the original plan after a failed or timed-out operation. FAILED does not prove native absence:the plan may exist or the native skip may already have committed.

| Plan/native observation | Allowed workflow |
|---|---|
| PREPARED, no inspection | Explicit read-only inspection;opening a window does not probe or mutate automatically |
| PREPARED, COMMITTED | Recover the committed gap acknowledgment;cannot cancel |
| PREPARED, ABSENT | Reapprove with a reason and explicit loss acceptance, or cancel with a reason |
| PREPARED, UNKNOWN | No continue, recover or cancel;resolve connectivity, metadata and backup consistency |
| COMPLETED | Historical receipt/gap;same-request same-parameter replay returns its result |
| CANCELLED | Historical cancellation;new approval requires fresh evidence/error generation |

Original approval, native execution and later source resolution retain their own actors and reasons. Cancellation requires proven native absence, does not advance ACK or repair the SQL fault, and invalidates the old error generation.

## Linux, Docker, Helm and manual Kubernetes upgrades

Set the following consistently on every original controller and Agent, retaining all other [global-control](/docs/en/reference/global-control.html) identities, roles, storage and keys:

```yaml
cluster:
  sharedAccess: true
  sharedTasks: true
  recoveryReview: true
  recoveryCommit: true
  recoverySkip: true
```

Use the[first-release baseline](/docs/en/reference/first-release.html)for Linux,Docker,Helm and manual Kubernetes. Control mode is fixed at creation;development-candidate automatic migration is unsupported.

The first PREPARED plan atomically upgrades journal data format 3 to 4. The task configuration still uses `formatVersion: 3`. The format3-to4 transition is part of the current journal lifecycle,not compatibility for old development programs. Pending plans block normal resume. Missing format 4 plan/gap tables are not recreated as empty history;restore the consistent recovery unit.

When preparing the first skip, the journal connection needs permission to create the recovery metadata tables and their collection indexes. Routine restart and status reads use the existing tables. Preserve the indexes with the journal schema when backing it up.

Controlled native metadata migration adds a receipt table and two nullable checkpoint markers. MySQL implicit DDL commit does not release the source-journal fence. Appropriate metadata DDL privileges are required. Nontransactional tables and lost native receipts are not silently converted or rebuilt.

## API

`POST /api/tasks/{task}/actions` requires the current revision and `X-Request-ID`;cookie writes retain CSRF/Origin requirements. Retry the same request with identical parameters.

```json
{
  "action": "SKIP_TRANSACTION",
  "expectedRevision": "current revision",
  "subscriptionId": "pg",
  "errorCount": 1,
  "skip": {
    "evidenceId": "11111111-1111-1111-1111-111111111111",
    "evidenceHash": "64-character evidence hash",
    "reason": "Reviewed the complete transaction and accept this destination gap",
    "acceptDataLoss": true
  }
}
```

For `SKIP_RETRY`,`SKIP_RECOVER` or `SKIP_CANCEL`, replace evidence references with `planId` and `planHash`. Retry requires `acceptDataLoss: true`;recover/cancel explicitly require `false`. It must be a JSON boolean;strings, numbers, NULL and missing values are not approval.

- `GET /api/tasks/{task}/recovery-plans/{planId}`:bounded metadata summary, no business-row reads.
- `POST .../recovery-plans/{planId}/inspect` with `{}`:point-in-time read-only native proof, no DDL/checkpoint advancement.
- `POST /api/tasks/{task}/recovery-plans` with `{"subscriptionId":"pg","after":"","limit":20}`.
- `POST /api/tasks/{task}/gaps` with `{"subscriptionId":"pg","after":"0","limit":20}`.

All ledger reads are ADMIN-only. Pages permit at most 100 entries;use returned `next` cursors. Sequence/gap cursors are strings and must not be converted to JavaScript floating-point integers. Raw event values remain in separately authorized evidence pages. Oversized source positions are omitted as a whole with a hash;truncated GTIDs are never presented as usable resume positions.

The gap page reports `journalPayloadRetained` when both the raw and normalized payload rows are present in the journal. A false value on an open gap means the journal no longer has both payloads. Use the separately retained evidence archive or a consistent backup in that case. The status does not read business values or attest their content.

## FAQ

**Native commit followed by Agent interruption or failed source ACK?** Keep the original plan;PREPARED blocks ordinary resume. Restore the original Agent directory and inspect. Only COMMITTED permits acknowledgment recovery. A new unrelated skip request is not recovery.

**Force-cancel UNKNOWN?** Unsupported. Already committed and absent operations require different actions;connectivity failure, missing metadata or inconsistent backups cannot establish either outcome.

**The original administrator was disabled?** Execution rechecks current directory revision and ADMIN authority. Another authorized administrator can explicitly reapprove the original plan;original approver, native executor and source resolver remain separately recorded.

**When can the journal reclaim the original payload?** A live open gap or prepared skip holds the exact transaction until its pin is lifted. After every subscriber acknowledges the sequence and the [common-cut verification](/docs/en/reference/gap-verification.html) receipt proves closure of each gap for that sequence, the collector can reclaim its payload. The original skip plan, receipt and gap history remain available. An unrelated later apply or a historical comparison report leaves the pin in place.

**Does RUNNING mean equality?** No. Check `hasGaps` and the UI warning;`gapCountLimited` means a bounded count. Replication recovery and data equality are separate facts.

**Refusal codes?** `SKIP_DISABLED`:capability off.`SKIP_REQUIRES_PIPELINE_PAUSED`:pause the whole task.`SKIP_RECOVERY_PENDING`:resolve the original plan.`SKIP_CHECKPOINT_RECONCILIATION_REQUIRED`:inspect native APPLY first.`SKIP_NATIVE_COMMIT_NOT_PROVEN`:cannot recover.`SKIP_ALREADY_COMMITTED`:cannot cancel.`SKIP_NATIVE_CHECKPOINT_CHANGED`/`SKIP_PLAN_CHANGED`:reload and verify the recovery unit.Invalid request fields return 400 `REQUEST_INVALID` without accepting a command.
