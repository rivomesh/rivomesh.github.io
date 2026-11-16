---
sourcePath: docs/validation.md
---

# 故障与恢复验证

日期：2026-11-15。Java 8，目标为 openGauss 7.0.0-RC3，MySQL 使用官方镜像。

English: [Validation and recovery evidence](/reference/en/validation.html)。

本记录保留 v2 单 database/单目标及多配置平台的 HA 矩阵，并继续记录 v3 多库多目标的独立验收。最新 v3 记录见下节。
自动迁移接管、剩余 MQ/分析/其他厂商目标、源 PostgreSQL/Oracle、商业分布式 GaussDB、完整权限/修复工作台仍未完成。V3 Web 多目标向导与独立恢复、RabbitMQ/NATS 发布已经接通，验证范围如下。
后续验收范围见 [需求与决策](/reference/zh-CN/requirements-and-decisions.html)、[完整平台方案](/reference/zh-CN/platform-design.html) 和 [Gauss 索引策略](/reference/zh-CN/gaussdb-index-policy.html)。

## OceanBase 实验适配：完整恢复未通过（2026-11-15）

[证据及失败记录](/reference/verification/2026-11-15-oceanbase/README.html)：当前包9a087通过118项Java/SDK单元/API测试，另以实际fat JAR通过116项应用测试，31项DOM通过。原生强一致读、跨库回滚、归属/epoch及全量/类型和部分增量已实测。四轮完整联合用例仍有管理DDL超时、业务租户初始化超时或OBD资源预检查拒绝，不能算作完整恢复通过；OceanBase能力目录保持EXPERIMENTAL。所有场景、包版本差异及资源探针均保留，继续定位恢复问题。

## Doris SQL 模式和字符校验补充（2026-11-15）

[补充证据](/reference/verification/2026-11-15-doris-hardening/README.html)：目录/回执/行查询改为二进制服务端预编译参数，强制禁止不支持时回退字符串插值。实际发布包11667063通过原生重启及旧备份保护，并新增空 SQL 模式和NO_BACKSLASH_ESCAPES下的引号/反斜杠表名、Unicode/emoji文本、全量/增量及会话重建。非法UTF-16确定性暂停的分类已通过单元测试。当前发布包9a087又通过真实MySQL8.4.13→PG17.12＋Doris4.1.3完整联合故障恢复用例；14个Doris适配器类与原生模式/旧备份验收包11667063一致，包与范围差异均单独记录。

## Doris首批原生及联合恢复（2026-11-15）

[归档证据](/reference/verification/2026-11-15-doris/README.html)：2项SDK＋114项应用测试、30项DOM通过；最终fat JAR另直接通过114项应用测试（重复执行不相加）。最终包通过原生MoW/索引/PK/无主键/精度/重启及旧非空FE＋BE备份拒绝。真实MySQL8.4→PG17.12＋Doris4.1.3联合链路通过全量/增量、目标故障隔离和自动追平、Worker强杀、SQL约束修复重试、视图丢失隔离及诚实的暂停栅栏。联合包与最终包的全部65114类比较仅能力目录文字不同，运行资源一致。集群/TLS/多JDK/容量/接管/动态DDL等不由此证明。

## 精确任务授权与最终发布包（2026-11-15）

[归档证据](/reference/verification/2026-11-15-task-scopes/README.html)：Maven的2项SDK及99项应用测试通过；最终fat JAR另直接运行99项应用测试全部通过，不能将重复执行相加。29项DOM及Helm三种配置的静态检查通过。真实Java8发布包从平台文件加载授权，验证精确/空授权、列表过滤、直接操作拦截和SIGKILL重启后权限保持；该管理用例的数据库后端为桩。相同最终包另通过实际MySQL8.4→PG17.12配置轮换/恢复/重启续传，146条原生审计记录经Python校验。账号管理界面及真实K8s/外部不可变审计不在此验收范围。

## 全局安全审计（2026-11-15）

[归档证据](/reference/verification/2026-11-15-audit/README.html)：98项Java/SDK单元/API、28项DOM、7项导出工具测试通过。相同发布包通过Java8真实HTTP/H2、分页导出原生哈希校验、SIGKILL后已提交事件保留及审计库删除拒绝启动；该独立用例的数据库后端为桩。另通过真实MySQL8.4→PG17.12密码轮换/配置恢复/重启增量链路，132条审计事件由Python独立校验。Helm/原生清单通过静态一致性，不代表真实K8s或外部不可变审计。

## 配置编辑及恢复：最终发布包验收（2026-11-15）

[归档证据](/reference/verification/2026-11-15-configuration/README.html)：88项 Java/SDK 单元及API测试、25项DOM测试无失败。最终发布包在真实 MySQL8.4→PostgreSQL17.12 链路通过停机目标密码轮换、旧凭据检查失败、幂等配置提交、历史版本恢复及删除投影后的控制器重启续传；保留原流/快照身份。真实浏览器外观、其他目标/源账号DDL及完整审计不由此证明。

## V3 与新增兼容验证

