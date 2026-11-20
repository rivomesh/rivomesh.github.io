---
kind: docs
locale: zh
title: "源端采集故障恢复"
sourcePath: docs/zh-CN/capture-recovery.md
---

# 采集故障恢复

[English](/docs/en/reference/capture-recovery.html)

当 V3 任务进入 `ERROR` 且失败阶段位于源连接、读日志、解码、快照、发现、DDL 或转换时，管理员可以在故障卡片打开 **检查采集恢复**。固定 Agent 部署可从任一管理入口发起检查，实际读取由任务所属 Agent 执行。检查报告列出可能受影响的订阅、原断点摘要、源准入结果及后续步骤。

```sh
java -jar rivomesh.jar review-source /etc/rivomesh/tasks/pipeline.yml
```

报告校验任务身份、原采集位置和快照依赖。源端只执行准入读取。检查期间若任务代次、断点或配置发生变化，刷新任务后重新检查。

| 观察结果 | 恢复步骤 |
|---|---|
| `SOURCE_LOG_GAP` | 保留 GTID 和可取得的原始 binlog。恢复缺失日志，或由数据库运维恢复持有完整日志的合格主库。检查通过后从原位置恢复。 |
| `POSTGRESQL_REQUIRED_WAL_UNAVAILABLE` | 保留原复制槽、所需 WAL、日志库和 LSN 证据。评估恢复原槽及 WAL 的可行性。无法恢复时，审阅新基线和受影响目标范围。 |
| `SOURCE_CHECKPOINT_AVAILABLE` 且失败阶段为解码、DDL 或快照 | 保留原始事件并处理解码档案、结构变更或读取权限，再重试原断点。源准入通过只证明原断点仍满足恢复条件。 |
| `UNPROVEN_SOURCE_RANGE` | 缺口事务边界和内容待确认。继续使用原日志和断点开展核查。把所有订阅纳入影响范围。 |

MySQL 因 DDL 停止时，报告可比较日志中最新保存的结构和源端当前目录。结果列出有限数量的变更表、列差异、行身份键变化及定义摘要。源目录可能已经包含后续 DDL。保留原 binlog 位点，处理结构变更后再决定是否重试。

### 常见问题

**为什么目标库有数据，采集仍停在原位置？** 目标可能仍保有之前已成功同步的数据。查看任务的采集断点和每个订阅的确认水位。

**什么时候可以使用事务跳过？** 当事件已经形成可审阅的完整目标事务、目标状态明确且符合审批条件时，使用[事务跳过](/docs/zh/reference/transaction-skip.html)流程。采集端排除按本文的 MySQL 原始日志核验及管理员审批流程执行。

### MySQL 原生事务边界

