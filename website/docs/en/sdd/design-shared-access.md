---
kind: docs
locale: en
title: "Shared access design"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-shared-access.en.md
---

# SE-04 / CP-05: shared identity, sessions and audit

[中文](/docs/zh/sdd/design-shared-access.html). This is an implementation contract; requirements stay open until acceptance.

Explicit `cluster.sharedAccess` enables SQL account/session/audit authority while preserving default standalone/registry behavior. It does not turn local task pages into global control; CP-02/03 provide that separately.

Bootstrap imports a verified managed-account snapshot or configured accounts. Bind a separate shared-store identity and cluster identity into an upgraded local state format. Old software/disabling shared authority must refuse fallback to stale local grants. Missing/changed store identity and conflicting directories fail startup; existing shared accounts are never overwritten by old bootstrap tokens. Keep pre-import local audit history and an import anchor without rewriting historical chains.

Every authentication/grant/session check consults shared authority. Account mutation, directory-wide session revocation and account audit commit atomically with revision/request receipts. Session creation locks/checks the current account revision. Cookie IDs remain opaque/random; SQL retains only digests and minimal principal/CSRF/expiry data. Database time governs expiry and member policy settings must match. Closing one controller does not clear shared sessions. A login can resume at B after A restarts; logout/disable/rotation revoke old credentials everywhere. Bearer and Origin/CSRF rules remain.

Shared audit uses a serialized sequence/hash chain and retention anchor. Retry the same event ID idempotently and reject payload collisions. Drain local durable outboxes only after shared confirmation. Preserve/export pre-import local history separately.

Acceptance requires independent directories sharing SQL: A-login/B-restore, kill-A/B-continuity, logout/rotation/grant revocation across nodes/restart, no local fallback during store failure, import/identity-loss/rollback refusal, concurrent account/session/audit and expiry/capacity/idempotency contracts, native PG/MySQL, UI and bilingual recovery docs. Full CP-05 also requires least-privilege task-secret distribution and cannot close based on shared accounts alone.

SE-04 accepted; CP-05 remains partial. [Evidence](/docs/zh/evidence/baseline.html).
