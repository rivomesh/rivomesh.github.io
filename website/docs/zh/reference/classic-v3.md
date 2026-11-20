---
kind: docs
locale: zh
title: "ActiveMQ Classic"
sourcePath: docs/zh-CN/classic-v3.md
---

# ActiveMQ Classic

English：[Classic](/docs/en/reference/classic-v3.html)。

已实现 OpenWire 原生持久本地事务、业务事件队列和独立保留回执队列；早期 Java 8 制品的独立原生传输已验收：持久发布、正常消费确认、错误选择器/清空保护、重启和实际旧非空备份保护均通过。MySQL8.4＋PostgreSQL17 联合全量/增量、进程强杀、Broker 故障、SQL 约束修复重试和清空隔离也已通过；不能视为集群验收。首批 Broker 为 Apache ActiveMQ5.19.12。Rivomesh 固定客户端 5.16.8，JMS/SLF4J/Hawtbuf 已隔离。当前部署统一使用 Temurin 21 LTS。5.16 客户端属于停止维护的版本线，需要单独管理依赖和安全生命周期，不能把 Broker 当前版本等同于客户端也已更新。参见 [Apache 下载](https://activemq.apache.org/components/classic/download/)及[历史版本](https://activemq.apache.org/components/classic/documentation/download-archives)。

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

每个批次保留回执，原生消息查询可能扫描保留历史。回执压缩、容量长稳、独立存储复制、网络桥、TLS 和更广泛的多产品联合矩阵需要单独验收。

## 共享 KahaDB 主备

Classic 5.19.12 的两个 Broker 进程可以使用相同 Broker 名称和同一 KahaDB 目录。该文件系统必须支持两个进程之间的排他锁。持锁进程打开 OpenWire 监听，备用进程等待锁。持锁进程释放锁后，备用进程接手并打开监听。部署时须验证实际存储的文件锁行为，并启用大于零的 `lockKeepAlivePeriod`。
[共享文件系统主备](https://activemq.apache.org/components/classic/documentation/shared-file-system-master-slave)、
[存储锁配置](https://activemq.apache.org/components/classic/documentation/pluggable-storage-lockers)、
[5.19.12 发布说明](https://activemq.apache.org/components/classic/download/classic-05-19-12)。

为 OpenWire 和已认证的 Jolokia 各配置一个固定地址，始终将两者路由到同一持锁 Broker。Rivomesh 核对两个通道的 Broker 名称和 ID，重开发布者后验证已保存的 OWNER 和原生回执。接手依赖原共享存储继续可用。两个 Broker 的进程临时文件可分别保存在本地目录。

使用候选发布包和 Temurin 21 执行原生夹具。

```bash
python3 tests/classic-shared-store-run.py \
  --artifact /path/to/rivomesh.jar --java-home /path/to/temurin-21 \
  --output /path/to/new-classic-ha-report
```

使用 ARM64 Classic 5.19.12 镜像与 Temurin 21 Rivomesh 进程完成五项实测。夹具在同一个 Docker KahaDB 卷上启动两个真实 Broker，本机转发层同时切换 OpenWire 和 Jolokia。夹具检查原备用进程等待锁、原生 EVENT 和回执确认、双入口断开时发布可重试且断点未前进、强杀主进程后原备用 PID 接手，以及重开发布者后验证同一 OWNER 和已有回执。消费者核对切换前保留和切换后重试的 EVENT。旧主重新加入后保持备用，现任主继续投递。输出目录记录包、Broker 镜像、试验输入摘要和清理结果。该档案覆盖实际发布者、消费者和外部入口切换。独立存储失效、生产负载均衡自动切换、跨主机文件系统和完整 MySQL 到 Classic Worker 切换需要另外验收。

## FAQ

**为什么另建回执队列？** 普通队列消费会删除事件，原生确认必须在业务ACK之后仍能用于重启和旧备份校验。

**选择器错误或 OWNER 丢失？** 停止错误消费者，保留剩余历史，核实缺口后修复或重建；普通恢复只重试原事务，不给已初始化空队列补造归属。

**Broker 停机？** 连接和管理HTTP传输故障按持久断点重试；认证、策略或确认历史错误暂停此目标，其他目标保持独立进度。

**Broker 切换后怎么路由？** 保持 OpenWire 和 Jolokia 配置地址固定，同时将两个上游指向当前持有锁的 Broker。连接配置使用直连 `activemq://` 或 `activemqs://`。独立 KahaDB 存储和客户端 `failover:` URI 需要另外验收。

**当前 Broker 管理端返回403？** Classic5.19.12 的 Jetty 默认仅放行回环地址。应使用明确的 InetAccessHandler include 规则授权同步 Worker 的实际管理网络，同时保留认证和 Jolokia 权限。403 不能视为队列不存在；当前服务端还可能隐藏异常类型，因此存在性检查使用成功的精确 MBean 搜索，管理调用失败不会授权重建资源。

**严格来源检查：** 客户端使用管理端地址自身 scheme/authority 的 Referer。请在 Jolokia CORS 策略中放行这个精确来源，并保留 strict-checking；不需要全局 JVM 头部覆盖设置。Jolokia [官方安全手册](https://jolokia.org/reference/html/manual/security.html)明确支持 Referer 回退。HTTP200 加 Jolokia status403 仍是访问失败，不能当成队列不存在。

已验收测试策略同时允许 `http://classic:8161` 和 `http://classic:8161/`；该 Jolokia 版本会按包含末尾斜线的完整 Referer 匹配。其他部署应放行精确的 `<管理scheme>://<管理authority>/`，继续保留严格检查。

## 验证范围

指定 KahaDB 档案验证了 Broker 重启、原队列回执核对和多目标链路独立恢复。可使用 `bash tests/classic-pipeline-run.sh` 复现 MySQL、PostgreSQL 与 Classic 联合投递。
