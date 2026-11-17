---
kind: docs
locale: zh
title: "需求规格"
sourcePath: docs/sdd/001-control-recovery-compatibility/spec.md
---

# Rivomesh SDD需求基线与未完成事项

RM-SDD-001 · v0.5 · 2026-11-17 · IMPLEMENTING

实施中：48项持续追踪，6项DONE，42项未完成（9项NEW、33项PARTIAL）。共享会话SE-04已验收；CP-05部分完成，全局任务与远端执行仍未完成。见[共享访问证据](/docs/zh/evidence/2026-11-16-shared-access.html)。

[基线和决策](/docs/zh/sdd/plan.html) · [任务](/docs/zh/sdd/tasks.html) · [验收矩阵](/docs/zh/sdd/acceptance.html) · [English](/docs/en/sdd/spec.html)

## 多节点统一控制

| ID | 优先级/状态 | 需求 | 尚缺内容 |
|---|---|---|---|
| CP-01 | P0 / DONE | 统一节点注册与状态 | 共享节点目录已通过PostgreSQL/MySQL双节点、kill/重开及控制库中断验收；任务权威/远端命令仍属CP-02/03。 |
| CP-02 | P0 / PARTIAL | 全局任务、配置与操作权威状态 | 全局配置权威、授权分页、任务观察和内部跨入口控制已验收；公开运行时/界面、升级导入及完整配置工作流仍待接入。 |
| CP-03 | P0 / PARTIAL | 跨节点持久命令路由 | 持久命令、固定owner实际TaskService执行、回执恢复和取消已有原生SQL验收；公开跨节点HTTP、启动恢复及完整业务链路仍待验收。 |
| CP-04 | P0 / PARTIAL | 故障接管、隔离与资源调度 | 已有Worker租约/epoch，缺少统一节点调度、远端生命周期和滚动升级协议。 |
| CP-05 | P0 / PARTIAL | 共享权限、审计和密钥引用 | 共享账号/授权/链式审计及Worker环境过滤已实现；完整远端关联、最小密钥引用和进程/文件隔离仍缺。 |
| CP-06 | P1 / PARTIAL | 全局日志、指标与诊断界面 | 已有本机任务界面、积压和错误展示，未聚合远端状态。 |
| CP-07 | P0 / NEW | 控制面HA及控制/数据面解耦 | 单控制目录文件锁不等于HA，控制器关闭还会停止其子进程。 |

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
| RC-01 | P0 / PARTIAL | 按采集阶段区分故障 | 现有错误隔离/恢复已实现，但没有完整的跳过与补偿诊断入口。 |
| RC-02 | P0 / PARTIAL | 失败事务检查与原始证据留存 | 已有日志及历史校验行详情，但没有失败队列的完整事务审阅工作流。 |
| RC-03 | P0 / NEW | 目标应用阶段按完整事务跳过 | 当前恢复只会重试原事务，没有人工跳过实现。 |
| RC-04 | P0 / NEW | 采集/解码阶段的受控缺口恢复 | 目标跳过不能修复尚未形成完整事件的源读取或解析故障。 |
| RC-05 | P0 / PARTIAL | 不确定提交与断点核对 | 自动应用已能识别提交领先ACK，人工跳过/补偿尚未复用此保护。 |
| RC-06 | P0 / NEW | 失败事务前镜像补偿 | 已有共同校验点修复，尚不能让落后的失败目标回到原事务可重放状态。 |
| RC-07 | P0 / PARTIAL | 界面手工补数据与修正 | 已有报告驱动修复，不支持独立的失败事务数据补充或用户补丁。 |
| RC-08 | P0 / NEW | 一致性缺口台账与真实水位 | 现有断点没有已应用与主动跳过的持久区别和缺口生命周期。 |
| RC-09 | P0 / PARTIAL | 补偿作业的跨节点持久化和恢复 | 共同点修复已有本地持久操作与凭据，跨节点及新模式还缺实现。 |
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
| DO-01 | P0 / PARTIAL | 双语SDD基线与范围可追踪 | 本轮建立v0.5基线；详细模块设计、规格变更管理和实现证据闭环仍需完成。 |
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
| LG-08 | P1 / PARTIAL | 历史DDL、类型、索引与状态迁移 | 已有白名单对象、UNIQUE/GSI转换和v2兼容；完整动态DDL、复杂类型及显式迁移/回退仍缺。 |
| LG-09 | P1 / PARTIAL | 报告目录、保留清理与真实浏览器验收 | 已有摘要/详情和DOM/HTTP，缺完整目录、scratch清理、视觉与可访问性证据。 |
| LG-10 | P2 / PARTIAL | 外部身份、不可变审计与Apache准备 | 本地账号及链式审计已有；OIDC/目录、外部审计锚点、许可证/NOTICE/SBOM/贡献流程仍缺。 |

