---
kind: docs
locale: zh
title: "校验与修复流程"
sourcePath: docs/zh-CN/reconciliation-workflow.md
---

# 数据校验、修复与共同屏障

当前已实现共同屏障、MySQL 跨表一致性视图、私有磁盘行存储、事务型 SQL 目标逐行比对及 CLI。共同屏障的 LOCAL/H2、外部 PostgreSQL/MySQL/openGauss 四种日志配置已通过真实库验收；新增逐行比对的验收范围单独记录。**共同校验点修复CLI首版已完成指定场景验收，详见修复手册；修复界面首版见管理端修复手册，失败事务另有[补偿手册](/docs/zh/reference/transaction-compensation.html)，业务切换仍待完成。**

## 已实现的基础契约

`SourceAdapter.ConsistentRead` 表示同一源位点下的多表视图；`SourceAdapter.covers` 由源适配器解释位点覆盖关系，不在通用 `SourcePosition` 中比较 GTID/LSN/SCN 字符串。MySQL 使用 GTID 集合比较。

`PipelineValidationBarrier.open(config, selectedTargets, maximumGateMillis, maximumReadMillis)`：

1. 检查现有日志的配置身份、运行状态及全量快照完成情况。
2. 在 MySQL 获取短时全局读锁，建立同一个 REPEATABLE READ 一致视图，并在该事务中固定所有声明表的元数据；记录源 GTID 位点。扫描范围包含配置中的多个 database。
3. 等待持久采集、规范化及所选目标 ACK 达到该源位点。若锁内源 GTID 继续前进、任务状态/epoch 改变或所选目标暂停，则拒绝这个屏障。
4. 在日志管理行锁内再次核对 generation、epoch、采集位点、序号、快照及所选目标确认，再持久暂停任务并增加 epoch。其他目标可仍处于暂停或离线状态；不能将未选择的目标称为已校验。
5. 通过现有目标元数据获取本地事务 fence，核对目标序号。`JdbcSink.existing` 不会创建丢失的目标管理表或断点。
6. 释放本次源写入锁，保留同一个 MVCC 视图供后续逐表读取。源业务可以继续写入；同步任务保持暂停，后续恢复需处理屏障之后的 binlog。

证书保存源/采集位点、配置指纹、generation、epoch、序号、错误版本、表结构摘要及所选目标本地断点。证书本身只证明已经建立这个同步边界，不能证明行数据相等。后续读取必须再次检查任务状态和断点；其他操作恢复/切换任务会使原会话失效。

## 资源、超时与故障

- 源写入锁上限为显式参数（1～120秒），读取会话单独限时（不短于锁上限，最多24小时）。超时主动中止本次连接；会话 `wait_timeout` 是额外回收措施，不修改全局参数。跨网络故障不能承诺在某个精确毫秒从服务器端解锁，应同时监测数据库会话。
- 在一致性视图存活期间，表元数据锁可能阻塞业务 DDL，旧版本保留也会增加 undo 压力。原生测试检查实际等待状态及释放，而不是仅检查函数返回。
- 提前关闭尚未读完的表游标会中止整个校验视图，避免后台无界排空结果，也不允许把部分扫描称为全表通过。
- 进程强杀释放连接，重启后会保留已经写入的持久暂停。MySQL 短锁或快照会话丢失时，即使驱动重连到同一服务实例，未完成的源扫描也需要重新建屏障。
- 目标 fence 失败后保留已持久的暂停状态，不能为了重试校验而自动恢复任务。目标端必须提供一致的可写入口；这个协议不替代数据库 HA 路由及旧主隔离。
- 当前屏障的所选目标为事务型 SQL 目标。MQ 发布确认不代表下游数据已校验；分析目标的物化/可见契约需要各自适配，不能统一套用 SQL 断点。

