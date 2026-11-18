---
kind: docs
locale: zh
title: "需求规格"
sourcePath: docs/sdd/001-control-recovery-compatibility/spec.md
---

# Rivomesh SDD需求基线与未完成事项

RM-SDD-001 · v0.9 · 2026-11-17 · IMPLEMENTING

实施中：48项持续追踪，13项DONE、30项PARTIAL、5项NEW，余35项未闭环。RC-02、RC-05、RC-03、RC-06、RC-07 和 RC-08 限定档案已验收；自动接管、恢复作业和完整兼容矩阵继续追踪。

[基线和决策](/docs/zh/sdd/plan.html) · [任务](/docs/zh/sdd/tasks.html) · [验收矩阵](/docs/zh/sdd/acceptance.html) · [English](/docs/en/sdd/spec.html)

## 多节点统一控制

| ID | 优先级/状态 | 需求 | 尚缺内容 |
|---|---|---|---|
| CP-01 | P0 / DONE | 统一节点注册与状态 | 共享节点目录已通过PostgreSQL/MySQL双节点、kill/重开及控制库中断验收；任务权威/远端命令仍属CP-02/03。 |
| CP-02 | P0 / PARTIAL | 全局任务、配置与操作权威状态 | 可选固定owner全局HTTP/界面、共享配置及历史已接入；旧任务升级导入、完整业务及规模验收仍未完成。 |
| CP-03 | P0 / PARTIAL | 跨节点持久命令路由 | 公开持久命令、离线STOP、真实多目标校验/修复及原UNKNOWN升级恢复已验收；完整取消/故障/迁移与容量矩阵仍未完成。 |
| CP-04 | P0 / PARTIAL | 故障接管、隔离与资源调度 | 已有Worker租约/epoch，缺少统一节点调度、远端生命周期和滚动升级协议。 |
| CP-05 | P0 / PARTIAL | 共享权限、审计和密钥引用 | 共享账号/授权/链式审计及Worker环境过滤已实现；完整远端关联、最小密钥引用和进程/文件隔离仍缺。 |
| CP-06 | P1 / PARTIAL | 全局日志、指标与诊断界面 | 全局任务观察、owner/未知状态、分页及维护结果已有；完整节点/目标过滤、远端日志和诊断检索仍缺。 Worker进程存活与日志接管就绪仍需更清晰区分。 |
| CP-07 | P0 / DONE | 控制面HA及控制/数据面解耦 | 协议4分离档案已通过PG/MySQL控制库、管理全停/命令恢复、控制库中断、原Worker持续及非root验收；默认组合模式仍耦合，自动接管和其他存储/适配器档案另行追踪。 |

## 登录状态保持

| ID | 优先级/状态 | 需求 | 尚缺内容 |
|---|---|---|---|
| SE-01 | P0 / DONE | 刷新后恢复登录态 | 已完成单控制器刷新/新页面恢复；跨控制器连续性仍属SE-04。 |
| SE-02 | P0 / DONE | 会话期限、退出和撤销 | 已完成期限、退出、目录修订撤销及可配置记住浏览器；当前内存存储重启失效。 |
| SE-03 | P0 / DONE | 安全会话传输和CSRF防护 | 已完成受保护Cookie、Origin/CSRF及TLS代理实测；生产TLS由代理终止。 |
| SE-04 | P0 / DONE | 跨控制节点的会话连续性 | 已通过PostgreSQL/MySQL共享会话双节点、HTTPS、撤销、kill/重开及存储中断恢复验收；全局任务控制仍属CP-02/03。 |
| SE-05 | P1 / DONE | CLI/API兼容及身份冲突规则 | 已完成Bearer兼容、不回退/身份冲突规则、权限重验、退出竞态及自身轮换。 |

## 人工恢复、跳过与补数据

