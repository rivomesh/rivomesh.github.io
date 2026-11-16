---
kind: docs
locale: zh
title: "恢复与一致性"
sourcePath: docs/recovery.md
---

# 恢复、主库切换与一致性

本文描述 **v2 单 database、单目标核心**，不是 v3 快照和独立日志协议。English: [V2 recovery](/docs/en/reference/recovery.html)。已实现的 v3 多库多目标、可选日志、Web 和消息恢复见 [V3 手册](/docs/zh/reference/pipeline-v3.html) 与[消息手册](/docs/zh/reference/messaging-v3.html)。完整设计见
[完整平台方案](/docs/zh/reference/platform-design.html)（[English](/docs/en/reference/platform-design.html)）。已确认的多库显式映射、同源多目标及独立恢复设计见
[需求与决策](/docs/zh/reference/requirements-and-decisions.html)（[English](/docs/en/reference/requirements-and-decisions.html)）；
业务次级 UNIQUE/GSI 转普通索引及接管约束恢复见
[Gauss 索引策略](/docs/zh/reference/gaussdb-index-policy.html)（[English](/docs/en/reference/gaussdb-index-policy.html)）。剩余适配器、修复和接管范围见[实施状态](/docs/zh/reference/implementation-status.html)。

## 同步服务主备

各进程首次启动幂等创建 v2 元数据；并发目录对象创建冲突单独处理，首个任务的配置和表清单原子插入。
工作前通过条件 UPDATE 获取 owner 和租约。独立心跳线程持续续期，数据/进度事务也校验同一 owner。
每次重新建立工作会话都生成新 owner，防止旧复制连接的回调在新会话中继续提交。

同一任务行的锁将采集、全量提交和增量应用的提交顺序串行化。
租约转移后，旧 owner 的业务事务在任何业务写入前就被拒绝；旧节点也不能替新 owner 暂停任务或释放租约。
节点只是备用时不会连接 binlog，同一任务正常只有一个复制客户端。

## GTID 状态

- capture_gtid：已经进入持久化队列或不影响业务库的已提交源事务，加上首次基线。
- required_gtid：capture_gtid 与全量扫描已读取状态所依赖的 GTID 的并集。
- applied_sequence：已经写入目标业务表的队列事务序号。

源的物理 UUID 和文件位点只用于诊断、连接后端校验，不用于跨服务器恢复定位。
每个源提交事件先完整持久化，才把该事务 GTID 加入 capture_gtid；不使用客户端可能提前更新的内存 GTID 直接覆盖状态。
重复 GTID 在持有任务锁时检查，已经持久化的事务不会重复加入队列。

## 全量期间也允许安全切主

记录基线 B0 后开始采集 FULL 行镜像，并按主键游标扫描业务表。
每次分块读取之后获取源 GTID 水位；分块数据、最后主键和该依赖水位一起提交到目标。
表发现和初始扫描上界读取的结束水位也保存为初始 required_gtid。

若全量读取到了旧主库已提交、但采集器尚未持久化的事务，仅检查 capture_gtid 会遗漏这一依赖。
因此切换候选必须包含 required_gtid，不能只包含已采集事件。

所有分块完成后取结束 GTID B1，等待 capture_gtid 覆盖 B1，再按源提交顺序回放队列。
对 B0 后没有变化的记录，扫描负责导入；有变化的记录，由最后一条完整行镜像或 DELETE 决定最终状态。
主键修改按删除旧键、写入新键处理，游标之前的插入及扫描上界之后的记录也由日志补齐。

全量和早期回放期间目标不是某一个时间点的一致性快照。持续增量阶段，每个源事务（包括跨表）在一个目标事务中应用。

## 主库发现与切换

1. 逐个检查候选地址，读取 UUID、server_id、只读标记、GTID 模式、executed/purged 集合及复制状态。
2. 普通主从仅选择可写且没有活动上游线程或残留复制错误的节点。
3. Group Replication 仅选择 ONLINE、PRIMARY、可写、单主模式的节点。
4. 多个可写主库时等待外部高可用系统完成隔离，不能任选一个节点。
5. 要求 `required_gtid ⊆ candidate.gtid_executed`；不满足则等待追平。
6. 要求 `candidate.gtid_purged ⊆ capture_gtid`；不满足说明还有未采集的必要事务已无日志，任务暂停。
7. 新建复制连接使用持久化 GTID auto-positioning，禁用自动回退到 purged 集合。

JDBC 查询会校验物理 UUID 和可写性；复制连接在处理事件前校验握手查询到的 server_id。
这也能发现 Router/VIP 在两种连接之间切换了后端，届时退出本次会话，重新发现而不混用数据。
心跳超时、源连接断开和源角色变化会触发新会话，重新读取持久化 GTID。

候选需要由运维保证全量复制、没有业务数据过滤或伪造 GTID，属于同一逻辑复制拓扑。
GTID 一致不等于能检测所有人工修改数据的情况。数据库自身丢失的异步未复制事务，不能由 CDC 重建。

## 提交边界

| 操作 | 一个目标事务内的内容 |
|---|---|
| 创建任务 | 配置指纹、B0、表清单、扫描上界、发现水位 |
| 全量分块 | 业务行、游标、行数、完成状态、读取依赖 GTID |
| 捕获源事务 | 有序完整行事件、来源、GTID、capture/required 集合 |
| 应用源事务 | 全部行修改、applied_sequence、阶段变更、队列删除 |
| 记录故障 | 错误历史、共享 run_state、最近错误上下文、释放 owner |

提交响应不确定时退出本次会话，不复用旧内存游标或 GTID；新会话读取目标数据库的持久化记录。
数据表、队列和状态表必须作为同一个恢复单元备份和恢复。

## SQL 错误与暂停

SQLState 08/40、锁等待和可恢复资源错误退避重试；数据、约束、权限和语法错误暂停。
错误记录保留表、源 GTID、队列事务序号、SQLState 和 vendor code，不记录行载荷或 SQL 字面量。
目标事务失败整体回滚，队列头不删除；采集端可能已把其他事务安全存入队列，这不会使应用越过错误。

PAUSED 是数据库中的共享状态，重启进程或新增备用节点不会绕过它。
修复数据类型、权限或约束后执行 resume，只重试原事务，不跳过、更改 GTID 或清空队列。
源复制 SQL 错误由数据库运维修复；服务不会自动执行 SQL_SLAVE_SKIP_COUNTER、注入空 GTID 或 RESET。
正常主库可用时，故障从库不影响当前采集；故障从库被提升时会拒绝其接管，等待修复。

v1 文件位点任务缺少完整 GTID 和读取依赖，不能直接自动升级；新版本会保留旧状态并明确拒绝同名旧任务。
