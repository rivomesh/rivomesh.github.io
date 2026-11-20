---
kind: docs
locale: zh
title: "OceanBase"
sourcePath: docs/zh-CN/oceanbase-v3.md
---

# OceanBase 目标与 FAQ

English：[OceanBase V3](/docs/en/reference/oceanbase-v3.html)。示例：[oceanbase-v3.yml](/files/config/oceanbase-v3.yml)。

## 当前范围

V3 配置、CLI、多目标 Worker 和中英文向导均支持 OceanBase。历史档案使用 OceanBase CE 4.3.5.6 ARM64 和 Java 8，通过原生事务以及 MySQL 同时写入 OceanBase 与 PostgreSQL 的全量、增量和恢复验收。MySQL 模式租户档案保持 EXPERIMENTAL。Oracle 模式、OBProxy、多节点和更多 Temurin 21 组合另行验收。[实测记录](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#oceanbase-mysql-tenant-recovery)

`product: OCEANBASE` 使用 MySQL Connector/J8.4.0 和 `jdbc:mysql://`，默认端口2881。必须连接 **MySQL 兼容的业务租户**，用户名通常为 `rivomesh@business`；不是 `root@sys`。启动和每次重新连接均核对 OceanBase 产品、兼容模式及非系统租户，并强制 `ob_read_consistency=STRONG`。MySQL 线协议版本号不代表 OceanBase 产品版本。Oracle 模式、seekdb 和其他兼容数据库不在本配置的已验证范围内。

## 启动与恢复

先按示例填写源候选地址、业务租户和逐库映射，并提供 `MYSQL_PASSWORD`、`OCEANBASE_PASSWORD` 环境变量。源 GTID/ROW/FULL 及权限要求见 [V3 手册](/docs/zh/reference/pipeline-v3.html)，界面操作见[控制台手册](/docs/zh/reference/console-and-deployment.html)。CLI 入口如下：

```bash
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/oceanbase-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/oceanbase-v3.yml
```

另一终端查看 `status config/oceanbase-v3.yml`。确定性错误修复后，可在界面恢复对应目标，或执行 `resume config/oceanbase-v3.yml oceanbase-business 7`；命令前同样加 `java -jar ...`，其中7必须替换为当前状态返回的 `errorGeneration`。恢复不跳过原失败事务。首批目标接入仅 V3，向导中选择 OceanBase 并填写用户租户身份，额外目标可继续选择 PostgreSQL 等产品。

## 数据、事务与索引

源 database 逐库显式映射到同一业务租户内的目标 database。一个配置可同时写 PostgreSQL、OceanBase 等多个目标，各目标独立确认与暂停。服务可创建目标 database 和表，不创建集群、资源池、租户或用户。

业务修改与目标断点在同一目标事务内提交，通过元数据行锁及 epoch 隔离旧 Worker。事务响应丢失时重读目标断点决定重试，不以源采集进度代替目标应用进度。跨独立目标不提供全局原子提交。

无主键表增加内部 `_rivomesh_row_id`，保留相同值记录的数量；该字段不能由业务修改。UINT64 使用 DECIMAL(20,0)，十进制保持声明精度，JSON 使用原生 JSON，二进制使用 LONGBLOB，日期时间按当前关系目标类型映射。生成列复制源适配器已支持表达式的求值结果，在目标是普通列。不自动复制存储过程、触发器、外键、分区布局、索引物理分布或生成表达式；无法证明兼容的已有目标需要接管计划。

默认 `uniquePolicy: DOWNGRADE_BUSINESS` 将业务 UNIQUE 转成普通索引；主键和实际行身份键不能降级。普通 BTREE 和简单 GSI 可按现有计划生成普通索引，GSI 的全局路由/唯一性和源分区语义不随之保留。表达式、前缀、倒序、全文、空间等索引需要显式转换计划。可选择 `PRESERVE` 保留可表达的业务唯一性，但实际 DDL 约束仍需逐环境验证；GSI 不因此自动具备原产品语义。

降级适用于同步期间仅由服务写入、源约束持续有效、源事务完整按序应用的场景；不能把它当成允许目标任意写入的唯一性保证。既有 UNIQUE 不会自动删除，检查到冲突需制定迁移计划。接管前停止增量写入、完成一致性校验并重建所需约束；完整自动接管工作流仍待完成。

## 部署与权限

在 Linux/Docker/Helm/原生 Kubernetes 的任务配置中使用同一份 V3 YAML。平台部署文件不负责部署 OceanBase 集群；生产集群、OBProxy、租户资源及网络隔离由数据库平台管理。目标账号需能读取相关元数据，创建映射库/表/索引，并读写业务和 Rivomesh 管理表；`check` 的连接成功不等于全部 DDL/DML 权限均已验证。通过环境引用或受保护配置提供密码。

本地 Journal 适合同机恢复；跨主机 Worker 接管使用已经支持的外部 PostgreSQL/openGauss/MySQL Journal。当前不能把 `journal.product` 配成 OCEANBASE，避免将尚未验收的日志后端当作可用。Controller 多副本高可用与真实 Kubernetes/CSI 验收另列待办。

## 故障与 FAQ

- **用户名正确却提示租户不匹配？** 检查用户后缀、OBProxy 路由及租户模式。系统租户和 Oracle 租户会被拒绝，不自动修改模式。
- **目标断网或重启？** 可识别的连接类暂时错误退避重连，恢复后按目标断点追平；其他目标继续，积压达到 Journal 配额后采集背压。数据库集群自身选主由 OceanBase 完成，多节点/OBProxy 切换仍需单独验收。
- **SQL 错误？** 对应订阅 PAUSED，保留失败事务。修复权限、类型或约束后，在界面或 CLI 使用当前 `errorGeneration` 恢复原事务；重启不绕过暂停，不自动跳过。
- **目标表或元数据被删除？** 不在旧断点下偷偷建空表继续。保留现场，按数据/断点证据制定重建计划。旧备份、缺失历史和手工删数据不能用普通 resume 修复。
- **为什么强制强一致读？** 故障后必须读取可信的已提交断点，弱读可能看到旧值。连接参数请求 WEAK 不会覆盖本适配器的 STRONG 要求。
- **与 MySQL 目标是否同一种配置？** 协议相近但产品身份、租户和读一致性要求不同，应显式选择 OCEANBASE。
- **源端新增列、改表或删除表？** 初始自动建表不等于完整在线DDL。当前不支持的结构变化会保留安全断点并要求转换计划；不要靠改GTID绕过。完整DDL、校验修复与迁移工作流仍待完成。
- **已有目标能直接接管？** 兼容空表可按结构/归属检查接入；首次接入的非空表，即使看起来与源一致，也需可验证基线和接管计划。当前不自动清空，也不提供无证据续接。
- **性能能达到多少？** 测试容器配额只用于正确性测试，不是硬件容量标准。需按行宽、事务大小、索引、目标数量、积压窗口及租户资源运行基准；硬件容量报告仍待发布。

## 官方参考

- [官方 Docker 测试镜像及资源参数](https://github.com/oceanbase/docker-images/blob/main/oceanbase-ce/README.md)
- [MySQL 模式事务控制](https://docs.oceanbase.com/oceanbase-database/V4.2.1-control-mysql-transactions)
- [系统变量概览](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000005283255)

## 测试镜像启动诊断

通过验收的官方 all-in-one 夹具使用 8 GiB 实例上限、1 GiB 系统内存、3 GiB 租户资源单元、10 GiB 容器上限和 6 CPU。实例日志盘 5 GiB，数据盘 2 GiB。这些设置用于复现正确性档案，生产容量以实际工作负载测量为准。

资源单元内存不等于业务租户独占内存：实际探针曾显示2GiB单元拆给元租户和业务租户后，业务租户约1GiB。其他租户/缓存及主机负载同样影响恢复。`boot success!` 也不保证数据库已启动；本镜像在 OBD 内存检查失败时仍可能打印该文本。应同时检查实际 observer 进程、业务租户连接、容器 health 和 OBD 日志。不要删除旧数据或跳过同步断点来解决启动资源不足，不要盲目使用 `obd cluster start -f`，该版本的 `-f` 是 force-delete，而非跳过资源检查。

## 复现实库恢复

构建当前发布包，运行 `tests/oceanbase-pipeline-run.sh`。用例检查租户、事务隔离与 epoch，再实测全量、增量、目标停机追平、Worker 强杀、两边独立 SQL 错误、修复和缺表隔离，结束后清理夹具数据库资源。`RIVOMESH_TEST_ARTIFACT` 可以指定仓库相对路径的冻结 JAR。早期 6 GiB 容器场景曾遇到 OBD 内存准入、租户恢复以及管理 DDL 超时。此次通过使用上面的资源档案和原事务断点。