| ID | 优先级/状态 | 需求 | 尚缺内容 |
|---|---|---|---|
| RC-01 | P0 / PARTIAL | 按采集阶段区分故障 | 首次目标准备/快照及增量投递阶段已持久化并通过双入口真实故障/重启验收；完整源连接/读取/解码/DDL阶段及人工操作诊断仍待补。 |
| RC-02 | P0 / DONE | 失败事务检查与原始证据留存 | 已验收MySQL8.4、固定原Agent/LOCAL日志、PG/MySQL控制库的ADMIN完整事务审阅及持久证据：位置/历史列/镜像、授权分页、重启及日志GC后可读。自动证据目录管理、其他档案、跨Agent迁移与执行语义另行追踪。 |
| RC-03 | P0 / DONE | 目标应用阶段按完整事务跳过 | 协议7首批限定档案已验收：Java8、MySQL8.4双库源、原Agent/LOCAL日志、PostgreSQL业务目标、PG/MySQL控制库；完整跨库事务跳过、原生提交后源ACK失败、Agent强杀重开与跨入口确认均通过。其他目标/完整矩阵由RC-10/LG-01继续追踪。 |
| RC-04 | P0 / NEW | 采集/解码阶段的受控缺口恢复 | 目标跳过不能修复尚未形成完整事件的源读取或解析故障。 |
| RC-05 | P0 / DONE | 不确定提交与断点核对 | 协议6原Agent/LOCAL日志、PG/MySQL控制库限定档案已验收：全任务暂停、新证据、原生围栏、管理员跨入口确认、ACK/回执原子提交及幂等重试，保持原暂停。跳过、补偿和其他完整矩阵另行追踪。 |
| RC-06 | P0 / DONE | 失败事务前镜像补偿 | 首批 SQL 档案通过。管理员跨入口审阅表范围及增删数量，按原事务前镜像恢复目标，随后显式恢复并重放。真实 CDC 验证 PostgreSQL 补偿，MySQL 通过原生合同。其他目标由 RC-10 追踪。 |
| RC-07 | P0 / DONE | 界面手工补数据与修正 | 首批 SQL 档案通过。逐行录入和 JSON 导入支持管理员审阅前后值、精确行定位、原子批次和原事务恢复。PostgreSQL 通过真实 CDC，MySQL 通过原生检查。其他目标由 RC-10 跟踪。 |
| RC-08 | P0 / DONE | 一致性缺口台账与真实水位 | 首批SQL档案已验收：持久缺口、审阅计划、跨入口审批/取消、全表重扫、原子凭据及安全覆盖/连续应用水位。核验不改写SKIP、不推进原应用前缀、不自动恢复；其他目标协议由RC-10/LG-03/LG-04继续追踪。 |
| RC-09 | P0 / PARTIAL | 补偿作业的跨节点持久化和恢复 | 已支持跨节点计划、审批、证据与目标凭据。补偿和手工修正的跨节点取消与提交边界强杀恢复仍待验收。 |
| RC-10 | P1 / PARTIAL | 多目标恢复语义和回收保护 | SQL、分析库、消息队列一致性协议不同，不能复用一个伪事务实现。 |

## 源数据库兼容

| ID | 优先级/状态 | 需求 | 尚缺内容 |
|---|---|---|---|
| SO-01 | P0 / PARTIAL | 多源协议与能力配置 | 事件/位置SPI已有，真实源工厂与向导仍以MySQL为主。 |
| SO-02 | P1 / PARTIAL | MySQL 5.7 完整支持档案 | 有5.7.44基础链路记录，未覆盖当前平台全部必要对象、恢复和运行时组合。 |
| SO-03 | P1 / PARTIAL | MySQL 8.0 当前V3能力补验 | 有8.0.46历史V2/HA记录，不能直接作为当前V3全功能验收。 |
| SO-04 | P1 / NEW | MySQL 8.2 新增兼容与验收 | 未发现8.2专用完整真实验收记录，不能用8.0/8.4代替。 |
| SO-05 | P1 / PARTIAL | MySQL 8.4 扩展兼容与回归 | 8.4已有代表性V3/恢复证据，但不是所有日志特性、认证、拓扑和目标组合。 |
| SO-06 | P1 / NEW | PostgreSQL 源适配器 | 能力目录仅PLANNED，PG目标驱动不等于PG源。 |
| SO-07 | P1 / NEW | Oracle 源适配器 | 能力目录仅PLANNED，尚无原生全量/增量实现。 |

