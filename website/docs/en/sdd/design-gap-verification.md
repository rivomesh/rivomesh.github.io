---
kind: docs
locale: en
title: "Gap verification: common cut and atomic records"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-gap-verification.en.md
---

# Gap verification: common cut and atomic records

[中文](/docs/zh/sdd/design-gap-verification.html) · [Tasks](/docs/en/sdd/tasks.html) · RC-08 DONE · 限定SQL档案 / bounded SQL profile

Plans,administrator API/UI,cross-node approval and cancellation are integrated. PostgreSQL/MySQL each pass58 native contracts and103 DOM checks pass;27 real-CDC checks pass with each PG/MySQL control store and the bounded RC-08 SQL profile is accepted. See the [operator guide and FAQ](/docs/en/reference/gap-verification.html).

## Reviewed scope

A plan binds one destination,configuration fingerprint,journal generation,source identity,common cut,sealed report and source roots. It covers at most100 existing gaps and1000 affected tables. Each gap requires its complete transaction plan and native execution receipt. Historical schema versions must match the common cut. Different source,destination,generation,schema or cut,and incomplete/differing reports are refused. Plans contain metadata,not business row values.

A historical MATCH only permits preparing a plan. Execution freshly scans every affected destination table and uses bounded disk sorting to compare row counts and content roots against sealed source data. Counts alone or only the skipped transaction's rows are insufficient. Differences,timeouts,moved native checkpoints or source pause fences prevent a successful record.

## Concurrency and persistence

The source job row stays locked throughout original-gap inspection,fresh destination scans and source-record commit. Resume,Worker ownership changes and service repair mutations must take the same fence. Native target epochs/common-cut checks also fence stale Workers. Tables need not fit in memory.

Destination business data must be exclusively written by the sync service. Direct application/administrator writes are outside this fence. Future manual-data correction must acquire the same fence. Verification compares the sealed historical source cut,not the source's current live state.

The source journal adds immutable `rm3_gap_verification_plan` plans and successful `rm3_gap_verification` receipts and stores a verification ID/hash on `rm3_gap`. One source transaction writes the receipt and all selected gap links;any failure rolls everything back. Original SKIP plans,receipts,gaps and reports remain unchanged. Verification does not issue business DML,advance ACK or resume execution.

`VERIFIED_AT_COMMON_CUT` records the reviewed plan,cut,observation time,execution request,approver and approval reason separately from the planner. Identical execution request/plan/approver/reason replay returns the immutable receipt,including after a later resume;it reports historical success without scanning again. Changed reason/scope with the same request is refused. Another request cannot overwrite an already-verified gap. Concurrent duplicates return one receipt. Missing/changed receipts or incomplete links refuse instead of recreating empty history.

The first release creates metadata directly,without ALTER/migration support for old development candidates. Assess persistent state/data before resetting a test environment;copying only a cursor is invalid. See the [first-release baseline](/docs/en/reference/first-release.html).

## Operations and status

`GAP_VERIFY_PLAN` persists review scope,`GAP_VERIFY_EXECUTE` approves its hash and`GAP_VERIFY_CANCEL` uses reserved cancellation admission. Cancellation can race commit and must be resolved from the original receipt rather than labelled rolled back. Control/Owner audit retains request,plan and result hashes. Existing revocation,revision,configuration and generation gates remain effective.

`hasGaps` retains SKIP history while`openGapCount`/`verifiedGapCount` distinguish unresolved and verified records. Counts use a1001-row window and become lower bounds when`gapCountLimited` is true. If no unresolved row is seen in a limited window,`hasOpenGaps=null` rather than false. Paged gaps expose OPEN/VERIFIED_AT_COMMON_CUT and receipt references without replacing SKIPPED. Verification changes neither ACK,business rows nor running state.

## Remaining work

Real-CDC cross-entry acceptance passes27 checks per PG/MySQL control store with a PostgreSQL17 business verification target and a healthy MySQL8.4 peer. Other SQL,analytical and messaging protocols remain unverified. Before-image compensation,typed manual correction and other target protocols remain tracked by RC-06/07/10.

Incremental progress uses one journal snapshot. Safe coverage includes explicit SKIP;the contiguous non-skipped prefix stops before the first historical skip even after verification. Indexed first-gap lookups avoid scanning payload history. SQL commit,broker receipt and materializer acknowledgment have distinct labels. Displayed sequences are exact decimal strings;baseline snapshot completion is separate.
