---
kind: docs
locale: en
title: "Manual target corrections"
sourcePath: docs/en/manual-correction.md
---

# Manual target corrections

[中文](/docs/zh/reference/manual-correction.html)

Administrators can add missing rows, correct values and delete extra rows after a destination SQL failure. The first profile covers transactional PostgreSQL and MySQL destinations and uses the existing recovery permissions and pause fence.

1. Pause the whole task and confirm the destination fence. Retain fresh failure evidence. If the original destination commit is ahead of the journal acknowledgment, reconcile it first.
2. Choose “Correct target rows” in the evidence dialog. Select an affected table and action, fill the fields and add the edit to the batch. To import, choose a JSON file or paste the original JSON.
3. Preview the corrections. Review the destination, tables, identities, before and after values and row count. Generate a fresh preview after changing the batch.
4. Enter an approval reason and confirm. Check the operation status and the destination before explicitly resuming the original transaction.

| Action | Input |
|---|---|
| Insert | A keyed table and complete values, including nullable columns and materialized generated columns |
| Update | All key fields or an existing ROW_ID, plus the fields to change |
| Delete | All key fields or an existing ROW_ID |

Each batch supports up to 50 rows and 128 KiB of input. Preview values are limited to 512 KiB. An identity can occur once per batch. JSON string values preserve precision, JSON `null` represents SQL NULL and JSON columns accept JSON text in a string.

```json
{
  "edits": [
    {
      "tableId": "64-character table identifier returned by schema",
      "action": "UPDATE",
      "key": {"id": "9007199254740993"},
      "values": {"balance": "12345678901234567890.1234", "remark": null}
    }
  ]
}
```

Send `expectedRevision`, `subscriptionId`, the subscriber's `errorCount`, `correction.evidenceId` and `correction.evidenceHash` to `POST /api/tasks/{task}/corrections/schema` or `/corrections/preview`. Preview also accepts either `correction.batch` or original `correction.importJson`. Submit that same content to the task's `/actions` endpoint with `action: CORRECTION_EXECUTE`, the preview hash as `approvedHash`, an approval `reason` and an `X-Request-ID`. Retry a lost response with the same request ID and original body.

| Situation | Action |
|---|---|
| The checkpoint, task revision or target row changed | Retain current evidence and preview again |
| A keyless table contains identical values | Use the exact ROW_ID from normalized evidence |
| A row write or receipt fails | Inspect the error and constraints before generating a new preview. The target transaction rolls back the entire batch |
| The table has unsupported foreign keys, triggers or structure | Resolve the dependency or use a repair procedure for that table |
| A decimal or integer exceeds browser precision | Enter the value as a string before any floating point conversion |

The administrator preview returns row values. Task summaries and durable receipts expose table scope, counts and the digest. The destination transaction preserves the source log, GTID and acknowledgment position.
