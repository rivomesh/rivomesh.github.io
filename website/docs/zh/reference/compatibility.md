---
kind: docs
locale: zh
title: "连接器、运行时与 API 兼容矩阵"
sourcePath: docs/zh-CN/compatibility.md
---

# 连接器、Java 与 API 兼容档案

[English](/docs/en/reference/compatibility.html)

先选源版本和拓扑，再选目标产品与模式、Java 运行时。每行记录已实测范围或待验收事项。上线验收前，到[验证基线](/docs/zh/evidence/baseline.html)和[机器可读记录](/files/docs/verification/baseline.json)核对对应包的 SHA-256。

## 源版本和坐标

| 配置 | 实库范围 | 配置与恢复 |
|---|---|---|
| `MYSQL` 5.7.44 | Temurin 21 单机及三节点单主组复制到 MySQL 与 PostgreSQL。异步 GTID 升主及缺失日志拒绝通过 PostgreSQL 目标验收。 | [同步配置](/docs/zh/reference/pipeline-v3.html)、[日志缺失恢复](/docs/zh/reference/capture-recovery.html) |
| `MYSQL` 8.0.46 | Temurin 21 单机及三节点单主组复制到两个 SQL 目标。异步 GTID 升主通过 PostgreSQL 目标验收。 | [同步配置](/docs/zh/reference/pipeline-v3.html)、[恢复手册](/docs/zh/reference/reconciliation-workflow.html) |
| `MYSQL` 8.2.0 | Temurin 21 单机及三节点单主组复制到两个 SQL 目标。异步 GTID 升主通过 PostgreSQL 目标验收。 | [版本专项命令](/docs/zh/reference/pipeline-v3.html) |
| `MYSQL` 8.4.13 | Temurin 21 单机、异步 GTID 升主及三节点单主组复制到两个 SQL 目标。binlog 准入及组复制旧主只读返回另有实库验证。 | [8.4 binlog 档案](/docs/zh/reference/pipeline-v3.html) |
| `POSTGRESQL` 17.12 | Temurin 21 实验档案。同步槽切主后自动续传，误指回旧时间线时拒绝，共同点对账待验收。 | [源指南](/docs/zh/reference/postgresql-source.html)、[任务样例](/files/config/postgresql-source-v3.yml) |
| `POSTGRESQL` 18.7 | Temurin 21 实验档案。发布存储型生成列，PostgreSQL 17.12 目标物化为普通列。 | [源指南与发布](/docs/zh/reference/postgresql-source.html) |
| `ORACLE` 26ai Free 23.26.4.0.0 | Temurin 21，需单独提供 Oracle JDBC 驱动。单 PDB Flashback 与单线程归档增量到 PostgreSQL 已通过。RAC 和源切主待验收。 | [预检权限与恢复](/docs/zh/reference/oracle-source.html)、[V3 样例](/files/config/oracle-source-v3.yml) |

MySQL 坐标使用逻辑源集群 ID 与无标签 GTID 集合。PostgreSQL 坐标使用逻辑源 ID、system ID、timeline、slot 和 LSN。Oracle 预检使用 DBID、resetlogs SCN、PDB GUID 和 SCN。`SourcePosition.formatVersion` 当前为 1，由 `sourceType` 对应的适配器解释。在同一来源身份和协议内比较坐标。[多库样例](/files/config/pipeline-v3.yml)使用 `formatVersion: 3`、`source.clusterId`、`databases` 以及每个目标的显式 `mappings`。独立 MySQL 集群分别使用独立配置。

## 目标产品和一致性

| 目标标识 | 范围与投递语义 | 手册 |
|---|---|---|
| `MYSQL`、`POSTGRESQL` | MySQL 8.4 和 PostgreSQL 17.12 事务档案已实测。业务写入和目标断点在同一事务提交。 | [关系型目标](/docs/zh/reference/pipeline-v3.html) |
| `GAUSS` | openGauss 7.0.0-RC3 事务档案已实测。商用分布式 GaussDB 的约束、GSI 和部署验收待完成。 | [高斯索引策略与接管](/docs/zh/reference/gaussdb-index-policy.html) |
| `DM`、`KINGBASE`、`GBASE_8C` | 首批历史事务档案使用 Java 8。确切版本、模式、驱动、类型转换和恢复范围见各产品手册。 | [达梦](/docs/zh/reference/dm-v3.html)、[金仓](/docs/zh/reference/kingbase-v3.html)、[GBase 8c](/docs/zh/reference/gbase8c-v3.html) |
| `GBASE_8A`、`GBASE_8S` | 独立产品，规划中。 | [实施状态](/docs/zh/reference/implementation-status.html) |
| `OCEANBASE` | CE 4.3.5.6 MySQL 租户的早期 Java 8 档案涵盖原生事务、全量、增量、重启和 SQL 恢复。Oracle 模式和集群待完成。 | [OceanBase](/docs/zh/reference/oceanbase-v3.html) |
| `CLICKHOUSE`、`DORIS`、`HIVE` | 首批实库分析档案，采用版本化物化与回执。数据可见性和重放规则按引擎区分。 | [ClickHouse](/docs/zh/reference/clickhouse-v3.html)、[Doris](/docs/zh/reference/doris-v3.html)、[Hive](/docs/zh/reference/hive-v3.html) |
| `KAFKA`、`PULSAR`、`RABBITMQ`、`ROCKETMQ`、`ACTIVEMQ_CLASSIC`、`ACTIVEMQ_ARTEMIS`、`REDIS_STREAMS`、`NATS_JETSTREAM` | 限定 broker 档案，确认式至少一次投递。消费端按稳定事件 ID 去重，独立记录业务消费进度。 | [消息目标](/docs/zh/reference/messaging-v3.html)、[ActiveMQ Classic](/docs/zh/reference/classic-v3.html) |

