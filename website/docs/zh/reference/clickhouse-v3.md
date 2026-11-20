---
kind: docs
locale: zh
title: "ClickHouse"
sourcePath: docs/zh-CN/clickhouse-v3.md
---

# ClickHouse 版本化物化

English: [ClickHouse](/docs/en/reference/clickhouse-v3.html).

V3 已接入 ClickHouse HTTP/HTTPS 目标，可与事务数据库、消息目标同时配置。首批验收服务端为 ClickHouse 25.8.33.6，使用 Atomic database、MergeTree 回执及 ReplacingMergeTree 数据。业务名称对应带 `FINAL` 和删除标记过滤的查询视图。该配置服务于分析查询；写业务接管另需数据库及应用兼容性评估。

## 配置与启动

使用[完整示例](/files/config/clickhouse-v3.yml)：`product: CLICKHOUSE`，直连 `http://host:8123` 或 `https://host:8443`，独立用户名/密码、专用元数据 database 和逐库显式映射。凭据不放在 URL 中；地址不接受用户信息、查询参数及非根路径。可用 V3 多目标向导或 YAML 导入，预览会遮盖凭据。

```bash
export RIVOMESH_NODE_ID=worker-1
export MYSQL_PASSWORD='源密码'
export CLICKHOUSE_PASSWORD='目标密码'
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/clickhouse-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/clickhouse-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar status config/clickhouse-v3.yml
```

`check` 读取源/目标能力，检查 UInt128、查询规范化及所需 MergeTree 配置，不创建目标 database/table。`run` 需要创建 database/table/view、INSERT 和 SELECT 权限，以及相关系统目录读取权限。已有非 Atomic database、外部归属业务对象会被拒绝；已初始化对象丢失时，不会沿旧断点悄悄重建空表。

一套部署可配置多个目标实例和多库独立映射。首批使用固定直连服务端；多个独立服务端间负载均衡、Distributed/Replicated/Shared 引擎、Keeper 故障切换及 ClickHouse Cloud 仍需各自配置与验收。

## 数据与索引

| 源表示 | 首批 ClickHouse 存储 |
|---|---|
| 布尔值 | UInt8，允许时保留 NULL |
| 有符号/无符号整数 | Int64 / UInt64 |
| 小数 | 按源精度及 scale 的 Decimal，最多 76 位 |
| Float32 / Float64 | 原生二进制浮点；拒绝非有限值 |
| 文本 / JSON | String，JSON 数字文本无损保留 |
| 二进制 / geometry | 原始 String 字节，从内部 base64 表示还原 |
| date / time / datetime / timestamp | 无损 String，覆盖原生时间范围之外的值 |
| SQL NULL | Nullable 标记，与 JSON 字面量 `null` 区分 |
| 生成列 | 保存源端/规范化器计算出的值，不重新执行目标表达式 |

时间文本避免截断 MySQL 的较宽日期范围与 TIME 时长；分析查询可显式转换。原始结构细节保留在归属元数据中，MySQL 排序规则、默认值和生成表达式的执行语义不在 ClickHouse 安装。

逻辑标识键参与稳定行标识，源序号和行序号选择最新版本。无主键相同行保留独立发生次数，删除只移除其中一次；主键变化删除旧标识并插入新标识。通过业务视图查询逻辑当前行，底层物理 parts 可能保留旧版本及重放重复记录。

必须使用 `uniquePolicy: DOWNGRADE_BUSINESS`。ClickHouse 不执行源业务 UNIQUE 约束；源主键/标识键的选择通过版本视图保留。按此前约定，同步期间目标仅由同步服务写入。

### 次级索引转换

新任务向导和示例显式设置 `clickhouse.secondaryIndexes: DATA_SKIPPING`；为兼容早期配置，省略该字段时保留原 NONE 数据布局。`check` 返回 `clickhouseIndexPlans`，列出每个源索引、转换动作、原因和目标物理索引名；确认后的 schema 元数据保存同一差异计划。

| 源次级索引 | 目标访问结构 |
|---|---|
| BTREE、业务 UNIQUE、简单列 GSI/GLOBAL/GLOBAL_BTREE | 每个索引列建立一个非唯一跳数索引 |
| 数值/布尔/小数列 | `minmax`，granularity 1 |
| 文本/二进制/时间文本列 | `bloom_filter(0.01)`，granularity 1 |
| 联合索引、降序索引 | 拆为逐列结构，不保留源索引排序 |
| 多个索引重复引用同一列 | 共享一个物理索引 |
| 表达式、前缀、全文/空间索引、不支持的列类型 | 标记 `REQUIRES_PLAN`，阻止自动建表 |
| 源主键/行身份键 | 保留稳定行身份，不降为可选加速结构 |

