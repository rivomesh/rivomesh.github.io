---
kind: docs
locale: zh
title: "首版部署基线"
sourcePath: docs/zh-CN/first-release.md
---

# 首版配置基线

当前尚未首次发布，不支持开发候选之间的原地升级、旧包名兼容或自动控制模式迁移。内部格式编号不等于已发布版本。

首次部署前一次确定所有节点的控制库、访问模式、角色、密钥和持久目录。完整管理恢复能力使用一致的配置：

```yaml
cluster:
  sharedAccess: true
  sharedTasks: true
  recoveryReview: true
  recoveryCommit: true
  recoverySkip: true
```

命名空间创建时直接写入对应模式；不匹配立即拒绝，停止全部节点也不会自动迁移。已有开发环境需要另行评估并建立新的测试基线，不得把删除代码历史理解成删除业务数据或只复制游标。

Linux和Docker使用同一份角色配置及每节点独立目录。Helm使用控制器/Agent values叠加`values-recovery-skip.yaml`；手工Kubernetes可参考`rivomesh-skip-*.yaml`。示例不证明真实K8s/CSI已通过验收。

任务/会话/证据/回执的重启恢复、租约与epoch隔离、权限撤销和损坏/旧备份拒绝仍是当前功能，不属于应删除的开发版本兼容代码。

开发中直接替换已废弃实现，不增加只为旧开发候选保留的分支、配置别名或升级测试。文档描述当前可用行为；重复证据与构建快照收敛到单一[验证基线](/docs/zh/evidence/baseline.html)。保留验证当前数据正确性、故障恢复和安全边界所需的测试；临时容器、过期专用镜像及中间构建在不再使用时清理。

V2/V3双执行链还在单独合并中。以[当前状态](/docs/zh/reference/implementation-status.html)与[SDD](/docs/zh/sdd/spec.html)为准，不把清理标成其他未完成功能的完成。
