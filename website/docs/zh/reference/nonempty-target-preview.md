---
kind: docs
locale: zh
title: "非空目标接管预览"
sourcePath: docs/zh-CN/nonempty-target-preview.md
---

# PostgreSQL 非空目标预检

如果已经向 PostgreSQL 导入过 MySQL 数据，可以在注册或启动同步任务前运行 `preview-adoption`。预检按映射比较源端有主键的表，汇总目标缺失、多出、变更及相等的行数。JSON、时间戳、十进制等数据使用与同步相同的规范化规则。

```sh
java -jar rivomesh.jar preview-adoption config/task.yml postgres
```

最后一个参数是 V3 配置中的目标 ID。目标需要指向 PostgreSQL 主库。给目标账号授予映射 schema 的 USAGE 权限、映射表及已有 Rivomesh 归属和任务表的 SELECT 权限。MySQL 账号需要[共同校验点](/docs/zh/reference/reconciliation-workflow.html)文档列出的读取和全局短锁权限。预检使用 PostgreSQL READ ONLY 事务，不打开同步日志库，也不写归属、业务数据或断点。

在维护窗口运行预检。它最多持有 MySQL 写入短锁 15 秒，用于建立源快照、锁定目标表并取得 PostgreSQL REPEATABLE READ 快照。开始扫描前释放写入短锁。读取期间的表锁可能延迟 DDL。预检要求保持原有的 MySQL 锁会话和快照会话。连接中断或驱动重连会使比较失效。报告对应已记录的两个快照，之后提交的数据可能改变比较结果。[PostgreSQL 事务隔离](https://www.postgresql.org/docs/17/sql-set-transaction.html)

- `MATCH_REQUIRES_VERIFIED_BASELINE` 表示已检查的行相等。保留报告用于规划，在接管前验证原始数据基线、可用源日志和目标归属。
- `DIFFERENCES_FOUND` 表示至少一个表存在缺失、多出或内容变更。通过稳定主键匹配对应行，再选择独立的对账或暂存方案。
- `BLOCKED` 表示至少一个表无法安全完成比较。查看各表阻断原因和已完成的比较。已有归属或断点、缺表、源表无主键、结构差异、继承表、分区、行安全、目标生成列、触发器或额外约束均可能阻断。

当前上限为发现 100 张源表、每张待比较表每侧 10 万行、单行解码或规范化后 4 MiB，以及每表计入预算的比较数据 64 MiB。两个读视图分别有 120 秒截止时间。数据上限适用于预检处理的解码值，JDBC 取数和 JVM 开销需要额外内存。超限、权限不足或视图失效会终止命令，无法生成最终比较结果。JSON 结果包含表名、数量和本次观察到的源端位点的 SHA-256 摘要。

## 在冻结的源库边界生成接管计划

`preview-adoption` 发现数据匹配后，可以用 `plan-adoption` 核对接管条件。此档案覆盖直连 MySQL 8.4 上一个数据库的一张非空 InnoDB 表，以及一个 UTF-8 编码的 PostgreSQL 17 主库。只配置一个目标，外部 PostgreSQL 日志和目标使用相同 JDBC URL，使用两个尚不存在的独立元数据 schema，且没有已有写入节点分配。审查期间保持两边应用写入和同步进程停止。[PostgreSQL 事务隔离](https://www.postgresql.org/docs/17/transaction-iso.html)

MySQL 运维人员需启用并持久化 `read_only` 和 `super_read_only`，同时保持 `persisted_globals_load` 开启。MySQL 账号需要看见全部表和相关元数据，并有全局读锁及复制状态查询权限。有入站复制或组复制成员时会拒绝计划。命令在原物理会话取得有截止时间的全局读锁，比对前后核验源实例身份及精确 binlog 位点。[MySQL FLUSH 语句](https://dev.mysql.com/doc/refman/8.4/en/flush.html)

源表以单个有符号 `BIGINT` 列为主键，可以另有一个单列业务 UNIQUE，其键为另一个有符号 `BIGINT` 或符合下述条件的 `VARCHAR` 列。此 UNIQUE 需使用 `DOWNGRADE_BUSINESS`，并在规划前建立对应的普通 PostgreSQL B-tree 索引。`preview-adoption` 的 `indexPlan` 列出预期名称。源表只支持普通列及默认值 `NULL`，类型可为有符号整数、JSON 或最多 4,000 字符的 `utf8mb4_0900_bin` VARCHAR。目标匹配列顺序和可空性，类型对应 `bigint`、`jsonb` 或等宽且显式使用 `pg_catalog."C"` 排序规则的 `varchar`。目标账号需有表归属权限、创建 schema 及 schema 内对象的权限，以及调用 `pg_control_system()` 的权限。外键、触发器、额外索引或约束、已有 Rivomesh 元数据以及目标表已加入订阅时会拒绝计划。

`UNIQUE(email)` 支持完整的单列 `VARCHAR(1..320)`。MySQL 使用 `utf8mb4_0900_bin` 和 `NO PAD`。PostgreSQL 使用 UTF-8、等宽且显式使用内置确定性 `pg_catalog."C"` 排序规则的 `varchar`、内置 B-tree `text_ops`，页大小至少为 8 KiB。命令核对填充属性、原生比较结果及实际索引的操作符类和排序规则。大小写变体、尾随空格和不同 Unicode 规范化形式各自保留，允许多个 NULL。忽略大小写或重音的规则、`PAD SPACE`、补空格的类型、前缀索引及表达式键都会拒绝。数据值需能由两端数据库表示，PostgreSQL 文本类型不支持 U+0000。[MySQL 二进制排序规则](https://dev.mysql.com/doc/refman/8.4/en/charset-binary-collations.html) · [PostgreSQL 排序规则](https://www.postgresql.org/docs/17/collation.html) · [PostgreSQL 字符类型](https://www.postgresql.org/docs/17/datatype-character.html) · [PostgreSQL B-tree 索引项上限](https://www.postgresql.org/docs/17/btree.html)

```sh
java -jar rivomesh.jar plan-adoption config/task.yml postgres
java -jar rivomesh.jar plan-adoption config/task.yml postgres --expect-sha256 <reviewed-digest>
```

`ADOPTION_PLAN_OBSERVED` 返回计划 SHA-256 摘要，绑定源端精确位点、匹配行数及摘要、配置和目标原生身份。在相同状态下重跑会得到同一个摘要。上限为 1 万行、单行 1 MiB、保留的比较数据 16 MiB，各读视图期限为 30 秒。JDBC 取数和 JVM 开销需要额外内存。使用私有运维记录保存结果。目标证据来自 PostgreSQL 只读快照，执行接管时会在目标业务表独占锁下重新核验计划。

## 执行已批准的 PostgreSQL 基线接管

保持 MySQL 冻结，停止应用写入和所有 Rivomesh 进程。日志库和目标库配置使用同一个 PostgreSQL 账号。此账号需要锁定目标业务表及事件触发器目录，并创建两个独立元数据 schema 和归属表。使用计划中的源表名、精确摘要、保持不变的请求 UUID 和运维人员的审计标识。

```sh
java -jar rivomesh.jar adopt-existing config/task.yml postgres <sourceTable> <reviewed-digest> <requestUUID> <actor> --acknowledge-exclusive-freeze
```

命令在持有两侧冻结边界时重算源端位点、表结构、目标原生目录及匹配行。PostgreSQL 在一个事务中登记目标归属、已完成的快照及其确认、MySQL 捕获位点、空增量断点和审批回执。接管后的任务为 `PAUSED`。常规同步进程可基于现有目标数据，从已批准的 binlog 位点接续采集。

收到 `ADOPTION_COMMIT_UNKNOWN` 时，保持冻结，使用完全相同的审批参数重试以确认原生回执。重放会核验暂停的基线、目标物理表、数据行、归属及两端断点。请求变化、元数据不完整或现场漂移时会拒绝。使用私有运维记录保留原计划和回执。任务已经恢复后，使用常规状态和恢复命令。

确认回执后，运维人员可以解除源库写入冻结，使用 `resumeErrorGeneration` 执行 `resume-pipeline`，再启动常规同步进程。同步期间继续停止目标端应用写入。保留覆盖批准位点的源端 binlog，直到进程追平。应用写入交接和回切仍需独立执行。

## 在原接管点恢复已批准的业务 UNIQUE

接管计划包含 `restoreUnique` 时，其 `planSha256` 会绑定预期约束名称、键列以及已有普通索引的物理身份。保持原 MySQL 冻结并保持接管后的任务暂停，提供新的恢复请求 UUID 和操作人执行下列命令。命令重新核验原位点、数据行和目标目录，在同一 PostgreSQL 事务中添加不可延迟的 `UNIQUE NULLS DISTINCT` 并记录原生回执。保留原普通索引。经批准的恢复回执会纳入该表的写入就绪证据。

```sh
java -jar rivomesh.jar restore-adopted-unique config/task.yml postgres <sourceTable> <adoption-digest> <adoption-request> <adoption-actor> <restoration-request> <actor> --acknowledge-exclusive-freeze
```

收到 `ADOPTED_UNIQUE_COMMIT_UNKNOWN` 时，保持冻结并重试相同请求。`prepare-target-writer` 会核对已审批的恢复回执、原生约束和普通索引。通过手工 DDL 创建同名约束仍缺少恢复回执。首次业务写入前回切后，约束继续生效，常规 CDC 会校验其原生证明后接续同步。

## 记录应用写入角色的就绪状态

仅在单表接管仍处于原始暂停基线时运行 `prepare-target-writer`。保持 MySQL 原实例可访问且处于持久化冻结状态，由运维人员独占管理两端数据库，并停止应用写入和 Rivomesh 进程。提供原接管摘要、请求 UUID 和操作人，以及 PostgreSQL 写入登录角色、新的审查请求 UUID 和审查人。目标运维账号需有权锁定 `pg_authid`、`pg_auth_members` 和事件触发器目录。[PostgreSQL 权限](https://www.postgresql.org/docs/17/ddl-priv.html)

```sh
java -jar rivomesh.jar prepare-target-writer config/task.yml postgres <sourceTable> <adoption-digest> <adoption-request> <adoption-actor> <writer-role> <review-request> <review-actor> --acknowledge-exclusive-freeze
```

专用 PostgreSQL 登录角色需有数据库 `CONNECT`、schema `USAGE` 和表 `SELECT`。准入要求该角色无连接、无角色成员关系、无表级和列级写权限。其他并行写入授权、该角色能写入的视图，以及该角色有权执行的用户定义 `SECURITY DEFINER` 例程都会拒绝审查。维护期间由特权运维人员独占管理 schema、角色和应用路由。

`TARGET_WRITER_READINESS_RECORDED` 返回原生回执，记录精确的接管基线、源端位点、目标数据与权限证据、角色身份和审查审批。遇到 `WRITER_READINESS_COMMIT_UNKNOWN` 时，保持源库冻结并能核验其位点，使用原请求重试。重放会重新核对现场数据、权限和位点。将回执及其 `receiptSha256` 与原迁移计划一起保留。

## 启用 PostgreSQL 应用写入及首次提交写入前回切

此流程覆盖原始暂停的单表接管点。变更写入权限期间，保持 MySQL 写入冻结，停止应用连接。使用原接管标识、完整的就绪回执 SHA-256，以及本次操作的请求 UUID 和操作标识。确认目标已授权后，由运维人员切换应用路由。

```sh
java -jar rivomesh.jar activate-target-writer config/task.yml postgres <sourceTable> <adoption-digest> <adoption-request> <adoption-actor> <readiness-receipt-sha256> <activation-request> <actor> --acknowledge-exclusive-freeze
```

启用过程持有目标表独占锁及角色目录锁，核验源端冻结与批准的数据行，对已审查的登录角色授予该表 `INSERT`、`UPDATE`、`DELETE` 权限，并将同步日志任务状态置为 `TARGET_WRITER`。常规 `resume-pipeline` 会拒绝这个状态。该 PostgreSQL 事务同时安装受保护的语句触发器，在业务 DML 的事务内登记写入。事务回滚时，该次记录也回滚。若提交后数据恢复原值，写入记录依然存在。[PostgreSQL CREATE TRIGGER](https://www.postgresql.org/docs/17/sql-createtrigger.html)

申请回切前，停止目标应用并断开专用登录角色的全部连接，运维人员保持独占管理数据库及应用路由。回切命令锁定业务表，核对写入触发器的定义和目录版本以及两侧原始数据摘要，先撤回目标写权限，再把同步任务设为 `PAUSED`。收到 `TARGET_WRITER_REVOKED` 后，运维人员可恢复原源库写入。若需要继续同步，在源库恢复写入后使用返回的 `resumeErrorGeneration` 执行恢复。

```sh
java -jar rivomesh.jar failback-target-writer config/task.yml postgres <sourceTable> <adoption-digest> <adoption-request> <adoption-actor> <readiness-receipt-sha256> <failback-request> <actor> --acknowledge-exclusive-freeze
```

收到 `TARGET_WRITER_COMMIT_UNKNOWN` 时，保持应用路由关闭、MySQL 冻结，重试完全相同的操作。`TARGET_WRITER_WRITE_OCCURRED` 表示需要单独对账并审批新的源端基线后执行逆向迁移。`TARGET_WRITER_HISTORY_UNCERTAIN` 表示连续性标记缺失。PostgreSQL 崩溃恢复会清除此标记，因为曾确认的异步提交及其写入记录可能同时丢失。记录缺失或变化时，先排查再恢复源端写入。[PostgreSQL 不记日志的表](https://www.postgresql.org/docs/17/sql-createtable.html)

## 写入交接前检查降级的 UNIQUE 索引

对于已有同步任务管理的 PostgreSQL 目标，先为该目标生成[共同校验点报告](/docs/zh/reference/reconciliation-workflow.html)并完成源目标比较。任务保持暂停，同时停止目标业务写入及 DDL。使用相同任务配置及该报告 ID 运行检查。

```sh
java -jar rivomesh.jar review-unique config/task.yml /private/reports <reportId> postgres
```

命令核对报告范围、日志位点、目标归属、已完成快照和目标物理断点。检查期间取得日志和目标断点锁，读取 PostgreSQL 后回滚锁事务。业务行、索引和断点保持原值。单次检查最多覆盖 100 张映射表和 128 项候选索引，期限为 120 秒。使用能够锁定断点行的同步账号。

对于已经降级的简单业务 UNIQUE，检查使用 PostgreSQL 目标列的排序规则及默认 `NULLS DISTINCT` 语义，统计冲突键组以及涉及的行数。复合键任一列为 NULL 时不计入冲突。报告展示列名和数量。MySQL 和 PostgreSQL 的行内容即使比较相等，排序规则差异仍可能造成唯一性冲突。[PostgreSQL 唯一索引](https://www.postgresql.org/docs/17/indexes-unique.html) · [ICU 排序规则](https://www.postgresql.org/docs/17/collation.html)

- `DUPLICATES_FOUND` 表示存在冲突。恢复约束前先对账处理。
- `REQUIRES_RECONCILIATION` 表示有跳过记录、历史校验差异，或需要单独规划的特殊索引。
- `NO_DUPLICATES_OBSERVED` 表示本次读视图中未发现冲突。审批约束恢复及写入交接前，核对最终位点、SQL 定义和业务语义。恢复同步或推进断点后，需要取得新的共同校验点再检查。
- `NO_DOWNGRADED_UNIQUE` 表示所选范围内没有相关候选索引。

检查覆盖普通 PostgreSQL 映射表和默认的 B-tree 键语义。GSI 全局唯一性、表达式、前缀长度、自定义操作符类及其他 NULL 语义需独立评估。约束创建、写入交接和回切按迁移方案执行。

## 在冻结边界生成约束恢复计划

恢复计划覆盖单张有主键的 InnoDB 表及一项已降级的业务 UNIQUE。源需直连单实例 MySQL 8.4，设置 `source.topology: AUTO` 且不配置候选节点。目标需为 UTF-8 编码的 PostgreSQL 17 主库。先停止两边业务写入，取得内容匹配的共同校验点并保持 Rivomesh 暂停，再由数据库运维人员将同一 MySQL 实例置为 `read_only` 和 `super_read_only`。源 UUID、GTID、binlog 文件及偏移必须与报告完全一致。MySQL 的只读模式仍允许复制线程写入，因此有入站复制通道配置或组复制成员时会拒绝生成计划。[MySQL 系统变量](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html)

使用 `review-unique` 输出的表 ID 和 MySQL 原始索引名运行命令。

```sh
java -jar rivomesh.jar plan-unique-restore config/task.yml /private/reports <reportId> postgres <tableId> <sourceIndex>
```

命令核对已封存的匹配报告及源、目标跳过记录。在已冻结的 MySQL 上取得有时限的全局短锁，核对原会话并重算源行摘要。读取目标时持有日志暂停锁、目标表锁和断点锁，重新检查行摘要、归属、唯一性及已有普通索引。范围上限为 1 万行、单条规范化行 1 MiB、私有暂存 16 MiB，锁期限为 30 秒。源账号需要共同校验点的读取、短锁及复制状态权限。目标账号还需有权执行 `pg_catalog.pg_control_system()` 以识别物理实例。[PostgreSQL 控制信息函数](https://www.postgresql.org/docs/17/functions-info.html)

候选键支持映射成 PostgreSQL `bigint` 的有符号整数，或源端 `utf8mb4_0900_bin` VARCHAR 映射到显式使用 `pg_catalog."C"` 的 PostgreSQL `varchar` 或 `text`。检查已有普通 B-tree 索引的列、顺序、排序规则和默认操作符类。GSI、表达式索引及生成键列需要单独规划。此档案按原有语义识别大小写、尾随空格和 NULL。[MySQL 二进制排序规则](https://dev.mysql.com/doc/refman/8.4/en/charset-binary-collations.html) · [PostgreSQL 唯一索引](https://www.postgresql.org/docs/17/indexes-unique.html)

`RESTORE_PLAN_OBSERVED` 返回稳定的计划 SHA-256 摘要，绑定报告封存值、精确位点、当前表内容、日志库 schema、目标物理身份和时间线。将输出保存用于人工审阅。核对审阅过的摘要时，以 `--expect-sha256 <digest>` 重跑命令。它会再次核验现场状态，普通索引重建等变化会使旧摘要失效。其他库产生的新 GTID 也会拒绝该校验点。现场重算摘要同时覆盖未写入 binlog 的源端数据修改和目标端外部修改。冻结、目标状态或断点变化后需重新验证。

## 执行已批准的 PostgreSQL UNIQUE 恢复

此命令行档案要求只有一个目标，且 PostgreSQL 外部日志库和目标使用完全相同的 JDBC URL。运维账号需要锁定日志、目标元数据、业务表和事件触发器目录，并创建约束及写入回执。目标存在已启用的事件触发器时会拒绝执行。维护期间由运维人员独占控制两边数据库的启停、复制、权限和业务写入。

直连的单实例 MySQL 必须已启用并持久保存 `read_only` 和 `super_read_only`，同时开启 `persisted_globals_load`。原主机使用相同数据目录和启动选项重启时会加载持久配置。提交 PostgreSQL 前，Rivomesh 会再次核对这两个持久配置、原源端与 binlog 位点，以及持有短锁的会话。写入隔离应保持至回执确认和另行管理的业务交接完成。[MySQL 持久化系统变量](https://dev.mysql.com/doc/refman/8.4/en/persisted-system-variables.html)

审阅版本 2 的恢复计划后，提供原摘要、保持不变的请求 UUID 及运维人员的审计标识。

```sh
java -jar rivomesh.jar restore-unique config/task.yml /private/reports <reportId> postgres <tableId> <sourceIndex> <digest> <requestUUID> <actor> --acknowledge-exclusive-freeze
```

命令在源端冻结保护下重新计算计划。日志校验点、订阅、目标断点、快照、表归属及业务表锁均由同一个 PostgreSQL 事务持有。此事务添加一项已验证、不可延迟的 `UNIQUE NULLS DISTINCT`，保留普通索引，并同时写入批准摘要、操作人、请求 ID 和原生约束回执。PostgreSQL 需开启 `fsync`，事务使用同步提交。业务数据、同步暂停状态及写入归属保持原值。[PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html)

`UNIQUE_RESTORED` 表示 PostgreSQL 已确认提交，或已核验同一请求的原生回执。`UNIQUE_RESTORE_COMMIT_UNKNOWN` 表示连接未能确认提交结果。保持冻结并保留报告，用完全相同的请求重试来核对回执。操作人、范围或摘要变化会与已有审批冲突。回执对应的约束发生变更时，需要人工复核。业务写入交接及回切仍按独立流程执行。

### 常见问题

**报告相等后可以在现有表上启动新任务吗？** 新任务仍要求兼容的空表。预检不会建立可续传位点或授予表归属。非空目标需另行验证基线并规划写入交接，也可先同步到独立的空 schema，对账后再切换。

**同时检查目标 schema 中其他表吗？** 预检只查看已配置的源库到目标 schema 映射中的同名表。迁移时另行盘点其余表和 schema。

**怎样修复数据或恢复曾降级的 UNIQUE？** 已经由任务管理的目标可以按[共同校验点修复](/docs/zh/reference/common-cut-repair.html)的校验流程处理。约束恢复、最终写入交接及回切按目标产品规划。

[English](/docs/en/reference/nonempty-target-preview.html)