- MySQL 5.7.44 → openGauss：首轮 28 次执行通过，覆盖 JSON 全量/增量/重启；日志 `target/mysql57-base.log`。这不是完整 5.7 HA/MGR 验收。
- 原生 PostgreSQL 17.12 目标：首轮 31 次执行通过；后续事务目标/日志适配器 37 次通过，日志 `target/sink-postgres.log`。
- H2、MySQL、PostgreSQL、openGauss 日志：源事务/位点原子提交、订阅隔离、慢目标保留、重复请求内容校验、epoch、缺口/校验和、快照及无主键持久多重集测试通过。
- 新事务 Sink：真实 MySQL/PostgreSQL/openGauss 上验证业务与断点原子提交、整事务回滚、断点恢复、主键更新、旧 epoch 拒绝、业务 UNIQUE 转普通索引。商业分布式 GaussDB 的分布键/GSI 不计入已验收。
- MySQL 8.4 新 Source：多 database、无主键重复行、JSON、存储/虚拟生成列及 MVCC 快照测试通过；更新后立即再次修改源数据，仍验证前一事件的历史生成值。`target/v3-mysql-source.log` 共 42 次执行通过。
- CLI 完整 v3：MySQL 8.4 → PostgreSQL + openGauss 两个实例，跨 database 原子事务、单目标 SQL 失败隔离、强制终止/重启、PAUSED 保留、原事务恢复、无主键逐出现更新/删除及日志回收。首轮 `target/v3-pipeline.log` 共 46 次执行通过。后续快照回收、本地 H2 自动服务模式仍在扩展测试中，最终记录另列。
- DOM 向导目前 7 项通过，覆盖 v2/v3、多库多目标、SQL/MQ 配置、密码与令牌遮蔽、独立错误版本恢复；日志 `target/message-ui-sasl.log`。没有截图级浏览器验收。
- `target/v3-three-targets.log`：26 次通过，扩展为独立 MySQL 8.4、PostgreSQL 17、openGauss 7 三个实例同时接收，外部 PG 与本地 H2 两种日志都覆盖。
- `target/v3-ha-fixed.log`：v3 两 Worker 冷启动/接管、MySQL 从库 SQL 线程 1032 错误及错误提升拒绝、真实主库关闭、外部提升从库后自动续传通过；完成快照未重新扫描。
- `target/v3-group.log`：三节点 MGR，源 MVCC 快照尚未完成时关闭主库，重新选主后重建未完成快照并追平两目标，通过。v3 的未完成 MVCC 视图重建与 v2 的主键游标恢复策略不同。
- `target/v3-wide-gauss.log`：42 次通过，补验独立事务 Sink 的空串/空字节、SQL NULL、大 unsigned、DATE 与微秒时间精度；同时覆盖 v2 Gauss 和新增 Source。MySQL 时间精度使用 information_schema 校验，Gauss A 模式连接保留其他兼容选项并开启空串语义。
- `target/v3-final-after-keeper.log`：53 次通过，包含 v2/v3、真实 HTTP 控制台、双日志模式、目标所有权和宽类型。控制台在 LOCAL Worker 启动前持有日志连接，避免自动服务所有者频繁迁移。
- `target/v3-cooperative-stop.log`：31 次通过，加入三目标独立投递测试：锁住 Gauss 目标检查点时 PG/MySQL 仍在 5 秒内收到更新；两种日志均覆盖。嵌入式 H2 工作线程改为协作停止，避免 interrupt 打断共享文件 I/O。失败的早期 `v3-concurrent-sinks.log` 不计通过。
- `target/messaging-confirmed.log`：Java 8 共 22 次执行，失败/错误/跳过均为 0。MySQL 8.4 → RabbitMQ 4.1.4 quorum + NATS 2.11.8 File Stream，覆盖快照、JSON/生成值、主键更新、无主键逐出现删除、单队列 mandatory-return 暂停与独立 NATS 继续、原事务恢复、Worker 强杀续传、两个 Broker 真实容器重启及继续。单机 Broker，不代表集群选主、TLS 或断电验收。
- 同一消息套件的协议测试覆盖确认丢失的稳定 ID 重放、epoch 与不可变正文分离、断点不领先确认、丢失已初始化资源时禁止自动建空继续、跨库计数和事务 hash 重建、超限消息在 BEGIN 前拒绝。客户端版本为 Rabbit Java 5.36.0 / jnats 2.26.4。早期 `messaging-integration.log`（测试配置/虚拟主机错误）与 `messaging-recovery.log`（测试谓词空值错误）保留为失败记录，不冒充成功。

- `target/v3-after-messaging.log`：37 次通过，SQL 三实例/双日志、真实 HTTP 控制台及新增消息协议单元测试均无失败/错误/跳过，验证新依赖和 TargetProduct 拆分未破坏 SQL 链路。
- `target/messaging-three-brokers.log`：33 次通过，Kafka 3.9.2 / RabbitMQ 4.1.4 / NATS 2.11.8 同源同时投递，三个 Broker 真正重启后续传。包含 Kafka 集群身份绑定、禁止 Broker 自动建 Topic、单 Topic/单分区策略、无主键删除、独立错误恢复及控制台物理 Topic 重叠拒绝。协议单元补验 Broker 身份变更拒绝。此轮 TLS/SASL 仅配置/UI 验证，未做真实认证 Broker 故障验收。
- `target/deployment-after-messaging.log`：Helm lint、渲染/原生清单一致、既有 PVC 和非法参数拒绝通过；没有替代真实 K8s 集群测试。`target/messaging-kafka-final.log` 中新平台测试曾因带入未托管 LOCAL path 失败，修正测试为外部日志后上述 33 项通过。

