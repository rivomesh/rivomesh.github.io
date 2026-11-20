---
kind: docs
locale: en
title: "Shared access"
sourcePath: docs/en/shared-access.md
---

# Shared accounts, sessions and audit

中文：[共享身份](/docs/zh/reference/shared-access.html). Acceptance follows [implementation status](/docs/en/reference/implementation-status.html) and candidate evidence.

Set`cluster.sharedAccess: true`consistently before first deployment,following the[first-release baseline](/docs/en/reference/first-release.html). Shared identity uses one SQL authority;restart recovery remains supported. Existing namespace modes are not automatically migrated. Global tasks additionally require sharedTasks.

Bootstrap imports the selected node's verified managed directory or seeds from configured accounts. Existing shared grants are never overwritten by stale deployment tokens. Start the chosen import node first when migrating existing managed identities. Imported non-administrator accounts are restricted to the importing node to preserve their prior local access. The account editor exposes “All nodes” and selected node IDs; an empty selection grants no node access. Administrators can explicitly expand access after reviewing task-ID collisions. API `nodeIds: null` means all nodes, an array limits nodes, and an omitted field on update preserves the prior grant. Administrator accounts always cover all nodes. Conflicting independent managed directories are not automatically merged; review/export identities and grants before planning adoption.

Back up coordinated local control/accounts/audit/configuration/reports and SQL metadata before migration. Local controller state becomes format3 and binds clusterId/shared-store identity. Old software, disabling sharedAccess and missing/wrong authority refuse startup rather than restoring stale local grants. This is the control-state format, not task formatVersion. Rollback requires coordinated backups and review of revoked credentials, not merely an old JAR.

Pre-import local audit history retains its original chain/payload. The shared chain records its storeId/last-sequence/hash anchor. New HTTP/account/task-outbox events enter the shared chain; endpoints see the same storeId. pendingOperations currently counts only the responding endpoint local outbox; other nodes pending diagnostics remain future work. Local outboxes drain only after shared confirmation; duplicate IDs are idempotent and payload collisions are rejected.

A login at A resumes at B and survives A shutdown/kill/restart. Logout revokes its session globally. Any directory mutation atomically updates revision, revokes all old sessions and writes account audit. Audit failure rolls the transaction back. Every authentication/grant check reads the SQL identity/policy/content marker and audit anchor; matching immutable verified payloads may be reused without offline authentication fallback; outages return503 without local/memory fallback. Session creation checks current revision and expiry uses database time. Bearer and HTTPS/Origin/CSRF rules remain in [browser sessions](/docs/en/reference/browser-sessions.html).

Members must agree on enabled/Secure/remember policy, idle/absolute expiry, session capacity and audit retention. publicOrigin can differ by direct endpoint; a common HTTPS frontend uses the same external origin. Limits:200accounts,10000task grants per account and4MiB serialized directory. Capacity rejects a change without changing prior state. Sessions share one global maximum. Audit uses auditMaxEvents; non-HTTP idempotency receipts are retained separately without automatic cleanup yet, so monitor disk growth.

Organization sign-in with an explicitly bound OIDC identity uses this same session and access authority. [Configure organization sign-in](/docs/en/reference/oidc-login.html)

## Worker credential references

An Agent can opt in to a task-scoped environment allowlist in its platform configuration:

```yaml
workerSecretReferences:
  orders: [ORDERS_SOURCE_PASSWORD, ORDERS_WAREHOUSE_PASSWORD]
  billing: [BILLING_SOURCE_PASSWORD]
```

Provision the named variables in that Agent deployment and reference them in the corresponding task's existing source (including Oracle root and PDB), destination or journal password fields or messaging token field. A task accepts only its assigned names in those fields. The Worker receives only the names actually referenced by that task, plus essential OS variables. Names assigned to another task, references used as a task or node identity and missing values return a typed refusal. Management, control-store and process override variables remain protected. An omitted allowlist keeps the existing deployment behavior. An empty map allows no task environment references. Set and maintain grants on the execution Agent, because the Controller sends the task configuration with unresolved references.

Configuration responses show opaque, field-bound retain references in place of credential values and original variable names. Workers run as trusted SDK processes under the installation user. Keep Agent access and private data directories under the corresponding deployment identity.

## Correlate a remote operation

Export the shared audit window from either Controller. Compute SHA-256 of the operation's request ID and match it to `clientRequestHash` and `taskId`. In a `GLOBAL_COMMAND_OUTCOME` row, `subjectId` identifies the executing Agent. For a repair, the matching owner `OPERATION_COMMITTED` row carries the repair plan ID as its `subjectId`. Both records are available in the same shared audit chain.

## Deployment

Enable the field in [platform-cluster.yml](/files/config/platform-cluster.yml), keeping independent local directories. Helm has [values-shared-access.yaml](/files/deploy/helm/rivomesh/values-shared-access.yaml); native YAML has [shared-a](/files/deploy/kubernetes/rivomesh-shared-a.yaml) / [shared-b](/files/deploy/kubernetes/rivomesh-shared-b.yaml). Supply dedicated store credentials through Secret. Live Kubernetes/CSI/controller HA remain separate acceptance.

## Recovery and FAQ

- `WORKER_SECRET_REFERENCE_DENIED` or `WORKER_SECRET_REFERENCE_UNSET`: check the task ID, credential field, Agent-local grant and provisioned variable. After changing the deployment policy, restart the Agent to load it and retry the task.
- Lost all admin tokens: stop one local controller and use the existing access-recover command with a protected configured ADMIN seed. Shared mode updates SQL authority, revokes sessions and audits recovery atomically. Verify and rotate temporary credentials.
- SHARED_ACCESS_QUIESCENCE_REQUIRED: stop all old members gracefully; STALE is not confirmed stopped. If isolation is uncertain, plan/verify it before switching, without editing STOPPED records directly.
- SHARED_ACCESS_REQUIRED: restore the bound cluster/sharedAccess configuration; disabling it cannot revive old local tokens.
- SHARED_ACCESS_STATE_REQUIRED/IDENTITY_CHANGED: restore matching SQL identity/backup/connection settings. Missing authority is never reseeded from stale configuration; do not delete local bindings.
- SHARED_ACCESS_DIRECTORY_CONFLICT: back up/export/review the independent directories before adoption/merge; privileges are not silently expanded.
- SHARED_ACCESS_POLICY_MISMATCH: align expiry/cookie/capacity/audit settings across members.
- ACCOUNT_DIRECTORY_CAPACITY: review account/grant volume; rejected changes preserve prior state.
- Recovery still shows login: check real expiry/logout/directory revocation. Valid shared sessions recover without the failed controller's memory.
- Different local/shared audit sequence: they are separate store chains linked by migration anchors/event IDs. Never rewrite/concatenate historical payloads as one chain.
- Can old backups restore revoked access: a consistent old backup can contain old grants. External immutable rollback detection remains unfinished; review revocation/rotation after restore.
