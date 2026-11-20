---
kind: docs
locale: zh
title: "失败事务诊断"
sourcePath: docs/zh-CN/failed-transactions.md
---

# 失败事务诊断与人工恢复

[English](/docs/en/reference/failed-transactions.html)

当前界面支持目标故障阶段摘要、增量原事务重试、快照分块恢复及[管理员事务审阅](/docs/zh/reference/failure-review.html)。有界暂停事务检查和[持久证据](/docs/zh/reference/failure-evidence.html)已接入界面原始/规范化事件分页；管理员可按场景选择[事务跳过](/docs/zh/reference/transaction-skip.html)、[前镜像补偿](/docs/zh/reference/transaction-compensation.html)、[类型化修正](/docs/zh/reference/manual-correction.html)或[共同校验点修复](/docs/zh/reference/managed-repair.html)。

## 界面操作

1. 打开任务详情，找到暂停的目标。记录目标标识、错误版本、确认序号、错误码、故障阶段及可用的失败事务序号。
2. 根据阶段检查原因。目标连接/元数据激活：检查地址、凭据、权限及目标元数据。目标应用：检查类型、约束和目标数据。映射/历史结构：检查映射和对应历史结构。提交核对：先核对目标凭据和日志 ACK，不手工推进位点。
3. 修复原因后点击“恢复此目标”。请求绑定该目标错误版本：增量阶段重新投递完整原事务，快照阶段核对并继续分块断点；旧版本请求会拒绝。源任务的全局恢复与目标恢复是不同操作。
4. 查看该目标是否追平，并执行合适的一致性校验。恢复请求被接受、进程存活和 ACK 追平，都不能单独证明业务接管完成。

目标激活失败可能尚未定位任何事务，此时不展示虚假的失败事务序号。旧版本留下的暂停没有可信阶段时显示“未知”。阶段记录损坏时显示诊断不可验证；原事务检查也会拒绝。SQLState相同的激活失败与应用失败不能混为同一种故障。

只读阶段摘要可以通过已有全局任务查询从不同控制入口查看。摘要只包含阶段、序号及故障epoch，不包含事件ID、行值、SQL或连接凭据。权限仍按既有任务查看授权；原始行值不加入普通任务状态接口。首次准备和快照阶段已增加专用诊断；旧记录仍可能未知，源任务诊断在任务级单独显示。真实故障验证见[快照证据](/docs/zh/start/verification.html)。

[故障恢复的已验证范围](/docs/zh/start/verification.html)

## 按目标产品选择恢复方式

管理界面的 **连接器能力** 显示各目标的恢复方式。`GET /api/capabilities` 在目标条目中返回 `transactionSkip`、`transactionCompensation`、`failureReceiptReview`、`gapNotification` 和 `rebuildMode`。

| 目标 | 事务跳过与补偿 | 重建 |
|---|---|---|
| PostgreSQL、MySQL | 审阅完整故障事务后，可使用本地事务跳过或前镜像补偿。须满足相应的暂停、围栏和证据条件。 | 人工规划新基线及空目标。 |
| 其他可选目标 | 恢复原连接、结构或消息历史，再重试原事件。事务跳过和补偿不可用。 | 原历史无法恢复时，人工规划新基线。 |
| 规划中的目标 | 不可用 | 不可用 |

`MANUAL_NEW_BASELINE` 表示由操作人员规划的新基线工作。完成新基线核验前，保留原日志、目标回执和证据。恢复操作使用现有目标身份及断点。

### 核对目标的前序回执

暂停任务，在失败的 ClickHouse、Doris、Hive、ActiveMQ Artemis、ActiveMQ Classic、RocketMQ、Redis Streams、NATS JetStream 或 Pulsar 订阅上选择 **核对目标回执**。核对需要完整的失败增量事务及已确认的前序记录，检查原目标资源及确切的原生 COMMIT 回执。若位置指向未完成的后续批次或旧快照回执，会明确拒绝。核对保留原失败事务和各订阅位点。

调用 `POST /api/tasks/<task>/destination-receipt`，请求体传入 `expectedRevision`、`subscriptionId` 和 `errorGeneration`。授权管理员可以从任一管理入口核对。命令行对应 `java -jar rivomesh.jar review-destination-receipt config.yml <目标> <错误代次>`。

Classic 独立保留的回执同时绑定最后一条事件摘要和整批摘要。旧回执可继续普通业务同步，下一笔 COMMIT 确认后即可进行精确故障核对。Artemis 浏览原非破坏性队列，RocketMQ 按原提交日志位点读取，两者都不会提交消费位点。接口只返回核对范围与摘要。

Redis Streams 用 `XRANGE` 查询保存的条目 ID。JetStream 读取原序列并校验流创建时间。Pulsar 则通过管理 API 按 Ledger ID 和 Entry ID 读取。核对要求原记录、归属绑定和事件摘要都匹配。使用历史检查点的订阅，需先确认一笔新的 COMMIT 才能取得回执。若该消息已被清理，核对会拒绝。RabbitMQ 的 quorum 或 classic 队列在业务消息 ACK 后，需要用保留的消费者凭据手工对账。