- `target/v3-backpressure.log`：40 次通过，12 KiB 逻辑配额被暂停目标占满后，原始日志的标准化仍有预留空间；超过 binlog 空闲阈值后租约/Worker 仍健康，阻塞期间共享暂停可完成，修复目标后自动续传。LOCAL/EXTERNAL 均覆盖。
- `target/v3-backpressure-recovery-fixed.log`：40 次通过，进一步验证 20 KiB JSON 单事务超过配额时保留旧 GTID，扩大到 256 KiB 后重启、按错误版本重放原事务，三 SQL 目标完整保存大 JSON。未重新全量。早期 `v3-backpressure-recovery.log` 的 LOCAL 连接 EOF90067 失败保留，新建连接有界重试后通过。
- `target/messaging-shaded-backpressure.log`：34 次通过，Worker 实际执行发行用 shaded JAR，同源 PostgreSQL + Kafka/RabbitMQ/NATS、进程强杀、三个 Broker 重启续传均通过。JAR 中 HTML/JS/CSS 与源码逐字节一致，入口字节码 Java8，包含工作空间预留实现。不是仅用测试 classpath 替代打包验收。

这些执行数包含重复回归，不应相加作为不同用例数。v2 的 HA/MGR 结果不自动证明 v3 的完整集群故障矩阵。运行边界及 FAQ 见 [V3 手册](/reference/zh-CN/pipeline-v3.html)。

最新增补：

- `target/messaging-pulsar-ready-recovery.log`：47 次通过，实际发行 JAR、256 MiB Worker 堆，MySQL 同源写 PostgreSQL + Kafka/RabbitMQ/NATS/Redis/Pulsar，三轮先停 Broker、SQL 继续、持久重试、服务健康后自动追平。服务就绪最多等待 180 秒，之后追平检查仍为 60 秒；不把这一测试条件当成硬件无关 SLO。早期 `messaging-pulsar-mixed-first.log` 在 Pulsar 管理服务尚未启动完成时触发测试截止，不计通过。
- `target/pulsar-transport-java25-shading.log`：实际 SDK/核心 JAR 共存、只读检查、所有权、发布/读取、Broker 重启、错误保留策略和丢失 Topic 保护通过。早期两个日志分别为导入歧义编译失败、旧 Shade 不支持 BC 依赖的 Java25 多版本类；升级 Shade 3.6.2 后打包通过，不等于完成 Java25 运行时验收。`target/ui-pulsar-copies.log` 11 项 DOM 通过。

- `target/messaging-visible-retry-recovery.log`：45 次通过。三轮先实际停止四个 Broker，确认 PostgreSQL 继续、四个消息目标均持久记录自动重试且不进入 PAUSED，再启动 Broker；全部原事务追平并自动清除重试提示。实际发行 JAR 执行，未用延长超时或人工恢复掩盖故障。

- `target/messaging-redis-safe-reconnect.log`：42 次执行，无失败/错误/跳过。实际发行 JAR 同源写 PostgreSQL 与 Kafka/RabbitMQ/NATS/Redis Streams，三轮连续 Broker 重启均续传。Redis 7.4.2 单机另验同连接确认、连接替换、缺副本 fsync、握手 EOF、非 0 号数据库重连保护、错误 AOF/淘汰设置和已初始化 Stream 丢失。
- `target/retry-status-unit.log`：35 次通过；`target/ui-retry-status.log`：10 项 DOM 通过。可重试故障保存诊断码，保持 RUNNING，不推进断点、不增加故障版本，不显示人工恢复按钮；成功后清除暂时故障提示。
- `target/v3-local-keeper-retry-status.log`：43 次通过，SQL 三实例、双日志、真实 HTTP 与新重试诊断。修复 CLI Worker 在 PAUSED/Busy 循环反复开关 H2 自动服务的问题，等待期间持续持有 LOCAL 连接。早期 `target/v3-retry-status.log` 的锁文件切换失败保留，不能算通过。
- Redis 早期 `messaging-redis-first.log` / `messaging-redis-repeated-recovery.log` 暴露构造连接异常未分类；现已按可重试故障处理。中间测试还修正了测试读取端在启动期直接抛网络错误的问题。成功依据为上面的三轮实际 JAR 验证；不宣称已验 Redis Sentinel/Cluster、TLS 或断电。

## V2 HA 矩阵

| 源版本 | 基础及平台回归（含 12 项单元测试） | 普通主从及多节点故障链 | 三节点 MGR 全量中途故障 | 失败 / 跳过 |
|---|---:|---:|---:|---:|
| MySQL 8.0.46 | 20 | 1 | 1 | 0 / 0 |
| MySQL 8.4.13 | 20 | 1 | 1 | 0 / 0 |

共 44 次 Java 测试执行，失败、错误和跳过均为 0。XML 报告位于 `target/matrix-ha/<8.0|8.4>/<integration|ha|group>/`，
最终日志为 `target/platform-matrix-final.log`，汇总为 `target/platform-validation.json`。

更名阶段曾通过原有 26 次执行，本批增加平台测试后完整矩阵为 44 次。已检查可执行 JAR 的入口为 `io.rivomesh.Main`、
JDBC 服务包含 `io.rivomesh.gaussdb.jdbc.Driver`、入口字节码为 Java 8，且 JAR 不含旧组织包类。
JAR 内 HTML/JS/CSS 与当前源码逐字节一致。上述结果不证明规划中的连接器已完成。

新增平台验证：

