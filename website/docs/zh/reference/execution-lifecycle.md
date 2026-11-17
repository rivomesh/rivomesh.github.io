---
kind: docs
locale: zh
title: "管理与执行 Agent 分离"
sourcePath: docs/zh-CN/execution-lifecycle.md
---

# 管理入口与执行 Agent 分离

[English](/docs/en/reference/execution-lifecycle.html) · [全局控制](/docs/zh/reference/global-control.html) · [SDD合同](/docs/zh/sdd/design-execution-lifecycle.html)

协议4分离档案已通过348项应用构建/发布包优先测试、76项DOM及五JDK各152项专项；PG/MySQL控制库、真实多库双目标、管理全停、控制库中断、接收入口死亡后原命令恢复、非root三进程和SQL并发角色切换均已验收。自动跨Agent接管、完整日志/适配器/JDK矩阵仍待完成。 [Evidence](/docs/zh/evidence/2026-11-17-execution-lifecycle.html).

| 配置 role | 节点目录角色 | 职责 |
|---|---|---|
| COMBINED | CONTROLLER_WORKER | 兼容组合部署，管理接口和本机执行仍在同一进程 |
| CONTROLLER | CONTROLLER | 管理界面/API、共享登录、配置和持久命令；执行容量为0 |
| AGENT | AGENT | 固定owner执行、Worker监督、观察和只读查询；HTTP仅探针 |

## 配置与启用

所有成员共同设置 `cluster.sharedAccess=true`、`sharedTasks=true`、`separateExecution=true`，并显式设置角色。共享控制库、cluster.id、namespace和Base64任务密钥一致；每个成员的nodeId及私有目录/卷各自独立。`separateExecution=false`保留协议3组合模式，默认配置不自动变成分离部署。

分离模式使用协议4，不能和协议3成员混跑。升级前正常停止全部旧成员并确认STOPPED；失联或租约过期不算正常停止。保留原任务/日志/报告、密钥和私有目录UUID；旧程序会拒绝新协议，不支持直接降级开库。

有任务的原组合节点应保留原nodeId和原目录，以AGENT角色恢复。不能以CONTROLLER打开含任务的目录；换空目录也不能隐藏共享权威中的任务归属。旧任务从本机模式导入全局模式仍需要独立迁移方案。

管理节点不能被选为任务owner。新建任务须指定执行Agent，界面会过滤纯管理节点，并继续分页寻找Agent。角色变更与任务提交在事务内重新检查，不能依赖先前读取的角色或目录。

## Linux手动部署

[管理配置](/files/config/platform-controller.example.yml)默认8080，[Agent配置](/files/config/platform-agent.example.yml)默认8081。先按环境修改控制库连接并准备令牌、控制库账号/密码及任务密钥环境变量，再分别运行：

```sh
RIVOMESH_NODE_ID=controller-a java -jar rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform-controller.example.yml
RIVOMESH_NODE_ID=agent-a java -jar rivomesh-app-0.1.0-SNAPSHOT.jar agent config/platform-agent.example.yml
```

不同进程使用独立配置副本和目录；同机增加管理入口时还需独立端口。用不同systemd服务监督这些进程，Agent退出会停止自己监督的Worker，管理入口退出不应通过服务依赖连带停止Agent。

## Docker

先构建当前版本镜像。准备RIVOMESH_TOKEN、RIVOMESH_TASK_KEY、RIVOMESH_CONTROL_URL、RIVOMESH_CONTROL_USERNAME、RIVOMESH_CONTROL_PASSWORD；示例默认PostgreSQL控制库。执行：

```sh
docker compose -f deploy/docker-compose-execution.yml up -d
```

该配置创建controller-a、controller-b、agent-a和三份独立卷。管理入口映射本机8080/8082，Agent探针映射8081。浏览器仍应通过HTTPS代理访问；生产Cookie策略不会因端口映射自动变成HTTP可用。停止管理入口时不要同时停止Agent或删除其卷。部署文件不会替用户创建外部控制库实例。

## Helm与手动Kubernetes

共享Secret与[全局控制](/docs/zh/reference/global-control.html)一致。分别安装：

```sh
helm upgrade --install rivomesh-controller-a deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-controller.yaml
helm upgrade --install rivomesh-controller-b deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-controller.yaml
helm upgrade --install rivomesh-agent-a deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-agent.yaml
```

不使用Helm时，修改并应用原生清单 [A](/files/deploy/kubernetes/rivomesh-controller-a.yaml)、[B](/files/deploy/kubernetes/rivomesh-controller-b.yaml)、[Agent](/files/deploy/kubernetes/rivomesh-agent-a.yaml)。每个release单副本和独立PVC；增加Agent采用不同release/nodeId/卷，不共享本机状态。静态渲染与非法配置检查已有，真实K8s/CSI与节点故障验收单独登记。

## 故障与恢复FAQ

**管理入口全部退出时怎么办？** Agent独立运行并从共享队列读取命令。已测试的LOCAL/H2日志档案可继续CDC；入口恢复后重新读取相同owner和任务权威。这不是自动迁移到另一个Agent。

**控制库中断还能同步吗？** 在已测试LOCAL/H2日志档案中，原Worker继续读取源并写入独立业务目标；管理API/注册就绪探针拒绝控制，不回退本机账号。控制库恢复后重获注册租约并发布新观察。外部日志与控制库存储共故障、不同连接器和生产拓扑仍按各自档案验收，不能由此推断全部组合可用。

**Agent端口为什么没有登录页面？** 该端口只提供GET /healthz与/readyz，管理路径返回404 AGENT_PROBE_ONLY。通过任一管理入口控制Agent任务，查询通道在共享控制存储中完成。

**Agent自己退出或被强杀？** 这会影响其Worker，管理端显示等待/未知。恢复原Agent目录、nodeId和密钥后续传；离线STOP会先处理，不能据心跳过期宣称已停止。自动执行接管和旧Worker隔离仍是CP-04。

**Agent拥有控制凭据是否意味着最小权限隔离已完成？** 不是。Agent属于可信控制域；Worker会过滤控制环境变量。此角色划分不建立多租户或操作系统隔离，最小密钥/外部身份等仍单独追踪。

**重启时NODE_ID_IN_USE？** 强杀后旧租约需要到期，不能跳过检查。Docker/Kubernetes或独立服务监督器按正常重试策略恢复；若另一个同名节点仍在续租，应修正重复配置。

**恢复配置后立即校验报VALIDATION_BARRIER_MOVED？** Worker进程存活不代表已经取得日志租约；已有行相等也不能证明新Worker启动完成。检查共享运行状态和实际增量追平后重试，保护检查不会放行一个已经移动的校验点。相关就绪展示改进仍属CP-06。
