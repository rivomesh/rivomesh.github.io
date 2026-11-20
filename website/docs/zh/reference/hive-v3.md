---
kind: docs
locale: zh
title: "Apache Hive"
sourcePath: docs/zh-CN/hive-v3.md
---

# Hive 目标、恢复与 FAQ

English：[Hive V3](/docs/en/reference/hive-v3.html)。配置：[hive-v3.yml](/files/config/hive-v3.yml)。

## 当前状态

**首批独立原生与真实联合恢复已通过，仍保留实验标记。** 已接通 CLI/Web V3 配置、隔离 JDBC、原生 HiveServer2 检查、ACID ORC 历史表与最新版本视图。Hive 4.0.1 / Java 8 的独立用例通过主键移动、无主键重复行、精度、确认丢失重放、大小写、服务重启及旧非空备份拒绝；真实 MySQL 8.4.13→PostgreSQL 17.12＋Hive 联合用例通过全量/增量、Hive 停机时 PostgreSQL 继续、自动追平、Worker 强杀续传、SQL 约束修复重试、视图丢失隔离和暂停结果检查。最终发布包一致性检查也通过，见[证据](/docs/zh/start/verification.html)。这不代表所有 Hive 版本、集群或生产容量验收完成。

首批测试使用官方 `apache/hive:4.0.1` ARM64、单 HiveServer2、嵌入式 Derby 和本地 warehouse。Temurin 21 档案还验收了由 PostgreSQL 支持的独立 Hive Metastore。HDFS/S3、Tez、Kerberos、TLS 和集群切换需单独验收。[外置 PostgreSQL Metastore 夹具](#外置-postgresql-metastore-夹具)

## 数据布局与一致性

Hive 是分析物化目标，不走普通事务 JDBC Sink，也不作为 Journal。每张源表在 `metadataSchema` 建立托管 ACID ORC 历史表，映射业务库使用源表名建立普通查询视图。内部列保存行身份、源序号编码版本及墓碑；视图按身份取最新版本，再排除墓碑，只暴露源业务列。

主键更新写旧身份墓碑和新身份记录；无主键重复行保留不同的标准化身份。重试可在历史表留下相同版本的重复物理记录，业务视图应只显示一行。物理历史表行数不等于源表行数。目标仅由同步服务写入；禁止直接编辑物理表、改归属属性或删除墓碑。

一次源事务可能拆成多个 Hive 语句与多张表，**不保证源事务跨表整体可见**。不能把 JDBC `commit()` 当作业务数据与断点的跨语句原子提交，也不能把全量未追平视图作为业务切换边界。该布局不能直接接管 OLTP 应用写入。

## 类型和生成列

| 源规范类型 | Hive 存储 |
|---|---|
| BOOLEAN / INT64 | BOOLEAN / BIGINT |
| UINT64 | DECIMAL(20,0)，限定无符号 64 位范围 |
| DECIMAL 精度不超过 38 | DECIMAL(P,S)，拒绝越界或需要舍入的值 |
| DECIMAL 精度超过 38 | STRING，保存原精度和小数位，不静默截断为 38 位 |
| FLOAT32 / FLOAT64 | FLOAT / DOUBLE，拒绝非有限值 |
| STRING / JSON / DATE / TIME / DATETIME / TIMESTAMP | STRING，保存规范文本；不是原生 JSON/时间类型 |
| BYTES / GEOMETRY | base64 STRING，解码后恢复原字节 |

生成列仅支持源适配器已支持的表达式，保存源端求值结果，不在 Hive 重建表达式。比较、排序和查询函数必须按目标存储类型重新评估，特别是超宽小数文本。完整行镜像与空值/字段缺失的区分继续生效。

首批标识符限定 ASCII 字母、数字、下划线，首字符不能为数字；列和表名最多 128 字符，库映射还受通用配置长度限制。不自动改写非法源表名，`_rivomesh_` 前缀列保留给内部布局。

## UNIQUE、GSI 和普通索引

Hive 3 起已移除旧式索引，不能把源 UNIQUE/GSI 伪装成 Hive 普通 B-tree。[官方索引说明](https://hive.apache.org/docs/latest/language/languagemanual-indexing/)。当前明确省略源业务次级索引，要求检查后显式设置 `acknowledgeIndexOmission: true`；未确认且源表有次级索引时拒绝初始化。

业务 UNIQUE(email) 的源约束不在 Hive 强制执行。GSI 的全局路由、唯一性、覆盖列和查询性能也不会保留；ACID、ORC 或分桶不等价于这些能力。内部行身份和版本规则仍保留，不能一并弱化。只在源为权威、目标独占写入、完整追平且转换不合并身份的条件下讨论结果一致性，详见[索引策略](/docs/zh/reference/gaussdb-index-policy.html)。

## 配置、权限及连接

HiveServer2 需要 `hive.txn.manager=org.apache.hadoop.hive.ql.lockmgr.DbTxnManager`、`hive.support.concurrency=true`、`hive.query.results.cache.enabled=false`，允许创建托管全 ACID ORC 表和视图。还需部署与监控 Metastore、warehouse、事务清理和 compactor；仅启用会话开关不能代替服务端配置。[Hive 事务说明](https://hive.apache.org/docs/latest/user/hive-transactions/)。

`url` 当前只接受直接二进制 `jdbc:hive2://host:port/database`，可选 `auth=noSasl|none`、`ssl=true|false`；服务发现、HTTP、Kerberos、URL 凭据、初始化脚本和任意会话参数会被拒绝。账号密码使用独立字段或环境引用。`noSasl` 只用于对应服务配置，不是生产安全默认值。TLS 开关可传递，但尚无 TLS 实测验收。

`queryTimeoutSeconds` 为 1–1800，默认 300；二进制 socket 超时被限制在 5–120 秒，内部连接重试为 0，不假定超时语句没有执行。SQL 默认最大 4 MiB，响应默认 16 MiB，最多读取 10,000 行；超限拒绝，不截断后确认。每条事件还受 `maxMessageBytes` 限制。

使用独立同步账号，授权创建/读写私有管理表和读取其属性、描述、建表定义，及创建/读取映射库视图；具体最小权限需按授权插件实测。业务查询账号只访问视图。`check` 检查配置和只读能力，不创建对象，也不能证明写入权限；`hiveIndexPlans` 逐表列出索引动作、是否需确认及 `columnStorage` 实际类型，不把省略描述为普通索引转换。

独立固定版本 Hive JDBC SDK 在私有类加载器运行，避免替换核心日志/Jackson/Guava 依赖。首次运行会向 `java.io.tmpdir` 解压校验后的 SDK，需要可写私有临时目录和约 42 MiB 空间；Docker/K8s 只读文件系统需提供受限可写临时卷，不要共享不可信缓存。

## 确认、故障和备份

实现顺序为：写入版本记录，回读实际键/版本/墓碑/值，保存并读回目标批次回执，再保存 Journal 传输进度，最后推进目标事务断点。超时或崩溃后的重放不能依靠只查询物理行数来确认。

重连核验归属、布局、视图定义、资源属性和最新回执；已建立目标丢失时不沿旧断点创建空目标。资源 UUID 是同步服务写入的 Metastore 属性，不是独立存储系统的防篡改证明。恢复必须协调 Metastore、warehouse 和 Journal；任意逐表/逐文件回退、外部伪造属性或部分历史丢失不能宣称全面检测。

首轮独立原生验收已包含服务重启，以及 Metastore＋warehouse 回退旧非空备份而 Journal 保留新断点时拒绝续传；具体发布包及范围见[证据](/docs/zh/start/verification.html)。连接错误按分类重试，确定性结构/权限/数据错误暂停本目标；修复后恢复原事务，不修改源 GTID 或跳过失败数据。暂停状态不能证明所有已提交到 Hive 的在途请求均已撤销。

Journal 按目标 ACK 回收不等于 Hive 历史自动清理。历史、墓碑、回执及 ACID delta 文件需单独监控；回执压缩、安全历史回收、compaction 长稳及硬件标准仍待完成。

## FAQ

**为什么没有 UPDATE/DELETE 源表同构写法？** 当前用追加历史、版本和墓碑统一处理快照、重复请求、主键移动及无主键身份；业务通过视图读取最新结果。不要直接把历史表当业务表。

**Hive 可以替代关系库业务接管吗？** 当前布局适合分析同步，不提供源跨表事务或业务 UNIQUE 强制约束。迁移接管需要单独设计目标模型、对账、屏障和约束。

**其他目标会等待 Hive 吗？** 投递独立，Hive 故障时其他目标可继续；未确认数据仍占用共享 Journal，达到配额后会产生采集背压。首批联合场景已实测通过；Journal 容量耗尽与更广故障矩阵仍需验收。

**能接管已有非空 Hive 表吗？** 当前不支持自动采用任意已有表或覆盖同名业务表；归属/结构不匹配会拒绝。动态 DDL、非空接管和修复需后续工作流。

**如何运行隔离验收？** 构建后执行 `bash tests/hive-materializer-run.sh`。脚本只操作自己的命名卷，真实停止服务后协调备份/回退 Metastore 和 warehouse；原始失败日志保留在 `target/`，成功标记不能替代检查实际测试范围。

测试容器通过 `HIVESERVER2_PID_DIR` 把 Hive PID 文件放在独立临时运行目录，避免容器重启后遗留 PID 误匹配新进程；Metastore 和 warehouse 仍使用持久卷。此夹具修复不等于生产 Hive 高可用实现。

## 查询缓存与一致读取

联合夹具实测出现：明细查询有3行，但缓存的COUNT返回0；新会话仅关闭查询结果缓存后COUNT返回3，且统计优化仍开启。这是该配置的实际观测，不推断所有Hive版本都有同一问题。首个支持配置要求服务端默认和所有读取会话 `hive.query.results.cache.enabled=false`，同步账号会话也必须关闭；预检查及写入前校验会以 `HIVE_QUERY_CACHE_DISABLED_REQUIRED` 拒绝开启的设置，不会静默修改全局配置。

只在同步连接关闭缓存不能保护其他业务读者。不要在应用连接上重新开启，或把旧缓存结果解释为数据丢失后手工补写。修复服务端及读者设置后再检查/恢复；表中数据、任务身份和断点无需因此重置。首轮默认缓存联合用例已因该问题中止，不计为完整恢复通过；关闭缓存的新配置已通过独立物化/重启/旧备份拒绝及冻结发布包的完整联合链路，见[证据](/docs/zh/start/verification.html)。

## Java 21 停机与批次验证

ARM64 夹具从 MySQL 8.4.13 同步到 PostgreSQL 17.12 和 HiveServer2 4.0.1。Hive 停机期间 PostgreSQL 继续同步，Hive 保留 Journal 确认位点和精确批次回执。HiveServer2 和 Worker 重启后，夹具直接从 Hive 核对原回执和后续回执，并确认元数据所有者、资源 UUID 和仓库位置一致。Worker 重启复用原快照。修复 PostgreSQL 约束错误后，单独重放该订阅不会改变 Hive 回执。

构建 Java 21 JAR 和测试类后，运行 `RIVOMESH_TEST_PREBUILT=1 bash tests/hive-pipeline-run.sh`。本场景使用单个 HiveServer2、嵌入式 Derby Metastore 和本地仓库数据卷。[Hive 事务](https://hive.apache.org/docs/latest/user/hive-transactions/) · [验收记录](/docs/zh/start/verification.html)

## 外置 PostgreSQL Metastore 夹具

另行提供 PostgreSQL JDBC 驱动，使用 Java 21 流水线验收 HiveServer2 4.0.1、独立 Hive Metastore 和专用 PostgreSQL 17.12 目录库。夹具使用 Hive 自带的工具初始化并校验临时目录库。HiveServer2 端口可连接后，Rivomesh 执行正常的 JDBC 预检查。

完整实库复验通过七项检查。HiveServer2、Metastore 和目录库同时停机期间，独立的 PostgreSQL 业务目标继续推进。重启后复用原 PostgreSQL 系统标识、Hive 表 ID、资源 UUID、所有者和仓库位置。Worker 强制终止后沿用原快照，四批 Hive 回执均与原目录资源一致。修复并重放独立 PostgreSQL 订阅的约束错误后，Hive 回执保持原值。[验收记录](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#hive-external-postgresql-metastore-full-restart-and-recovery)

```sh
RIVOMESH_TEST_PREBUILT=1 bash tests/hive-pipeline-run.sh --postgres-metastore /path/to/postgresql-42.7.14.jar
```

本夹具的 HiveServer2 和 Metastore 共用本地仓库卷，重启复用原 PostgreSQL 目录库和仓库卷。分布式仓库、Metastore 或 PostgreSQL 自动故障切换需单独验收。[Apache Hive Docker 配置](https://hive.apache.org/docs/latest/admin/setting-up-hive-with-docker/)

隔离夹具在 Metastore 的 Hadoop `core-site.xml` 中，只给来自 HiveServer2 Compose 主机名的 `hive` 身份授予通知接口所需的权限。缺少此配置时，PostgreSQL 目录结构即使校验通过，HiveServer2 仍可能因 `get_current_notificationEventId` 授权失败而无法启动。[Hive 4.0.1 通知接口授权](https://github.com/apache/hive/blob/rel/release-4.0.1/standalone-metastore/metastore-server/src/main/java/org/apache/hadoop/hive/metastore/HMSHandler.java#L8993-L9027)