- 两个独立 Worker 同时全量和增量；共享暂停其中一个时，另一个持续同步。
- 管理暂停使旧 owner 失效，备用节点不能接管；旧错误版本的恢复请求不能清除新故障。
- 控制面重启按持久意图恢复 Worker，不重复已完成全量。
- 元数据尚未创建时可安全读取空状态，兼容 openGauss 的缺失 schema 错误差异。
- UI 状态只读前 100 张表并保留正确总数，CLI 全表状态不变。
- HTTP 鉴权、跨来源拒绝、敏感字段过滤、请求去重、版本冲突、文件损坏拒绝重置、配置快照隔离、并发资源上限及无效文件隔离。

界面与部署验证：

- Node 22.22.3 / jsdom 31.0.1：3 项 DOM 测试通过，覆盖登录、语言切换、向导校验/遮蔽/保存、恢复参数和不可信名称作为文本显示。日志 `target/platform-ui-test.log`。
- Docker 镜像已构建并运行；非 root UID 10001、健康端点/检查器、API 鉴权、实际静态资源、0600 配置、重复创建及数据卷重启通过。测试容器/卷均清理。日志 `target/platform-deployment-test.log`。
- Helm 3.8.1：lint、默认渲染与原生清单一致、既有 PVC、无效并发/Secret 参数检查通过。
- 当前环境浏览器窗口不可用于自动化，未完成截图级视觉/键盘/可访问性验收；未向真实 Kubernetes 集群部署，不以渲染代替集群验收。

已验证的故障链：

- 两个同步服务同时冷启动，竞争元数据初始化、任务创建与租约。
- 全量扫描、增量回放阶段强杀进程，接管后保留游标和 GTID。
- 杀掉复制连接后自动重连，不重新全量。
- 目标 CHECK 约束使事务失败：整笔回滚，队列头保留，所有备用节点共同观察到 PAUSED。
- 新增备用节点不会绕过暂停；删除错误约束并 resume 后重试原事务，后续事务继续处理。
- MySQL 从库产生 1032 SQL 错误，尝试提升时拒绝其接管；源端修复并追平后恢复。
- 关闭普通 MySQL 主库，外部提升已追平从库；服务自动改连新 UUID，继续处理更新及新增。
- 全量未完成时关闭 MGR 主库，两个存活成员形成多数并选主；保留已提交扫描游标，继续全量及增量追平。
- 切主前后的更新、删除、扫描游标之前的修改、初始扫描上界之后的新增，均验证目标结果。
- 主线程阻塞超过租约时独立心跳仍能续期；旧 owner 无法写入被新 owner 接管的任务。
- GTID 已消费后不会重新加入队列；读取依赖 GTID 不因后续采集提交而丢失。
- GTID 集合并集、缺失事务、purged 日志缺口、多写主、MGR 非 ONLINE/多主，以及 SQL/关闭错误分类有单元验证。

测试中的 RESET、账号创建、主库关闭及数据修复仅对独立的测试容器执行，不属于生产运行逻辑。
生产服务不执行主库提升、SQL 跳过或 GTID 改写。

尚需在实际环境验证：商业版 GaussDB 版本、分布式约束、目标集群写入口、TLS，以及实际高可用系统的隔离/提升策略。
多用户角色、完整生产容量/长稳、其他 JDK 运行时和集群存储兼容性也属于后续验收。
异步复制本身已经永久丢失的事务、人工伪造 GTID 或未记录 binlog 的业务写入，不在 CDC 可重建范围内。

## RocketMQ 与消费者配置补充

`target/rocketmq-transport-cached.log` 已通过：Java 8、实际可执行 JAR、原生 Broker 5.5.0 / 客户端 5.5.1，覆盖独立 Netty/Fastjson2、只读检查不创建资源、内容/键/逻辑通道确认、Broker 重启保留历史、重建客户端续传、拒绝 ASYNC_FLUSH 和已初始化 Topic 丢失。仅确认本地一份同步刷盘副本，不代表 ACL/TLS、复制/controller/DLedger、断电或吞吐已验收。`target/rocketmq-transport-expanded.log` 进一步通过创建后中断、归属清单冲突和队列改变拒绝。

`target/consumer-setup-fixed-unit.log`：38 项核心执行通过，无失败、错误或跳过；`target/ui-rocketmq-profile.log`：13 项 DOM 测试通过，包含消费者目标信息、文本转义、凭据排除、RocketMQ Broker/保留策略向导。`target/messaging-rocketmq-mixed.log`：49 项执行通过，无失败/错误/跳过；实际发布 JAR、MySQL → PostgreSQL + 六种消息目标，Worker 强杀及三轮所有消息 Broker 停止/启动。MQ 停机时 SQL 继续、全部消息目标持久显示 RUNNING 重试，恢复后自动追平并清除重试码。这是小规模故障夹具，不是硬件无关的吞吐或延迟承诺。

`python3 tests/verify-artifact.py` 已通过（`target/artifact-rocketmq.log`）：当前界面字节一致、应用 Java 8 字节码、主入口/JDBC 服务、私有 SDK、无测试类/旧包/重复 ZIP 项，核心 SLF4J 未被替换。当前包 138290998 字节，SHA-256 `f1f1e7921e03ef85402229a05e30e4164042371da53bc15e83aac59f5e691879`。后续代码改变需要重新打包检查。

## 权限控制验证

