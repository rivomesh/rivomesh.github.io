---
kind: docs
locale: zh
title: "控制台与部署"
sourcePath: docs/zh-CN/console-and-deployment.md
---

# 控制台、多任务与部署

更新：2026-11-17。English: [Console and deployment](/docs/en/reference/console-and-deployment.html)。本页描述已实现功能；完整规划见[平台方案](/docs/zh/reference/platform-design.html)。

## 运行边界

各任务以隔离 JVM 运行，可限制堆内存和并发。多库多目标向导可配置关系数据库、分析系统和八种消息目标，并支持本地或外部日志。各产品的版本与验证范围见[连接器目录](/docs/zh/start/connectors.html)。旧单库单目标任务格式仍可运行。

Web 工作台支持中英文切换、创建向导、连接/源对象检查、启停、共享暂停/恢复、运行/全量/积压状态及操作记录。已提供独立 VIEWER/OPERATOR/ADMIN 令牌身份；ADMIN 可编辑配置、轮换凭据及恢复版本。已提供逐行校验和共同暂停点的审阅修复。PostgreSQL / MySQL 指定事务型目标已提供[提交确认](/docs/zh/reference/commit-acknowledgement.html)、[事务跳过](/docs/zh/reference/transaction-skip.html)、[缺口复核](/docs/zh/reference/gap-verification.html)、[补偿](/docs/zh/reference/transaction-compensation.html)和[手工修正](/docs/zh/reference/manual-correction.html)。按[首版部署基线](/docs/zh/reference/first-release.html)启用对应能力。业务切换需独立规划。详见[校验](/docs/zh/reference/managed-validation.html)、[修复](/docs/zh/reference/managed-repair.html)。

默认控制范围为本机；可选 `cluster.sharedAccess=true`、`cluster.sharedTasks=true` 启用固定owner全局任务控制。任一入口可管理授权的远程任务，并区分持久接受、实际结果和未知状态。启用、独立目录/密钥、升级拒绝及Helm/原生双节点配置见[全局控制手册](/docs/zh/reference/global-control.html)。自动跨节点执行接管仍未完成。

## 本机启动

```bash
mvn -s build/settings.xml verify
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
# 如任务使用密码环境变量，在启动平台前一并设置 MYSQL_PASSWORD / GAUSSDB_PASSWORD。
java -Xmx128m -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform.yml
```

访问 http://127.0.0.1:8080，用 RIVOMESH_TOKEN 的值登录。默认仅监听本机；令牌至少 24 字节，不能放在 URL 中。远程访问通过合适的 TLS 入口或隧道；控制台自身当前提供 HTTP。

界面创建不会自动启动任务。先执行“检查连接与对象”，再启动；检查读取源结构并验证目标连接，不执行建表，也不替代启动时的目标空表、DDL/复制权限验证。当前向导只配置已有运行适配器，高级主备地址等参数可通过文件导入。

## 多份独立配置

把单任务 YAML 放入 config/tasks，重启平台加载，也可以通过界面的“导入 YAML”或向导新增任务。文件路径相对于 platform.yml 解析；平台不会自动扫描项目其他目录，也不热加载外部编辑。
尚未通过界面编辑的外部配置使用私有 Worker 快照，外部修改需重启控制器并通过身份检查。界面创建/编辑后的任务以私有配置版本及注册表指针为准，任务 YAML/Worker 快照是可修复投影，手改投影不会改变配置。通过 ADMIN 的“配置和历史”预览、保存及恢复；完整步骤见[配置编辑](/docs/zh/reference/configuration-editor.html)。

每个任务使用唯一 jobId；同一实际 MySQL 拓扑的复制客户端 serverId 不同。默认拒绝相同配置目标命名空间的业务/管理重叠；VIP/域名别名或不同入口指向同一实际库仍须由部署者避免重叠写入。无效配置单独显示，不阻止其他有效任务加载。

