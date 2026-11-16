---
kind: docs
locale: zh
title: "同步任务与 V3 配置"
sourcePath: docs/zh-CN/pipeline-v3.md
---

# V3 多库、多目标运行手册

English: [V3 pipelines](/docs/en/reference/pipeline-v3.html)。更新：2026-11-14。V3 可从 CLI 或 Web 运行；向导默认 v3，也保留 v2 单库单目标配置。两种格式和管理表隔离，尚未自动迁移旧任务。

## Web 向导和恢复

打开控制台并登录，选择“新建任务”：

1. 使用默认 V3，填写逻辑源、逗号分隔的多个 database、复制客户端 serverId 和凭据。
2. 逐库填写第一个目标的 schema/database；可添加更多目标，每个目标使用独立标识和逐库映射。选择本机日志或外部事务日志及容量。向导预览遮蔽全部密码和 JDBC URL 内的密码；保存后任务保持停止，检查后再启动。
3. 在详情中查看全量、积压及各目标确认序号。某目标 SQL 失败时，使用其“恢复此目标”，请求携带该目标的错误版本；全任务的“修复后恢复”使用全局错误版本，两者互不混淆。
4. “停止本机 Worker”只停止本机进程；“暂停共享任务”阻止备用节点接管，并尝试确认各目标的本地 fence。无法联系的目标显示隔离未确认，不冒充已完全静止。全局恢复不会清除其他目标的 SQL 暂停。

Web 的本机日志固定在控制目录的 `journals/<pipelineId>`，防止导入配置选择任意服务器路径。新建 YAML 的 `journal` 省略 `path`；带已有 CLI 本机日志路径的导入会拒绝，需先制定日志/目标状态迁移计划，不能简单删除旧状态。外部日志配置可直接导入。控制台重启保留任务及暂停意图、同一个托管日志目录和原快照/断点。

已实现 VIEWER/OPERATOR/ADMIN、本地账号与令牌轮换、精确任务授权、配置编辑/历史恢复和持久审计。手工补数/跳过、行级校验修复及自动切换工作台仍待完成。浏览器 DOM 和真实 HTTP/数据库控制链路已验证；截图级及真实 Kubernetes 图形操作验收仍待补充。

## 配置和启动

参考 [pipeline-v3.yml](/files/config/pipeline-v3.yml)。显式列出一个逻辑 MySQL 拓扑内的 `databases`；每个目标用 `mappings` 指定源 database → 目标 schema/database。不同目标可订阅不同子集，但每个源 database 必须至少有一个目标。事务目标包括 `GAUSS`、`POSTGRESQL`、`MYSQL`，以及首批实验配置的 [KINGBASE](/docs/zh/reference/kingbase-v3.html)、[DM](/docs/zh/reference/dm-v3.html)、[OCEANBASE](/docs/zh/reference/oceanbase-v3.html)，以各产品验收边界为准；`KAFKA`、`RABBITMQ` 和 `NATS_JETSTREAM` 使用[消息投递协议](/docs/zh/reference/messaging-v3.html)，映射值是消息命名空间。各目标独立线程，慢 I/O 不阻塞其他目标。MySQL 目标必须是独立实例；用实际 `server_uuid` 阻止源、日志或目标落在同一 MySQL 实例形成反馈。

```bash
export RIVOMESH_NODE_ID=node-a
export MYSQL_PASSWORD='source-password'
export POSTGRES_PASSWORD='target-password'
export GAUSS_PASSWORD='target-password'
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/pipeline-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/pipeline-v3.yml
```

`check` 读取源对象和目标连接，不初始化任务、不创建业务表，也不验证完整建表权限和源全量锁权限。运行时会创建管理表及缺失业务表。已有业务表默认仅接受结构匹配、无外键/触发器且为空的表；非空目标需要迁移计划，目前会阻断，绝不自动清空。

所有目标业务表由同步服务独占写入。源需开启 GTID、ROW/FULL、复制更新日志，关闭事务压缩和部分 JSON 行镜像；不接受 tagged/anonymous GTID。全量还需短时执行 `FLUSH TABLES WITH READ LOCK` 的权限。锁内建立 InnoDB 一致性视图、校验结构、记录 GTID 并打开读游标后释放锁；大表读取期间仍持有 MVCC 视图和表元数据锁，应监测源 undo 历史长度和业务 DDL 等待。

