---
kind: docs
locale: en
title: "RC-03 / RC-08: transaction skipping and durable gaps"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-native-skip.en.md
---

# RC-03 / RC-08: transaction skipping and durable gaps

Status:bounded skip is implemented. Historical binary probes and automatic control-mode migration are removed;current consistency boundaries remain.

The first profile uses transactional PostgreSQL/MySQL destinations with the original Agent/journal directory. Pause the whole task,confirm native fencing,and retain fresh complete raw/normalized evidence. Skip only the selected subscriber's next complete transaction. Preserve source GTID/original content and other subscribers' delivery semantics.

RC-05 comparison is mandatory. Proven commits use acknowledgment reconciliation. Diverged checkpoints/content,missing normalization/history or changed epoch/error generations refuse execution. An unadvanced checkpoint alone does not prove absent business data. Capture/decode failures cannot masquerade as destination apply failures.

A target-local transaction must commit an explicit SKIP receipt,original projected transaction identity and native safe progress together. Journal-side plans,gap records and ACK recovery must survive uncertain native commit responses. There is no common local transaction across systems:retain evidence/plan first,replay each commit boundary,and recover journal gaps/ACK from the native SKIP receipt. Never acknowledge before a proven native commit or mislabel SKIPPED as APPLIED. Bind operation ID,evidence,destination,reason and actor;conflicting retries refuse. Keep both pauses and advance the error generation.

SKIP must never enter ordinary APPLY acknowledgment. Whole-task pause and epoch fencing revoke in-flight Workers;current fanout verifies explicit SKIP receipts against source gaps. The first release retains no old-binary compatibility probes or prerelease-state migrations. Namespace mode is fixed and mismatches refuse.

The durable gap binds operation/evidence/source identity and range,destination/objects,actor/reason/time,native receipt,recovery stage and configuration/generation. The UI must explicitly show skipped data and pending recovery,never lossless catch-up. Preserve evidence and support task/destination gap queries.

Acceptance covers whole multi-table transactions,mappings,empty projections/BARRIER and keyless identities;uncommitted/proven-committed/diverged cases;crashes before/after native commit and journal gap/ACK commit;competing administrators,stale generations,revoked authority,stale Worker fencing;and continued source ordering for unaffected destinations with visible durable gaps and divergence.

## Initial implementation decisions

Create the control namespace directly in the configured mode,with consistent shared access/tasks and review/confirmation/skip capabilities. Existing namespace modes cannot migrate. The current program transitions the journal from normal state3 to recovery-ledger state4 atomically with its first PREPARED plan,after whole-task pause/epoch fencing. This is a runtime state transition,not a prerelease upgrade promise. Add native SKIP-only checkpoint markers without changing ordinary APPLY JSON. New fanout refuses normal ACK for a journal-ahead SKIP,and validates already-acknowledged markers against durable gaps.

Block task/affected-target resume while a PREPARED plan exists. A format4 journal missing plan/gap tables refuses rather than creating empty history. Preserve completed receipts/gaps/evidence for idempotent replay after progress/GC. Reject conflicting requests,ambiguous phases,empty projections,nontransactional affected tables,incomplete snapshots,changed shape/ownership and unsupported trigger/external dependencies.
