---
kind: docs
locale: zh
title: "CP-07：管理入口与执行生命周期分离（分离档案已验收）"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-execution-lifecycle.md
---

# CP-07：管理入口与执行生命周期分离（分离档案已验收）

协议4已实现独立CONTROLLER/AGENT及兼容COMBINED档案，并完成限定LOCAL日志档案的CP-07验收。组合进程仍同时承担HTTP和本机Worker管理，关闭其容器会影响本机Worker；只有显式分离档案具备本合同验证的独立生命周期。自动执行接管和完整矩阵仍单独追踪。

## 进程职责

提供显式管理入口、执行Agent及兼容组合档案。管理入口只有授权API/会话/配置与查询提交，不启动或恢复本机Worker；Agent持有固定owner私有目录，执行持久命令、发布观察和回答类型化只读查询，管理API不得暴露在Agent探针端口。组合档案保留现有单部署体验。

角色表示进程职责，不是多租户安全隔离。Agent仍在可信控制域，控制库/任务密钥与原生日志权限必须说明；Worker继续过滤控制凭据。不能因增加role字符串而声称已经实现最小密钥或操作系统隔离。

## 持久身份及升级

owner仍由稳定nodeId和原私有目录UUID绑定。管理节点不得被选为owner，历史Agent绑定不能使改成纯管理角色的节点继续接受任务。角色及可执行能力必须参与共享成员协议校验；旧成员不能绕过新规则创建无执行者的任务。升级必须定义混合版本拒绝、正常停止成员的条件、原目录恢复、备份及回退边界。

已有组合节点拆分时，不修改任务owner/断点/目标或报告身份；原执行目录只能交给保留原nodeId的Agent。含任务的目录不能以纯管理角色悄悄打开。控制节点没有任务目录不等于可以删除历史权威绑定。

## 故障语义

管理入口退出或强杀后，独立Agent及Worker在其受支持日志/租约/目标协议允许时继续；其他入口仍可查询、提交和观察持久命令。所有管理入口失联也不得让Agent猜测任务已停止。Agent退出仍需要明确停止/未知和原owner恢复语义，自动迁移及旧Worker隔离仍属CP-04。

共享控制库中断不得回退到本机修改。是否继续已有CDC取决于数据面日志和原生隔离，必须实测；节点心跳过期不证明Worker终止。探针、退出顺序及超时不能留下无人监管的新Worker。

## 最低验收

两个管理JVM加独立Agent/Worker和真实SQL业务：A创建给Agent、B查询/控制；杀A时CDC继续，杀全部管理入口时CDC按已声明策略继续；管理恢复后看到同一任务、位点与报告；跨入口撤销和控制库中断仍拒绝非法命令。Agent关闭、容器强杀、原目录重开、错误角色/空目录/旧成员均有正常及拒绝测试。Linux/Docker/Helm/原生YAML分别给出进程与存储配置；K8s/CSI实测独立登记。

[English](/docs/en/sdd/design-execution-lifecycle.html) · [当前全局控制](/docs/zh/reference/global-control.html)

2026-11-17: protocol4 implementation and declared LOCAL-journal lifecycle accepted. [Evidence](/docs/zh/evidence/2026-11-17-execution-lifecycle.html). Current deployment instructions and remaining limits are in the operations guide.
