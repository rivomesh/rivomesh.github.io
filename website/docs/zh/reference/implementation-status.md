---
kind: docs
locale: zh
title: "当前实施状态"
sourcePath: docs/zh-CN/implementation-status.md
---

# 当前实施状态

首版尚未发布。Java/Maven命名空间为`io.github.rivomesh`。[English](/docs/en/reference/implementation-status.html)。

## 已有能力及边界

| 能力 | 当前状态 |
|---|---|
| 同步链路 | MySQL 多库映射、同源多目标、自动建表、分块快照、持久断点、无主键行、JSON 和受支持生成列。MySQL 5.7.44、8.0.46、8.2.0、8.4.13 均通过 Temurin 21 异步 GTID 提升及三节点单主组复制。四个组复制档案都在停主后自动选主并让两个 SQL 目标追平。 |
| PostgreSQL 源 | 已实测 17.12 逻辑槽切换续传及 18.7 存储型生成列。17.12 的 REAL、DOUBLE PRECISION 和 BYTEA 可续传至 PostgreSQL 和 MySQL。BYTEA 兼容源库 hex 与 escape 设置，核对无主键重数和外置值。 [配置与恢复](/docs/zh/reference/postgresql-source.html) |
| Oracle 源 | Oracle Free 26ai 单 PDB 的 Flashback 和归档 LogMiner 已通过。两路 PostgreSQL 保留原 SCN，支持保存点回滚及强制重启。严格文本 JSON 和限定 AL32UTF8、AL16UTF16 字符类型已验收。预检拦截缺少重做镜像的原生 JSON。 [源库手册](/docs/zh/reference/oracle-source.html) |
| 采集故障恢复 | 检查原断点及受影响目标，核对 MySQL GTID 边界和原始日志，限定档案支持审批后排除一个已核验事务。 [操作说明](/docs/zh/reference/capture-recovery.html) |
| 管理 | 中英文向导、共享修订、独立 Worker 和跨入口控制。MySQL 与 PostgreSQL 源已验证按 JVM、组件和外部 PostgreSQL 日志连通性自动选择 Agent。真实 Chrome 已验证登录保持、报告和回执检索、审批后恢复报告。Keycloak 26.7.4 已通过 HTTPS 授权码、S256 PKCE 和跨入口撤权。 [全局控制](/docs/zh/reference/global-control.html) · [OIDC](/docs/zh/reference/oidc-login.html) |
| 日志 ACK 中断 | 共享 PostgreSQL 日志下，已实测 MySQL 或 PostgreSQL 目标先提交。原 Agent 重连并显式启动后只补缺失 ACK。已冻结写入并封存完整结案回执的同库档案通过离线接管，候选启动保持两目标原切点。 [操作手册](/docs/zh/reference/global-control.html#控制网络非对称分区) |
| 对账修复 | 共同校验点、行差异、管理员修复计划；限定MySQL/PostgreSQL档案 |
| 缺口核验 | 审阅计划、管理员确认、重新扫描、原子凭据和跨入口取消；限定PG/MySQL，验收进度见[手册](/docs/zh/reference/gap-verification.html) |
| 事务补偿 | PostgreSQL 和 MySQL 的管理员预览、确认、目标原子凭据和原事务重放。见[操作说明](/docs/zh/reference/transaction-compensation.html) |
| 关系目标 | MySQL、PostgreSQL、openGauss 有实库档案。达梦、金仓、GBase8c、OceanBase MySQL 模式通过限定事务和联合中断恢复。分布式 GaussDB 和其他厂商模式待验收。 |
| 分析目标 | ClickHouse、Doris、Hive 已有物化和恢复档案。ClickHouse 25.8.33.6 在 Temurin 21 已验证旧非空数据卷回退时保护较新断点。生产集群、TLS 和容量需单独验收。 |
| 消息目标 | 八种 Broker 已有确认式至少一次投递档案。实库包含 Kafka 签名回执查询、ActiveMQ Classic 和 Artemis 共享存储主备、NATS TLS 和多数派、RabbitMQ 多数派及 Redis Streams 外部提升。 RocketMQ 5.5.0 的可选发布器以三个数据副本、至少两个同步副本完成主备实测。 [消息目标](/docs/zh/reference/messaging-v3.html) |
| 部署 | Linux、Docker、Helm、原生 Kubernetes。双节点实测 RWO 重挂、配置更新、Secret 轮换、外部日志和旧 Worker 写入隔离。Helm 和原生 YAML 均通过应用镜像替换及跨节点挂载原 CSI 卷后的自动续传。 |
| Java | Eclipse Temurin 21 LTS 是唯一支持的构建与运行时。连接器、部署和安全协议使用实际 Java 21 候选包验收。 |

具体产品约束以[平台方案](/docs/zh/start/architecture.html)、[控制台](/docs/zh/reference/console-and-deployment.html)和各产品手册为准。协议和数据格式编号是内部状态标识，不是对开发版本升级的承诺。

[已验证范围](/docs/zh/start/verification.html) · [产品路线图](/docs/zh/start/roadmap.html)
