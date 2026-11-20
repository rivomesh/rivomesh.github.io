---
kind: docs
locale: zh
title: 已验证范围
description: 按数据源、运行环境、故障恢复和部署方式查看 RivoMesh 的验证范围及复现入口。
---

# 已验证范围

每项结果对应特定的源库、目标、驱动、日志存储和部署方式。试点前，先在[兼容性矩阵](../reference/compatibility)中匹配版本和拓扑，再用相同的配置验证关键业务数据、权限和故障恢复。

| 范围 | 已验证行为 | 配置与复现 |
| --- | --- | --- |
| MySQL 采集 | Temurin 21 下，5.7.44、8.0.46、8.2.0 与 8.4.13 各有单机、异步 GTID 提升和三节点单主组复制验证。 | [MySQL 配置与切换](../reference/pipeline-v3) |
| PostgreSQL 采集 | 实验性。17.12 从同步逻辑槽恢复，18.7 验证存储型生成列。 | [PostgreSQL 源端](../reference/postgresql-source) |
| Oracle 采集 | 实验性。Oracle Free 26ai 单 PDB 通过 Flashback 快照与归档 LogMiner 向 PostgreSQL 投递，并从原 SCN 恢复。 | [Oracle 源端](../reference/oracle-source) |
| 数据核对与恢复 | 指定 MySQL 到事务型 SQL 的组合支持共同校验点逐行核对。PostgreSQL 和 MySQL 目标各有受控恢复档案。 | [数据校验与修复](data-validation) · [目标恢复](troubleshooting) |
| 消息和分析目标 | 指定产品验证了 Broker 确认、物化回执及重启恢复。消费者确认、去重和保留条件依各目标协议而定。 | [连接器目录](connectors) · [目标回执核对](../reference/failed-transactions) |
| 多节点部署 | 指定双节点 Kubernetes 环境验证了镜像替换、配置和 Secret 更新、原存储卷重挂载及外部日志下的续传。 | [多节点部署](multi-node) · [执行生命周期](../reference/execution-lifecycle) |
| 构建与运行 | Controller、Agent 和 Worker 使用 Eclipse Temurin 21 LTS。 | [安装](install) |

按指南复现时记录版本、拓扑、所用构建包及退出和恢复前后的断点。容量评估还需要记录业务行宽、事务大小和最慢目标的积压表现。[性能测试环境、结果和复现步骤](../reference/performance)
