---
kind: docs
locale: zh
title: "11-16-node-registry · CP-01：共享节点目录验收 / Shared node registry acceptance"
sourcePath: docs/verification/2026-11-16-node-registry/README.md
---

# CP-01：共享节点目录验收 / Shared node registry acceptance

2026-11-16 · Candidate SHA256: `e42cd685bcc9fb38a1e0e82819230ac58869a54f40c4417d39cd596337b91d11` · Bytes: 187784734

冻结副本 / Frozen copy: `target/release-evidence/node-registry-final.jar`。Docker预览运行同一包。

| Check | Result | Evidence |
|---|---|---|
| Java8 Maven root | 223 = 221 app + 2 SDK; zero failures/errors/skips | [root](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/root-build.log) |
| Actual-JAR-first application | 221 pass | [unit](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/release-app-unit.log) |
| DOM | 63 pass; registry pagination, stale/failure, role and late-response refusal | [UI](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/ui.log) |
| PostgreSQL17 native | two independent directories/JVMs, concurrent bootstrap, remote task observations, kill/stale, rejoin/higher epoch, store outage503 and recovery | [PG](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/postgresql.log) |
| MySQL8.4 native | same scenario; InnoDB/binary-collation registry | [MySQL](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/mysql.log) |
| Session regression | TLS proxy plus8HTTP tests on each of Java8/11/17/21/25;40pass | [TLS](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/sessions-tls.log), [runtime](/files/docs/verification/2026-11-16-node-registry/runtime-manifest.json) |
| Artifact/deployment | Java8 class/resource/driver checks; Helm/native two-release parity and invalid settings | [artifact](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/artifact.log), [deployment](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/deployment.log) |
| Preview | two controllers + PostgreSQL, same SHA, source UI and login/logout | [preview](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/preview.log), [update](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/preview-update.log) |

真实JVM版本/架构与镜像ID见 [Java8](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/java8.log)、[11](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/java11.log)、[17](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/java17.log)、[21](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/java21.log)、[25](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/java25.log)。五JDK仅为会话专项，不是全源/目标兼容矩阵。

Reproduce: root/artifact-first commands follow the [prior commands](/docs/zh/evidence/2026-11-16-browser-sessions-commands.html), then `npm --prefix tests/ui test`, `python3 tests/node-registry-native.py --product POSTGRESQL`, `python3 tests/node-registry-native.py --product MYSQL`, `python3 tests/browser-sessions-tls.py`, `python3 tests/browser-sessions-runtime.py`, `python3 tests/deployment-check.py`, `python3 tests/development-preview-check.py`, `python3 tests/sdd-check.py`.

Native fixtures bind temporary host ports, refresh the published port after container restart, use TCP readiness and remove only their own containers/data. Session IDs/real credentials/private databases are excluded. Workspace prefixes are redacted.

Scope: only CP-01 closes. The registry shares node/task observations, not task/configuration/command authority. Task control scope remains LOCAL, accounts/audit/sessions remain per controller. Worker/global control HA, remote commands, shared sessions, liveK8s/CSI, visual/accessibility and full compatibility/performance matrices remain open. Registry epochs are not Worker failover authority. See [operations](/docs/zh/reference/node-registry.html), [English](/docs/en/reference/node-registry.html), [design](/docs/zh/sdd/design-control-store.html).

Preview endpoints: `http://127.0.0.1:18088` and `http://localhost:18089`; existing admin/token, separate browser sessions. Original TODO is unchanged, see [SDD check](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-node-registry/sdd.log).