## 全量、增量与恢复

界面区分源快照准备与目标投递。所有订阅确认当前源快照清单之前，阶段仍为 `TARGET_SNAPSHOT`。“源快照行数”统计源端制备的行；各目标单独显示已确认表数。消息确认仍不表示消费者处理完成。目标每完成一张表立即确认，所有目标均确认该表后即可回收其源快照分片。

源事务和采集位点在日志中原子提交。每表快照记录独立基线及有校验和的分片：完成分片集可复用；中断的未完成源快照重启后整体重新读取该表，不能恢复已丢失的 MVCC 视图。目标端已提交分片按目标断点继续，不重复写入。

无主键表保留每一个重复行出现次数，为每个出现分配内部 `_rivomesh_row_id`。该名称与源列冲突时拒绝。更新和删除依据完整旧镜像找到一个出现；源顺序中的身份变更和标准化事件一次提交，所有目标复用同一结果。慢目标重放不会再次变更身份集合。JSON 对象顺序和数字小数位差异按值比较；SQL NULL 与 JSON null 保持区别。

存储生成列使用日志中的值；虚拟生成列仅支持已列入白名单的确定性表达式，使用版本化表达式与日志内历史字段求值，绝不读取当前源行补历史数据。目标列为普通物化列。计算上下文固定为快照记录的 SQL mode 和 UTC；不在白名单的函数、缺失基础镜像或历史结构不匹配会停止推进。此模式不承诺复现任意客户端 SQL mode 下的临时查询结果。切换前需要规划原生生成列与业务写入语义。

每个事务型目标在一个本地事务中写业务数据和断点，并使用递增 epoch 隔离旧节点。多个目标独立确认；一个目标暂停时，其他目标继续。目标可能已提交但响应丢失时，恢复先核对目标事务 ID 和内容哈希，再补日志确认。不能把所有目标承诺为一个分布式原子事务。不同表的快照基线可能不同，只有共同追平后才能作为跨表一致的业务接管点；MySQL＋事务型 SQL 的共同屏障 Java 服务已实现并通过首批真实库验证，见[共同屏障](/docs/zh/reference/reconciliation-workflow.html)；行级对账、修复及界面/接管工作流仍待完成。

日志以最慢目标为回收边界，暂停目标也保留未确认历史。所有目标确认全量后回收快照分片，保留清单、基线和无主键身份；目标管理状态丢失后不能假装从已回收快照恢复，需要重建计划。运行参数中的 `maxBytes` 包含事件、标准化事件、快照及身份数据的逻辑负载，还包含尚未消耗的标准化工作空间预留。数据库索引、事务日志、元数据和空闲页另占空间。回收不等于物理文件立即缩小。超大目录分页、物理容量预警、历史去重回执压缩及超大事务分片仍待完成，不能把逻辑配额当作磁盘总上限。

新采集事务在持久化原始事件时，同时预留其标准化副本、无主键身份及可能新增的身份负载；标准化与预留消耗在同一事务中提交，防止原始日志占满后无法再标准化。空间被慢目标占满时，采集等待，不推进未持久化 GTID；投递、回收、租约心跳继续。消费者恢复后自动释放空间并续传。等待期间不把本地主动背压误判为源心跳超时；暂停/关闭会先取消阻塞回调，再等待复制连接退出。

若单个事务及其工作空间本身超过总配额，报 `TRANSACTION_EXCEEDS_JOURNAL_QUOTA` 并保留旧源断点。快照/身份构建空间不足，或升级前没有预留的旧日志无法标准化时，报 `JOURNAL_WORKSPACE_REQUIRES_QUOTA_PLAN`。当前全量先构建所有源快照，单表跨配额流式释放、部分全量重基线和超大事务分片仍未实现；这些情况需要扩容或专项计划。不能删表/分片来“腾空间”。配额调整不改变任务语义指纹：停止相关 Worker，调整并重载配置，再按当前全局错误版本恢复。UI 配置编辑流程仍待实现。

## 日志部署选择