`target/roles-http-unit.log`：41 项执行通过，无失败/错误/跳过；真实 HTTP 验证只读者不能写、运维可控制已有任务但不能新增、管理员新增、会话信息脱敏、重复凭据拒绝和至少一位管理员。`target/ui-roles-permissions.log`：15 项 DOM 通过，包含查看者/运维按钮权限、角色展示，以及旧登录迟到的 401 不影响新登录。新代码的 `target/artifact-roles-first.log` 检查通过：138296667 字节，SHA-256 `a17b35d9e1c64a78863af073ab85b940c92a2480db28d67d22cbbc59db4b2b4b`。

操作者补充：`target/roles-attribution-unit.log` 41 项执行通过；实际 HTTP 身份覆盖伪造正文身份，同身份重放幂等，其他已认证身份重放返回 409，创建者和操作人跨管理进程重启保留。`target/ui-roles-attribution.log` 16 项 DOM 通过，含归属显示转义。`target/helm-roles-attribution.log` 通过默认/角色原生清单一致性、仅 Secret 引用及无管理员/重复/非法角色/明文令牌拒绝。真实 K8s/CSI 待验收。`target/artifact-roles-attribution.log` 检查当前包通过：138297471 字节，SHA-256 `2207ed57288d5377e28972647222e68990eb1680b400f586ec0a4e977e77f13e`。原生 Chrome 返回 `cgWindowNotFound`，不宣称视觉或无障碍验收通过。

## 原生 Broker 回执与旧备份恢复

`target/rocketmq-native-progress-restore.log` 通过队列/CommitLog 偏移及事件/正文摘要核验、正确回执续传、摘要错误拒绝，以及实际旧非空数据卷恢复拒绝。仅在隔离测试 Broker 停止后复制/还原自己的卷；还原后首条仍存在、第二条已确认消息丢失，后来的回执阻止续传。不把它当作断电、仲裁、任意损坏或消费者业务断点验收。

`target/messaging-native-progress.log`：53 项执行通过，无失败/错误/跳过。Java 8 实际发布 JAR、PostgreSQL + 六种消息目标、Worker 强杀及三轮全部 Broker 停止/启动，原生回执保留且各目标自动追平。新增两项 MessageSink 用例覆盖代次/比较更新/租约隔离，以及禁止为已投递目标猜测缺失回执。`target/v3-native-progress-external.log` 进一步通过 47 项执行，含真实 MySQL/PostgreSQL/openGauss 日志保存/比较更新/旧租约拒绝/重开，以及 V3 SQL/HTTP 恢复。

`target/ui-native-progress.log`：16 项 DOM 通过；`target/artifact-native-progress.log`：该历史包检查通过，138300921 字节，SHA-256 `bc62a79154044249ea0071180246c6a918c2ae596905b98cb55fe2e5e90d5621`，更早的包摘要为历史记录。


Artemis 原生回执验收：`target/artemis-native-progress-final.log` 已通过 Java 8 实际发布 JAR/当前 Broker，覆盖相同身份旧非空备份拒绝、正确/摘要改变/格式错误回执、空替换队列保持为空、重启、消息一致及消费确认保留。`target/ui-artemis-native-progress.log`：17 项 DOM 通过。七种消息目标联合恢复单独重跑中，此前超时记录不计作通过。


性能工具通过 1,000 行全量/1,200 次行变更的真实发布 JAR、MySQL 8.4.13 → PostgreSQL 17.12 冒烟验收；两阶段源/目标完整行字节摘要一致，隔离资源清理成功。见[原始报告及边界](/reference/zh-CN/performance.html)。最新七种消息目标完整 Maven 执行 `target/messaging-artemis-cookie-fixed.log`：53 项通过，1 项链路测试在 Pulsar 管理接口持续 HTTP 500 时失败，不能据此宣称联合恢复通过；正在留存 Broker 原始异常定位。

`target/pulsar-admin-wrapped-diagnostics.log` 已通过真实发布 JAR 原生配置验收：实际拒绝的管理连接、包装后的超时/TLS 分类、保留真实 HTTP 500 分类，以及 Broker 重启、消息保留、策略拒绝和已初始化 Topic 丢失保护。TLS 分类用例不代表真实 TLS 握手/互通验收。`target/ui-pulsar-admin-diagnostics.log` 17 项 DOM 通过。`target/artifact-pulsar-diagnostics.log` 当前包检查通过：144060299 字节，SHA-256 `2985bbbb51b84ec8de97d8a9b44c88d5a5a1d737032b1e13263d03d4a9134aa0`，替代较早的包摘要。此前链路中的 HTTP-500 标签不能视为确已收到 HTTP 500；Broker 访问日志与 SDK 原因链表明该标签存在歧义，新代码已区分客户端传输错误。

当前发布包后续验证：`target/unit-pulsar-diagnostics-current.log` 在 Java 8、实际发布 JAR 下 **48 项**核心/API 执行通过、无失败/跳过；`target/messaging-pulsar-gc-diagnostics.log` 另有 **1 项**独立定点链路用例通过，覆盖 PostgreSQL 加七种消息目标的全量/增量、Worker 强杀、三轮全部 Broker 重启及 Artemis 队列丢失隔离。不能把这两个数字写成完整 Maven 54 项重新通过；此前完整套件中的链路失败仍保留为历史失败证据。JRE/日志 SQL 矩阵结果须另行检查后记录。


