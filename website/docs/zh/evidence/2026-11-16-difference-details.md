---
kind: docs
locale: zh
title: "11-16-difference-details · Administrator difference details / 管理员差异详情"
sourcePath: docs/verification/2026-11-16-difference-details/README.md
---

# Administrator difference details / 管理员差异详情

2026-11-16. ADMIN can page completed SQL validation differences and explicitly reveal historical expected/actual values, with private-row integrity checks and required report/scope audit. OPERATOR/VIEWER can read task-granted summaries but cannot read raw differences. This adds no business repair or automatic resume. [中文手册](/docs/zh/reference/managed-validation.html) / [English manual](/docs/en/reference/managed-validation.html).

Final JAR SHA256 `0a9a95e8aec510f9e5e59c54da681695c6895135d4b88d8d93e46267dbb7346d`,187709363bytes. Root package passes189app+2Classic SDK=191cases with zero failures/errors/skips. Actual-JAR-first independently passes189app cases; DOM passes46cases. Static deployment and pre/post-native artifact gates pass. Private preserved binary:target/release-evidence/difference-details-final.jar. TODO is unchanged (SHA256 `0e77e9ea608a9fedd041851753dc6b59f462c49ee86151b750692bac7e6ad4f7`).

Four real profiles pass the full previous barrier/reconciliation/managed HTTP suite plus new details:LOCAL/H2,EXTERNAL MYSQL,EXTERNAL POSTGRESQL,EXTERNAL openGauss journals. Source is MySQL8.4; business targets are PostgreSQL17 and MySQL8.4. openGauss journal acceptance is not distributed GaussDB destination acceptance. Each native log contains MANAGED_DIFFERENCE_DETAILS_ACCEPTED,MANAGED_VALIDATION_HTTP_ACCEPTED,VALIDATION_BARRIER_ACCEPTED,final artifact gate and fixture cleanup.

The added native case resumes a real Worker, waits for both destinations to catch up, deliberately creates one missing/extra/changed keyed row and wrong keyless occurrence identity, then generates a third managed report through real HTTP/controller/database calls. Summary remains readable by a task-granted VIEWER; raw endpoints return403. ADMIN iterates one-item pages and reads values:missing rows have absent actual values,extra rows have absent expected values,and changed values retain a synthetic HTML-like string verbatim. Keyless wrong identity yields one missing and one extra row. Last report totals:2missing,2extra,1changed. No fixture raw rows or credentials are archived here.

Unit tests cover actual-entry/scope/cursor checks,checksum/identity validation and refusal of oversized UTF-8 rows before CLOB fetching. HTTP unit tests verify ADMIN-only access and audit/controller records excluding business values. DOM verifies text-only rendering,SQL NULL versus absent row,identity pagination and restricted-role controls. Initial DOM bridge failure (explain was private) is retained in ui-bridge-failed.log; final public bridge fixes it. No screenshot/accessibility acceptance:browser automation remained unavailable.

Docker preview runs the accepted copied JAR and seven source assets at http://127.0.0.1:18088; health/readiness,ADMIN session and unauthorized refusal pass. Credentials stay private. Temporary native fixtures/volumes/networks were removed; only the requested development console remains. Unrelated services were untouched.

Limits:1MiB combined raw JSON per detail request,explicit refusal without truncation;large-row export/streaming remains pending. Values are historical private plaintext report data,not live target reads. Report catalog/retention,reviewed repair/manual skip,cutover,controller HA/live K8s,vendor/version/security/capacity matrices and the full objective remain incomplete. Counts describe specified profiles rather than universal compatibility or performance.