V3 向导读取 `GET /api/capabilities` 判断源类型可用性，并按源引擎限制目标产品。PostgreSQL 和 Oracle 使用各自的版本、源身份、命名空间和凭据表单。部署前按目标手册核对拓扑、权限、保留与备份边界。

## 首版 Java 运行时

**构建、运行和验收仅支持 Eclipse Temurin 21 LTS。** 发布包使用 Java 21 字节码。Linux、Docker 和 Kubernetes 的 Controller、Agent 和 Worker 都使用 Temurin 21。实库档案记录实际 JVM 版本、架构和包 SHA。新增源、目标、日志和恢复组合按对应的 Temurin 21 用例验收。[复现命令](/docs/zh/reference/performance.html)

上述源和目标档案仍对应各自的候选包与实测环境。早期运行时实验和 `fiveJdkProcesses`、`postgresqlSourceRuntimeMatrix`、`postgresqlStoredGenerated` 等档案保留原制品摘要和复现命令。[验收清单](/files/docs/verification/baseline.json) · [固定历史快照](https://github.com/rivomesh/rivomesh/blob/419945c98f197bd6cc1c6cc3e75e9c6a4bb3188c/docs/verification/baseline.json)

## 管理端请求

CLI 通过 Bearer 凭据访问，浏览器使用 HttpOnly 会话。浏览器写操作提供匹配的 Origin 与 `X-CSRF-Token`。VIEWER 按授权读取状态，OPERATOR 在授权范围内发出常规命令，ADMIN 配置任务、审阅敏感证据和批准恢复。[浏览器会话](/docs/zh/reference/browser-sessions.html) · [任务授权](/docs/zh/reference/task-authorization.html)

| 接口 | 请求与结果 |
|---|---|
| `/api/session`、`/api/session/logout`、`/api/nodes`、`/api/tasks` | 查询身份权限、节点和归属、分页任务。全局模式创建任务包含 `ownerNodeId`。[控制台接口](/docs/zh/reference/console-and-deployment.html) |
| `/api/tasks/{id}/configuration`、`/api/tasks/{id}/actions` | 变更绑定当前 `expectedRevision` 和原始 `X-Request-ID`。本地创建返回 201，本地更新配置返回 200，全局变更与操作受理返回 202。随后读取持久化回执。[配置编辑](/docs/zh/reference/configuration-editor.html) · [操作生命周期](/docs/zh/reference/execution-lifecycle.html) |
| `/api/tasks/{id}/capture-recovery`、`/api/tasks/{id}/capture-exclusions`、`/api/tasks/{id}/failure-evidence` | 读取保留的采集故障代次和经授权的目标证据。[源审阅](/docs/zh/reference/capture-recovery.html) · [事务证据](/docs/zh/reference/failure-review.html) |
| `/api/tasks/{id}/recovery-plans`、`/api/tasks/{id}/gaps`、`/api/tasks/{id}/gap-verifications`、`/api/tasks/{id}/corrections`、`/api/tasks/{id}/validations` | 先检查证据和不可变计划引用，再提交对应操作和代次。[跳过](/docs/zh/reference/transaction-skip.html) · [缺口核验](/docs/zh/reference/gap-verification.html) · [手工补录](/docs/zh/reference/manual-correction.html) · [对账修复](/docs/zh/reference/managed-repair.html) |
| `/api/accounts`、`/api/audit` | ADMIN 账号目录与经授权的审计查询。[账号](/docs/zh/reference/account-management.html) · [审计](/docs/zh/reference/security-audit.html) |

停止示例：

```sh
curl --fail-with-body -X POST "$RIVOMESH_ORIGIN/api/tasks/orders/actions" \
  -H "Authorization: Bearer $RIVOMESH_TOKEN" \
  -H "X-Request-ID: orders-stop-001" -H 'Content-Type: application/json' \
  -d '{"action":"STOP","expectedRevision":"replace-with-current-revision"}'
```

从 `GET /api/tasks/orders` 获取版本。使用同一个请求 ID 和相同内容重试未确认的动作，并查询其回执。计划 ID、哈希、报告 ID、命令回执和管道或订阅故障代次都绑定于已审阅的源、目标及配置。[恢复手册](/docs/zh/reference/reconciliation-workflow.html)包含请求示例和完成判据。

400 表示输入无效，401 表示身份缺失或无效，403 表示权限或浏览器请求校验失败，404 表示任务不存在或不可访问。409 时按返回的冲突码重新核对版本或故障代次。503 表示共享权威或审计存储不可用。重试同一操作和相同请求内容时使用原请求 ID。[全局控制](/docs/zh/reference/global-control.html)

## 升级和切换

更换 JDK、驱动或部署配置前，记录包哈希、实测档案、活动配置版本和最近确认的断点。恢复或变更拓扑前停止相关操作，检查目标回执、日志保留和每处持久化存储。参见[首版基线](/docs/zh/reference/first-release.html)、[部署指南](/docs/zh/reference/console-and-deployment.html)和[切换手册](/docs/zh/reference/reconciliation-workflow.html)。新增或修改字段后，同步更新中英文档和对应配置或 API 样例。
