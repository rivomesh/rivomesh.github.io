---
kind: docs
locale: zh
title: "多库、多目标同步配置"
sourcePath: docs/zh-CN/pipeline-v3.md
---

# 多库、多目标运行手册

本手册介绍多库、多目标同步。配置中的 `formatVersion: 3`（界面可能标为 V3）是任务配置格式，用于区分旧的单库单目标任务，不是数据库版本或用户需要掌握的开发阶段。新建任务使用默认格式；已有任务不能只改版本号迁移。

English: [V3 pipelines](/docs/en/reference/pipeline-v3.html)。更新：2026-11-14。V3 可从 CLI 或 Web 运行；向导默认 v3，也保留 v2 单库单目标配置。两种格式和管理表隔离，尚未自动迁移旧任务。

## Web 向导和恢复

打开控制台并登录，选择“新建任务”：

1. 使用默认 V3，填写逻辑源、逗号分隔的多个 database、复制客户端 serverId 和凭据。
2. 逐库填写第一个目标的 schema/database；可添加更多目标，每个目标使用独立标识和逐库映射。选择本机日志或外部事务日志及容量。向导预览遮蔽全部密码和 JDBC URL 内的密码；保存后任务保持停止，检查后再启动。
3. 在详情中查看全量、积压及各目标确认序号。某目标 SQL 失败时，使用其“恢复此目标”，请求携带该目标的错误版本；全任务的“修复后恢复”使用全局错误版本，两者互不混淆。
4. “停止本机 Worker”只停止本机进程；“暂停共享任务”阻止备用节点接管，并尝试确认各目标的本地 fence。无法联系的目标显示隔离未确认，不冒充已完全静止。全局恢复不会清除其他目标的 SQL 暂停。

Web 的本机日志固定在控制目录的 `journals/<pipelineId>`，防止导入配置选择任意服务器路径。新建 YAML 的 `journal` 省略 `path`；带已有 CLI 本机日志路径的导入会拒绝，需先制定日志/目标状态迁移计划，不能简单删除旧状态。外部日志配置可直接导入。控制台重启保留任务及暂停意图、同一个托管日志目录和原快照/断点。

已实现 VIEWER/OPERATOR/ADMIN、本地账号与令牌轮换、精确任务授权、配置编辑/历史恢复和持久审计。[托管校验](/docs/zh/reference/managed-validation.html)及[报告驱动修复](/docs/zh/reference/managed-repair.html)已有明确验收档案；PostgreSQL / MySQL 指定事务型目标已提供[提交确认](/docs/zh/reference/commit-acknowledgement.html)、[事务跳过](/docs/zh/reference/transaction-skip.html)、[缺口复核](/docs/zh/reference/gap-verification.html)、[补偿](/docs/zh/reference/transaction-compensation.html)和[手工修正](/docs/zh/reference/manual-correction.html)。按[首版部署基线](/docs/zh/reference/first-release.html)启用对应能力。业务切换需独立规划。目标故障阶段与恢复边界见[失败事务诊断](/docs/zh/reference/failed-transactions.html)。浏览器 DOM 和真实 HTTP/数据库控制链路已验证；截图级及真实 Kubernetes 图形操作验收仍待补充。

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

每个事务型目标在一个本地事务中写业务数据和断点，并使用递增 epoch 隔离旧节点。多个目标独立确认；一个目标暂停时，其他目标继续。目标可能已提交但响应丢失时，恢复先核对目标事务 ID 和内容哈希，再补日志确认。不能把所有目标承诺为一个分布式原子事务。不同表的快照基线可能不同，只有共同追平后才能作为跨表一致的业务接管点；MySQL＋事务型 SQL 的共同屏障 Java 服务已实现并通过首批真实库验证，见[共同屏障](/docs/zh/reference/reconciliation-workflow.html)；行级校验与审阅修复见[管理界面校验](/docs/zh/reference/managed-validation.html)和[管理界面修复](/docs/zh/reference/managed-repair.html)，业务接管需另行规划。

日志以最慢目标为回收边界，暂停目标也保留未确认历史。所有目标确认全量后回收快照分片，保留清单、基线和无主键身份；目标管理状态丢失后不能假装从已回收快照恢复，需要重建计划。运行参数中的 `maxBytes` 包含事件、标准化事件、快照及身份数据的逻辑负载，还包含尚未消耗的标准化工作空间预留。数据库索引、事务日志、元数据和空闲页另占空间。回收不等于物理文件立即缩小。超大目录分页、物理容量预警、历史去重回执压缩及超大事务分片仍待完成，不能把逻辑配额当作磁盘总上限。

