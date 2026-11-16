---
kind: docs
locale: zh
title: "SDD 文档索引"
sourcePath: docs/sdd/README.md
---

# Rivomesh Spec-Driven Development

以需求规格驱动设计、任务、实现与验收。先登记规格与差距，代码和文档变更再关联对应需求ID，最后用候选发布包的真实证据关闭条目。本目录使用可评审的Markdown/JSON，不依赖安装特定SDD工具。

Use specifications to drive design,tasks,implementation and acceptance. Record requirements/gaps first,link subsequent code/docs to requirement IDs,then close them with candidate-release evidence. Markdown/JSON keep this process tool-independent.

| 基线 / Baseline | 入口 / Entry | 状态 / State |
|---|---|---|
| RM-SDD-001 · 多节点、会话、恢复、源/JDK兼容和文档 | [中文规格](/docs/zh/sdd/spec.html) / [English](/docs/en/sdd/spec.html) | v0.3实施中：节点目录+4项会话已验收，43项未完成 / registry+4session requirements accepted,43open |

每包包括spec、plan、tasks、acceptance及机器可读requirements.json。NEW/PARTIAL/DONE是实现状态，P0/P1/P2是建议优先级；不能用“规划中”冒充“支持”。

Each package contains spec,plan,tasks,acceptance and requirements.json. NEW/PARTIAL/DONE are implementation states;P0/P1/P2 are proposed priorities. Planned capabilities are never presented as supported.
