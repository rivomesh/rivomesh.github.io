---
kind: docs
locale: zh
title: "PostgreSQL 源端"
sourcePath: docs/zh-CN/postgresql-source.md
---

# PostgreSQL 源端

[English](/docs/en/reference/postgresql-source.html)

实验档案以一个 PostgreSQL 17 或 18 可写主库为源，通过原生 `pgoutput` 读取已提交事务。一个任务配置一个 PostgreSQL 数据库，`databases` 选择其中的 schema。目标映射仍通过 `targets[].mappings` 显式声明。

## 配置与运行

1. 在源实例启用 `wal_level=logical`，为任务的持久槽和导出快照的临时槽预留容量。源账号需要 `LOGIN`、`REPLICATION` 和已发布表的 `SELECT` 权限。
2. 创建明确列出同步表的发布，包含 INSERT、UPDATE 和 DELETE。对这些表设置 `REPLICA IDENTITY FULL`，以获取包括无主键行在内的完整前镜像。保持发布的表、列和行范围稳定，结构变更先暂停并审阅。
3. 按[示例配置](/files/config/postgresql-source-v3.yml)设置源库、发布和目标。使用 PostgreSQL 目标时，连接角色需要读取 `pg_control_system()` 以核对物理连接身份。源库与目标库采用独立数据库。
4. 使用发布包执行 `check <配置文件>` 验证连接和发布范围，再以 `run <配置文件>` 启动。在管理界面可导入 V3 配置，也可从新建任务选择 **V3 → PostgreSQL**，填写一个数据库、源 Schema、发布名和逻辑槽前缀。向导提供 PostgreSQL 和 MySQL 目标选项。保存后在选定 Agent 上执行 **检查**，通过后再 **启动**。