MySQL 依据：[一致快照](https://dev.mysql.com/doc/refman/8.4/en/commit.html)、[FLUSH](https://dev.mysql.com/doc/refman/8.4/en/flush.html)、[会话超时](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html)。

## 逐行校验与命令行

同步服务应是目标业务表的唯一写入者。开始时任务必须处于 RUNNING，且所选目标已经完成全量同步并能够追到共同位点。命令会短时阻塞整个 MySQL 实例的业务写入，随后释放源写锁；同步任务保留 PAUSED，源业务可以继续写，之后需要显式恢复同步。

```sh
# 一步完成源扫描和目标比对；目标 ID 使用英文逗号分隔
java -jar rivomesh-app.jar validate-data config/task.yml /private/reports postgres,shadow

# 也可分两步，第一步输出 VALIDATION_SOURCE_SEALED <reportId>
java -jar rivomesh-app.jar validate-stage config/task.yml /private/reports postgres,shadow
java -jar rivomesh-app.jar validate-compare config/task.yml /private/reports <reportId>

# 查看历史摘要，不要求原同步屏障仍有效
java -jar rivomesh-app.jar validation-report config/task.yml /private/reports <reportId>
```

CLI 默认写锁上限30秒、源扫描上限1小时、每个目标表扫描上限10分钟；磁盘逻辑预算1GiB、单行预算4MiB。Java 服务接口可显式设置参数。预算统计包含源/目标暂存行和无主键身份资料，不能将1GiB等同于1GiB源业务数据。当前物理文件检查发生在分批提交边界，H2 页、索引和临时数据可能额外占用空间；需要容器/文件系统配额才能形成硬物理上限。生产容量标准及超大表专项仍待验收。

源扫描使用原屏障中的同一 MVCC 视图；无主键表先分页读取持久日志中的 occurrence ID，再按完整归一化内容匹配源端多重集。完整扫描完成才密封源数据，密封后不接受混入新源视图。私有目录/文件在支持 POSIX 权限的平台使用0700/0600，并通过本机和跨进程锁阻止并发写入；存储并未加密，应部署在合适的私有磁盘。

目标读取在同一条连接上核对并持有本地同步检查点行锁，检查归属、表结构和快照完成状态，然后流式读取业务表；不会创建管理表、推进同步序号或执行修复。JSON、数值、浮点、日期/微秒时间、二进制和 TIME 复用同步归一化契约。无主键表同时比较内部行身份，内容相同但身份错误会产生缺失及多余差异。

MySQL 的 TIME 读取在 SQL 中显式转为 CHAR，包括源快照、一致性视图、虚拟生成列求值和目标校验，避免 JDBC 时间对象/格式化丢失负亚秒值的符号；例如 `-00:00:00.000001` 必须保留为负1微秒。MySQL 目标的 FLOAT32 显式建为 FLOAT；默认 SQL 模式中的 REAL 是 DOUBLE 的别名，不能直接用来表示 FLOAT32，见[官方数值类型说明](https://dev.mysql.com/doc/refman/8.4/en/numeric-type-syntax.html)。既有错误类型表需要显式迁移计划，本次读取不会自动改表。

报告记录每个目标/表的源行数、目标行数、内容根摘要，以及 `missing`（目标缺失）、`extra`（目标多余）、`changed`（身份相同而内容不同）数量；零差异为 `VALIDATION_MATCH`，否则为 `VALIDATION_DIFFERENCES`。Java 存储接口支持按身份摘要分页，每页最多200项。公共摘要不包含原始业务行，私有存储中的原始值仍是敏感数据。

恢复边界：

- 源扫描未完成就中断：原 MVCC 视图已丢失，不能继续旧行游标。报告标记需要新视图；检查任务状态并显式恢复后重新建屏障，禁止把两个源时间点拼成一次校验。
- 源数据已经密封、目标扫描中断：`validate-compare` 会核对原配置、generation、epoch、错误版本、源/规范化序号和物理目标断点，验证源密封及行校验和，丢弃部分目标扫描后重新读取。这个阶段不需要源数据库在线。
- 已恢复任务、换配置或断点改变：拒绝继续旧比对；历史摘要仍可查看。读取历史报告不代表当前数据仍一致。
- 校验失败、超时或完成都不自动恢复任务。确认结果后，按现有 `status` / `resume-pipeline` 操作使用当前错误版本显式恢复。

本流程的端到端真实比对目前以 MySQL8.4 源、PostgreSQL17/MySQL8.4 目标为首批验收配置。其他事务型目标已接入同一读取接口，但不能据此宣称厂商版本、模式、分布式集群全部通过；MQ 和分析目标尚未接入这一比对协议。

## FAQ

- **为什么校验后目标不再追源？** 建立共同点会持久暂停同步。先检查报告和任务状态，再使用当前错误版本显式恢复。不要长时间遗留暂停，应监测源 binlog 保留期和日志容量。
- **源扫描超时后能扩大超时继续原报告吗？** 不能恢复已经丢失的 MySQL MVCC 事务。保留失败报告，按操作流程恢复任务，再用新的读取预算建立新校验点。
- **同样的无主键数据为什么仍有缺失/多余？** 内部 occurrence ID 错误会影响后续 UPDATE/DELETE。仅比较业务值或行数会漏掉这个问题。
- **`VALIDATION_SOURCE_SEAL_MISMATCH` 能修改摘要后重试吗？** 不应修改摘要或 H2 数据强行通过。该错误可能是文件损坏、数据改动或开发阶段旧报告格式差异；保留证据并建立新校验。历史摘要仍可用于排查。
- **校验是否已经修复差异或重建 UNIQUE？** 没有。校验只读取目标。需要修复时可使用[管理端修复](/docs/zh/reference/managed-repair.html)，切换前另行验证约束。
## 故障处理手册

先记录任务 ID、配置修订、采集位置、失败代次、受影响订阅和请求 ID。V3 的采集位置表示完整源事务已进入日志，目标确认位置表示该订阅已确认的前缀。跳过后还要查看未关闭缺口、连续已应用位置和安全覆盖位置。读到旧状态时，以界面显示的观测时间和日志库的最新记录为准。

管理界面操作均可查看历史。API 写操作走 `POST /api/tasks/{task}/actions`，绑定 `expectedRevision` 和 `X-Request-ID`；浏览器会话还使用 CSRF 令牌。涉及失败代次时，按对应手册使用任务或订阅的 `errorCount`。响应丢失时，查询同一请求，或以原请求 ID 和原请求体重试。受理状态和业务提交状态分别显示。

| 场景与现象 | 界面或 API 操作 | 断点、缺口与重试 |
|---|---|---|
| MySQL 主库切换，或备库 IO/SQL 线程故障 | 查看源连接阶段及候选主库状态。由数据库运维隔离旧主并完成提升，修复复制错误并确认保留所需 GTID 历史。 | Rivomesh 从持久 GTID 重新选择合格主库。候选落后、复制异常或多个可写节点时保留原断点，恢复准入后继续。见[主备恢复](/docs/zh/reference/recovery.html)。 |
| MySQL binlog 缺失、PostgreSQL 复制槽/WAL 丢失或解码失败 | 管理员打开「检查采集恢复」，或调用 `GET /api/tasks/{task}/capture-recovery`。恢复原日志或选可读取原位置的源。失去日志时审阅新基线范围。 | 只读检查保留采集位置并列出全部潜在受影响订阅。范围未证明时保持错误暂停。见[采集恢复](/docs/zh/reference/capture-recovery.html)。 |
| 可证明边界的 MySQL 解码故障 | 留存原事务，核对具体 GTID 和各目标，符合有主键档案时批准跳过。 | 任务保持暂停，目标确认位置不变。按需恢复后续增量，并补核已记录的源缺口。[源事务跳过](/docs/zh/reference/capture-recovery.html#批准跳过源事务) |
| 目标约束、权限或 SQL 错误 | 确认失败订阅，修复目标原因，提交该订阅的 `RESUME_TARGET`。其他健康订阅可继续。 | 使用当前订阅错误代次。事务再次从原位置应用；目标回执和数据在同一事务里更新。 |
| 目标已提交，日志确认或响应丢失 | 暂停任务并获取事务证据，核对目标原生回执。符合档案时用管理员管理界面或 `CONFIRM_COMMIT` 确认。 | 确认只为同一完整事务补写日志确认，保留原目标写入。任务及目标暂停由管理员审核后显式恢复。见[提交确认](/docs/zh/reference/commit-acknowledgement.html)。 |
| Controller 或 Agent 断开，命令待执行 | 从可用入口看执行节点、观测时间和操作状态。固定 Agent 配置下，可为离线 Agent 提交持久 `STOP` 并查看原请求结果。 | 活着的 Worker 可以继续持久同步；失联 Agent 显示未知。开机后同一命令按持久请求处理。迁移前核对日志、密钥和目标身份。见[全局控制](/docs/zh/reference/global-control.html)。 |
| 本地卷、外部日志库故障或存储达到配额 | 查看日志存储阶段。恢复原卷或原外部日志，核对日志世代、最后持久断点及目标回执，再重启。大事务超额时审阅扩容及事务规模。 | 保留完整日志、配置、快照工件和回执。目标还在而日志丢失时需要恢复整个日志或另立新基线。见[部署和存储](/docs/zh/reference/console-and-deployment.html)。 |
| 刷新浏览器、会话撤销或权限变更 | 普通刷新沿用有效会话。被撤销或过期时重新认证；管理员可从会话或账号操作撤销会话。 | 会话变更不推进同步位置。重新认证后通过相同请求 ID 检查正在处理的操作和结果。见[浏览器会话](/docs/zh/reference/browser-sessions.html)。 |
| 已形成完整事务，需要人工排除 | 管理员审阅证据、目标范围和原因后，用目标事务跳过流程。核对原生 SKIP 回执，再决定是否继续。 | 只处理该订阅的整笔下一待处理事务，并显式记录缺口。安全覆盖可以前进；实际连续应用水位保留缺口。见[事务跳过](/docs/zh/reference/transaction-skip.html)与[缺口核验](/docs/zh/reference/gap-verification.html)。 |
| 需要补数据或清除原事务的目标副作用 | 管理员审阅前后值、影响范围与凭据摘要，再选择前镜像补偿或手工修正。提交或取消均关联原请求。 | 写入和凭据原子提交，任务保持暂停。补偿后重放原事件；手工修正后复核缺口和原位置。取消后检查原操作是否已提交。见[补偿](/docs/zh/reference/transaction-compensation.html)与[手工修正](/docs/zh/reference/manual-correction.html)。 |

关系、物化和消息目的地分别报告各自的进度。消息确认表示消息已由 broker 接收；消费端是否落库或应用需要从下游核对。SQL 原生回执、补偿和缺口核验针对产品手册中的已验证档案。

## 切换与回切

如果已有从 MySQL 导入到 PostgreSQL 的数据，先使用[非空目标预检](/docs/zh/reference/nonempty-target-preview.html)比较。

先让源保持唯一业务写入端，目标由同步服务写入。最终切换时暂停业务写入，建立新的共同校验点，核对目标内容和消费可见性，恢复目标业务约束，再交接写入。曾降级为普通索引的 UNIQUE 或 GSI 需要在接管前根据目标产品重新验证。旧校验报告保留历史结果；切换后的业务数据和回切基线另行校验。非空数据接管、自动跨 Agent 接管及跨产品约束恢复按相应验收档案推进。

[English](/docs/en/reference/reconciliation-workflow.html)
