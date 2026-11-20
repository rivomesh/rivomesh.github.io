---
kind: docs
locale: zh
title: "当前实施状态"
sourcePath: docs/zh-CN/implementation-status.md
---

# 当前实施状态

首版尚未发布。Java/Maven命名空间为`io.github.rivomesh`。[English](/docs/en/reference/implementation-status.html)。

验收归档记录每项通过的数据库、版本及部署范围。[验收归档](/docs/zh/evidence/baseline.html)

## 已验收

| 范围 | 当前结果 |
|---|---|
| DO-03 | 中英文故障手册覆盖提升、日志/存储、节点、会话及人工恢复。 |
| CP-01～03 | 全局节点目录、共享任务配置及按原请求执行的跨入口命令。 |
| CP-05～06 | 跨入口撤权、审计关联、按任务分配凭据和脱敏限流诊断。 |
| SE-01～05 | 刷新登录、期限/撤销、安全Cookie/CSRF、跨入口会话、API身份规则 |
| CP-07 | 控制/执行分离；限定档案下管理故障不影响原Worker安全同步 |
| RC-02 | 持久事务证据、管理员分页审阅、历史结构及镜像 |
| RC-05 | 目标已提交但ACK丢失时核对原生凭据并恢复确认 |
| RC-03 | 完整跨库事务跳过；原生提交后ACK失败、原Agent强杀重开、跨入口恢复；保持暂停并显示缺口 |
| RC-08 | 持久缺口、审阅核验、跨入口确认/取消及真实增量水位；限定SQL档案 |
| RC-06 | 前镜像补偿还原受影响行，跨入口审批并保持暂停。限定 SQL 档案 |
| RC-07 | 手工录入、JSON 导入、前后值预览与跨入口审批。限定 SQL 档案 |
| RC-01 | MySQL 源连接、解码、DDL、日志及目标应用阶段诊断，跨入口和重启验证 |
| RC-09 | 补偿与修正跨入口取消、提交前后强杀恢复，并按原请求核对凭据 |
| JV-01 | Controller、Agent 和 Worker 当前统一使用 Temurin 21。 |
| LG-07 | 硬件容量矩阵、256 个数据库映射、大事务和共享日志背压续传已实测。 |
| SO-02 | MySQL 5.7.44 在 Temurin 21 已通过单机、异步 GTID 主备、三节点单主组复制，以及主从 SQL 线程错误、binlog 缺失拒绝。 |
| SO-03 | MySQL 8.0.46 在 Temurin 21 已通过单机、异步 GTID 主备及三节点单主组复制。另有跨入口人工恢复档案。 |
| SO-05 | MySQL 8.4.13 的 V3 三种拓扑、日志准入和会话级不支持事件的处理 |
| SO-04 | MySQL 8.2.0 在 Temurin 21 已通过单机、异步 GTID 主备及三节点单主组复制。 |

[单一验证基线](/docs/zh/evidence/baseline.html)保存验收范围和可追溯摘要，不再维护开发迭代的逐次副本。清理后的最新回归与旧验收记录分开标记。

## 已有能力及边界

