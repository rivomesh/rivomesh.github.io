---
kind: docs
locale: zh
title: "11-16-shared-access · B7候选记录 / Candidate B7"
sourcePath: docs/verification/2026-11-16-shared-access/attempt-b7/README.md
---

# B7候选记录 / Candidate B7

SHA256: `b7b969029f0ce93a403bddb70daa2708f5fd9a675a23fc51e4e5fabb6b7e2dab` ·187812546bytes。此候选未完成发布门禁，未更新Docker预览。

Passed:240root/238actual-JAR-first/68DOM;PostgreSQL/MySQL shared-identity two-node native scenarios;33control cases on each of Java8/11/17/21/25. Earlier concurrent Java17 HTTP timeout is retained;unchanged serial rerun passed. These are limited control/runtime profiles,not complete connector certification.

Full managed CDC regression reached typed SQL reads and keyed/keyless difference details. A90s startup budget expired with all3source snapshots complete and target acknowledgments PG2/MySQL3. The300s budget run advanced to repair-plan creation,then encountered H2 AUTO_SERVER90067/connection refused after a paused controller repeatedly closed its LOCAL keeper. See[complete failure](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/attempt-b7/cdc-h2-autoserver-failure.log),[retained progress](/files/docs/verification/2026-11-16-shared-access/attempt-b7/cdc-retained-progress.json),[earlier90s](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/attempt-b7/cdc-90s-budget.log) and[concurrent fence](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-16-shared-access/attempt-b7/cdc-concurrent-fence.log).

后续修正保持已打开LOCAL日志连接至配置替换/控制器关闭，另行生成并验收新包。These records remain historical and are not relabeled as evidence for that new binary. No private state databases or real preview credentials are included.
