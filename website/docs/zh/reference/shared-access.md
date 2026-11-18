---
kind: docs
locale: zh
title: "共享账号、会话与审计"
sourcePath: docs/zh-CN/shared-access.md
---

# 共享账号、会话与审计

English：[Shared access](/docs/en/reference/shared-access.html)。设计合同：[SE-04 / CP-05](/docs/zh/sdd/design-shared-access.html)。验收状态以[实施状态](/docs/zh/reference/implementation-status.html)及候选包证据为准。

## 启用和迁移

在现有[共享控制库配置](/docs/zh/reference/node-registry.html)中显式设置：

```yaml
cluster:
  sharedAccess: true
```

所有入口随后使用同一 SQL 账号目录、会话和新审计链。任务控制范围仍由任务控制档案决定；当前任务页/操作仍为 LOCAL。会话可以跨控制实例恢复；在全局任务/命令权威接入前，任务请求仍应访问对应节点。

首次初始化优先导入当前节点已经过本地审计锚点验证的托管账号；未托管时使用部署账号引导共享托管目录。之后从共享目录读取权限，启动配置中的旧令牌/范围不会覆盖它。既有托管目录迁移应先启动选定的引导节点，再启动其他节点；来自不同独立托管目录的冲突不会自动合并，需审阅账号/授权并制定迁移方案，不能以旧目录覆盖共享权限。

导入的非管理员账号默认只允许访问原节点，保留原有本地授权边界。账号界面支持“全部节点”或选定节点ID；空选中表示无节点访问权。管理员审阅同名任务冲突后可显式扩大范围。API中 `nodeIds: null` 表示全部节点、数组表示节点限制，更新时省略字段保留原授权；管理员始终覆盖全部节点。

升级共享身份协议前，必须正常停止全部旧成员；过期/STALE不证明进程已停。控制库协议由1升级到2，拒绝仅启用注册表的旧模式成员混入。

首次启用会使原内存Cookie失效，需要重新登录；共享SQL会话建立后可跨控制器重启恢复。

迁移前协调备份本地 controller.json、账号/审计、配置版本、任务报告及控制 SQL 命名空间。成功启用后，本地控制状态升级为格式3，绑定 clusterId 与共享存储身份。旧程序、关闭 sharedAccess、改到错误集群/缺失存储时拒绝启动，不回退到旧本地授权。格式3是控制状态版本，与任务formatVersion无关。回滚需恢复协调一致的完整备份并复核已撤销凭据；仅换旧JAR不能安全回滚。

导入前的本地历史保留原链和载荷，仍可使用原离线审计导出工具读取。共享链记录迁移锚点（原storeId、最后序号和哈希）。导入后的HTTP、账号及任务outbox事件汇入共享链；不同控制器查看相同storeId。审计接口的pendingOperations当前只表示本入口本地outbox，其他节点的未提交观察仍待全局诊断补齐。共享写确认后才清理本地outbox，重放相同事件ID不重复生成记录，不同载荷被拒绝。

## 生命周期及权限

- A登录后可以在B恢复当前Cookie；A正常关闭、强杀或重开不会清空共享SQL会话。
- B退出会撤销对应会话；任一入口新增/修改/停用/删除账号、轮换令牌或改变授权，都会原子撤销该目录全部旧会话。
- 每次认证/权限检查查询共享权威；存储故障返回503，保留Cookie并等待恢复，不降级为本地账号/内存会话。
- 每次请求读取SQL目录身份/策略/内容摘要和审计锚点；仅复用匹配摘要的已验证不可变目录，数据库查询失败不会从缓存认证。新会话检查当前账号修订；空闲/绝对期限使用数据库时间，节点时钟偏差不延长会话。Cookie/HTTPS/Origin/CSRF及Bearer冲突规则见[会话说明](/docs/zh/reference/browser-sessions.html)。
- 所有成员的会话enabled、Secure/记住浏览器策略、空闲/绝对期限、容量及审计保留设置必须一致；不一致会拒绝加入。publicOrigin可按入口填写，统一HTTPS入口时各节点使用同一外部Origin。
- 账号变更、目录修订、会话撤销及账号审计在同一事务提交。审计失败时全部回滚，旧令牌和会话仍按原目录有效；响应丢失时按已保存新令牌和最新目录核对，不猜测操作未执行。

