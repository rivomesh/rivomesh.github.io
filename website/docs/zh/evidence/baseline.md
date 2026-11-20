---
kind: docs
locale: zh
title: "首版验证基线 / Verification baseline"
sourcePath: docs/verification/README.md
---

# 首版验证基线 / First-release verification baseline

仅保留当前基线索引；开发过程中的重复源码/脚本副本、失败尝试和逐次快照已从工作树移除。Git提交历史保留追溯。操作文档见[中文实施状态](/docs/zh/reference/implementation-status.html)和[English](/docs/en/reference/implementation-status.html)。

The compact [baseline](/files/docs/verification/baseline.json) preserves the exact bounded acceptance provenance. Earlier results are not relabelled as fresh validation of cleanup changes. Current validation status is tracked in baseline.json. No production compatibility or full product matrix is implied.

新增构建、运行和验收仅使用 Eclipse Temurin 21 LTS。其他 JDK 条目保留原制品、范围和复现命令。Reproduce earlier JVM profiles from the source and artifact specified by their records. [固定历史快照 / Fixed historical snapshot](https://github.com/rivomesh/rivomesh/blob/419945c98f197bd6cc1c6cc3e75e9c6a4bb3188c/docs/verification/baseline.json)

| SDD | 已验收范围 / Accepted scope | 原验收产物 SHA-256 |
|---|---|---|
| CP-01 | Bounded profile | `e42cd685bcc9fb38a1e0e82819230ac58869a54f40c4417d39cd596337b91d11` |
| CP-07 | Java8 real CDC;fixed Agent;LOCAL/H2 journal;MySQL8.4 source;PostgreSQL17/MySQL8.4 targets;PostgreSQL17/MySQL8.4 control | `aa17cf5b6d9c21e302af818c5f48ff7c46bbb32d3a532ab1fa0491abe43403bf` |
| SE-01 | Bounded profile | `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3` |
| SE-02 | Bounded profile | `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3` |
| SE-03 | Bounded profile | `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3` |
| SE-04 | Bounded profile | `a1ec34fc060b4078cdaa10f357d5933f4df60f5b9616519433c851ddad69fa4a` |
| SE-05 | Bounded profile | `95127453ff4e6b9a6b0f16d80ea1a16c2c5861b4a260226e875bab6bc72c60a3` |
| RC-02 | Bounded profile | `bcaae9309898a33ecfe919d69bfa6c43227647524498f8269682df44942cbcbe` |
| RC-03 | Java8;MySQL8.4 two-database source;original fixed Agent;LOCAL/H2 journal;PostgreSQL17 business skip target;PG17/MySQL8.4 control stores;native PG/MySQL contracts;both pauses retained | `656245c6ed5d8c80c3017ed319e3802d8974f03e69f432a2ec64f0566660ac74` |
| RC-05 | Java8;MySQL8.4 source;original fixed Agent;LOCAL/H2 journal;PostgreSQL17/MySQL8.4 control stores;public real-CDC PostgreSQL confirmation;native PG/MySQL transaction contracts;whole task paused | `9f97b4d98c103e895c9d1262cd19dcd0946b21b6fc0f72fff2267e59c727de00` |

最新清理前的功能档案：Java8、MySQL8.4双库源、原Agent/LOCAL日志、PostgreSQL业务目标，PG/MySQL控制库各26项真实同步检查，PG/MySQL原生合同各34项、96 DOM及发布包51项专项。34项中含现已删除的开发版兼容探针；清理后的原生恢复回归改为32项，不能将两者相加。首次全量回归的租约过期与51项定向重跑情况在baseline.json中如实保留。

The cleaned baseline removes automatic control-mode migration and historical binary tests. Namespace mode remains fixed and mismatches refuse;lease fencing,data integrity and current recovery tests remain. V2/V3 execution consolidation is a separate pending cleanup batch.

当前公开缺口核验构建包：`3404041b03ed0a407777366056b509778f4c93e12dea0a4f14572b01670a63ce`。

- 87项扩展合同通过，最终改动后23项专项通过；重叠项不相加。
- PostgreSQL17/MySQL8.4日志及目标各54项发布包优先合同通过。
- 102项DOM重新运行通过，覆盖计划范围、摘要审批、取消、响应丢失重试、权限和退出登录。
- PG17/MySQL8.4控制库各27项真实CDC检查通过：Java8、MySQL8.4双库源、原固定Agent/LOCAL-H2日志、PostgreSQL17业务核验目标、MySQL8.4健康订阅；两管理入口审阅和重新扫描两张表，原子记录两条缺口。测试资源均清理。

RC-08首批SQL档案已验收；其他目标由RC-10/LG-03/LG-04跟踪，更广源/JDK/K8s矩阵仍未验收。[中文核验指南](/docs/zh/reference/gap-verification.html) / [English](/docs/en/reference/gap-verification.html)。

The same candidate passes bounded native and public real-CDC gap verification. Historical results above are provenance rather than fresh certification. No complete connector/source/JDK/K8s recertification is claimed.

RC-08水位收尾候选：`abee42cfb26ee3623c419f9d43d9dbe6a429508a8dd01da33da38338dcdcf372`。22项定向检查、103项DOM及PG/MySQL各58项原生合同通过。当前包复验只读水位、API/界面与原生恢复合同；未改变的审批/事务写入链路复用上面的3404041真实CDC27项/控制产品结果，不将旧结果改称本包重跑。复用理由及确切版本记录在baseline.json。

Coverage includes explicit SKIP;the contiguous SQL applied prefix stops before the first skip and is unchanged by historical verification. Broker/materializer acknowledgments have distinct semantics and never claim downstream-consumer completion. All incremental sequence fields used by this view are exact decimal strings.

RC-06 补偿候选包 `d1b1595b8efbe4a6e2258f899836fa53cf33b2c11d31f621c5fc4ca9955b67a3` 通过 32 项 Java 定向检查、104 项 DOM、PostgreSQL 17 和 MySQL 8.4 各 4 项原生检查，以及 18 项真实 CDC 检查。真实链路使用 MySQL 8.4 双库源、PostgreSQL 控制库、原 Agent 与 LOCAL/H2 日志。跨入口补偿 PostgreSQL 目标的主键冲突，恢复了三张表的四个受影响标识，再由正常 CDC 重放。MySQL 是健康对照订阅，MySQL 目标的补偿结论来自原生检查。

RC-07 手工修正候选包 `33a1d4dca6a381664855c0ae96100fa9da004a61070155b0ed7a646c6a2c4f25` 通过 39 项 Java 定向检查、107 项 DOM、PostgreSQL 17 和 MySQL 8.4 各 4 项原生检查及 18 项真实 CDC 检查。真实链路使用两个管理入口、原 Agent、LOCAL/H2 日志和 PostgreSQL 控制库。用原始 JSON 批次补回目标缺失行，按 ROW_ID 修改无主键行并删除多余行。管理员审批后显式恢复并重放原事务。任务记录只带范围和摘要。

### SO-04 · MySQL 8.2.0

Java 8 的 V3 反应堆测试通过 56 项，包括多库全量与增量、无主键、JSON、生成列、LOCAL 和外部日志及原事务恢复。冻结包 `cce6a099cd6edc00fa0713689aa20a80a1b67a6443dfd756fa23186a340b6829` 另通过两项原生 HA 检查。GTID 主从提升后从已有断点继续，单主组复制在全量中途选主后只重取未完成快照。验证源为 ARM64 的 `mysql:8.2.0`，启用 GTID、ROW binlog 和 FULL 行镜像。

The Java 8 reactor passed 56 V3 tests. The frozen package passed one native async promotion scenario and one native single-primary group election scenario. The HA profiles used PostgreSQL and openGauss targets. Reproduce all three source profiles with `tests/matrix.sh --v3 8.2.0`. JV-02 tracks the other JDK combinations.

### RC-09 · 跨节点恢复作业 / Distributed recovery jobs

候选包 `c5a11f6ec7a52f94bd9b305708a1d0c08c8b2ce6387ced762ec8ecfac05bb9a3` 通过 42 项 Java 检查、108 项界面检查、4 项 PostgreSQL 原生补偿、4 项 MySQL 原生修正和 14 项真实 CDC 检查。两个控制器以原请求 ID 取消排队和运行中的作业。补偿及手工修正均在等待目标 SQL 锁时强杀 Agent，验证无部分写入，以原请求继续。目标提交后、Agent 写入本地结果前再强杀 Agent，并关闭原管理入口。重启后由仍在线的入口读取同一原生回执，目标保持暂停，日志 ACK 不动。

Real CDC used MySQL 8.4 source and healthy peer, PostgreSQL 17 recovery destination and control storage, Java 8, and the original Agent with a LOCAL/H2 journal. PostgreSQL compensation and MySQL correction separately passed four native checks each. The process fault fixture is test-only.

### JV-01 · 五 JDK 真实进程 / Five-JDK runtime

候选包 `c5a11f6ec7a52f94bd9b305708a1d0c08c8b2ce6387ced762ec8ecfac05bb9a3` 在 ARM64 上实际启动两台 Controller、一台 Agent 和一台 Worker。五个 JVM 版本分别为 1.8.0_512, 11.0.33, 17.0.21, 21.0.13, 25.0.5。每个版本通过 5 项检查，包含 MySQL 8.4 源到 PostgreSQL 17 / MySQL 8.4 的全量与增量、进程版本和夹具清理。

All four running processes used the expected JVM on each JDK. The candidate passes the class-file level 52 and packaged driver checks. JV-02 and JV-03 track the broader database, connector and TLS combinations.

### RC-01 · 源与目标故障阶段 / Pipeline fault phases

候选包 `f7b7dfb7c88785a8622077edbed3ec2f6d800f8c9a035ea1a4e73217322f90a3` 通过 48 项 Java 定向检查及 109 项界面检查。真实 CDC 的源断线与 DDL 档案 6 项、解码档案 5 项、目标准备/快照/应用档案 19 项分别通过。MySQL 原生事务档案 4 项通过，并启动了含阶段记录表的 MySQL 日志库。

Source connection loss is observed from both management entries and CDC resumes after the source returns. DDL and partial row images retain the original GTID and error generation across Agent restart. Destination preparation, snapshot and apply failures keep their own phases. Focused tests distinguish normalization from a journal ACK failure after a native destination commit.

### SO-03 · MySQL 8.0.46

Java 8 候选包 `f7b7dfb7c88785a8622077edbed3ec2f6d800f8c9a035ea1a4e73217322f90a3` 通过 5 项 V3 单机实库测试、GTID 主从提升和单主组复制选主各 1 项，以及 14 项跨入口恢复检查。恢复测试覆盖 PostgreSQL 目标与 MySQL 健康对照、全量转增量、前镜像补偿、类型化修正、取消及强杀后原请求恢复。

The source was MySQL 8.0.46 with GTID, ROW and FULL enabled. Run the three topology profiles with `tests/matrix.sh --v3 8.0.46`. Pass `--source-image` to the global CDC recovery runner to select the same MySQL patch version.

### SO-01 · 源配置与适配入口 / Source configuration

候选包 `4722408f57a63e883147b979c3c706dd20d1ff6cf9aefcc6cba973fbb8c96ee2` 通过 Java 43 项、界面 109 项、MySQL 原生 2 项和真实 CDC 5 项检查。原生检查确认可按主次版本或精确补丁验证目标 MySQL 实例。双入口用 `source.type: MYSQL` 和 `source.expectedVersion: "8.4"` 创建任务，并完成全量与增量。

Capture, preflight and common-cut validation share the source adapter entry point. PostgreSQL and Oracle source execution remain tracked in SO-06 and SO-07.

### SO-05 · MySQL 8.4.13

候选包 `d7fc2e8bad6f4ddcb4a7a1e4eda248214df6c88976d0c02449e37e4651b543b0` 通过 41 项 Java 检查、109 项界面检查、6 项 V3 单机实库检查和两项真实选主检查。独立日志档案验证了非 FULL、匿名模式、部分 JSON、压缩事务和带标签历史的拒绝。部分 JSON 与压缩事务也通过了采集中的原生事件拒绝测试。该包在五个 JDK 复跑 Controller、Agent 和 Worker 启动、全量与增量。

Native MySQL version was 8.4.13. Reproduce the profile with `tests/mysql84-profile-run.sh` and `tests/matrix.sh --v3 8.4`.

## SO-06 PostgreSQL 17 source pilot

Candidate `ff8208b7758f335a103202e21e1370c44505fb488a926a7502b032cb071ccb66` passed 42 Java checks, 110 console checks and seven native cases on PostgreSQL 17.12. PostgreSQL uses pgJDBC 42.7.14 with automatic flush advancement disabled. Verified snapshot and CDC across two schemas, JSONB, keyless rows, idle keepalive, SQL recovery, same-slot LSN restart and lost-slot refusal. Promotion, generated columns and common-cut verification remain open. See the [English guide](/docs/en/reference/postgresql-source.html) and [Chinese guide](/docs/zh/reference/postgresql-source.html).

## SO-02 MySQL 5.7 V3

Artifact `d7fc2e8bad6f4ddcb4a7a1e4eda248214df6c88976d0c02449e37e4651b543b0` passed six standalone tests, one asynchronous GTID promotion test and one single-primary MGR test on Java 8. The asynchronous fixture reproduces replica SQL error 1032, recovers and promotes, then removes a binlog containing an uncaptured transaction. Rivomesh refuses restart with `SOURCE_LOG_GAP`, preserves the original journal position and sequence, and leaves the missing row unapplied. The container is MySQL 5.7.44 linux/amd64. Reproduce with `tests/matrix.sh --v3 5.7.44`.

## RC-04 capture review

Candidate `ff8208b7758f335a103202e21e1370c44505fb488a926a7502b032cb071ccb66` passed six native MySQL 8.4 checks with two controllers and an independent Agent. Both entries returned the same read-only review after a decode fault and Agent restart, with every affected subscription listed and the original error generation and GTID retained. PostgreSQL missing-slot review kept the original LSN and left the slot absent. A later candidate verified bounded MySQL source-range proof and approved exclusion. See the [operator guide](/docs/en/reference/capture-recovery.html).

The same candidate also passed the MySQL 5.7.44 PostgreSQL-only asynchronous promotion fixture. After a real uncollected binlog was purged, the review returned `SOURCE_LOG_GAP`, the affected subscription and the original captured sequence. Reproduce with `SYNC_MYSQL57=1 SYNC_MYSQL57_IMAGE=mysql:5.7.44 SYNC_V3_HA_POSTGRES_ONLY=1 tests/v3-ha-run.sh`.

## LG-06 live Kubernetes RWO CSI

The image built from JAR `16efe0b21bad57fda1418195484595ac20b8e5579f4763f4a109e474beef44a9` passed four live checks each on Helm and native YAML in a two-node Kubernetes v1.31.0 ARM64 cluster. The checks exercised browser refresh, real PostgreSQL snapshot/CDC, RWO CSI remount across scale 0/1, configuration rollout and Secret rotation. Node-local CSI and single controller are the tested profile. See the [deployment guide](/docs/en/reference/console-and-deployment.html#two-node-live-verification).

The native profile also stopped a separate worker while the PostgreSQL fixture remained available on the control plane. It confirmed that the target stayed at its previous value, recovered the same CSI claim on the original node and delivered queued data under a newer journal lease.

The shared NFS CSI 4.13.5 profile tested Kubernetes v1.31.0 ARM64 with NFS v4.0. Helm and native YAML each passed six checks. Both started JAR `b95d036f0d5f633de1a311581f70ad67c126af0b22b72f26240fa5d6934c6d32`, then replaced it with `9cc5da0987cc78609988d7a75d5c3de9ae0129e334d16e8abdf1ba31c6373365`. Each upgrade retained the claim UID, CSI volume handle and snapshot ID. A new lease resumed SQL delivery after replacement. Scale-down removed the old pod before mounting the same claim on the other node, which delivered an update written during downtime without a manual START. The epochs advanced 2 → 3 on replacement and 3 → 4 on the move. The earlier physical worker outage and stale Worker profiles cover node failure and lease fencing. [Manifest](/files/docs/verification/baseline.json) · [CSI test fixture](/files/tests/kubernetes-nfs-fixture.yaml)

## DO-01 bilingual SDD verifier

Verifier SHA-256 `d2a9fb5e16014825a51fbbd0569e885eeb00d7954ccf57c7724b5bd1fa8aef08`. The check verifies stable IDs, unique tasks and acceptance rows, criteria rendered in both languages, acyclic dependencies, progress totals and archived evidence. The criteria checksum detects a changed acceptance scope.

## SO-07 Oracle SCN preflight

Artifact `4e19cc6dd662de282ebc63b3da1ce6dbea6d918ab230de35c1299d56c8f5d27c` passed four Oracle Free 23.26.4.0.0 ARM64 native checks on Java 8. The probe validates root and PDB authority, checks Flashback on keyed and keyless tables and refuses a mismatched service. The fixture observed the original values and duplicate multiplicity after a later update and delete. CDC integration remains open. See the [preflight guide](/docs/en/reference/oracle-source.html).

## PostgreSQL source runtime matrix

Artifact `4e19cc6dd662de282ebc63b3da1ce6dbea6d918ab230de35c1299d56c8f5d27c` ran seven native PostgreSQL 17.12 source cases on each of Java 8, 11, 17, 21 and 25, a total of 35 historical cases. The baseline records their runtime versions and image IDs. The current fixture runs Temurin 21 with `python3 tests/postgres-source-run.py --artifact <candidate jar> --output target/pg-source-proof`.

The same Oracle 26ai image also passed the native `--logminer` archive check. The source exposes redo/undo SQL, a common commit SCN and XID for keyed update and keyless delete, and excludes the rolled-back insert.

## DO-03 bilingual recovery runbook

Artifact SHA-256 `f69e54391a22d1ff4564deb2f272a06d4850c5ea7dfe75f8f86a32601c68ee23` covers the Chinese and English Markdown in that order. Both versions cover promotion, missing logs, target SQL and uncertain commit, node and journal outage, browser state, skips, compensation, correction, and cutover. The scope and relative links were checked against the current operator guides.

## LG-10 release inventory

JAR `5c33b78a9fec625db629d11c65453d04ea1ea5279c708b92348fd0c6413ec2c8` and CycloneDX BOM `8361ded69144d17b670a3695ecee29bd2e303a1d088a3775e813d69bc84aba44` were compared. The inventory records 175 Maven components, 109 embedded coordinates, six without an aggregate coordinate, nine without declared license metadata, two vendor markers, and nine notice/license file hashes. See the [release inventory guide](/docs/en/reference/release-inventory.html).

## Oracle archive coverage

Artifact `5c33b78a9fec625db629d11c65453d04ea1ea5279c708b92348fd0c6413ec2c8` passed seven Oracle Free 23.26.4.0.0 Java 8 checks. The probe returned a contiguous catalog interval after archive rotation and refused a wider interval containing unarchived changes. The separate LogMiner test confirmed committed transaction contents from actual redo.

## Oracle typed archived changes

Oracle Free 23.26.4.0.0 ARM64 on Java 8 passed eight native checks on artifact `a59076b9c8d364a47a2848a59179ca70b05ceae8b52e655427f9d15ae3e0404e`. The scoped JDBC account opened the archived files with LogMiner. The same Oracle update and keyless delete decoded into one typed transaction with identical content hashes on two reads. A rolled-back insert stayed outside the committed set and the unarchived suffix was refused. See the [native fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/oracle-source-probe.py) and [manifest](/files/docs/verification/baseline.json).

## Capture lease through two controllers

Artifact `5c33b78a9fec625db629d11c65453d04ea1ea5279c708b92348fd0c6413ec2c8` passed 18 native PostgreSQL control-store and MySQL 8.4.13 source checks with two controllers and a distinct Agent/Worker. Both entries displayed the same journal lease independently of Worker process liveness. The disconnected owner produced unknown lease state. A durable STOP accepted while the owner was offline prevented Worker restoration and left the lease inactive. The console passed 111 DOM checks. [Native manifest](/files/docs/verification/baseline.json)

## Large-payload journal performance

Artifact `c2459566253bee13e7435565d05bac136118703b13314cf6ebffdc190dead410` passed 43 focused Java tests. On an ARM64 Apple M1 Pro Docker Desktop host, both LOCAL and EXTERNAL reached source/target hash equality on 100,000 snapshot rows and 120,000 changes. Each fixture used one CPU per container and a 256 MiB Worker heap, and both cleaned up successfully. During diagnosis, native PostgreSQL EXPLAIN showed a sequential scan for a NUMERIC parameter against the BIGINT key. Binding the same key as BIGINT used the primary-key index. [Timing and environment](/docs/en/reference/performance.html) · [Raw reports](/files/docs/verification/baseline.json)

## Bilingual connector and API compatibility reference

English and Chinese reference files concatenated in that order have SHA-256 `c8408cd8f98974b6aaf4e3de66b2a5312d686daf1c99fe03d6cd16af8ef4ec3a`. Both languages index the configured source, destination and five-JDK profiles, typed positions, access rules, request and plan identities and upgrade boundaries. The documentation check resolved relative links in all 124 Markdown files and verified the shared connector and endpoint inventory. [English reference](/docs/en/reference/compatibility.html) · [中文](/docs/zh/reference/compatibility.html)

## PostgreSQL 18 stored generated columns

Artifact `72357d90c1d87d99fbdf767927a0ca122286df7c7f3defc60f9abd21622b898c` passed 36 focused Java tests, eight native checks on each of Java 8, 11, 17, 21 and 25 from PostgreSQL 18.7 to 17.12, plus seven native PostgreSQL 17.12 regression checks on Java 8. With the PostgreSQL 18 publication enabling stored generated columns, keyed and keyless source updates changed the corresponding ordinary destination columns. A preflight without that publication coverage refused the configuration. [Reproduction](/docs/en/reference/postgresql-source.html) · [Manifest](/files/docs/verification/baseline.json)

## Bilingual deployment and maintenance reference

Combined guide SHA-256 `32cad011e732673d4e33857945269cee8b81933f082cb3a15584a8d53df6797e`. Both languages document Linux, Docker, Helm and native Kubernetes examples for standalone and separated execution, plus node enrollment, an operator-driven drain, stores, secrets, sessions and coordinated backup and upgrade. Both Compose configurations passed render validation. Helm lint passed, and the standalone, Controller A, Controller B and Agent A renders matched their four native files byte for byte. The live Kubernetes evidence above covers separately scoped CSI and interruption tests. [English guide](/docs/en/reference/execution-lifecycle.html) · [中文](/docs/zh/reference/execution-lifecycle.html)

## Native PostgreSQL 17 synchronized-slot promotion

Artifact `49ed903ee7a7d75f57908c05a96990fe790af785a1015550cf1f8501cf5d717b` passed 18 focused Java checks and two PostgreSQL 17.12 Java 8 profiles with 8 and 7 native checks. The original primary was killed, the physical standby promoted after validating its synchronized slot, and the writer endpoint routed to the standby. Delivery resumed automatically from the prior WAL position with the same snapshot IDs. The two profiles then refused a lost slot and a route back to the earlier primary, retaining the latest journal position. [Operations and reproduction](/docs/en/reference/postgresql-source.html) · [Manifests](/files/docs/verification/baseline.json)

## Worker diagnostic events and Chrome smoke

Artifact `3355bdc100775f7ce813a61309a1306ab6a03cd4a7078d6a68ba1784065777d9` passed 24 Java tests, 112 DOM tests and seven native MySQL/PostgreSQL checks across two controllers and a separate Agent. After a real incomplete-binlog-image fault and Agent restart, both entries returned the same page for an anchored cursor with only typed events, timestamps and phases. VIEWER and invalid-page requests were rejected. Chrome 157 exercised keyboard login, cookie reload, the accessible diagnostic dialog, a 390px viewport and actual sign-out. Wide, mobile and diagnostic screenshots were reviewed. [Manifests](/files/docs/verification/baseline.json)

## OceanBase MySQL tenant recovery

Artifact `58cc370518c0f92271f39fafab02b8c508beb59bf736bdb797eb3a8add050ff4` passed 501 Java tests with 32 optional cases skipped. The actual OceanBase CE 4.3.5.6 ARM64 fixture passed native transactional/checkpoint rollback, epoch and reopen checks with Java 8. In mixed MySQL 8.4.13 to PostgreSQL 17.12 and OceanBase delivery, it passed snapshot and CDC including generated and keyless rows, target restart and catch-up, Worker SIGKILL, independent SQL constraint recovery, persistent failure generation and missing-target-table isolation. The fixture cleaned up its own containers and volumes. [Reproduction](/docs/en/reference/oceanbase-v3.html) · [Manifest](/files/docs/verification/baseline.json)

## Oracle typed commit ordering

Artifact `e6186b17a8b357db1b1a577aa7f1372b1f19241509f17c2a5b8ceafcd6f33f52` passed nine Oracle Free 26ai Java 8 checks. LogMiner changes are grouped into complete source transactions with repeatable per-transaction event IDs. The scoped probe retained the original authority and emitted typed SCN/XID commit coordinates. After rotating the archive, the second transaction appeared as a distinct later coordinate. [Manifest](/files/docs/verification/baseline.json)

## Oracle archived CDC and restart

Artifact `9b555ae4a107fb34cba96c3f4b392f136ed290b6a2aac2e3b0c3fa3cc7ace029` passed 13 native Oracle 26ai checks and emitted a durable SCN to a PostgreSQL 17.12 destination. The root and PDB were independently authenticated. The Worker held the archive floor for a transaction open before Flashback, delivered it after commit and rotation, reused both snapshots after process SIGKILL, and refused an unsupported DDL before advancing the saved SCN. The profile used Java 8 with an external Oracle driver, one archive thread and LOCAL storage. [Guide and reproduction](/docs/en/reference/oracle-source.html) · [Manifest](/files/docs/verification/baseline.json)

### Exact-candidate release evidence and stale Worker acceptance

Java 8 candidate `54485ac2862a4d12efec26c8e319f4c811b023c33774be995fd3b5fbe0d6cfab` passed [the release evidence gate](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/release-evidence-gate.py). The run parsed 25 YAML examples, checked the bilingual SDD and API reference, verified five real Chrome checks and seven native MySQL checks with separate management and execution processes. Kubernetes v1.31.0 ran eight Helm and checked-in YAML checks on two nodes, including CSI remount, configuration rollout and Secret rotation. Both workloads verified the SHA-256 of the running JAR. A real Chrome manifest from an earlier candidate was rejected. Results are archived as `releaseEvidenceGate` in [baseline.json](/files/docs/verification/baseline.json).

On the same artifact, the disposable two-node cluster passed three additional checks using one external PostgreSQL journal. Both Workers used the same pipeline identity. Freezing the first container stopped its heartbeat, the second Worker advanced the epoch from 1 to 2 and delivered through the original source slot. After unfreezing, the stale Worker observed the fence and the newer owner kept writing against the original snapshot. This verifies externally started Worker takeover. Agent placement remains separate from the accepted same-volume Kubernetes relocation. [Fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/kubernetes-csi-runtime.py)

### NATS JetStream TLS and quorum

Java 8 candidate `411dafb3780dabe7b718458c8e05ddbb99146113d8abbf79e72bb5a9098fab04` passed six native [NATS fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/nats-cluster-run.py) checks with three separate NATS 2.11.8 instances and file-backed replicas. Rivomesh confirmed trusted traffic, rejected an absent CA and an endpoint name missing from the certificate, continued after killing the elected stream leader, and received no confirmation with one replica left. Restoring two members allowed the original event ID to succeed and be retried within the deduplication window while preserving all three message bodies. Scope is the confirmed publisher transport. [Baseline](/files/docs/verification/baseline.json)

### Mixed Java rollout

Candidate `411dafb3780dabe7b718458c8e05ddbb99146113d8abbf79e72bb5a9098fab04` passed eight native checks with MySQL 8.4.13, PostgreSQL and separate Controller/Agent processes. Controllers Java 8 and 21 ran with Agent/Worker Java 11. Replacing Java 8 with Java 25 left the original Worker delivering native CDC while the Java 21 Controller admitted a durable check. Reopening the drained Agent on Java 17 preserved the earlier STOP and GTID. Its Java 17 Worker resumed both SQL targets with all original snapshot IDs. The fixture identifies the actual running JVM executables and image IDs at each phase. [Fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/global-control-pipeline.py) · [Baseline](/files/docs/verification/baseline.json)

### Source capability wizard

Candidate `0c553e56c7c4402bd298984cd77ca4dfa5f34ec253fa9426ded4b5adb1556f8b` passed seven real Chrome cases, including PostgreSQL and Oracle forms submitting stopped tasks to the live API, password masking and mobile Oracle layout. The DOM suite passed 115 checks. Twenty-three focused Java checks verify source profile validation and native position decoding, and 25 configuration examples passed the shipped parsers. The preceding build passed 502 Java cases with 32 optional cases skipped. On candidate `dd11a9bb3b63fdac6f02cdfe6c5061c7c3c5c5de014979b6eb15daecee912ecc`, PostgreSQL 17.12 passed seven native checks and Oracle 26ai passed thirteen, including original LSN/SCN restart and refusal at missing or unsupported input. [Wizard browser fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/ui/browser-smoke.mjs) · [Baseline](/files/docs/verification/baseline.json)

### MySQL decode header review

Candidate `6d629310028898525a76a54683910b8db4fad01e919f28b46359ae444fd4c2ab` passed nine native MySQL 8.4.13 cases, 21 focused Java checks and 116 DOM checks. Both management entries read the same GTID, native commit boundary and table after an Agent restart. The target and capture checkpoint stayed paused at the original position. Purging the synthetic source log removed the header evidence, reported the source gap and preserved the checkpoint. The report contains header metadata and still requires separately retained row contents for a future skip review. [Fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/global-control-pipeline.py) · [Baseline](/files/docs/verification/baseline.json)

### Global task filters and destination backlog

Candidate `ec6ef04ed53a54e479df1e6f9ad60fa76bb01d6eba3f3c4619b319aa3dd61b0c` passed seven native two-controller checks and seven real Chrome checks, plus 503 Java checks with 32 optional skips and 118 DOM checks. The management entries ran exact task and execution-node filters in shared SQL. A native PostgreSQL constraint blocked one delivery while the MySQL destination caught up. Both entries reported the same destination-specific backlog, and generation-bound resume brought both data sets and their acknowledgment positions back into agreement. [Native fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/global-control-pipeline.py) · [Baseline](/files/docs/verification/baseline.json)

### Retained MySQL binlog contents

Candidate `b95d036f0d5f633de1a311581f70ad67c126af0b22b72f26240fa5d6934c6d32` passed eleven native MySQL 8.4.13 checks. The Java 8 CLI read the affected bytes through the actual binlog protocol, verified each frame CRC32, and returned a SHA-256 matching the independently read byte range of the original on-server binlog. Two repeats produced a single private archive with the same checkpoint binding and exactly the original event bytes. After purging the synthetic log, a new proof was rejected and the previous archive remained byte-identical. [Fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/global-control-pipeline.py) · [Baseline](/files/docs/verification/baseline.json)

### Managed MySQL capture evidence

Candidate `9cc5da0987cc78609988d7a75d5c3de9ae0129e334d16e8abdf1ba31c6373365` passed thirteen native MySQL 8.4.13 checks, seven Chrome checks and 119 DOM tests. Administrators retained the original event frames from either Controller. Other roles and a stale boundary were refused. A retry after source log purge and Agent SIGKILL reused the same archive and receipt without changing the capture checkpoint. A simulated abandoned staging file was removed during publication. The isolated rerun passed after an earlier concurrent run ended with a control-store 503 during review. [Operator guide](/docs/en/reference/capture-recovery.html#retain-from-a-management-entry) · [Manifest](/files/docs/verification/baseline.json)


### Approved exclusion of a MySQL source transaction

Candidate `784468155a13763bf75e532cfb736269df34719a4a77942d8736390021356ffe` passed fourteen approval and continuation checks and fourteen log-purge checks on native MySQL 8.4.13. Administrators reviewed the original bytes and exact impact, then excluded the one GTID while both real SQL target rows and acknowledgment positions stayed unchanged. The Agent reopened the paused state and gap receipt. Later transactions reached PostgreSQL and MySQL after Resume, with the contiguous applied prefixes held at the gap. A matching retained archive alone could not authorize the source range after purge. The same artifact passed seven Chrome checks, 35 focused Java tests and 120 DOM tests. [Runbook](/docs/en/reference/capture-recovery.html#approve-a-source-transaction-skip) · [Manifests](/files/docs/verification/baseline.json)


### Temurin 21 release baseline

Candidate `cb8183632cc1297ed12332c3b9c8580ff3651309c6e648d00f5ed086ed0245cc` passed eight native checks after compiling to Java 21 class-file major 65. The fixture read the actual Controller, Agent and Worker JVMs on ARM64. Replacing one Controller left the other entry available and the original Worker continued delivery. The drained Agent used the same directory and restarted the original snapshots and GTID for PostgreSQL and MySQL. An earlier candidate built at the same class level passed 503 Java tests with 32 optional integration cases skipped. [Deployment guide](/docs/en/reference/console-and-deployment.html#java-21-deployment) · [Manifests](/files/docs/verification/baseline.json)


### Console branding and session bootstrap

Candidate `15a81de54070880f0eaa211e4f00dca3e90696f3334f74492506a6a0248502bd` passed seven live Chrome cases on Temurin 21, 121 DOM cases and parsing of 25 configuration examples. The console uses the Rivomesh site palette and compact mobile navigation. Cookie authentication survives reload, expiry still opens sign-in, and a temporary session lookup error can recover through the same browser cookie. Login and restore each load the task list once. The real browser verified the 390px workspace, source wizard submissions and sign-out. [Browser fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/ui/browser-smoke.mjs) · [Manifests](/files/docs/verification/baseline.json)


### Java 21 exact release candidate

The Dockerfile produced nonroot ARM64 image `sha256:7fd83307056d33e6e87b6734de8da5be77c8fe07324b7bb00c3c74cda11792c8` with Temurin 21.0.13+9 and JAR `be6406c60f2b2c5ab0bd00ecc64cbf28cfd09e8e764d137e19c38f26cdc7dbdb`. The same JAR started as UID 10001 on Linux with the shipped manual configuration and writable state paths. The image passed 19 live MySQL, PostgreSQL and distributed management checks, including controller loss, control-store interruption, target SQL recovery, isolated owner restart, validation and repair. Helm and native YAML each passed four actual Kubernetes v1.31.0 cases for login refresh, CSI remount, configuration rollout and Secret rotation. Chrome passed seven and the gate parsed all 25 configuration examples. SHA checks bound the three live manifests to the same JAR. [Release verifier](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/release-evidence-gate.py) · [Manifests](/files/docs/verification/baseline.json)


### Durable validation report directory

Candidate `480c85fa9a20bb1e6d331a360fdefbf4e1b9a9e768aac5c85d13579e2ef06794` passed nineteen native cases, eight real Chrome cases, 122 DOM tests and 35 focused Java tests. Both Controllers found the same actual validation report after Agent restart and paged its metadata without exposing row contents. The report could still be opened for authorized inspection and repair. The browser exercised the actual catalog endpoint, with DOM coverage for opening a retained report whose operation has aged out. The workspace lock protects active projections, and reopening a report removes abandoned summary staging files. [Report guide](/docs/en/reference/managed-validation.html) · [Manifests](/files/docs/verification/baseline.json)


### Capacity-bound Agent assignment

Candidate `cf103fa235ea3fca9b67d0100b3328b0e219426a775a1c337258b8e4cf25bf40` passed seven native cases each with PostgreSQL and MySQL control stores. Two Controllers and two registered Agents used Temurin 21. The first automatically assigned task delivered snapshots and native incremental rows to both SQL destinations. Simultaneous creates from the two entries competed for the remaining slot and only one acquired it. Further creates were refused before a new task appeared. The first request replayed its original owner after both Agents filled. Console DOM coverage passed 123 cases, including the single automatic placement payload. [Global control](/docs/en/reference/global-control.html#automatic-assignment-for-new-tasks) · [Manifests](/files/docs/verification/baseline.json)

### Temurin 21 source profile regression

The same artifact passed 48 native checks on Temurin 21.0.13. MySQL 5.7.44, 8.0.46, 8.2.0 and 8.4.13 each ran five standalone checks with two Controllers, an Agent, a Worker and two SQL destinations, including cross-schema CDC and keyed, keyless, JSON and generated values. PostgreSQL 17.12 passed seven checks including synchronized-slot promotion and old-route refusal. The fixture verifies the active timeline with `IDENTIFY_SYSTEM`, which avoids reading older checkpoint metadata while the post-promotion checkpoint is still running. PostgreSQL 18.7 passed eight checks including stored generated columns and missing-slot protection. Oracle 26ai Free 23.26.4.0.0 passed 13 single-PDB checks including long archive transactions, original-SCN restart and DDL refusal with the external Oracle JDBC driver. [Compatibility](/docs/en/reference/compatibility.html) · [PostgreSQL replication protocol](https://www.postgresql.org/docs/17/protocol-replication.html) · [Manifests](/files/docs/verification/baseline.json)

### Destination diagnostics and branded console

Candidate `186cddb562acb16d913670dee1564d0d4f2942ba7978b0ccd531ed7056fc622c` passed 10 native `--separate-execution --task-views` checks. Both Controllers observed a PostgreSQL destination pause and a separate MySQL destination retry and recovery while the unaffected destination continued. Destination-specific events stayed redacted and independently pageable through an Agent SIGKILL. A viewer received 403 and using a cursor from another destination returned 409. Twenty-one combined diagnostic and source focused cases included 16 diagnostic tests, and the diagnostic DOM suite passed 124 cases. [Global control](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

The normal Temurin 21 Maven package `f49f52d6ce34862664c70bbed9f8815517d1bf115bec6d7b6adb95689c535488` passed 11 cases in Chrome 157 with final console resources. The official Rivomesh site marks were checked at desktop and mobile widths. Browser cases covered system appearance, a manual preference through reload with the authenticated cookie, keyboard navigation at 320 CSS pixels, the new target selector, historical report discovery and logout. The light muted text was adjusted for contrast on console panels. [Console appearance and session use](/docs/en/reference/console-and-deployment.html) · [Manifests](/files/docs/verification/baseline.json)

### Browser recovery through two management entries

Candidate `186cddb562acb16d913670dee1564d0d4f2942ba7978b0ccd531ed7056fc622c` passed 15 combined native cases, including six real Chrome interactions. The task used a separate Agent, two Controllers, MySQL 8.4 source and PostgreSQL and MySQL destinations. A cookie issued by one Controller opened the same task in the other. After Agent restart, the browser found the retained report, navigated 27 differences across pages, required explicit reveal for raw values and sent the reviewed repair through both Controllers. Reload retained the two target receipts. A second workflow imported typed corrections without rounding an unsigned 64-bit JSON integer and required an approval checkbox and reason. Both entries showed the receipt with business values redacted. The fixture checked exact target SQL rows, CDC resumption, retained acknowledgment, and cleanup. A later DOM check independently verified the dialog's accessible name and keyboard dismissal. [Managed validation](/docs/en/reference/managed-validation.html) · [Manifests](/files/docs/verification/baseline.json)

### Offline audit checkpoints

The verified export tool writes only the audit store identity, sequence and chain hash to a new private checkpoint file. Verification against an independently retained checkpoint rejected a genuinely earlier valid export and accepted a same-store continuation through SIGKILL using Temurin 21 and embedded H2. The offline suite passed 11 tests including chain rewrite, store mismatch, missing overlap and protection against overwriting a checkpoint. External custody and storage policy remain operational requirements. [Audit export](/docs/en/reference/security-audit.html) · [Manifests](/files/docs/verification/baseline.json)

### Oracle strict textual JSON

Candidate `886a29b36957c8a964029eef5848d34bd3b8f598dc41e8578f6ae3cdfbc5ea05` passed 18 native Oracle Free 23.26.4.0.0 to PostgreSQL 17.12 cases on Temurin 21, with five focused Oracle Java tests. A validated, enabled, nondeferrable `VARCHAR2` constraint using `IS JSON (STRICT WITH UNIQUE KEYS)` authorizes JSONB materialization. Flashback and archived LogMiner preserved large integers, Unicode, embedded quotes, SQL NULL versus JSON null, and keyless multiplicity. Native binary JSON and JSON keys were refused. The pipeline retained its original snapshots after SIGKILL and continued archived JSON delivery. [Oracle source](/docs/en/reference/oracle-source.html) · [Manifests](/files/docs/verification/baseline.json)

### Verified standalone writer handoff and read-only adoption

Candidate `109361ade9b29a7caacb7da04cbd7b09e13c2f87b2893998290f41975b3bab8e` passed five native handoff cases and 55 focused Java tests. A PostgreSQL journal stored a single new writer assignment and its proof for two independently mapped SQL destinations. The fixture refused a live lease, wrong journal generation, substituted snapshot, newer target epoch and earlier binary. Retrying the transfer returned its original receipt. A suspended old Worker was fenced after thaw and the replacement resumed an actual cross-database transaction with the original snapshots. [Standalone handoff](/docs/en/reference/pipeline-v3.html#verified-standalone-writer-handoff) · [Manifests](/files/docs/verification/baseline.json)

Candidate `f49f52d6ce34862664c70bbed9f8815517d1bf115bec6d7b6adb95689c535488` passed nine MySQL 8.4 to PostgreSQL read-only adoption preview checks. Matching, changed, missing and extra rows were counted without opening destination ownership or journal state. PostgreSQL connected with read-only privileges. Losing the physical MySQL snapshot session during destination pinning stopped the comparison despite reconnect being enabled. The fixture also covered empty tables, row security, constraints, existing ownership and checkpoint, and unsupported target products. [Read-only adoption preview](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

### PostgreSQL delivery samples and UUID keys

The Temurin 21 candidate `c3605293a956f0b8656d9e7a0ec60a8c08d1a29da1953b62515cf1f9d9484a13` passed 38 focused Java checks, including the HTTP assertion for the official wordmark and title, and 10 live PostgreSQL 17.12 checks. The timestamp from pgoutput matched `pg_xact_commit_timestamp` down to its microseconds. The last per-target sample survived SIGKILL, stayed historical during a SQL constraint pause and advanced only after a direct confirmed apply. UUIDs retained their canonical text through a primary-key move, delete, and nullable values. Destination timing, throughput and recovery coverage are reported separately. [Source guide](/docs/en/reference/postgresql-source.html) · [Timing](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### Optional external MySQL JDBC package

The opt-in Maven artifact `432389ac96f728432a7512568c8c8e32833326672df40c3514a76d6039a2b07f` left the standard package SHA-256 unchanged. Its nested archive inventory verified the driver exclusion and both exact upstream vendor notices. A separately mounted Connector/J ran eight native cases with MySQL 8.4.13 source and control store, separate Controllers and Agent, and PostgreSQL and MySQL destinations. Rolling replacement preserved the STOP receipt, GTID and snapshots. Three additional checks covered an accidentally bundled driver, explicit missing-JDBC admission and the original unavailable-endpoint diagnosis. The full artifact-specific distribution review remains pending. [Release inventory](/docs/en/reference/release-inventory.html) · [Apache third-party license policy](https://www.apache.org/legal/resolved.html) · [Manifests](/files/docs/verification/baseline.json)

### Repeated capacity reference and clean reactor

A clean archive of commit `2257425` built `5c94d5468757992376f8d99a0d8d043e215138c9d99c5684922aa45d7183d137` with 514 passing Java tests and 32 optional integration skips. On that exact artifact, all 12 native capacity trials passed snapshot and CDC content validation. The matrix used three repetitions per journal and CPU quota on an Apple M1 Pro with Docker Desktop. The benchmark verifies final key boundaries before measuring visibility and checks ordered content at each phase. [Hardware results and reproduction](/docs/en/reference/performance.html#repeated-temurin-21-capacity-reference) · [Manifests](/files/docs/verification/baseline.json)

The same artifact then passed 256 MySQL database mappings to 256 PostgreSQL schemas, including 512 exact rows and one 768-change transaction with 8,505,279 native binlog bytes. The first durable snapshot set completed in 25.84 seconds. The transaction reached the target in 4.32 seconds. After SIGKILL, an offline 256-change transaction arrived in 21.42 seconds measured from the restart request, with every original snapshot identifier preserved. [Catalog fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/catalog-benchmark.py) · [Hardware and content manifest](/files/docs/verification/baseline.json)

LG-07 also passed a sustained slow-target profile on the same artifact. With 32 mappings and a separate PostgreSQL journal, pausing the target held the capture sequence at 3 and the target acknowledgment at 0 for 5.34 seconds across nine observations. The logical journal high-water mark was 3,244,602 bytes under a configured 3,538,944-byte budget. PostgreSQL relation size was recorded separately. After SIGKILL the Worker acquired a newer epoch, retained all snapshot IDs, applied the full source range through acknowledgment 24, and collected the pending payload to zero. Exact row contents matched across source and target. [Slow-target reproduction](/docs/en/reference/performance.html) · [Manifests](/files/docs/verification/baseline.json)

### Report lookup and keyboard focus through polling

Candidate `5726e5c369f06bc6abcf622f7bf6672440b0e5eafaa1a142331bc1c015cb5c40` passed 16 native checks, including seven real Chrome interactions across two Controllers. The browser found the original report by ID after Agent restart, returned to its directory page and kept keyboard focus through a real periodic refresh before opening native differences. It verified named correction controls, 27-row paging, explicit raw reveal, two repair receipts and typed correction with exact JSON integer precision. The same Maven artifact passed 12 standalone Chrome checks and the DOM suite passed 127 cases. [Report operations](/docs/en/reference/managed-validation.html) · [Manifests](/files/docs/verification/baseline.json)

### Managed Agent handoff assessment

The exact Temurin 21 candidate `43b01b78bf4aa661119f9f49ae8a1057e92d98f9a52c5d2dbf0d1eb1c2d72597` passed 41 focused Java tests and eight native cases on each of PostgreSQL and MySQL control stores. Two real Controllers read and replayed the same assessment for two real Agents and a caught-up external PostgreSQL journal. The original Worker remained assigned. One of two simultaneous refreshes replaced the expected assessment and the persisted result survived SIGKILL of a Controller. The response exposes the checkpoint hash and reports the required evidence checks before actual transfer. [Global control API](/docs/en/reference/global-control.html#assess-transfer-to-another-agent) · [Manifests](/files/docs/verification/baseline.json)

### MySQL direct-origin delivery timing

Candidate `5726e5c369f06bc6abcf622f7bf6672440b0e5eafaa1a142331bc1c015cb5c40` passed six MySQL 8.4.13 cases and five MySQL 5.7.44 cases. An independent reference reader checked CRC32 and positions in the native binlog transaction and verified the ordinary GTID's original commit timestamp. Two native SQL destinations emitted matching observed source times and independent confirmed sequences. The samples survived Agent restart. MySQL 5.7 retained explicit unknown timing while both destinations continued to receive live CDC. [Timing profile](/docs/en/reference/global-control.html) · [MySQL timestamp reference](https://dev.mysql.com/doc/refman/8.4/en/replication-delayed.html) · [Manifests](/files/docs/verification/baseline.json)

### PostgreSQL business UNIQUE restoration preview

The same Temurin 21 candidate passed five native MySQL 8.4.13 to PostgreSQL 17.12 checks and two offline admission guards. A completed common-cut report had matching row content, while the target's case-insensitive collation exposed a conflicting group with two rows. The review retained native NULL-distinct semantics, checked only counts while the source was offline, and preserved target data, indexes and checkpoints. It refused incomplete or outdated validation evidence. [Read-only constraint review](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

### RabbitMQ three-member quorum recovery

Candidate `5726e5c369f06bc6abcf622f7bf6672440b0e5eafaa1a142331bc1c015cb5c40` passed six native RabbitMQ 4.1.4 cases with a PostgreSQL sibling target. After the connected leader was killed, original event IDs redelivered with identical serialized bytes. A lone surviving replica could not advance the publication receipt. The SQL target continued through both the minority outage and Worker restart. Restoring the original RabbitMQ members in sequence recovered quorum. Manual acknowledgment drained 19 deliveries with 18 distinct IDs, and four complete transaction envelopes matched the retained native source receipts. [Messaging operations](/docs/en/reference/messaging-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Global task and configuration authority

CP-02 passed ten cases on each of native PostgreSQL 17.12 and MySQL 8.4.13 control stores, using the same Temurin 21 artifact `5726e5c369f06bc6abcf622f7bf6672440b0e5eafaa1a142331bc1c015cb5c40`. An active configuration created and edited through Controller A was read at the same revision through B. Concurrent creation of one global task ID admitted one authority row. Two independent MySQL sources copied same-named tables with isolated configurations, destination schemas and credential references. Stale revisions and cross-task references were refused. A standalone task reused the same identifier in its own authority scope and continued original CDC after SIGKILL. [Shared control](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### Candidate Agent evidence probe and assessment UI

Candidate `24dfeb6ee634f580b4f7f923639f6e59fa01a748cc1625dda8f452ed79d2782a` passed ten native cases per control store and 71 focused Java tests. The original and candidate Agents used authenticated read-only queries bound to the assessment, task revision and both enrollments. The candidate rejected its own mismatched credentials, then verified the original PostgreSQL journal and MySQL GTID plus both native SQL receipts. The original Agent inventoried private evidence and retained explicit custody refusal. The journal, target positions and task assignment stayed unchanged.

Artifact `729a1e0c8fd2b86c1fcbf2746fda6c53f5a7135d2cd809e8407af98eca6c8884` passed 11 real cases including three Chrome interactions across both Controllers and their Agents. The assessment dialog preserved keyboard focus through polling, let an administrator select an authorized live candidate and reopened the same receipt at the other entry. The existing owner and worker state were retained. Standalone Chrome passed 13 cases and the DOM suite passed 131. [Global handoff operations](/docs/en/reference/global-control.html#assess-transfer-to-another-agent) · [Manifests](/files/docs/verification/baseline.json)

### Cross-entry command outcomes

CP-03 passed seven cases on each of PostgreSQL 17.12 and MySQL 8.4.13 control stores using the same Temurin 21 artifact `5726e5c369f06bc6abcf622f7bf6672440b0e5eafaa1a142331bc1c015cb5c40`. Pausing through one Controller and resuming through the other changed live CDC, and replay of the original pause returned the same receipt while CDC kept running. HTTP 202 recorded a pending request while its Agent was offline. Revoking its issuer before Agent rejoin returned the same-request `REJECTED` outcome at both entries. An isolated fault fixture advanced the local revision without the original execution receipt. Agent generation 3 exposed `UNKNOWN` consistently after generation 2 and an identical replay preserved that outcome. Earlier native profiles cover target retry, offline stop and validation/repair. [Global control](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### Global diagnostic filters and bounded reads

Candidate `4edb16a83fb1a004dc466712dae89e180d1df40f13e7b1c776fc21e8237f15ab` passed ten native cases across two Controllers and a separate Agent, with independent target pause and recovery, filtered and redacted logs, scoped cursors and stable pages after Agent restart. The normal console passed a concurrent HTTP test for rate limiting and the `Retry-After` header. The Agent budget is eight pages per second with a burst of 16. The exact artifact passed 28 focused Java tests, 13 real Chrome checks and 131 DOM tests. Native PostgreSQL and direct-origin MySQL 8.4 timing use verified commit evidence. MySQL 5.7 and delivery profiles without evidence show unknown timing. [Global diagnostics](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### Replicated Kafka publication and offsets

Artifact `5726e5c369f06bc6abcf622f7bf6672440b0e5eafaa1a142331bc1c015cb5c40` passed five native Kafka 3.9.2 KRaft checks with three controllers and one broker-only node. Killing the partition leader elected a surviving replica. At one in-sync replica, two live controllers still committed fresh metadata while the publisher and journal acknowledgment held at sequence 2. Restoring a replica delivered the retained transaction at sequence 3 with its original ID and bytes. The consumer resumed at its committed offset 7. After processing six records and committing offset 13, a reopened consumer found no pending records and all 13 original records retained their bytes. The source fixture uses deterministic transactions in the packaged JDBC journal. Live CDC, broker TLS and control majority loss are separate profiles. [Messaging operations](/docs/en/reference/messaging-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Frozen-source PostgreSQL UNIQUE restoration plan

Artifact `860e01d05556b9e865cef684135ed0e397ba7b8ab7405805a8d6749ce60bb678` passed nine native checks with MySQL 8.4.13 and PostgreSQL 17.12 and 49 focused Java tests. `plan-unique-restore` binds the completed report, common checkpoint, source GTID and target index identity to a review digest while checking live frozen-source and target row content. The profile refused an unfrozen source, an ordinary index rebuilt after review, incompatible PostgreSQL collation, altered rows with the same GTID or target checkpoint, and a changed source GTID. Native business data and indexes were preserved. The integrated compile and 24 focused tests used artifact `93740e78e05df5d83d821bd4f6c3583f9a21d1ae2c85c5d62538fdc84d2ff01a`. [Restoration workflow](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

### Shared validation report custody

Artifact `ef74695d3da6e8b50edb03edfa01e85a7d777b73073d8a38a60544d6332288aa` passed 12 native cases per PostgreSQL and MySQL control store and 30 focused Java tests. The original Agent archived a real completed report under its operating-system lock on an opt-in private shared mount. A candidate with a disjoint mount could not verify the exact archive. With both Agents using the shared mount, the candidate authenticated the assessment and checked the original summary and database bytes. The test preserved the task owner, journal and both target checkpoints. Candidate access to source evidence, failure evidence and closed operation receipts remains separately guarded. The scoped integration artifact `57d5286f1477a8d4f1548bcaccd7efca0745296e140ac695036f0b733de4eb14` passed 30 focused Java cases. [Evidence custody](/docs/en/reference/global-control.html#assess-transfer-to-another-agent) · [Manifests](/files/docs/verification/baseline.json)

### MySQL 8.4 native asynchronous source failover on Java 21

Artifact `4edb16a83fb1a004dc466712dae89e180d1df40f13e7b1c776fc21e8237f15ab` passed eight real checks with MySQL 8.4.13 and Temurin 21.0.13. The topology uses an external PostgreSQL journal, separate Controllers and Agent, and independent PostgreSQL and MySQL targets. A least-privilege capture account could not promote the replica. After primary SIGKILL, the replica stayed read-only and both Controllers observed the native receiver fault. The journal and each target held sequence 1. An external database promotion let Rivomesh automatically acknowledge sequence 2 in the original generation, with both target receipts bound to the same promoted GTID. Exact keyed, keyless, JSON and generated data matched. The task revision, configuration and all three source and per-target snapshots were preserved. [Source failover runbook](/docs/en/reference/pipeline-v3.html#automatic-continuation-after-mysql-84-primary-failure) · [Manifests](/files/docs/verification/baseline.json)

### Historical operation receipts after Agent loss

Candidate `f4e283959eba1d3ef6b022ef6a82155a7c53a10b64a12c74404b3da3186af207` passed 21 native checks, including ten real Chrome interactions, plus 29 focused Java and 134 DOM tests. Two Controllers found a real report, paged 27 differences, reviewed and approved precise PostgreSQL and MySQL repairs, and reviewed typed correction with exact JSON integers. After 21 later terminal commands and Agent shutdown, both Controllers returned the earlier repair and correction receipts by authorized task and request ID. Chrome reopened the correction receipt without returning original business values. The storage view reports protected file metadata. The staged app including shared custody passed 47 Java and 134 DOM tests on `daa2daab521d7dc050eb55e1fdd4111bd43fc4b543f8fcb11cfcdd5f9cbe12d2`. [Report and receipt operations](/docs/en/reference/managed-validation.html) · [Manifests](/files/docs/verification/baseline.json)

### Redis Streams promotion and pending-entry recovery

Artifact `93740e78e05df5d83d821bd4f6c3583f9a21d1ae2c85c5d62538fdc84d2ff01a` passed six real Redis 7.4.2 checks. After the old primary was fenced and stopped, the configured endpoint refused the read-only replica until an operator promoted its original AOF. While the new primary lacked a replica fsync, the original journal receipt stayed at sequence 1 with one ambiguous BEGIN. A new replica restored fsync and the original transaction advanced the receipt to sequence 2, with 11 stream entries for ten event IDs and exact bytes for the repeated entry. Previously confirmed consumer acknowledgements stayed effective. The replacement consumer claimed three original pending records. Cold restart of the promoted server restored the exact stream IDs, group cursor and empty pending-entry list from its AOF. [Redis operations](/docs/en/reference/messaging-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Cross-entry authorization, audit correlation and Agent secret references

CP-05 passed 13 native checks per PostgreSQL and MySQL control store on artifact `ba12f19fbc4657f8f2470d2dda4de9d70d14c709b6d6c7b063844469ad05acab`, including Chrome 157 opening the real configuration and audit views at both entries. Revoking access at one Controller immediately denied a new command at the other. Both audit exports correlated an actual repair through the request hash, task, assigned Agent and plan ID after Agent restart. With the optional per-task policy enabled, the actual Worker received its authorized and used variable only. Another task's credential or moving a credential reference into a public identity field was denied. Configuration and audit Chrome views withheld original names and values. Oracle root/PDB reference paths were covered by Java tests. The native artifact passed 49 focused Java and 23 focused DOM cases. The integrated artifact `fd0077cab4c5a0e88e1cff4f63320452459617c82bab548c7441623e99948d6c` passed 54 Java and 134 DOM cases. [Shared access](/docs/en/reference/shared-access.html) · [Manifests](/files/docs/verification/baseline.json)

A fresh Temurin 21.0.13+9 reactor from `4e86f79` built normal artifact `9a58c7f72c0789ac329c21c6c664f95d733b394bb8d5f5cf125dd11b7241b684`. The app passed 526 Java cases, with 32 optional external-profile cases skipped, and the isolated transport passed two. [Reactor record](/files/docs/verification/baseline.json)

### PostgreSQL certificate verification and resumed TLS delivery

The normal reactor artifact `9a58c7f72c0789ac329c21c6c664f95d733b394bb8d5f5cf125dd11b7241b684` passed 11 native PostgreSQL 17.12 checks on Java 21.0.13. Packaged pgJDBC 42.7.14 used `sslmode=verify-full` and `channelBinding=require`. The source and destination native views showed TLS 1.3, including the active logical replication session. The real preflight refused an incorrect source DNS name and an unrelated target CA. Snapshots and CDC matched. The profile replayed a transaction after an explicit destination SQL recovery and restarted after SIGKILL with the same LSN stream, original snapshot IDs and verified TLS. Removing the original slot was refused at the last durable checkpoint. [PostgreSQL TLS setup](/docs/en/reference/postgresql-source.html#verified-tls-connections) · [Manifests](/files/docs/verification/baseline.json)

### Reviewed holds for retained validation reports

Artifact `4716ce9a2012053d536d2f97574094a8a454898a26b52fd103fff0fb6571a4a3` passed eight native cases including two real Chrome interactions, 39 focused Java and 135 DOM tests. Administrators used both Controllers to approve an opt-in report retention hold, while a viewer could not extend it. The current report lock serialized the review attachment and the original report bytes stayed identical. Its exact command receipt remained available after Agent loss and its review remained visible on restart. Helm rendered both default and enabled policy. The integrated artifact `f8610ff55840df7ff8bbc12ed726dfdf9fde3ba3ec51130085e573906db89ed7` passed 48 Java and 135 DOM cases. This policy protects evidence and records a minimum retention age. Final report archival or reclamation requires a separately verified lifecycle. [Retention operations](/docs/en/reference/managed-validation.html) · [Manifests](/files/docs/verification/baseline.json)

### Coordinated local state restore and damage refusal

The Java 21 artifact `daa2daab521d7dc050eb55e1fdd4111bd43fc4b543f8fcb11cfcdd5f9cbe12d2` copied a stopped LOCAL H2 journal and matched H2 JDBC test target. The restored process kept the generation, schema, snapshot, source position and native destination receipt. Retained synthetic MySQL GTID transactions replayed once and advanced sequence 1 to 3. A mixed-time target copy returned `SINK_JOURNAL_CHECKPOINT_DIVERGED`. Modified pending raw data returned `JOURNAL_CHECKSUM_MISMATCH`. The refusal paths preserved the saved source position, subscriber acknowledgement, target receipt and business rows. [Backup and restore](/docs/en/reference/first-release.html) · [Manifests](/files/docs/verification/baseline.json)

### Candidate custody of closed operation receipts

Artifact `5195f04ef4299cf18da38e69c0c76ab50d01d39ad4aafbe6f6f158dd962893c4` passed 14 native checks on each control store. The original Agent matched authenticated global commands to exact private local receipts. It sealed closed records in the protected report archive, and the candidate verified the exact bytes through its own authenticated scope. The operator response exposes counts and digests. After original Agent restart with one private receipt missing, the candidate reported incomplete receipt custody and retained prior report evidence, source progress, synchronized targets and the original writer. The staged integration with retention and per-task authorization passed 48 Java tests. This bounded profile covers up to 64 global commands. Actual request migration and task assignment are still outside the tested custody phase. [Handoff operations](/docs/en/reference/global-control.html#assess-transfer-to-another-agent) · [Manifests](/files/docs/verification/baseline.json)

### Retain exact original journal events while recovery remains open

Artifact `97b3d326989e8e4845829b70adf3739efa41b0ce16c4cbe07ebfc005fa999c7f` passed 22 native cases each on PostgreSQL 17.12, MySQL 8.4.13 and MySQL 8.0.42, plus five H2 peer initialization and reopen repetitions. Open gaps and prepared skip intents pin the exact raw event, normalized payload and associated retained metadata. Unrelated acknowledged transactions remain eligible for collection. A transaction releases its bytes only after the job lock validates the exact closed recovery receipt. The native tests covered restart, sibling acknowledgements, quota and release. MySQL selected the new collector indexes with 4,096 gap and intent rows in its query plan. The latest staged artifact `27b6d9be244c34bcdd954b24afb6955ecf0480101bcad9a2884be677a9c694cb` passed 41 focused Java cases, with six external-enabled cases skipped in that particular build. Analytics and message-target recovery protocols are tracked separately. [Skip and retention operations](/docs/en/reference/transaction-skip.html) · [Manifests](/files/docs/verification/baseline.json)

### Native MySQL and PostgreSQL coordinated LOCAL restore

Java 21 artifact `f8610ff55840df7ff8bbc12ed726dfdf9fde3ba3ec51130085e573906db89ed7` passed four live MySQL 8.4.13 to PostgreSQL 17.12 checks. The fixture waited for the engine to exit, performed native H2 shutdown and independently confirmed that H2 could open read-only and the destination had no Worker sessions. It copied the journal and matched it to an actual PostgreSQL dump. Transactional restore in the same PostgreSQL database kept the native OID, generation and both original snapshots. An offline MySQL GTID reached the original target once and advanced the journal and native checkpoint from 1 to 2. A clone restored to a different configured database URL was refused with `JOURNAL_IDENTITY_MISMATCH`; both target evidence and rows stayed intact. [Coordinated backup procedure](/docs/en/reference/first-release.html) · [Manifests](/files/docs/verification/baseline.json)

### Transactional PostgreSQL UNIQUE restoration

Artifact `da92a97512d7ff77eb0eb8bd1e8f23089475dd0488e91d667a8ad658965a2a38` passed 62 focused Java and 11 native MySQL 8.4.13 and PostgreSQL 17.12 cases. The bounded profile uses an explicitly and persistently frozen standalone MySQL source and one PostgreSQL database hosting both the destination and external journal. The reviewed plan digest and explicit operation ID bind the approval. PostgreSQL commits the new UNIQUE constraint and receipt together while retaining the ordinary index. An exact MySQL session kill after native DDL but before commit rolled back both writes. A forced lost PostgreSQL acknowledgment produced `COMMIT_UNKNOWN` and the same operation replay verified the original committed receipt. The restored constraint enforced duplicates after restart. Writer handover, failback and multi-target adoption have separate gates. [Constraint restore operation](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

### Oracle civil DATE snapshots and archived CDC

Oracle Free 23.26.4.0.0 and PostgreSQL 17.12 passed 22 native cases on JAR `99d287b9ed1829c22ebb16fc7d5c0bc02722672a30c943e8a8960bf887f6cb77` and seven focused Java parser tests. Leap day, second precision, SQL NULL and civil time in a daylight-saving gap remained consistent for keyed and keyless rows. Archived redo and undo matched, and SIGKILL resumed with the original snapshot identities. Strict text JSON continued to work and unsupported BCE dates were refused. [Oracle source](/docs/en/reference/oracle-source.html) · [Manifests](/files/docs/verification/baseline.json)

### MySQL TLS 1.3 binlog and destination reconnect

The complete staged build `c28a871f409b5f46936f063093a245b9b802003d414885d0d63117f1afc371df` passed 41 Java tests and four native MySQL 8.4.13 cases, with one optional MySQL profile skipped by the local Java test command. The fixture confirmed that a mismatched DNS name was refused and that the original address and trust succeeded. MySQL native views showed TLS 1.3 for the actual binlog stream and JDBC target session. Verified TLS copied exact JSON and generated values, then continued from the original GTID and snapshot after Worker SIGKILL. The capture client negotiates the JDK protocols for its CA and identity-verified modes. [MySQL TLS operations](/docs/en/reference/pipeline-v3.html#verified-tls-for-mysql-capture-and-delivery) · [Manifests](/files/docs/verification/baseline.json)

### Sealed validation archive and exact restore

Artifact `507a42969f4dbaf9cd321f871ad82454b53b04a13d33afcf77b04a5aa6a18624` passed 15 native cases including six real Chrome interactions, plus 44 Java and 135 DOM cases. An administrator approved a private recovery copy of a completed validation report. The archive and original files matched exactly. Both Controllers traced the approving operator and request to the sealed descriptor digest. The fixture removed one disposable hot report file. Other readers saw its durable restore fence and the report remained in the directory. A separate approval recovered the exact original bytes and both entries reopened the report. Archive and restore receipts survived Agent loss. The integrated artifact `3f7109c6395d94b89b4729ae60044c5404f45f131d85f7375ecba29bf552dd34` passed 50 Java and 135 DOM cases including the direct handoff-reader fence. Final hot report reclamation has a separate eligibility and protection requirement. [Report archive operations](/docs/en/reference/managed-validation.html) · [Manifests](/files/docs/verification/baseline.json)

### Explicit per-target recovery modes and ClickHouse native receipt review

The integrated artifact `1d484dc78701059e93ac7b2815b65fa2100bbad3ac1395614bc894704d83dcb4` passed 72 Java, 136 DOM and 14 real Chrome checks, with two external-profile cases gated in the Java command. The adapter API and bilingual console distinguish reviewed SQL skip/compensation from products that require original transaction recovery and a separately planned baseline. ClickHouse candidate `cb301b3c403e4c634656b4a9e7fbfa750827cc6116418a7a25365c22dbf6cc7c` passed a 36-case run with native MySQL source and ClickHouse/PostgreSQL targets. The read-only command verified the exact preceding ClickHouse commit receipt. It refused a changed native receipt or a target with evidence of a later partial batch. The SQL sibling continued and both targets retained their acknowledged positions during review. [ClickHouse recovery](/docs/en/reference/clickhouse-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### LG-09 audited validation report reclamation and restore

Artifact `08e755568ee40d57d8e4ccf776a3974bd02c9d6130a686843e428c10734a9e34` passed 18 native cases including eight real Chrome interactions, 47 Java and 136 DOM tests. The bounded opt-in profile requires an eligible completed differences report, a stopped task, expired minimum retention, one reviewed exact archive SHA and exclusive report access. The native fixture refused a running task, unexpired hold and mismatched hash. A confirmed request reclaimed only the duplicate hot row database while retaining the summary, archive, approval and durable restore marker. Shared audit linked operator, request, report and archive digest. After Agent restart, Chrome restored the exact archived bytes. Replaying the old reclaim request preserved those restored bytes. The Java suite exercised interruption after unlink before terminal completion, audit failure and locked or referenced evidence. Earlier native profiles cover authorized historical search, original sessions, approved repair and 27-row keyboard pagination. [Report runbook](/docs/en/reference/managed-validation.html) · [Manifests](/files/docs/verification/baseline.json)

### Reviewed reservation for managed Agent handoff

Artifact `403d01af44aac54f0ab16ec707fee7bf90cf90e660c7a12c83485379d31a55f3` passed 16 native cases per PostgreSQL/MySQL control store and 59 Java tests. Preparation binds an exact stopped cut, assessment, revision and custody evidence. It reserves one task and Worker slot for 15 minutes on the database clock. Both entries replayed the same request, refused new commands and exhausted capacity, and could release the hold after a Controller restart. Artifact `8817f9f83c68fa22b4d3dc0779330f211bb54b45ac8dbe766111eb7737ac8d7d` passed 18 native cases including four real Chrome interactions. A keyboard user reserved capacity through one Controller, checked the same receipt and released through the other. Original owner, revision and source, journal and SQL target positions were preserved. Integrated artifact `c67bd52d678ad99eca226619f710a9b6c34ee3374f2397c5f3d26331b162d287` passed 69 Java and 140 DOM tests with the report reclamation guards. Execution authority remains a separate transfer phase. [Agent preparation operations](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### Exact-cut plan for an existing PostgreSQL table

Artifact `07e70a2c8bf0a21bc2e142dc6aab9bb0e64a787211faaec54f83bd47d46674d9` passed seven native MySQL 8.4.13 to PostgreSQL 17.12 and 64 focused Java cases. The bounded one-keyed-table plan requires persisted source freeze, exact physical source cut, matching row content and target catalog, and absent competing ownership and metadata namespaces. Repeating the reviewed digest reproduces the plan. Insufficient freeze, changed rows or structure, REINDEX, oversized input, existing ownership or a second mapped table are refused. Native preflight leaves business and metadata bytes intact. A transactional adoption bootstrap is tracked separately. [Existing target operations](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

### PostgreSQL civil DATE with two SQL destinations

Artifact `d27ebc75279169bed072345c768b2dfc9b513a0722d332b999ef1586693f95c2` passed nine native checks on PostgreSQL 17.12 to PostgreSQL and MySQL 8.4.13, plus 13 focused Java tests. Civil DATE and SQL NULL matched in both snapshot and pgoutput, including Gregorian boundary, leap day and a date skipped by the JVM time zone. DATE key changes and keyless multiplicity matched. SIGKILL preserved the original slot and both snapshot sets. Infinite DATE stopped before the observed LSN advanced or either destination changed. The integration artifact `d8c7bcb2e39f492505522b512584e1a6e0e1c6902b2f7480f7f02b1ea246bfec` passed 43 focused Java tests. [PostgreSQL source](/docs/en/reference/postgresql-source.html) · [Manifests](/files/docs/verification/baseline.json)

### Doris 4.1.3 Java 21 live recovery and native receipts

The exact artifact `08e755568ee40d57d8e4ccf776a3974bd02c9d6130a686843e428c10734a9e34` passed the native Doris pipeline and receipt acceptance on Temurin `Temurin 21.0.12.1+1` with a MySQL 8.4.13 source and PostgreSQL 17.12 sibling target. Snapshot and CDC preserved the bounded typed values and keyless multiplicity. PostgreSQL progressed during the Doris outage, and Doris caught up at the saved receipt. A Worker SIGKILL resumed with the original native marker. The fixture checked the four native receipt tokens against their original Doris metadata tablets and confirmed that the SQL sibling's error replay did not alter the latest Doris receipt. The disposable fixture has one FE and one BE. [Doris operations](/docs/en/reference/doris-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Authenticated historical failure evidence custody

Artifact `be849a63d7a06b651a4ef4e71d9b825b79ca71de580400cde015aa1798bcb5d7` passed 15 live checks each on PostgreSQL and MySQL control stores. A real MySQL transaction failed a PostgreSQL constraint, producing signed original Agent evidence. After SQL repair and exact replay, readiness checked the stopped cut. The original Agent authenticated its authority and record contents under the private lock. A candidate with a different mount refused custody and then verified exact archived bytes on the shared mount. Archive contents excluded the original signing key. Original ownership and positions were preserved. Integrated artifact `b4dd675432e35dccd84cb47db6ed039d91310085625eff432c39dcbadd6f277f` passed 84 focused Java cases, including interlocks with report reclamation. Authenticated raw source archives and writer activation are separate. [Managed custody](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### External vendor JDBC candidate

Temurin 21 artifact `02906330f9cc73efa8e4516ef3838f3ee3607a12f943e0352664a8db5711b5f3` passed the three-profile package comparison. The optional `external-vendor-jdbc` package externalizes MySQL Connector/J, GaussDB and GBase8c wrapper drivers, Kingbase and DM JDBC. The operator classpath probe verified all five expected providers, their class origins, URL matching and the DM exception diagnostic. With the drivers absent, requests returned the explicit unavailable-driver diagnostic. The development and MySQL-only variants kept their SHA-256 digests across builds. The combined normal artifact `b4dd675432e35dccd84cb47db6ed039d91310085625eff432c39dcbadd6f277f` and external artifact `520aecc1fff7de42aaf4c51ea45b61d56a2a333675a88008bae56a3b0f3807ce` both passed binary checks. Vendor endpoint connectivity and distribution rights remain separately scoped. [External JDBC build and operations](/docs/en/reference/release-inventory.html) · [Manifests](/files/docs/verification/baseline.json)

### Shared handoff volume deployment configuration

The deployment checker rendered two separate Agent releases with the same existing ReadWriteMany claim for evidence and distinct existing claims for private state. The new configuration kept the nonroot execution identity and omitted Pod fsGroup for this optional profile to preserve owner-only filesystem mode. It refused Controller placement, missing private claims, reused claims and invalid claim names. Default Helm/native manifests still matched, and the standard Docker, separated execution and review-overlay configurations rendered with fixture inputs. This check covers deployment templates and POSIX configuration requirements. The independent native custody fixture covers the shared-file behavior. [Kubernetes and shared custody](/docs/en/reference/global-control.html)

### Atomic bootstrap of an existing PostgreSQL target

Artifact `6065ddcb304b9cf4e76a8c1065f7fd75fb64c42646d9ca68b3e73d65419fe1f7` passed eight native MySQL 8.4.13 and PostgreSQL 17.12 cases and 67 focused Java tests. The reviewed profile starts with one keyed unowned table and a persistently frozen standalone MySQL source. PostgreSQL registers target ownership, journal cut, complete snapshot and operation receipt in one transaction. Loss of the pinned MySQL session after PostgreSQL DDL rolled everything back. A locally flushed commit with a lost acknowledgment was recovered by the original request after PostgreSQL restart while MySQL was offline. Replay refused drifted business rows or a changed snapshot checkpoint. The ordinary Worker resumed the approved cut, reusing the snapshot and applying new insert/update/delete with zero copy parts. Staged integration `338c88717f4b1656c6638d36da3e35fa986ba61b6cdb02418527b90050047de0` passed 62 focused Java tests. Broader targets and business write authority cutover/failback remain separate. [Existing target bootstrap](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

### Original Agent authentication of retained MySQL binlog bytes

Artifact `ce7af9356aed6cd316bf803bd0e38c9babd75c0ab52e9ea2f0ee69ac20ae2976` passed 14 native cases with MySQL 8.4.13 and PostgreSQL control, plus 37 focused Java tests. Both Controllers returned the original archive for a stable request. After Agent restart and source binlog purge, a fresh request verified the original signed receipt and reused the exact bytes. The source-range exclusion gate still refused the purged range. Local tests exercised corrupted files, interruption between receipt and archive publication, missing keys and legacy unsigned data. The integrated artifact `46a221010f9f9e6eb2fccf12d3fe49716f8f60a80025f41213238ac9e0d44815` passed 28 Java tests. [Capture evidence operations](/docs/en/reference/capture-recovery.html) · [Manifests](/files/docs/verification/baseline.json)

### MySQL 8.4 single-primary group election and automatic continuation

Temurin 21 artifact `b4dd675432e35dccd84cb47db6ed039d91310085625eff432c39dcbadd6f277f` passed six native MySQL 8.4.13 and PostgreSQL 17.12 cases. After SIGKILL of the original group primary, a surviving majority elected a different writable member. The same Worker advanced the durable sequence, journal ACK and destination receipts from 1 to 2 to 3, with exact GTIDs and row checks across two mapped databases. The journal generation and both original snapshots stayed stable. MySQL refused writes on the restarted former primary. The package refused its configured source endpoint. A separate fixed-endpoint repeat passed six checks on the same JAR. The real packaged JDBC driver reached the original host address after restart and confirmed the former primary UUID and both read-only flags. The packaged preflight then returned `SOURCE_NO_PRIMARY`. The former primary rejoined and caught up as a read-only secondary while the Worker continued on the elected primary. [Group recovery operations](/docs/en/reference/pipeline-v3.html#mysql-84-single-primary-group-replication-recovery) · [Manifests](/files/docs/verification/baseline.json)

### Hive 4.0.1 recovery with original native receipt identity

Artifact `08e755568ee40d57d8e4ccf776a3974bd02c9d6130a686843e428c10734a9e34` passed six native markers on Temurin 21 with MySQL 8.4.13, Hive 4.0.1 and PostgreSQL 17.12. PostgreSQL continued while Hive was stopped. Hive and Worker restart preserved the original snapshot and four exact batch receipts, including their Metastore owner, resource and warehouse location. The SQL sibling's separate failure and replay kept the Hive receipts intact. Removing the Hive business view left an explicit fence. The profile uses one HiveServer2, embedded Derby and a local warehouse. [Hive operations](/docs/en/reference/hive-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Kafka native review of preceding COMMIT receipts

Artifact `f30a038dd9dee55de64de300e5e62a079af53a8837427f62c9cfb3f1a297327e` passed two native review checks and 45 Java tests. Four Kafka 3.9.2 KRaft brokers preserved both namespace COMMIT offsets and hashes in repeated read-only reviews. A later partial BEGIN produced an uncertain-publication refusal. Failed target ACK remained 1, healthy peer ACK remained 2, and no consumer offset moved. The integrated artifact `62f4a8cd9ce2488812e3732d888e837503bbe769b37558b78cbc31791e587ff7` passed 49 Java tests. [Kafka receipt review](/docs/en/reference/messaging-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Managed writer enrollment and same-PostgreSQL handoff preparation

Artifact `495a11d365b1492f8e2bb29c0924e4a4888c3492b0cce0ad3af293cc5c85b0f9` passed 20 native checks and 40 focused Java cases. Only the original Agent admitted the explicitly initialized writer. Native CDC preserved the original snapshots and transported a two-database transaction. The standalone transfer path refused the managed writer. After candidate proof, a changed native activation epoch caused preparation to roll back. The valid shared-control transaction verified the writer and data cut, bound a successor and reserved capacity until release. The original Agent retained the writer, business data and acknowledged positions. Integrated artifact `ce3308fe6e559e00c8d2d6d390ea89ece805bec780a2e854410ab7030dc313df` passed 58 focused Java tests. Activation and old-owner retirement are separate. [Handoff operations](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### External Dameng JDBC on a native Java 21 pipeline

External packaging artifact `520aecc1fff7de42aaf4c51ea45b61d56a2a333675a88008bae56a3b0f3807ce` passed 12 native cases with MySQL 8.4.13, Dameng 8.1.4.80 and PostgreSQL 17.12. The real Java 21 process loaded Connector/J 8.4.0 and DM JDBC 8.1.3.140 from separate operator-supplied JARs. The driver-absent check refused promptly. Real Dameng missing-table error -2106 used the vendor diagnostic. Typed copy and CDC preserved DECIMAL(65,30), UINT64, JSON, binary, TIME and keyless multiplicity. Target restart recovered at the identical localhost endpoint. Worker SIGKILL and independent transactional repairs retained native checkpoints. [Dameng operations](/docs/en/reference/dm-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Candidate Agent authentication of native MySQL binlog evidence

Artifact `0a51471fa1d9239872dc0319a73facaa06fde55a11bb74a09207b94a53b78c15` passed 15 native and 53 focused Java checks. A real MySQL 8.4.13 transaction hit the configured row limit. The original Agent authenticated the retained wire bytes against the native binlog range. A separately reviewed limit change replayed the exact GTID to PostgreSQL and MySQL with the original configuration fingerprint, journal generation and snapshots. The caught-up task stopped without an open gap. A disjoint mount refused proof. The candidate verified exact archive and receipt bytes on the shared mount, while the original Agent retained its key, ownership and cut. Integrated artifact `b7222b01278873932f76f7b92b082743eeb631c5746a327bc0dcb57263ff37a2` passed 82 focused Java tests. [Raw archive operations](/docs/en/reference/capture-recovery.html) · [Manifests](/files/docs/verification/baseline.json)

### Reviewed readiness for an existing PostgreSQL target writer

Artifact `132db52244df5fa4cdbc0403961c738daad766341ce15465c06f858cc72baaaf` passed six native checks on MySQL 8.4.13 and PostgreSQL 17.12, plus 67 focused Java tests. From an existing adopted table at the original paused cut, the command sealed a durable readiness record tied to the live source freeze and one dedicated PostgreSQL login. It refused ownership, memberships, direct or indirect write privileges and active writer sessions. PostgreSQL restart preserved the original receipt. Changed privileges or source thaw invalidated readiness without replacing it. The operation kept target grants and write authority unchanged. Integrated artifact `b5e543895f8a4423dbd34cf2eea866e14857794f59092cdc5736dd040f349a9f` passed 68 Java tests. [Existing target writer preparation](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

### PostgreSQL civil and UTC microsecond timestamps with two SQL destinations

Artifact `16ebaaea67f73bfb89f1e57921751d8c6ca6d679f9bfdf8d3c8046f0affe5869` passed nine native PostgreSQL 17.12 to PostgreSQL 17.12 and MySQL 8.4.13 scenarios and 55 Java tests. A civil timestamp in the JVM's skipped DST hour retained its exact clock value. Two offsets during a repeated local hour produced distinct UTC values. Snapshot and redo retained microseconds, NULL, primary-key movement and exact keyless duplicates. SIGKILL kept the original source slot and both snapshot sets. One infinite timestamp refused the complete transaction before either destination or the original LSN advanced. Integrated artifact `3e98145dd6abe48467aeaef2e19a16b1af73da99a47189ccd0fef428dbf6ab96` verified packaging and passed 57 focused tests. The intermediate full reactor `5a3c4361588b0e99d07496e9da71cd5a39e06c32669f103d91bd0c2a5357d8a1` passed 559 app and two isolated transport tests, with 34 optional integration skips. [Timestamp mapping and recovery](/docs/en/reference/postgresql-source.html) · [Manifests](/files/docs/verification/baseline.json)

### Internal atomic writer and placement transfer on shared PostgreSQL

The scoped PostgreSQL 17.12 native test passed five checks with synthetic signed admission. A live old lease refused the transition. An induced failure after the joined writes rolled back writer history, epoch, task configuration, owner and preparation. Commit advanced the writer epoch once across both stores. The old signed configuration was visible only to the original Agent directory. The old assignment failed to reacquire its lease and the successor claimed a newer epoch. The integrated application `902fe9ba792da8073d83a6c7966940597cb1d74305cc57ce20d2a56b4bd81ffa` passed 61 Java tests. The native profile exercises the shared storage transaction. Real candidate configuration installation and public transition have separate gates. [Manifests](/files/docs/verification/baseline.json)

### Candidate private report and receipt staging

Artifact `58298164f4ab3a05ad8fc7e54161a3e0541703f073b8cf9fa331fc82bd18d186` passed 19 native tests and 30 focused Java. The prepared Agent staged exact report and receipt bytes under private names. The existing validation CLI refused the staging directory without creating an ordinary report, and the other Controller revalidated the same stage while the shared archive was unavailable. Restart, release and missing original receipt were checked. Original ownership, registry and source and target cuts stayed stable. [Agent preparation operations](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### Two-entry Kafka native receipt review

Artifact `6bbdfed85c59d6b4b142144f397df163693e56fdb15ed44518cd9a674ab75d1a` passed two native Kafka KRaft cases and 42 focused Java. The authenticated management action stores a reviewed receipt. The second entry replayed the same operation and could query the protected result after the Agent went offline. Native broker offsets and both subscription acknowledgements stayed stable. A later partial BEGIN refused proof. The combined package `d7a0775b9220ea26d18abe76e697a5e97dc9e83f9c97c740082d40c0e1a837b3` passed artifact checks, 72 focused Java cases and 141 DOM tests. Its optional PostgreSQL-native contract was run independently. [Kafka operations](/docs/en/reference/messaging-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Actual PostgreSQL business writer grants and pre-write failback

Artifact `57da4be48cffc57f6b0a0145be7f416cf40c65455df571dce11a8cf1eb4340da` passed seven native cases on MySQL 8.4.13 and PostgreSQL 17.12 with 68 focused Java tests. At the approved paused adopted cut, one dedicated role obtained the native grants and Rivomesh ordinary resume was fenced. The original request recovered a locally committed grant after a lost response. Failback first revoked PostgreSQL grants. It allowed previously rolled-back DML, rejected active role sessions and refused uncertain unlogged continuity after a real PostgreSQL crash. A committed write that returned rows to their earlier value remained visible in the durable witness after restart and fenced failback. Integrated JAR `23176e1092da24b99381c921688daa4e3ae4595b44f1a2a3469c247a580c7680` passed 68 Java tests. The original MySQL freeze stays protected. Combined restoration of a downgraded constraint at the same adopted cut is tracked separately. [Writer cutover and failback](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

### LG-02 existing PostgreSQL target from constraint review through failback

Artifact `10d0fde41214d6ef5919dde2b9078a071e3b3113112af9e1afbb308433f3d48f` passed four native end-to-end checks and 68 focused Java tests. One keyed existing PostgreSQL 17.12 table with one signed BIGINT business UNIQUE used the same frozen MySQL 8.4.13 cut throughout. The workflow reviewed actual differences, adopted the table, restored the approved UNIQUE and retained the original ordinary index. Unattested constraints and changed physical indexes refused admission. The same restored receipt authorized business writer handoff and pre-write failback. Ordinary CDC then retained the original snapshot and enforced restored UNIQUE. SDD v0.58 accepts this first bounded profile. [Existing target runbook](/docs/en/reference/nonempty-target-preview.html) · [Manifests](/files/docs/verification/baseline.json)

The earlier exact `18d7a77` application passed a full Temurin 21 packaging reactor with 565 app tests and two isolated transport tests, 35 optional skips, and final package checks. The normal package lifecycle builds the relocated GaussDB driver before checking coexistence with other PostgreSQL-protocol drivers. [Manifests](/files/docs/verification/baseline.json)

### Hive external PostgreSQL Metastore, partial native profile

The Hive 4.0.1 fixture uses stock catalog schema 4.0.0 on a dedicated PostgreSQL 17.12 server and a separate PostgreSQL business destination. It passed stock initialization and validation, native snapshot/CDC and coordinated service outage recovery. Catalog bytes and physical PostgreSQL, Hive table, owner, resource and warehouse identity remained identical after the catalog server restarted. The SQL destination advanced during the outage, and Hive caught up when the services returned. Host power logs recorded Clamshell Sleep during Worker restart, after which the test timed out. All named fixtures and private test configurations were cleaned. Worker continuation and subsequent native SQL recovery remain open for this external profile. [Hive external Metastore](/docs/en/reference/hive-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### MySQL DDL comparison in both management entries

Artifact `729fb2106d22572789e52d26d5bb242e7bf03386d90064991fba0431bb0a481a` passed eight native checks and 37 focused Java tests. A real MySQL ALTER stopped capture at the original GTID. Both entries compared the journal schema and current catalog, then showed a later ALTER in the observed source comparison. Both target schemas and the original task checkpoint stayed unchanged. The combined package `0ce387c8dc554b17e70fff3ed82a399c713eeec4ef472dd43d3d2f5c272a7bb3` passed 37 Java, 145 DOM and binary package verification. [Capture review](/docs/en/reference/capture-recovery.html) · [Manifests](/files/docs/verification/baseline.json)

### Console controls for private evidence staging

The staged console candidate `5370a8018ae954e8d2aa7ecd5d4dcaa77538e6e27ae8babff5d889a72c6a67e6` passed 144 DOM and 14 standalone Chrome cases. Six Chrome checks with a synthetic two-entry API passed exact operation replay and revalidation. The two live cluster attempts stopped before the browser staging interaction. Their disposables were cleaned. The independent native staging API proof above covers the exact evidence behavior on real Agents. [Private staging operations](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

### Private two-Agent transition with durable STOPPED candidate configuration

Artifact `892b2226446a4f46a1cccc34d4ba409fd200ac372ab0c600e72730a426e71b4f` passed 17 native checks with two real Controllers, two Agents, MySQL 8.4.13 source, PostgreSQL management and journal in one database, and native PostgreSQL and MySQL destinations. A changed proof refused movement. The test-only Controller invoked the signed commit and discarded its reply. The second Controller replayed the same operation. The journal epoch advanced exactly once, the two native target cuts stayed intact, and the checked candidate persisted the same STOPPED configuration. The former Agent reopened after SIGKILL and lease expiry without regaining write authority. The STOPPED projection kept START fenced. Integrated Temurin 21 artifact `ee6d65302e118c16d3013146ab9c74e4b45f53dbbf9c20da329255ddfb98b0e9` passed 65 Java tests. The public interface retains preparation, stage and lookup. Live evidence import and candidate Worker activation require separate acceptance. [Agent custody and preparation](/docs/en/reference/global-control.html) · [Manifests](/files/docs/verification/baseline.json)

The isolated exact published console `0ce387c8dc554b17e70fff3ed82a399c713eeec4ef472dd43d3d2f5c272a7bb3` subsequently passed 20 live checks, including six on Chrome 157. One entry staged and revalidated real private report and closed receipt bytes. The other checked the same counts and released the preparation. Task identity, revision and MySQL, journal and target cuts stayed intact. Keyboard focus returned to the task action. [Manifests](/files/docs/verification/baseline.json)

### Internal Kafka gap notice lost-response recovery

Separately frozen prototype `ffd2ae3e9156c3078de98e1ef811dadca6d25055ce5a4dc15d4f3e3a50a32874` passed two real Kafka 3.9.2 KRaft cases on a dedicated RF3 control topic. The previous producer lost authority and its uncommitted record remained invisible. A committed notice with a lost response recovered the stored exact offset after H2 reopen. Replay returned one visible notice, with original failure payload and business, consumer and journal positions intact. [Manifests](/files/docs/verification/baseline.json)

The exact `bbe4fc8` application passed a normal Temurin 21 packaging run with 576 Java app tests, two isolated transport tests and 35 optional skips. The final artifact `d07dcc9868c2f571b7e4ff39322fb3f3df116c73a2ab1a419b8d135f83a39d79` passed the binary package gate. [Manifests](/files/docs/verification/baseline.json)

### Hive external PostgreSQL Metastore full restart and recovery

The same `08e755568ee40d57d8e4ccf776a3974bd02c9d6130a686843e428c10734a9e34` artifact and published fixture `065f5e9` passed seven native markers and stock Hive catalog initialization and validation. Four batch receipts, including the receipt observed while the separate PostgreSQL subscription was paused, matched the original physical PostgreSQL catalog, table, owner, resource and warehouse. HiveServer2, Metastore and catalog restart retained the original volumes. Worker SIGKILL resumed the original snapshot. The PostgreSQL constraint repair and replay preserved the Hive receipt. The prior interrupted run remains archived. [Hive external Metastore](/docs/en/reference/hive-v3.html#external-postgresql-metastore-fixture) · [Manifests](/files/docs/verification/baseline.json)

### External Kingbase JDBC on Java 21

The external vendor package `520aecc1fff7de42aaf4c51ea45b61d56a2a333675a88008bae56a3b0f3807ce` passed five native target checks with the independently supplied Kingbase JDBC JAR and a disposable KingbaseES V009R001C001B0025 ARM64 instance in PG/UTF8 mode. The fixture used synthetic row transactions through the packaged JDBC sink. It verified the exact class origin, missing-provider diagnostic, native authentication and SQLSTATE `28P01`, UINT64, DECIMAL(65,30), JSON and atomic duplicate-key rollback. After the target restarted at the original endpoint, the previous epoch was fenced, the same snapshot and first receipt were retained, and the next transaction advanced the native checkpoint once. [Kingbase operations](/docs/en/reference/kingbase-v3.html) · [Manifests](/files/docs/verification/baseline.json)

### Nonempty PostgreSQL adoption with UNIQUE(email)

The `0c11572ca63fb42f45218cb4cc94d473f8dc243310f92e34b2798b7d7d6d6e59` artifact passed 68 focused Java tests and six native checks from MySQL 8.4.13 to PostgreSQL 17.12. The approved single-column VARCHAR profile retained the original ordinary index through constraint restoration and preserved exact case, trailing spaces, Unicode forms and SQL NULL behavior. It verified writer activation, pre-write failback and continued CDC with the original snapshot. Different source padding or case rules, partial-width keys and drifted target equality rules were refused. [Operator procedure](/docs/en/reference/nonempty-target-preview.html) · [Manifest](/files/docs/verification/baseline.json)

### PostgreSQL source clock values to PostgreSQL and MySQL

The `93b7860597bfd0ab93e2de2a708a00c2aaa0ffba57a8bb8f7ea44bf876db80cf` Java 21 package passed nine native checks with PostgreSQL 17.12 and MySQL 8.4.13. Both targets stored distinct midnight and 24:00 and preserved microseconds, keyless duplicates and SQL NULL. CDC changed a key by one microsecond and deleted one exact duplicate. The original logical slot and both target snapshot sets survived a hard Worker restart. Preflight refused TIMETZ before slot creation. After a snapshot assertion timeout in the first fixture, the same JAR passed on retry with direct comparison of normalized native TIME text. This scope passed 37 Java tests after integration with the current main branch. [Source operations](/docs/en/reference/postgresql-source.html) · [Manifests](/files/docs/verification/baseline.json)

### Read-only Kafka gap notice plan through two management entries

The `675b34ac8ec1df9536986888db039558f3307bac33d177cd2a3ff241707e769a` package passed 67 focused Java and three native checks on four Kafka 3.9.2 KRaft brokers. The two entries returned the same plan bound to original failure and physical Topic identity. A subsequent partial BEGIN blocked planning. The dedicated control topic stayed empty, and the source evidence, business positions, consumer offset and journal receipts stayed intact. The current integrated package passed 46 Java and 146 DOM tests. Global Topic ownership evidence and approved dispatch remain separate. [Kafka operations](/docs/en/reference/messaging-v3.html) · [Manifest](/files/docs/verification/baseline.json)

### Offline signed audit checkpoints

Commit `78eeb52` passed 13 audit export tests each with OpenSSL 3.6.2 and LibreSSL 3.3.6. Verification accepts the original ECDSA P-256 signature, exact checkpoint bytes and independently enrolled store identity. It refuses the wrong key, modified data and a genuine signature from the same signer for another store. The independent custodian retains the signing key and latest trusted sequence. [Operations](/docs/en/reference/security-audit.html#signed-checkpoints) · [Manifest](/files/docs/verification/baseline.json)

### PostgreSQL native publication shape review

The `90b7556ce41b90d5d0940d38cd4c22eec2643c4fc617d14d91cdcb7e5673334f` package passed eight native checks, 12 Java tests and 147 DOM tests. PostgreSQL 17.12 stopped delivery after a changed Relation while the prior source LSN and destination cut remained intact. Review identified the current publication shape, reflected subsequent DDL with a different current digest and returned an explicit diagnostic for an unsupported column. No DDL was applied on the target. [Source operations](/docs/en/reference/postgresql-source.html#review-a-paused-schema-change) · [Manifest](/files/docs/verification/baseline.json)

### Oracle virtual column feasibility

The `08e755568ee40d57d8e4ccf776a3974bd02c9d6130a686843e428c10734a9e34` release probe and the frozen fixture passed 12 checks with Oracle Free 26ai on a disposable PDB. Historical reads preserved the calculated virtual NUMBER values and duplicate multiplicity. Archived statements carried complete physical operands, including two intermediate updates in the same transaction and a keyless delete. The separate `COLUMN_PRESENT` query returned `ORA-00904`. Product configuration, generated-column ingestion and restart validation remain open. [Oracle operations](/docs/en/reference/oracle-source.html#oracle-virtual-column-feasibility) · [Manifest](/files/docs/verification/baseline.json)

### Parked Agent handoff with external evidence and mixed-runtime fencing

The `45bcb211eb41891d4b3b9142b639e2e6f8c274c2e49b6217ab688cdce5a2dc06` package passed 24 native checks, including two real Chrome checks across both management entries. The candidate reopened its stopped configuration and installed the original reports and closed operation receipts. The other Controller replayed the bound request after process exit. The journal parked the successor and refused direct Worker launch and generic resume from both the previous and current binaries. The original Agent could not reclaim the journal. Exact source and SQL cuts were preserved through both restarts. The integrated candidate also passed 115 Java tests, 150 DOM tests and 25 configuration examples. [Operator status](/docs/en/reference/global-control.html#assess-transfer-to-another-agent) · [Manifests](/files/docs/verification/baseline.json)

### Native physical Kafka Topic evidence for managed notice preview

The `7658bc7f0c73af18f3627f0d4036b7efca89bf40dd87c3868469b5a68ef13275` package passed 55 Java tests, 150 DOM tests and three native Kafka checks. Both Controllers returned the same signed notice plan with the observed business and control Topic identity digests. Two configured Kafka destinations returned the explicit missing-evidence result. The dedicated Topic stayed at offset zero while business, healthy peer and consumer positions remained unchanged during review. [Operations](/docs/en/reference/messaging-v3.html) · [Manifest](/files/docs/verification/baseline.json)

### Approved native fencing of a parked Agent’s SQL targets

The `4d00c07d8db11cbf3d72f811e639bf11477f8d742df5f1d5453693634a100b6a` package passed 22 native checks, 59 focused Java tests and 151 DOM tests. The administrator bound the approval while the candidate was offline and replayed it at the other Controller. PostgreSQL began at the parked epoch to model a previously committed first fence. The candidate rechecked both original checkpoints and completed the MySQL epoch update after restart. Both targets kept their original receipts and rows. The journal and candidate Worker stayed parked and stopped. A stale revision and replacement request were refused. All disposable resources were cleaned. [Operator guide](/docs/en/reference/global-control.html#fence-the-parked-sql-targets) · [Manifest](/files/docs/verification/baseline.json)

### Target fence approval in the managed handoff console

The `f458c5f066ceceed95b451f8c1de5f12d5e2f1399c7edb3a431e791ef4711289` package passed 24 native checks, 59 Java tests and 152 DOM tests. Chrome at 390px and 320px observed the approved action from both management entries. The DOM fixture verified a lost approval response reuses its original request ID and committed task revision. Both SQL targets finished at the parked epoch and the candidate Worker remained stopped. [Global controller guide](/docs/en/reference/global-control.html#fence-the-parked-sql-targets) · [Manifest](/files/docs/verification/baseline.json)

### Public SQL Agent handoff and Worker continuity

The `0c2e231f473a3a6546a221abcc188305202e4d3d1d77f26c680f830722e0d933` package passed 31 native checks, 94 Java tests and 154 DOM tests. The real console committed the same bound ownership request without starting the candidate. After an administrator fenced both SQL targets, a changed target receipt kept the next approval pending. The same approval took effect after the candidate restarted with the restored receipt. The former Agent and the previous runtime remained fenced. New MySQL CDC reached both SQL targets at the original snapshot generation. Ordinary STOP, Agent restart and approval replay preserved the stopped state. Both Controllers read adopted history and newer reports. [Operator workflow](/docs/en/reference/global-control.html#commit-a-reviewed-owner-change) · [Manifest](/files/docs/verification/baseline.json)

### Oracle integer virtual columns through archived restart

The `4d81f927ee7000af9b948e4842c51127e873f091a17602175ae8712b0ef603a7` package passed 17 native checks, 123 Java tests and 154 DOM tests. Oracle Free 26ai supplied keyed and keyless Flashback rows and the original archived operand for each before and after image. PostgreSQL received the derived values, SQL NULL and exact duplicate counts. The Worker replayed work recorded during a SIGKILL outage while retaining the original snapshots. Preflight refused unapproved virtual columns and function expressions. [Operator guide](/docs/en/reference/oracle-source.html#integer-virtual-columns) · [Manifest](/files/docs/verification/baseline.json)

### Authenticated private staging of MySQL raw capture archives

The `446030732f40c563137f1bcdec9c663d2502434f02f1926bb15434c1a11acf02` package passed 23 native checks, 76 Java tests and 155 DOM tests. The original Agent retained bytes from a real row-limit failure and replayed the same GTID after review. The candidate staged the exact signed raw ZIP beside completed validation reports and closed receipts. Both shared files were temporarily unavailable when the other Controller reverified the local files. The native journal, targets and task ownership stayed at the reviewed cut. [Capture recovery](/docs/en/reference/capture-recovery.html) · [Manifest](/files/docs/verification/baseline.json)

### Durable handoff blockers and explicit reapproval

The `05d34f775a4e30c522070a3379b3c0bfe2c626112ec3b1a7bba78a9f9f5f4d4d` package passed 29 native checks, 91 Java tests and 156 DOM tests. Both Controllers read the same sanitized checkpoint mismatch and later authorization change while the candidate remained stopped. The old approval was refused. A fresh approval resumed from the same source checkpoint with the original snapshots. The console displayed the last verification time and enabled the reapproval action when the latest signed plan allowed it. [Operator workflow](/docs/en/reference/global-control.html#start-the-candidate-worker) · [Manifest](/files/docs/verification/baseline.json)

### Pulsar private CA and Token restart

The `1a352fe2ac8f2a318dad914104a2425a6a6fe50888d6504c26699171ecc51706` package passed three native Pulsar 4.0.14 TLS scenarios, 54 Java tests and 156 DOM tests. Both the administrative connection and the publisher verified the CA and broker hostname. Invalid certificates and absent credentials failed before provisioning. After the authenticated broker restarted, the original topic returned both confirmed messages in order. [Messaging configuration](/docs/en/reference/messaging-v3.html#pulsar) · [Manifest](/files/docs/verification/baseline.json)

### Managed Kafka notice writer permissions

The `fb7fd290fbccabc7dcf7a565a89fac3dbaad77262b2aa14f4c896590aedff72a` package passed 12 focused Java tests and 156 DOM tests. Its product classes matched the package used in six native Kafka 3.9.2 KRaft cases with TLS and separate SCRAM credentials. The read-only preview checked both topic identities and the broker's actual permissions. It rejected extra write permissions, failures to see the business topic and invalid credentials. Both topics stayed at offset zero and no consumer group was created. [Operations](/docs/en/reference/messaging-v3.html) · [Manifest](/files/docs/verification/baseline.json)

### External Object Lock for signed audit checkpoints

The retention tool verifies the signed export checkpoint before it writes an S3 object. Five transport tests and 13 signature export regressions passed. In seven loopback MinIO checks, it confirmed the same SHA-256 and locked version after a retry. Conditional overwrite, early version deletion and shortening the COMPLIANCE retention deadline were refused. An exact-version read preserved the signed bytes. This fixture verifies the compatible Object Lock operations. AWS account permissions and bucket policy require deployment validation. [Operator guide](/docs/en/reference/security-audit.html) · [Manifest](/files/docs/verification/baseline.json)

### Managed handoff of original MySQL capture history

The `9caca6d9160b7e7e8689b90793d854bcd2a378db1ab161a620c58e676316d893` package passed 29 native checks, including three Chrome checks through both Controllers. The original Agent kept its capture key. After the approved owner transfer, the candidate restarted and both entries could still verify the exact private ZIP while the shared and staging copies were offline. The previous Agent and the direct Worker launch stayed fenced. Both SQL target receipts and the source checkpoint matched the reviewed cut. The package integrated with the Kafka permissions feature, `0928633dc58f955cd29632a09f9f5f69920304e217dbb989e6eb75f4d30b5c63`, passed 61 Java and 156 DOM tests and the artifact gate. [Operator guide](/docs/en/reference/capture-recovery.html) · [Manifest](/files/docs/verification/baseline.json)

### JDBC identity index protection

The `331ecb19e9dca51eeff2455cc343da8a04efd431289f414a432bafd72fc6227a` package passed 31 focused Java tests, including nine JDBC sink tests. The H2 guard fixture rejected explicit global primary indexes and reordered identity GSI before creating the target schema. Ordinary UNIQUE retains the declared identity constraint, and a business GSI with additional columns retains its ordinary-index plan. The optional real-database test was skipped. The bilingual guide defines the commercial distributed GaussDB acceptance. [Index operations](/docs/en/reference/gaussdb-index-policy.html) · [Manifest](/files/docs/verification/baseline.json)

### Oracle virtual integer sums and differences

The `61ea0d63cb00acf7b4eb5172f2e3f4b57e075a3551bfbd6b89507e43bc139904` package passed 18 native checks on Oracle Free 26ai to PostgreSQL 17.12. Flashback and the archived physical operands reproduced integer multiplication, addition and subtraction, including SQL NULL and duplicate keyless rows. A forced Controller and Worker restart recovered archived work with the original snapshot IDs. The first parallel launch timed out during database initialization, and the same package passed the exclusive rerun. The integrated `4aa6fe1ab7bbb4f10bc1183e93c6d453c634992ef5f518425408d9af47de90c1` package passed 45 Java tests and the artifact gate. [Oracle operations](/docs/en/reference/oracle-source.html#integer-virtual-columns) · [Manifest](/files/docs/verification/baseline.json)

### Approved handoff continuation after Controller loss

The `9a7200d6942bdd8aeca1645666b3dd01d524ed76dc90065b8df6af7c3d2d5db6` package passed 18 native checks with MySQL 8.4.13, a PostgreSQL control store and two transactional SQL targets. A changed target receipt kept the candidate fenced. After the Controller that accepted the bound request was killed, the candidate rechecked the restored receipts, moved the assignment once and remained stopped at the exact source and target cut. This approved, stopped handoff is distinct from unexpected loss of its original Agent. Raw capture history follows its explicitly approved Controller route. The integrated package `c69e00d9d33d0a5f95bc1b828565c106bda7a471324c6243b156379a62467880` passed 70 Java and 156 DOM tests and the artifact gate.[Manifest](/files/docs/verification/baseline.json)

### Temurin 25 with MySQL GTID failover

The published application package `c69e00d9d33d0a5f95bc1b828565c106bda7a471324c6243b156379a62467880` passed nine native source-promotion checks with Temurin 25.0.5 on ARM64. Both Controller JVMs, the Agent and the Worker ran the observed runtime. The asynchronous replica remained read-only during the primary outage. After external promotion, both SQL targets received the promoted GTID on the original snapshots and configuration. The rolling profile passed 12 checks. Controller replacement preserved management access. The replacement Agent retained the earlier STOP receipt and restarted the Worker at the original GTID and snapshots. The initial failure is retained in the evidence, along with a standalone H2 journal probe. [Compatibility](/docs/en/reference/compatibility.html#release-runtime) · [Manifest](/files/docs/verification/baseline.json)

### Managed Gauss index review

The `cef5e54f077c2e4fa8c13d04d103211ae36256cd93030262ffa57934cb232726` package passed 43 Java tests, 156 DOM tests and the package gate. The same index policy drives the v3 console or CLI check and the JDBC writer. MySQL mappings expose complete counts and bounded details, with separate budgets for blockers and planned indexes. PostgreSQL and Oracle report when their source discovery lacks index definitions. Commercial multi-CN/DN behavior requires deployment validation. [Gauss index guide](/docs/en/reference/gaussdb-index-policy.html#review-the-index-plan-before-starting) · [Manifest](/files/docs/verification/baseline.json)

### Original Agent outage and same-directory recovery

The `aec70219d6d0a3806a7abc660293c6d08265fad95046a05c7460508fb057b427` candidate passed nine native checks after the original Agent was killed. Both Controllers exposed the expired node lease and unknown task state. A prior handoff assessment expired and a fresh one rejected candidate probing. The queued STOP held the original source cut and both target receipts through recovery on the same directory. Explicit START applied the backlog once to each SQL target. The old node publisher and capture heartbeat were fenced. The first run's assertion used the earlier revision before STOP admission. Its result remains archived. The integrated `870068b3bee563bba8ff9e296b98d5266f5930463e50a18900e7b7e44e4acc77` package passed 61 Java tests and 157 DOM tests. [Operations](/docs/en/reference/global-control.html) · [Manifest](/files/docs/verification/baseline.json)

### Kafka notice routing across active and restorable configurations

The `e72df0b232ba5c8fa271b69c3e92ab18df8ac64bdbd6ac405b8489ac3f8b3cbc` candidate passed three native checks across four Kafka 3.9.2 brokers and two Controllers. The catalog checked four Kafka routes under three retained configuration versions. Missing topics produce incomplete evidence. A different DNS alias for the same physical control Topic produces a conflict. Revoked and protected historical references made zero broker connections in the sentinel tests. The control Topic remained empty, and the business Topic and consumer offsets remained at the original positions. The integrated `501be13e9296e6f8368a06ea977345a84422663a9b5c9bd13d345522563811a0` package passed 56 Java and 157 DOM tests. [Operations](/docs/en/reference/messaging-v3.html) · [Manifest](/files/docs/verification/baseline.json)

### Pulsar dual-broker and BookKeeper quorum recovery

The `cef5e54f077c2e4fa8c13d04d103211ae36256cd93030262ffa57934cb232726` package passed four native checks on Pulsar 4.0.14 with two brokers, three bookies and one ZooKeeper node. A surviving broker reowned the original topic after SIGKILL. The transport reopened after a stale producer timed out and confirmed at the original binding. With fewer than two bookie acknowledgements, the pending publication remained unconfirmed. After the original bookies restarted, confirmed messages and the stable retry ID matched. Twelve message-sink and fan-out tests on the same package source verified retry and receipt behavior. The fixture ran on an isolated plaintext network. [Pulsar operations](/docs/en/reference/messaging-v3.html#pulsar) · [Manifest](/files/docs/verification/baseline.json)

### Approved handoff of original signed failure history

The combined `da2c299b84b4daa73f4e2df0c8be624d3c05d0e5aac9993a27c9370c8c5e4314` package passed 29 native checks, including 3 Chrome checks. An actual PostgreSQL constraint failure produced the original signed record. A damaged staged record blocked the ownership request and preserved the reviewed cut. After the approved transfer and candidate restart, both Controllers read the exact history and closed review receipt with the shared archive and staging copy offline. The original Agent kept its key and the candidate stayed parked. A normal packaging reactor passed 627 Java tests with 35 optional skips and 157 DOM tests. Its `81888b8f09d266cc45f3a7bfbff435667f25351f77ed8c2cb0f08a775513522c` package matched the native candidate across 24951 Rivomesh and console entries. [Operator guide](/docs/en/reference/failure-evidence.html#preserve-history-during-an-agent-handoff) · [Manifest](/files/docs/verification/baseline.json)

### Pulsar TLS and ZooKeeper quorum recovery

The `81888b8f09d266cc45f3a7bfbff435667f25351f77ed8c2cb0f08a775513522c` package passed six native checks on Pulsar 4.0.14. The two broker endpoints used separate private CA certificates and Token authentication. Missing credentials and a mismatched hostname were refused. The same topic survived a broker kill and a BookKeeper quorum outage, with the original histories retained. After the elected ZooKeeper leader was killed, the surviving quorum chose another leader. The transport committed new topic metadata and confirmed its first event while the original topic remained accessible. This fixture keeps BookKeeper and ZooKeeper peer traffic in an isolated local network. [Pulsar cluster operations](/docs/en/reference/messaging-v3.html#pulsar) · [Manifest](/files/docs/verification/baseline.json)

### Managed Worker isolation during a control-path partition

The `e37f3e3cb70c0399fc7c8d507c0ba6b51f6c5da1e98f86b2aae072422f7d11e6` candidate passed 57 focused Java tests and 11 native checks. The fixture disconnected only the original Agent's shared PostgreSQL control and journal path. Its process and data connections stayed live while the former Worker stopped and both targets held their original cuts. After reconnecting, the same Agent completed the STOP accepted during the outage. Explicit START processed the backlog once per target and rejected both former lease generations. The baseline timed out with its Worker still present after eight successful checks. Both native environments were cleaned up. The case begins at a settled cut. [Operations](/docs/en/reference/global-control.html#asymmetric-control-network-partition) · [Manifest](/files/docs/verification/baseline.json)

### Oracle archived LOB representation and preflight

The `0dcb0afcc7c6766b2283a11349fb345d21baf87cba2ce18d0b1b559a53922efb` candidate passed 14 Java tests and 12 checks against Oracle Free 23.26.4.0.0. Flashback verified exact before and after BLOB and CLOB contents, including empty LOBs and SQL NULL. Two closed-archive reads returned 30 identical records. Twelve short-value updates label undo as NULL, including when the true prior value was nonempty. Eight locator and partial-write records were status 2 and lacked undo. The packaged preflight reports a different refusal for BasicFiles and SecureFiles to the restricted Oracle role. Full LOB replication requires a separate complete-image profile. [Oracle operations](/docs/en/reference/oracle-source.html#blob-and-clob-preflight) · [Manifest](/files/docs/verification/baseline.json)

### Combined raw MySQL and signed failure history handoff

The `9253e3ad29f17697bda9a9a1471c2516606ae96625542f67c4ee78e434284cc2` candidate passed 37 native checks with MySQL 8.4.13, two SQL targets and Chrome. One approved PostgreSQL same-database transfer refused each of four independent staged-file failures. With both private copies restored, the parked candidate adopted the raw binlog archive and signed PostgreSQL constraint failure under one digest. It retained both original operation receipts and stayed stopped after restart without shared or staged copies. Both Controllers reopened the read-only history. Both keys remained on the original Agent. The integrated `2d4e6bf5f6ebc06ad06fbae16461a6f6a4934e2e3d187649eb6fbe56d53063a3` package passed 96 Java and 157 DOM tests. [Operations](/docs/en/reference/failure-evidence.html#preserve-history-during-an-agent-handoff) · [Manifest](/files/docs/verification/baseline.json)

### Retention of complete signed audit event windows

Eight retention tests and 13 exporter tests validate exact archive bytes, an independently signed predecessor and refusal before upload when a window omits required history. The loopback MinIO fixture with AWS CLI 2.32.24 passed 11 native checks. It retrieved the original event bytes and signature by version, recovered an identical version on retry, refused deletion of the protected event object, validated a second retained cut and detected local readback tampering. Live AWS identity and policy still require that environment. [Operations](/docs/en/reference/security-audit.html#retain-complete-audit-event-windows) · [Manifest](/files/docs/verification/baseline.json)

### PostgreSQL bounded NUMERIC with extended scale

The `987f005cac585c68b334f506a66897cf227f2d5774901d933987be54f2be9c38` candidate passed 37 Java tests and 11 native checks. PostgreSQL 17.12 `NUMERIC(4,-2)` and `NUMERIC(2,4)` retained their stored values in PostgreSQL 17.12 and MySQL 8.4.13. The same publication had been rejected by the previous binary without creating a logical slot. The candidate preserved 65-digit values, SQL NULL, keys and exact keyless multiplicities across a Worker SIGKILL. A transaction containing NaN kept its entire batch unapplied and preserved the capture LSN and both SQL receipts. [Operations](/docs/en/reference/postgresql-source.html#exact-numeric-values) · [Manifest](/files/docs/verification/baseline.json)

### Archived Java 17 build and native rolling replacement

Corretto 17.0.19 packaged the `5a4a26bb861e33217050a22555ae4d449470b089fff864553e60a0884dd0a8ac` bundle. It passed 627 application tests with 35 optional skips. The package gate checks Java 17 class-file compatibility. Twelve native checks observed both Controllers, the Agent and the Worker on ARM64 Temurin 17.0.21. A MySQL 8.4.13 source fed both PostgreSQL and MySQL, and rolling replacement retained the GTID, snapshots and STOP receipt. This archived bundle used the former Maven profile. Build and run the current release with Eclipse Temurin 21 LTS. [Compatibility](/docs/en/reference/compatibility.html#release-runtime) · [Manifest](/files/docs/verification/baseline.json)

### Durable conditional Kafka notice approval

The `b29d9a8a50dc31d2208ccc7ae013f54014183b36bc9cdd383a3d80754f0dac7c` candidate passed four checks on Kafka 3.9.2 with four brokers and two packaged Controllers. An exact blocked approval replayed from both entries and survived owner loss. A replaced authorization revision was refused. The dedicated control topic stayed empty. The business topic end offset and committed consumer offset remained 9 and 1. The native profile retains the missing writer and historic ownership blockers. The exact package passed 106 Java and 157 DOM checks. The combined Java 17 package passed 51 focused Java and 157 DOM tests. [Operations](/docs/en/reference/messaging-v3.html) · [Manifest](/files/docs/verification/baseline.json)

### Native openGauss index catalog and restart

The `0dcb0afcc7c6766b2283a11349fb345d21baf87cba2ce18d0b1b559a53922efb` package passed eight native checks from MySQL 8.4.13 to single-node openGauss 7.0.0-RC3 mode A on ARM64. The read-only plan and five native catalog indexes agreed. The source-enforced email uniqueness mapped to a regular target index, while the composite business key and receipt primary keys remained in place. A same-endpoint target restart preserved snapshots, receipts and index OIDs. The Worker reopened its journal and applied one new transaction. A source prefix index blocked business DDL. Commercial distributed GaussDB and GSI remain separate acceptance profiles. [Operations](/docs/en/reference/gaussdb-index-policy.html) · [Manifest](/files/docs/verification/baseline.json)

### Independent control and journal paths during handoff

The `dc88c6399ced052299f10159df0b765a8f56978f040922f01a7564c090619be6` package passed 21 native checks, including two Chrome checks. The original Agent retained its journal path. The candidate remained in the same process and renewed its control lease while losing only its journal path, so native cut proof was refused. A fresh JDBC check restored read-only staging. Both Controllers refused cross-database writer transfer and kept the assignment and both cuts. Release let the original Agent continue from its original snapshots. Two prior fixture failures were kept. The integrated `5b2943645739166ae427d0522a1cffdc3840f6914331ab3a827e6d0b44a63e40` package passed 96 focused Java and 158 DOM tests. [Operations](/docs/en/reference/global-control.html) · [Manifest](/files/docs/verification/baseline.json)

### Exact outer and nested package component inventory

The scanner verified the external-driver candidate `02906330f9cc73efa8e4516ef3838f3ee3607a12f943e0352664a8db5711b5f3`. It identified 151 package coordinates, 46 missing from the Maven BOM, and recorded locations and digests for Hive, the three Bouncy Castle JARs and Kafka metadata. An old-coverage fixture omitted 46 required reviews. Four Python regressions confirm that explicit review rejects unidentified nested JARs, with exact nested location and digest. The external JDBC check passed. Project licensing and distribution approval remain open. [Review procedure](/docs/en/reference/release-inventory.html) · [Manifest](/files/docs/verification/baseline.json)

### Artemis shared-store primary and backup

The `b7d06077949d02659d27a4798d99d920162d2da17565022fd4aafa214426f2d3` package passed four native Artemis 2.57.0 checks. The passive backup opened its Core listener after the primary was killed. The publisher kept its existing receipt when its stable loopback ingress was isolated. After the ingress routed to the active backup, the publisher verified the original native receipt, identity and bytes, then confirmed the same pending event. The first fixture failed at JVM initialization. Both test projects were cleaned up. [Operations](/docs/en/reference/messaging-v3.html#shared-store-primary-and-backup) · [Manifest](/files/docs/verification/baseline.json)

### Native in-flight target rollback during Agent network isolation

The `6f148bba` candidate passed 13 native checks. A PostgreSQL target row lock prevented it from committing while the MySQL target committed and reached journal ACK 2. Cutting the original Agent's control and journal path isolated its Worker. The PostgreSQL blocked transaction rolled back after that Worker exited. The same Agent reconnected and completed queued STOP. Explicit START filled only the missing PostgreSQL delivery. Both target logs recorded exactly one insert and one update, the MySQL receipt and source cut remained unchanged, and both old leases were rejected. The verification manifest records exact hashes and prior fixture failures. [Operations](/docs/en/reference/global-control.html#asymmetric-control-network-partition) · [Manifest](/files/docs/verification/baseline.json)

### Archived Java 17 MySQL asynchronous source promotion

The `393dfd186f2633d2faf45939940881e5547f9e2c63ba75e110dfd00de0a1da24` bundle passed nine native checks on ARM64 Temurin 17.0.21. MySQL 8.4.13 replica and authorization checks kept it read-only during the primary outage. Both management entries reported the source fault and preserved both cuts. External promotion let the Agent consume the promoted GTID once on each SQL target. Original configuration and snapshots stayed in use. [Compatibility](/docs/en/reference/compatibility.html#release-runtime) · [Manifest](/files/docs/verification/baseline.json)

### Single Temurin 21 release baseline

Eclipse Temurin 21 LTS is the supported build and runtime for the Controller, Agent and Worker. The `512742f469edf00f544911937cbc6013e988e2544d9519501aaec3f8ae777dca` bundle passed the Java 21 class-file gate and 41 focused application tests. Twelve native checks observed the three roles on ARM64 Temurin 21. The Worker resumed MySQL 8.4.13 events to PostgreSQL and MySQL after rolling replacement with the original GTID, snapshots and STOP receipt. [Compatibility](/docs/en/reference/compatibility.html#release-runtime) · [Manifest](/files/docs/verification/baseline.json)

### External OIDC login and shared account controls

The `cd0a765bc3bb84a811d41a39b316f0dbb0ab402455698399e4d0ec38ff7c6e52` package passed 48 Java and 161 DOM tests, Helm lint and the Java 21 artifact gate. Two actual Controller HTTP entries sharing H2 completed code login against an HTTPS fixture. Invalid signatures and claims, wrong browser binding, replayed state and unmapped subjects were rejected. The Accounts panel uses the existing revision and CSRF checks for binding and revoking an identity. Both entries revoke the previous session and retain local roles and task restrictions. The fixture covers a pinned issuer and key. [Operations](/docs/en/reference/oidc-login.html) · [Manifest](/files/docs/verification/baseline.json)

### First signed Kafka business COMMIT receipt

The `31cd403ccdf60664533d0a4b3e5a837445af7eb18ae4a23f2acb300f77c37af3` Java 21 package passed 121 focused tests and native Kafka 3.9.2 with TLS and SCRAM-SHA-512. The first eligible COMMIT receipt verified the actual Topic UUID, offset, Agent membership lease and same-journal UTC observations. A WRITE-only principal published and acknowledged the transaction while its receipt remained unverified. Restricted PostgreSQL 17.12 and MySQL 8.4.13 journals passed admission and ACK. PostgreSQL UNLOGGED and MyISAM were rejected before publication. The initial MySQL fixture selected the wrong default database, and the same artifact passed after the fixture selected its authorized schema. The combined `529e323460aa3247a0d0749bd0e97a4b3e95830531a8a9b426ef7424c4de2c21` package passed 91 focused tests and the Java 21 gate. Its portable SQL fixture compiled without starting Docker. [Operations](/docs/en/reference/messaging-v3.html#capture-physical-ownership-for-new-business-publications) · [SQL fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/kafka-journal-durability-run.py) · [Manifest](/files/docs/verification/baseline.json)

### Integrated Temurin 21 release checks

The `f31cb970e9f64b522a8546bd0e741f81aa9a0412c3dd27bce81dbb39f4ed6a44` package on Eclipse Temurin 21.0.13 ARM64 passed the full standard Maven reactor, including 646 application tests and 35 optional integration skips. The Java 21 package gate, 161 DOM tests, 14 checks on actual Chrome 157 and 25 shipped configuration examples passed. Separate Helm checks at `39ed017` verified manual-manifest render parity plus the OIDC Controller Secret reference and the Kafka Agent receipt option. The Helm checks validate generated manifests. [Manifest](/files/docs/verification/baseline.json) · [Deployment](/docs/en/reference/console-and-deployment.html)

### ActiveMQ Classic shared KahaDB failover

The `0af9fa942a901e4dbd696ce03382648d7d8bfc587aa285ad31f1626c184508eb` package passed five native checks with two ActiveMQ Classic 5.19.12 brokers on ARM64 and Eclipse Temurin 21. The primary holds KahaDB's exclusive lock and the passive standby does not accept OpenWire. Killing the primary and isolating both stable entries preserves the old confirmation. After both entries route to the standby, the publisher verifies the original ownership and native receipt, then confirms the exact retry. The former primary returns as standby. Both fixtures were cleaned up, including the first run that exposed incorrect test-volume permissions. [Operations](/docs/en/reference/classic-v3.html) · [Manifest](/files/docs/verification/baseline.json)

### Oracle nested savepoints and same-SCN recovery

The `0dcb0afcc7c6766b2283a11349fb345d21baf87cba2ce18d0b1b559a53922efb` Temurin 21 package passed 19 native checks with Oracle Free 26ai 23.26.4.0.0. Native LogMiner showed seven canceled writes and seven compensation records. Both committed-only reads produced the same four surviving changes. Oracle Flashback confirmed the final keyed rows and keyless multiplicities at the observed SCN. Two PostgreSQL subscriptions kept their original snapshots and advanced their original receipts through forced Controller and Worker restart. The fixture validated Flashback availability before adopting the starting SCN, following two earlier fixture failures. [Operations](/docs/en/reference/oracle-source.html) · [Manifest](/files/docs/verification/baseline.json)

### PostgreSQL schema comparison and managed Kafka receipt readback

The `fbc17326c8ee8fedb9d22710f175b6fbd9540e58e7ab7f1554e26745d13a12f5` Temurin 21 package passed 158 focused Java tests, 162 DOM cases and 14 real Chrome checks. Eight native PostgreSQL 17.12 checks proved the current catalog distinguishes `TIMESTAMP` from `TIMESTAMP(6)` at a retained DDL failure. The read leaves the capture LSN, original snapshots and target rows unchanged. For Kafka, two Controller HTTP entries route an administrator's read to the owner Agent. It verifies the active configuration and exact preceding ACK, checks signed membership and returns only its digest and journal observations. Test readback uses controlled Broker metadata. Real Kafka publication has independent native evidence. [PostgreSQL](/docs/en/reference/postgresql-source.html) · [Kafka](/docs/en/reference/messaging-v3.html) · [Manifest](/files/docs/verification/baseline.json)

### Managed signed receipt queries with a native Kafka Broker

The `fbc17326c8ee8fedb9d22710f175b6fbd9540e58e7ab7f1554e26745d13a12f5` Temurin 21 package passed six native readback checks against Kafka 3.9.2. Two independent Controller HTTP entries use the same owning Agent and shared H2 store. The real Agent issued a scoped Worker grant for a synthetic source transaction. Later queries checked the saved receipt through TLS/SCRAM-SHA-512, refused a scoped operator and stale state, and returned missing evidence for a same-name Topic with a new UUID. Readback retained the original Kafka offsets, group set, receipt and journal ACK. The disposable broker was removed. [Operations](/docs/en/reference/messaging-v3.html) · [Manifest](/files/docs/verification/baseline.json)

### PostgreSQL target commit with an interrupted journal ACK

The `c998862b85bb3da84c081de9de06e3d0bcd4567762ccf824e338b28a86440914` Temurin 21 package passed 15 native checks. Both business targets commit once, then the original Agent loses its control and journal route with PostgreSQL ACK still missing. PostgreSQL expires the stale ACK session while the Agent is still partitioned. The test observes the exact backend and locked row, confirms shorter DBA timeouts still apply and verifies no stale ACK. On the original Agent's return, queued STOP completes before explicit START. The Worker reconciles only PostgreSQL ACK using its original receipt and leaves MySQL ACK, source position and native writes unchanged. The first integrated run retained a temporary audit failure and cleaned all resources. The final run needed no retry. The latest integrated `1c8798bff626c02c50227b8813e1deecbda1200090b5f301b87a57d29e29b7e8` package passed 101 focused tests and the release gate. [Operations](/docs/en/reference/global-control.html#asymmetric-control-network-partition) · [Manifest](/files/docs/verification/baseline.json)

### RocketMQ broker Controller promotion and topic metadata

The RocketMQ 5.5.0 fixture used three independent broker data stores and the
`0af9fa942a901e4dbd696ce03382648d7d8bfc587aa285ad31f1626c184508eb` Temurin 21 application. Controller promotion kept the
old event at queue offset 1 and CommitLog offset 451, with identical bytes.
The new event was present on the two live synchronized members. In the first
run, the surviving CommitLog retained the bytes while both brokers lacked the
topic configuration. The corrected run explicitly proved topic configuration on
the three initial members before SIGKILL and on both survivors after promotion.
The current Rivomesh adapter refused the Controller profile before and after
promotion. Both fixture projects were cleaned up.
[Reproduce](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/rocketmq/controller-promotion.md) · [Manifest](/files/docs/verification/baseline.json)

### Both SQL destinations under an interrupted PostgreSQL journal ACK

The `37343e68e73d492d65608c96de78dbf317852e19944ec04277abb87d4fe4c353` Temurin 21 package passed 15 native checks per destination and 91 focused Java tests. The MySQL profile proved the real InnoDB row lock and committed receipt before disconnecting the original Agent. The PostgreSQL journal timed out the old ACK session while it was still disconnected. After the original Agent completed STOP and explicitly started, only MySQL ACK advanced. The default profile selected PostgreSQL and advanced only its ACK under the same harness. In both cases, both Controllers observed UNKNOWN during disconnection, source coordinates and native receipts stayed fixed, and each target log retained one insert and one update. Both fixture projects were cleaned up. [Operations](/docs/en/reference/global-control.html#asymmetric-control-network-partition) · [Manifest](/files/docs/verification/baseline.json)

### Oracle native binary JSON archive and JDBC boundary

The `0dcb0afcc7c6766b2283a11349fb345d21baf87cba2ce18d0b1b559a53922efb` Temurin 21 package passed 13 diagnostic checks on Oracle Free 26ai 23.26.4.0.0. Both closed archive reads contain 24 `UNSUPPORTED` native JSON records. Four scalar controls in the same XIDs decode correctly. After qualifying the PDB LogMiner interface with the positive controls, neither image is present for the 14 expected JSON changes. JDBC Flashback independently preserves complete JSON and typed extended values. The tested driver's `getBytes()` returns text for the observed non-null documents. The current preflight refuses native JSON tables. Both fixture runs were cleaned up. [Operations](/docs/en/reference/oracle-source.html#native-binary-json) · [Manifest](/files/docs/verification/baseline.json)

### PostgreSQL REAL and DOUBLE PRECISION to two SQL targets

The `07488ef478826c2cd920f6bd8e94bbd52409cd6fc6895a4d1ce145605739e2b6` Temurin 21 application passed 45 focused Java tests and nine native PostgreSQL 17.12 to PostgreSQL 17.12 and MySQL 8.4.13 checks. Both SQL destinations match the source's tested binary32 and binary64 values, including adjacent numbers and subnormals. The pgoutput session preserves exact precision even when the server defaults to rounded text. Keyless duplicate updates, offline restart with original snapshots, and refusal of an entire non-finite transaction passed. The same package passed after the fixture switched its MySQL readiness check from the Unix socket to TCP. [Operations](/docs/en/reference/postgresql-source.html#floating-point-types) · [Manifest](/files/docs/verification/baseline.json)

### Native Keycloak login across two Controllers

The `1c8798bff626c02c50227b8813e1deecbda1200090b5f301b87a57d29e29b7e8` Temurin 21 application passed eight checks against Keycloak 26.7.4 and Chrome 156. Two real Controllers share PostgreSQL 17.12 and a trusted HTTPS ingress. Authorization starts on Controller A and the same browser completes the actual S256 PKCE callback on Controller B. A signed provider ADMIN claim leaves the local Viewer and its task/node grants in force. Revocation through B invalidates both entries while the provider session is still active. Authorized audit output records the operation and omits credentials and callback code. Both projects and their scoped browser images were removed. [Operator guide](/docs/en/reference/oidc-login.html) · [Reproduce](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/keycloak-oidc/README.md) · [Manifest](/files/docs/verification/baseline.json)

### Temurin 21 full reactor after SQL recovery and type support

The `56b3bc67f2250b98057be8a8dbd2ccf44e2a772481bb9ebf6c0bf8d015e249cf` package at `309feaf` passed the full Maven reactor and the Java 21 class-file gate. The application ran 654 tests with zero failures and 35 optional integration tests skipped. The exact artifact passed 14 real Chrome checks and all 25 shipped configuration examples. The console suite passed 162 DOM checks. Closely related native product profiles retain their separate exact recordings. [Manifest](/files/docs/verification/baseline.json)

### Opt-in RocketMQ publisher promotion

The `60dc0e19ba2402e776e8739e56348a27753d3427c0fa0bfa503297e244bf3470` Temurin 21 package passed RocketMQ 5.5.0 native opt-in publisher failover. Three independent broker stores agree on the generation-bound topic before writing. The original publisher verifies the same queue and CommitLog receipt after master SIGKILL and synchronously publishes through the promoted route. A fresh publisher verifies the next receipt. With only one live synchronized replica, the publisher refuses new writes and retains both the last receipt and broker queue end. The default single-broker profile fingerprints and physical identities remain stable. [Operations](/docs/en/reference/messaging-v3.html) · [Native fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/rocketmq/controller-promotion.md) · [Manifest](/files/docs/verification/baseline.json)

### Original Agent offline handoff preflight

The `84c4f438174bf9ddafaa274f91b58cde2dbeab851e4e521ecb794e2c42103e16` package passed 78 Java and 163 DOM checks. Both entries preserve the historical stopped cut, reports and closed receipts. The bilingual handoff dialog reads current and missing evidence even when the unreachable original Agent's task format is masked. Optional corrupt historical descriptors are treated as absent in readback. The offline route remains read-only and requires a durable seal and independently retained complete archive before any future takeover. The `fba330c1f5306588c86a3bfd2e408a1476306a2c7ea34c062c9c591929334321` combined package passed 112 Java and 164 DOM checks. [Operations](/docs/en/reference/global-control.html#unexpected-original-agent-outage) · [Manifest](/files/docs/verification/baseline.json)

### Oracle character sets and archived national string images

The `0dcb0afcc7c6766b2283a11349fb345d21baf87cba2ce18d0b1b559a53922efb` Temurin 21 package passed 13 Oracle Free 26ai diagnostics on `AL32UTF8` and `AL16UTF16`. The four keyed and keyless transactions produced 40 expected row changes and all 60 applicable LogMiner before/after images matched Flashback. Repeated archive reads retained the same native bytes. The tested `CHAR` literals decoded, and `NCHAR` and `NVARCHAR2` emitted `UNISTR` expressions that the archived package refused. Current product preflight admits both `VARCHAR2` length forms. The first fixture failure was corrected by retaining native SQL as hex bytes. [Operations](/docs/en/reference/oracle-source.html) · [Manifest](/files/docs/verification/baseline.json)
