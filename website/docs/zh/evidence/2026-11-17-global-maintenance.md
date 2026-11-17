---
kind: docs
locale: zh
title: "11-17-global-maintenance · Global maintenance and recovery / 全局维护与恢复"
sourcePath: docs/verification/2026-11-17-global-maintenance/README.md
---

# Global maintenance and recovery / 全局维护与恢复

2026-11-17 · SHA256 `b2b9a078beff8ba845704a2393a3cc5e870f7b9c3c975367693f78c3bf66c238` · 187921997 bytes.

[Candidate manifest](/files/docs/verification/2026-11-17-global-maintenance/candidate-manifest.json) binds frozen `target/release-evidence/global-canonical-final.jar`, test classes and source hashes. App-only Java8 build reuses seven unchanged SDK artifacts after hash/source verification. No fresh full-reactor claim.

| Check | Result | Evidence |
|---|---|---|
| Application package |339 executed;zero failures/errors/skips; conditional native integration classes explicitly excluded | [build](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/app-build.log) |
| Actual-JAR-first application |339 pass;zero skips | [unit](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/release-unit.log) |
| Java8/11/17/21/25 maintenance controls |143cases each,715executions,256MiB,arm64; not full driver/TLS/adapter matrix | [manifest](/files/docs/verification/2026-11-17-global-maintenance/runtime-manifest.json) |
| UI |73 DOM cases on unchanged seven UI resources; strict JAR/source resource gate passes | [DOM](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/unchanged-ui.log), [artifact](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/artifact.log) |
| PostgreSQL17 control DB |two independent JVMs,HTTPS,shared IAM/revocation,remote creation/offline STOP,kill/reopen/control-store outage,old-mode refusal | [PG](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/postgresql.log) |
| MySQL8.4 control DB |same protocol plus nontransactional session-table refusal and recovery | [MySQL](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/mysql.log) |
| Actual global-mode CDC/maintenance |MySQL8.4,two databases,PostgreSQL17/MySQL8.4 targets; snapshot and transaction content,JSON/generated/keyless; SQL error/retry; SIGKILL/offline STOP/journal catchup; cross-entry config edit/restore; actual validation/differences/raw values/reviewed keyed repair/explicit resume | [CDC](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/cdc.log), [manifest](/files/docs/verification/2026-11-17-global-maintenance/cdc-manifest.json) |
| Old UNKNOWN upgrade |old463994bca812 owner actually finishes two-target validation but records UNKNOWN; new owner reopens original directory and reconciles the SAME request/report; then four keyed/keyless target-table repairs restore exact multiplicities | [upgrade](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/upgrade.log), [manifest](/files/docs/verification/2026-11-17-global-maintenance/upgrade-manifest.json) |
| Docker/deployment |temporary image from production runtime stage with exact frozen JAR;nonroot health/auth/UI/private files/idempotency/persistent-volume reopen; Helm/native static checks | [Docker](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-maintenance/docker.log), [image](/files/docs/verification/2026-11-17-global-maintenance/image-manifest.json) |

Global views retain owner workflow metadata required by validation/repair cards without replacing durable routing, actor, revision or outcome authority. Local action signatures apply the same validated input normalization as admission, including sorted multi-target/scope sets and explicit null retry targets. Generated report/plan IDs stay out of the original request signature. Old committed receipts remain verifiable; the native upgrade test establishes reconciliation rather than issuing another validation.

The normal CDC fixture starts both controllers with this JAR and repairs two keyed tables. The upgrade fixture starts A on this JAR and B on463994bca812, reproduces the old bug, reopens B on this JAR and additionally repairs both keyless target tables. Both remove their own containers/volumes. Business fixture HTTP is loopback/plain HTTP; separate two-node fixtures verify HTTPS/shared sessions on both control products. Frozen scripts are included for evidence; their original repository location determines ROOT when reproducing.

Earlier failures remain [archived](/docs/zh/evidence/2026-11-17-global-routing.html), including the pre-fix Worker restart race, missing workflow identities and463994bca812 native signature mismatch. They are not rewritten as passing evidence.

CP-02/03 remain PARTIAL: legacy task import, complete cancel/fault/capacity/visual/accessibility profiles and related migration acceptance remain open. Automatic owner relocation/fencing, independent Agent/Worker lifetime and live Kubernetes/CSI are not established. Existing common-cut repair does not implement failed-transaction patch/skip/gap ledgers or business cutover. No permanent preview; tested temporary image and containers/volumes removed. Other projects untouched.

本候选验证了全局维护字段、多个目标的回执归一化、原UNKNOWN升级恢复及真实跨入口修复。任务修复后保持PAUSED，显式恢复才继续增量。完整集群接管、执行生命周期分离、人工事务跳过/补丁及全产品矩阵仍未完成。

[中文操作手册](/docs/zh/reference/global-control.html) · [English operations](/docs/en/reference/global-control.html).