受支持的 `SOURCE_DECODE` 故障可查看原断点后的第一个事务。检查从同一 MySQL 实例及同一 binlog 文件读取最多 256 条事件头，要求位移连续直到 `Xid`，展示 GTID、文件范围和涉及表。`nextTransactionHeaders` 的范围为 `BINLOG_HEADERS_ONLY`，应保留原始 binlog 供行内容审阅和审批。轮换、断档、后端变化、未知事件或不完整事务边界都可能导致证据缺失。读取权限沿用 MySQL 复制账号。[MySQL 事件说明](https://dev.mysql.com/doc/refman/8.4/en/show-binlog-events.html) · [实库证据](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#mysql-decode-header-review)

采集租约释放后，可验证完整事务字节范围。首批档案覆盖一个不超过 4 MiB 的 CRC32 binlog 行事务。命令通过复制连接读取原日志，逐事件校验 CRC32，核对 GTID、偏移和提交位置。终端输出为摘要和元数据。

```sh
java -jar rivomesh.jar review-source /etc/rivomesh/tasks/pipeline.yml --verify-contents
java -jar rivomesh.jar review-source /etc/rivomesh/tasks/pipeline.yml \
  --retain-contents /var/lib/rivomesh/source-evidence
```

留存前在支持硬链接的文件系统创建操作员专用的 `0700` 目录。每份 `0600` 归档保存审阅信息、断点哈希和原始二进制事件。重复保留相同证据会复用按 SHA 命名的文件。原事件包含业务行值，应按证据保留和备份策略保护该目录。两个命令均保留原采集断点。[实库验收](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#retained-mysql-binlog-contents)

### 从管理界面留存

管理员审阅原生事务边界后，可以选择 **留存原始事务**。分离模式下，持久命令由任务所属 Agent 执行，关联审阅的边界哈希、配置修订和采集错误代次。操作回执提供文件名和归档 SHA-256。二进制事件保存在 Agent 私有的 `capture-evidence/<taskId>` 目录，每个任务的归档预算为 256 MiB。采集断点和故障状态维持原值。使用同一请求重试时，各管理入口返回同一回执。

使用 API 时，为 `POST /api/tasks/{id}/actions` 提供 `X-Request-ID` 及审阅时的值。

```json
{
  "action": "CAPTURE_RETAIN",
  "expectedRevision": "<任务修订>",
  "errorCount": 4,
  "boundaryHash": "<nextTransactionHeaders.boundaryHash>"
}
```

通过全局任务控制新留存的归档还附带私有认证回执。原 Agent 将原始文件名、字节数和 SHA-256 与原目录身份、任务、配置指纹、日志代次、断点、故障代次和已审阅边界一起签名。原 Agent 先发布回执，再发布原始文件。若两步之间中断，重试须重新读取原 binlog，并确认字节完全一致。请在同一套私有访问控制下备份归档、回执和 Agent 本地密钥。既有归档可继续按原有流程审阅。具备可验证回执的归档可通过[迁移保管核验](/docs/zh/reference/global-control.html)检查。执行迁移与恢复操作仍需单独授权。

实库验收使用一笔超过配置行数上限的 MySQL 8.4.13 完整行镜像事务。原 Agent 留存原始字节，经审批提高上限后按同一 GTID 回放。两个 SQL 目标与源数据一致，日志代次、指纹和快照 ID 保持一致。任务排空后，候选 Agent 核验独立挂载的原始归档。保管核验显示原任务持有者，并返回 `executionAuthorized: false`。

原 Agent 和候选 Agent 核验同一个原始归档后，在交接准备中点击 **暂存报告和回执**。Controller 核验准备记录并将原始归档的描述发给绑定候选。候选把原始 ZIP 和密封绑定写入私有的 `handoff-raw-staging` 目录。API 返回 `rawCapture`，界面显示已核验的归档数量。共享挂载不可用时，可从任一 Controller 重放同一暂存请求，直接核验候选的密封副本。原 Agent 保管 HMAC 密钥。暂存后任务归属与源断点仍在原审阅状态。

使用 PostgreSQL 管理写入者时，提交已准备的归属交接可将相同 ZIP 发布到候选的私有 `handoff-adopted` 历史目录，此时 Worker 保持停止。管理员持有任务和两个 Agent 的访问权限后，可从任一 Controller 请求 `GET /api/tasks/{taskId}/handoff/raw-history` 查看归档摘要、大小、捕获数量及接收摘要。接口核验候选的私有副本。候选重启后，即使共享挂载不可用，仍可查询。原 Agent 保管原归档、回执及 HMAC 密钥。接收的归档供历史查询。跳过事务、写入目标和启动 Worker 各自需要授权。任务同时保留签名故障记录时，可用同一份准备暂存两类历史。提交后，两个历史接口返回同一个接收摘要。 [故障历史交接](/docs/zh/reference/failure-evidence.html)

### 批准跳过源事务

留存成功后，在操作回执中选择 **审阅源事务跳过**。核对单笔 GTID、受影响表和全部受影响目标，填写原因并确认影响。跳过后任务保持暂停。

该档案要求同一 binlog 文件内完整提交的行事务，并已留存通过校验的原始字节。受影响的映射表须为已完成快照且具有主键的 InnoDB 表，目标须使用事务型 SQL。无主键表、其他目标协议、未完成快照或无法重新验证的边界，应恢复原源或制定重建方案。MySQL 已清理所需日志时，保留现有归档，并恢复日志或切换到持有所需历史的合格源。

成功后，日志库记录排除回执并把该 GTID 添加到采集断点。各目标确认序号保持原值。执行 **修复后恢复** 可继续投递后续事务，受影响目标的连续应用序号仍止于源缺口。重启 Agent 后可用 **查看源事务缺口** 查询回执。业务接管前应补齐受影响表并核对共同点，历史排除回执仍保留。

通过 API 操作时，将 `CAPTURE_EXCLUDE` 发到同一个 actions 路由，带上 `X-Request-ID`、`expectedRevision` 和计划中对应的 `errorCount`。在 `captureExclusion` 中填写 `boundaryHash`、`archiveSha256`、`planHash`、`reason` 和 `acceptDataLoss: true`。管理员可用 `GET /api/tasks/{id}/capture-exclusions?limit=20` 查询回执，下一页以 `after` 传入返回的 `nextCursor`。
