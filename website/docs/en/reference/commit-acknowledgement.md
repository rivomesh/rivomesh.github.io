---
kind: docs
locale: en
title: "Commit acknowledgement recovery"
sourcePath: docs/en/commit-acknowledgement.md
---

# Confirm an already committed destination transaction

The scoped profile verifies the console, API, protocol 6 admission, atomic ACK and receipt handling, and cross-entry recovery. [Evidence](/docs/en/start/verification.html).[中文](/docs/zh/reference/commit-acknowledgement.html)

The initial profile uses a MySQL source and transactional PostgreSQL/MySQL destinations,retained complete raw/normalized transactions,and destinations written only by the synchronization service. Snapshot faults,unbounded/incomplete capture or decode failures,and other destination protocols cannot use this operation.

## Workflow

1. Pause the **whole task** and confirm native destination fencing. A paused subscriber alone is insufficient. Whole-task pause revokes the old Worker epoch.
2. Retain new evidence for the failed subscriber after pausing. Earlier evidence remains readable,but cannot authorize this confirmation.
3. Review source position,complete transaction,destination and hashes. The checkpoint comparison must report committed but unacknowledged,without a lagging destination epoch.
4. Enter a reason of at least eight characters,check the review declaration,and select **Confirm committed transaction**. The form requires administrator permission and a current matching pause/error observation.
5. Inspect the completed operation receipt. ACK advances exactly one proven committed transaction;the subscriber error generation increments. Task and subscriber remain paused. Business rows are not rewritten.
6. Inspect the next transaction and repair the cause before explicitly resuming the subscriber and task with current error generations.

If the form is absent,check the cluster capability,pipeline pause,observation freshness and destination fence. Do not edit checkpoint tables manually.

## First deployment

Configure all controllers and Agents using the[first-release baseline](/docs/en/reference/first-release.html)before startup. Development-version in-place upgrades/automatic mode migration are unsupported. Linux,Docker,Helm and manual Kubernetes share identity/storage requirements. Metadata DDL requires appropriate privileges;restart recovery and missing-history refusal remain supported.

## API and receipt

`POST /api/tasks/{task}/actions` returns202. Use the current task revision and preserve `X-Request-ID` plus all parameters when retrying. Cookie requests retain CSRF/Origin protection.

```json
{
  "action": "CONFIRM_COMMIT",
  "expectedRevision": "current-task-revision",
  "subscriptionId": "pg",
  "errorCount": 1,
  "commit": {
    "evidenceId": "11111111-1111-1111-1111-111111111111",
    "evidenceHash": "64-character-SHA256-from-evidence-summary",
    "reason": "Reviewed original transaction and native destination commit"
  }
}
```

Poll the operation. Successful results contain `receipt` and its `hash`. The receipt binds operation/evidence identity,actor,reason,old/new error generations,confirmed sequence and native checkpoint. Operation audit does not contain event row values.

## FAQ

**Did a timeout commit?** Retry the original request ID and parameters. ACK and receipt commit in one journal transaction;an already committed operation returns its receipt. In the UI,refresh and inspect the original operation first.

**Can I confirm an unadvanced checkpoint?** No. Native progress must equal ACK+1 with identical transaction ID and projected hash. Unadvanced progress does not prove absent rows or authorize skipping.

**Why fresh evidence?** Whole-task pause,Worker restart or another failure can change epoch/error generation. Historical evidence is not execution approval.

**Does this skip,compensate or resume?** No. It confirms a proven native APPLY. Use the separate guides for [skipping](/docs/en/reference/transaction-skip.html), [compensation](/docs/en/reference/transaction-compensation.html), [row correction](/docs/en/reference/manual-correction.html) and [gap verification](/docs/en/reference/gap-verification.html).

**Does it change other targets or source GTID?** No. Only the selected subscriber ACK changes;source transactions/GTID and other ACKs remain intact. Whole-task pause applies during the operation;explicitly inspect/resume subscriber and task afterward.

**Common refusals?** `FAILURE_ACK_DISABLED`:enable the capability. `FAILURE_ACK_REQUIRES_PIPELINE_PAUSED`:pause the whole task. `FAILURE_ACK_TARGET_FENCE_REQUIRED`:confirm native fencing. `FAILURE_ACK_COMMIT_NOT_PROVEN`:commit content mismatch. `ERROR_GENERATION_CHANGED`/`FAILURE_CHECKPOINT_JOURNAL_CHANGED`:retain fresh evidence. `FAILURE_ACK_METADATA_NOT_TRANSACTIONAL`:repair metadata storage. `FAILURE_ACK_REQUEST_CONFLICT`:the operation ID was reused with different approval content.
