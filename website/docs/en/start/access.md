---
kind: docs
locale: en
title: Accounts and permissions
---

# Assign accounts and permissions

Use individual identities and grant the least access needed for each role.

| Role | Typical access |
| --- | --- |
| VIEWER | Read authorized task states and permitted report summaries |
| OPERATOR | Perform permitted daily operations within task/node grants |
| ADMIN | Manage accounts/configuration and administrative validation/repair workflows |

The API and UI enforce both roles and task/node scope. If a task or action is absent, inspect grants before changing data or state.

## Shared access

With explicit shared-access configuration, nodes share account authority, sessions and audit. Account changes revoke old sessions. Cookie domains, HTTPS, Origin and session limits still apply across entry points.

Optional shared-task mode additionally routes task commands to fixed owners. Shared login alone does not enable global task operations or controller HA.

[Account management](../reference/account-management) · [Task grants](../reference/task-authorization) · [Shared access](../reference/shared-access) · [Security audit](../reference/security-audit)