未关闭的[事务缺口](/docs/zh/reference/transaction-skip.html)和待决跳过计划会保留该笔事务的原始和标准化事件。所有目标已确认的其他事务仍可回收。共同校验点的核验回执验证通过后，缺口解除保留。若需保留的事件占满日志，采集暂停等待，源断点保持，Worker 记录 `JOURNAL_BACKPRESSURE`。若建立新的共同校验点还需采集更多事务，应先增加逻辑配额。核验已有且有效的暂停校验点无需向日志增加事件负载。恢复时应同时保留原始证据和日志。

新采集事务在持久化原始事件时，同时预留其标准化副本、无主键身份及可能新增的身份负载；标准化与预留消耗在同一事务中提交，防止原始日志占满后无法再标准化。空间被慢目标占满时，采集等待，不推进未持久化 GTID；投递、回收、租约心跳继续。消费者恢复后自动释放空间并续传。等待期间不把本地主动背压误判为源心跳超时；暂停/关闭会先取消阻塞回调，再等待复制连接退出。

若单个事务及其工作空间本身超过总配额，报 `TRANSACTION_EXCEEDS_JOURNAL_QUOTA` 并保留旧源断点。快照/身份构建空间不足，或升级前没有预留的旧日志无法标准化时，报 `JOURNAL_WORKSPACE_REQUIRES_QUOTA_PLAN`。当前全量先构建所有源快照，单表跨配额流式释放、部分全量重基线和超大事务分片仍未实现；这些情况需要扩容或专项计划。不能删表/分片来“腾空间”。配额调整不改变任务语义指纹：停止相关 Worker，调整并重载配置，再按当前全局错误版本恢复。UI 配置编辑流程仍待实现。

在配置和 Web 新建向导中使用 `source.type: MYSQL`。用 `source.clusterId` 标识逻辑源集群，`databases` 列出同步范围。需要固定版本时，可填写 `source.expectedVersion: "8.2.0"`；填写 `"8.2"` 匹配同一主次版本。连接候选源时校验服务版本，版本冲突会在预检阶段报告。留空时由服务探测版本。

## 日志部署选择

`LOCAL` 使用 Java 8 兼容的 H2 2.2.224，`path` 是私有目录，相对路径以配置文件目录为基准。目录内保存敏感行数据，权限设为 0700。自动服务默认绑定回环地址，Worker 与同机 CLI 共享日志，无需外部主机名解析；它不是跨机器数据库部署。保留整个目录及卷，不要只复制运行中的 `.mv.db`。跨主机自动接管使用 `EXTERNAL` 事务数据库；不要把共享文件系统上的 H2 当作已验收的集群日志。

`EXTERNAL` 可用 PostgreSQL、openGauss 或独立 MySQL。所有 Worker 使用相同日志实例/namespace/pipelineId 和目标配置，不同 nodeId；数据库时钟租约与 epoch 管理所有权。MySQL 日志需 InnoDB，服务重启不可丢失已确认提交。源与目标数据库的提升/隔离由外部高可用系统负责，Rivomesh 不提升数据库主库。V3 已通过 Worker 强制终止恢复、8.4 普通主从提升及 MGR 全量中途选主测试；其他版本/长稳矩阵仍需补验，不能直接套用 v2 的测试结论。

### MySQL 8.2.0 源端回归

运行 `tests/matrix.sh --v3 8.2.0`，逐一测试 V3 单机、GTID 主从和单主组复制。测试要求 Docker Compose，源镜像为 `mysql:8.2.0`，报告保存在 `target/matrix-v3/8.2.0/`。源端使用 GTID、ROW binlog 和 FULL 行镜像。主从场景由夹具提升追平的副本，Rivomesh 校验所需历史并从原位置续传。

### MySQL 8.4 日志档案

MySQL 8.4 使用无标签 GTID、ROW binlog 和 FULL 行镜像。预检拒绝匿名事务模式、带标签的历史、部分 JSON 和事务压缩。采集中遇到部分 JSON 或压缩事件会在失败事务前停住。先检查所需历史日志及候选源，再决定恢复原日志还是建立新基线。

使用 `tests/mysql84-profile-run.sh` 复验日志准入和停止行为。该夹具创建带标签的测试事务并在结束时清理独立数据库容器。

