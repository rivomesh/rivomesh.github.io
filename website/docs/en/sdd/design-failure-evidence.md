---
kind: docs
locale: en
title: "Durable failed-transaction evidence"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-failure-evidence.en.md
---

# Durable failed-transaction evidence

RC-02/05/09 · 2026-11-17 · [中文](/docs/zh/sdd/design-failure-evidence.html)

This extends the [recovery contract](/docs/en/sdd/design-failed-transactions.html) without exposing skip or compensation writes.

- Retain immutable review IDs in the original execution node's private directory. Bind task,owner/directory identity,configuration revision,actor,time,stream generation/epoch,error generation,ACK,whole raw/normalized hashes and historical schemas. Evidence is not current execution authorization.
- Use private directories/files(0700/0600),bounded reads and no symlinks/path escape. Verify HMAC with a separate random key. Missing keys,corruption or identity mismatch refuse;never replace a lost key to silently accept old records. Back up keys and directory identity together.
- Repeating an ID returns its original record;changed identity/request/destination conflicts. Private temporary files,fsync,atomic publication and directory fsync prevent partial valid records. Cross-process locking serializes quota checks/publication.
- Enforce per-record and directory byte/count quotas. Refuse at quota without silently deleting evidence;unresolved gaps cannot be garbage-collected. Document temporary-file/physical-space limits.
- Persist and verify before returning a review ID. Current journal inspection alone is not retained evidence. Retained records survive journal collection. Missing historical schemas cannot support execution plans.
- Summaries contain no row values or SQL. Bound raw/normalized event pages;refuse a single oversized event rather than approving truncated images. Missing normalization is explicit;reading must not mutate journal/keyless identities.
- Before global UI integration,gate new requests on protocol/capabilities so old Agents cannot consume unknown recovery commands. Creation is durable under the original request/review ID;queries reauthorize/audit. Copying files does not implicitly implement Agent migration.

Acceptance covers restart,idempotency/conflicts,tampered content/key,changed directory identity,symlinks,quota preserving old evidence,concurrent publication,write interruption,safe summaries,pagination and journal GC survival. Native checkpoint reconciliation/execution drift checks remain RC-05:complete evidence alone cannot prove non-commit or authorize skipping.

## UI/protocol integration (bounded profile accepted)

Global control opts into protocol5 with`cluster.recoveryReview: true`,requiring sharedTasks/sharedAccess. Defaultoff preserves protocols3/4;durable command and owner-query admission reject new evidence requests. Upgrade requires old members normally STOPPED,not merely expired;old modes cannot rejoin protocol5. Standalone entry has no old Agent routing and still requires administrators.

A durable`FAILURE_REVIEW`action binds destination/error generation and persists evidence ID/original configuration revision before execution. Summary GET and raw/normalized event POST bind original execution directory,reauthorize/audit and limit pages to256KiB/100events. They never automatically resume. Global operation views preserve review IDs. UI opens summaries first,requires explicit raw access,closes on logout and discards stale session responses.

[Managed review acceptance](/docs/zh/evidence/baseline.html):protocol5 fixed-Agent MySQL8.4/LOCAL profile;manual mutation and other profiles remain separate.