这些结构不执行唯一性约束，不提供 BTREE 点查语义，不保留 MySQL 排序规则或 GSI 的路由/全局唯一性。能否加速取决于查询条件与数据分布，优化器可以不使用；时间文本索引用于等值过滤，不等于原生时间范围索引。Bloom 假阳性只增加读取，不增加结果行。参见[官方跳数索引指南](https://github.com/ClickHouse/clickhouse-docs/blob/main/docs/guides/best-practices/skipping-indexes.md)。

生成的查询视图显式启用 `use_skip_indexes_if_final=1` 和 `use_skip_indexes_if_final_exact_mode=1`。精确模式会把较新的版本纳入 FINAL 去重；关闭它可能让旧版本错误地再次匹配。[已验收版本的官方设置源码](https://github.com/ClickHouse/ClickHouse/blob/v25.8.33.6-lts/src/Core/Settings.cpp)说明了这一边界。不要修改受管视图，或把物理历史表当成当前业务表查询。新表确认 schema 前会比较包含索引的完整规范化定义；确认后擅自修改索引/视图会暂停该目标。

**早期仅同步数据的 ClickHouse 任务：** 省略该字段或显式设置 `clickhouse.secondaryIndexes: NONE`，均保留原配置指纹和布局，不会自动迁移布局。这个配置代表明确省略索引，计划记录为 `OMIT_BY_CONFIGURATION`，不代表完成了索引转换。NONE 改为 DATA_SKIPPING 会改变指纹，不会自动 ALTER 已初始化的数据；需要规划新代次及全量重建，不能删除日志元数据来绕过校验。界面新任务向导采用 DATA_SKIPPING，YAML 导入支持两种模式。

## 确认与恢复

使用原生 RowBinary、有界请求和同步插入，按表合并每批行。行写入完成后记录目标原生回执，再推进受租约保护的应用日志断点。回执/数据表要求 `fsync_after_insert=1`、`fsync_part_directory=1`、`min_rows_to_fsync_after_merge=1`；真实断电与存储控制器行为仍需硬件验收。

HTTP 200 本身不能证明查询成功。客户端检查异常头、完整 JSON/行数/结构以及命令响应为空，拒绝尾部错误正文和重定向。HTTP 层在响应丢失后不自行重发，物化层通过稳定版本与回执重放，不承诺跨行 SQL 事务原子性。

`VERSIONED_MATERIALIZATION` 表示一个源事务的多行、多表可能分批可见；全量过程中也可能提前看到部分行。判断是否追平时，应观察目标持久断点和全量确认进度。

各目标有独立断点和故障代次。网络错误自动重试；永久 SQL、结构、归属错误暂停该目标并保留原始事件。其他目标继续，直到共享日志容量/背压需要处理。修复可重试的配置或权限问题后，使用界面按故障代次恢复目标，重试原数据，不跳过事件。

共享暂停返回 `UNCONFIRMED_IN_FLIGHT_MATERIALIZATION`：日志已隔离旧租约，但无法撤回服务端已在执行的 HTTP 写入。业务切换前需要确认在途请求结束并完成对账，不能据此宣称已获得事务目标的精确 SQL 写入隔离。

### 核对失败事务之前的目标回执

ClickHouse 因一笔完整增量事务的应用故障暂停后，先暂停整个任务。将该目标的错误代次传入只读核对命令。

```bash
java -jar rivomesh.jar review-clickhouse-recovery config.yml clickhouse 1
```

`PRECEDING_RECEIPT_VERIFIED` 表示当前目标回执表仍保存上一笔已确认事务的最后一个原生 `COMMIT` 回执。命令核对原回执表身份、回执摘要、ClickHouse 发布断点及日志中的失败事务摘要，返回确认序号和失败序号。目标读取结束后再次核对日志状态。返回结果只证明前一笔回执，失败事务是否已部分写入仍须另行核实。

保存的投递位置指向其他批次或后续批次时，命令返回 `CLICKHOUSE_RECOVERY_PUBLICATION_UNCERTAIN`。原生回执丢失或变化时，应恢复一致的历史，或规划新基线。保留原状态，修复可恢复的故障后使用 **恢复此目标**。ClickHouse 暂不支持事务跳过和前镜像补偿。[目标恢复方式](/docs/zh/reference/failed-transactions.html)

## 运维 FAQ

**为什么既有元数据表又有物理数据表？** 服务保存任务代次/指纹归属、对象 UUID、结构和原生批次回执，必须与数据一起保留，它们不是可随意删除的临时表。回执保留/压缩及大目录容量治理仍属于平台后续工作。

**消费账号怎么授权？** 视图采用调用者权限，应对业务视图及其具体底层物理数据表授予 SELECT，禁止 INSERT/ALTER/DROP。`SHOW CREATE TABLE 目标库.表` 可查看依赖对象。查询应使用业务视图的版本/删除过滤，账号和权限由数据库管理员管理。

**还原了旧的非空目标备份，能续传吗？** 启动会核对已保存原生回执、结构和对象身份；即使旧 UUID 保留，已确认历史缺失/变化也会要求重建。保留日志，核对备份边界并制定对账/重建计划；清回执或重建空视图不能修复旧断点。仅检查最新回执，不代表已排除全部早期行的任意损坏。

**日志存储丢失怎么办？** LOCAL 需要原持久目录，多机共享运行需要 EXTERNAL 事务日志。目标行本身不能还原无主键行标识、捕获位置及所有回执。应恢复协调的元数据备份或规划全量重建，不承诺单独回退元数据后的任意自动续传。

**小数字符串为什么少了尾零？** ClickHouse 格式化可能省略尾零，应核对数值及字段精度/scale；原生验收同时检查两者，覆盖 Decimal(65,30)。

**可以改结构、清删除标记或直接写目标吗？** 同步依赖服务独占写入；结构/UUID 会核对，但外部任意 DML 可能破坏物化。请保留删除标记与回执历史。源在线 DDL、非空外部目标接入、自动修复及业务接管仍需独立工作流。

## 已记录验收

`target/clickhouse-native-protocol-decimal.log`：真实服务的类型边界、二进制/JSON/NULL、UInt128 版本重放、重启身份/历史和删除过滤。

`target/clickhouse-materializer-release.log`：实际发布 JAR、不写入的能力检查、自动表/视图、主键移动、无主键次数/删除、重复重放、客户端/服务端重启，以及还原旧非空目标后拒绝较新断点。

`target/clickhouse-pipeline-first.log`：24 项执行通过，包含实际 MySQL 8.4 → ClickHouse＋PostgreSQL 发布包链路（LOCAL H2 日志），JSON/无符号/小数/二进制/生成列、目标停机时 SQL 继续、自动追平、Worker 强杀恢复及视图丢失隔离。

`target/ui-clickhouse-first.log`：18 项 DOM 通过。上述结果不代表集群/副本/TLS/断电及大目录或长期运行验收。

Temurin 21 使用真实 ClickHouse 25.8.33.6 和 LOCAL H2 日志通过了物化验收。服务沿用原数据卷重启后确认第 3 笔提交。还原旧非空卷后，较新的业务行消失，适配器以 `CLICKHOUSE_CONFIRMED_HISTORY_MISSING_REBUILD_REQUIRED` 拒绝写入，日志侧仍保留第 3 笔断点。测试还核对了 NONE 重开、BTREE/GSI 转换后的跳数索引、FINAL、无主键和重复重放。构建后运行 `bash tests/clickhouse-materializer-run.sh`。[确切验收记录](/files/docs/verification/baseline.json)

历史兼容验收：`target/clickhouse-index-compat-unit.log`58项通过，0失败/错误/跳过；`target/ui-clickhouse-index-compat.log`19项通过。`target/clickhouse-index-native-compat.log` 历史 Java 8 发布包验收通过：NONE布局不建跳数索引且重开保留数据，以及索引FINAL、重放、重启和恢复旧非空卷保护。旧配置省略新字段时保留NONE及旧指纹，新向导/示例显式启用DATA_SKIPPING。归档产物 144098892 字节，SHA25695dbdbb462929ed1a262072e80d1db885696fa53007d5315c38c4d951c193212。此前28项联合链路验收先于这次仅默认兼容策略调整。全部本次测试资源已清理。
