---
kind: docs
locale: zh
title: "达梦 DM"
sourcePath: docs/zh-CN/dm-v3.md
---

# 达梦 目标与 FAQ

English: [DM V3](/docs/en/reference/dm-v3.html)。示例：[dm-v3.yml](/files/config/dm-v3.yml)。

## 当前范围与实例要求

`product: DM` 已接入 V3 配置、CLI、中英文向导、独立事务目标和类型转换计划，目录状态为 **EXPERIMENTAL**。DM8.1.4.80 ARM64＋厂商Java8 JDBC8.1.3.140 已通过首批原生事务及真实 MySQL8.4.13＋PostgreSQL17.12 联合全量/增量、目标停机追平、Worker强杀、两端SQL修复和缺表隔离，见[验收记录](/docs/zh/evidence/baseline.html)。新增既有空表布局、文本主键大小写/尾空格和四字节Unicode也通过；不能用其他PostgreSQL协议目标的结果代替。

使用 `dm.jdbc.driver.DmDriver` 和 `jdbc:dm://host:5236`，驱动来自固定 Maven Central `com.dameng:DmJdbcDriver18:8.1.3.140`。厂商 POM 声明 Apache-2.0；完整发行版许可证及 NOTICE 审核仍待完成。数据库软件与 license 不随本项目分发。

首批要求 COMPATIBLE_MODE=0、UNICODE_FLAG=1（UTF8）、CASE_SENSITIVE=1、BLANK_PAD_MODE=1，实例为 NORMAL/PRIMARY 且 OPEN，COMMIT_WRITE 为 IMMEDIATE/BATCH,WAIT。每次物理连接检查实际产品、版本、实例角色和上述条件，设置会话时区UTC并检查空串不等于NULL。服务不更改全局参数、不提升备库。WAIT 表示本地提交等待日志刷盘，不代替主备复制、存储或隔离策略。

BLANK_PAD_MODE和字符集等是建库条件，不可通过同步服务原地改造。其原因包括大小写表名、VARCHAR主键和尾空格身份不能合并；其他模式/参数组合需单独适配。已有实例不满足时先由DBA评估建库/迁移方案，不要通过伪装成 PostgreSQL 或直接改断点绕过检查。

## 配置和操作

DBA先创建实例及账号，目标账号需要创建映射schema/表/索引、业务及管理表读写、目录信息和实例/参数只读检查权限。生产环境按最小权限授权，不直接照搬测试SYSDBA。连接检查不代表所有DDL/DML权限已验证。

每个MySQL database用 `mappings` 显式映射为达梦schema，可同时分发到PostgreSQL、消息等其他目标。源GTID/ROW/FULL要求见[V3手册](/docs/zh/reference/pipeline-v3.html)。密码使用环境变量 `MYSQL_PASSWORD`、`DM_PASSWORD` 或受保护配置。

```bash
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/dm-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/dm-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar status config/dm-v3.yml
```

`check` 返回 `dmStoragePlans`。JSON和超38位小数需要 `dm.acknowledgeTextConversions: true`；向导明确展示此语义变化并要求确认。只含原生类型的高级配置可以保留默认false。确认选项不改变存储布局指纹，不允许把已有目标布局当成另一种类型继续。

Linux、Docker、Helm和原生K8s共用该任务配置；清单不部署达梦数据库。V2和达梦内部日志后端尚未启用，`journal.product: DM`会拒绝；本地日志用于同机恢复，跨机Worker接管使用已支持的PostgreSQL/openGauss/MySQL外部日志。

## 类型和索引

| 源模型 | 达梦首批映射 |
|---|---|
| BOOLEAN / INT64 / UINT64 | BIT / BIGINT / DECIMAL(20,0) |
| DECIMAL精度≤38 | 保留声明精度与标度 |
| DECIMAL精度>38 | VARCHAR(precision+3)，固定源标度的无损十进制文本，需要确认 |
| JSON | CLOB，保留JSON文本与数字精度，需要确认；不冒充原生JSONB |
| STRING | 有界短文本VARCHAR(n CHAR)，大文本CLOB |
| 有界二进制 / 大二进制 | VARBINARY / BLOB |
| DATE / DATETIME / TIMESTAMP | DATE / TIMESTAMP(6) |
| MySQL TIME | INTERVAL DAY(2) TO SECOND(6)，保留符号、微秒及超24小时时长 |

