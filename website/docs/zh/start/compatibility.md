---
kind: docs
locale: zh
title: 兼容性与能力边界
---

# 兼容性与能力边界

按**源库版本与拓扑、目标产品与模式、Java 运行时**选择档案。通过[连接器目录](connectors)筛选连接方向和状态，部署前查阅对应手册与[详细兼容矩阵](../reference/compatibility)。

## 采集源与运行时

| 采集源 | 可用范围 | 部署前核对 |
| --- | --- | --- |
| MySQL 5.7.44、8.0.46、8.2.0、8.4.13 | 以上版本在 Temurin 21 均有单机、异步 GTID 提升与三成员单主 Group Replication 实测。不同拓扑的目标组合按矩阵记录。 | InnoDB、GTID、ROW/FULL 行镜像、复制和快照权限、binlog 保留；参见[同步配置](../reference/pipeline-v3)。 |
| PostgreSQL 17.12 / 18.7 | 实验性 `pgoutput` 逻辑复制，目标可选 PostgreSQL 或 MySQL。17.12 有同步槽提升实测，18.7 有存储生成列物化实测。 | 单任务单源库，明确发布表并配置 `REPLICA IDENTITY FULL`、复制槽、WAL 保留和类型范围；参见[源端配置](../reference/postgresql-source)。 |
| Oracle 26ai Free 23.26.4.0.0 | 实验性 Flashback 快照与单 PDB、单归档线程 LogMiner CDC，目标为 PostgreSQL。 | 单独提供 Oracle JDBC 驱动，检查 CDB/PDB 服务、补充日志、权限、归档窗口和类型；参见[源端配置](../reference/oracle-source)。 |

Eclipse Temurin 21 LTS 是当前候选版唯一支持的构建和运行环境，适用于 Controller、Agent 和 Worker。历史驱动或目标档案使用各自记录的运行时。请按[兼容矩阵](../reference/compatibility)核对所选目标、驱动和候选产物。

## 目标与操作范围

- **关系数据库**。各目标独立确认；MySQL 8.4 与 PostgreSQL 17 有业务数据和目标断点原子提交的原生档案。通常从空业务表开始。已有 PostgreSQL 数据可先进行[只读评估](../reference/nonempty-target-preview)，再按限定单表档案审批接管。
- **信创数据库**。openGauss、达梦、金仓、GBase 8c 和 OceanBase 需按手册的实际版型、驱动和兼容模式验证。商业分布式 GaussDB 仍需原生多节点实测。见[信创适配指南](xinchuang)。
- **分析与消息目标**。ClickHouse、Doris 和 Hive 使用各自的物化与回执协议。消息发布为经确认的至少一次，消费成功需单独跟踪并按稳定事件 ID 去重。见[消息投递](../reference/messaging-v3)。
- **数据核对与恢复**。共同点校验、审阅修复、失败事务补偿和缺口核验各有指定 MySQL / PostgreSQL 档案。Kafka 的确认回查与故障通知走独立的[消息协议](../reference/messaging-v3)。遇到未支持的 DDL 或类型时，先审阅原始故障与持久位置，见[故障处理](troubleshooting)。

## 多节点与部署

节点可共享账号、会话、审计和任务视图。分离部署支持特定 SQL 档案的 Agent 自动分配和已冻结任务的审批移交。跨主机续传需要外部日志及有效执行租约。详见[多节点部署与恢复](multi-node)。

Linux、Docker、Helm 与 Kubernetes 均有部署文件。已有双节点 Kubernetes 实测覆盖配置及 Secret 更新、卷重挂载和外部日志下的恢复。应单独核对跨节点卷可用性、故障与容量组合。参考[执行生命周期](../reference/execution-lifecycle)和[当前实施状态](../reference/implementation-status)。