未修复缺口、待办跳过审阅和滞后目标都可能使日志在重启后继续保留。回收按各目标最小的已确认序列推进，保留未修复缺口的原始和规范化事务。增量采集达到配额时报告 `JOURNAL_BACKPRESSURE`，证据仍会保留。Kafka 通知记录故障，原同步位点保持不变。[Kafka 审批与恢复](/docs/zh/reference/messaging-v3.html#审批并发送缺口通知)

## 源任务故障阶段

采集受阻时，任务详情显示 `error_stage`、错误代次和上一次有效 GTID。出错前无法打开日志时，Worker 上报只读运行观察。目标的事务重试、补偿和跳过入口继续根据可复核的目标证据显示。

| 阶段 | 建议操作 |
|---|---|
| 源连接、表发现、读取 binlog | 检查可用主库、权限和所需 GTID 历史。源连接恢复后，查看采集是否继续。 |
| 源快照 | 检查源读权限及快照锁，核对分块和基准位置。 |
| 解码 | 保留原 binlog，检查行镜像和事件兼容性。无法证明事务范围时，恢复所需日志、使用含有所需历史的合格源，或建立新基线。 |
| DDL、事务规范化 | 核对历史结构、字段类型及失败事务，再审阅结构处理方案。 |
| 日志存储、投递确认 | 恢复日志访问及容量，核对目标库提交凭据、日志 ACK 与采集位置。 |

## 内部事务检查的边界

`Journal.inspectFailure(subscription, expectedErrorGeneration, maximumBytes)`只读已暂停订阅的下一完整事务。读取绑定日志世代、当前epoch、配置指纹、错误版本及ACK，校验原始与已存在规范化内容的摘要；不会连接或激活业务目标，不会生成缺失的规范化内容、改变无主键身份或推进ACK。没有完整事务时明确拒绝，不根据后续事件猜测边界。

原始与规范化负载共享最多4MiB的读取预算；诊断记录另有16KiB上限。存储长度检查和有界字符流共同阻止超限，UTF-8按字节复核。尚未消耗的规范化预留空间可能使保守长度检查提前拒绝。超限不返回可批准的部分事务；大型事务的流式审阅仍待实现。

这是底层检查接口，不是管理员执行计划；管理端另经[持久创建、授权及审计](/docs/zh/reference/failure-review.html)开放。返回对象本身不具备持久授权/批准效力。暂停ACK会保留当前日志；恢复后可能回收，所以不能把内存对象当成长期证据。界面使用已保存证据；目标已提交而日志 ACK 缺失时，使用[提交确认流程](/docs/zh/reference/commit-acknowledgement.html)。经明确审批的[事务跳过](/docs/zh/reference/transaction-skip.html)会为指定目标记录缺口。结构准备/快照失败不能当作下一条失败增量事务读取，会明确拒绝。

## 常见问题

**能像 MySQL 从库一样跳过一条错误吗？** 在支持的目标上使用[受控事务跳过](/docs/zh/reference/transaction-skip.html)。跳过以完整事务为单位，记录目标凭据和持久缺口。修改 ACK、GTID 或删除日志会损坏恢复依赖的历史。

**目标可能已经提交，网络却报错怎么办？** 自动投递会核对目标断点、完整事务ID和目标投影摘要，再补日志ACK。无法确认时停止/重试，不把它视为可跳过的未提交事务。人工补偿也必须先完成这个核对。

**修改源库数据能修复旧错误事务吗？** 后续源更新是新事务，不会改写已持久化的旧事件。修复目标上的失败条件后再重试。需要按历史镜像恢复目标行时，先[生成补偿预览](/docs/zh/reference/transaction-compensation.html)并核对目标当前状态。

**重启会清除错误吗？** 不会。暂停、错误版本和阶段记录持久化；重启仍需要显式恢复。另一个目标可以继续投递，但失败目标会保留日志并消耗容量。

**阶段未知可以直接按应用错误处理吗？** 不可以。没有阶段的旧记录、阶段证据损坏或源采集/解码失败都不构成已知可跳过事务。先检查原日志、源保留范围和历史配置。

**binlog已被清理或无法解码怎么办？** 不能用目标恢复按钮补造源历史。应恢复所需日志、选择包含所需历史的合格源，或按新基线计划重建。指定 MySQL 档案的事务排除见[采集端故障恢复](/docs/zh/reference/capture-recovery.html)。

**可以直接在目标库补数据吗？** 现有同步假设目标由同步服务独占写入。无计划手工修改可能影响约束、无主键内部身份和后续重放。需要在暂停期间修正特定行时，使用[类型化修正](/docs/zh/reference/manual-correction.html)审批执行。