| 平台参数 | 默认 | 含义 |
|---|---:|---|
| maxTasks | 20 | 最大已加载任务数 |
| maxRunningTasks | 2 | 同时运行的 Worker 上限，其余显示等待资源 |
| workerHeapMiB | 256 | 每个独立 JVM 的最大堆；需额外预算原生内存、平台和数据库资源 |
| controlThreads | 4 | 连接检查、状态查询和控制操作的并发上限 |
| pollMillis | 3000 | 调度及状态刷新间隔 |
| autoStart | false | 仅决定新发现文件的初始意图；已有持久状态优先，界面新建始终先停止 |

Worker 意外退出按退避重启，连续五次退出后显示 CRASH_LOOP，修复后通过启动/重试重新执行。已保存启动意图的任务随平台重启自动重建 Worker，从目标共享断点恢复，不重新全量。连接参数或配置身份变化不自动替换已有任务。

## 暂停、停止与恢复

- 停止本机 Worker：只影响当前平台进程托管的 Worker；其他部署的备用节点仍可能接管。
- 暂停共享任务：目标已有任务时，同步更新共享 PAUSED 并使旧 owner 失效，备用节点也不能继续。若共享任务尚未初始化，仅记录本机暂停，结果显示 LOCAL_PAUSED_NOT_INITIALIZED。
- 修复后恢复：绑定本次错误计数，重试原失败事务。旧恢复请求不能清除后来出现的新故障，重启也不跳过暂停。

失败不会删除队列或修改 GTID。UI 可以执行恢复，源端复制 SQL 错误仍需要数据库管理员修复。状态查询失败时显示上次成功时间和故障提示，不把缓存结果当作实时健康。
工作台每任务最多展示前 100 张表的进度并显示总表数，其他表继续正常同步；全表状态仍可通过 CLI 获取，后续补充分页检索。

## 持久文件与 API

tasksDirectory 保存任务配置；dataDirectory/controller.json 保存启停意图、版本和操作记录，使用原子替换；同目录通过文件锁只允许一个控制进程。控制文件损坏时拒绝重置启动。v2 的权威断点在目标管理表。v3 的源日志/全量工件/订阅确认在 LOCAL 或 EXTERNAL 日志中，事务目标保留业务原子断点，消息目标使用确认后发布回执。LOCAL 目录为 dataDirectory/journals/pipelineId，跨主机 HA 使用 EXTERNAL；不能丢弃日志后沿用目标断点。
dataDirectory/worker-configs 保存启动时选定的任务配置快照，包含同等敏感的连接信息，需要与任务文件一并保护。

任务配置可能包含密码，写入文件权限为 0600；任务状态 API 不返回密码、原始 JDBC URL、行载荷或扫描主键值。ADMIN 配置 API 返回可编辑文档，凭据及含凭据的 URL 使用不透明引用，普通无凭据 URL 可见。普通请求不打印凭据。目录和备份同样需保护。日志每任务保留两个最多约 8 MiB 文件，不通过 Web 暴露原始日志。

| API | 用途 |
|---|---|
| GET /healthz、/readyz | 无数据库副作用的进程探针，无需令牌 |
| GET /api/tasks | 脱敏任务、状态、加载问题和操作记录 |
| POST /api/tasks | body 为 config 对象或 yaml 字符串，创建停止状态任务 |
| GET /api/tasks/{id} | 单任务视图 |
| POST /api/tasks/{id}/actions | START / STOP / PAUSE / RESUME / RESUME_TARGET / CHECK |
| GET /api/tasks/{id}/configuration、/configuration/history | ADMIN 脱敏配置和版本历史 |
| POST /api/tasks/{id}/configuration/validate、/configuration/restore/validate | ADMIN 预览配置或恢复变化 |
| PUT /api/tasks/{id}/configuration、POST .../configuration/restore | ADMIN 提交新配置版本或恢复版本，不回退断点 |
| GET /api/capabilities | 已实现、部分验证及规划中的连接器 |