`LOCAL` 使用 Java 8 兼容的 H2 2.2.224，`path` 是私有目录，相对路径以配置文件目录为基准。目录内保存敏感行数据，权限设为 0700。自动服务模式允许同机 CLI 读取状态和恢复；它不是跨机器数据库部署。保留整个目录及卷，不要只复制运行中的 `.mv.db`。跨主机自动接管使用 `EXTERNAL` 事务数据库；不要把共享文件系统上的 H2 当作已验收的集群日志。

`EXTERNAL` 可用 PostgreSQL、openGauss 或独立 MySQL。所有 Worker 使用相同日志实例/namespace/pipelineId 和目标配置，不同 nodeId；数据库时钟租约与 epoch 管理所有权。MySQL 日志需 InnoDB，服务重启不可丢失已确认提交。源与目标数据库的提升/隔离由外部高可用系统负责，Rivomesh 不提升数据库主库。V3 已通过 Worker 强制终止恢复、8.4 普通主从提升及 MGR 全量中途选主测试；其他版本/长稳矩阵仍需补验，不能直接套用 v2 的测试结论。

## 错误与恢复 FAQ

- **目标 SQL 错误**：该订阅进入 PAUSED，保存错误版本。修复目标权限、结构或数据原因后，使用 `status` 返回的 `errorGeneration` 恢复原事务。默认恢复不跳过、不修改 GTID。
- **连接中断、死锁**：暂时错误自动重试；旧 owner 不能越过目标本地 fence。源故障重连校验候选主库的 GTID 完整性及所有快照依赖；缺日志或多可写节点时等待/阻断，不能回退位点。
- **日志配额耗尽**：增量积压使用上述背压/自动续传；快照或单事务无法容纳时使用错误版本和扩容计划。已有快照加无主键身份可能占用多份源数据量，还需计算标准化预留及积压窗口。已永久丢失的磁盘或已被源清理的未读 binlog 不能靠背压重建。
- **运行中 DDL**：目前安全阻断；完整历史 DDL、在线结构演进及 DDL 跳过计划仍未完成。包括其他 database 的 SQL 事件也可能阻断，以防跨库引用漏判。
- **UNIQUE(email)**：`DOWNGRADE_BUSINESS` 把次级业务 UNIQUE 建为普通索引。源约束及仅同步服务写入、事务断点/幂等保证共同维持数据来源唯一；接管业务写入前必须校验并重建约束。主键、同步身份键和内部唯一性不能降级。
- **GSI**：模型中的业务 GSI 可替换普通索引，失去全局路由和全局唯一性；身份 GSI 必须先设计分布键，不会降级。既有目标的 GSI/UNIQUE 不自动 DROP。商业分布式 GaussDB 尚未实机验收。
- **表达式/前缀/倒序/特殊方法索引**：当前要求单独转换计划并暂停该目标，不静默省略。表缺失但带未支持索引时也会先阻断，等待计划。
- **类型范围**：已覆盖常见整数/unsigned、小数、浮点、文本/二进制、YEAR、DATE/DATETIME/TIMESTAMP、JSON。V3 已增加 MySQL TIME 带符号微秒时长采集，JDBC 快照与 TIME/TIME2 行事件统一规范文本；关系目标使用 INTERVAL/MySQL TIME(6)，分析及消息目标使用时长文本，首批实际链路验收范围见[金仓](/docs/zh/reference/kingbase-v3.html)和[达梦](/docs/zh/reference/dm-v3.html)手册。BIT、ENUM/SET、空间/零日期、非 InnoDB 和其他对象还需扩展与测试。
- **旧任务迁移**：继续用旧配置保持 v2 断点。不要仅增加 `formatVersion: 3` 来接管旧目标；非空数据及状态迁移需要显式计划。

```bash
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar status config/pipeline-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar resume config/pipeline-v3.yml gauss 1
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar pause config/pipeline-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar resume-pipeline config/pipeline-v3.yml 1
```

恢复命令的 `1` 分别替换为订阅或全局的当前错误版本；旧版本请求会被拒绝。永久源错误持久为 ERROR，备用节点无法绕过；pause 输出各目标隔离确认结果。RBAC、本地账号、配置编辑与审计已实现；手工补数/跳过、行级校验修复、切换回退及其 Web 操作仍在实现范围内。
