---
kind: docs
locale: en
title: "Configuration revisions"
sourcePath: docs/en/configuration-editor.md
---

# Configuration revisions

中文：[配置编辑](/docs/zh/reference/configuration-editor.html).

The console edits configuration, rotates credentials and restores revisions without
resetting checkpoints. The actual Java 8 release passed a MySQL 8.4 → PostgreSQL 17
pipeline covering target password rotation, revision restore and controller restart.
See the [acceptance record](/docs/zh/evidence/baseline.html) for its scope.

Only ADMIN can read/edit configuration or its history. GET responses replace
passwords, tokens and credential-bearing URLs/options with opaque references;
they do not return saved values or ENV references. Retain the reference to keep
a value, replace it with a new string to rotate it, or use null/empty where the
adapter permits clearing. References are scoped to task, revision, location and
target identity. Do not move them between targets. A restart or conflicting edit
can require reloading references. No configuration is echoed by a save response.

Stop the local task first; a completed PAUSE also permits editing. Pending controls
and running workers block updates. Preview reports changed paths and whether
migration is required, without old/new secret values. The task ID, synchronization
fingerprint and physical journal binding must remain unchanged for this workflow.
Changing mappings, products, semantic profiles, databases or journal location
requires a separate migration plan. A v2 URL containing embedded credentials is
part of its legacy fingerprint: use dedicated password fields for ordinary
rotation; this editor does not rewrite legacy checkpoint identity. Save preserves
STOPPED/PAUSED intent. Check connections, then explicitly start/resume; shared
pause/error generation is never bypassed by a configuration update.

Each committed configuration has immutable owner-readable YAML and metadata
files under `dataDirectory/config-versions/<taskId>/`. Metadata links its parent
hash, editor identity, request ID and time. The controller registry atomically
selects one head; staged unreferenced files are not committed history. Canonical
task YAML and worker-config files become repairable projections. Workers launch
from the committed version, whose content is checked before launch. A missing
projection is repaired on restart; a damaged committed version blocks the task
and never silently falls back to an older file. Back up the registry, versions,
original task files and journal coherently.

Existing externally supplied files retain their original startup loading mode
until edited through this workflow. UI-created/edited files are controller-managed;
editing a projection on disk does not change the committed configuration. Use the
editor/API. Independent CLI task files remain ordinary files. Historical versions
retain prior credentials: protect the entire private directory, not just current
YAML. Automatic version/orphan retention cleanup is not implemented.

History is paginated in 20-record pages with signed cursors. Restore previews the
paths that change, then creates a new revision linked to the current head; it does
not delete history or revert database checkpoints. Old history cursors/references
may expire after controller restart or a new configuration head. Fetch history
again. Idempotency receipts remain actor/role-bound; their existing bounded
retention is separate from configuration history.

Version integrity hashes detect corruption relative to the registry. This is
configuration provenance, not a tamper-proof security audit against privileged
filesystem administrators. Denied/authentication events and asynchronous results now use the separate
[security audit](/docs/en/reference/security-audit.html) with retention/export. [Exact task authorization](/docs/en/reference/task-authorization.html) is implemented. External immutable
anchors and account management remain unfinished.

## Console workflow

1. Sign in as ADMIN, select a task and open **Configuration & history**. You can inspect and prepare changes while running; stop the local worker or finish pause before saving.
2. Edit usernames, snapshot chunk rows, poll/retry intervals. For passwords/tokens, choose **Keep current value**, **Replace** or **Clear**. Saved values stay hidden. Advanced JSON supports other fields; newly typed credentials are visible there.
3. **Preview changes** and review paths. Migration-required changes cannot overwrite the task. Editing again invalidates the preview.
4. Save, check connections/objects, then explicitly start or resume. Saving never starts a worker, clears shared pause or skips a failed transaction.
5. Select a committed revision, preview restore, then save the restore as a new revision. Check connections again: old credentials can fail after a database password change.

Closing the editor or signing out clears drafts. Sensitive historical revisions remain in private storage. Load more after each 20 records; the separate 40-operation limit does not truncate configuration history.

## FAQ

**Does editing repeat the snapshot?** Credential/runtime edits preserve synchronization and journal identity. Actual acceptance retained stream/snapshot identity and continued CDC. Mapping, identity or journal-location changes require migration.

**What if a task file is edited or deleted?** Managed projections are repaired from the committed version. Do not edit projections to change configuration. Damaged versions/registry require a coherent backup restore; removing them is not a recovery shortcut.

**Why is a revision/history reference rejected?** Reload current configuration/history and review concurrent changes. Controller restart or a new configuration head can invalidate old references.

**What if the old worker cannot stop?** `WORKER_STOP_UNCONFIRMED` blocks updates. Identify and handle the old process before proceeding; do not bypass confirmation by starting a second configuration.

**Why are projections pending after save?** The version is committed. Repair storage capacity/permissions or conflicting directories and let the controller retry. Keep the registry, versions and journal intact.

## API

- `GET /api/tasks/{id}/configuration`: redacted document and optimistic revision.
- `POST .../configuration/validate`: `{config, expectedRevision}` or YAML variant.
- `PUT .../configuration`: same body plus `X-Request-ID`; immutable commit.
- `GET .../configuration/history[?cursor=...]`: metadata and restore references.
- `POST .../configuration/restore/validate`: `{reference, expectedRevision}`.
- `POST .../configuration/restore`: same body plus `X-Request-ID`.

VIEWER/OPERATOR are rejected before reading mutation bodies or config documents.
Version history returns metadata only. Concurrent/stale edits receive 409; malformed
or oversized/deep documents receive 400. A successful save can include
`configurationProjectionPending=true` when a non-authoritative file cannot yet be
materialized. Preserve the version directory and fix storage permissions/capacity;
the controller retries projection repair. It does not pretend an uncommitted file
write succeeded or erase previous history.
