---
kind: docs
locale: zh
title: "Apache Doris"
sourcePath: docs/zh-CN/doris-v3.md
---

# Doris 目标、恢复与 FAQ

English：[Doris V3](/docs/en/reference/doris-v3.html)。配置：[doris-v3.yml](/files/config/doris-v3.yml)。

## 当前范围

已实现原生 MySQL 协议建表/元数据与 HTTP Stream Load 写入，独立原生恢复及真实 MySQL＋PostgreSQL 联合故障链路均已通过，见[归档证据](/docs/zh/evidence/baseline.html)。首批环境为官方 `apache/doris:all-in-one-4.1.3` ARM64 镜像，内部报告 `doris-4.1.3-rc02-7126cf65d96`。这不是全部 Doris 版本、集群或生产性能验收。

Doris 是分析物化目标。关系库事务目标仍使用自身事务/断点协议，Doris 不进入普通 MySQL JDBC Sink，也不作为外部 Journal。源仍为 MySQL，支持多 database 显式映射和同源多目标。

## 数据布局与一致性

每张源表在 `metadataSchema` 内建立专属物理 Unique Key/Merge-on-Write 表，业务映射库使用源表名的查询视图，按源列顺序隐藏内部字段并排除删除标记。内部表名由任务、订阅、流代次和源表身份生成，短于64字符；完整归属信息仍保留，冲突不会覆盖其他对象。

内部身份键来自主键、身份键或标准化无主键行身份；不是业务 UNIQUE(email)。无主键相同值的多条记录拥有不同内部身份，删除一条不会删除所有重复值。源版本号和行序号编码为LARGEINT，较旧请求不能覆盖较新状态。删除保留当前版本的墓碑行，不依赖可被压缩清理的原生删除标记来阻挡旧数据。只查询业务视图，不直接修改内部表或删除墓碑。

同表单次Stream Load具有原生可见性，但源事务可能拆成多个表/行批次，因此**不提供源跨表事务的整体可见性**。全量或积压未追平的视图不可直接作为业务切换一致性边界。目标仅由同步服务写入；此分析布局不能直接当作同构OLTP库接管业务写入。

## 类型与索引

| 源规范类型 | Doris存储 |
|---|---|
| BOOLEAN / INT64 | BOOLEAN / BIGINT |
| UINT64 | LARGEINT，范围仍限定源无符号64位 |
| DECIMAL | DECIMAL(P,S)，支持配置范围1–76，SQL会话启用decimal256；MySQL65位已实测 |
| FLOAT32 / FLOAT64 | FLOAT / DOUBLE；拒绝非有限值 |
| STRING / JSON / DATE / TIME / DATETIME / TIMESTAMP | 无损文本STRING，不冒充原生JSONB/日期时间语义 |
| BYTES / GEOMETRY | base64文本STRING，可解码恢复原字节 |

生成列沿用当前源适配器支持的表达式范围，同步已求值的结果，不在目标重建生成表达式。源空值和字段缺失分别处理，要求完整行镜像。Stream Load强制 `num_as_string=true`，防止大整数/小数在JSON解析时先转成double；JSON作为字符串传输，不改变其内部数字。

默认 `secondaryIndexes: INVERTED`：普通BTREE、业务UNIQUE及通用GSI标记转换为按列非唯一倒排索引，复合索引可能拆成多列索引。此转换不保留业务唯一约束、源排序/排序规则、复合前缀或全局路由。内部行身份不降级。表达式/前缀/全文/空间及不支持类型需要明确计划，不能静默省略；`NONE`明确省略次级索引。检查结果包含 `dorisIndexPlans`，与源索引、动作和差异对应。修改初始化后的索引/分桶/副本策略会要求迁移，不能改指纹绕过。

## 连接、权限与部署

`url`是Doris FE的MySQL协议入口（通常9030），`doris.loadUrl`是HTTP源地址，可直接使用BE（通常8040）。FE HTTP入口的307/308只允许转发到 `redirectOrigins`列出的精确源地址（协议、主机、端口）；路径必须保持，禁止URL凭据、查询参数和HTTPS降级。所有入口必须属于同一Doris集群，身份/回执核验不能代替正确的网络配置。

源/目标账号和密码使用独立字段及环境引用。首批对象身份检查使用SHOW FRONTENDS/SHOW TABLETS，按Doris权限要求需要专用Doris ADMIN账号，尚无最小权限替代配置；控制台账号角色与数据库权限不同。业务查询账号应只访问业务视图。SQL和HTTP的TLS配置需单独验收。

默认3副本，需要足够BE；单BE测试必须显式配置 `replicas: 1`，程序不会自动降低副本数。`buckets`默认4、范围1–64；副本配置范围1–5。测试Compose中的资源限制是验证工具参数，不是“多少硬件达到多少吞吐”的生产标准。

CLI运行方式与其他V3任务一致；Web向导选择Apache Doris，配置SQL/HTTP入口、重定向白名单、副本、分桶、索引策略，先检查再启动。检查只读源结构并检查Doris SQL能力与HTTP健康，不创建表，也不证明LOAD/DDL权限。

SQL连接强制有限连接/socket超时，并关闭Connector/J查询取消计时器，以避开断连清理时的计时器空指针；不通过把任意程序异常当成网络错误来掩盖问题。HTTP有独立连接/读取超时、请求/响应大小上限，不在客户端内部盲目重试不确定的PUT。

