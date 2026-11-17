---
kind: page
locale: zh
title: 社区与贡献
---

# 一起建设 RivoMesh

<p class="landing-lead">从清楚的问题、可复现的验证和易懂的文档开始，让数据同步在真实环境中持续改进。</p>

<div class="community-actions">
  <a href="https://github.com/rivomesh/rivomesh"><strong>阅读与参与源码 ↗</strong><span>了解核心实现、部署文件和测试，按需求 ID 讨论变更。</span></a>
  <a href="https://github.com/rivomesh/rivomesh/issues"><strong>提交问题与建议 ↗</strong><span>反馈同步行为、连接器兼容性和使用流程中的问题。</span></a>
  <a href="https://github.com/rivomesh/rivomesh/pulls"><strong>贡献 Pull Request ↗</strong><span>提交实现、验证与对应中英文文档，让变更可以评审。</span></a>
</div>

## 从哪里开始

| 方向 | 可以贡献的内容 |
| --- | --- |
| 文档 | 改正操作步骤、补充术语、双语校对、检查链接 |
| 兼容性 | 提供确切版本、模式、驱动、JDK、负载与可复现实验 |
| 开发 | 按 SDD 需求 ID 关联设计、实现、迁移和验收 |
| 体验 | 改进控制台、任务向导、错误解释与可访问性 |
| 使用反馈 | 记录从部署到首次同步、故障恢复的实际阻碍 |

## 反馈问题时准备什么

说明版本、数据库确切产品与模式、JDK、日志和部署方式、复现步骤、预期及实际结果。附上脱敏后的配置和错误摘要；凭据、管理令牌与业务原始值不要提交到公开 Issue。

## 以 SDD 对齐交付

在[项目路线图](/docs/zh/start/roadmap.html)查找需求，再核对[规格](/docs/zh/sdd/spec.html)、[任务](/docs/zh/sdd/tasks.html)和[验收条件](/docs/zh/sdd/acceptance.html)。提交变更时注明实现范围、正向与拒绝路径、故障恢复、迁移影响和文档更新。

构建、DOM、真实数据库与实际集群验证各有范围。记录使用的候选包和环境，保持已完成、部分实现与规划的区别。

## 官网与文档维护

[网站源码](https://github.com/rivomesh/rivomesh.github.io) · [网站问题](https://github.com/rivomesh/rivomesh.github.io/issues) · [网站 Pull Requests](https://github.com/rivomesh/rivomesh.github.io/pulls)

官网布局、导航、搜索与文字在网站仓库维护。源码同步来的手册应先在核心仓库修改，再通过文档导入流程生成本站快照。

[品牌与媒体素材](/brand.html) · [产品导览](/tour.html)

## 许可证与发布状态

当前核对的核心源码和仓库元数据尚未提供明确的项目 LICENSE。不能根据同类项目或依赖库许可证推断本项目采用 Apache 等协议；使用和再分发前请核对[核心仓库](https://github.com/rivomesh/rivomesh)后续提供的许可条款。

当前尚无正式 Release，请按[源码构建说明](/download.html)试用。项目使用 GitHub Issues 和 Pull Requests 协作，未配置的 Discussions 不作为网站入口。