`target/runtime-matrix-first.log` 的 10 个 SQL JRE/日志配置全部通过；逐份原始报告已核对源/目标全量/增量摘要、实际 JVM、实际日志后端、相同发布包及清理结果，见[归档矩阵](/reference/zh-CN/performance.html)。ClickHouse HTTP 基础层的 `target/clickhouse-http-response-loss.log` 5 项本地 HTTP 服务用例通过，包含服务端收到正文后真实丢失响应、确认客户端不自行重发。它们独立编译后基于发布包测试，不等于 ClickHouse 完整适配或真实 ClickHouse 服务端验收。


## ClickHouse 原生适配及索引转换（2026-11-15）

早期 HTTP 基础层记录之后，完整原生适配已接通：详见 [ClickHouse 手册](/reference/zh-CN/clickhouse-v3.html)。`target/clickhouse-pipeline-first.log` 24 项通过（包含一个真实 MySQL8.4→ClickHouse25.8.33.6＋PostgreSQL17.12、LOCAL H2 日志链路；不是24个端到端场景），覆盖全量/增量、无主键、类型边界、目标停机、强杀重启、丢失视图隔离。

新增索引：`target/clickhouse-index-definition-fixed-unit.log` 58 项核心/API 测试通过，0失败/错误/跳过；`target/ui-clickhouse-index.log` 19 项 DOM 测试通过，含检查结果安全展示。`target/clickhouse-index-native-definition-fixed.log` 实际发布包/Java8/ClickHouse25.8.33.6 验收通过：BTREE/GSI 转换生成两个去重跳数索引、更新索引值后 FINAL 不复活旧行（外层主动关闭 exact mode，受管视图仍正确）、PK移动、无主键重数/删除、重复事务、服务端及客户端重启、实际恢复旧非空卷后拒绝沿用较新回执。验收包见 `target/artifact-clickhouse-index-fixed.log`，144098850 bytes、SHA256 c39fe5719d80bde6a5452ff49663e08b09609ecfd0fc3acbf89a6e212f098c0b。

首轮 `target/clickhouse-index-native-first.log` 是失败记录：服务端补入默认 index_granularity 导致严格规范化定义比较误报，现已显式固定8192后通过，不能把失败记录算作验收。`target/clickhouse-index-pipeline.log` 后续28项执行全部通过，含一个实际 MySQL UNIQUE/生成列索引转换、删除目标索引仅暂停 ClickHouse、恢复索引并按原错误代次重试后追平、PostgreSQL 继续，以及随后丢失视图独立隔离的链路。

以上不覆盖 ClickHouse 分布式/复制引擎、TLS、真实掉电、全部JRE、海量表或长稳性能；视图采用版本物化，不能当成跨表原子事务。

最终兼容验收：`target/clickhouse-index-compat-unit.log`58项通过，0失败/错误/跳过；`target/ui-clickhouse-index-compat.log`19项通过。`target/clickhouse-index-native-compat.log` 当前实际发布包/Java8验收通过：NONE布局不建跳数索引且重开保留数据，以及索引FINAL、重放、重启和恢复旧非空卷保护。旧配置省略新字段时保留NONE及旧指纹，新向导/示例显式启用DATA_SKIPPING。当前产物144098892bytes，SHA25695dbdbb462929ed1a262072e80d1db885696fa53007d5315c38c4d951c193212。此前28项联合链路验收先于这次仅默认兼容策略调整。全部本次测试资源已清理。


## ActiveMQ Classic（2026-11-15）

`target/classic-native-selector-fixed.log` 实际发布包/Java8独立原生验收通过：KahaDB5.19.12固定单Broker＋OpenWire5.16.8客户端、持久本地事务、真实EVENT消费ACK保留OWNER、错误选择器拦截、清空后不补造归属、回执内容篡改、客户端/服务端重启、实际恢复旧非空卷后拒绝续传。`target/classic-subscription-selector-fixed.log`2项SDK＋63项核心/API通过，0失败/错误/跳过；`target/ui-classic-first.log`20项DOM通过。原生验收包1a1945e3f91658e3f666a79af66b5da1d6ec0eb8ea2ff00cd3d9f8242a017115，145723459bytes。

`target/classic-pipeline-prebuilt.log` 一个真实 LOCAL H2、MySQL8.4→Classic＋PostgreSQL17 发布包链路通过：实际选择器消费并持久后ACK，全量/增量/无主键/JSON/生成列、Worker强杀恢复、Broker停机时SQL继续及自动追平、SQL CHECK错误时Classic继续、原错误代次修复重试、清空保护，以及明确较弱的MQ暂停隔离。前后包均6eb2a8bb053fcf777b765713e5c21aeb675e586f53c79098e5dffb2103afb954、145723578bytes；相对原生验收包仅更新目录/帮助说明。不能推导八种MQ联合、复制/TLS/掉电/容量/全部JRE验收。此前配置/HTTP来源失败和首轮脚本错误依赖Python的记录不算验收。详见[Classic手册](/reference/zh-CN/classic-v3.html)。

最终打包 `target/classic-final-unit-package.log`：2项SDK＋63项核心/API通过，0失败/错误/跳过；界面20项通过。当前产物145723617bytes，SHA256290adcc746a64c427ccefc6de712b8fbb7bbdc7ed4d48fcd2757485e99b6c2fe。与已通过链路的包逐一比较全部65091个class，仅AdapterCatalog.class的能力说明改变；运行时协议资源字节相同。见[归档证据](/reference/verification/2026-11-15-classic/README.html)。