| 能力 | 当前状态 |
|---|---|
| 同步链路 | MySQL 多库映射、同源多目标、自动建表、分块快照、持久断点、无主键行、JSON 和受支持生成列。MySQL 5.7.44、8.0.46、8.2.0、8.4.13 均通过 Temurin 21 异步 GTID 提升及三节点单主组复制。四个组复制档案都在停主后自动选主并让两个 SQL 目标追平。 |
| PostgreSQL 源 | 已实测 17.12 逻辑槽切换续传及 18.7 存储型生成列。17.12 的 REAL、DOUBLE PRECISION 和 BYTEA 可续传至 PostgreSQL 和 MySQL。BYTEA 兼容源库 hex 与 escape 设置，核对无主键重数和外置值。 [配置与恢复](/docs/zh/reference/postgresql-source.html) |
| Oracle 源 | Oracle Free 26ai 单 PDB 的 Flashback 和归档 LogMiner 已通过。两路 PostgreSQL 保留原 SCN，支持保存点回滚及强制重启。严格文本 JSON 和限定 AL32UTF8、AL16UTF16 字符类型已验收。预检拦截缺少重做镜像的原生 JSON。 [源库手册](/docs/zh/reference/oracle-source.html) |
| 采集故障恢复 | 检查原断点及受影响目标，核对 MySQL GTID 边界和原始日志，限定档案支持审批后排除一个已核验事务。 [操作说明](/docs/zh/reference/capture-recovery.html) |
| 管理 | 中英文向导、共享修订、独立 Worker 和跨入口控制。MySQL 与 PostgreSQL 源已验证按 JVM、组件和外部 PostgreSQL 日志连通性自动选择 Agent。真实 Chrome 已验证登录保持、报告和回执检索、审批后恢复报告。Keycloak 26.7.4 已通过 HTTPS 授权码、S256 PKCE 和跨入口撤权。 [全局控制](/docs/zh/reference/global-control.html) · [OIDC](/docs/zh/reference/oidc-login.html) |
| 日志 ACK 中断 | 共享 PostgreSQL 日志下，已实测 MySQL 或 PostgreSQL 目标先提交。原 Agent 重连并显式启动后只补缺失 ACK。已冻结写入并封存完整结案回执的同库档案通过离线接管，候选启动保持两目标原切点。 [操作手册](/docs/zh/reference/global-control.html#控制网络非对称分区) |
| 对账修复 | 共同校验点、行差异、管理员修复计划；限定MySQL/PostgreSQL档案 |
| 缺口核验 | 审阅计划、管理员确认、重新扫描、原子凭据和跨入口取消；限定PG/MySQL，验收进度见[手册](/docs/zh/reference/gap-verification.html) |
| 事务补偿 | PostgreSQL 和 MySQL 的管理员预览、确认、目标原子凭据和原事务重放。见[操作说明](/docs/zh/reference/transaction-compensation.html) |
| 关系目标 | MySQL、PostgreSQL、openGauss 有实库档案。达梦、金仓、GBase8c、OceanBase MySQL 模式通过限定事务和联合中断恢复。分布式 GaussDB 和其他厂商模式待验收。 |
| 分析目标 | ClickHouse、Doris、Hive 已有物化和恢复档案。ClickHouse 25.8.33.6 在 Temurin 21 已验证旧非空数据卷回退时保护较新断点。生产集群、TLS 和容量需单独验收。 |
| 消息目标 | 八种 Broker 已有确认式至少一次投递档案。实库包含 Kafka 签名回执查询、ActiveMQ Classic 和 Artemis 共享存储主备、NATS TLS 和多数派、RabbitMQ 多数派及 Redis Streams 外部提升。 RocketMQ 5.5.0 的可选发布器以三个数据副本、至少两个同步副本完成主备实测。 [消息目标](/docs/zh/reference/messaging-v3.html) |
| 部署 | Linux、Docker、Helm、原生 Kubernetes。双节点实测 RWO 重挂、配置更新、Secret 轮换、外部日志和旧 Worker 写入隔离。Helm 和原生 YAML 均通过应用镜像替换及跨节点挂载原 CSI 卷后的自动续传。 |
| Java | Eclipse Temurin 21 LTS 是唯一支持的构建与运行时。连接器、部署和安全协议使用实际 Java 21 候选包验收。 |

具体产品约束以[平台方案](/docs/zh/reference/platform-design.html)、[控制台](/docs/zh/reference/console-and-deployment.html)和各产品手册为准。协议和数据格式编号是内部状态标识，不是对开发版本升级的承诺。

## 当前清理

首版手册记录当前发布包和状态格式。恢复前核对协调备份中的 Controller、日志和目标身份。验收完成后清理临时环境和重复构建产物。[首版运行手册](/docs/zh/reference/first-release.html)

## 剩余验收

| 范围 | 完成条件 |
|---|---|
| CP-04、LG-05 | 原 Agent 未冻结便掉线时验证停驻与恢复。原盘永久丢失的接管依赖事先独立保管目录身份、已办结回执、故障档案和审计。独立控制库和日志库还需实测持久围栏与重复提交。 |
| RC-10、LG-04 | 用真实源和 Broker 验证消息发送记录，完成分目标缺口通知及故障恢复。各队列记录原生回执与消费者去重的适用范围。 |
| SO-06、SO-07、LG-08 | 完成审批式 DDL 与共同水位验证，扩展 Oracle LOB/RAC、复杂类型与协调备份恢复。 |
| JV-02、JV-03、LG-01、LG-03 | 按 Temurin 21 逐一验证目标驱动、TLS、集群和恢复档案。商业分布式 GaussDB 需要实际多 CN/DN，生产分析库需要各自的集群环境。 |
| LG-10 | 核验实际外部身份入口、撤销与审计留存，并取得权属、LICENSE 及 NOTICE 审核结果。 |
