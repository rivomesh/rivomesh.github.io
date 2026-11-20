---
kind: docs
locale: zh
title: 多节点部署与恢复
---

# 多节点部署与恢复

RivoMesh 的多节点部署包含节点状态观察、共享访问和同步任务的主备恢复。先按使用目的选择配置，再核对哪些能力已可用、哪些仍在接入。

## 当前可以做什么

| 能力 | 当前行为 | 使用条件 |
| --- | --- | --- |
| 节点目录与心跳 | 在任一入口查看同一集群的节点、运行版本、资源、租约与任务观察 | 配置共享控制库；管理员查看 |
| 共享账号、会话与审计 | 多个入口使用同一账号目录、会话与审计链；账号或权限变更会撤销旧会话 | 显式启用共享访问；已通过 PostgreSQL 17 / MySQL 8.4 双节点专项验证 |
| 管理与执行分离 | 显式分离管理入口与 Agent；已验收管理全停期间原 Worker 继续处理、原请求恢复等场景 | 指定 PostgreSQL / MySQL 控制库、LOCAL/H2 日志、MySQL 源及 MySQL / PostgreSQL 目标；其他组合另验 |
| 同步任务主备恢复 | 符合条件的备用工作进程按日志租约接管，从持久进度继续 | 使用外部事务日志、相同逻辑任务与目标配置、不同节点标识；按任务手册验收 |
| 跨节点任务查询与操作 | 可选全局模式提供共享任务视图、持久命令、配置历史和远程只读查询 | 默认任务操作针对本机；可选固定执行节点的全局模式已接入 HTTP 与管理界面 |

同一任务的主备节点依次取得执行权，不会将一条任务拆成多个节点并行处理。多个独立任务可各自运行独立工作进程。

## 1. 准备节点与存储

每个节点使用唯一、稳定的节点标识，并保留独立的控制器、任务、配置版本、报告和密钥目录。不要把同一个控制目录或 `controller.json` 挂给多个控制器。

共享存储的两种用途需要分别配置：

- **共享控制库**：保存节点目录；启用共享访问后，还保存统一账号、会话和审计。
- **外部事务日志**：保存同步事件、快照及各目标确认进度，支撑跨主机续传。只配控制库不会自动让本地同步日志跨机器可用。

首批控制库验证环境为 PostgreSQL 17 / MySQL 8.4。日志可使用 PostgreSQL、openGauss 或独立 MySQL；具体版本和恢复条件见[同步运行手册](../reference/pipeline-v3)。

## 2. 配置共享节点目录

在每个节点以核心项目的 [platform-cluster.yml](/files/config/platform-cluster.yml) 为基础配置。以下为共享控制库部分，其他服务设置保留：

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

同一集群使用相同控制库和命名空间，各节点使用不同 `RIVOMESH_NODE_ID`。管理员进入“节点目录”，核对节点标识、版本、最后心跳与租约。`HEALTHY` 只表示节点租约有效，不代表每条同步链路健康；`STALE` 表示观察已过期，不能据此认定旧进程已经停止。

## 3. 按需启用共享访问

在上述 `cluster` 配置中增加 `sharedAccess: true`。所有节点的会话与审计策略需一致；远程访问配置 HTTPS 和正确的 Cookie / Origin。

初始化命名空间前选定访问与任务模式。当前候选版对模式不匹配直接拒绝，即使全部成员已停止。操作要求见[首版部署基线](../reference/first-release)。仅共享访问模式的任务控制仍访问任务所属节点；进一步启用全局任务模式后，可以通过不同入口提交固定执行节点的任务请求。

详细步骤与失败恢复见[共享账号、会话与审计](../reference/shared-access)。不能通过关闭共享访问回退到旧权限目录。

## 可选：固定执行节点的全局任务控制

最新源码通过 `cluster.sharedTasks: true` 在共享访问基础上启用全局任务模式，所有节点还需配置相同的受保护 `taskKey`、控制库及命名空间，每个节点保留自己的稳定标识和持久目录。完整配置见[全局模式示例](/files/config/platform-global.example.yml)与[全局控制手册](../reference/global-control)。

首次启用要求没有既有本机任务的目录；旧任务尚无自动导入工具。共享存储接受命令后，还需查看原请求的实际执行回执。固定执行节点失联时显示等待或未知，不能把收到请求当作任务已完成，也不能自动换节点执行。