## Hive 首批配置与恢复（2026-11-15）

[归档证据](/reference/verification/2026-11-15-hive/README.html)分别记录独立原生与真实 MySQL8.4.13→PostgreSQL17.12＋Hive4.0.1。最终冻结包9ba60d、184136264bytes，联合用例及末尾发布包一致性检查通过，session21923 exit0，自有容器/卷已清理。覆盖全量/增量、无主键、生成列、类型边界、Hive停机SQL继续及自动追平、Worker强杀保持身份、SQL约束回滚/修复重试、视图丢失隔离与真实较弱暂停结果。

独立原生用例在5c23ea通过确认丢失重放、大小写列、重启及旧非空Metastore＋warehouse备份拒绝；与最终包全部65129个class及SDK/运行时资源字节一致，仅console/app.js增加中英文恢复提示。5c23ea的128项根单元/API及126项实际JAR应用测试通过；33项DOM通过。最后UI打包跳过Java测试，不重复计数。首个Hive配置要求写入/读取会话均关闭查询结果缓存，开启时预检查拒绝。旧缓存、PID及资源不一致失败均保留，不计成功。详情和仍待验收的集群/HDFS/S3/安全/长稳/性能范围见[Hive手册](/reference/zh-CN/hive-v3.html)。


## 本地账号与权限生命周期（2026-11-15）

最终发布包c6b2638b624c1757b2309b20e6518e2d81885337910bba63484e0cd755794646，184157177bytes；[原生账号/旧版本升级与真实SQL证据](/reference/verification/2026-11-15-accounts/README.html)已归档。CONFIG显式转托管、角色/任务范围、令牌轮换/停用/删除、最后管理员、重复请求、旧/缺失目录与旧程序拒绝、强杀续存、独占离线恢复（保留RUNNING意图但不启动Worker）均通过。旧审计行升级后保留原始导出/哈希，外部验证器通过。

134应用＋2SDK=136根单元/API通过；最终JAR优先类路径单独执行134应用通过；38DOM及Helm/原生清单检查通过。最后审计UI打包跳过Java测试，与已验收35465b的全部65135个class及其他资源字节一致，仅console/audit.js改变；最终原生与真实SQL链路仍在c6b263上重跑通过。MySQL→PostgreSQL运行期间撤销授权/轮换令牌不重置流/快照，控制器重启不复活旧权限，原有配置编辑/恢复链路继续通过，168条实际审计导出已验证。测试自有容器已清理，原TODO保持原哈希。OIDC/外部目录、不可变外部锚点、多写控制器、实际K8s/CSI及规模性能未据此完成。

## 2026-11-15 金仓 PG/UTF8 与带符号 TIME

[完整证据、失败记录与摘要](/reference/verification/2026-11-15-kingbase/README.html)。最终实际 Java8 发布包 `075f6bc61b32464e764538ebcb097fea0c3df7dd28471fa5a8c63a3e1a807be8`，185388742bytes；145项根Java/SDK测试通过，另以实际fat JAR通过143项应用测试（重复验证，不计新增场景），39项DOM通过，Helm/原生静态检查通过。

金仓 V009R001C001B0025 PG/UTF8、厂商JDBC9.0.1、MySQL8.4.13＋PostgreSQL17.12 实际全量/增量、数字/JSON/二进制/生成值/Unicode/空串/微秒时间、TIME0～6位带符号时长及无主键身份通过。原生跨schema业务/断点回滚、重放、归属/epoch、只读入口和PG伪装拒绝、目标停机独立追平、Worker SIGKILL保持generation/snapshot、两端各自SQL错误修复/版本恢复、重启保持暂停、目标表丢失隔离及最终事务写入隔离均通过，最终包再次完整重跑通过。

固定binlog SDK现通过V3写/改/删普通/扩展行事件的时长解码扩展处理TIME/TIME2负小数。快照、增量及无主键规范化统一六位时长文本；V2类型范围不变。验收使用源端整数微秒，保留TIME_TO_SEC截小数和默认除法四位舍入造成的失败参考SQL记录。产品身份校验顺序缺陷已修复并保留原失败证据，未将失败运行计为通过。

金仓目录仍为EXPERIMENTAL首批配置。其他模式/版本、RAC/分布式/主备路由、TLS/其他JDK、旧物理备份/掉电/长稳、容量基准及完整接管未验收；其他连接器的完整TIME矩阵需另测。商业GaussDB、达梦/南大通用、OceanBase完整恢复等原待办不因此完成。

## 2026-11-15 达梦原生模式、类型计划与恢复

[证据、失败记录与校验清单](/reference/verification/2026-11-15-dm/README.html)。最终Java8实际发布包 `2753680903200ace25175d36fa4d9f9d3f699e2e0574f664b466535c8659a16b`，186792196bytes；151项根Java/SDK测试、实际fat JAR独立149项应用测试、40项DOM通过，0失败/错误/跳过。重复执行不计为额外场景；Helm/原生清单静态检查通过，不是实际K8s验收。

