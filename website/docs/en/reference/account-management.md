---
kind: docs
locale: en
title: "Account management"
sourcePath: docs/en/account-management.md
---

# Local accounts, roles, grants and token recovery

中文：[账号管理](/docs/zh/reference/account-management.html). Related: [task grants](/docs/en/reference/task-authorization.html), [audit](/docs/en/reference/security-audit.html).

## Scope and interface

Administrators open **Accounts and grants** to create identities, edit roles and task scopes, disable or re-enable accounts, rotate tokens and delete accounts. VIEWER and OPERATOR cannot call account administration APIs. This page covers local bearer-token accounts. Deployments with multiple Controllers use shared accounts and sessions. [Shared access](/docs/en/reference/shared-access.html)

VIEWER reads granted tasks, OPERATOR also controls them, ADMIN manages globally. An empty selected list grants no tasks; all current/future tasks uses `taskIds: null`. ADMIN cannot be scoped. Unloaded task IDs are retained for advance grants; wildcards are rejected.

The last enabled ADMIN cannot be disabled, deleted or demoted. Deletion retains audit identity: the token is revoked and the ID cannot be reassigned. Disabled accounts can be re-enabled. The directory supports at most200 identities including tombstones,10000 exact task IDs per identity; this is not an external-directory capacity claim.

## Configuration and managed authority

Default `accessMode: CONFIG` preserves startup configuration behavior. `authToken/users` may reference environment variables. The account page initially displays them read-only. Reviewing the list and explicitly enabling managed accounts transfers them into the durable directory.

Once activated, `controller.json` is authoritative, even if configuration still says CONFIG. Restart does not overwrite managed tokens/grants from old configuration. Changing a Secret/environment variable is not automatic managed-account rotation. Startup configuration still undergoes syntax/identity validation.

To remove bootstrap credentials after initialization, use [platform-managed.yml](/files/config/platform-managed.yml): `accessMode: MANAGED`, no `authToken/users`, same controller/task directories. An empty directory without an administrator fails startup; it never creates anonymous access.

Linux and Docker deployments reuse the persistent directory. The managed Helm and native Kubernetes examples require initialized Controller storage and matching audit data. Reuse the initialized PVC when replacing the Pod. See the deployment evidence for the tested storage and rollout profiles. [Helm values](/files/deploy/helm/rivomesh/values-managed.yaml) · [Native YAML](/files/deploy/kubernetes/rivomesh-managed.yaml) · [Deployment evidence](/docs/zh/evidence/baseline.html#lg-06-live-kubernetes-rwo-csi)

## Tokens and uncertain responses

The interface generates32 random bytes using browser crypto. Save the token and acknowledge that before submitting. Preview excludes it; lists/audit/responses never return tokens or their digests. New managed tokens require32–4096 visible ASCII characters; imported bootstrap tokens retain the24-character compatibility minimum. Use generated tokens rather than low-entropy strings.

Only SHA-256 token digests are durable; authentication compares digests. No new persistent browser credential storage is used. Closing the editor/directory or signing out clears token inputs. Follow existing [deployment security guidance](/docs/en/reference/console-and-deployment.html) for transport and bearer protection.

Rotation immediately revokes the old token for subsequent requests. Successful self-rotation updates the page credential; disabling/deleting yourself signs you out. Permissions refresh on subsequent requests. Already accepted asynchronous operations may continue: revoking an identity is not pausing a dataflow. Task mutation commit checks the authorization revision and rejects stale callers with `AUTHORIZATION_CHANGED`.

After lost responses, unchanged drafts retry the same request identity/body. If the mutation committed and invalidated the session, sign in again and inspect the current directory. The server retains up to500 account mutation receipts; expired old requests still cannot bypass revision checks. If your self-rotation committed but its response was lost, use the previously saved new token. Do not delete state or modify synchronization checkpoints to fix login.

## Durability, concurrency and audit

Mutations require `expectedRevision` and `X-Request-ID`. Concurrent edits return `ACCOUNTS_REVISION_CHANGED`; reload and review. Identical retained requests do not reapply, and identifiers cannot be reused for another actor/body. Unknown fields and invalid scopes are refused.

Directory changes, version and audit outbox are atomically saved together. Audit chain and a persistent directory-version anchor follow. Unavailable audit fails management requests; already committed changes recover through the outbox rather than pretending rollback. Events record actor/action/subject/version, never credentials. The audit interface shows the affected task/account.

Local managed access stores the account directory in Controller format 2. At startup Rivomesh verifies the directory against its audit version anchor. Missing or mismatched state stops startup. Back up the Controller directory, audit store and configuration versions together. A consistent older backup can restore previously revoked credentials. Review grants, revocations and tokens after restoration, then compare the audit chain with the independently stored checkpoint when available. [Audit checkpoint](/docs/en/reference/security-audit.html)

## Offline administrator recovery

If every administrator token is lost:

1. Stop the controller; retain its storage and audit data.
2. Prepare platform configuration pointing to the same directories. Supply a configured ADMIN/token through `authToken` (`legacy-admin`) or `users`; prefer an environment-provided random token.
3. Run:

   ```bash
   java -jar rivomesh-app-0.1.0-SNAPSHOT.jar recover-access config/platform.yml legacy-admin
   ```

4. The command requires the exclusive controller lock, restores only the selected configured administrator, preserves other identities and task intents, records `ACCOUNT_RECOVER`, and starts no workers. It refuses while the controller runs.
5. Start the service, sign in and review identities/audit. Other configured credentials are not all reactivated.

Missing/corrupt directory or mismatched audit is not mere token loss. Recovery does not bypass those guards; restore coordinated backups first. Do not manually lower state versions.

## API

ADMIN only. Mutations require JSON, `X-Request-ID`, `expectedRevision`.

| Method/path | Other fields |
|---|---|
| `GET /api/accounts` | Returns mode/revision/redacted identities |
| `POST /api/accounts/activate` | None; explicit durable management activation |
| `POST /api/accounts` | id,role,enabled,taskIds,token |
| `PUT /api/accounts/{id}` | role,enabled,taskIds; token is refused |
| `POST /api/accounts/{id}/token` | token |
| `DELETE /api/accounts/{id}` | None; retained identity soft deletion |

Common409 codes: `ACCOUNT_LAST_ADMIN`, `ACCOUNTS_REVISION_CHANGED`, `REQUEST_ID_REUSED`, `ACCOUNT_EXISTS`, `ACCOUNT_TOKEN_COLLISION`. Revoked tokens return401; account administration without permission returns403; ungranted task routes remain404.

## FAQ and evidence

**Will the old configured administrator work after restart?** Managed access does not resurrect it. Explicit offline recovery restores the selected configured administrator.

**Does deleting an account stop its dataflows?** No. Task intents are separate; an authorized operator must pause the dataflow.

**How do I revoke every task grant?** Select scoped tasks, clear selections/additional IDs and save. Do not choose all current/future tasks.

**Which store determines whether I can sign in?** With local managed access, check the directory and audit anchor in the Controller's persistent storage. With shared access, check the shared SQL authority from either Controller. [Shared access](/docs/en/reference/shared-access.html)

The verification archive tracks account grants, session persistence, revocation and the tested deployment profiles. [Verification archive](/docs/zh/evidence/baseline.html)

See [browser sessions](/docs/en/reference/browser-sessions.html) for reload recovery, sign-out and invalidation of all sessions after directory changes.
