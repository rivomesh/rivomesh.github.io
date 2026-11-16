# 文档中心

从第一次了解，到部署、日常运维和参与开发。建议先走完一条小规模验证链路，再扩展到实际业务场景。

::: tip 当前版本：0.1.0-SNAPSHOT · 发布前预览
操作文档来自 RivoMesh 源码快照。已实现功能、实验适配与规划范围分别标注；未来计划以 [SDD 路线图](/roadmap)为准。
:::

## 第一次使用

| 你想做什么 | 从这里开始 |
| --- | --- |
| 了解项目与基本概念 | [项目介绍](introduction) |
| 部署控制台，完成第一条同步 | [快速开始](quick-start) |
| 评估国产数据库同步、分析数据分发等场景 | [场景与试点建议](scenarios) |
| 确认产品、版本与限制 | [兼容性说明](compatibility) · [连接器目录](/ecosystem/) |
| 下载、构建与获得配置样例 | [获取 RivoMesh](/download) |
| 看一段讲解并了解界面 | [产品导览](/tour) |

## 创建和管理同步任务

[控制台与部署](/reference/zh-CN/console-and-deployment)介绍向导、YAML 导入、任务检查、Worker、启停和部署方式。[V3 运行手册](/reference/zh-CN/pipeline-v3)解释多库映射、多目标、日志、全量/增量和独立恢复。[配置编辑](/reference/zh-CN/configuration-editor)覆盖凭据轮换及历史版本恢复。

## 连接器手册

| 类别 | 使用手册 |
| --- | --- |
| 关系型目标 | [Gauss 索引策略](/reference/zh-CN/gaussdb-index-policy) · [OceanBase](/reference/zh-CN/oceanbase-v3) · [达梦](/reference/zh-CN/dm-v3) · [金仓](/reference/zh-CN/kingbase-v3) · [GBase 8c](/reference/zh-CN/gbase8c-v3) |
| 分析与数仓 | [ClickHouse](/reference/zh-CN/clickhouse-v3) · [Doris](/reference/zh-CN/doris-v3) · [Hive](/reference/zh-CN/hive-v3) |
| 消息系统 | [Kafka / RabbitMQ / NATS / Redis Streams / Pulsar / RocketMQ / Artemis](/reference/zh-CN/messaging-v3) · [ActiveMQ Classic](/reference/zh-CN/classic-v3) |

## 权限、运维与数据质量

- [浏览器会话](/reference/zh-CN/browser-sessions)、[账号管理](/reference/zh-CN/account-management)、[按任务授权](/reference/zh-CN/task-authorization)、[安全审计](/reference/zh-CN/security-audit)
- [校验修复流程](/reference/zh-CN/reconciliation-workflow)、[管理界面校验](/reference/zh-CN/managed-validation)
- [共同校验点修复](/reference/zh-CN/common-cut-repair)、[管理界面修复](/reference/zh-CN/managed-repair)
- [恢复与一致性](/reference/recovery)、[性能测量](/reference/zh-CN/performance)、[验证记录](/reference/validation)
- [更名迁移](/reference/zh-CN/rename-migration)、[开发预览](/reference/zh-CN/development-preview)

## 设计与项目演进

[完整平台方案](/reference/zh-CN/platform-design) · [需求与决策](/reference/zh-CN/requirements-and-decisions) · [实施状态](/reference/zh-CN/implementation-status) · [SDD 规格](/reference/sdd/001-control-recovery-compatibility/spec) · [实施计划](/reference/sdd/001-control-recovery-compatibility/plan) · [任务清单](/reference/sdd/001-control-recovery-compatibility/tasks) · [验收矩阵](/reference/sdd/001-control-recovery-compatibility/acceptance)

站内搜索支持中文、英文产品名与需求 ID。[English documentation](/en/) 提供对应的英文运行手册。