## Java运行时兼容

| ID | 优先级/状态 | 需求 | 尚缺内容 |
|---|---|---|---|
| JV-01 | P0 / PARTIAL | Java 8/11/17/21/25 可运行发布 | 主代码Java8兼容且有旧包10项SQL矩阵，当前全功能发布未覆盖。 |
| JV-02 | P1 / PARTIAL | 源/目标/恢复跨JDK矩阵 | 已有十项只覆盖单主键ASCII表和PG目标，不覆盖全部连接器。 |
| JV-03 | P1 / PARTIAL | 驱动隔离、依赖与安全协议兼容 | 已有厂商SDK隔离和完整包检查，缺全部JDK组合验证。 |
| JV-04 | P1 / NEW | 多JDK部署及混合版本升级 | 现有基准可选JRE，生产发布/集群升级策略未完整验收。 |

## 完整文档

| ID | 优先级/状态 | 需求 | 尚缺内容 |
|---|---|---|---|
| DO-01 | P0 / PARTIAL | 双语SDD基线与范围可追踪 | 本轮建立v0.1基线；详细模块设计、规格变更管理和实现证据闭环仍需完成。 |
| DO-02 | P1 / PARTIAL | 四类部署与多节点运维文档 | 现有Linux/Docker/Helm/原生K8s文件未覆盖新集群控制与会话模型。 |
| DO-03 | P1 / PARTIAL | 恢复场景和FAQ完整手册 | 现有校验/共同点修复FAQ不能覆盖新跳过、补数据与跨节点故障。 |
| DO-04 | P1 / PARTIAL | 配置/API/兼容性与升级文档 | 已有部分手册，缺新接口与统一源/目标/JDK档案索引。 |
| DO-05 | P1 / PARTIAL | 文档和证据发布门禁 | 已有验收归档/哈希及预览检查，缺覆盖所有需求的统一门禁。 |

## 历史范围合并保留

| ID | 优先级/状态 | 需求 | 尚缺内容 |
|---|---|---|---|
| LG-01 | P1 / PARTIAL | 国产事务库兼容矩阵 | openGauss/达梦/金仓/GBase8c为首批档案；分布式GaussDB、OceanBase完整恢复及GBase8a/8s等未完成。 |
| LG-02 | P1 / PARTIAL | 非空接管、约束恢复、切换回切 | 当前首用目标要求为空，修复成功也不是业务切换完成。 |
| LG-03 | P1 / PARTIAL | ClickHouse/Doris/Hive生产档案 | 首批物化/恢复已有证据，集群/TLS/权限/容量/全部JDK和新恢复语义未完成。 |
| LG-04 | P1 / PARTIAL | 全部消息目标的集群与恢复协议 | Kafka/Pulsar/RabbitMQ/RocketMQ/Classic/Artemis/Redis Streams/NATS JetStream已有首批传输，完整集群/TLS/容量仍缺。 |
| LG-05 | P0 / PARTIAL | 可选存储和跨节点数据可达性 | 已有本地/外部日志，但本地权威文件、报告、会话、控制元数据的迁移/HA边界不统一。 |
| LG-06 | P1 / PARTIAL | 真实K8s/CSI与节点故障验收 | Helm/原生清单通过静态检查，不能证明真实集群安全。 |
| LG-07 | P1 / PARTIAL | 海量对象、大事务和硬件性能标准 | 有小规模基准工具，超大事务分片、目录分页、有界缓存与容量标准未完整完成。 |
| LG-08 | P1 / PARTIAL | 历史DDL、类型、索引与状态迁移 | 已有白名单对象和UNIQUE/GSI转换；完整动态DDL、复杂类型及备份恢复档案仍缺。首版不支持旧开发候选兼容。 |
| LG-09 | P1 / PARTIAL | 报告目录、保留清理与真实浏览器验收 | 已有摘要/详情和DOM/HTTP，缺完整目录、scratch清理、视觉与可访问性证据。 |
| LG-10 | P2 / PARTIAL | 外部身份、不可变审计与Apache准备 | 本地账号及链式审计已有；OIDC/目录、外部审计锚点、许可证/NOTICE/SBOM/贡献流程仍缺。 |

