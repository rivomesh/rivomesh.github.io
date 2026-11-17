---
kind: docs
locale: zh
title: "金仓 Kingbase"
sourcePath: docs/zh-CN/kingbase-v3.md
---

# 金仓 目标与 FAQ

English: [Kingbase V3](/docs/en/reference/kingbase-v3.html)。配置：[kingbase-v3.yml](/files/config/kingbase-v3.yml)。

## 当前范围

V3 配置、CLI、逐库映射、多目标 Worker 和中英文向导已接入 `product: KINGBASE`。当前适配 PG 兼容模式，能力目录保持 **EXPERIMENTAL**；首批 Java8 / 金仓 V009R001C001B0025 PG/UTF8 原生事务与 MySQL8.4.13＋PostgreSQL17.12 联合恢复已通过，见[验收记录](/docs/zh/evidence/2026-11-15-kingbase.html)。不能用 PostgreSQL 的既有通过记录代替金仓验收。其他兼容模式、RAC、分布式产品、全部版本及性能尚未完成。

使用厂商命名空间的 `com.kingbase8.Driver`、`jdbc:kingbase8://` 和固定 Java8 驱动 `cn.com.kingbase:kingbase8:9.0.1`；不把目标配置成 PostgreSQL 来绕过检查。驱动来自 Maven Central，厂商 POM 声明 Apache-2.0，完整发行依赖/NOTICE 审核仍属于发布准备工作。

每次新物理连接在访问管理表前检查真实产品、`version()`、`SHOW database_mode`、UTF8 编码、空字符串、大小写/尾空格比较与可写性，设置 UTC、标准字符串和 `synchronous_commit=on`。仅 `pg` 模式通过；服务不修改数据库兼容模式、全局参数或主备角色。本地同步提交不代替数据库自身的可靠存储与同步复制配置，不代表已验证多节点故障切换。

## 配置与启动

先由 DBA 创建金仓数据库、用户及 UTF8 编码，并提供可写入口。每个 MySQL database 用 `mappings` 显式映射为该金仓数据库中的 schema；可并行配置 PostgreSQL、消息等其他目标。服务可创建映射 schema、普通表、索引及自己的管理表，不负责安装数据库或创建数据库账号。

```bash
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/kingbase-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/kingbase-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar status config/kingbase-v3.yml
```

密码使用 `MYSQL_PASSWORD`、`KINGBASE_PASSWORD` 环境变量或受保护配置。UI 选择 V3 和 KingbaseES (PG)，逐库填写映射；V2 不支持本目标。Linux/Docker/Helm/原生 K8s 使用同一任务配置，部署清单不安装金仓。目标用户需有相应 schema/表/索引创建、元数据读取及业务/管理表读写权限；连接检查成功不等于全部权限通过。

## 数据、索引与恢复

业务变更与目标断点在同一事务提交，管理行锁和递增 epoch 隔离旧 Worker；不确定提交后重读目标断点，重放不会仅凭采集位点猜测成功。不同目标独立确认，不提供全局原子提交。可选本地日志用于同机恢复，跨机 Worker 接管使用已支持的 PostgreSQL/openGauss/MySQL 外部日志。金仓日志后端尚未验收，配置会拒绝 `journal.product: KINGBASE`。

无主键表增加 `_rivomesh_row_id` 保存重复行重数；生成列支持范围沿用源适配器，写入普通目标列。UINT64→DECIMAL(20,0)，DECIMAL 保留声明精度，JSON→JSONB，二进制→BYTEA，微秒时间→TIMESTAMP(6)，MySQL 带符号/超24小时时长→INTERVAL。不能自动等同迁移过程、触发器、外键、分区布局和任意生成表达式。

默认 `DOWNGRADE_BUSINESS` 将业务 UNIQUE 转普通索引；主键/实际身份键不能降级。简单 BTREE/业务 GSI 可用普通索引转换计划，转换失去全局路由/全局唯一约束；表达式、前缀、倒序、全文、空间等需单独计划。转换要求源约束有效、完整有序同步、目标仅同步服务写；接管前必须对账并重建所需约束。既有 UNIQUE 不会被自动 DROP，非空或不兼容目标需接管方案，完整自动接管仍待完成。

