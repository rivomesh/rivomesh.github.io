---
kind: docs
locale: zh
title: "共享节点目录"
sourcePath: docs/zh-CN/node-registry.md
---

# 共享节点目录与心跳

English：[Node registry](/docs/en/reference/node-registry.html)。设计合同：[CP-01](/docs/zh/sdd/design-control-store.html)。本页描述共享节点观察。账号、会话与审计可显式启用[共享访问](/docs/zh/reference/shared-access.html)；默认任务页和操作针对本机；可选固定执行节点的[全局模式](/docs/zh/reference/global-control.html)已接入 HTTP 与管理界面，显式管理与 Agent 分离已有首批验收，自动跨 Agent 接管及其他高可用档案需另验。

## 使用界面

ADMIN 登录后打开“节点目录”。默认单机模式只显示当前节点，节点ID保存在私有控制目录的 `node-id`，重启保持。配置共享控制库后，同一 clusterId 下的任一入口均能读取相同节点目录。VIEWER/OPERATOR 暂无全局节点观察权限，原任务权限不变。

界面显示版本和运行包SHA256、真实JVM/架构/CPU/堆、任务/并发容量、注册代次、数据库观察时间、最近心跳和租约期限，以及各节点发布的任务ID、Worker状态与最后观察时间。HEALTHY只表示心跳租约有效，不代表每个源/目标健康；STALE表示期限已过，STOPPED表示本代进程已正常注销。目录查询失败会清除旧健康卡片并显示错误，不用缓存冒充当前状态。

节点任务列表是观察数据，不是全局配置或调度权威；默认任务页和操作针对本机；可选固定执行节点全局模式见[全局控制手册](/docs/zh/reference/global-control.html)。不要因为某节点STALE就在另一个节点复制配置并启动同名任务。同步执行仍使用原有CDC/目标租约协议，节点注册租约不是Worker接管凭证。跨节点命令与共享资源的当前边界见[全局控制](/docs/zh/reference/global-control.html)，显式管理/执行分离见[独立执行生命周期](/docs/zh/reference/execution-lifecycle.html)。

## Linux/Docker 配置

每个节点使用独立本地控制、任务和报告目录，并填写唯一稳定的 nodeId；不能共享 controller.json/审计H2目录或挂载同一PVC来代替共享控制协议。示例：[platform-cluster.yml](/files/config/platform-cluster.yml)。同一SQL实例可复用不同命名空间，控制库与同步日志职责不同。

```yaml
cluster:
  id: migration-registry
  nodeId: ${RIVOMESH_NODE_ID}
  driver: org.postgresql.Driver
  url: jdbc:postgresql://control-db:5432/rivomesh_control
  username: ${RIVOMESH_CONTROL_USERNAME}
  password: ${RIVOMESH_CONTROL_PASSWORD}
  namespace: rivomesh_control
  heartbeatMillis: 2000
  leaseMillis: 15000
  maximumNodes: 1000
```

首批原生档案为 PostgreSQL17 和 MySQL8.4 控制库；H2内存仅作进程内协议测试。MySQL改用 `com.mysql.cj.jdbc.Driver` 及 MySQL JDBC URL，namespace 对应 database；控制表必须为 InnoDB、utf8mb4_bin，已有不符表拒绝使用。TLS参数按数据库驱动配置，程序不自动关闭生产TLS。

启动需要创建控制schema/database及三个控制表的权限；应用账号还需要查询/增删改这些控制表和初始化所用的数据库会话锁权限。已有同名表不删除、不清空，格式不符拒绝启动。可以复用现有SQL实例，但必须使用独立命名空间和专用权限，勿对业务表授予不必要权限。

nodeId、数据库用户名/密码及可选 advertiseUrl 支持整个值的 `${ENV_NAME}`。advertiseUrl 只保存可选访问地址，目前不用于命令投递；不允许用户信息、路径、查询或片段。程序对连接/查询设超时，不在目录API返回连接URL、密码、文件路径或原始业务数据。

