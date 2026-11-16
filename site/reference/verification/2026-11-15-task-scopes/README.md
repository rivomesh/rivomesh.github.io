---
sourcePath: docs/verification/2026-11-15-task-scopes/README.md
---

# Exact task grants acceptance / 精确任务授权验收

2026-11-15. Final actual release SHA-256 `db7533e0631c909b33c9a75257f98807a1dc72a1d61854b69a4aa1fd45cdcd45`, 145762716 bytes.

- Maven:2 SDK +99 app unit/API tests passed, no fail/error/skip. The subsequent final package changes only empty-state UI wording; no Java changes.
- Actual final release: all99 application unit/API tests passed with the final fat JAR first on the classpath and fresh compiled test classes, Java8/JUnit Platform1.11.0. These are repeat executions, not99 additional distinct tests.
- UI:29 DOM checks passed, including scoped-session count/IDs, empty grants explanation and sign-out clearing. No visual/accessibility claim.
- Native actual release: private platform configuration loaded through production PlatformConfig.load, environment-supplied role tokens, exact/empty task grants, filtered listings, denied direct GET/action, legitimate scoped asynchronous CHECK, scope enforcement after SIGKILL/restart, full native Python hash-verified audit export and deleted-audit-store refusal. The independent fixture uses a stub database backend.
- Same exact release: actual MySQL8.4→PostgreSQL17.12 stopped target-password rotation, revision restore and controller restart with deleted projections preserve stream/snapshot identities and CDC;146 native audit events independently verified by Python.
- Helm/default/RBAC/scoped-profile native parity, exact/empty grants, wildcard/duplicate/scoped-admin rejection passed. This is static validation, not a live Kubernetes test.

Raw private JSONL exports/settings remain under target/audit-native/rivomesh-audit-bce2e55ebb/. Isolated containers cleaned. User-management/grant editing UI, OIDC/SSO, external immutable audit and full platform requirements remain unfinished.