DM8.1.4.80 ARM64/厂商Java8 JDBC8.1.3.140，原生模式0、UTF8、CASE_SENSITIVE1、BLANK_PAD_MODE1、COMMIT_WRITE WAIT；原生跨schema业务/断点回滚、重放、旧epoch和归属保护通过。JSON CLOB和超38位小数VARCHAR的显式确认/转换计划已接入CLI/Web。实际MySQL8.4.13＋PostgreSQL17.12＋达梦全量/增量、65位小数值/uint64/JSON/二进制/生成值、微秒日期时间、TIME0～6位带符号时长/无主键、文本主键大小写/尾空格和四字节Unicode均通过。

拒绝不足UTF8字符容量、二进制容量或微秒间隔精度的既有空表；修正后接受且不推进业务位点。目标停机PG独立继续/达梦自动追平、Worker SIGKILL保持generation/snapshot、两端独立SQL约束修复重试、重启保持暂停、缺表隔离和最终事务写入隔离均通过，最终包再次完整重跑。达梦缺表的SQLState22000/vendor-2106现按真实驱动异常明确诊断，其他数据异常不被伪装成缺表。

早期验证脚本的大小写/源SQL引用错误，以及缺表诊断断言失败均保留，不算通过。仅清理本次自身环境。其他达梦版本/兼容模式、DSC/DPC/MPP/HA路由、TLS、其他JDK、非空接管/DDL、旧物理备份/掉电/长稳、海量目录/事务和硬件性能仍待验收，目录保持EXPERIMENTAL。南大通用、PG/Oracle源、迁移切换工作台和整体目标仍未完成。


## 2026-11-15 GBase 8c and Docker development preview

GBase8cV6 S1.3.0B19 PG/UTF8 / vendor JDBC3.0.0B02 first native MySQL8.4.13+PostgreSQL17.12 mixed snapshot/CDC, TIME0..6, keyless/text-key, target outage/catch-up, worker SIGKILL, independent SQL repair/retry, persistent pause, missing-table isolation and fences passed. Final JAR SHA256 `2b462813f74210cab0b2f93a40d700c27c45dffd5ac0de5061995638fa4e6034`,187636341bytes;157root Java/SDK tests,155actual-JAR-first app tests,41DOM checks and deployment static checks pass. These repeated executions are not additional distinct cases. The Docker development preview uses this same copied JAR and passed health/admin/source-UI/unauthenticated-denial HTTP verification. Credentials remain private.

首批 GBase 8c 配置已通过；8a/8s、分布式/其他兼容模式、安全/容量等仍待完成，保持实验状态。完整目标尚未完成。详见 / full scope and failed runs: [GBase8c evidence](/reference/verification/2026-11-15-gbase8c/README.html).


## 2026-11-15 Common validation cut / 共同屏障

Final JAR SHA256 `d50ff25fbfe3954b0134bd04d703b00f8f697262b8cec7d8ea0e488354e0e336`,187654135bytes.162root Java/SDK cases,160actual-JAR-first app cases,41DOM checks and deployment static checks pass. Native source lock/MVCC/metadata/deadline/SIGKILL and transactional-target quiescence passed LOCAL/H2 plus EXTERNAL PostgreSQL/MySQL/openGauss journal profiles, including a real unselected SQL-target outage and restored CDC. The full existing GBase 8c mixed fault case also passes on this runtime. This is not a row-diff/repair/cutover or UI acceptance claim.

共同屏障基础通过，不代表行级对账/修复已完成。完整范围、失败记录及边界见 / [Evidence](/reference/verification/2026-11-15-validation-barrier/README.html).


## 2026-11-15 SQL逐行校验与CLI

最终JAR SHA256 `acdb9a58b77151e3c30ddfdcdb3587fd4680a503edc5d7585288ca0bbc05ea8c`，187694420bytes；181项应用+2项Classic SDK=183项根构建测试通过，最终JAR优先的181项应用测试另独立通过，41项DOM及部署静态检查通过。LOCAL/H2、外部PostgreSQL/MySQL/openGauss日志下的完整真实校验用例通过：源MVCC密封、无主键负亚秒TIME快照/CDC、真实目标扫描进程SIGKILL恢复、部分目标扫描丢弃重读、源库停机后比对、缺失/多余/变更及错误行身份识别、CLI和持久暂停。8份摘要的预期数量已独立核对。目标为MySQL8.4/PostgreSQL17，不表示分布式GaussDB或全部厂商读模式已验收。修复、管理端作业/UI、接管切换仍待完成。保留MySQL REAL映射、负亚秒TIME符号及Set顺序密封失败记录；详见[归档证据](/reference/verification/2026-11-15-row-reconciliation/README.html)。


## 2026-11-16 Managed validation jobs / 管理界面校验作业

Final JAR SHA256 `34a4675fe853e2976392d1909a9b45d551f0d939e9c82ae448988a6d7a93ce4b`,187705360bytes.187root Java/SDK cases (185app+2Classic SDK),185independent actual-JAR-first app cases,44DOM and deployment static checks pass. Native LOCAL/H2 and external PostgreSQL/MySQL/openGauss profiles all pass real HTTP/controller/Worker startup,request replay,SQL comparison,physical relation-lock cancellation,sealed-source retry,report/audit persistence across controller restart and durable pause. Eight managed summaries independently match expected counts and exact six-operation sequences. A fresh external MySQL journal stays absent during status reads,then initializes on Worker START. Final Docker preview and seven assets pass HTTP checks. Raw row details/repair,skip,cutover,HA/scale/vendor matrices remain unaccepted. [Evidence](/reference/verification/2026-11-16-managed-validation/README.html).
