---
sidebar: false
title: 产品导览
---

# 看得见的数据同步工作流

从项目定位，到准备连接、创建任务、观察进度和校验恢复。中文配音导览配有字幕、章节跳转和文字稿，适合第一次了解 RivoMesh 的使用者。

<DemoPlayer />

[下载 MP4 视频](/media/rivomesh-tour.mp4) · [中文字幕](/media/tour.zh-CN.vtt) · [完整文字讲解](/media/tour-transcript.txt)

视频使用原创流程图和真实开发预览截图讲解操作顺序，属于产品介绍素材。截图中的停止状态、任务与统计不代表实时演示或性能测试。

## 真实控制台界面

<figure class="tour-figure">
  <img src="/media/console-overview.png" alt="开发预览控制台，同步任务列表、统计、任务状态和管理入口" loading="lazy" />
  <figcaption>任务工作台：查看任务、运行状态与管理入口。截图采集时任务已停止，未展示正在同步的数据。</figcaption>
</figure>

<figure class="tour-figure">
  <img src="/media/task-wizard.png" alt="V3 新建任务向导，显示源地址、库名、复制客户端 ID 和账号等输入项" loading="lazy" />
  <figcaption>任务向导：先配置 MySQL 逻辑源，再选择目标与日志，最后检查计划。表单未提交，不会因查看导览创建任务。</figcaption>
</figure>

<figure class="tour-figure">
  <img src="/media/connector-catalog.png" alt="真实控制台的连接器能力目录，区分源端、目标端与可用状态" loading="lazy" />
  <figcaption>能力目录：明确标注实际实现与验证状态。最新说明请以站内连接器手册及 SDD 为准。</figcaption>
</figure>

## 跟着导览开始使用

1. **准备环境**：阅读[兼容性说明](/guide/compatibility)，确定数据库版本与空目标。
2. **建立连接**：按[快速开始](/guide/quick-start)启动控制台，创建第一条 V3 任务。
3. **验证同步**：核对测试数据的全量、增量、重启和故障恢复。
4. **管理数据质量**：阅读[数据校验](/reference/zh-CN/managed-validation)与[审阅式修复](/reference/zh-CN/managed-repair)，核对当前限定目标。
5. **了解演进**：在[SDD 路线图](/roadmap)查看需求、差距和验收条件。
