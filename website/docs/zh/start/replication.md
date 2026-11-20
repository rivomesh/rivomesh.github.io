---
kind: docs
locale: zh
title: 源端同步原理
description: RivoMesh 如何通过 MySQL binlog、PostgreSQL pgoutput 和 Oracle 归档 LogMiner 衔接快照、增量与断点恢复。
---

# 源端同步原理

RivoMesh 先从源库建立一致性快照，再持续投递已提交事务。Worker 将快照分片、变更事务和采集断点持久化到日志。每个目标按自己的订阅和断点投递。判断任务是否追平时，同时检查源端采集位置、日志积压和各目标的确认位置。[架构图](architecture)

| 采集源 | 快照与增量的衔接点 | 恢复时要保留 | 当前实测范围 |
| --- | --- | --- | --- |
| [MySQL](#mysql) | 每表 InnoDB 一致视图及其 GTID 集 | 原日志、所需 binlog、目标提交回执 | 5.7.44、8.0.46、8.2.0、8.4.13 的指定单机、异步 GTID 主备与单主组复制环境 |
| [PostgreSQL](#postgresql) | 每表导入的 MVCC 快照及逻辑复制 LSN | 原持久逻辑槽、所需 WAL、时间线及日志代次 | 实验性。17.12 / 18.7 的指定 pgoutput 环境，目标为 PostgreSQL 或 MySQL |
| [Oracle](#oracle) | Flashback SCN 与已归档的 redo | 从保留起点开始的归档、CDB/PDB 身份及日志断点 | 实验性。Oracle Free 26ai 单 PDB、单 redo 线程，目标为 PostgreSQL |

## MySQL

1. **检查源库。** 一个任务连接一个逻辑 MySQL 拓扑。`databases` 声明数据库范围，每个目标通过 `mappings` 指定去向。需要 InnoDB、启用 GTID、ROW 格式和 FULL 行镜像。当前档案使用未标记 GTID，依靠完整镜像处理更新、删除和无主键的重复行。
2. **建立每表一致视图。** Worker 先记录采集起点并连接 binlog 流。为某张表拍快照时，短暂执行 `FLUSH TABLES WITH READ LOCK`，建立 InnoDB 一致读、核对表结构、记录 GTID 集并打开游标，然后释放全局读锁。之后分批读取同一个一致视图。大表扫描期间仍会保留 undo 历史与元数据锁。
3. **按表基线衔接。** 快照期间，binlog 读取器组装并持久化已提交事务。目标完成对应表的快照后，Worker 过滤该表快照已包含的变更。跨库事务的已订阅行仍按事务边界投递。各表可有不同基线，核对跨表一致性时应建立共同校验点。
4. **按原 GTID 续传。** 事务和采集 GTID 在日志中一同提交。重启复用完整快照，丢失一致视图的未完成表重新扫描。异步主备由外部系统提升，单主组复制由 MySQL 选主。RivoMesh 检查新主的可写状态、GTID 历史与所需日志。遇到缺失的 binlog，采集暂停并保留原断点。

排查时先确认当前主库角色，再核对最后持久 GTID 和 `gtid_purged`，最后检查暂停的目标是否占用日志配额。保留原始 binlog 和断点证据。[任务配置与主备档案](../reference/pipeline-v3) · [采集故障恢复](../reference/capture-recovery)

## PostgreSQL

1. **确定发布范围。** 一个任务采集一个 PostgreSQL 数据库，`databases` 在此表示源 schema。设置 `wal_level=logical`，为所选表发布 INSERT、UPDATE、DELETE，配置 `REPLICA IDENTITY FULL`，为持久槽和临时快照槽预留容量。
2. **从逻辑槽导出快照。** Worker 为每张表创建临时逻辑槽并取得 `snapshot_name` 与 `consistent_point`。独立读取连接用 `REPEATABLE READ` 导入该快照并分批读表。LSN 作为该表衔接增量的基线。持续采集使用独立持久槽，并绑定任务的日志代次。
3. **解码提交事务。** `pgoutput` 提供 Relation、Begin、行变更和 Commit 消息。Worker 根据发布范围和登记的表结构解码，完成日志写入后才反馈已应用和已刷新的 LSN。空闲心跳和发布范围外的 WAL 不推进业务事务断点。带外存储的 TOAST 值按受支持的行镜像规则处理。
4. **校验原槽和时间线。** 重连时核对系统标识、数据库、时间线、原逻辑槽和 LSN。17.12 的指定档案验证了同步 failover 槽提升后续传。槽丢失、时间线回退或 WAL 缺口都会保护原断点。表结构变化触发暂停时，按手册核对受支持的审阅路径。

同时观察持久确认位置、复制槽保留的 WAL 和目标积压。[PostgreSQL 源端配置、提升与类型支持](../reference/postgresql-source)

## Oracle

1. **绑定库身份并确定 SCN。** 预检分别连接 CDB 根服务和指定可写 PDB，核对 DBID、resetlogs 和 PDB 身份，并检查归档模式、强制日志、补充日志及 Flashback 读取权限。用大写 `OWNER.TABLE` 声明表，再配置到 PostgreSQL 的 schema 映射。
2. **使用 Flashback 建立快照。** Worker 为本轮采集记录 SCN，对所选表执行 `AS OF SCN` 并写入快照分片。完整快照可重用。中断后的未完成快照可用新 Flashback 视图重新建立。
3. **解析已归档的 redo。** Worker 检查归档区间的连续性，以 LogMiner 的 `COMMITTED_DATA_ONLY` 读取已提交变更，按 XID 组织事务，根据提交 SCN 和事务内顺序生成行事件。redo 与 undo 提供变更镜像。快照时仍开放的事务可阻止归档保留起点前移，直到后续归档覆盖所需的事务边界。
4. **按原 SCN 和归档起点恢复。** 持久位置包含源身份、采集 SCN 与归档保留起点。重启先核对原归档可读且连续。缺失归档、无法解码的记录、提交顺序歧义或未审阅 DDL 会暂停采集并保留上次断点。归档轮转影响增量时延。

当前实验档案使用单 PDB、单 redo 线程和已归档的 redo。在线 redo、RAC、源端提升、原生二进制 JSON 和 LOB 需独立验证。[Oracle 源端权限、标量类型和严格文本 JSON](../reference/oracle-source)

## 投递、断点与修复

Worker 按源事务顺序规范化行变化，然后按订阅投递。事务型 SQL 目标在同一事务写入业务行和目标断点。分析目标依据适配器的物化回执恢复。消息系统依靠 Broker 确认和稳定事件标识处理重复投递。

当采集已推进而目标断点停住时，先检查该目标的错误代次和回执。需要逐行核对时，从受支持的共同校验点运行[数据校验](data-validation)。处理前保留日志、目标元数据和相应源日志。[故障与恢复操作](troubleshooting)
