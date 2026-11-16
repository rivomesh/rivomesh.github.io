---
kind: docs
locale: en
title: "Global control design"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-global-control.en.md
---

# CP-02/03: global task authority and durable commands

Contract for the next implementation, not accepted capability. Build on shared identity/audit/registry and preserve standalone APIs.

Shared SQL owns unique task IDs, encrypted immutable configuration versions, control revisions, desired state, operations/receipts and owner bindings. Local directories are Worker/log/report projections. Bind authenticated encryption to cluster/store/task/version and protect its key from Worker environments. Import preserves pipeline identity/positions; duplicate IDs/resource conflicts require review without clearing targets or renaming pipelines automatically. Distinguish accepted configuration from owner-applied configuration.

Every endpoint authorizes against shared identity/task grants and atomically records revision/request-ID checked intent and command.202 means durable acceptance. Duplicate requests return one operation; changed payload/identity reuse is rejected. Agents persist dispatch request IDs and original local revisions before calling TaskService, then replay identical arguments/receipts after restart rather than guessing that a lost reply meant no execution.

Route create/check/start/stop/pause/resume/target retry/validation/repair/cancellation. Serialize conflicting changes; cancellation can bypass the maintenance operation it cancels. Distinguish pending/running/success/refusal/failure/unknown. Offline-owner STOP is not confirmed stopped.

Initially pin owner node and data-directory identity. Reusing a nodeId with different data cannot silently take over. Expired observations stay UNKNOWN/STALE with timestamps while intent/queues persist. Automatic cross-node failover/drain/scheduling and controller/Worker lifecycle separation remain CP-04/07.

Provide filtered/keyset-paged global tasks/totals/owners/revisions/observations/results. Cross-endpoint configuration masking uses verifiable scoped secret references. Owner-specific preview/raw differences/plans use typed expiring authenticated-encrypted SQL requests/replies with current authorization and node-epoch checks; production SQL transport uses TLS. Never trust client-supplied actor/owner or expose secret values. Keep desired/active versions, old active configuration on failure and reviewable rejected proposals. Owner-local reports cannot migrate by moving cursors; offline reads refuse explicitly while durable async commands may wait.

Acceptance: A creates for B; both see one revision; A controls B with actual process/SQL evidence; duplicate/revision/permission/cancel/lost-reply/restart cases avoid duplicate execution; configuration/history/secret references work across endpoints; offline state/STOP remain unknown/waiting; store/key/directory mismatch refusal, paging/capacity/state migration and bilingual runbooks. These results do not close automatic execution failover CP-04/07.

## Storage and dispatch details (not yet integrated/accepted)

A protected independent random32-byte master key derives separate keys bound to cluster/store identity. AES-GCM random nonces and task/version AAD reject substitution; keyed configuration/request digests avoid enumerable password hashes. Reconstruct actor roles from shared IAM. Missing keys/authority, identity mismatches and incomplete catalogs never seed a replacement. SQL applies both node/task grants, counts and bounded pagination. Non-administrators receive public metadata; ADMIN configuration responses remain redacted. Global task quota differs from local task/worker capacity. External immutable restore detection remains LG-09.

Use typed encrypted, expiring requests/replies in shared SQL for owner-only previews/reports; production SQL transport uses TLS. Bind replies to cluster/store/task/request/owner epoch, cap and promptly expire sensitive payloads, and never trust browser-supplied actor roles. Separate waiting, dispatched, locally persisted, executing and terminal states. Persist original local revision/request/body digest before dispatch; lost replies reconcile original receipts/operations rather than resubmitting a fresh revision. Cancellation bypasses the maintenance queue it must interrupt. A202 is durable acceptance, not a committed destination transaction.

Owner node plus private directory identity pins execution. Control epochs do not fence existing Workers or replace native journal/target guards. Pod deletion, lost contact or lease expiry does not prove a Worker stopped; cross-node execution takeover remains CP-04/07.