heartbeatMillis 为100～30000毫秒；leaseMillis 至少1000毫秒且不少于3个心跳间隔，最多300000；maximumNodes 为1～10000。默认2秒/15秒/1000。租约/最大节点数是集群协议设置，所有成员必须一致，当前不提供在线修改。最大节点数计算保留记录，含STALE/STOPPED；历史节点批量治理属于后续运维功能，不可直接删表“修复”。每节点最多发布当前平台上限200项观察；API按节点ID游标分页，每页默认20、最多50。

## Helm 与原生 K8s

使用 [values-cluster.yaml](/files/deploy/helm/rivomesh/values-cluster.yaml)，配置实际URL和已有控制库Secret（username/password）。分别安装两个不同release，自动获得不同节点ID、Service和独立PVC：

```sh
helm upgrade --install rivomesh-node-a deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-cluster.yaml
helm upgrade --install rivomesh-node-b deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-cluster.yaml
```

默认仍为单副本Recreate部署。当前registry档案通过多个独立release运行，不能把单个Deployment副本数直接加大并共享同一个PVC。仅启用节点目录时，各节点账号及会话仍独立；需要统一身份和会话连续性时，按[共享访问](/docs/zh/reference/shared-access.html)部署。共享访问本身不等于控制面高可用。

手动部署可修改 [node-a](/files/deploy/kubernetes/rivomesh-node-a.yaml) 与 [node-b](/files/deploy/kubernetes/rivomesh-node-b.yaml) 中的镜像、控制库地址和Secret引用后分别 `kubectl apply -f`。与Helm渲染结果有静态一致性检查；真实K8s/CSI/升级/控制器HA尚未验收。生产浏览器HTTPS配置另见[会话手册](/docs/zh/reference/browser-sessions.html)。

## 故障与 FAQ

- **NODE_ID_IN_USE**：另一进程持有相同nodeId的有效租约。停止重复进程或改为唯一稳定ID；原节点确已断电时等待租约期限，不要手动减epoch。
- **NODE_REGISTRATION_FENCED**：本进程注册代次已被替代，不能再续租或注销新代记录。检查重复部署，按正确ID重开；目录fencing不表示Worker全局接管已完成。
- **CONTROL_STORE_PROTOCOL_MISMATCH**：clusterId下格式/租约/容量设置不匹配，或控制元数据缺失。恢复一致设置/正确备份；不自动覆盖旧权威行。
- **CONTROL_STORE_UNAVAILABLE / readiness 503**：控制库连接/查询失败或心跳超过租约。`healthz`仍可存活；源/目标Worker继续按自己的同步日志租约运行。恢复数据库后，过期但未被替代的本代进程重新注册并增加epoch；被替代进程保持拒绝。
- **节点kill后仍短暂HEALTHY**：在原租约期限内无法立即确认断电；对照心跳及到期时间，之后转STALE。不能把这段观察窗口当作故障转移授权。
- **旧进程重开覆盖新节点？** 活动ID冲突和incarnation/epoch校验会拒绝；旧心跳/退出不会改写替代记录。
- **停机为什么没显示STOPPED？** 正常退出且控制库可达时可提交注销；强杀、存储故障或提交确认丢失以租约过期判STALE，不猜测已经停止。
- **备份与恢复**：独立备份控制SQL命名空间及每节点原有控制/账号/审计/配置/报告目录。节点目录只含观察；启用共享访问后还需备份共享账号、会话与审计，不能只恢复节点目录就恢复任务，更不能声称全局控制HA。控制库回退和节点身份/epoch回退需要人工核对；跨备份不可变锚点仍待实现。

双入口的部署与验证方式见[共享访问](/docs/zh/reference/shared-access.html)及当前[实施状态](/docs/zh/reference/implementation-status.html)。历史测试地址不代表有常驻预览服务。
