---
sourcePath: docs/zh-CN/gbase8c-v3.md
---

# GBase 8c 目标

当前提供 `GBASE_8C` 实验适配，使用真实厂商驱动 `com.gbase8c.Driver` 和 `jdbc:gbase8c://`。GBase **8a、8c、8s 是不同产品族**，不能把 PostgreSQL 协议连通当作三者均支持。8a、8s 仍待分别实现。首批针对 V6 S1.3.0B19、ARM64、PG/UTF8；首批真实 MySQL＋PostgreSQL 联合全量/增量、TIME、无主键/文本主键、停机追平、强杀续传、SQL 修复和缺表隔离已通过。此结果限于该配置，不能作为完整生产矩阵承诺。

配置示例：[config/gbase8c-v3.yml](/reference-files/config/gbase8c-v3.yml)。CLI `check/run/status/resume` 和 Web v3 向导均使用相同适配。目标实例需提前创建 PG 兼容数据库、UTF8 编码和具有建 schema/表/索引及业务 DML 权限的同步用户；服务不改变全局兼容模式、不执行主库提升。

连接账号应使用独立登录用户。原生测试确认初始化用户 `omm` 被禁止远程连接；普通用户仅有 `CREATEDB` 属性也不能在 `postgres` 中建 schema。由管理员预先按目标范围授权，例如：

```sql
GRANT CREATE, CONNECT ON DATABASE postgres TO rivomesh_writer;
```

已有 schema/表还需对应对象权限或归属。运行同步不要求系统管理员；测试账号的 `CREATEDB` 用于创建反例兼容模式数据库，实际预建数据库场景不需要照搬。[厂商权限说明](https://www.gbase.cn/community/post/5726)。

## 会话与数据

每个物理连接先核验元数据产品 `GBase8c` 与内核 `version()`，然后检查 `sql_compatibility=PG`、UTF8、空字符串非 NULL、文本大小写与尾空格比较；设置会话 UTC、`synchronous_commit=on`、标准字符串转义。只读入口以可重试连接错误等待恢复。其他兼容模式需要独立类型及语义方案。

自动建表使用带引号标识符、普通行存表和主键；无主键表使用内部 occurrence ID。JSON→JSONB，UINT64→DECIMAL(20,0)，宽小数保留精度，二进制→BYTEA，时间戳保留微秒，MySQL TIME→带符号 INTERVAL。生成列写入源端计算后的值，不宣称目标端完整重建所有生成表达式。原生探测已确认 VARCHAR(100) 可存 100 个四字节 Unicode 字符。

每个目标在同一本地事务提交业务写入与进度，带租约 epoch 隔离；目标停机不阻断其他目标确认。目标强制回退旧物理备份、双主写入、外部写入以及跨目标全局原子提交不属于此保证。

## 索引与分布式边界

`DOWNGRADE_BUSINESS` 可把非身份业务 UNIQUE 转普通索引；简单业务 GSI 可转普通索引，但失去全局唯一性与路由能力。主键、同步身份键和内部唯一键不能降级。既有 UNIQUE 不自动删除，表达式/前缀/全文/空间索引需要审核方案。目标仅允许同步服务写入；业务接管前校验数据并恢复约束。

8c 分布式表有分布列及唯一约束限制，见[厂商 SQL 参考](https://www.gbase.cn/docs/gbase-8c/04%20%E5%8F%82%E8%80%83%E6%89%8B%E5%86%8C/02%20SQL%E5%8F%82%E8%80%83/SQL%E8%AF%AD%E6%B3%95/)。当前首批单实例 PG 验证不能证明 CN/DN 分布式、DSS 共享存储、主备切换、跨分片事务和重分布兼容。分布键更新、元数据/归属表分布、保留 UNIQUE 及全局索引需独立规划和实机验证；不应照搬单节点配置宣称通过。

## 恢复与 FAQ

- **停机或网络失败**：保留日志和目标进度，等待同一可写目标恢复。需要确保日志容量与源 binlog 保留时间足够。
- **SQL 错误**：失败目标暂停；在界面查看原因、修复约束/数据后恢复，重试原事务。尚无手工跳过/补偿编辑工作流。
- **业务表缺失**：暂停受影响目标，不能通过直接改 checkpoint 冒充完成；重建/重迁需单独方案。
- **已有目标非空**：当前拒绝无计划接管；已有空表也要核验列、主键、触发器、外键、索引和归属。
- **源 DDL**：不支持的运行中 DDL 安全暂停；完整在线演进尚未完成。
- **驱动版本显示占位符**：下载包文件名为 `gbase8c-jdbc-3.0.0B02.jar`，内嵌 Maven 版本为 `3.0.0`，运行时 DriverVersion 含未展开占位符。构建使用固定包名与 SHA-256，不依赖该字符串作精确版本证明。

## 可复现输入

厂商公开下载页：[安装包/驱动](https://www.gbase.cn/download/gbase-8c?category=DRIVER_PACKAGE)。驱动 ZIP SHA-256 `3c2645993cd2e20a19941fc4d4bb5aba0f02ca378766543b6dd259a50c382721`，JAR SHA-256 `fe115f05124f6b9f37e49c829a0def28f7d09a6d871dd62a0c9f856b0aaa7e91`；构建逐项校验，保留原厂类及独立许可证。驱动 Java 字节码要求不高于 Java 8。

测试夹具单独下载合法厂商内核，不在仓库分发数据库二进制或许可证。`tests/gbase8c/Dockerfile` 的本地基础镜像仅提供 Linux 用户态，实际运行的是核验过的 GBase `gbased`，不会把 openGauss 作为 GBase 替代验收。

[English](/reference/en/gbase8c-v3.html)

## Native fixture reproduction / 原生夹具复现

Use Python 3.12+ and a lawful matching ARM64 vendor installer:

```sh
python3 tests/gbase8c/prepare.py /path/to/GBase8cV6_S1.3.0B19_Unified_centos7.6_aarch64.tar.gz
SYNC_MAVEN_CACHE=/tmp/rivomesh-container-maven-cache bash tests/gbase8c-pipeline-run.sh
```

Installer SHA-256: `6946abaa7666cbfadea3957682020262a102e52c6f7b4632d1f93fee9d3400b7`; extracted B19 kernel SHA-256: `69663acfbb786c3f05cc434fb9f6d42806609b69c818c6e6ce0c4234748ad582`, matching its vendor checksum. The unified installer also contains a B10 kernel; this fixture explicitly selects B19.
