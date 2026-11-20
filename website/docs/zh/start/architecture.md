---
kind: docs
locale: zh
title: 同步平台架构
description: RivoMesh 控制台、Controller、Agent、Worker、持久日志和数据目标的完整架构。
---

# 同步平台架构

Controller 负责鉴权、配置和命令。Agent 执行分配给本节点的任务操作，并管理 Worker 进程。Worker 负责采集与投递。控制存储与持久日志分别记录管理状态和数据进度。

[打开交互架构图](/architecture/zh.html)

<iframe class="architecture-diagram" src="/architecture/zh.html?embed=1" title="RivoMesh 同步平台交互架构图" loading="lazy"></iframe>

## 控制与执行

| 组件 | 职责与持久状态 |
| --- | --- |
| Web 控制台与 API | 使用浏览器会话或 Bearer 令牌，按角色及任务授权计算可见范围与可用操作。 |
| Controller | 接收任务创建、配置修订和操作请求，记录命令与审计。全局模式支持从多个入口查询同一任务归属与命令结果。 |
| 共享控制存储 | 记录任务所有者、节点注册、共享会话和跨入口命令状态。任务所有者执行已持久化的全局命令并记录结果。 |
| Agent | 更新注册与心跳，领取发往本节点的命令，使用节点可用的配置、驱动和凭据监控并启动独立 Worker。指定档案支持新任务自动分配。 |
| Worker | 检查源与目标，持有日志租约与写入代次，采集、规范化并按订阅投递，参与任务级校验和恢复。 |

单机模式将 Controller 与 Agent 合并在一个服务进程，任务仍由独立 Worker 运行。分离部署可在指定档案中让已运行的 Worker 在管理入口中断期间继续同步。新任务自动分配与已冻结任务审批移交各有独立条件。[部署与移交](multi-node) · [全局控制与持久命令](../reference/global-control)

## 数据链路与恢复

1. **源端。** MySQL 通过 GTID/binlog，PostgreSQL 通过逻辑复制槽与 pgoutput，Oracle 通过 Flashback 和归档 LogMiner 建立全量与增量的衔接。[源端同步原理](replication)
2. **持久日志。** 本地 H2 用于单节点，外部日志用于指定多节点档案。日志保存快照、已提交事务、采集位置、订阅确认及写入租约。暂停的订阅可延长日志保留。
3. **目标投递。** 事务型 SQL 目标在同一事务提交业务行和目标断点。分析库用产品原生物化回执，消息系统用 Broker 确认和稳定事件 ID。各目标通过各自订阅独立推进。[连接器目录](connectors)
4. **校验与恢复。** 指定的 MySQL 与事务型 SQL 目标可在共同校验点逐行核对。审批修复、提交确认与事务跳过分别绑定对应的报告、回执、错误代次和目标范围。[数据校验](data-validation) · [故障处理](troubleshooting)

[平台设计手册](../reference/platform-design) · [详细兼容性矩阵](../reference/compatibility)