宽小数文本保留值，不保留原生数值排序、比较、聚合语义；业务接管前需要评估类型与SQL。JSON文本也不能等同于所有版本原生JSON类型。生成列沿用已支持的源表达式，写普通目标列。无主键表保留 `_rivomesh_row_id` 和重复行重数。

业务 UNIQUE 默认转普通索引，要求源约束有效、完整有序同步且目标仅同步服务写入；主键/实际身份键保留。简单业务GSI可转换为普通索引，失去全局路由和唯一性。前缀、表达式、倒序、全文、空间索引需单独计划；CLOB/BLOB索引不能静默照搬，返回DM_LOB_INDEX_REQUIRES_PLAN。不会自动DROP已有UNIQUE。任意非空目标接管、过程、触发器、外键、分区及完整DDL演进仍需迁移方案。

## 事务、故障和 FAQ

业务变更与目标断点在同一DML事务提交，元数据行锁与递增epoch隔离旧Worker。达梦DDL可能自动提交；准备对象后重取写入隔离锁，不在业务事务中夹入DDL。不同目标独立确认，不是全局原子提交。

- **网络/实例中断**：识别为临时连接错误时自动退避重连；其他目标继续，直到日志背压。数据库运维负责选主和写入口，完整主备/集群矩阵另验。
- **SQL错误**：仅当前订阅暂停。修复权限、约束或类型后，在UI恢复，或用当前errorGeneration执行 `resume config/dm-v3.yml dm-business <errorGeneration>`。恢复重试原事务，不跳过错误；重启不能绕过暂停。
- **缺失表/归属/断点**：拒绝在旧进度下自动建空替代物；保留证据并制定重建/对账方案。
- **精度超范围**：不要把65位小数强制改38位。检查文本转换计划及业务SQL，确认后重检。
- **字符长度不足**：VARCHAR默认可能按字节。既有表会核对ALL_TAB_COLUMNS中的CHAR_USED/CHAR_LENGTH/DATA_LENGTH；字节列按最坏UTF8四字节容量评估，不接受不足容量。二进制列也核对容量，日秒间隔要求至少DAY(2)/SECOND(6)。CHAR语义、长字段/页大小仍需评估，不能仅凭同一长度数字认定兼容。
- **大小写/空串/尾空格不同**：检查实际实例初始化参数和兼容模式；已有列自定义规则仍需单独评估。
- **已有目标数据/额外约束**：不会覆盖或自动删除约束。普通resume不是完整接管工具；对账/修复/切换工作台仍待完成。
- **试用许可到期**：使用厂商合法授权的版本。测试初始化可能显示试用期限；不会修改授权文件或绕过许可检查。

原生测试入口为 `bash tests/dm-pipeline-run.sh`，使用本机合法镜像或 `RIVOMESH_DM_IMAGE` 指定的同布局版本。脚本创建独立项目，仅清理自己的容器和卷，不修改宿主机参数。不同镜像/版本必须重新验证，测试资源配额不是硬件性能标准。

### Java 21 外置达梦驱动实库验收

外置厂商驱动候选包在 Temurin 21.0.13 上运行，由部署方单独提供达梦 JDBC 8.1.3.140，连接原生 UTF-8 模式的达梦 8.1.4.80 ARM64。测试核验了两个外置驱动的加载来源、缺少驱动时的预检拒绝和达梦原生缺表错误。MySQL 8.4.13 向达梦及 PostgreSQL 17.12 同步时，DECIMAL(65,30)、UINT64、JSON、二进制和无主键数据均核对一致。达梦重启后从同一地址重连，Worker 强制终止后保留快照和断点，两个目标分别重试各自原先失败的 SQL 事务。

使用 Java 21 JDK、本地兼容的达梦镜像及单独取得的两个驱动文件复现。

```bash
python3 tests/dm-external-jdbc-native.py --artifact "$candidate" \
  --mysql-driver "$mysql_driver" --dm-driver "$dameng_driver" \
  --java "$JAVA_HOME/bin/java" --output target/dm-external-jdbc-native
```

参见[外置厂商 JDBC 构建和 classpath](/docs/zh/reference/release-inventory.html#外置厂商-jdbc-驱动的候选包)。

官方参考：[JDBC](https://eco.dameng.com/document/dm/zh-cn/pm/jdbc-rogramming-guide.html)、[建库参数](https://eco.dameng.com/document/dm/zh-cn/pm/dminit-parameters)、[SQL定义](https://eco.dameng.com/document/dm/zh-cn/pm/definition-statement.html)、[存储与提交参数](https://eco.dameng.com/document/dm/zh-cn/pm/physical-storage)。
