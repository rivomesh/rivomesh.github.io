---
kind: docs
locale: en
title: "Failed transaction compensation"
sourcePath: docs/en/transaction-compensation.md
---

# Failed transaction compensation

[中文](/docs/zh/reference/transaction-compensation.html)

Compensation restores affected destination rows to their states before the next unapplied source transaction. Use it when destination drift prevents that transaction from applying. The initial implementation targets transactional PostgreSQL and MySQL destinations. Enable the existing transaction recovery gate to make preview and approval available to administrators.

1. Pause the whole task and confirm the destination fence. Retain fresh failure evidence and review the target apply phase and original commit state.
2. Choose “Generate compensation preview” in the evidence dialog. The preview shows affected tables, identity counts and row insert and delete counts. Restoring a changed row appears as a deletion followed by an insertion.
3. Under “Transaction recovery and data gaps”, choose “Review compensation plan”, check the scope and provide an approval reason.
4. After the compensation commits, review the destination and explicitly resume. Normal delivery replays the original transaction.

A preview covers one destination and one complete transaction with up to 1,000 affected identities. It folds repeated changes, primary key moves and insert/delete chains in source order. For keyless duplicates it uses the retained ROW_ID. Point reads use the same JSON, numeric and temporal normalization as reconciliation.

Execution checks the reviewed rows and checkpoint again. Generate a fresh preview after drift. Reconcile acknowledgment first when the original transaction has committed. Triggers, foreign keys or unsupported table shapes require separate dependency handling. The connection needs the same dependency visibility as reconciliation repair.

Send `COMPENSATION_PLAN` or `COMPENSATION_EXECUTE` to `POST /api/tasks/{task}/actions`. Supply `X-Request-ID`, `expectedRevision`, `subscriptionId`, the subscriber's `errorCount`, `compensation.evidenceId` and `compensation.evidenceHash`. Execute also requires `compensation.approvedHash` from the preview result and `compensation.reason`. If the response is lost, inspect operation history or retry with the same request ID and original payload. Rows and the receipt commit together in one destination transaction. The task stays paused.
