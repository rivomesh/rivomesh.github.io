---
kind: docs
locale: zh
title: "11-16-shared-access · SE-04：共享身份、会话与审计 / Shared identity, sessions and audit"
sourcePath: docs/verification/2026-11-16-shared-access/README.md
---

# SE-04：共享身份、会话与审计 / Shared identity, sessions and audit

2026-11-16 · Candidate SHA256: `a1ec34fc060b4078cdaa10f357d5933f4df60f5b9616519433c851ddad69fa4a` · Bytes: 187849904

冻结包 / Frozen artifact: `target/release-evidence/shared-access-journal-final.jar`.
候选、源码及测试快照哈希见 [manifest](/files/docs/verification/2026-11-16-shared-access/candidate-manifest.json)。Source/test manifests identify frozen acceptance inputs; subsequent development is outside this candidate.

| Check | Result | Evidence |
|---|---|---|
| Java8 application build | 273 pass, zero failures/errors/skips | [build](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/app-build.log) |
| SDK verification | 2 fresh Classic SDK tests pass; seven unchanged SDK artifacts reused after source/POM/hash verification, no fresh full-reactor reshading claim | [tests](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/sdk-tests.log), [cache](/files/docs/verification/2026-11-16-shared-access/sdk-cache-manifest.json) |
| Actual-JAR-first application | 273 pass | [unit](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/release-app-unit.log) |
| DOM | 68 pass; includes node grants and session handling; no screenshot/accessibility claim | [UI](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/ui.log) |
| PostgreSQL17 HTTPS | independent controllers/directories, cross-node login/logout/revocation, kill/reopen, control-store outage503/recovery, mixed authority refusal | [PG](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/postgresql.log) |
| MySQL8.4 | same native shared-access cases; MyISAM session-table refusal and InnoDB recovery | [MySQL](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/mysql.log) |
| Java8/11/17/21/25 controls | 68 cases each, 340 executions; heap256MiB; control/session/security/store foundations only | [runtime](/files/docs/verification/2026-11-16-shared-access/runtime-manifest.json) |
| Actual CDC and repair | MySQL8.4 to PostgreSQL17 + MySQL; LOCAL/H2 journal; typed differences, reviewed repair, rollback, lost commit reply, SIGKILL, receipts, cancellation and controller reopen | [CDC](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/cdc-repair.log) |
| Docker and deployment | nonroot health/auth/UI, config permissions, idempotency and volume restart; Helm/native parity and heap limits | [container](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/container.log), [deployment](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/deployment.log) |
| Artifact | Java8 bytecode/resources/drivers accepted | [artifact](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/artifact.log) |

Scope: SE-04 closes for the documented opt-in PostgreSQL/MySQL shared-access profile. Shared accounts, node/task grants, fresh authorization, SQL sessions, CSRF, directory-revision revocation and one hash-chained audit authority are implemented. Controller kill/reopen preserves unexpired shared sessions. A missing or unavailable authority fails closed; there is no offline identity fallback. Shared-access protocol admission refuses registry-only members, and initial upgrade requires old members STOPPED.

CP-05 remains PARTIAL: Worker environment filtering is implemented, but least-secret references, complete remote-operation correlation and filesystem/process isolation remain open. CP-02/03 remain open: GlobalTaskStore, ControlCipher, typed requests and DurableCommands are tested foundations and are not yet exposed as working global task execution. Task control scope remains LOCAL. Registry epochs do not establish Worker failover safety.

LOCAL journal lifecycle now retains an existing H2 keeper across PAUSED/STOPPED observations until controller close or configuration replacement, avoiding repeated AUTO_SERVER endpoint replacement. Never-started tasks do not create a journal. The full CDC/repair regression exercises the fix.

The user requested no persistent preview. This acceptance uses temporary fixtures; their containers, volumes and the transient validation image were removed. Historical B7 attempts remain in [attempt-b7](/docs/zh/evidence/2026-11-16-shared-access-attempt-b7.html), explicitly separate from this accepted hash. No liveK8s/CSI, full connector/JDK/TLS matrix, arbitrary skip/patch, automatic task failover, commercial distributed GaussDB or production capacity certification is claimed.

复现与边界 / Reproduction and limits: [commands](/docs/zh/evidence/2026-11-16-shared-access-commands.html), [共享访问手册](/docs/zh/reference/shared-access.html), [English](/docs/en/reference/shared-access.html), [design](/docs/zh/sdd/design-shared-access.html).
