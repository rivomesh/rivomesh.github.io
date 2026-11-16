---
layout: doc
sidebar: false
outline: false
title: SDD 路线图
---

# 从明确需求，到可验证的交付

RivoMesh 按 SDD（规格驱动开发）组织演进。这里直接读取源码中的 `requirements.json`，保留需求 ID、状态、优先级、差距和验收条件，方便使用者与贡献者核对范围。

::: info 发布前需求基线 · RM-SDD-001
这里保留 2026-11-16 v0.1 需求基线中 48 项**未关闭的需求**，不自动以新功能文档代替整项验收。单控制器会话首版已有[专门手册](/reference/zh-CN/browser-sessions)，跨控制节点连续性仍未完成。`PARTIAL` 表示已有基础，整项仍未完成；`NEW` 表示尚未实现。P0/P1/P2 是建议优先级，不是已确认排期。现有同步能力请查阅[兼容性说明](/guide/compatibility)。
:::

<Roadmap />

## 建议实施顺序

| 阶段 | 重点 | 退出条件 |
| --- | --- | --- |
| M0 · 需求基线 | 规格、差距、任务、验收 | 48 项需求可追踪，基线可评审 |
| M1 · 会话基础 | 刷新登录保持、会话生命周期 | 单机兼容及会话安全验收通过 |
| M2 · 统一控制 | 节点注册、远端命令、共享权限、控制面 HA | 两节点入口一致，分区与故障隔离通过 |
| M3 · 人工恢复 | 失败事务审阅、SQL 事务跳过、补偿、缺口台账 | 计划审阅、恢复凭据和拒绝路径闭环 |
| M4 · 源端扩展 | MySQL 四版本档案、PostgreSQL 源 | 候选包与 JDK/对象/恢复矩阵逐项验收 |
| M5 · 兼容性扩展 | Oracle 源、更多厂商/部署/运行时 | 真实版本、权限、数据集和拓扑证据 |
| M6 · 发布完善 | 切换回退、K8s 实机、容量、长稳、发布门禁 | 实现、迁移、文档与证据完整关联 |

以上是建议顺序，不承诺日期。详见[设计与实施计划](/reference/sdd/001-control-recovery-compatibility/plan)、[任务清单](/reference/sdd/001-control-recovery-compatibility/tasks)、[验收矩阵](/reference/sdd/001-control-recovery-compatibility/acceptance)和[当前实施状态](/reference/zh-CN/implementation-status)。
