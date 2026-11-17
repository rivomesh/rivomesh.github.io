---
kind: docs
locale: zh
title: "ActiveMQ Classic"
sourcePath: docs/zh-CN/classic-v3.md
---

# ActiveMQ Classic

English：[Classic](/docs/en/reference/classic-v3.html)。

已实现 OpenWire 原生持久本地事务、业务事件队列和独立保留回执队列；实际发布包/Java8 独立原生传输已验收：持久发布、正常消费确认、错误选择器/清空保护、重启和实际旧非空备份保护均通过。MySQL8.4＋PostgreSQL17 联合全量/增量、进程强杀、Broker 故障、SQL 约束修复重试和清空隔离也已通过；不能视为集群验收。首批 Broker 为 Apache ActiveMQ5.19.12。Java8 使用客户端5.16.8（class版本52），5.18/5.19 客户端需要 Java11；JMS/SLF4J/Hawtbuf 已隔离。5.16 客户端属于停止维护的版本线，需要单独管理依赖和安全生命周期，不能把 Broker 当前版本等同于客户端也已更新。参见 [Apache 下载](https://activemq.apache.org/components/classic/download/)及[历史版本](https://activemq.apache.org/components/classic/documentation/download-archives)。

使用 [config/classic-v3.yml](/files/config/classic-v3.yml)：`ACTIVEMQ_CLASSIC`，`activemq://host:61616` 或 `activemqs://host:61617`，显式填写 `messaging.broker`、队列前缀 `stream` 和以 `/api/jolokia/` 结尾的认证管理地址 `adminUrl`。密码不放入URL。`check` 连接 OpenWire 并读取管理能力，不创建业务队列；会核对两个通道的 Broker ID/名称，要求持久、非从节点、KahaDB。重定向、含糊的 JSON/JMX 响应不会成为成功确认。TLS 需要独立验证证书及 JVM 信任，目前尚无真实 TLS 验收。

## 资源和消费者约定

事件队列为 `<prefix>.<64位绑定哈希>`，回执队列再加 `.receipts`。两者都保留持久 OWNER 消息，包含共享随机身份、任务绑定及两个队列名；源日志绑定该身份，原生进度绑定回执 JMSMessageID 和批次摘要。

消费者必须使用以下完整选择器：

```text
rivomesh_record_type = 'EVENT'
```

读取 channel/key/event-ID 属性和标准 V3 JSON 字节信封，按稳定事件ID去重，持久暂存并校验事务边界、计数和序号，业务提交成功后才确认消费。生产者确认不代表下游业务完成，多消费者仍需处理暂存和顺序。禁止消费 OWNER 或任何回执；队列长度含保留控制消息，不等于待消费事件数。

投递前会检查事件订阅的完整选择器，以及回执队列不存在订阅。外部 JMS 浏览器也计入；管理检查可使用 JMX 浏览。Broker ACL 必须禁止业务消费者读取 `.receipts`，并禁止 OpenWire 账号自动创建缺失队列；首次显式建队列使用授权 JMX `addQueue`。运维配置必须保留 OWNER/回执、关闭不活跃队列删除、避免过期/丢弃策略，配置 KahaDB `journalDiskSyncStrategy=always`、`enableJournalDiskSyncs=true`。标准 MBean 不能在运行时完整证明这些策略和刷盘配置，需配置并审核运行环境。测试模板使用隔离的测试凭据，不是生产密码模板。管理权限需要 read/search 和限定的 addQueue/getMessage；破坏性操作应由独立受控恢复流程处理。

## 确认与恢复

同一本地 JMS 事务提交事件批次和持久回执，读取并核对实际回执后，才允许源日志保存原生位置与 schema/快照/事务确认。响应丢失可能重发相同事件ID，不承诺跨目标 XA 或下游恰好一次。日志隔离无法撤销旧进程已进入 Broker 的请求；共享暂停仍明确标记未确认，接管前需确认在途请求结束。

重连时先检查两份归属及最后保存回执，再允许建资源/投递。已初始化队列缺失、OWNER 改变、回执缺失或内容改变，需要恢复/重建计划。正常 EVENT 消费不会移除归属和回执；整库旧备份即使保留旧身份，也必须包含源日志要求的后续回执。该机制不是全部历史校验，不能凭普通恢复修复任意选择性删除的历史事件。

回执压缩/保留治理尚未实现；每批次增加元数据，原生消息查询也可能扫描保留历史。容量长稳、复制切换、网络桥、TLS 和更广泛的多产品联合矩阵仍需独立验收，不能从单 Broker 传输验证推导全部场景支持。

## FAQ

**为什么另建回执队列？** 普通队列消费会删除事件，原生确认必须在业务ACK之后仍能用于重启和旧备份校验。

**选择器错误或 OWNER 丢失？** 停止错误消费者，保留剩余历史，核实缺口后修复或重建；普通恢复只重试原事务，不给已初始化空队列补造归属。

**Broker 停机？** 连接和管理HTTP传输故障按持久断点重试；认证、策略或确认历史错误暂停此目标，其他目标保持独立进度。

**能否配置 failover URI 或多个独立 Broker？** 首批只支持固定直连单 Broker，管理接口必须属于同一节点；复制/切换需后续独立身份和存储验收。

**当前 Broker 管理端返回403？** Classic5.19.12 的 Jetty 默认仅放行回环地址。应使用明确的 InetAccessHandler include 规则授权同步 Worker 的实际管理网络，同时保留认证和 Jolokia 权限。403 不能视为队列不存在；当前服务端还可能隐藏异常类型，因此存在性检查使用成功的精确 MBean 搜索，管理调用失败不会授权重建资源。

**Java8 Worker 与严格来源检查：** URLConnection 默认不会发送手动指定的 Origin，客户端改用管理端地址自身 scheme/authority 的 Referer。请在 Jolokia CORS 策略中放行这个精确来源，并保留 strict-checking；不需要全局 JVM 头部覆盖设置。Jolokia [官方安全手册](https://jolokia.org/reference/html/manual/security.html)明确支持 Referer 回退。HTTP200 加 Jolokia status403 仍是访问失败，不能当成队列不存在。

已验收测试策略同时允许 `http://classic:8161` 和 `http://classic:8161/`；该 Jolokia 版本会按包含末尾斜线的完整 Referer 匹配。其他部署应放行精确的 `<管理scheme>://<管理authority>/`，继续保留严格检查。

## 验收记录

`target/classic-subscription-selector-fixed.log`：2项SDK分类测试＋63项核心/API测试通过，0失败/错误/跳过。`target/ui-classic-first.log`20项DOM通过。`target/classic-native-selector-fixed.log`：上述实际发布包/Java8原生验收通过，发布包145723459bytes，SHA2561a1945e3f91658e3f666a79af66b5da1d6ec0eb8ea2ff00cd3d9f8242a017115。此前失败的原生日志不算验收；`target/classic-pipeline-first.log` 构建成功，但测试脚本错误依赖了 Maven Java8 镜像中不存在的 Python，不算验收。修正后的 `target/classic-pipeline-prebuilt.log` 一个实际发布包联合链路用例通过：主机验证源文件/编译输入，原生消费工具仅针对实际发布包编译，真实 MySQL8.4＋PostgreSQL17、LOCAL H2 日志。前后发布包 SHA256 均为6eb2a8bb053fcf777b765713e5c21aeb675e586f53c79098e5dffb2103afb954，145723578bytes。按稳定事件ID、行身份和已完成事务从实际消费信封重建全量/当前行，消费批次持久化后才ACK。Worker强杀、Broker停机/追平、SQL CHECK错误时Classic继续、删除约束并按原错误代次重试，以及清空Classic队列时SQL继续均通过。暂停结果区分SQL FENCED与MQ UNCONFIRMED。可运行 `bash tests/classic-pipeline-run.sh`，不变的已验证发布包可加 `RIVOMESH_TEST_PREBUILT=1`；Python只用于主机测试校验，不是运行容器依赖。全部本次隔离资源已清理。

最终打包 `target/classic-final-unit-package.log`：2项SDK＋63项核心/API通过，0失败/错误/跳过；界面20项通过。当前产物145723617bytes，SHA256290adcc746a64c427ccefc6de712b8fbb7bbdc7ed4d48fcd2757485e99b6c2fe。与已通过链路的包逐一比较全部65091个class，仅AdapterCatalog.class的能力说明改变；运行时协议资源字节相同。见[归档证据](/docs/zh/evidence/2026-11-15-classic.html)。