管理入口与 Agent 分离部署需显式配置角色。已验证使用 PostgreSQL / MySQL 控制库及 LOCAL/H2 日志时，所有管理入口停止期间原 Worker 可继续执行，并在入口恢复后查询原请求回执。见[执行生命周期手册](../reference/execution-lifecycle)。

### 自动分配新任务

在新建向导或导入时选择自动分配。使用 MySQL 或 PostgreSQL 源、MySQL 或 PostgreSQL 目标及外部 PostgreSQL 日志时，最多三个候选 Agent 按容量顺序核对 Temurin 21 Worker、连接器组件和日志连接。全部未通过时会返回 `AGENT_PLACEMENT_UNAVAILABLE`。先修复驱动、凭据或网络，再重新提交。其他组合按容量分配。保存后查看实际所属 Agent，执行源端和目标端的连接与对象检查。

### 审批移交已冻结的任务

当前离线移交档案要求 MySQL 源、MySQL 或 PostgreSQL 目标、预先绑定的管理型日志写入权，以及位于同一 PostgreSQL 数据库中的控制库和外部日志。

1. 在原 Agent 健康时停止任务，核对各目标在同一位置确认。评估候选 Agent，预留任务与 Worker 容量，并在其独立持久目录封存完整的已完成回执。
2. 审阅 `CLOSED_RECEIPTS_ONLY` 清单，确认不存在需要另外移交的原始采集文件、故障证据或报告，再显式冻结原写入权。
3. 若原 Agent 在冻结后不可用，核对原租约已过期、封存内容与目标断点仍一致，由有权限的管理员审批变更归属。候选获得任务时仍处于停止状态。
4. 等待证据接收完成，单独审批目标隔离，再启动候选 Worker。保留原请求 ID 和回执。

冻结前意外失去原 Agent 时，先恢复原 Agent 及其目录与密钥。操作条件与各状态回执见[全局控制手册](../reference/global-control)。

## 4. 配置同步任务主备恢复

跨主机恢复使用 `EXTERNAL` 外部事务日志。备用工作进程使用相同日志实例、命名空间、任务标识、源库映射与目标配置，以及不同的节点标识。只有取得有效租约的进程才能工作，目标写入还会校验执行代次，阻止旧进程继续写入。

本地日志适合同机试用与持久目录内的恢复；丢弃日志后只保留目标断点，无法恢复完整任务。源库主从提升或 MGR 选主由数据库高可用系统负责，RivoMesh 会检查所需日志与进度条件，不替数据库提升主库。

执行停止操作时区分：

- **停止本机 Worker**：只停止当前机器进程，其他符合条件的备用进程可能接管。
- **暂停共享任务**：阻止备用进程直接接管；仍需核对各目标是否已确认隔离。

配置、命令与首批恢复记录见[多库、多目标运行手册](../reference/pipeline-v3)和[恢复规则](../reference/recovery)。

## 5. Docker、Helm 与 Kubernetes

Linux / Docker 节点保持独立数据目录。Helm 按节点分别安装 release，使用 [values-cluster.yaml](/files/deploy/helm/rivomesh/values-cluster.yaml)；共享访问使用 [values-shared-access.yaml](/files/deploy/helm/rivomesh/values-shared-access.yaml)。原生部署模板见[节点目录手册](../reference/node-registry)。

现有双节点 Kubernetes 实测覆盖同卷重挂载、镜像与配置替换、Secret 轮换及使用外部日志的恢复。跨节点卷可用性和额外的高可用场景须按部署环境验证，见[执行生命周期手册](../reference/execution-lifecycle)。

## 上线前验证

核对双节点观察、跨入口登录与退出、账号撤销、控制库中断恢复、工作进程强制终止及积压追平。恢复后检查目标实际业务值，并确认旧进程不能越过执行权校验。备份需覆盖控制库、各节点目录、事务日志和目标状态。

全局任务、远端命令、配置历史与只读查询的最新接入进展见[跨节点任务控制进展](../reference/global-control)。已有组件专项测试与完整双节点业务验收分别记录。

## 控制台中的节点目录

<ScreenshotPreview name="node-registry" locale="zh" alt="RivoMesh 中文控制台中的节点登记档案。" />