共享账号最多200；单账号任务授权上限10000，共享目录序列化总量限制4MiB，超过时拒绝本次修改并保留旧目录。会话容量是整个共享目录的总量。审计保留事件数按现有auditMaxEvents设置；非HTTP操作的幂等回执独立保留，目前没有自动清理，需监控SQL磁盘增长，活跃回执/历史节点的治理继续归LG-09。

## Worker凭据边界

任务JVM只接收基础OS变量及任务YAML显式引用的变量；未引用的父进程变量、JAVA_TOOL_OPTIONS、管理令牌和控制库凭据不再自动继承。平台加载配置时记住管理凭据变量名，任务引用这些变量会被拒绝（WORKER_ENVIRONMENT_DENIED）。请为来源/目标/日志配置独立的任务变量，不用管理凭据变量作别名；若任务确需Java TLS/Kerberos设置，应按已验收驱动配置显式提供任务专用设置。

此边界减少进程间非必要凭据传递。Worker仍是可信SDK代码及同一安装用户下的进程；操作系统文件隔离、专用容器/Vault下发和更细的任务密钥权限还需在CP-05后续落实。

## 部署

Linux/Docker在[platform-cluster.yml](/files/config/platform-cluster.yml)基础上开启sharedAccess，每节点保持独立本地目录。Helm使用 [values-shared-access.yaml](/files/deploy/helm/rivomesh/values-shared-access.yaml)，分别安装两个release；手动K8s使用 [shared-a](/files/deploy/kubernetes/rivomesh-shared-a.yaml) / [shared-b](/files/deploy/kubernetes/rivomesh-shared-b.yaml)。Secret继续提供控制库专用账号和密码。真实K8s/CSI/控制面HA仍需后续验收。

## 恢复与FAQ

| 现象 | 处理 |
|---|---|
| 所有管理员令牌丢失 | 在一个节点停止本地控制器，按既有access-recover命令提供受保护的部署ADMIN引导令牌。共享模式会事务更新共享目录、撤销全部会话并记录恢复审计；其他节点不使用旧本地授权。核验后轮换临时令牌。 |
| SHARED_ACCESS_QUIESCENCE_REQUIRED | 先正常停止所有旧成员，不能把STALE当成已停止；无法确认旧入口已隔离时拒绝切换。保留备份并制定隔离/迁移方案，禁止直接把记录改为STOPPED。 |
| SHARED_ACCESS_REQUIRED | 本地格式3已绑定共享权威。恢复正确cluster/sharedAccess设置；不能关闭选项强行使用旧令牌。 |
| SHARED_ACCESS_STATE_REQUIRED / IDENTITY_CHANGED | 找回匹配共享身份的SQL备份/连接地址，核对本地绑定。程序不会从过期配置重新引导丢失目录。禁止删除绑定来绕过撤销历史。 |
| SHARED_ACCESS_DIRECTORY_CONFLICT | 本节点旧托管目录与共享目录来自不同身份。先导出/备份并审阅差异，保留本地历史，再制定合并/采用共享目录的计划；不自动扩大任何人的权限。 |
| SHARED_ACCESS_POLICY_MISMATCH | 核对所有成员期限、Cookie、会话容量及审计保留配置，并使用一致策略重开。 |
| ACCOUNT_DIRECTORY_CAPACITY | 减少无用授权/账号记录或审阅目录容量；失败修改不改变原状态。硬件容量提升不应直接改元数据绕过一致性。 |
| 存储恢复后还需登录？ | 检查会话是否真实到期/退出或被目录变更撤销；合法未过期共享会话可继续恢复，不依赖故障节点内存。 |
| 本地/共享审计序号不同 | 两条独立store链保留各自序号，按迁移锚点和事件ID追踪；不要拼接载荷后伪造同一历史哈希链。 |
| 备份回退会恢复旧权限吗？ | 一致旧备份可能包含旧授权；当前没有外部不可变锚点识别任意一致回退。恢复后必须复核撤销/轮换，相关能力仍在欠项中。 |

首次部署按[首版基线](/docs/zh/reference/first-release.html)一次配置共享身份及任务；已有命名空间不再自动迁移模式。