数据库会在创建逻辑复制槽时提供一致位置。Rivomesh 导入导出的 MVCC 快照读取表数据，按原 LSN 捕获快照期间及之后的事务。提交已写入 Rivomesh 日志后才确认源槽。每个任务使用与日志世代绑定的槽名。[PostgreSQL 复制协议](https://www.postgresql.org/docs/17/protocol-replication.html) · [pgJDBC 复制 API](https://jdbc.postgresql.org/documentation/server-prepare/)

PostgreSQL 源使用 pgJDBC 42.7.14，并关闭驱动自动推进确认位置。普通保活和发布范围外的 WAL 不改变持久断点。发布表长时间无事务时，监控复制槽占用的 WAL 空间。[pgJDBC 下载](https://jdbc.postgresql.org/download/) · [复制流配置](https://github.com/pgjdbc/pgjdbc/blob/REL42.7.14/pgjdbc/src/main/java/org/postgresql/replication/fluent/ChainedCommonStreamBuilder.java)

## 支持边界与故障处理

- 初始类型包括有符号整数、布尔、有明确精度的小数、文本、JSON/JSONB 和 BYTEA。表可有主键，也可使用完整行身份的无主键表。
- PostgreSQL `BYTEA` 映射为 PostgreSQL `BYTEA` 和 MySQL `LONGBLOB`。逻辑连接使用 hex，兼容源库默认 `escape`。原生夹具可加 `--source-image postgres:17.12 --bytea-values`，对 escape 档案另加 `--bytea-escape-output`，核对全量、CDC 和重启时的 SQL `NULL`、空字节串、原始字节和无主键重复数，同时校验未修改的外置 TOAST 字段及 16–32 KiB 内容。[PostgreSQL 二进制类型](https://www.postgresql.org/docs/17/datatype-binary.html)
- PostgreSQL UUID 以小写标准格式写入目标 `VARCHAR(36)`。PostgreSQL 17.12 到 PostgreSQL 17.12 档案已验证 NULL 和 UUID 主键变更。夹具追加 `--uuid` 可复现。[PostgreSQL UUID 格式](https://www.postgresql.org/docs/17/datatype-uuid.html)
- PostgreSQL `DATE` 在 PostgreSQL 和 MySQL 目标上均映射为 `DATE`。支持 1000-01-01 至 9999-12-31，保留 SQL `NULL`。快照和 pgoutput 共用 ISO 格式，日期不因 Worker 时区或公历切换而改变。[PostgreSQL 日期时间](https://www.postgresql.org/docs/17/datatype-datetime.html) · [MySQL DATE 取值范围](https://dev.mysql.com/doc/refman/8.4/en/datetime.html)
- PostgreSQL 的 `TIME WITHOUT TIME ZONE` 在 PostgreSQL 和 MySQL 目标均使用 `TIME(6)`，区分 `00:00:00` 和一天结束时的 `24:00:00`，并保留微秒及 SQL `NULL`。`TIMETZ` 仍不支持。[PostgreSQL 日期时间类型](https://www.postgresql.org/docs/17/datatype-datetime.html) · [MySQL TIME 精度](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-type-syntax.html)
- PostgreSQL 的两种时间戳均保留微秒精度。无时区的时间戳保留本地钟面值，包括夏令时跳过的时间。有时区的时间戳转换为对应 UTC 钟面值。PostgreSQL 目标使用 `TIMESTAMP(6) WITHOUT TIME ZONE`，MySQL 目标使用 `DATETIME(6)`。下游需要还原为绝对时间时，应按 UTC 读取相应列。两种目标共用范围 `1000-01-01 00:00:00` 至 `9999-12-31 23:59:59.499999`。[PostgreSQL 时间戳语义](https://www.postgresql.org/docs/17/datatype-datetime.html) · [MySQL DATETIME 取值范围](https://dev.mysql.com/doc/refman/8.4/en/datetime.html)
- PostgreSQL 18 的存储型生成列可发布到目标普通列。对发布设置 `ALTER PUBLICATION rivomesh_capture SET (publish_generated_columns=stored)`，表保留 `REPLICA IDENTITY FULL`。PostgreSQL 17 生成列、PostgreSQL 18 虚拟生成列、行或列过滤、分区路由、TRUNCATE 和自动 DDL 迁移需要独立档案。遇到不支持的类型或关系结构，预检或采集会给出明确错误。
- 原实例、时间线、槽和日志完好时，重启复用持续的 LSN 和已有快照。目标 SQL 错误可在修复目标原因后恢复该订阅。
- 显示 `POSTGRESQL_REQUIRED_WAL_UNAVAILABLE` 时，记录最后采集 LSN 并保留旧日志。评估原槽和所需 WAL 是否可恢复，必要时用新任务和经审阅的目标范围重建基线。
- 共同点对账以及其他目标、切换方式与驱动需单独验证。

### 精确小数

源列需要声明有限精度。PostgreSQL 先按源列精度和舍入规则写入数据。Rivomesh 为目标选择能够精确容纳源列有限值范围的 `DECIMAL`。

| 源声明 | PostgreSQL 和 MySQL 目标存储 | 示例 |
| --- | --- | --- |
| `NUMERIC(p,s)` 且 `0 <= s <= p` | `DECIMAL(p,s)` | `NUMERIC(65,30)` 保留全部 65 位 |
| `NUMERIC(p,s)` 且 `s < 0` | `DECIMAL(p + abs(s),0)` | `NUMERIC(4,-2)` 映射为 `DECIMAL(6,0)`，同步源端舍入后的整数 |
| `NUMERIC(p,s)` 且 `s > p` | `DECIMAL(s,s)` | `NUMERIC(2,4)` 映射为 `DECIMAL(4,4)`，保留源端的纯小数 |

共有档案允许目标总精度最多 65 位、小数位最多 30 位。映射保留源存储值、SQL `NULL` 和行身份。源端写入沿用 PostgreSQL 自身的舍入和范围规则，目标声明的取值范围可能更宽。源适配器保留原类型修饰符用于结构检查。[PostgreSQL 数值类型](https://www.postgresql.org/docs/17/datatype-numeric.html) · [MySQL 定点类型](https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html)

未声明精度的 `NUMERIC` 在预检中报告 `POSTGRESQL_NUMERIC_PRECISION_REQUIRED`，映射后超出精度或小数位上限会报告 `POSTGRESQL_NUMERIC_PROFILE_UNSUPPORTED`。`NaN` 等非有限值会触发 `POSTGRESQL_NUMERIC_NONFINITE`。采集保留此前的 LSN，整笔事务不写入目标。保留复制槽和日志，再通过采集恢复审阅确认保留的断点和受影响的目标订阅。后续修改源数据无法移除已有的 WAL 事务。

给下方夹具命令追加 `--source-image postgres:17.12 --numeric-values`，可验证 PostgreSQL 和 MySQL 两目标快照、主键变更、无主键重复行的更新和删除、原 LSN 重启，以及对含 `NaN` 事务的拒绝。

### 浮点类型

PostgreSQL `REAL` 和 `DOUBLE PRECISION` 分别映射成 PostgreSQL 目标的同名类型，以及 MySQL 目标的 `FLOAT`、`DOUBLE`。快照和 pgoutput 会话固定使用精确的浮点文本输出。实库对比验证相邻浮点值、次正规数、SQL NULL、无主键重复及重启续传。正零和负零统一写为零，使用同一行身份。[PostgreSQL 浮点类型](https://www.postgresql.org/docs/17/datatype-numeric.html#DATATYPE-FLOAT) · [MySQL 浮点类型](https://dev.mysql.com/doc/refman/8.4/en/floating-point-types.html)

非有限值（NaN、正负无穷）触发 `POSTGRESQL_FLOAT_NONFINITE`。增量场景保持原 LSN、两个目标的 ACK 和业务行，整笔事务暂停。复验时在原生命令追加 `--source-image postgres:17.12 --floating-values`。[验收](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#postgresql-real-and-double-precision-to-two-sql-targets)

### 实库验收命令

实库验证运行 `python3 tests/postgres-source-run.py --artifact <发布包> --output target/pg-source-proof`。夹具在独立容器中模拟 PostgreSQL 槽丢失。

追加 `--source-image postgres:17.12 --date-values` 可运行日期实库场景，验证 PostgreSQL 和 MySQL 两个目标、DATE 主键变更、无主键重复行的精确匹配、复用原槽与快照的重启，以及拒绝包含无穷日期的整个事务。公元前日期和超出范围的日期也会报告 `POSTGRESQL_DATE_OUT_OF_RANGE`。重试前核对源值和保留的 LSN。

追加 `--source-image postgres:17.12 --timestamp-values` 可复测两类时间戳到两个 SQL 目标。覆盖夏令时边界、主键变更、无主键重复行、原 LSN 重启，以及遇到 `POSTGRESQL_TIMESTAMP_OUT_OF_RANGE` 时整笔事务的拒绝。

追加 `--source-image postgres:17.12 --clock-values` 可复测两个 SQL 目标的钟点值、两个午夜边界、主键和无主键行、原 LSN 重启，以及 `TIMETZ` 的预检拒绝。

当前构建与夹具统一使用 Temurin 21。早期多版本测试记录按原候选包留档。[验收记录](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#postgresql-source-runtime-matrix)

PostgreSQL 18.7 到 PostgreSQL 17.12 在 Temurin 21 下通过八项实库检查，覆盖有主键和无主键更新后的存储型生成列、目标普通列，以及发布遗漏生成列的拒绝行为。复现时追加 `--source-image postgres:18 --generated`。[生成列发布](https://www.postgresql.org/docs/18/logical-replication-gencols.html)

## 验证 TLS 连接

分别设置 PostgreSQL 源端和目标端的 JDBC URL。服务器启用支持通道绑定的 SCRAM 时，可在两个 URL 中设置 `sslmode=verify-full&sslrootcert=/run/rivomesh/trust/ca.pem&channelBinding=require`。把公开 CA 证书以只读方式挂载到执行 Agent。URL 使用的 DNS 名称必须与服务端证书匹配，使用数据库高可用服务时也要覆盖稳定写入口的名称。变更证书或挂载后，在执行 Agent 上重新执行 **检查**。[pgJDBC TLS](https://jdbc.postgresql.org/documentation/ssl/) · [pgJDBC 连接参数](https://jdbc.postgresql.org/documentation/use/)

验证 PostgreSQL 17.12 直连源和目标的 TLS 档案时，给实库夹具追加 `--source-image postgres:17.12 --tls`。夹具使用临时 CA 和服务端证书，查询真实 TLS 会话，并验证源域名或目标 CA 不匹配时预检会拒绝连接。[PostgreSQL TLS 统计](https://www.postgresql.org/docs/17/monitoring-stats.html#MONITORING-PG-STAT-SSL-VIEW)

## 同步槽与备库提升

创建新任务时在 `source.postgresql.url` 配置稳定的 PostgreSQL 写入口，在 `source.postgresql.failoverSlot` 设置 `true`。主库的 `synchronized_standby_slots` 列出用于物理备库的槽。备库设置对应的 `primary_slot_name`、`hot_standby_feedback=on`、`sync_replication_slots=on`，并在 `primary_conninfo` 配置有效的数据库名。写入口切换前，确认备库上的逻辑槽持久化、已同步且具备所需 WAL。[PostgreSQL 复制槽同步](https://www.postgresql.org/docs/17/logicaldecoding-explanation.html#LOGICALDECODING-REPLICATION-SLOTS-SYNCHRONIZATION) · [切换检查](https://www.postgresql.org/docs/17/logical-replication-failover.html)

数据库高可用服务隔离旧主、提升备库并更新写入口，Rivomesh 通过原入口重新连接。新主需要有相同的 system ID、覆盖原持久 LSN 和快照坐标的时间线历史，以及原 failover 槽。该槽须保有所需 WAL，确认位置不能领先 Rivomesh 日志。检查失败时保留旧 WAL 和日志。下一次切换前准备下一台物理备库。

PostgreSQL 17.12 在 Temurin 21 下实测强杀原主、原生备库提升、复用快照继续投递，以及误指回旧主时保留新时间线断点并拒绝续传。夹具用 `IDENTIFY_SYSTEM` 核对当前活动时间线。测试参数为 `--source-image postgres:17.12 --failover`，追加 `--reject-old-primary` 可复现旧主路由拒绝。负载均衡产品、级联拓扑和其他版本组合单独验收。[流复制协议](https://www.postgresql.org/docs/17/protocol-replication.html)

## 审阅导致采集暂停的结构变化

当 pgoutput 为行事务报告已变化的关系时，同步停在前一持久 LSN，提示 `POSTGRESQL_RELATION_CHANGED_REQUIRES_PLAN`。打开采集故障审阅，可对照当前发布与日志结构，查看表、原结构和当前结构摘要、变化的列名。如将 `TIMESTAMP` 改为 `TIMESTAMP(6)`，审阅会列出原生类型声明变化的列，也会提示已有列的相对顺序变化。当前发布可能包含故障发生后的 DDL。pgoutput 传输关系元数据和行变更，DDL 语句不在流中。当前发布超出支持范围时，审阅显示原生发现诊断并保留前一 LSN。审阅期间不执行 DDL，也不更新断点。 [PostgreSQL 逻辑复制限制](https://www.postgresql.org/docs/17/logical-replication-restrictions.html) · [Relation 消息](https://www.postgresql.org/docs/17/protocol-logical-replication.html)

执行 `python3 tests/postgres-source-run.py --ddl-review --source-image postgres:17.12 --artifact <release jar> --output target/pg-ddl-review` 可复现。
