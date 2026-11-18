---
kind: docs
locale: en
title: "Failed-transaction recovery contract"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-failed-transactions.en.md
---

# Failed-transaction recovery contract

RM-SDD-001 · RC-01—RC-10 · 2026-11-17 · [中文](/docs/zh/sdd/design-failed-transactions.html)

This contract governs upcoming recovery work. It does not accept skip or patch operations; requirements.json remains authoritative.

1. Record phases at their execution sites: target activation, journal read, normalization, projection, receipt reconciliation, apply and journal ACK are distinct. Legacy records without a phase remain UNKNOWN, never inferred to permit skipping.
2. Persist subscriber pause and its bounded diagnostic in one journal transaction, bound to the error generation. Repeated pause preserves the first fault; a failure after resume receives a new generation. Diagnostics contain no exception messages, SQL, connection strings or business values.
3. Inspect only the next complete transaction of a paused subscriber, atomically binding error generation, ACK, stream generation, epoch, configuration fingerprint and content hashes. Inspection never acknowledges, activates a sink, normalizes events or changes keyless identities. Missing history, no next transaction and corrupt content are explicit refusals.
4. Raw and existing normalized payloads share a read budget. Reject oversized transactions completely rather than approving a truncated transaction. Enforce character/byte bounds independently of stored length. The initial internal limit is 4 MiB; streaming review of large transactions remains open.
5. Inspection is a current snapshot, not an execution credential. Authorization, private durable evidence, destination projection hashes, native checkpoint reconciliation and retention must precede execution APIs. A paused ACK pins current history; an in-memory result cannot substitute for retained evidence after resume/collection.
6. Execution plans bind original owner/directory, configuration revision, stream generation/epoch, error generation, ACK, complete transaction and destination checkpoint. Reconcile a verified destination commit ahead of ACK first. Unknown commits or mismatched hashes prohibit skip/compensation.
7. Skip one destination's whole transaction. Commit a native SKIP receipt and safe progress atomically; commit journal ACK and gap atomically. Restart reconciles both receipts under the original request, never skipping twice or interpreting SKIP as APPLY. A format/capability upgrade must force old software to refuse incompatible checkpoints before mutation is exposed.
8. Compensation plans show typed before/after values and row identities, recheck drift and atomically commit data with native receipts. They do not rewrite source logs/reset positions or automatically resume.
9. Gaps distinguish unresolved, accepted loss and verified closure. Show safe coverage separately from actual application. Other destinations are unaffected. Retain unresolved gaps/review evidence and apply backpressure at quota.
10. UI operations use durable cross-node requests, shared authorization and audit. Raw values require separate authorization, pagination and limits. Gate new request kinds on tested old-Agent refusal/capability negotiation.

Initial acceptance: activation is not labeled APPLY; a failure on transaction two identifies transaction two; uncertain commits cannot authorize skip; inspection survives journal restart; stale generation/running-state requests refuse; corruption, missing sequence, over-budget and forged length refuse without changing ACK; concurrent resume/collection cannot yield a mixed snapshot. Native receipts, crash windows, UI, authorization and fan-out acceptance follow separately.