## 现状证据索引

| ID | 本地证据/实现位置（不代表本项完成） |
|---|---|
| CP-01 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) / [TaskWorker.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskWorker.java) |
| CP-02 | P0 / PARTIAL | 全局任务、配置与操作权威状态 | 全局配置权威、授权分页、任务观察和内部跨入口控制已验收；公开运行时/界面、升级导入及完整配置工作流仍待接入。 |
| CP-03 | P0 / PARTIAL | 跨节点持久命令路由 | 持久命令、固定owner实际TaskService执行、回执恢复和取消已有原生SQL验收；公开跨节点HTTP、启动恢复及完整业务链路仍待验收。 |
| CP-04 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) |
| CP-05 | P0 / PARTIAL | 共享权限、审计和密钥引用 | 共享账号/授权/链式审计及Worker环境过滤已实现；完整远端关联、最小密钥引用和进程/文件隔离仍缺。 |
| CP-06 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) / [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) |
| CP-07 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) / [TaskWorker.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskWorker.java) |
| SE-01 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) |
| SE-02 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) / [account-management.md](/docs/zh/reference/account-management.html) |
| SE-03 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) / [ConsoleServer.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/ConsoleServer.java) |
| SE-04 | P0 / DONE | 跨控制节点的会话连续性 | 已通过PostgreSQL/MySQL共享会话双节点、HTTPS、撤销、kill/重开及存储中断恢复验收；全局任务控制仍属CP-02/03。 |
| SE-05 | [app.js](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/resources/console/app.js) / [AccessControl.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AccessControl.java) |
| RC-01 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [FanoutDispatcher.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/FanoutDispatcher.java) |
| RC-02 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [managed-validation.md](/docs/zh/reference/managed-validation.html) |
| RC-03 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [JdbcSink.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcSink.java) |
| RC-04 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [reconciliation-workflow.md](/docs/zh/reference/reconciliation-workflow.html) |
| RC-05 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [FanoutDispatcher.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/FanoutDispatcher.java) / [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) |
| RC-06 | [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) / [common-cut-repair.md](/docs/zh/reference/common-cut-repair.html) |
| RC-07 | [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) / [RepairRequest.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/RepairRequest.java) |
| RC-08 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [reconciliation-workflow.md](/docs/zh/reference/reconciliation-workflow.html) |
| RC-09 | [TaskService.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/TaskService.java) / [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) |
| RC-10 | [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) / [messaging-v3.md](/docs/zh/reference/messaging-v3.html) |
| SO-01 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java) / [SourceAdapter.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/SourceAdapter.java) |
| SO-02 | [validation.md](/docs/zh/reference/validation.html) / [mysql57-run.sh](https://github.com/rivomesh/rivomesh/blob/main/tests/mysql57-run.sh) |
| SO-03 | [validation.md](/docs/zh/reference/validation.html) / [matrix.sh](https://github.com/rivomesh/rivomesh/blob/main/tests/matrix.sh) |
| SO-04 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java) / [matrix.sh](https://github.com/rivomesh/rivomesh/blob/main/tests/matrix.sh) |
| SO-05 | [validation.md](/docs/zh/reference/validation.html) / [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) |
| SO-06 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java) / [SourceAdapter.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/SourceAdapter.java) |
| SO-07 | [AdapterCatalog.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java) |
| JV-01 | [performance.md](/docs/zh/reference/performance.html) / [matrix.json](/files/docs/benchmarks/2026-11-15-runtime/matrix.json) |
| JV-02 | [performance.md](/docs/zh/reference/performance.html) |
| JV-03 | [verify-artifact.py](https://github.com/rivomesh/rivomesh/blob/main/tests/verify-artifact.py) / [performance.md](/docs/zh/reference/performance.html) |
| JV-04 | [performance.md](/docs/zh/reference/performance.html) / [values.yaml](/files/deploy/helm/rivomesh/values.yaml) |
| DO-01 | [requirements-and-decisions.md](/docs/zh/reference/requirements-and-decisions.html) / [implementation-status.md](/docs/zh/reference/implementation-status.html) |
| DO-02 | [rivomesh](https://github.com/rivomesh/rivomesh/tree/main/deploy/helm/rivomesh) / [kubernetes](https://github.com/rivomesh/rivomesh/tree/main/deploy/kubernetes) / [console-and-deployment.md](/docs/zh/reference/console-and-deployment.html) |
| DO-03 | [managed-repair.md](/docs/zh/reference/managed-repair.html) / [recovery.md](/docs/zh/reference/recovery.html) |
| DO-04 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [validation.md](/docs/en/reference/validation.html) |
| DO-05 | [verify-artifact.py](https://github.com/rivomesh/rivomesh/blob/main/tests/verify-artifact.py) / [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) |
| LG-01 | [implementation-status.md](/docs/zh/reference/implementation-status.html) / [gaussdb-index-policy.md](/docs/zh/reference/gaussdb-index-policy.html) |
| LG-02 | [platform-design.md](/docs/zh/reference/platform-design.html) / [gaussdb-index-policy.md](/docs/zh/reference/gaussdb-index-policy.html) |
| LG-03 | [clickhouse-v3.md](/docs/zh/reference/clickhouse-v3.html) / [doris-v3.md](/docs/zh/reference/doris-v3.html) / [hive-v3.md](/docs/zh/reference/hive-v3.html) |
| LG-04 | [messaging-v3.md](/docs/zh/reference/messaging-v3.html) / [classic-v3.md](/docs/zh/reference/classic-v3.html) |
| LG-05 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [JdbcJournal.java](https://github.com/rivomesh/rivomesh/blob/main/sync-app/src/main/java/io/rivomesh/cdc/JdbcJournal.java) |
| LG-06 | [rivomesh](https://github.com/rivomesh/rivomesh/tree/main/deploy/helm/rivomesh) / [kubernetes](https://github.com/rivomesh/rivomesh/tree/main/deploy/kubernetes) |
| LG-07 | [performance.md](/docs/zh/reference/performance.html) / [benchmark.py](https://github.com/rivomesh/rivomesh/blob/main/tests/benchmark.py) |
| LG-08 | [pipeline-v3.md](/docs/zh/reference/pipeline-v3.html) / [rename-migration.md](/docs/zh/reference/rename-migration.html) |
| LG-09 | [README.md](/docs/zh/evidence/2026-11-16-managed-repair.html) / [managed-validation.md](/docs/zh/reference/managed-validation.html) |
| LG-10 | [account-management.md](/docs/zh/reference/account-management.html) / [security-audit.md](/docs/zh/reference/security-audit.html) |

v0.5: CP-02/03 PARTIAL · [Internal foundations evidence](/docs/zh/evidence/2026-11-17-global-control-foundations.html). Public runtime integration remains open.
