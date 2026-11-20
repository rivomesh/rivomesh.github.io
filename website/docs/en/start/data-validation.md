---
kind: docs
locale: en
title: Validate data and review repairs
---

# Validate data and review repairs

Progress describes how far replication has advanced. Validation compares actual source and target content at a historical common checkpoint; a report does not assert permanent equality afterward.

The initial native row validation and repair profile uses a MySQL 8.4 source and **MySQL 8.4 / PostgreSQL 17** transactional destinations. Other SQL versions and modes require separate verification. Common-cut validation for experimental PostgreSQL capture is still pending.

## Create a validation report

1. Finish initialization, run the task and allow the chosen target to catch up.
2. An administrator starts row validation from task details, selecting the target and lock/read/staging budgets.
3. Inspect the operation and completed report for source/target row counts, missing, extra and changed rows.
4. Review task state and explicitly resume when appropriate. Validation does not repair data automatically.

Establishing the common checkpoint briefly affects source writes. Raw values may contain sensitive business data and require the appropriate permissions.

## Find, retain and recover a report

In **Data validation**, browse historical reports or open one by report ID. Reports remain available after they leave recent operations. In global control, administrators can also find recovery receipts by request ID to locate the associated report, failure evidence or plan.

The report database contains original business values. Keep it on the Agent's protected persistent volume and include it in task backups. In **View storage**, administrators can inspect file sizes. Configure `validationRetentionMinimumDays` to enable approval of a minimum retention period. A report that reaches this date still requires a separate approval and eligibility checks for reclamation.

With a separate `validationArchiveDirectory` mounted, an administrator can seal a checksum-verified copy of a completed report after approving the retention minimum. If the live database is missing, use the report's original ID to restore the sealed copy. See [managed validation](../reference/managed-validation) for limits, receipts and reclamation conditions.

## Review and execute a repair

Keep the task paused, explicitly select targets/tables, generate a plan, and review its scope and budget before execution. Check per-table results and explicitly resume after completion. Unsupported foreign keys, triggers or dependencies can reject a repair.

Canceling cannot roll back tables already committed. After an interrupted operation, recover the original request/report/plan and inspect committed results rather than assuming nothing happened. Optional global mode supports cross-entry workflows within its documented fixed-owner acceptance profile; it is not automatic owner migration.

[Managed validation](../reference/managed-validation) · [Managed repair](../reference/managed-repair) · [Global maintenance](../reference/global-control)

## Verify a gap after a reviewed skip

On the scoped PostgreSQL/MySQL profile, run a fresh complete common-cut comparison after correcting the differences. From its matching report, select gaps and prepare a verification plan for administrator approval and a fresh scan. The receipt covers the reviewed historical cut and leaves the task paused. See [data-gap verification](../reference/gap-verification).

## A completed validation report

<ScreenshotPreview name="data-validation" locale="en" alt="Common-cut validation report from the RivoMesh English-language test console." />