[MySQL GTID format](https://dev.mysql.com/doc/refman/8.4/en/replication-gtids-concepts.html) · [Binary log options](https://dev.mysql.com/doc/refman/8.4/en/replication-options-binary-log.html)

### MySQL 8.4 主库故障后自动续传

设置 `source.topology: ASYNC`，在 `source.nodes` 中配置同一 GTID 复制拓扑的主库与备库。由数据库高可用服务隔离故障主库，提升已追平的备库。Rivomesh 核验新主可用的 GTID 历史并从持久断点恢复连接。备库仍为只读或复制出现 I/O 错误时，排查数据库拓扑并保留原日志和目标断点。

Java 21 实库档案使用 MySQL 8.4.13 异步 GTID 主备、外部 PostgreSQL 日志、两个管理入口和 PostgreSQL、MySQL 目标。强杀原主后，两入口显示采集中断，两个目标断点保持原值。外部流程完成提升后，Rivomesh 把新主的 GTID 自动投递到两个目标，并复用配置修订、日志代次和快照 ID。复现命令为 `python3 tests/global-control-pipeline.py --separate-execution --mysql-async-failover --source-expected-version 8.4.13 --artifact <发布包> --output target/mysql-async-proof`。[验收归档](/docs/zh/start/verification.html)

另一组 Temurin 21 实测使用同一发行包，以 PostgreSQL 17.12 为目标和日志库，分别运行 MySQL 5.7.44、8.0.46、8.2.0 和 8.4.13。用例终止原 Worker、制造真实复制 SQL 线程 1032 错误并拒绝不健康副本，再恢复复制并关停原主。外部提升后，核对原快照 ID 和新写入目标的行。清除尚未采集的 binlog 区间时，采集停在原日志断点。构建发行 JAR 和测试类后，用 `RIVOMESH_TEST_PREBUILT=1 SYNC_V3_HA_POSTGRES_ONLY=1 SYNC_MYSQL_IMAGE=mysql:8.2.0 bash tests/v3-ha-run.sh` 复现。5.7 另设 `SYNC_MYSQL57=1 SYNC_MYSQL57_IMAGE=mysql:5.7`。

### MySQL 8.4 单主组复制故障恢复

设置 `source.topology: GROUP_REPLICATION`，在 `source.nodes` 中配置同一个单主组的成员。MySQL 选举可写主库。Rivomesh 核验候选节点在线、可写且保留所需的 GTID 历史。旧主重启后应保持 MySQL 超级只读，直到重新入组。组复制要求被复制的表具备主键或等效唯一键。[单主模式](https://dev.mysql.com/doc/refman/8.4/en/group-replication-single-primary-mode.html) · [组复制要求](https://dev.mysql.com/doc/refman/8.4/en/group-replication-requirements.html)

Java 21 实库测试使用 MySQL 8.4.13、外部 PostgreSQL 日志和 PostgreSQL 17.12 目标。强杀主库后，MySQL 选出不同 UUID 的主库，同一个 Worker 自动投递后续两个事务。日志代次、两个快照 ID 和目标全表数据均核对一致。旧主以只读方式启动，缺少新主的组 GTID。MySQL 拒绝写入。发布包通过原地址连接旧主，核实服务器 UUID 和两个只读标志后，源端预检返回 `SOURCE_NO_PRIMARY`。旧主作为备库追平后，Worker 继续从已选主库采集。

使用 Java 21 JDK、Docker Compose 和本地 `mysql:8.4`、`postgres:17` 镜像复现。

```bash
python3 tests/mysql-group-failover-native.py --artifact rivomesh.jar \
  --java "$JAVA_HOME/bin/java" --output target/mysql-group-failover-proof
```

另一组 Temurin 21 档案用同一发布包验收 MySQL 5.7.44、8.0.46、8.2.0 和 8.4.13。原主在快照构建中途关闭。MySQL 选出新主后，Rivomesh 重建未完成快照。两个 SQL 目标收到切主前的更新和切主后的插入、删除及更新，两路 ACK 追平共享日志。编译好发布包和测试类后运行 `RIVOMESH_TEST_PREBUILT=1 SYNC_V3_GROUP_SQL_TARGETS=1 SYNC_MYSQL_IMAGE=mysql:8.2.0 bash tests/v3-group-run.sh`。MySQL 5.7 使用 `SYNC_MYSQL57=1 SYNC_MYSQL57_IMAGE=mysql:5.7`。 [分版本验收记录](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/baseline.json)

### MySQL 采集和投递的 TLS 验证

在 `source.sslMode` 设置 `VERIFY_IDENTITY` 供 binlog 采集使用，在 `source.jdbcOptions` 加入 `sslMode=VERIFY_IDENTITY` 供发现和快照读取使用。每个 MySQL 目标单独设置 JDBC URL 和 TLS 参数。把签发证书的 CA 根证书加入执行 JDK 信任库，Agent 和它启动的 Worker 都应能读取。源候选节点和目标 URL 使用与证书匹配的 DNS 名称。binlog 的证书验证模式由 JDK 协商协议，可连接仅启用 TLS 1.3 的 MySQL。[Connector/J TLS 参数](https://dev.mysql.com/doc/connector-j/en/connector-j-connp-props-security.html)

MySQL 8.4.13 实测 binlog 和目标 JDBC 会话使用 TLS 1.3，预检拒绝错误的源域名。强杀重启后从原 GTID 和快照续传，目标数据逐行一致。复现命令为 `python3 tests/mysql-tls-run.py --java-home <Temurin 21 目录> --artifact <发布包> --output target/mysql-tls-proof`。[验收归档](/docs/zh/start/verification.html)

## 使用 PostgreSQL 日志接管独立 Worker

新建独立 MySQL 同步任务时，将 `journal.mode` 设为 `EXTERNAL`，`journal.product` 设为 `POSTGRESQL`，并为 `journal.writerAssignment` 生成新的 UUID。该流程支持最多八个 PostgreSQL/MySQL 目标和 256 张源表。两个 Worker 都应能连接原日志库、目标元数据和源日志。单独生成的校验报告保存在自己的私有目录中。

```bash
java -jar rivomesh.jar init-writer original.yml
java -jar rivomesh.jar run original.yml
```

`init-writer` 为新任务登记初始写入归属。重启时，Worker 打开已登记的日志。日志或归属记录缺失时需要恢复原状态。命令拒绝给此前创建的普通日志补登记。较早的程序版本会拒绝使用新格式的日志。

等待原快照及各目标确认位点追平，停止原 Worker，或者在故障后等数据库时钟判定其租约过期。用 `status original.yml` 查询 `generation`、`epoch` 和 `writerPlacement.assignment`。新 Worker 使用同一任务及目标配置，换主机时配置新 `nodeId`，并为 `journal.writerAssignment` 生成新的 UUID。确认新 Worker 可以读取原源日志及目标原生元数据。

```bash
java -jar rivomesh.jar transfer-writer candidate.yml "$previous_assignment" "$journal_generation" "$expected_epoch"
java -jar rivomesh.jar run candidate.yml
```

转移前会检查 GTID 历史、原快照 ID 和目标事务回执。租约仍有效、快照未完成、目标落后或暂停、跳过操作尚未结案时会拒绝执行。如果命令结果丢失，原样重试可读取持久回执。转移成功后，源位点和各目标确认位点保持原值。新 Worker 以更高的租约代次续传，原配置无法重新领取或续期。每次转移都使用新的 UUID，回到原主机也一样。暂停或未完成的任务应先在当前归属 Worker 上恢复。

集群控制台的 Agent 归属有独立管理流程。这个命令适用于独立 Worker、原外部日志和事务型目标。报告文件及 Agent 归属保留在原位置。

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

恢复命令的 `1` 分别替换为订阅或全局的当前错误版本；旧版本请求会被拒绝。永久源错误持久为 ERROR，备用节点无法绕过；pause 输出各目标隔离确认结果。RBAC、本地账号、配置编辑与审计已实现；限定恢复档案见[当前实施状态](/docs/zh/reference/implementation-status.html)。

### LOCAL日志连接与控制器内存

控制器对已经打开的LOCAL日志保留稳定连接，包括任务暂停或停止期间；配置替换和控制器关闭时释放。重开控制器只连接已有日志文件，查看从未启动的任务不会创建日志库。这使同机CLI、校验证书检查和修复可以使用稳定的H2自动服务端点。

H2页缓存配置为每个已打开日志4MiB，另有表/索引元数据和连接线程开销；Worker堆、共享控制库连接和账号/审计状态单独占用内存。Docker、Linux和Helm控制器默认最大堆调整为512MiB；Helm可用`controllerHeapMiB`配置。按已初始化LOCAL日志数、表数量和实测堆占用规划容量；`maxTasks`是任务数量限制。大量日志可使用外部事务日志配置。

事务证据审阅采用可选控制协议5，支持管理员保存历史证据、原始/规范化事件分页及表格镜像；启用/升级及四类部署示例见[审阅手册](/docs/zh/reference/failure-review.html)。默认旧档案不自动升级。限定恢复档案见[当前实施状态](/docs/zh/reference/implementation-status.html)。
