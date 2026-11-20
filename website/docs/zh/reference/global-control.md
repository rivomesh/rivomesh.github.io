---
kind: docs
locale: zh
title: "跨节点任务控制"
sourcePath: docs/zh-CN/global-control.md
---

# 全局任务控制：启用、恢复与边界

[English](/docs/en/reference/global-control.html)

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

登录响应的 taskControlScope=GLOBAL 表示全局模式。任一入口可分页读取授权任务，展示 owner、节点状态、全局修订、Worker 状态、目标/有效配置和命令结果。创建和导入可指定执行节点，也可自动分配。导入会创建一份新任务。节点不可用时状态为 UNKNOWN，不能认为同步进程已停止。

创建、编辑、恢复和动作返回 202，只表示共享存储已接受。配置历史区分 desired/active，只有 owner 成功应用才更新有效版本；失败提案保留，旧有效配置继续有效。配置编辑、历史和保密字段引用可跨入口使用。连接预览、原始差异和修复计划等只读操作通过有期限的 owner 查询通道执行，owner 离线时不能完成。完整过滤、全量日志聚合、真实浏览器视觉/可访问性验收仍开放。

全局 maximumTasks/maximumCommands 与每节点 maxTasks/maxRunningTasks 是不同预算。当前默认全局任务上限 10000、活动命令上限 1000，配置范围见示例/Schema；这只是资源保护参数，不是硬件吞吐承诺。查询请求最多 512KiB、响应 1MiB，有效期 1–60 秒；线程池和保留容量均有界。

