---
kind: docs
locale: zh
title: "跨节点任务控制"
sourcePath: docs/zh-CN/global-control.md
---

# 全局任务控制：启用、恢复与边界

[English](/docs/en/reference/global-control.html) · [SDD设计](/docs/zh/sdd/design-global-control.html)

2026-11-17：已接入可选的固定 owner 全局模式，包括公开 HTTP、管理界面、共享配置、持久命令和远程只读查询。默认仍为本机模式。CP-02/03 保持 PARTIAL：旧任务导入、完整业务工作流、容量和故障矩阵尚未全部验收；这不是自动跨节点接管。

## 启用条件

所有节点使用相同的控制库、cluster.id、namespace、sharedAccess=true、sharedTasks=true 和 taskKey；各节点使用不同且稳定的 nodeId，以及独立持久化的任务/数据目录。taskKey 必须是规范 Base64 编码的 32 字节随机密钥，通过受保护环境变量提供。不要放入任务 YAML，不要共用 controller.json。首次启用必须使用没有既有任务的目录；已有本机任务或 YAML 会以 GLOBAL_TASK_IMPORT_REQUIRED 拒绝，目前没有自动导入工具。

[平台示例](/files/config/platform-global.example.yml)支持Linux。首次部署按[首版基线](/docs/zh/reference/first-release.html)固定全部节点的模式、身份与密钥；控制模式不匹配拒绝，不再自动升级。更换节点ID、目录身份或错误密钥不会回退为本机任务权威。

```sh
java -jar rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform-global.example.yml
```

数据库账号、令牌、密钥与 nodeId 对应的环境变量由部署环境提供。示例启用 Secure Cookie，浏览器应通过 HTTPS 反向代理访问并配置正确的 publicOrigin。

## Helm 和原生 Kubernetes

[Helm 全局配置](/files/deploy/helm/rivomesh/values-global-control.yaml)引用已有 Secret：rivomesh-auth 的 token，以及 rivomesh-control-store 的 username、password、task-key。task-key 是上述 Base64 密钥文本，所有节点一致。为不同入口部署两个 release，每个保留自己的 PVC 和 nodeId：

```sh
helm upgrade --install rivomesh-global-a deploy/helm/rivomesh --namespace rivomesh -f deploy/helm/rivomesh/values-global-control.yaml
helm upgrade --install rivomesh-global-b deploy/helm/rivomesh --namespace rivomesh -f deploy/helm/rivomesh/values-global-control.yaml
```

也可按环境修改后使用原生清单 [A](/files/deploy/kubernetes/rivomesh-global-a.yaml)、[B](/files/deploy/kubernetes/rivomesh-global-b.yaml)，通过 kubectl apply -f 分别部署。不要把两个独立控制器绑定到同一份私有目录。Helm/清单已有静态一致性和非法配置检查；真实 K8s/CSI、节点故障和滚动升级验收仍待完成。Docker 挂载同样遵守每节点独立持久目录及密钥配置；临时验收脚本不会保留页面。

## 管理界面与配置

登录响应的 taskControlScope=GLOBAL 表示全局模式。任一入口可分页读取授权任务，展示 owner、节点状态、全局修订、Worker 状态、目标/有效配置和命令结果。创建/导入表单选择实际执行节点；导入表单表示新建任务，不是旧断点迁移工具。节点不可用时状态为 UNKNOWN，不能认为同步进程已停止。

创建、编辑、恢复和动作返回 202，只表示共享存储已接受。配置历史区分 desired/active，只有 owner 成功应用才更新有效版本；失败提案保留，旧有效配置继续有效。配置编辑、历史和保密字段引用可跨入口使用。连接预览、原始差异和修复计划等只读操作通过有期限的 owner 查询通道执行，owner 离线时不能完成。完整过滤、全量日志聚合、真实浏览器视觉/可访问性验收仍开放。

全局 maximumTasks/maximumCommands 与每节点 maxTasks/maxRunningTasks 是不同预算。当前默认全局任务上限 10000、活动命令上限 1000，配置范围见示例/Schema；这只是资源保护参数，不是硬件吞吐承诺。查询请求最多 512KiB、响应 1MiB，有效期 1–60 秒；线程池和保留容量均有界。

## 接受、执行和恢复

PENDING 表示持久排队；DISPATCHED 表示交给固定 owner，调用前保存原本机请求与原修订；ACCEPTED 表示本机已持久接受；SUCCEEDED/FAILED 来自实际操作回执。UNKNOWN 表示证据不足，不能伪装成功，也不能换新修订重新执行。重启先恢复原回执保护及配置权威校验，再允许本机调度。

新启动恢复修正：先按游标读取全部活动命令，包括尚未派发的 STOP/PAUSE。它们在本机持久接受前阻止对应 Worker 恢复旧 RUNNING 意图；旧操作仍可结束，停止命令会优先重试。权限变化导致拒绝后解除阻止；结果不明时继续保留。该修正已通过专项测试和应用构建，真实业务验收结果以候选包归档为准，不追溯覆盖此前候选。

TASK_BUSY/OPERATION_PENDING 保持原请求等待。未确认的本机回执不会按普通 500 条窗口回收。取消有父请求和预留容量：未派发时原子取消，派发不明时先恢复证据，本机接受后才实际取消。取消成功不等于所有目标回滚。

owner 失联期间 STOP 保持等待。必须恢复原节点的私有目录/卷和密钥；空目录不能冒充原 owner。默认组合模式的控制器退出仍会停止本机 Worker。显式管理/Agent 分离的已验收范围见[独立执行生命周期](/docs/zh/reference/execution-lifecycle.html)；自动迁移、排空、调度和跨 Agent 隔离仍单独推进。源 MySQL 主库切换续传与控制节点接管是不同故障场景，需要分别验收。

## 运维 FAQ

**如何判断已接受还是已执行？** 查看同一请求 ID 的 deliveryStatus、status、code 和实际 Worker/目标水位。不要把 HTTP 202 当作落库成功。

**刷新页面或更换入口需要重新登录吗？** 共享登录模式通过共享会话恢复身份，仍受 Cookie 的域、Secure、SameSite、有效期和权限撤销规则约束。不同域名需要正确的反向代理和会话配置。

**离线节点能否在 A 上停止？** 可以提交持久 STOP；显示等待/未知，直到原 owner 恢复并提供真实回执。不能仅凭心跳过期宣称已停止。

**直接改共享库的 owner、删除根表或换空目录可以恢复吗？** 不可以。认证元数据、计数、私有目录身份、回执和配置投影均会校验；缺失或篡改拒绝重新初始化。

**控制库中断时可以回退到本机账号吗？** 不会回退；管理面拒绝缺少共享权威的控制。已有数据进程行为依赖其日志/租约/目标协议，不能把管理可用性当作完整数据面隔离证明。

**备份需要包含什么？** 控制库、每节点私有目录、日志/报告/本地 journal、外部 journal（如选用）和原密钥需协调保存。仅恢复游标或旧控制库快照不足以证明一致；自动备份协调及旧备份检测矩阵仍未完成。

**哪些证据已经具备？** 先前候选已有真实 PostgreSQL/MySQL 控制库、两个独立 JVM、HTTPS 共享登录、A 创建 B 任务和离线命令测试；配置专项还有实际 TaskService 加夹具 Worker 验证。新启动修正和真实跨节点业务 CDC 正在补验，不能把这些测试当作全部集群、连接器和硬件性能验收。

**为什么没有常驻预览？** 按用户要求，验收仅启动临时资源并清理自己的容器/卷；其他项目资源不受影响。
