---
kind: docs
locale: zh
title: "消息目标与投递协议"
sourcePath: docs/zh-CN/messaging-v3.md
---

# 消息队列目标：配置、消费与恢复

English: [Messaging targets](/docs/en/reference/messaging-v3.html)。配置示例：[messaging-v3.yml](/files/config/messaging-v3.yml)。通用源、日志和多目标操作见 [V3 手册](/docs/zh/reference/pipeline-v3.html)。

## 实现范围

V3 的消息目标目前覆盖 Kafka、Pulsar、RabbitMQ、RocketMQ、ActiveMQ Classic、Artemis、Redis Streams 和 NATS JetStream。每个目标有独立投递线程、投递和快照断点、故障版本，可与多个 SQL 目标并行运行。一个目标阻塞时，其他目标继续投递。日志回收由全部订阅共同决定。

消息目标使用 **Broker 确认后的至少一次投递**。Broker 与日志数据库之间没有共同事务：消息已接收、确认丢失，或者确认后服务还没写下回执就崩溃，均可能重复。事件 ID 和内容在重放时保持稳定；消费者必须持久去重。目标断点表示 Broker 已确认，不表示业务消费者已经完成处理。不要以此断点直接判断业务接管已就绪。

## 配置与界面

新建 V3 任务时选择对应消息产品，逐个源 database 填写消息命名空间；可添加其他消息或数据库目标。界面提供 Topic、Stream、Kafka 认证协议/SASL 机制、令牌、副本数和消息上限，预览遮蔽密码/令牌，保存后仍需检查和启动。多地址、高级部署通过 YAML 导入。命名空间只能使用字母开头的字母、数字和下划线，最多 63 个字符。

`url` 和 `messaging.endpoints` 不允许内嵌用户信息或查询参数。用户名/密码使用独立字段；NATS 可以选择 `messaging.token`。密码/令牌可引用 `${ENV_NAME}`，不放入事件或状态响应。检查只建立连接/查询能力，不创建队列、Stream 或复制连接。

| 参数 | 作用 |
|---|---|
| `messaging.autoCreate` | 首次发布前创建资源；false 要求运维先创建。已经初始化的资源消失时不自动重建 |
| `replicas` | Kafka/NATS 副本数、Redis 总副本数（含主节点）；Rabbit quorum 队列首次创建成员数，不是自动添加 Broker 节点 |
| `maxMessageBytes` | 完整 JSON 包络 UTF-8 字节上限，默认 1 MiB；还需满足 Broker 实际限制 |
| `connectTimeoutMillis` / `requestTimeoutMillis` | 连接、发布确认/管理请求超时，范围 100–120000 毫秒 |
| `endpoints` | 同一 Broker 集群的额外入口；不能把独立 Broker 集群作为故障替换地址 |
| Kafka `topic` | 此目标订阅的专用 Topic，所有映射库/表共用，避免海量表各建 Topic |
| Kafka `securityProtocol` / `saslMechanism` | PLAINTEXT、SSL、SASL_PLAINTEXT、SASL_SSL；SASL 支持 PLAIN、SCRAM-SHA-256/512 |

Rabbit 默认虚拟主机 `/` 使用 `amqp://host:5672` 或 `amqp://host:5672/%2f`。`amqp://host:5672/` 按 AMQP URI 规范表示空名字虚拟主机，通常不存在。额外入口必须使用相同协议和虚拟主机。`amqps://`、NATS `tls://` 使用 JVM 信任配置；当前只提供用户名/密码或令牌认证，NKey/JWT 文件、完整证书向导和 TLS 实测矩阵仍待完成。

## 资源与发布协议

每个命名空间使用 `namespace.__schema`、`namespace.__transactions`，以及 `namespace.table`。表名包含路由语法、长度过长，或者以 `__`/`_rm_` 开头时，表通道改为 `_rm_` 加表 ID 的 SHA-256；包络中的 `tableId` 和 schema 仍保留原始数据库/表名。不要把保留控制通道当作业务表。

Kafka 将这些逻辑通道合并写入 `messaging.topic`，用 `rivomesh_channel` header 保留通道名。当前要求专用单分区 Topic，固定 acks=all、enable.idempotence=true、max.in.flight=1；不是 Kafka 原生事务生产者，仍采用上述至少一次契约。副本数为配置值，min.insync.replicas 为 `replicas/2+1`，关闭 unclean leader election，retention.ms/bytes 为 -1，cleanup.policy=delete。消费者需自行规划归档/保留，不能随意启用压缩淘汰历史。增加分区或改保留策略需要新计划；单分区吞吐有硬件上限，不承诺任意横向扩容。

Kafka 所有 Broker 必须关闭 `auto.create.topics.enable`；服务可用 Admin API 显式首次建 Topic。否则误删 Topic 可能被生产者的元数据刷新自动建空，掩盖缺失历史。服务检查所有 Broker 的该配置，需相应 DescribeConfigs 权限；Topic 还需 Describe/DescribeConfigs/Write，首次创建需 Create。已有 Topic 的副本、ISR、大小和保留属性不符时阻断，不直接修改。Kafka clusterId 首次绑定到持久日志，重连到不同集群报 `BROKER_IDENTITY_CHANGED`，不能将独立集群当作普通备用地址。