## 现状证据索引

| ID | 本地证据/实现位置（不代表本项完成） |
|---|---|
| CP-01 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/TaskService.java) / [TaskWorker.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/TaskWorker.java) |
| CP-02 | P0 / PARTIAL | 全局任务、配置与操作权威状态 | 可选固定owner全局HTTP/界面、共享配置及历史已接入；旧任务升级导入、完整业务及规模验收仍未完成。 |
| CP-03 | P0 / PARTIAL | 跨节点持久命令路由 | 公开持久命令、离线STOP、真实多目标校验/修复及原UNKNOWN升级恢复已验收；完整取消/故障/迁移与容量矩阵仍未完成。 |
| CP-04 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [TaskService.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/TaskService.java) |
| CP-05 | P0 / PARTIAL | 共享权限、审计和密钥引用 | 共享账号/授权/链式审计及Worker环境过滤已实现；完整远端关联、最小密钥引用和进程/文件隔离仍缺。 |
| CP-06 | P1 / PARTIAL | 全局日志、指标与诊断界面 | 全局任务观察、owner/未知状态、分页及维护结果已有；完整节点/目标过滤、远端日志和诊断检索仍缺。 Worker进程存活与日志接管就绪仍需更清晰区分。 |
| CP-07 | [README.md](/docs/zh/evidence/baseline.html) / [OwnerRuntime.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/OwnerRuntime.java) |
| SE-01 | [app.js](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/resources/console/app.js) |
| SE-02 | [app.js](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/resources/console/app.js) / [account-management.md](/docs/zh/reference/account-management.html) |
| SE-03 | [app.js](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/resources/console/app.js) / [ConsoleServer.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/ConsoleServer.java) |
| SE-04 | [README.md](/docs/zh/evidence/baseline.html) / [browser-sessions.md](/docs/zh/reference/browser-sessions.html) |
| SE-05 | [app.js](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/resources/console/app.js) / [AccessControl.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AccessControl.java) |
| RC-01 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [FanoutDispatcher.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/FanoutDispatcher.java) |
| RC-02 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [managed-validation.md](/docs/zh/reference/managed-validation.html) |
| RC-03 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [JdbcSink.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcSink.java) |
| RC-04 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [reconciliation-workflow.md](/docs/zh/reference/reconciliation-workflow.html) |
| RC-05 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [FanoutDispatcher.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/FanoutDispatcher.java) / [README.md](/docs/zh/evidence/baseline.html) |
| RC-06 | [transaction-compensation.md](/docs/zh/reference/transaction-compensation.html) / [TransactionCompensation.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/TransactionCompensation.java) |
| RC-07 | [manual-correction.md](/docs/zh/reference/manual-correction.html) / [CorrectionBatch.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/CorrectionBatch.java) |
| RC-08 | [gap-verification.md](/docs/zh/reference/gap-verification.html) / [README.md](/docs/zh/evidence/baseline.html) |
| RC-09 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/TaskService.java) / [README.md](/docs/zh/evidence/baseline.html) |
| RC-10 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) / [messaging-v3.md](/docs/zh/reference/messaging-v3.html) |
| SO-01 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java) / [SourceAdapter.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/SourceAdapter.java) |
| SO-02 | [validation.md](/docs/zh/reference/validation.html) / [mysql57-run.sh](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/mysql57-run.sh) |
| SO-03 | [validation.md](/docs/zh/reference/validation.html) / [matrix.sh](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/matrix.sh) |
| SO-04 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java) / [matrix.sh](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/matrix.sh) |
| SO-05 | [validation.md](/docs/zh/reference/validation.html) / [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) |
| SO-06 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java) / [SourceAdapter.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/SourceAdapter.java) |
| SO-07 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java) |
| JV-01 | [performance.md](/docs/zh/reference/performance.html) / [baseline.json](/files/docs/verification/baseline.json) |
| JV-02 | [performance.md](/docs/zh/reference/performance.html) |
| JV-03 | [verify-artifact.py](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/verify-artifact.py) / [performance.md](/docs/zh/reference/performance.html) |
| JV-04 | [performance.md](/docs/zh/reference/performance.html) / [values.yaml](/files/deploy/helm/rivomesh/values.yaml) |
| DO-01 | [requirements-and-decisions.md](/docs/zh/reference/requirements-and-decisions.html) / [implementation-status.md](/docs/zh/reference/implementation-status.html) |
| DO-02 | [rivomesh](https://github.com/rivomesh/rivomesh/tree/5c545222c4175e8407196636725063861a69d4b2/deploy/helm/rivomesh) / [kubernetes](https://github.com/rivomesh/rivomesh/tree/5c545222c4175e8407196636725063861a69d4b2/deploy/kubernetes) / [console-and-deployment.md](/docs/zh/reference/console-and-deployment.html) |
| DO-03 | [managed-repair.md](/docs/zh/reference/managed-repair.html) / [recovery.md](/docs/zh/reference/recovery.html) |
| DO-04 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [validation.md](/docs/en/reference/validation.html) |
| DO-05 | [verify-artifact.py](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/verify-artifact.py) / [README.md](/docs/zh/evidence/baseline.html) |
| LG-01 | [implementation-status.md](/docs/zh/reference/implementation-status.html) / [gaussdb-index-policy.md](/docs/zh/reference/gaussdb-index-policy.html) |
| LG-02 | [platform-design.md](/docs/zh/reference/platform-design.html) / [gaussdb-index-policy.md](/docs/zh/reference/gaussdb-index-policy.html) |
| LG-03 | [clickhouse-v3.md](/docs/zh/reference/clickhouse-v3.html) / [doris-v3.md](/docs/zh/reference/doris-v3.html) / [hive-v3.md](/docs/zh/reference/hive-v3.html) |
| LG-04 | [messaging-v3.md](/docs/zh/reference/messaging-v3.html) / [classic-v3.md](/docs/zh/reference/classic-v3.html) |
| LG-05 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/sync-app/src/main/java/io/github/rivomesh/cdc/JdbcJournal.java) |
| LG-06 | [rivomesh](https://github.com/rivomesh/rivomesh/tree/5c545222c4175e8407196636725063861a69d4b2/deploy/helm/rivomesh) / [kubernetes](https://github.com/rivomesh/rivomesh/tree/5c545222c4175e8407196636725063861a69d4b2/deploy/kubernetes) |
| LG-07 | [performance.md](/docs/zh/reference/performance.html) / [benchmark.py](https://github.com/rivomesh/rivomesh/blob/5c545222c4175e8407196636725063861a69d4b2/tests/benchmark.py) |
| LG-08 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [rename-migration.md](/docs/zh/reference/rename-migration.html) |
| LG-09 | [README.md](/docs/zh/evidence/baseline.html) / [managed-validation.md](/docs/zh/reference/managed-validation.html) |
| LG-10 | [account-management.md](/docs/zh/reference/account-management.html) / [security-audit.md](/docs/zh/reference/security-audit.html) |