API 使用 Authorization: Bearer；写请求要求 Content-Type: application/json 和 X-Request-ID。控制动作携带 expectedRevision，RESUME 还需全局 errorCount；RESUME_TARGET 需 subscriptionId 和该目标的 errorCount。消息暂停的在途发布隔离可能未确认，不能据此直接业务切换。接受返回 202，最终结果见任务 operations；同一请求 ID 及内容重复提交不重复执行。保留最近 500 个请求及每任务 40 条操作，过期请求仍受版本检查限制。一次任务只允许一个待处理操作。

## Docker

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
docker compose -f deploy/docker-compose.yml up -d --build
```

Compose 默认只向本机开放 8080，数据卷持久化任务与控制状态，停止宽限期 90 秒。容器非 root 运行；基础镜像可通过 MAVEN_IMAGE、JAVA_IMAGE 构建参数替换为已准备的内网镜像。镜像未发布到公共仓库，需要自行构建/导入。现阶段镜像中驱动的对外分发许可仍需发布前审核。

## Linux 服务

将 JAR 安装为 /opt/rivomesh/rivomesh.jar，创建专用 rivomesh 用户；复制 deploy/linux/platform.yml 到 /etc/rivomesh/platform.yml，将令牌写入仅管理员可读的 /etc/rivomesh/platform.env。使用 deploy/linux/rivomesh.service，准备服务用户可写的 /var/lib/rivomesh。按实际 Java 安装调整 ExecStart，再执行 systemctl daemon-reload 与 systemctl enable --now rivomesh。

## Kubernetes：Helm 与原生 YAML

先构建镜像并推送/导入集群可用仓库。下面创建密钥的 .env 文件由部署者准备，内容为 token=实际私有令牌，不提交仓库：

```bash
kubectl apply -f deploy/kubernetes/namespace.yaml
kubectl -n rivomesh create secret generic rivomesh-auth --from-env-file=/private/rivomesh-token.env
# 方式一：Helm，仓库和 tag 按实际镜像修改
helm upgrade --install rivomesh deploy/helm/rivomesh -n rivomesh --set image.repository=registry.example/rivomesh
# 方式二：不依赖 Helm，先编辑 YAML 中的镜像和 PVC 配置
kubectl -n rivomesh apply -f deploy/kubernetes/rivomesh.yaml
kubectl -n rivomesh port-forward service/rivomesh 8080:8080
```

两种方式二选一，不能同时管理同一套资源。原生 YAML 由同一 Chart 的默认值渲染，默认内容一致。Helm 支持既有 Secret/PVC、存储类、资源和并发参数，values.schema.json 与模板检查无效值。重新生成原生清单：helm template rivomesh deploy/helm/rivomesh --namespace rivomesh。

当前控制面单副本、Recreate 更新和持久 PVC；不通过增加 replicas 声称控制面 HA。单任务原有数据库租约接管机制保留，控制面跨实例一致调度尚待实现。探针不因业务源离线/任务暂停而失败。Secret 或原生 ConfigMap 修改后需按操作计划重启；任务保持原身份恢复。

Chart 已提供持久化、防提权、只读根文件系统、临时目录、优雅停止和进程探针；实际集群/CSI/镜像架构与系统兼容性须按环境验证，渲染检查不等于真实 K8s 部署验收。

## FAQ

**平台重启会重新全量吗？** 同任务配置及目标状态完整时从原断点恢复。控制目录不是业务库断点的替代品。

**暂停成功后还有其他节点写入吗？** 已初始化任务的共享暂停与业务事务使用同一任务行锁；暂停完成后旧 owner 不能再提交新的业务事务。初始化前的本机暂停没有跨部署全局效果。

**为什么任务等待资源？** 同时运行数达到 maxRunningTasks；停止一个任务或在硬件允许时调整平台配置并重启。

**为什么恢复请求失败？** 可能是错误版本已变化、数据库不可用或配置不匹配；刷新最新状态并修复原因，不修改断点来强行继续。

**能直接用这些清单跑所有新目标吗？** 不能。它们部署当前已实现服务；规划连接器会在能力页明确显示尚未实现。

## 开发验证

Maven verify 运行单元/API 测试，tests/matrix.sh 运行 MySQL 8.0/8.4 与 openGauss 的平台和既有故障回归。
可选 npm ci --prefix tests/ui --ignore-scripts 后执行 npm test --prefix tests/ui，验证实际 HTML/JavaScript 的 DOM 交互；仅开发测试需要相应 Node 版本，服务运行不需要 Node。
构建镜像后执行 python3 tests/deployment-check.py --image rivomesh:0.1.0-SNAPSHOT，检查 Helm/原生清单一致性及非 root 镜像、鉴权、配置权限、重复请求和卷恢复。脚本只删除自己创建的测试容器与卷，不部署到用户 K8s 集群。
DOM 检查不能替代真实浏览器的外观、键盘与可访问性验收；当前浏览器自动化窗口不可用，此项仍需补验。

## 独立账号与访问角色

用 [platform-rbac.yml](/files/config/platform-rbac.yml) 替换共享令牌示例，设置三个令牌环境变量，运行 `java -jar rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform-rbac.yml`。令牌必须各不相同，为 24–4096 位可打印 ASCII；未解析的环境变量引用会被拒绝。最多配置 32 个用户，ID 唯一，且至少保留一位 ADMIN。令牌不是密码。浏览器登录后换取可撤销的短期会话，刷新可恢复；见[会话、HTTPS/CSRF及退出处理](/docs/zh/reference/browser-sessions.html)。

| 角色 | 查看任务/状态/能力目录 | 检查、启停、暂停、恢复已有任务 | 新建/导入配置 | 读取/编辑配置与版本历史 |
|---|---|---|---|---|
| VIEWER | 可以 | 不可以 | 不可以 | 不可以 |
| OPERATOR | 可以 | 可以 | 不可以 | 不可以 |
| ADMIN | 可以 | 可以 | 可以 | 可以 |

角色控制动作；VIEWER/OPERATOR可通过 `users[].taskIds` 精确限制任务。省略时保留部署内全部任务权限，空数组表示无任务权限；ADMIN全局管理。配置及撤销见[按任务授权](/docs/zh/reference/task-authorization.html)。运维角色仅允许 CHECK、START、STOP、PAUSE、RESUME、RESUME_TARGET；未来新增动作默认只允许管理员。API 在读取写请求正文或调用任务服务前拒绝无权请求；界面禁用对应按钮，服务端仍是最终权限边界。

`GET /api/session` 返回当前 ID、角色、权限和任务范围，不返回令牌或其他账号列表。界面刷新权限，退出或认证失效时清空草稿，旧登录迟到响应不能清除新登录。默认 CONFIG 模式从启动配置取身份；启用界面托管后由持久账号目录管理，配置/环境变化和重启不会覆盖托管授权。只有 ADMIN 可管理账号，操作、恢复和兼容边界见[账号管理](/docs/zh/reference/account-management.html)。

在 CONFIG/引导模式，旧 `authToken` 对应全权管理员 `legacy-admin`；采用独立账号时可省略。若与 `users` 同时保留，两种方式均有效，用户不能复用共享令牌。本地用户/授权界面、令牌轮换及离线恢复已提供；OIDC/SSO、令牌有效期和外部不可变审计锚点仍未完成。已有任务操作历史继续保留，完整权限/审计工作流仍在补齐。

Linux 可在现有服务命令/环境中指定该配置；Docker、原生 Kubernetes 通过挂载平台配置文件和注入对应 Secret/环境变量使用。默认 Helm/原生配置保留兼容的共享令牌；独立角色使用下方示例，两种配置均不嵌入令牌值。不要将令牌明文提交到 values 或导出诊断包。

Helm 角色配置：预先建立 Secret `rivomesh-accounts`，分别提供不同的 `admin-token`、`operator-token`、`viewer-token` 键，执行 `helm upgrade --install rivomesh deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-rbac.yaml`。手动 YAML 使用 `deploy/kubernetes/rivomesh-rbac.yaml` 替代默认清单；同一资源选择一种管理方式/配置。两份原生文件均由 Chart 渲染并检查一致性。自定义用户格式为 `auth.users: [{id, role, secretRef: {name, key}}]`，`auth.legacyTokenEnabled: false` 关闭共享入口，至少保留一位 ADMIN。重复 ID/Secret 键、非法角色和令牌明文 `token` 字段在渲染时拒绝；不同 Secret 键内容恰好相同则由应用启动检查拒绝。

Secret 环境值在进程启动时读取。仅修改 Kubernetes Secret 不会轮换运行中的管理服务，修改后需执行受控滚动重启；角色/配置变化会改变部署的配置校验和。ConfigMap 和原生 YAML 均不写 Secret 内容。真实 Kubernetes/CSI/滚动升级验收仍待完成，离线 lint/渲染/一致性检查不能替代集群实测。

通过 HTTP 新建的配置记录 `createdBy`、`createdRole`、`createdAt`；任务操作记录认证得到的 `actorId`、`actorRole` 及异步结果，管理进程重启后仍保留。身份由服务端填写，请求正文里的身份字段不能冒名覆盖。新幂等回执将请求标识绑定身份/角色，同身份重放仍幂等，其他身份重放返回 `REQUEST_IDENTITY_CHANGED`。旧版无归属回执保持兼容；历史记录、直接文件/内部 API 变更不会被猜测归属。

这是有界操作历史：每任务保留 40 次操作、管理注册表保留 500 个请求回执，界面显示最近八次。独立全局审计已记录API拒绝/安全事件和异步操作结果，支持链校验、保留、ADMIN界面和导出，见[安全审计](/docs/zh/reference/security-audit.html)。它仍不等于外部不可变审计。


ClickHouse V3 目标使用原生版本物化和 FINAL 查询视图，事务内各行可能分批可见。
向导默认把支持的次级索引转换为非唯一跳数索引。点击“检查”后，在任务操作记录中
展开“检查结果与操作详情”，查看 `clickhouseIndexPlans` 中的不支持项及唯一性、排序、
全局路由的差异。早期仅同步数据的任务省略新字段时保留 NONE，也可通过 YAML 导入显式指定
`clickhouse.secondaryIndexes: NONE`。切换模式前请阅读 [ClickHouse 手册](/docs/zh/reference/clickhouse-v3.html)。


Doris向导分别配置SQL和Stream Load HTTP入口、重定向白名单、副本/分桶及索引策略。默认3副本，单BE测试显式选1；展开检查结果的 `dorisIndexPlans` 查看索引差异。暂停显示物化在途未确认，不能作为业务切换屏障。首批身份检查需Doris ADMIN账号，完整范围见[Doris手册](/docs/zh/reference/doris-v3.html)。

上述引导 Secret/环境重启说明适用于 CONFIG 或托管前的初始身份。启用托管后使用账号界面/API轮换；若移除引导凭据，请使用 accessMode: MANAGED 并保留匹配的控制/审计持久卷，见[账号管理](/docs/zh/reference/account-management.html)。

事务证据审阅采用可选控制协议5，支持管理员保存历史证据、原始/规范化事件分页及表格镜像；启用/升级及四类部署示例见[审阅手册](/docs/zh/reference/failure-review.html)。默认旧档案不自动升级。限定恢复档案见[当前实施状态](/docs/zh/reference/implementation-status.html)。
