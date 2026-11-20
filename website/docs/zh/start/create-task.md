---
kind: docs
locale: zh
title: 创建同步任务
---

# 创建第一条同步任务

本页以 **MySQL → PostgreSQL** 为例，通过 Web 向导创建任务。先使用少量测试数据和独立空目标，完成一次完整同步后再扩大范围。

## 1. 准备连接信息

向数据库管理员获取以下信息：

| 位置 | 需要填写的内容 |
| --- | --- |
| MySQL 来源 | 主机、端口、库名、账号、密码、复制客户端 serverId |
| PostgreSQL 目标 | 主机、端口、数据库、目标 schema、账号、密码 |
| 任务 | 容易辨认的任务名称、稳定的任务标识 |

`serverId` 用于区分复制客户端，应与其他客户端及数据库节点不同。请确认来源日志和读取权限满足要求，目标业务表为空，且仅由这条同步任务写入。

## 2. 打开新建任务

登录控制台，在任务工作台点击“新建任务”，保留默认任务格式（支持多库、多目标）。任务标识创建后应保持稳定，便于查找配置、进度和恢复记录。

<ScreenshotPreview name="task-wizard" locale="zh" alt="RivoMesh 中文控制台中的新建同步任务向导。" />

## 3. 填写来源和目标

1. 填写 MySQL 来源。多库同步时显式列出需要同步的 database。
2. 添加 PostgreSQL 目标，填写连接信息。
3. 为每个来源库指定目标 schema/database。检查映射，避免写入错误的业务位置。
4. 首次使用只添加一个目标。需要分发到多个系统时，再按各目标的[连接说明](connectors)逐个增加。

## 4. 选择日志并保存

单机试用可以使用本地日志，确保磁盘空间充足并保留数据目录。需要跨主机续传时，由部署人员按[详细配置参考](../reference/pipeline-v3)设置外部事务日志。

保存后任务保持停止，不会立即开始写入目标。

## 5. 检查后再启动

先执行“检查连接与对象”，核对结果，再点击启动。连接检查不包含全部运行时权限和建表条件，启动后仍需观察错误提示。

首次运行先同步已有数据，然后持续同步后续新增、修改和删除。全量尚未结束时，目标数据可能还不完整，不宜据此判断最终同步结果。

## 6. 完成一次小规模验收

在来源测试表新增一条记录，修改其中一个字段，再删除该记录，分别检查目标实际值。然后查看[运行状态与日常操作](monitoring)，验证暂停、故障恢复和重启后的行为。

任务创建失败时，保留错误摘要，按[常见故障处理](troubleshooting)排查。不要通过修改断点或清空日志绕过失败。

快照与增量如何衔接、重启时使用哪个位置，见 [MySQL 采集原理](replication#mysql)。各节点与日志的职责见[架构图](architecture)。

## 使用其他采集源

- **PostgreSQL 17/18**。选择 V3 格式和 PostgreSQL 源。配置一个源库、发布表、源 schema、复制槽前缀和 `REPLICA IDENTITY FULL`，目标选 MySQL 或 PostgreSQL。确认 `wal_level=logical`、槽容量和 WAL 保留，再在所属 Agent 上完成检查。见[逻辑复制配置](../reference/postgresql-source)。
- **Oracle 26ai Free**。选择 V3 格式和 Oracle 源。分别填 CDB 根与可写 PDB 的服务名、PDB 名称以及大写的 `OWNER.TABLE`，将各 owner 映射到 PostgreSQL schema。部署时向运行 Worker 的服务提供 Oracle JDBC 驱动；启动前验证 Flashback 权限、全列补充日志和归档窗口。见[归档采集配置](../reference/oracle-source)。

进一步了解 [PostgreSQL 的槽、WAL 与 LSN](replication#postgresql)及 [Oracle 的快照、归档与 SCN](replication#oracle)。

## 评估已填充的 PostgreSQL 目标

如果 MySQL 历史数据已通过其他工具复制到 PostgreSQL，从 [`preview-adoption`](../reference/nonempty-target-preview) 开始。预览只读取映射表，报告相同、缺失、多余和内容变更的行数。预览期间建立共同读取视图会短暂限制 MySQL 写入，请安排窗口。

已比较的数据相同后，可为限定的 MySQL 8.4 到 PostgreSQL 17 单表档案运行 `plan-adoption` 并核对摘要。正式接管时保持源端写入冻结，停止应用和 Worker，审批计划并确认原请求的持久回执。接管后的任务处于暂停状态；应用写入权切换需要另行审批。