全局任务列表支持按精确任务 ID 或执行节点 ID 筛选，也可以同时使用两项。`GET /api/tasks?ownerNodeId=agent-a&taskId=orders&limit=20` 先应用当前授权和筛选条件，再计算总数及下一页。使用 `after` 时保持原筛选条件。在任务详情中选择目标可单独查看该目标的状态、SQL 故障及待确认日志事务。积压数是观察时已采集序号与安全覆盖序号的差值，观察过期时隐藏。消费者完成时间需单独度量。[验收证据](/docs/zh/evidence/baseline.html#global-task-filters-and-destination-backlog)

管理员可在 **诊断记录** 中从 **采集端** 切换到单个目标。接口为 `GET /api/tasks/orders/diagnostics?subscriptionId=warehouse&limit=20`。记录包括目标故障暂停、重试及重试结束的观察时间。采集和目标事件分开保存在执行 Agent 的私有日志目录内。同一任务的目标共用两段各 64 KiB 的滚动文件，频繁故障时早期记录可能轮换。使用 `after` 翻页时保持相同目标。记录已脱敏，只包含事件类型及元数据。重试结束表示 Worker 已观察到恢复，可用目标确认序号及待确认数量判断投递进度。

同一 Agent 的管理入口共用诊断读取额度，每秒 8 页，允许突发读取 16 页。每页最多 25 条。收到 HTTP 429 和 `DIAGNOSTICS_RATE_LIMITED` 时，等待 `Retry-After` 指示的时间，再使用原游标重试。任务状态和控制命令有各自的请求路径。

PostgreSQL 源写入事务型 SQL 目标时，任务状态的 `lastDeliveryTiming` 展示各目标最近一次可核验的提交到确认延迟。它以逻辑复制协议的源提交时间为起点，以 Worker 收到目标提交成功响应为终点，包含通信耗时。源库和 Worker 应同步时钟。终点早于起点时，接口返回 `CLOCK_SKEW`，不提供耗时。两个时间均为 UTC，毫秒数及日志序号使用十进制字符串。[PostgreSQL 逻辑复制消息格式](https://www.postgresql.org/docs/17/protocol-logicalrep-message-formats.html)

每个样本对应一笔已确认事务。任务暂停、重试或有积压时，界面标记为历史样本。首次采样前，以及推进确认序号时没有直接观察到目标提交响应的情况，状态为 `UNKNOWN`。空投递、快照、屏障、跳过和提交结果核对不会产生样本。可根据运行状态、积压数和连续投递序号判断当前进度。Worker 重启或原日志记录已回收后，仍可读取最近确认序号对应的样本。

将 `source.expectedVersion` 固定为 `"8.4"` 或具体的 8.4 补丁版本时，MySQL 8.4 主库的直接写入也会采样。使用未启用写入者分配的本地或外部日志，以及事务型 SQL 目标。起点取自标准 GTID 事件中的微秒字段 `original_commit_timestamp`，并核对源库身份和版本。只有事务由当前主库发起且原始与即时提交时间相同时才采样。中继事务、旧版本 binlog、时间元数据缺失、Group Replication 和启用写入者分配的日志返回 `UNKNOWN`。Group Replication 在事务进入认证阶段前生成原始时间。[MySQL 复制延迟时间戳](https://dev.mysql.com/doc/refman/8.4/en/replication-delayed.html) · [GTID 事件格式](https://dev.mysql.com/doc/dev/mysql-server/8.4.13/classmysql_1_1binlog_1_1event_1_1Gtid__event.html)

### 新任务自动分配

创建向导或导入 YAML 时，可选择 **自动分配执行 Agent**。共享控制库在授权范围内选择在线且有任务容量的 Agent，按已分配任务占 `maxTasks` 的比例排序，并在保存任务的同一事务中预留一个槽。API 可向 `POST /api/tasks` 提供配置、`placement: "AUTO"` 和 `X-Request-ID`。指定 Agent 时填写 `ownerNodeId`。

对于使用 MySQL 或 PostgreSQL 源、MySQL 或 PostgreSQL 目标及外部 PostgreSQL 日志的 V3 任务，自动放置按容量顺序检查最多三个符合资格的 Agent。各 Agent 核验实际 Java 21 Worker 启动器，以及源、目标和日志所需的本机组件，再使用配置中的凭据连接日志库，限时执行只读 `SELECT 1`。源或目标使用 MySQL 时需要 Connector/J，只有 MySQL 源需要 binlog 读取器。验证失败的候选不会获得任务归属。候选均失败时返回 `AGENT_PLACEMENT_UNAVAILABLE`，全局任务和日志保持原样。修复驱动、凭据或日志路由后可重试原创建请求。

该检查确认放置时日志连接可以认证。创建后可通过 **检查连接与对象** 检查源及目标。其他连接器和日志档案沿用现有的容量分配规则。

任务列表显示实际分配节点。已接受的任务可从任一 Controller 用相同请求 ID 和配置读回原归属，即使集群的任务槽后来已满。

### 评估任务迁往另一 Agent

在任务详情选择 **评估 Agent 接管**，从节点目录挑选候选 Agent，再记录评估。窗口展示候选节点的登记状态和回执中的阻断条件。选择 **刷新节点和评估** 可从任一入口读取最新信息。提交结果未知时，**重试同一评估** 会复用原请求 ID 和参数。其他入口已更新评估时，先核对新回执，再决定是否提交新的评估。

管理员可在任一管理入口发送 `POST /api/tasks/{id}/handoff`。请求头填写 `X-Request-ID`，JSON 写入候选 `candidateNodeId` 和任务 `expectedRevision`。通过 `GET /api/tasks/{id}/handoff` 查询最新评估。刷新时使用新的请求 ID，并把当前评估 ID 填入 `expectedAssessment`。原样重试当前请求会返回同一条评估。调用者须有任务和两端 Agent 的授权。

评估绑定任务修订、已生效配置、两端 Agent 注册身份、候选任务容量及来自原 Agent 的采集观察。针对 MySQL 源、PostgreSQL 外部日志和 PostgreSQL/MySQL 目标，检查是否有未结束命令、已完成快照以及各目标追平的共同位点。位点、待处理命令、Agent 注册或容量变化时标为 `STALE`。接口以摘要表示检查点，响应中不含源位点原文、凭据和私有恢复文件。

`EVIDENCE_REQUIRED` 表示管理端检查通过，还需核实候选 Agent 的连接能力及原恢复报告和回执的可达性。`BLOCKED` 会给出 Worker 尚未排空、任务容量耗尽等条件。评估保留原任务归属、Worker、容量和日志状态，返回 `executionAuthorized: false`。

发送 `POST /api/tasks/{id}/handoff/probe`，在 JSON 中写入 `expectedAssessment`。候选 Agent 使用本机连接和密钥环境，核对原日志代次、MySQL GTID 历史，以及 PostgreSQL/MySQL 目标的原生回执。两条只读查询在 30 秒内有效，完成时重新核对任务修订和两端 Agent 注册身份。脱敏结果保存在最新评估中。评估过期或被替换后，需要刷新才能再次核验。

原 Agent 返回私有校验报告、源证据和故障证据目录是否存在，以及保留的操作回执数量。清单保留原 Agent 的资料归属，并返回 `ORIGINAL_PRIVATE_EVIDENCE_CUSTODY_UNPROVEN`。候选核验有效期内，连接阻塞项会清除。结果继续返回 `executionAuthorized: false`。

要核验已完成的校验报告，请在两个 Agent 上挂载同一份受保护的存储，并分别配置 `cluster.handoffEvidenceRoot` 为已存在的绝对路径。挂载目录须使用 POSIX 仅所有者权限。原 Agent 要有写权限，候选 Agent 要有读权限，存储还要支持文件锁和同目录原子改名。既有任务和部署继续使用原报告目录。

使用 Helm 时，为两个 Agent 发行版的 `cluster.handoffEvidenceClaim` 填写同一个已存在的 ReadWriteMany PVC。每个 Agent 的 `persistence.existingClaim` 填各自已初始化的私有状态 PVC。Chart 把共享卷挂载到 `/app/handoff-evidence` 并配置 Rivomesh。两个卷均须事先为 UID/GID `10001` 准备权限，共享卷根目录使用 `0700`。此档案省略 Pod 的 `fsGroup`，由存储端保留文件权限。[Kubernetes 卷权限](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#configure-volume-permission-and-ownership-change-policy-for-pods)

使用原生 Kubernetes YAML 时，在两个 Agent Deployment 中挂载同一份已有 PVC 到 `/app/handoff-evidence`，各自的状态 PVC 继续挂载到 `/app/data`。此档案省略 `spec.template.spec.securityContext.fsGroup`，在两个 Agent ConfigMap 配置 `cluster.handoffEvidenceRoot: /app/handoff-evidence`。存储权限准备完成后滚动更新 Agent。

原 Agent 在每份已完成报告的文件锁下，按原字节导出 `rows.mv.db` 和 `summary.json`。每次最多处理 32 份报告，报告与历史故障证据共用 64 MiB 数据上限，写完后才替换该原任务的上一份导出。候选 Agent 核对归档摘要、评估 ID、任务修订和两端目录身份。`probe.sharedReportCustody` 返回核验结果、大小和摘要，报告数据保留在受保护的挂载上。原始归档、签名密钥与修复计划由原 Agent 的私有目录保管。核验保留原任务归属，返回 `executionAuthorized: false`。

同一次核验可用 `probe.sharedReceiptCustody` 查看已结束的操作回执。原 Agent 会将已认证的全局命令与本地请求签名、操作者和执行结果核对，只归档匹配的已结束回执。候选 Agent 独立核对共享归档的原字节。该流程覆盖单任务最多 64 条全局命令。回执缺失、已清理、内容不匹配或操作未结束时，保留未核验状态。接口返回数量和摘要。回执导入与执行接管需单独核验。

`probe.sharedFailureEvidenceCustody` 显示最多 64 条历史故障记录的保管核验结果。原 Agent 在存储锁内核对权威记录的任务及节点作用域，并验证每条保留记录的 HMAC 和内容摘要。归档保存权威记录和故障记录的原始字节，签名密钥由原 Agent 保管。候选 Agent 根据已认证的原 Agent 返回值核对归档摘要、评估作用域以及条目数量和格式。权威记录缺失、原始内容变更或存储锁被占用时，原 Agent 拒绝发布本次归档。接口显示数量、大小和摘要。使用历史记录执行恢复仍需原有授权和密钥。

`probe.sharedRawCaptureCustody` 通过独立的私有 ZIP 核验已认证的 MySQL binlog 归档。原 Agent 在归档锁内验证每个文件的 HMAC 回执，并核对准确文件名、大小、摘要和原持有方，然后导出完整原文件与回执。候选 Agent 从已认证的 Agent 通道取得绑定评估范围的 ZIP 摘要，再核对 ZIP 与每个文件的摘要及大小。单任务最多纳入 64 份原始归档，共用独立的 64 MiB 上限。存在未认证的旧文件、回执缺失或内容变更时，源证据核验拒绝，校验报告 ZIP 可继续核验。原 Agent 使用本地私有密钥证明真实性。管理接口只显示核验状态、数量、大小与摘要。该 ZIP 用于核验，写入接管需另行隔离与批准。

两端 Agent 验证原任务已停止、精确切点和闭合回执后，评估接口返回 `preparationEvidenceSha256`。若原 Agent 有校验报告目录，还须完成报告托管核验。管理员可以向 `POST /api/tasks/{task}/handoff/preparation` 提交 `X-Request-ID`，请求体包含 `expectedAssessment`、`expectedRevision` 和 `expectedEvidenceSha256`。同一路径的 `GET` 可查询最新准备记录、到期时间和原、候选 Agent 身份。

准备记录按控制数据库时钟在 15 分钟后到期。到期或解除前，该任务暂停接收新命令和配置修改，候选 Agent 预留一个任务槽和一个 Worker 槽。首版将候选 Agent 的每个已分配任务都计作潜在 Worker，包括已停止的任务。显式和自动分配都计入预留。当前管理员可向 `POST /api/tasks/{task}/handoff/preparation/release` 提交 `X-Request-ID` 和 `expectedPreparation`，立即解除预留并恢复对原任务的操作。相同操作者以相同输入重放已接受请求时，可以读到解除或到期后的记录。准备阶段保留原任务归属和日志写入代次。执行接管还需要通过源端和故障证据核验，并验证数据日志和控制库的写入隔离。

准备记录有效时，管理员可通过 `POST /api/tasks/{task}/handoff/preparation/stage` 暂存已核验的证据。提交 `X-Request-ID`、`expectedPreparation`、`expectedRevision` 和 `expectedEvidenceSha256`。候选 Agent 核对原归档摘要及作用域，在报告锁内验证已完成报告，并将逐文件 SHA-256 写入认证清单。核验后，候选 Agent 在私有状态路径原子发布暂存目录。获授权的请求重放会重新核对已暂存文件。Agent 重新登记、准备记录到期或解除后，需要重新审阅。响应返回数量和 `executionAuthorized: false`。暂存范围是已完成报告和已结束回执。暂存报告使用独立的文件名，常规校验报告读取命令会拒绝打开暂存目录。每个候选 Agent 最多保留 16 个暂存目录，包含中断的暂存。候选 Agent 的任务注册表、原位报告路径及日志写入权保持不变。

对于新建的固定归属 MySQL 任务，如果使用 PostgreSQL 外部日志和 MySQL 或 PostgreSQL 目标，可将 `nodeId` 设置成已登记的原 Agent ID，将 `journal.managedWriter` 设置为 `true`，并将 `journal.writerAssignment` 设置为新增的 UUID。先使用日志库连接配置运行 `java -jar rivomesh.jar init-writer task.yml`，再在指定 Agent 上创建任务。自动分配和普通配置编辑均不能改动该写入绑定。既有未绑定日志需要独立迁移。即使候选配置省略 `managedWriter`，独立 `transfer-writer` 命令也会拒绝移动此日志。

核验通过的准备记录保存原写入分配和该请求的私有后继分配，接口通过 `writerActivation` 返回摘要。控制库和日志库配置同一个 PostgreSQL JDBC 地址，且控制库账号可锁定日志行时，`checkedInControlTransaction` 表示控制事务已核对原日志租约已过期或释放，以及源检查点和所有已确认订阅位置。核对期间，任务和日志写入归属仍由原 Agent 持有。

受管任务的 PostgreSQL 控制库和日志同库时，暂存回执可包含 `offlineInventory` 和 `profile: CLOSED_RECEIPTS_ONLY`。原 Agent 停止后确认其私有目录没有报告、失败记录、原始采集或此前接收的历史。Controller 将所有结案回执与当前已认证的命令历史逐笔核对。候选 Agent 将准确回执内容密封到私有卷。共享传输归档不可用后，也能在该卷复核。候选状态路径和共享归档路径必须独立。用于容灾时，将候选私有卷置于不同的存储故障域。此前已密封的普通暂存仍可按原回执复核。要认证完整库存，需要重新准备交接。这份回执认证上述范围内的完整库存。冻结写入者和切换归属仍需单独执行。

在控制台打开 **评估 Agent 接管**。证据核验通过后，点击 **预留任务槽和 Worker 槽**。可从任一 Controller 查询同一回执和到期时间。预留有效时，点击 **暂存报告和回执**，将已核验的报告和已办结回执复制到候选 Agent 的私有目录。候选 Agent 核验后，界面显示报告和回执数量。可点击 **复核已暂存的报告和回执** 再次核验。通过任一入口重新打开面板后，**暂存报告和回执** 也会核验同一预留已有的暂存副本。需要继续操作原任务时，先点击 **解除预留**。

控制事务提交任务归属后，打开交接面板并点击 **刷新交接状态**。**归属已提交** 表示候选 Agent 尚待安装已审阅的配置。**候选配置已安装** 表示候选 Agent 已保存停止状态的任务。**证据已接收** 还会显示候选 Agent 已核验并接收的报告和已办结回执数量。面板按候选 Agent 和已提交配置显示签名回执。授权启动后，日常操作产生的新任务修订仍可查看同一交接回执。管理员须有该任务及原、候选 Agent 的授权。

同库档案通过内部换权安装原报告和闭合回执。候选 Agent 在原断点只读提供历史，两入口均可访问。候选停止期间，`HANDOFF_PARKED` 和日志格式 15–18 隔离直接 Worker 启动及通用恢复。使用该档案前升级共享此日志的 Controller 和 Agent。老版本程序会拒绝新格式。归属切换和目标隔离完成后，还须独立审批 Worker 启动。

### 冻结原写入者

原 Agent 健康、任务已停止且各 SQL 目标确认同一切点后，管理员可冻结原写入者。该流程要求初始受管日志分配、同一个 PostgreSQL 控制及日志库，以及已暂存的 `CLOSED_RECEIPTS_ONLY` 库存。保留暂存响应中的 `offlineInventory.manifestSha256`。提交冻结时，两端 Agent 绑定和任务修订仍须有效。

向 `POST /api/tasks/{task}/handoff/preparation/freeze-original` 提交新的 `X-Request-ID` 及四个 JSON 字段 `expectedPreparation`、`expectedRevision`、`expectedEvidenceSha256`、`expectedInventorySha256`。库存字段填写暂存清单摘要。候选复核准确的私有副本，原 Agent 复核停止任务、完整本地回执与当前原生切点。共享 PostgreSQL 事务提高日志纪元、清除原日志租约并记录 `ORIGINAL_FROZEN`。可从任一 Controller 的准备回执查看冻结纪元。任务仍归原 Agent，目标数据保留在原切点。冻结期间拦截普通 START、配置变更、解除预留和归属确认。

取消冻结时向 `POST /api/tasks/{task}/handoff/preparation/cancel-freeze` 提交相同四个校验值及另一请求 ID。原 Agent 必须使用同一私有目录并处于健康状态，进程重启后也可重新认证。取消会再次核对原库存与原生切点，只允许操作仍处于冻结阶段的记录。原分配在更高的未领取日志纪元恢复可用，任务仍需显式启动。重放同一请求返回已记录的阶段。原 Agent 离线时，取消冻结须先恢复该节点。

### 原 Agent 丢失后切换已冻结任务

使用原 Agent 健康时记录的冻结回执和候选 Agent 绑定。原节点须在数据库时钟判定其已登记租约过期后显示 `STALE`，管理员须确认原 Agent 已无法使用。租约仍有效、原租约身份变化或候选不可用时拒绝切换。若意外丢失发生在持久冻结之前，须恢复原 Agent 及其私有状态。

在交接面板打开冻结准备回执，刷新到原 Agent 租约显示过期。核对冻结请求和库存摘要，确认原 Agent 已无法使用，然后点击 **切换已冻结任务的归属**。如需自动化，发起冻结的管理员可从任一 Controller 提交 `POST /api/tasks/{task}/handoff/preparation/commit-offline-owner`。使用新的 `X-Request-ID`，保留冻结请求的四个校验值，并添加 JSON 布尔值 `"confirmOriginalUnavailable": true`。提交时按当前授权核对原冻结管理员的任务和两 Agent 权限。候选再次核验私有密封库存与源库、各目标的原生切点。候选副本核验通过后允许共享归档暂不可用。候选副本缺失或被修改时拒绝切换。

共享 PostgreSQL 事务切换任务归属，并将冻结时尚无 Worker 领取的日志纪元分配给候选。候选以停止状态安装配置及已办结回执。可从任一 Controller 查询签名准备回执，`offlineOwnerCommit` 中包含冻结和审批请求标识。响应丢失后由同一管理员携原请求 ID 重试同一内容。提交后原写入分配已退役，旧 Agent 即使带原目录返回也无法夺回写权。

等回执显示 `EVIDENCE_ADOPTED` 后，审批 **隔离 SQL 目标**，等待 `TARGETS_FENCED`，再另外审批 **启动候选 Worker**。候选从同一切点恢复写入。该流程要求初始受管 MySQL 源日志分配、控制与日志共用一个 PostgreSQL 数据库、目标为 PostgreSQL 或 MySQL，以及完整的 `CLOSED_RECEIPTS_ONLY` 冻结档案。

### 确认归属切换

对同库管理的 SQL 交接完成预留并核验暂存证据后，点击 **确认切换归属**。提交前，候选 Agent 再次核对私有文件、写入配置和授权。原 Agent 必须已停在审阅过的断点。仍有待接收的源证据或故障证据时，系统会拒绝切换。

自动化可调用 `POST /api/tasks/{id}/handoff/preparation/commit-owner`，携带 `X-Request-ID` 和 `expectedPreparation`、`expectedRevision`、`expectedEvidenceSha256` 三个字段。使用准备记录里的原任务修订和摘要。Controller 从签名记录获取候选的私有配置和准备记录。接受切换时，控制库在同一事务切换归属并停驻日志。候选随后以停止状态安装任务并接收报告历史。

Controller 断开后，可通过任一入口读取最新准备记录。若请求已绑定，用同一请求 ID 重试。准备记录在请求绑定和切换提交后都会返回 `commitRequestId`。提交前审阅的断点、候选绑定或授权变化时，需重新准备。

### 日志库和控制库分离时核验交接

受管理的 PostgreSQL 日志库与控制库分开时，可审阅原任务的停机切点，并在预留期间暂存报告和已办结回执。候选 Agent 需要同时访问控制库、日志库、源库和目标库。日志链路恢复后可以重新探测。共享归档不可用时，可重试暂存请求核验候选已有的私有副本。

界面会显示归属切换受阻的原因。准备回执返回 `checkedInControlTransaction: false` 和 `commitBlocker: HANDOFF_MANAGED_CONTROL_CUT_REQUIRED`。两个入口都在绑定请求之前拒绝归属提交，原 Agent、日志断点和目标回执保持原状。释放预留后可在原 Agent 从同一切点启动。异库归属激活需要独立的持久化协议。

### 隔离已停驻任务的 SQL 目标

候选 Agent 接收签名报告和回执历史后，管理员可在交接面板选择 **隔离 SQL 目标**。通过 API 审批时，提交 `POST /api/tasks/{id}/handoff/preparation/fence-targets`，携带 `X-Request-ID`，请求体传入 `expectedPreparation` 和 `expectedRevision`。使用交接面板里的准备 ID 和**已提交的任务修订**。返回 `202` 表示审批已持久化。刷新交接面板或调用 `GET /api/tasks/{id}/handoff/preparation`，可查看 `FENCE_PENDING` 和 `TARGETS_FENCED`。

首个档案覆盖 MySQL 源、同一个 PostgreSQL 控制与日志库，以及最多八个原纪元相同的 PostgreSQL 或 MySQL 目标。候选 Agent 独立核对已安装配置、归档证据、源日志覆盖、原目标断点和快照。每个目标在自己的断点行锁下提高写入纪元。目标事务回执、快照 ID、源断点都保留在原切点。日志继续停驻，候选 Worker 保持停止。

用同一个请求 ID 可从两个 Controller 读取同一审批和回执。候选 Agent 或数据库中断时，原审批保持待处理，候选恢复后根据原生目标纪元续跑。已有审批有效时拒绝替换请求。授权在待处理期间变化时，有权限的管理员可刷新面板并点击 **重新审批目标隔离**。API 重新审批时使用新的请求 ID。若发现切点或快照变化，状态保持待处理。交接面板显示最近的阻塞原因和核验时间，候选日志同时记录 `HANDOFF_TARGET_FENCE`。批准 Worker 启动是后续独立步骤。

### 启动候选 Worker

显示 **目标已隔离** 后，点击 **启动候选 Worker**。通过 API 可调用 `POST /api/tasks/{id}/handoff/preparation/start-worker`，使用新的 `X-Request-ID`，并传入与隔离请求相同的 `expectedPreparation` 和 `expectedRevision`。请求结果不明确时，用同一个请求 ID 和请求体重试。

| 交接状态 | 核查方式 |
| --- | --- |
| `START_PENDING` | 审批已持久化。候选 Agent 再次核验源断点和各目标原生检查点。核验失败时 Worker 保持停止。刷新交接面板可查看最近的阻塞原因和核验时间。 |
| `WORKER_ADMITTED` | 共享 PostgreSQL 事务同时开放候选写入绑定并记录审批。候选 Agent 继续保存本地启动意图。 |
| `WORKER_PROJECTED` | 候选 Agent 已保存启动意图。请在任务详情检查 Worker 运行状态和捕获租约。 |

日志格式 19–22 记录已授权的写入绑定、保留已启用的恢复能力，并隔离较早版本。候选 Worker 按正常并发配额领取独占租约，继续使用原源断点和快照。启动意图保存后可使用普通任务控制。之后操作员停止任务时，重放交接审批会保留停止状态。旧报告和已办结回执按任务与节点授权读取，新校验报告写入候选的日常目录。

待审批期间若目标回执变化、源日志不可用或管理员授权撤销，任务继续停驻。先查看候选日志并恢复已审阅的库状态。授权修订变化后，有权限的管理员可刷新面板并点击 **重新审批启动**。API 使用新的请求 ID，并沿用原准备 ID 和已提交任务修订。本流程采用与目标隔离相同的 PostgreSQL 同库控制与日志库，以及受支持的 MySQL、PostgreSQL 目标。主机自动接管、网络分区恢复另行验收。

## 接受、执行和恢复

PENDING 表示持久排队；DISPATCHED 表示交给固定 owner，调用前保存原本机请求与原修订；ACCEPTED 表示本机已持久接受；SUCCEEDED/FAILED 来自实际操作回执。UNKNOWN 表示证据不足，不能伪装成功，也不能换新修订重新执行。重启先恢复原回执保护及配置权威校验，再允许本机调度。

新启动恢复修正：先按游标读取全部活动命令，包括尚未派发的 STOP/PAUSE。它们在本机持久接受前阻止对应 Worker 恢复旧 RUNNING 意图；旧操作仍可结束，停止命令会优先重试。权限变化导致拒绝后解除阻止；结果不明时继续保留。该修正已通过专项测试和应用构建，真实业务验收结果以候选包归档为准，不追溯覆盖此前候选。

TASK_BUSY/OPERATION_PENDING 保持原请求等待。未确认的本机回执不会按普通 500 条窗口回收。取消有父请求和预留容量：未派发时原子取消，派发不明时先恢复证据，本机接受后才实际取消。取消成功不等于所有目标回滚。

owner 失联期间 STOP 保持等待。恢复时使用原节点的私有目录或卷及其密钥。合并部署时，控制器关闭会停止本机 Worker。分离部署时，Agent 有独立的运行生命周期。源 MySQL 主库切换需要独立的恢复流程。

### 原 Agent 突然离线

1. 从任意管理入口打开同一任务。**执行节点控制租约**显示共享控制库的当前租约。任务接口 `GET /api/tasks/{task}` 同时返回 `ownerControlState` 和原有的 `ownerState`。后者仍包含任务观察更新状态。控制租约过期时，Worker、运行意图和采集租约显示 `UNKNOWN`，任务归属和修订保持原值。同一节点 ID 的新进程可能先取得有效控制租约。原任务会继续显示登记中，Worker 和采集仍为 `UNKNOWN`。如果新进程使用其他私有目录，绑定会以 `AGENT_DIRECTORY_CHANGED` 拒绝。
2. 在 **评估 Agent 接管** 中查看 **原 Agent 控制租约**。此前的评估会成为 `STALE`。用新请求重新评估时，`ORIGINAL_TASK_STATE_UNVERIFIED` 表示无法确认原 Worker 已停及其原生断点。核验会拒绝该评估，候选端无法据此取得任务归属或启动权限。
3. 若希望原 Agent 重启后保持停止，可从任一入口提交一次 STOP，并记下请求 ID。使用原有持久目录、密钥和节点身份重启原 Agent，STOP 入队会推进任务修订并保留原配置版本。等待同一请求变为 `SUCCEEDED`，且两处都显示 Worker `STOPPED`、采集租约 `UNCLAIMED` 或 `EXPIRED`。重启期间保持源日志保留。核对目标位置后，再显式启动原任务。

控制租约和日志采集租约使用各自的原生围栏。原 Agent 在同一目录重新注册时进入新控制代次，Worker 启动后领取新采集代次。两项租约的到期都无法证明 Worker 已排空、私有恢复证据完整，或两个目标都停在已审阅的切点。控制和日志同在 PostgreSQL 的原子提交仍要求原 Agent、源端和目标端的最新核验，以及管理员审批。针对无法恢复原 Agent 或长时间网络分区的场景，保持原任务归属并恢复证据后再继续。

原 Agent 不可达时，打开管理端交接回执可查看上次排空的切点、报告和回执归档，以及历史评估是否匹配当前任务。离线面板只读。实际接管需要完整的独立归档和持久写入围栏。

### 控制网络非对称分区

控制库与日志库位于同一个 PostgreSQL 实例及数据库时，原 Agent 可能失去到该库的连接，同时仍然能够连接源库和目标库。控制租约到期后，两个管理入口都显示 `STALE`。在收到当前代次的签名观察前，Worker、运行意图和采集租约均显示 `UNKNOWN`。

原 Agent 失去控制权时，会封闭托管日志 Worker 的启动入口并终止相应本机进程。原有运行意图和日志断点继续保留。链路恢复后，原 Agent 在同一个进程中重新验证签名目录、当前租约代次和任务配置。确认旧 Worker 已退出并读取持久化的 STOP、PAUSE 后，才重新允许托管 Worker 启动。

如果希望任务在链路恢复后保持停止，可从任一 Controller 提交 STOP。使用同一请求 ID 确认 `SUCCEEDED` 并检查原任务已停止，再显式启动。保留源日志，分区时若有在途事务也应核对两个目标的回执。租约过期不赋予候选 Agent 任务归属。控制库与日志库分离、特定目标链路中断或原 Agent 私有证据丢失时，需要独立核验。

#### SQL 目标有在途事务

每个 SQL 目标都有自己的原生事务回执和日志确认位置。控制链路分区时，日志中可能已经保存源事务，同时一个目标仍在等待行锁。先核对保留的事务序号及各目标回执，再判断哪些投递待完成。PostgreSQL 的 `pg_blocking_pids` 可查看阻塞会话。[PostgreSQL 锁检查](https://www.postgresql.org/docs/17/functions-info.html) · [PostgreSQL 行锁](https://www.postgresql.org/docs/17/explicit-locking.html)

同库夹具保留 PostgreSQL 行锁，直至原 Worker 退出。MySQL 目标此时已有原生提交和日志确认。在原 Agent 仍然分区时释放行锁，原 PostgreSQL 事务回滚。恢复原 Agent 后，先确认此前排队的 STOP 执行成功，再显式启动。采集位置保留已记录的原事务，系统只补跑 PostgreSQL 的待投递事务。夹具核对两端具有相同事务标识，各自的数据库日志中均只有一笔已提交的插入和一笔更新。

#### 目标已提交但日志尚未确认

分区期间，目标原生断点可能比日志确认领先一笔事务。目标在同一事务中提交业务数据和原生回执。原 Agent 恢复后，Worker 比较保留事务的标识和投影摘要与目标回执。核对一致时补齐该目标的确认，另一目标保留原确认位置。原采集断点和两个目标已有的业务写入均保持原样。

使用共享 PostgreSQL 控制库和日志时，夹具可以在 PostgreSQL 或 MySQL 8.4 目标已提交后中断其投递确认。夹具先锁定选定目标的业务行，等待另一目标提交并确认同一源事务，再锁定选定目标的日志确认行并释放业务行。MySQL 场景通过 Performance Schema 确认真实的 InnoDB 行锁等待。原 Agent 恢复后，先确认先前排队的 STOP，再显式启动任务。夹具核对两端原生回执身份、补齐后的确认位置和目标数据库提交记录。[MySQL 原生锁等待](https://dev.mysql.com/doc/refman/8.4/en/performance-schema-data-lock-waits-table.html)

托管 PostgreSQL 日志在获取确认行锁前设置事务级空闲超时。超时上限沿用采集租约时长，数据库管理员设置了更短的非零会话值时采用该值。客户端断连留下空闲确认事务时，即使 Agent 的链路仍未恢复，PostgreSQL 也会回滚旧事务并释放其锁。[PostgreSQL 客户端连接设置](https://www.postgresql.org/docs/17/runtime-config-client.html)

原 Agent 永久不可用且缺少签名停机状态和私有恢复证据时，交接维持受阻。管理员审批仍须使用原目录绑定、切点的当前证据和原节点及候选节点的权限。完整的目标回执可以用于核对投递确认，任务归属继续保留在原 Agent。

## 运维 FAQ

**如何判断已接受还是已执行？** 查看同一请求 ID 的 deliveryStatus、status、code 和实际 Worker/目标水位。不要把 HTTP 202 当作落库成功。

**刷新页面或更换入口需要重新登录吗？** 共享登录模式通过共享会话恢复身份，仍受 Cookie 的域、Secure、SameSite、有效期和权限撤销规则约束。不同域名需要正确的反向代理和会话配置。

**离线节点能否在 A 上停止？** 可以提交持久 STOP；显示等待/未知，直到原 owner 恢复并提供真实回执。不能仅凭心跳过期宣称已停止。

**直接改共享库的 owner、删除根表或换空目录可以恢复吗？** 不可以。认证元数据、计数、私有目录身份、回执和配置投影均会校验；缺失或篡改拒绝重新初始化。

**控制库中断时可以回退到本机账号吗？** 不会回退；管理面拒绝缺少共享权威的控制。已有数据进程行为依赖其日志/租约/目标协议，不能把管理可用性当作完整数据面隔离证明。

**备份需要包含什么？** 控制库、每节点私有目录、日志/报告/本地 journal、外部 journal（如选用）和原密钥需协调保存。仅恢复游标或旧控制库快照不足以证明一致；自动备份协调及旧备份检测矩阵仍未完成。

**哪些证据已经具备？** 先前候选已有真实 PostgreSQL/MySQL 控制库、两个独立 JVM、HTTPS 共享登录、A 创建 B 任务和离线命令测试；配置专项还有实际 TaskService 加夹具 Worker 验证。新启动修正和真实跨节点业务 CDC 正在补验，不能把这些测试当作全部集群、连接器和硬件性能验收。

**为什么没有常驻预览？** 按用户要求，验收仅启动临时资源并清理自己的容器/卷；其他项目资源不受影响。
