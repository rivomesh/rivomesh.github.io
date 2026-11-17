---
kind: docs
locale: zh
title: "11-17-global-routing · Public global routing / 公开全局控制增量"
sourcePath: docs/verification/2026-11-17-global-routing/README.md
---

# Public global routing / 公开全局控制增量

2026-11-17 · candidate SHA256 `a6eaffa9fd4d3298ecb6dc988dc6b11ddf11be1fe68e3f1c0847f249fb5c0876` · 187921751 bytes.

This archive binds the opt-in fixed-owner global HTTP/UI candidate, including startup STOP/PAUSE ordering. [Manifest](/files/docs/verification/2026-11-17-global-routing/candidate-manifest.json) records frozen JAR/test/source hashes. Seven unchanged SDK artifacts are reused; this is an app-only build, not a fresh reactor/complete connector claim.

| Check | Result | Evidence |
|---|---|---|
| Java8 Maven application |336 executed, zero failure/error/skip; conditional native integration classes explicitly excluded | [build](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/app-build.log) |
| Actual JAR first |336 pass, zero skips | [unit](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/release-unit.log) |
| Five JREs |Java8/11/17/21/25, 131cases each, 655executions; arm64/256MiB | [manifest](/files/docs/verification/2026-11-17-global-routing/runtime-manifest.json) |
| DOM |73 pass | [UI](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/ui.log) |
| PostgreSQL17 control DB |two independent JVMs; HTTPS/shared IAM; A creates B task; offline STOP; kill/reopen/store outage/mixed-mode refusal | [PG](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/postgresql.log) |
| MySQL8.4 control DB |same two-JVM profile plus MyISAM session-table refusal/recovery | [MySQL](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/mysql.log) |
| Actual global-mode CDC |MySQL8.4, two databases, PostgreSQL17/MySQL8.4 targets, keyed/keyless/JSON/generated values, transaction changes, SQL error/retry, offline STOP, journal reopen/catchup, cross-entry config preview/edit/history | [CDC](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/cdc.log), [manifest](/files/docs/verification/2026-11-17-global-routing/cdc-manifest.json) |
| Deployment |Helm/native static parity/negative checks; temporary nonroot Docker health/auth/UI/private files/idempotency/volume reopen | [Docker](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/docker.log) |
| Artifact |Java8 bytecode, bundled drivers, UI resources | [artifact](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/artifact.log) |

Startup regression was first reproduced against6608ed118774: an offline STOP allowed a third Worker start before stopping. [Failure](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/pre-fix-stop-regression.log) is retained. This candidate scans all outstanding command pages before scheduling and suppresses corresponding Worker starts until STOP/PAUSE admission; busy operations can finish; rejected authorization releases the barrier. Both extra boundaries and recovery beyond50commands are covered.

Known remaining defect: later tests found global views omitted validation.reportId and repair.planId, preventing console workflow cards despite successful owner operations. [Reproduction](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-routing/known-operation-projection-failure.log) is intentionally FAILED. The fix and extended global maintenance acceptance belong to a subsequent candidate, not this archive. Candidate463994bca812 then exposed a multi-target receipt-normalization failure; its failed native manifest is retained separately below. Therefore these gates do not establish full global maintenance/UI completion.

CP-02/03 remain PARTIAL. Legacy task import, automatic owner relocation/fencing, independent Worker lifetime, full faults/capacity/browser accessibility and live Kubernetes/CSI remain open. The actual business fixture uses PostgreSQL for the control store and plain HTTP on host-loopback ports; the separate registry fixtures cover HTTPS and both SQL control products. JRE control tests do not establish the full driver/TLS/source/target matrix. Temporary containers/volumes and the tested image were removed; no permanent preview.

本候选已验证固定owner的公开跨入口控制、真实业务CDC和离线STOP恢复；后续发现的报告/计划标识缺失明确保留为失败证据。不得据此关闭全部集群和维护需求，也不得把后续修正算作本候选已通过。

[中文操作手册](/docs/zh/reference/global-control.html) · [English operations](/docs/en/reference/global-control.html).