## 确认与故障恢复

Stream Load要求零过滤、严格模式、完整输入行数确认。返回Publish Timeout或运行中标签时不推进断点。每次尝试使用独立加载标签；版本行和持久目标回执承担幂等性，取消/过期标签不作为永久断点。收到成功/已完成标签后，还要核对实际行的键、版本、删除状态和列值；元数据也检查实际保存内容。

业务行/元数据确认后，写入保留在目标的批次回执，再将回执位置写Journal，最后推进该订阅事务断点。网络响应不确定或进程崩溃可重放；较新版本不会被旧请求覆盖。Doris与其他目标独立确认，Doris暂时不可用时关系库目标可以继续，日志达到配额后才触发背压。

重启先检查物理Tablet身份、归属、结构、视图及最新已确认回执。已建立目标丢失不会沿旧断点自动创建空对象。完整FE＋BE恢复到旧非空备份、但Journal仍保存新断点时，最新回执缺失会阻止续传；恢复正确目标或制定重建计划。备份应协调数据、元数据和Journal，不能只恢复部分业务表；不一致的逐表回退、任意外部篡改需要对账/修复流程，当前不宣称全面检测。

暂停返回Doris `UNCONFIRMED_IN_FLIGHT_MATERIALIZATION`，表示不能撤销已经进入目标的请求；关系库目标可返回FENCED。不能据此宣称Doris已经成为业务接管屏障。确定性结构、数据、权限错误暂停该订阅，修复后按错误代次恢复；不跳过原事务。

## FAQ

**目标UNIQUE和GSI在哪里？** 业务UNIQUE/GSI只做非唯一物理加速，源约束及独占写入保证追平状态；不支持外部应用同时向该布局写入。Doris的内部UNIQUE KEY保护行身份，与业务唯一键不同。

**为什么有视图和内部表？** 用于隐藏无主键身份、版本与删除标记，同时保持业务列顺序。不得用同名普通表替换视图或把私有物化表当源表DDL的完全等价物。

**SQL入口能连但写入失败？** HTTP健康不检查LOAD权限，且SQL/HTTP是不同入口。核对同集群地址、账号、LOAD/DDL及元数据身份权限；FE重定向需要准确白名单。

**SQL错误是否影响其他目标？** 确定性错误暂停本目标，其他目标继续。修复后使用界面独立恢复或 `resume config.yml subscriptionId expectedErrorGeneration` 重试原事务；不要修改GTID/已确认序号。

**可否自动接管已有非空目标？** 当前仅创建缺失且可归属的内部对象/视图，拒绝占用其他任务或既有不匹配对象。既有数据接管、布局迁移、动态DDL和业务切换仍需要后续工作流。

**保留空间会自动释放吗？** Source Journal按独立ACK回收；目标回执、墓碑和物理索引不计入Journal逻辑配额，需另外监控。目标回执压缩/清理、长稳与硬件基准尚未完成。

## 官方依据与验收边界

设计依据：[Stream Load](https://doris.apache.org/docs/4.x/data-operate/import/import-way/stream-load-manual/)、[Unique Key并发更新](https://doris.apache.org/docs/4.x/data-operate/update/unique-update-concurrent-control/)、[JSON导入精度](https://doris.apache.org/docs/4.x/data-operate/import/file-format/json/)、[Tablet权限与身份](https://doris.apache.org/docs/4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET/)、[官方测试镜像](https://doris.apache.org/community/developer-guide/all-in-one-image/)。这些产品文档不是本项目的验收证明；实际范围见[验证记录](/docs/zh/reference/validation.html)。完整集群/存算分离、FE/BE联合故障、TLS、各JDK、海量表/巨型事务、接管/修复/迁移及吞吐矩阵仍待完成。

## SQL 模式与字符校验

目录、回执和行核验的值通过 MySQL 二进制服务端预编译参数传递，不拼接源表名到字符串值。适配器强制 `useServerPrepStmts=true` 和 `emulateUnsupportedPstmts=false`；不支持该协议的版本会明确失败，不回退为字符串插值。DDL 注释只允许内部安全标识。已在 Doris4.1.3/Java8 实测空 SQL 模式及 `NO_BACKSLASH_ESCAPES`，包括引号/反斜杠表名、Unicode/emoji 文本、快照、增量和会话重建。非法 UTF-16 文本以 `DORIS_TEXT_ENCODING_INVALID` 暂停，不反复重试同一非法内容，见[补充验证](/docs/zh/evidence/baseline.html)。

Sources: [Doris prepared statements](https://doris.apache.org/docs/4.x/key-features/prepared-statement/), [string literals](https://doris.apache.org/docs/3.x/sql-manual/basic-element/literal/string-literal/).

参数绑定修改后，当前发布包9a087又通过实际MySQL8.4.13→PostgreSQL17.12＋Doris4.1.3联合用例，包含目标停机自动追平、Worker强杀续传、SQL修复重试及视图丢失隔离。原生特殊SQL模式/旧备份用例使用11667063；两包14个Doris适配器类逐字节一致，验收范围和包差异见[补充证据](/docs/zh/evidence/baseline.html)。