副本数为 3 时，分别核对数据分区的 ISR 和 KRaft Controller 多数派。Rivomesh 的 Topic 要求最小 ISR 为 2，并使用 `acks=all`。两个 Controller 可以提交集群元数据，同一时刻某个 Topic 可能只剩一个同步数据副本。用 `kafka-topics.sh --bootstrap-server <broker>:9092 --describe --topic <topic>` 查看分区 Leader 和 ISR，用 `kafka-metadata-quorum.sh --bootstrap-server <broker>:9092 describe --status` 查看 KRaft 元数据状态。若 `KAFKA_RETRY` 时发布回执停住且 ISR 不足，恢复原 Broker 存储并等待分区恢复 ISR。重投时沿用原事件 ID。[Kafka KRaft 手册](https://kafka.apache.org/39/operations/kraft/) · [Kafka 3.9.2 最小 ISR 语义](https://kafka.apache.org/39/javadoc/constant-values.html#org.apache.kafka.common.config.TopicConfig.MIN_IN_SYNC_REPLICAS_DOC)

消费者先持久暂存事件字节和 ID，再提交消费组位点。Kafka 提交的值是下一条记录的位点。消费位点与 Rivomesh 发布回执分别记录，重放时按事件 ID 去重。[Kafka 消费位点 API](https://kafka.apache.org/39/javadoc/org/apache/kafka/clients/consumer/KafkaConsumer.html)

[Kafka 实库夹具](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/kafka-cluster-run.py) 使用 Apache Kafka 3.9.2、三副本单分区 Topic、三个 KRaft 投票节点和一个独立 Broker 来验证数据 ISR 不足的情况。夹具将确定性源事务写入持久 JDBC 日志，使用 Rivomesh 发布包中的传输实现与原生消费组提交。它验收保留原数据卷时的进程故障。源库实库 CDC、TLS、Controller 多数派丢失、存储丢失和吞吐容量需分别验收。

#### 核对失败事务之前的 Kafka 回执

Kafka 因完整增量事务应用失败而暂停后，先暂停整个任务，将目标错误代次传入只读核对命令。

```bash
java -jar rivomesh.jar review-kafka-recovery config.yml kafka 1
```

`PRECEDING_KAFKA_RECEIPTS_VERIFIED` 返回前一笔已确认事务在每个映射命名空间的原生 `COMMIT` 位点和字节摘要。命令使用无消费组的只读已提交消费者，最多检查最后 512 个分区位点，核对已绑定集群、本次读取的 Topic 身份和稳定分区范围，并在结束时重读日志。缺少回执，或看到后续事务的 `BEGIN`/`COMMIT` 时拒绝核对成功。返回的 Topic UUID 摘要对应这次读取，原日志的传输绑定保存的是 Kafka 集群身份。

核对结果用于审阅前一笔已确认事务的回执。日志暂停后，仍需核实可能在途的 Kafka 生产者。发布持久缺口通知需要独立审批操作及 Broker 围栏。此命令保留原事件、Broker 记录、消费位点和日志确认。可用 `tests/kafka-cluster-run.py --only-recovery-review` 复现实库核对。

在共享管理模式下，给运行同一发行版本的 Controller 和 Agent 启用 `cluster.recoveryReview`。有权管理该任务及所属 Agent 的管理员可暂停整条任务，然后在暂停的 Kafka 目标上点击 **核对 Kafka 回执**。任务历史会显示完成状态，点击 **查看回执** 可查看位点和摘要。请求离开近期列表或 Agent 离线后，仍可 **按请求 ID 查询回执**。

API 调用方以稳定的 `X-Request-ID` 调用 `POST /api/tasks/<task>/actions`，请求体为 `{"action":"REVIEW_KAFKA_RECEIPTS","expectedRevision":"<当前任务修订号>","subscriptionId":"kafka","errorCount":1}`。HTTP 202 表示控制面已接收请求并等待所属 Agent 处理。轮询 `GET /api/tasks/<task>/recovery-receipts/<request>` 获取结果。成功时 `kafkaReview` 包含观测的任务代次、错误代次、事务序号和摘要。`KAFKA_RECOVERY_PUBLICATION_UNCERTAIN` 表示投递状态无法确认，回执不包含已核对的位点。再次核对请使用新请求 ID 和当前修订号。回执记录的是当时的观测，跳过或重放失败事务需要另行审批。

可用 `tests/kafka-cluster-run.py --only-managed-recovery-review` 在四个真实 KRaft Broker 上验证发行包的 HTTP 管理流程。隔离用例使用两个仅监听环回地址的管理入口和共享 H2 控制库，核验跨入口重试、所属节点离线后查询、拒绝确认部分发布，以及目标进度保持原值。

#### 核对 Kafka 通知计划

管理员可以预览发往预先登记的 Kafka 专用控制 Topic 的故障通知。先在 Kafka 目标的 `messaging` 配置下填写可选的 `recoveryNotice` 并使配置生效，再核对前序回执。

```yaml
messaging:
  topic: sales.events
  recoveryNotice:
    controlTopic: rivomesh.sales.recovery
    clusterSha256: "<KAFKA: 加 Kafka 原生集群 ID 的 SHA-256>"
    topicId: "<Kafka Topic UUID 的原生字符串>"
    reservationId: "<预先登记的 Topic 预留 UUID>"
```

控制 Topic 必须与任务为每个 Kafka 业务目标配置的 Topic 不同，管理面也会按已知 Broker 连接地址检查目标资源冲突。计划会验证专用 Topic 已存在于原 Kafka 集群，满足单分区、至少三个副本、最小 ISR 为多数派、无限期保留和禁用自动创建的要求。已知地址无法证明所有别名或外部写入端所指向的物理资源均独立，发布受阻状态为 `KAFKA_NOTICE_GLOBAL_OWNERSHIP_UNVERIFIED`。

专用 Topic 设置 `cleanup.policy=delete`、`retention.ms=-1`、`retention.bytes=-1`、`unclean.leader.election.enable=false` 和 `remote.storage.enable=false`。`max.message.bytes` 可取 2048 至 65536，`min.insync.replicas` 取配置副本数的多数。所有 Broker 均设置 `auto.create.topics.enable=false`。核对计划时需要读取业务 Topic，并有权查询 Kafka Topic 和 Broker 配置。

暂停整条任务，获得新一次成功的 Kafka 回执核对结果，再从回执窗口选择 **核对 Kafka 通知计划**。API 调用使用 `POST /api/tasks/<task>/kafka-notice-plan`，请求体为 `{"expectedRevision":"<当前任务修订号>","predecessorRequestId":"<成功核对的请求 ID>"}`。所属节点重新核对已认证的前序回执、任务修订号、管理员、原始失败事务和 Topic UUID。响应返回计划与通知内容的确定性摘要，并始终标记 `executionAuthorized: false`。修改配置、迁移所属节点或旧回执缺少原始失败摘要后，请重新核对回执。

可用 `tests/kafka-cluster-run.py --only-managed-notice-plan` 在两个管理入口和真实 Kafka 集群上验证只读计划流程。

### 为新的业务发布保留物理归属证据

在所属 Agent 的启动配置设置 `kafkaPhysicalOwnershipEvidence: true`，即可核对新的 Kafka 业务发布。Agent 在 Worker 启动时检查共享库的生效配置及投影文件，只交给 Worker 在该配置及所属目录下可用的签名密钥。同一生效配置与日志代次下，首个成功核对的 COMMIT 记录 Kafka Topic UUID、Broker 确认偏移和精确内容摘要。发布检查点先暂存证据，成功 ACK 与正式证据在同一个日志库事务提交。

Linux 和 Docker 部署在执行成员的 platform YAML 根级设置此项，然后重启该成员。手工部署 Kubernetes 时，修改 Agent ConfigMap 内的 `platform.yml`，重新应用清单并滚动更新 Agent。Helm 部署在 Agent Release 或运行 Worker 的共享任务组合 Release 中设置 `platform.kafkaPhysicalOwnershipEvidence=true`。

启用后，Worker 在发布前检查收据表及对应的 SQL 权限。有建表权限时，Worker 可补建缺失的收据表。遇到 `KAFKA_PHYSICAL_JOURNAL_NOT_READY` 时，请检查日志库 schema、暂存表的 SELECT、INSERT、DELETE 权限和历史表的 SELECT、INSERT 权限。MySQL 收据表使用 InnoDB 和 utf8mb4_bin 排序规则，PostgreSQL 协议的日志库使用持久普通表。关闭此选项时，现有日志库可继续处理业务 ACK，无需收据表。

共享控制库为签发授权的 Agent 节点、进程实例、租约代次和租约窗口独立签名，证明授权签发时观察到的成员租约。日志库给发布检查点和订阅 ACK 记录 UTC 毫秒并签名，只比较同一日志库的两个时间值。控制库、日志库和 Kafka 的时钟差异无法证明事件先后。两次写入之间如遇日志库时钟回拨，业务 ACK 仍提交，该条 COMMIT 保持缺证。同一配置重启后可在待入库收据中保留原 Agent 见证。早期物理收据缺少新增的成员及时序证明，同一配置后续新观察到的 COMMIT 可以生成新证明。

Kafka 业务身份需要 READ 权限才能回读确认偏移。只有 WRITE 权限时，业务仍正常发布和 ACK，物理归属保持缺证。该配置最多核对 16 个命名空间，读取不可用时，每个 Worker 最多每 30 秒重试一次。证据从记录对应的 ACK 起算，早期写入和未留证的历史配置仍缺证。此流程不回填过去的证据，通知发布仍受阻。

管理员可以通过任一受管入口查询留存的证据。任务仍处于暂停状态时，打开成功的 Kafka 回执核对结果并选择 **查验物理收据**。API 客户端向 `POST /api/tasks/<task>/kafka-physical-receipt` 提交 `{"expectedRevision":"<当前任务修订号>","predecessorRequestId":"<成功的 Kafka 回执核对请求 ID>"}`。所属节点核对当前失败、签名、确切前序 ACK 和 Kafka Topic 的物理标识。`VERIFIED` 返回收据摘要及日志库时间。`MISSING` 表示未留证、签名未核实、物理 Topic 已变化，或旧收据只覆盖较早的 ACK。`UNREACHABLE` 表示所属节点、日志库或 Broker 的读取未完成。任务或失败变化后请刷新前序核对。查询不授予通知发布权限。

Kafka 3.9.2 实库档案使用 TLS/SCRAM-SHA-512，两个 Controller 通过同一个 Agent 查验。重建同名 Topic 会提示缺证。使用 Temurin 21 运行 `python3 tests/kafka-notice-writer-run.py --managed-physical-receipt <应用JAR>` 可复验。[实库证据](/docs/zh/evidence/baseline.html#managed-signed-receipt-queries-with-a-native-kafka-broker)

预览的 `catalogCoverage` 显示受管任务的物理归属。`VERIFIED_SINGLETON` 表示一项任务、一个配置版本和一个 Kafka 目标。目录最多四项任务、八个保留配置版本、十二条 Kafka 路由时，`VERIFIED_AT_REVIEW` 表示已按原生 Kafka 集群 ID 和 Topic UUID 核对每条业务路由，范围包括已停止的任务和配置历史中可回退的版本。由当前所属节点按各版本的配置读取 Broker 元数据。即使连接地址使用不同的别名，只要业务目标和通知 Topic 的物理标识相同，就返回 `CONFLICT`。

超过核对上限、Broker 或所属节点不可达、历史配置无法解析时，归属状态为 `INCOMPLETE`。目录或配置在核对期间变化时，需要重新核对。所属节点先按当前 Worker 的凭据引用授权和受保护环境规则检查历史配置。已撤销的引用会阻止该路由发起探测。核对结果描述当前恢复这些配置会连接到哪里。发布仍需历史物理归属、完整的 Kafka 授权和审批证据，所有预览仍会阻止发布。

所属 Agent 可在私有启动配置中设置 `kafkaNoticeWriters`，核对独立通知写入身份。每项包含 `taskId`、`targetId`、`clusterSha256`、`topicId`、`bootstrapServers`、`username` 和 `password`。凭据引用只交给 Agent，连接地址使用可信的 Kafka `host:port` 列表。任务使用其他别名时，独立身份仍连接 Controller 配置的地址。两个身份的用户名和密码均须不同。两个会话都使用 Kafka 目标的 SCRAM 机制，经 `SASL_SSL` 和 Agent JVM 信任的 CA 校验证书与主机名。

预览的 `writerEntitlement` 来自 Broker 返回的有效权限。业务身份须能读取两个 Topic 的元数据，且对通知 Topic 只有只读权限。独立身份在通知 Topic 需要 `WRITE` 及其隐含的 `DESCRIBE`，对该业务 Topic 至少要有 `DESCRIBE`，且不能修改它。两个身份均须取得 Broker 的有效操作列表。可用 `python3 tests/kafka-notice-writer-run.py <应用包>` 验证该权限规则。核对结果适用于当前身份和 Topic，发布仍需完整的管理目录、Broker 授权证据与审批后的事务发送流程。

### 为新任务登记首次发送证据

对含 Kafka 目标且使用 `LOCAL` 日志的新任务，在通过共享管理入口创建前，于任务 YAML 根级设置 `kafkaHistoryFromFirstSend: true`。启动前还要在所属 Agent 启用 `kafkaPhysicalOwnershipEvidence`。独立运行、外部日志以及给既有任务修改登记开关均会被拒绝。

任务创建时，共享控制库签署初始配置和分配的日志代次。首个 Worker 启动前，Agent 在本地一笔事务内写入任务、订阅、同一起点和空的首次发送记录，然后重新核对 Agent 租约和生效配置，才在控制库标记起点就绪。重启会校验原日志及代次。请同时保全所属 Agent 的数据目录和控制库备份。若已就绪任务的日志缺失或签名校验失败，应停止并检查原始存储。通过重启无法为替换日志重新登记同一起点。

每个 Kafka 订阅的首批业务消息实际发送前，日志提交一条带签名的摘要，绑定生效投影、日志代次、订阅、租约代次和首批消息的准确内容，保存的只是摘要及必要元数据。每次结构、快照或增量发送都会核对起点。首次发送失败或结果不明时保留 `UNKNOWN`，普通业务重放或 ACK 成功也不会把它升级为已证。每个订阅只保留首批意图，后续发送和 Broker 内部重试没有逐笔记录。没有配置物理 Topic 时，Produce 按 Topic 名称发送，首批意图本身无法确定完整的历史归属。恢复独立备份时应协调控制库与本地日志的时间点。

### 为新任务绑定物理 Topic

启用审批发送前，先创建各个业务 Topic，再创建托管任务。每个 Kafka 目标都要指定以下配置，并补充常规连接地址、凭据、映射和 Topic 策略。

```yaml
kafkaHistoryFromFirstSend: true
targets:
  - id: orders-kafka
    product: KAFKA
    messaging:
      autoCreate: false
      securityProtocol: SASL_SSL
      saslMechanism: SCRAM-SHA-512
      topic: orders.events
      physicalTopic:
        clusterSha256: "<将 KAFKA: 与原生集群 ID 拼接后计算 SHA-256>"
        topicId: "<业务 Topic 的原生 UUID>"
```

从 Kafka Topic 描述和集群管理接口获取原生标识。托管任务把这些路由与初始配置和日志代次一起签名。Worker 用 Produce v13 按指定 UUID 发送结构、全量和增量数据，并逐目标逐配置保存最近一次已确认 COMMIT 的位点及摘要。管理员审阅故障时，所属 Agent 读回确切的 Kafka 原生记录。更换 UUID 需要新建登记任务并审核迁移。历史上曾按名称发送的配置仍会阻断完整历史审批。 [Kafka 4.1 协议](https://kafka.apache.org/41/design/protocol/)

审批发送需要 Kafka 4.1 或更新版本，并启用事务版本 2。应用包内的通知传输使用隔离的 Kafka 4.1.2 SDK。普通按名称同步使用独立的 Kafka 3.9.2 SDK。故障切换后检查管理接口返回的原生标识。同名重建会产生新 UUID，应先确定恢复方案。

在任务所属 Agent 配置通知写入身份。业务身份需要集群级 `DESCRIBE`，用来核对匹配控制 Topic 的权限。通知身份需要该 Topic 名称的精确 `WRITE` 授权，以及其负责通知所用 `rivomesh-kafka-notice-` 事务标识的权限。Kafka 超级管理员仍由 Broker 运维管控。专用控制 Topic 应隔离其他业务写入方。发送前检查覆盖匹配字面名称、通配符和前缀的授权。 [Kafka 授权](https://kafka.apache.org/41/security/authorization-and-acls/)

### 审批并发送缺口通知

暂停任务，在已完成的 Kafka 回执审阅中预览失败订阅。管理目录通过完整路由核对时，选择 **登记审批**。历史归属不完整时可以 **登记条件审批**。记录封存本次故障、审批人、配置修订、控制 Topic UUID、路由摘要和通知内容。配置、写入权限或物理 Topic 变化后应重新预览和审批。

API 调用使用 `POST /api/tasks/<task>/kafka-notice-approvals`，携带固定的 `X-Request-ID`，请求体包含 `expectedRevision`、`predecessorRequestId` 和 `approvalScopeSha256`。条件齐备返回 `RECORDED`，缺证时返回 `RECORDED_BLOCKED`，两种响应均含 `executionAuthorized: false`。

原审批人选择 **核对发送条件**，也可调用 `POST /api/tasks/<task>/kafka-notice-approvals/<request-id>/preflight` 并提交 `expectedRevision` 和 `approvalScopeSha256`。服务重新核对原审批、审计记录、路由、写入权限和故障前最近一笔 ACK。返回 `SENDER_READY` 后可选择 **发送缺口通知**。受阻时界面显示缺失证据或 Broker 条件。

发送接口使用 `POST /api/tasks/<task>/kafka-notice-approvals/<request-id>/dispatch`，保留上述两个字段，并分配新的固定 `X-Request-ID`。两个管理入口都能通过 `GET /api/tasks/<task>/recovery-receipts/<dispatch-request-id>` 查看进度。HTTP 响应丢失时沿用原发送请求 ID。结果不明时保留原发送记录，所属 Agent 核对 Kafka 原生回执后再确认。通知成功记录物理 Topic、原生位点及内容摘要，发送期间保留原失败事务、两路订阅 ACK、业务 Topic 和消费者位点。

所属 Agent 在 Kafka 提交前中断时，事务日志保留待确认的确切位点。只有 Broker 确认事务已中止且原消息仍可核对时才会补发。提交响应丢失时，Agent 从原位点找回已提交通知及回执。控制 Topic 缺失或更换时，操作保持待确认。

Temurin 21 下的五项实测覆盖分区 Leader 强杀后选主、ISR 只剩一个时元数据仍可提交且发布回执停在序列 2，以及恢复 Broker 后复用原事务续传到序列 3。消费者从位点 7 重开，暂存六条待处理记录并提交到 13。新消费者确认没有剩余记录，13 条原始事件正文仍可读取。

```sh
python3 tests/kafka-cluster-run.py --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --java-home "$JAVA_HOME" --output target/kafka-cluster-proof
```

Rabbit 每个通道对应一个 durable、非独占、非自动删除队列，通过默认交换机直接路由。消息为 persistent，开启 publisher confirms 和 mandatory/return；无路由或 nack 不会推进回执。默认 quorum，可显式选 classic。创建时设置 overflow 为 reject-publish；部署策略不能静默改为丢弃旧消息、过期或将超投递消息丢到无法处理的死信。生产 quorum 应部署多个节点并设置副本数；单节点测试不证明集群多数丢失或机房断电的持久性。

RabbitMQ 三节点部署应在首次建队列前配置 `messaging.queueType: quorum` 和 `messaging.replicas: 3`。一个节点作为 `url`，另外两个放入 `messaging.endpoints`。入口属于同一集群，使用同一虚拟主机和 TLS 模式。副本配置是首次声明的大小，用 `rabbitmqctl list_queues -p / name type durable leader members online` 核对实际成员、在线成员和 Leader。Quorum 队列的发布确认取决于可用多数派。[RabbitMQ Quorum 队列](https://www.rabbitmq.com/docs/4.1/quorum-queues) · [发布确认](https://www.rabbitmq.com/docs/4.1/confirms)

Leader 故障且多数派仍在线时，RabbitMQ 重新选主，Rivomesh 通过剩余入口重连。多数派失联时保留原数据卷和策略。先启动一个原副本并确认多数派已恢复，再启动下一个。RabbitMQ 4.1.4 夹具曾在同时启动两个故障节点时遇到 Mnesia 启动错误。在另一节点就绪后重试启动失败节点，三个原成员全部恢复。[RabbitMQ 可靠性](https://www.rabbitmq.com/docs/4.1/reliability)

Broker 确认后推进发布回执。消费者在 ACK 前持久暂存原事件 ID 和消息字节，重投时跨连接按事件 ID 去重。实测收到 19 次投递，共 18 个不同事件 ID。重复投递与原字节一致，本地暂存后的手动 ACK 清空了三个队列。消费 ACK 与业务处理断点应分别核对。[RabbitMQ 消费确认](https://www.rabbitmq.com/docs/4.1/confirms)

可用冻结的发布 JAR、Python 3.11 或更高版本及本地 Temurin 21 JDK 运行隔离档案。夹具将宿主机 AMQP 端口绑定在本机回环接口，检查 Broker 进程故障、源 GTID、Broker 发布回执、消费者原始字节和手动 ACK。TLS、存储丢失、性能和消费者业务事务需另行验收。[实库夹具](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/rabbit-quorum-run.py)

```sh
python3 tests/rabbit-quorum-run.py --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --java-home "$JAVA_HOME" --output target/rabbit-quorum-proof
```

NATS 使用 JetStream 发布确认和 `Nats-Msg-Id`。不使用易失 Core NATS。Stream 要求 File 存储、Limits 保留、Discard New、无消息年龄过期、精确的 `namespace.*` subjects，以及配置的副本数。Stream description 绑定 pipeline/subscription/generation，发现不符不会改写既有资源。有限容量满时拒绝新发布；需要恢复容量后重试，不静默覆盖未消费历史。服务不会自动清理消费者历史，请制定容量、归档和消费进度策略。Broker fsync、复制和底层磁盘决定掉电保证。

NATS 2.11.8 三节点档案要求主地址和各备用地址均使用 `tls://`，配置 `messaging.replicas: 3`，在 JVM 信任库中加入 Broker CA。客户端根据证书核验地址名，并按显式配置连接。实测覆盖 Leader 停止、失去多数派时拒绝确认、恢复后使用原事件 ID 重试。Broker 节点间路由加密和双向 TLS 另行验收。[JetStream 集群](https://docs.nats.io/learn/topologies/jetstream-in-a-cluster) · [验收记录](/docs/zh/evidence/baseline.html#nats-jetstream-tls-and-quorum)

已有 Stream 可用 `autoCreate: false`，但仍须匹配上述属性和绑定。绑定值为 `rivomesh:` 加 `SHA-256(pipelineId + ':' + subscriptionId + ':' + generation)`；generation 从已初始化的只读状态获取。未初始化任务推荐由服务首次创建，不要猜测 generation。

### Redis Streams

首个 Redis 档案支持 **Redis 7.2 及以上的直连独立主节点**。使用 `redis://host:6379/0` 或 `rediss://host:6379/0`、数据库编号、独立 ACL 用户名/密码和 `messaging.stream`。本档案尚不支持额外入口、Sentinel、Cluster 路由或代理故障切换。`rediss` 使用 JVM 信任配置校验服务端主机名。

全部逻辑通道合并到一个物理 Stream。每条记录含 `body`、`rivomesh_event_id`、`rivomesh_channel`、可选 `rivomesh_key` 及传输 header。Redis 自动生成的 entry ID 只是传输位置，不是事件身份或 MySQL 顺序；消费者仍需按包络持久暂存和去重。保留消费者组 `_rivomesh_stream_marker_v1` 用于创建空 Stream，避免塞入伪业务记录；它不是消费者业务断点。

准备阶段要求 AOF 开启、`maxmemory-policy=noeviction`、Stream 和所有权键均无 TTL，并且入口为可写非集群主节点。`_rivomesh_publication_owners_v1` 按 Stream 绑定目标订阅；已有无绑定 Stream 需要接管计划，其他订阅占用时拒绝写入。已初始化资源消失时不自动建空继续；在线期间使用 `XADD NOMKSTREAM` 避免误删后被自动重建。管理员不能随意清空、裁剪或设置过期；同名替换或恢复旧备份仍需对账。

每批 `XADD` 后在 **同一物理连接** 执行 WAITAOF，必须确认返回的本地 fsync 数 >=1、从节点 fsync 数 >=`replicas-1`；请求返回或超时本身不能算确认。Socket factory 禁止 SDK 重新打开连接；重试必须构造新客户端并重新认证、选择配置的数据库，避免写入默认数据库 0。发布前后再核对 server run ID 和 client ID，拒绝客户端隐式换连接产生的错误确认。AOF 写入故障、副本不足、noeviction 下 OOM 或断连均保留回执并重试。`replicas: 1` 仅确认本地 AOF，不具有 Redis 故障切换持久性保证；更大值要求实际存在对应数量、开启 AOF 的从节点，不会自动部署复制，也不证明提升任意从库都不丢数据。RDB 单独持久化和易失 Pub/Sub 不能代替此协议。

发布账号需要连接/认证/SELECT（适用时）、INFO、CONFIG GET maxmemory-policy、CLIENT ID、EXISTS/TYPE/PTTL、HGET/HSETNX、XGROUP CREATE、XADD、WAITAOF 权限，并将键权限限制到选定 Stream 与所有权 hash。消费者另配读取/消费者组权限。`check` 只读能力，不创建键。WAITAOF/fsync 会影响延迟，需要按实际磁盘与复制拓扑测量。服务不自动裁剪 Stream，容量和消费者安全归档需要单独规划。

直连主库档案可使用运维系统管理的固定入口。提升原 AOF 副本前先隔离故障主库，并对照保留的确认位点核查原 Stream 记录、归属及消费者组状态。把现有入口指向已提升的副本，再恢复足够的 AOF 副本满足 `replicas`。配置 `replicas: 2` 时，第二份 fsync 未确认会保持发布回执不动。此前本地 `XADD` 仍可能可见，消费者应按事件 ID 去重，等齐事务 COMMIT 和所需行数后处理。[WAITAOF](https://redis.io/docs/latest/commands/waitaof/) · [REPLICAOF](https://redis.io/docs/latest/commands/replicaof/)

先持久暂存原事件和流条目 ID，再执行 `XACK`。消费确认也要落到 AOF 副本时，在 `XACK` 后用同一连接调用 `WAITAOF`，核对本地及副本数。使用 `XAUTOCLAIM` 认领失联消费者的待确认条目，再读取新记录。空闲阈值应考虑正常消费者完成处理所需的时间。[Redis Streams 复制](https://redis.io/docs/latest/develop/data-types/streams/) · [XAUTOCLAIM](https://redis.io/docs/latest/commands/xautoclaim/)

[Redis 实库夹具](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/redis-promotion-run.py) 使用 Redis 7.4.2、Temurin 21 和写入发布包 JDBC 日志的确定性源事务，验收运维提升、副本 fsync 暂缺及恢复、原字节重投、消费者 ACK 和待确认条目恢复，以及使用提升节点原 AOF 卷冷重启。Sentinel、Redis Cluster、跨节点 TLS 复制和已确认存储本身丢失需分别验收。

Redis 8.0.2 私有 CA 档案在 Temurin 21 验证主机名、限定 ACL 账号和 DB 2。未受信的 CA、证书未覆盖的主机名和错误账号密码均未创建键。AOF 冷重启保留原 Stream ID 和快照，发布器续传到 ACK 2。使用本机 Redis 7.2 及以上和 OpenSSL 执行 `python3 tests/redis-tls-run.py --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar --java-home "$JAVA_HOME" --output target/redis-tls-proof`。 [验收记录](/files/docs/verification/baseline.json)

六项实库检查中，第二份 fsync 恢复前发布回执停在序列 1，恢复后用原事务推进到序列 2。11 个流条目对应 10 个事件 ID，重复事件的字节一致。此前四条消费确认继续有效，恢复消费者认领了原有三条待确认记录。提升后的主库重启后，原流条目 ID、消费组位点和空待确认列表均保留。

```sh
python3 tests/redis-promotion-run.py --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --java-home "$JAVA_HOME" --output target/redis-promotion-proof
```

### Pulsar

Pulsar 为全部映射命名空间使用一个 **persistent、非分区专用 Topic**。配置 `url: pulsar://host:6650`、`messaging.adminUrl: http://host:8080`、`cluster` 和 `topic: persistent://tenant/namespace/topic`。tenant/namespace 必须已经存在，且只属于配置的集群；跨地域复制需要单独计划。首个档案使用一个服务入口和原生 Broker 发现，拒绝额外 `endpoints` 和用户名/密码认证；令牌使用 `messaging.token`。TLS 要求同时使用 `pulsar+ssl://` 和 HTTPS 管理入口，并验证主机名。单 Broker 的令牌和 TLS 档案已核验 CA、主机名、认证和重启后的消息历史。另有两 Broker、三 BookKeeper 恢复档案。部署需提供故障后仍可访问的服务和管理入口，并让 Worker 可以访问 Broker 发现返回的地址。

使用私有 CA 时，把 PEM 证书包挂载到 Worker 和执行检查的 Agent。在 `messaging.tlsTrustCertsFilePath` 填写绝对路径，数据连接和 HTTPS 管理连接共用同一 CA。Broker 公布的主机名须在相应证书的 SAN 中。Token 需要当前资源创建策略所用的集群、命名空间和 Topic 权限。 [Pulsar TLS](https://pulsar.apache.org/docs/4.0.x/security-tls-transport/) · [Pulsar Token 认证](https://pulsar.apache.org/docs/4.0.x/security-token-admin/)

```yaml
url: pulsar+ssl://pulsar.example:6651
messaging:
  adminUrl: https://pulsar.example:8443
  cluster: pulsar-production
  topic: persistent://tenant/namespace/rivomesh-events
  token: ${RIVOMESH_PULSAR_TOKEN}
  tlsTrustCertsFilePath: /run/secrets/pulsar-ca.pem
```


所有活动 Broker 必须关闭自动建 Topic、关闭闲置 Topic 删除并启用 Topic 级策略；命名空间覆盖策略不能重新允许自动创建。服务通过各 Broker 广播的管理入口读取配置，因此除 Topic 操作外，还需要集群/Broker/命名空间的管理读取权限。原生客户端重连不能误删后自动建空。同步期间应限制管理员修改保留策略；存在性/所有权检查不能发现所有清空或旧备份回退。

首次创建时原子写入 `rivomesh.owner`（通用 pipeline/subscription/generation 绑定）与 `rivomesh.provision=BUILDING_V1`。仅对这个未完成、属于当前订阅的 Topic 设置策略：时间/大小均无限保留、TTL 0、禁止闲置删除、BookKeeper 持久化，以及拒绝生产者而不淘汰消费者历史的积压策略。确认实际生效后才标记 `READY_V1` 并创建生产者。策略异步传播时自动重试，尚不发布业务事件。已有 READY 策略不符、无所有权或其他订阅占用时需要计划，不直接覆盖。`autoCreate: false` 预建资源必须具备正确绑定、READY_V1 与全部策略；已初始化 Topic 丢失时不建空替代。

此档案的 `replicas` 表示 **BookKeeper 最少 ACK 副本数**。新 Topic 的 ensemble/write/ACK quorum 都设置为该值；已有兼容 Topic 可以使用更大的 ensemble/write quorum，但 ACK quorum 不能低于配置下限。它不会部署 bookie、Broker 副本或故障域。确认依赖 BookKeeper 的持久 journal、复制配置及可恢复元数据；单 bookie 测试不是生产高可用或断电保证。无限保留需要规划容量、归档和消费者安全清理。

本机故障夹具使用 Pulsar 4.0.14、两个活动 Broker、三个 BookKeeper 节点和一个 ZooKeeper 节点。验收核对原 Topic 绑定及 2/2/2 的集合、写入和确认策略。服务 Topic 的 Broker 退出后，发布端可通过幸存服务入口重新打开原 Topic。消息写入端在发布未确认时关闭旧连接，并用新连接重试相同事件。两个 bookie 离线时，需要两份确认的发布保持未确认。原 bookie 使用各自的持久卷恢复后，传输端打开原 Topic，并重试同一个稳定事件 ID。消费者应按事件 ID 去重。此档案使用隔离明文网络。安全集群档案同时验证 Broker TLS、Token 与三节点元数据多数派。存储故障域和负载容量仍需单独验收。 [Pulsar 集群配置](https://pulsar.apache.org/docs/4.0.x/deploy-bare-metal/) · [验收记录](/docs/zh/evidence/baseline.html)

安全夹具使用私有 CA，并分别为两个 Broker 的公布主机名签发证书。两个 Broker 入口均要求 HTTPS、Pulsar TLS 与 Token。终止 ZooKeeper 主节点后，剩余两节点重新选主。传输端随后能创建并确认新的已绑定 Topic，且再次核对原 Topic 的已确认历史。BookKeeper 与 ZooKeeper 内部链路位于本机测试网络，生产内部链路加密和跨主机持久性需独立验证。 [Pulsar TLS](https://pulsar.apache.org/docs/4.0.x/security-tls-transport/) · [ZooKeeper 与 BookKeeper](https://pulsar.apache.org/docs/4.0.x/administration-zk-bk/)

客户端同步发送字节消息，关闭批处理/分片并限制待发送请求数。消息 properties 携带稳定事件 ID、逻辑通道与传输 header，Pulsar key 携带逻辑行/事务键。收到发送确认后才提交日志回执。Pulsar message ID 或 Broker 去重不能代替事件 ID 持久去重和事务暂存；这里不使用 Pulsar 原生事务，更换生产者或源租约接管后仍采用通用至少一次契约。

Rivomesh 固定 Pulsar 客户端 4.0.14，通过 `rivomesh-pulsar-transport` 隔离其日志、加密、Jackson 注解和 protobuf。Worker 使用 Temurin 21。请用 `mvn verify` 构建整个 reactor，使私有 SDK 先完成打包。传输测试将核心 JAR 放在 classpath 最前，验证两套依赖共存，并验证只读检查、所有权、发布/读取、Broker 重启、错误保留策略拒绝及丢失 Topic 保护。完整混合链路恢复单独记录于[验证记录](/docs/zh/reference/validation.html)。

Broker 启动与源事务追平分别测量：故障脚本先确认 Broker 停止时 SQL 继续、消息目标自动重试，再等待 Broker 健康，之后验证无需人工恢复即可追平。管理服务或存储尚在启动时，不能把目标当作已经就绪。诊断码可显示 `PULSAR_ADMIN_HTTP_503` 等安全状态，不向界面复制行数据或凭据。

Pulsar 依据：[Java 基线决策](https://github.com/apache/pulsar/blob/master/pip/pip-421.md)、[Topic 与资源管理](https://pulsar.apache.org/docs/4.0.x/admin-api-topics/)、[保留与 TTL 区别](https://pulsar.apache.org/docs/4.0.x/cookbooks-retention-expiry/)、[Broker 配置 API](https://pulsar.apache.org/docs/4.0.x/admin-api-brokers/)。服务端存储身份与恢复仍需按实际部署验收。

## 包络与消费者规则

`version: 1` 包含 pipeline、subscriptionId、generation、事件 ID、kind、namespace、表/结构版本、源位置和序号。发布事件 ID 包含目标订阅身份，避免不同目标映射混用去重；内部 Change.eventId 仍表示逻辑源事件。单元格值按 schema 类型解释；数值以字符串保持精度，`present: false` 表示字段缺失，`present: true, value: null` 表示 SQL NULL。JSON `null` 是 JSON 文本值，不等于 SQL NULL。

| kind | 含义 |
|---|---|
| `SCHEMA` | 类型、列、身份键和源索引描述；消息目标不执行建表/降级索引 |
| `SNAPSHOT_BEGIN` / `SNAPSHOT_ROW` / `SNAPSHOT_END` | snapshotId、基线、分块、行序号和完整计数；只在 END 与去重后计数一致时完成快照 |
| `BEGIN` / `ROW` / `COMMIT` | 源事务边界、源顺序及前后镜像；COMMIT 在所有发布确认后发送 |

主键更新同时给出 `beforeKey` 和 `afterKey`，消费者应删除旧身份并写入新身份，不能只向新 key upsert。无主键表每个重复行有独立 rowId；删除只针对对应出现，不能按全行去重。快照和增量使用同一出现身份。

事务控制消息包含全局 `totalChanges`、各命名空间的 `expectedChanges`、transactionKind 和源事务 attributes；controls 按原始 ordinal 保留 BARRIER 控制变更。行 ordinal 为这个目标所接收事务内的全局顺序。订阅多个库的消费者应先持久暂存、按事件 ID 去重，等待所有所需行及 COMMIT，按计数/顺序核对后在自己的事务中同时提交业务和消费断点。不同队列/subjects 的消费速度不同，COMMIT 可能先被应用线程看到；看到 COMMIT 本身不能立刻认定行已齐全。

COMMIT 的 contentHash 是规范化、按该目标映射投影后的 `SourceTransaction` 的 `Codec` SHA-256。订阅全部映射的消费者可用 BEGIN 的 id/generation/position/kind/attributes 和有序 ROW.change 重建事务再核对；仅订阅部分命名空间时不能声称验证了整个源事务的 hash。传输 epoch 放在 header 中，不参与不可变正文；消费者需记录 generation/序号，避免迟到旧发布覆盖更新的状态。不要用时间戳代替源顺序。

NATS 去重窗口和 Rabbit 消息 ID 都不能代替消费者持久去重。消费者崩溃后的 ack、重复投递、事务缓存容量、缺失行和长期离线，需要自己的恢复协议；该版本不附带自动运行的消费者物化服务。

Kafka 的幂等生产者也不覆盖更换生产者实例后的全部重放。Broker offset 不是源序号；旧 owner 的迟到发布需要按 generation、epoch、逻辑序号及事件 ID 处理，不能只按物理 offset 覆盖业务状态。仅消费一个命名空间时，先按包络过滤，再核对该命名空间 expectedChanges。

## 故障处理与 FAQ

**网络断开或 Broker 重启怎么办？** 连接失败/可重试错误保留断点并重连，重新验证已存在资源后重放未确认事务。不可恢复的权限、路由或属性错误暂停该目标，其他目标继续；在界面修复后“恢复此目标”会使用独立错误版本重试原事务。

**队列/Stream 丢失可以建空继续吗？** 不能从旧断点这么做。`MESSAGE_DESTINATION_MISSING_REBUILD_REQUIRED` 要求恢复原 Broker 存储，或制定包含下游消费状态、缺失历史和新全量的重建计划。直接重建空资源再按“恢复”不能证明历史完整。管理员删除消息/清空后用同名资源替换、修改 Broker 策略，无法只靠存在性检测发现；必须对账。

**是否支持跨目标原子提交？** 每个目标独立确认。某目标已成功时另一个可能失败，没有跨数据库/Broker 分布式事务保证。源历史会为落后目标保留，直到各自成功；日志配额满会阻止继续采集，不能丢弃落后目标的数据。

**暂停后是否可以切业务？** 消息目标返回 `UNCONFIRMED_IN_FLIGHT_PUBLICATION`，因为日志 epoch 不能撤回已经发出的 Broker 请求。还需要停止/隔离旧发布者、消费者追平屏障、消费对账和业务写入隔离。自动切换流程仍在开发中。

**大消息怎么办？** 超出上限报 `MESSAGE_TOO_LARGE`，不推进该事务。调整服务和 Broker 上限并考虑消费者内存；目前没有透明分片/LOB 外置。超大源事务、全目录内存和回执增长仍属于资源扩展工作，不应宣称无硬件上限。

**Redis 一直没有确认怎么办？** 检查 AOF 状态、所需从节点的 AOF fsync、复制延迟、磁盘及 ACL。`REDIS_DURABILITY_NOT_CONFIRMED`、`REDIS_CONNECTION_CHANGED_DURING_CONFIRM` 表示投递未确认、可重放，即使 XADD 已到达服务端。修复根因，不删除历史或随意降低运行中任务的持久性配置。界面的“源快照行数”只表示源快照准备，各目标确认数单独显示，消息目标确认仍不表示消费者完成。

**如何验证？** 执行 `SYNC_MAVEN_CACHE=/path/to/cache bash tests/messaging-run.sh`，只创建/重启/清理自己的 Compose 项目。版本、结果和剩余验收见[验证记录](/docs/zh/reference/validation.html)，包括单机 Broker 与集群故障的区别。

协议依据：[Kafka 3.9 Java 基线](https://kafka.apache.org/39/operations/java-version/)、[生产者参数](https://kafka.apache.org/39/configuration/producer-configs/)、[RabbitMQ Java 客户端与 Java 8 基线](https://www.rabbitmq.com/client-libraries/java-client)、[确认与可靠性](https://www.rabbitmq.com/docs/reliability)、[NATS Java 客户端](https://github.com/nats-io/nats.java)、[JetStream 设计](https://docs.nats.io/learn/jetstream/)。这些资料说明协议行为，不替代本项目的真实环境验收。

Redis 依据：[WAITAOF 同连接语义和返回计数](https://redis.io/docs/latest/commands/waitaof/)、[持久化](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/)、[Jedis](https://github.com/redis/jedis)。当前使用 Jedis 8.0.2 的单连接 API。

## RocketMQ 原生 TCP 配置

`ROCKETMQ` 已实现 Java 8 兼容的 5.5.1 原生客户端，依赖单独隔离。原生 Broker 确认、客户端/Broker 重启、不安全刷盘拒绝、Topic 丢失保护已通过（`target/rocketmq-transport-cached.log`）；联合全量/增量、Worker 强杀及三轮 Broker 重启已通过（`target/messaging-rocketmq-mixed.log`，49 项执行），既有单机实测未覆盖 ACL 或 TLS。默认档案使用单个 `ASYNC_MASTER` Broker 组，确认 **一份本地同步落盘副本**，不代表同步复制或 Raft 保证。默认档案的 `replicas` 为 1。认证配置完成验收前拒绝 username/password/token，应在可信网络使用。

配置 `rocketmq://nameserver:9876`，其他同一集群的 NameServer 放在 `messaging.endpoints`；另填 `cluster`、`broker`、`topic`、`minimumRetentionHours`。地址是原生 TCP NameServer，不是 5.x gRPC Proxy。`topic` 是 1–48 位前缀，首位字母，后续仅字母、数字、下划线、连字符；物理 Topic 是 `<前缀>_<64位任务/订阅/代次绑定哈希>`。日志代次初始化后，界面目标卡片展示实际名称。同代次重启复用，新代次使用新名称。这些名称专供 Rivomesh，禁止外部创建、删除、扩队列和写入。

### 启用 Controller 主备切换

在 `messaging.rocketmqControllerEndpoints` 填写受信的原生 Controller 地址，并将 `messaging.replicas` 设为 `2`。目标 URL 和 `messaging.endpoints` 继续填写 NameServer 地址。在控制台的 RocketMQ 目标设置中，可填写带端口的 Controller 地址，以逗号分隔。向导自动选择最少两份副本。留空时沿用原单 ASYNC_MASTER 档案。

```yaml
url: rocketmq://rocketnamesrv:9876
messaging:
  cluster: BusinessCluster
  broker: broker-a
  topic: sales_events
  replicas: 2
  rocketmqControllerEndpoints:
    - rocketmq://rocketnamesrv:9877
```

同一 Broker 组须配置三个使用独立存储的数据副本，受信 Controller 采用干净选主。投递前，Controller 的主节点地址、永久副本编号须与 NameServer 的活动路由及 Broker 实际角色一致。SyncStateSet 内成员须在线，且至少有两个。活动 Broker 角色为 `SYNC_MASTER`，配置 `SYNC_FLUSH`、`allAckInSyncStateSet=true`、`minInSyncReplicas=2`、`syncFromLastFile=false`、`asyncLearner=false`。所有副本应符合下文的保留策略、强制清理及自动建主题规则。数据路径使用 AutoSwitch CommitLog，停用 DLedger CommitLog。[RocketMQ Controller 部署说明](https://rocketmq.apache.org/zh/docs/deploymentOperations/03autofailover/)

物理主题包含日志代次。首次初始化可在已确认的活动 Broker 创建主题，等活跃同步副本都能读取确切的单队列配置后才写入归属记录或事件。已经初始化的主题须保有元数据与原生历史。提升后，主题元数据或主节点路由未就绪时保持已有确认并重试。少于两个在线同步副本时停止继续投递。

已确认的主节点或任期变化时，Rivomesh 关闭旧 SDK 连接，直接向已核验的活动地址发送。读取原生消息，并再次核对同一任期、主节点和同步集合后才接受回执。原主题代次和 `ROCKETMQ_OFFSET_V1` 坐标继续使用。确认丢失或不确定时仍可能以相同事件 ID 重放。已确认内容出现冲突时，恢复前须核实历史。Controller 档案有独立的配置指纹，切换持久性档案需明确迁移计划。

已使用 RocketMQ 5.5.0、在线的内嵌 Controller 和三个独立 Broker 数据卷完成产品发布者实测。主节点任期从 1 增至 2 后，保留事件的队列偏移 1、物理偏移 451 和内容摘要一致。新事件在 2 / 906 得到确认，新建发布者能以原生回执重开。停止剩余备用节点后，已确认回执及 Broker 队列末尾保持不变。Controller 停机、Broker 存储丢失、DLedger CommitLog、TLS、ACL 和完整 CDC Worker 切换分别验收。NameServer、Controller 与 Broker 保持在可信网络。[原生夹具与复现命令](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/rocketmq/controller-promotion.md)

### 主题和保留设置

准备阶段读取 Broker 配置，在选定 Broker 组上显式创建一个读写队列。要求 `flushDiskType=SYNC_FLUSH`、`transientStorePoolEnable=false`、`autoCreateTopicEnable=false`、`cleanFileForciblyEnable=false`，且 `fileReservedTime >= minimumRetentionHours`（默认 87600 小时）。默认模式拒绝复制组。Controller 档案执行上文的在线检查。刷盘配置必须在 Broker 启动时生效，不应运行中切换存储模式。客户端同步持久发送并启用 waitStoreMsgOK，只有 `SEND_OK` 才推进日志确认位点；刷盘/从库超时状态不推进，重试可能产生同一事件 ID 的重复消息。

队列偏移 0 是归属清单，用户属性包含 `rivomesh_publication_manifest`。消费者需先过滤此消息，再按通用 JSON 信封解析后续事件。后续消息带 `rivomesh_event_id`、`rivomesh_channel`、`rivomesh_key` 属性；所有逻辑表和控制通道共用队列 0。消费者仍需去重、核对 SNAPSHOT_END / COMMIT 及行数，Broker 确认不代表业务处理完成。

创建后中断可在同一代次继续写清单；已有非空 Topic 的清单不符、已初始化 Topic 丢失、队列/策略改变或偏移 0 过期均阻止续传，要求恢复计划。每批投递复核 Broker 配置、Topic 结构及归属；不能误建空历史继续。保留期限是**有限的**，到期前需要下游归档及可验证的重建方案，极大保留值不等于无限空间。存储丢失、人工清理、配额、历史到期需要恢复处理；监控磁盘，不能通过悄悄缩短保留时间清压。

执行 `bash tests/rocketmq-transport-run.sh` 可验证真实发布 JAR 与原生 Broker。测试使用隔离的 5.5.0 Broker、无宿主端口、启动时初始化数据卷权限，并只清理该 Compose 项目。单机匿名验收不覆盖 ACL、TLS、断电、controller/DLedger、副本切换和持续吞吐。[官方配置说明](https://rocketmq.apache.org/docs/4.x/parameterConfiguration/02server/)；[客户端源码](https://repo.maven.apache.org/maven2/org/apache/rocketmq/rocketmq-client/5.5.1/rocketmq-client-5.5.1-sources.jar)。

管理页目标卡片显示产品、映射、投递保证和消费者所需 Topic/Stream；接口不返回连接地址或凭据。RocketMQ 的实际物理 Topic 在日志代次初始化后出现。Broker 确认和消费者业务断点分别核对。

仅归属清单匹配不能证明已确认历史仍保留。RocketMQ 已加入下述原生确认回执与回退检测；其他消息产品仍需各自的检测和故障验收，不能把这项保证外推到全部 Broker。

RocketMQ 原生 Broker 选主已验证。原默认档案拒绝 Controller 模式。可选档案执行上文的验证，完整 Worker 续传另行验收。 [原生证据](/docs/zh/evidence/baseline.html#rocketmq-broker-controller-promotion-and-topic-metadata)

### RocketMQ 原生确认回执

每批发布成功后，日志先保存按代次绑定的原生回执，再推进结构、快照和事务回执。新增 `publication_transport` 表，每个目标订阅一行；旧日志打开时增量创建，不改写已有日志。更新校验租约并比较先前回执，旧 Worker 不能覆盖新回执。确认丢失或元数据提交结果不确定时，仍按稳定事件 ID 重放。

`ROCKETMQ_OFFSET_V1` 绑定物理 Topic、队列偏移、CommitLog 字节偏移，以及稳定事件 ID 和正文的 SHA-256。重连和每批投递前，通过原生 `viewMessage` 直接读取 CommitLog 记录核验，避免把异步 ConsumeQueue 索引暂未追平误判为已确认数据丢失。已确认记录丢失、位置或内容改变时，以 `ROCKETMQ_CONFIRMED_HISTORY_*_REBUILD_REQUIRED` 阻止该目标继续投递或创建资源。正常重启复用回执。已有投递状态却缺少原生回执时，报 `PUBLICATION_TRANSPORT_UPGRADE_REQUIRES_PLAN`，不能为旧任务猜测一个新基线。

`target/rocketmq-native-progress-restore.log` 已实测通过：首次确认后停 Broker 复制非空数据卷，启动后确认新事件，再还原旧卷；验证首条仍存在、后续已确认事件缺失，并凭后来的回执拒绝续传。同时覆盖内容摘要不符拒绝、正确回执跨客户端重启。`target/messaging-native-progress.log` 进一步通过 53 项执行：实际发布 JAR、六种消息目标加 PostgreSQL、Worker 强杀及三轮全部 Broker 停止/恢复，包含原生回执恢复。

检查保护保存的确认记录，不等于对任意历史做全量校验，也不代表消费者业务已完成。仍需遵守归属、保留、存储要求，核对消费计数/顺序并归档。不能删除回执或强行降低偏移绕过故障；确认历史丢失时需核验恢复/重建计划。回执及其他元数据的物理空间须在逻辑事件配额外预留。

`target/v3-native-progress-external.log` 已通过 47 项执行，包含实际 MySQL、PostgreSQL、openGauss 日志中的回执保存/比较更新/租约/重开契约，以及 V3 SQL 多目标和 HTTP 控制。`target/ui-native-progress.log` 通过 16 项 DOM 测试。

## Artemis Core 保留队列配置

`ACTIVEMQ_ARTEMIS` 与 ActiveMQ Classic 是独立产品。填写 `artemis://host:61616`、用户名/密码、逐库映射，以及作为队列前缀的 `messaging.stream`；前缀 1–48 位，首位字母，其余仅字母、数字、下划线、连字符。`messaging.broker` 可选核对 Broker 名称。首批限定单入口、`replicas: 1`，不接受令牌或额外 endpoints。物理队列为 `<前缀>.<64位任务/订阅/代次绑定哈希>`，代次初始化后界面展示实际名称。

通过独立 `rivomesh-artemis-transport` 使用 Core 协议。Rivomesh 固定 Core 客户端 2.19.1，并隔离 Netty 4.1.130、日志及 JSON 库。历史验收的 Broker 2.57.0 使用独立 JVM。当前 Worker 使用 Temurin 21。这是经过测试的兼容配置，不代表任意旧版客户端/Broker/安全设置均已支持。

Broker 必须开启持久化、事务和非事务 journal sync，准备阶段读取这些运行属性。配置文件须保留 `journal-datasync=true`；当前使用的管理属性**没有独立暴露并核验该字段**。[Broker 夹具](/files/tests/artemis-broker.xml) 显式开启并使用 NIO，物理存储和断电保证需另外验收。Core 同步事务提交成功后才推进发布回执；确认丢失仍可能按相同事件 ID 重放。

为前缀单独配置地址策略，例如 `rivomesh.#`。业务地址关闭自动创建队列/地址及所有自动删除；服务显式创建首次专用队列。禁用过期（no-expiry=true，或所有过期延迟为 -1）、last-value/ring/purge 和投递丢弃（max-delivery-attempts=-1）。接受 PAGE/BLOCK/FAIL，拒绝 DROP。要求持久、非破坏 ANYCAST 队列，且地址只绑定这一个队列；已有不符资源会被拒绝。运行中不能擅自改动 datasync 和这些策略。

管理请求复用认证后的 Core 连接，不需要 HTTP 管理地址。临时非持久回复队列名为 `activemq.management.<uuid>`，需要管理权限及临时队列创建/删除、发送/消费/浏览授权，并允许该内部前缀清理。检查不创建业务对象，控制通道随后关闭；业务“禁止自动创建”策略不能套到回复前缀上。夹具已分开两类策略；已有部署应合并所需设置，不应直接覆盖整份 Broker 配置。

归属消息通过 `rivomesh_publication_manifest` 属性标识，消费者必须先过滤，再按通用 JSON 信封解释后续字节。数据属性包含 rivomesh_event_id、rivomesh_channel、rivomesh_key 和通用 header。普通消费确认不会从非破坏队列删除历史；重连可能再次收到旧事件，必须持久去重并保存业务断点。已实测 Core 字节消息消费；AMQP/JMS 消费变体仍需单独互操作验收。

准备完成后，服务在日志绑定持久 node ID 与 queue ID。已初始化队列丢失、身份改变、归属或队列配置不符，均在推进发布回执前阻止继续；首次创建中断留下的空专用队列可以完成准备，已初始化资源不能替换。投递前后核对身份。每批确认后，日志另存 `ARTEMIS_RECORD_V1`，包含物理队列、原生消息 ID、事件 ID，以及带长度前缀的事件/正文 SHA-256。续传与下一批发送前，通过过滤 Core 浏览器核对该持久记录及正文；即使旧非空备份保留相同 node/queue ID，也会因最新记录缺失/改变而阻止继续。此项核验最后保存的确认记录，不等于核验全部历史或下游业务断点。既有投递缺少原生回执时需要明确迁移/重建计划，不能清空元数据后继续。已初始化资源被空队列替换时拒绝处理，并且不写入新归属消息。

**为什么 ACK 不释放历史？** 当前配置刻意保留发布日志，需要规划磁盘、下游归档及显式重建/保留工作流。**能使用普通破坏队列吗？** 不能，会被配置校验拒绝。**能连接 Classic 吗？** 不能，Classic 是另一个尚待实现的协议配置。**检查为何提示权限不足？** 除数据权限外，还需要管理回复通道权限；接口不返回凭据或消息正文。

`target/artemis-transport-volume-fixed.log` 已通过 Java 8 客户端与当前 Broker 的确认发布、字节/键/通道一致、消费确认后保留、Broker/客户端重启身份保留、不安全队列拒绝、已初始化队列丢失保护。首次失败是隔离数据卷权限，不能计作协议通过。`target/artemis-wiring-unit.log` 44 项核心执行通过；`target/ui-artemis-fixed.log` 修复切换产品后账号字段错误隐藏后，17 项 DOM 通过。早期七种消息目标联合恢复因超时失败，不计作通过；后续定点重验已通过，见下文独立记录。集群、分页容量、TLS、断电和更多版本/安全配置仍需验收。[管理 API](https://artemis.apache.org/components/artemis/documentation/latest/management.html)、[持久化](https://artemis.apache.org/components/artemis/documentation/latest/persistence)、[地址策略](https://artemis.apache.org/components/artemis/documentation/latest/address-settings.html)。

`target/artemis-native-progress-final.log` 已通过实际发布 JAR 验收：首条确认后停隔离 Broker 复制数据卷，随后确认新记录，再还原旧非空卷；证明 node/queue ID 未变，并以较新回执拒绝续传。正确回执可恢复；摘要改变、格式错误和空替换队列均拒绝，空队列保持为空。`target/ui-artemis-native-progress.log` 17 项 DOM 通过。七种消息目标联合恢复在此前主机休眠期间出现源 SQL/HTTP 超时后另行重跑。上述结果不代表集群、TLS、分页压力或断电验收。

### 共享存储主备

为同一 Artemis 共享存储主备对配置一个稳定的 TCP 入口，只把新连接转发给当前接受 Core 连接的 Broker。两个实例共享 Bindings、消息日志、分页和大消息目录。发布端继续使用单个 `artemis://` 入口及原队列身份。[Artemis 共享存储主备](https://artemis.apache.org/components/artemis/documentation/latest/ha)

Artemis 2.57.0 双 Broker 实测使用一个本地命名卷和固定回环入口。主进程强制终止后，原备进程接管。入口中断期间发布确认留在原位。恢复转发后，发布端核对原生回执以及 Broker、队列身份，再确认同一个待重试事件。普通消费 ACK 后，两个事件仍在保留队列内。部署时需独立核验存储故障域、Broker 间 TLS、自动回切和容量。[实测证据](/docs/zh/evidence/baseline.html#artemis-shared-store-primary-and-backup)

## 管理接口重试诊断与定点恢复重验

`PULSAR_ADMIN_TIMEOUT` 表示客户端管理请求超时，`PULSAR_ADMIN_CONNECT_RETRY` 表示连接失败。SDK 可能把它们包成默认状态 500 的异常，即使并未收到 HTTP 500 响应；诊断服务端错误前应核对 Broker 访问日志。`PULSAR_ADMIN_REQUEST_FAILED` 保留无法确定的通用 SDK 失败，不虚构 HTTP 响应；实际 HTTP 错误仍保留状态码。凭据提供器/TLS 拒绝作为永久配置故障处理，这种分类本身不等于 TLS 互通已验收。

全量准备阶段现在也输出去重后的重试诊断，只记录异常类和堆栈位置，不记录异常消息、凭据、SQL 或行数据。瞬时网络故障保持 RUNNING 及原有故障代次，应自动重试，无需手动恢复。应检查宿主机/虚拟机负载、堆/直接内存、Broker 就绪、网络及请求超时配置，不能假设与硬件无关的启动/追平截止时间。

完整构建后可以复用已检查发布包和编译测试，定点重跑故障用例：

```bash
RIVOMESH_TEST_PREBUILT=1 bash tests/messaging-run.sh
```

检查器拒绝变更后的 Java 源码、过期测试/界面资源及无效发布包，同时核验固定 Java 8 兼容 JUnit Console 的校验和。此模式只执行 **1 项链路用例**，不等于完整 Maven 的 54 项执行；默认命令仍构建并运行较完整的测试。失败时在 `target/broker-tests/<project>/` 留存完整 Pulsar 日志和其他 Broker 的有界日志，只清理该测试自己的项目资源。可选 `RIVOMESH_TEST_JAVA_OPTIONS` 向隔离测试与 Worker 提供 JVM 诊断参数，例如 Temurin 21 的 `-Xlog:gc`；它是测试选项，不是生产容量建议。

历史定点验收 `target/messaging-pulsar-gc-diagnostics.log`：实际 Java 8 发布 JAR、256 MiB Worker 堆，**1 项真实链路用例通过、0 失败/跳过**。PostgreSQL 加 Kafka/RabbitMQ/NATS/Redis/Pulsar/RocketMQ/Artemis 完成全量/增量、Worker 强杀和三轮全部消息 Broker 停止/启动；Broker 停止期间 SQL 继续，重试诊断持久保留，自动追平后清除。最后删除已初始化 Artemis 队列，仅该目标暂停，其他订阅继续追平；原生回执跨重启恢复。在繁忙共享宿主机启用 Java 8 GC 诊断时约耗时 590 秒，没有增加堆或截止时间。这是 1 项定点用例，不等于完整 Maven 54 项重新通过，也不是通用容量或恢复时间承诺。
