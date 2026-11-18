---
kind: docs
locale: en
title: "Data-gap verification"
sourcePath: docs/en/gap-verification.md
---

# Data-gap verification

[中文](/docs/zh/reference/gap-verification.html) · [Transaction skipping](/docs/en/reference/transaction-skip.html) · [First-release configuration](/docs/en/reference/first-release.html)

Plans,approval,fresh scans and durable receipts are implemented for transactional PostgreSQL/MySQL destinations. See [SDD](/docs/en/sdd/tasks.html) for acceptance progress. Verification neither repairs data nor reapplies skipped transactions,nor automatically resumes replication.

## Console workflow

1. Resolve differences and run a new complete common-cut comparison. Select a COMPLETE,MATCH report with sealed source data. An old report alone does not establish current target correctness.
2. Click “Select gaps and prepare verification” in the report. Choose a target and unverified gaps,enter a reason and maximum duration. A plan covers at most100 gaps/1000 affected tables;default300seconds,range1–86400seconds.
3. Open the prepared plan in “Transaction recovery and data gaps”. Review target,report,cut,table names,source counts,content roots,gap scope and duration. Tables are paged in groups of50.
4. Confirm scope and exclusive sync-service target writing,enter an approval reason,and choose “Approve scope and verify again”. ADMIN is required;202 only acknowledges command admission.
5. Inspect the resulting `VERIFIED_AT_COMMON_CUT` receipt. It establishes reviewed table equality at that historical cut only. Original SKIP history remains and the task stays paused. Cutover requires separate checks.

External application/administrator writes bypass this fence and invalidate its operating assumption. Planner and approver are separately recorded;different accounts are not mandatory. Management entries may differ;the original Agent uses its recoverable report directory. Moving only a cursor does not replace journals,reports or original records.

## API

Require ADMIN,task/node grants and matching `expectedRevision`;cookie sessions also require CSRF. Use a stable `X-Request-ID`. An unknown response is retried with the identical ID and original body,without changing reason/scope.

Send `POST /api/tasks/{task}/actions`:

```json
{
  "action": "GAP_VERIFY_PLAN",
  "expectedRevision": "current task revision",
  "subscriptionId": "pg",
  "errorCount": 4,
  "gap": {
    "reportId": "completed-report-UUID",
    "gaps": ["original-SKIP-plan-ID"],
    "maximumMillis": 300000,
    "reason": "Reviewed the common-cut report and complete gap scope"
  }
}
```

`errorCount` is task status `error_count`,the whole pipeline generation rather than a subscriber's error count. The command request ID becomes the plan ID. Read it through `GET /api/tasks/{task}/gap-verifications/{planId}`.

After review,submit `GAP_VERIFY_EXECUTE` with the same target,current task revision and the plan's `errorGeneration`:

```json
{
  "action": "GAP_VERIFY_EXECUTE",
  "expectedRevision": "current task revision",
  "subscriptionId": "pg",
  "errorCount": 4,
  "gap": {
    "planId": "verification-plan-ID",
    "approvedHash": "complete hash returned by GET",
    "reason": "Approved the scope and exclusively sync-service-written target"
  }
}
```

Execution cannot select another report,gaps or duration. `GAP_VERIFY_CANCEL` carries no `gap` object. Inspect task operations and the original plan for final results. Responses exclude business row images. Gap `sequence`/`next` values are strings;never convert them to JavaScript floating-point numbers.

## Failure handling and FAQ

| Situation | Handling |
|---|---|
| `GAP_LIVE_DATA_DIFFERENCES` | Fresh scans still differ;no successful receipt is written. Resolve differences and obtain a valid report before review. |
| Resume,moved cut/native checkpoint/schema | Refuse;obtain a new comparison and plan rather than editing stored scope. |
| `GAP_VERIFICATION_PLAN_CHANGED` / `GAP_VERIFICATION_RECORD_CHANGED` | Restore consistent persistent state;missing history is never silently recreated. |
| Agent/network interruption or unknown response | Inspect the original receipt. Identical approval replay returns committed history without another scan/write;uncommitted source transactions roll back. |
| Cancellation | A request is not proof of rollback. `GAP_VERIFICATION_CANCELLED_CHECK_RECEIPT` requires reading the original receipt;commit may have completed. |
| `hasGaps=true`, `hasOpenGaps=false` | SKIP history exists with common-cut receipts;this is not live equality. |
| `gapCountLimited=true` | Counts are lower bounds from a bounded window. `hasOpenGaps=null` means unseen unresolved gaps are unknown;continue paging. |
| Accepted loss | Acceptance creates a gap,not equality. Fresh full affected-table comparison must pass before recording verification at a cut. |

Plans,original SKIP history and receipts remain in source-journal metadata. Native target receipts/business data are unchanged. Source transactions persist plans and atomically commit verification receipts with all selected gap links. First-release schemas are created directly without in-place prerelease-candidate migrations.

## Progress semantics

| Field | Meaning |
|---|---|
| `captured_sequence` | Captured incremental-log sequence as an exact decimal string |
| `covered_sequence` | Minimum safe coverage across targets,including explicit skips |
| `subscriptions[].safeCoveredSequence` | Target acknowledgment coverage |
| `subscriptions[].contiguousDeliveredSequence` | Contiguous non-skipped prefix,stopping before the first historical SKIP |
| `subscriptions[].firstSkippedSequence` | First historical skip or null |
| `subscriptions[].progressSemantics` | SQL_COMMITTED,BROKER_ACCEPTED or MATERIALIZER_ACKNOWLEDGED |

For SQL,the contiguous prefix represents ordered committed projections. Verification never changes SKIP into APPLIED. Broker receipt is not consumer completion;materializer acknowledgment is not visibility on every replica. New progress values are strings beyond JavaScript integer precision. Snapshot completion remains a separate state.