网络中断自动退避重连，其他目标可继续，直到日志容量产生背压。确定性 SQL 错误只暂停当前订阅；修复后在 UI 恢复，或使用当前 `errorGeneration` 执行 `resume config/kingbase-v3.yml kingbase-business <errorGeneration>`。它重试原事务，重启不会跳过错误。缺失目标表/归属/断点时拒绝沿用旧进度，普通恢复不能修复数据丢失。

## TIME 与原生验收范围

MySQL TIME 是带符号时长，不能用 java.sql.Time/LocalTime 当成一天内时刻。V3 JDBC 快照与 binlog 都规范为 `[-]HH:MM:SS.ffffff`；固定0.30.3 SDK 的普通/扩展 INSERT、UPDATE、DELETE 行事件使用时长扩展解码器，其他字段仍用原 SDK 编解码。TIME2 的0～6位小数、负小数补码、超24小时及无主键身份已验证。V2 类型范围没有因此扩大。

首批实际链路验证源值与目标的整数微秒，覆盖正负25小时、全部小数精度和负1微秒；边界/非法二进制由单元检查覆盖。MySQL参考SQL使用 `TIMESTAMPDIFF(MICROSECOND,...,ADDTIME(...))`，不把本次环境返回整数的 TIME_TO_SEC 或默认四位除法当作微秒基准。金仓本版 EXTRACT(EPOCH) 返回 float8，先转 NUMERIC(20,6) 再比较整数微秒。其他目标的全部 TIME 类型矩阵尚未验收，不把通用文本映射视为已跑过全部连接器。

同一实际发布包还验证了跨schema业务/断点整事务回滚、重放、别名归属保护、旧epoch拒绝、可写入口检查、PG伪装产品拒绝、全量/增量、目标停机时PG继续且重启追平、Worker SIGKILL保持generation/snapshot、两端分别SQL约束修复重试、重启保持暂停、缺失目标表隔离和最终事务写入隔离。不同版本/模式、主备集群/路由、TLS、其他JDK、旧非空物理备份恢复、掉电、长稳和硬件吞吐仍需独立验收。既有列自定义排序规则与业务接管需单独评估。

## FAQ

- **为什么只支持 PG 模式？** 其他模式的空串、类型、标识符及目录可能不同，需产品模式适配和原生验证；不会修改已有实例模式来“兼容”。
- **模式或产品不匹配？** 检查实际路由及 `SHOW database_mode`，不要改成 PostgreSQL 配置来绕过检查。
- **编码不是 UTF8？** 官方旧镜像可能默认 SQL_ASCII。由 DBA 创建 UTF8 数据库或迁移编码后重检，不自动原地改编码。
- **入口只读？** 返回可重试连接错误，检查数据库选主及写入口；同步服务不提升备库，也不重置位点。
- **字符串比较不兼容？** 检查实例大小写/尾空格选项。首批适配要求大小写和尾空格可区分；不自动修改全局比较规则。
- **已有表有数据/约束？** 不会覆盖或自动删约束，需显式接管计划；不要手工清空管理表后继续旧任务。
- **能否目标同时服务业务写？** 当前降级策略要求目标只有同步服务写入；双向冲突处理及切换工作台仍未完成。
- **数据库镜像和授权？** 本项目不分发数据库安装包或 license，使用厂商授权的对应平台版本。测试脚本不绕过授权，不使用特权容器。

## 原生验证入口与官方参考

已有合法镜像后执行 `bash tests/kingbase-pipeline-run.sh`，可用 `RIVOMESH_KINGBASE_IMAGE` 指定同布局镜像。脚本创建独立 MySQL8.4、PostgreSQL17 和金仓测试环境，使用真实发布包；结束仅清理自身项目及测试卷，不操作生产库。初始化脚本明确 PG/UTF8、不启用大小写不敏感选项，并直接以镜像 kingbase 用户运行原生服务。其他镜像布局需适配脚本，不能只换版本号就视为通过。

- [官方 JDBC 使用说明](https://docs.kingbase.com.cn/cn/KES-V9R1C10/quick_start/access_tool/java/jdbc/)
- [官方 Docker 部署说明](https://help.kingbase.com.cn/v8/install-updata/install-docker/install-docker-1.html)
- [官方参数说明](https://help.kingbase.com.cn/v8/faq/faq-new/parameter.html)
- [固定驱动 POM](https://repo.maven.apache.org/maven2/cn/com/kingbase/kingbase8/9.0.1/kingbase8-9.0.1.pom)
