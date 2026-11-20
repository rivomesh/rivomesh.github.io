---
kind: docs
locale: zh
title: "受控事务跳过"
sourcePath: docs/zh-CN/transaction-skip.md
---

# 完整事务跳过与缺口恢复

目标数据偏离导致应用故障时，可以先审阅[事务补偿](/docs/zh/reference/transaction-compensation.html)。

事务跳过和缺口核验已有实测档案，涵盖 MySQL 8.4 源、原 Agent 与 LOCAL 日志、PostgreSQL 业务目标以及 PostgreSQL/MySQL 控制库。早期记录使用 Java 8，首版的构建和运行版本为 Eclipse Temurin 21 LTS。MySQL 目标原生合同已通过，完整公开跳过矩阵及其他目标仍待补验。共享任务集群需显式启用事务跳过，管理员须保存完整证据并明确审批。[证据](/docs/zh/start/verification.html) · [English](/docs/en/reference/transaction-skip.html)

缺口核验API和界面已接入；原生PG/MySQL各54项合同通过，PG/MySQL控制库各27项真实同步链路检查通过。操作步骤、审批、取消和状态含义见[缺口核验手册](/docs/zh/reference/gap-verification.html)。

## 适用范围

目前限定MySQL源、事务型PostgreSQL/MySQL目标、已经持久保存原始及规范化内容的下一笔完整增量事务。目标只能由同步服务写入；表结构、快照、归属及依赖检查必须通过。不能拆分跨表事务，也不能用于全量快照、采集/解码失败、未知事务边界或其他目标产品。

先处理根本故障。源binlog丢失应恢复日志、切换合格源或重新建立基线；不能用本功能直接改GTID。若目标已提交原事务，应使用[提交确认](/docs/zh/reference/commit-acknowledgement.html)，不能标为未应用后跳过。

跳过不执行该事务的业务DML，只对选定目标记录明确的SKIPPED凭据及缺口，并推进其确认进度。源日志及其他目标ACK不改写。该目标以后可能因缺失行、无主键身份或业务依赖而再次失败；继续同步不等于数据一致。

## 界面操作

1. 暂停整个任务并等待目标围栏完成。只暂停某个目标不足以授权操作。
2. 对失败目标重新保存事务审阅证据，打开证据并检查完整原始/规范化事件、目标与位置。旧观察不能替代执行时验证。
3. 核对结果须为目标断点未前进、故障为TARGET_APPLY，且epoch、错误版本及ACK与当前状态相符。不存在跳过按钮时先检查能力开关、状态和证据，不要修改元数据绕过保护。
4. 填写8至1000字符的原因，明确勾选接受该事务的数据缺口，然后提交。仅ADMIN可执行；202只表示接受，需查看最终操作结果。
5. 成功后任务和目标保持暂停。查看“事务恢复与数据缺口”及原计划；自行检查下一事务和恢复条件，再显式恢复，不会自动继续。

原操作失败或超时后，从操作记录的计划入口查看原计划。即使原操作是FAILED，也可能已经保存计划或提交目标；不能以FAILED推断目标未提交。

| 原计划状态/只读检查 | 可以执行的操作 |
|---|---|
| PREPARED，尚未检查 | 仅显式只读检查目标；打开窗口不会自动探测或修改目标 |
| PREPARED，COMMITTED | 恢复已提交缺口的日志确认；不能取消 |
| PREPARED，ABSENT | 重新填写原因并明确接受缺口后继续原计划，或填写原因取消 |
| PREPARED，UNKNOWN | 禁止继续、确认或取消，先处理连接、元数据和恢复单元 |
| COMPLETED | 查看历史凭据和缺口；原操作相同参数重放返回原结果 |
| CANCELLED | 查看取消记录；需要重新审阅新错误版本才能另建计划 |

继续、恢复或取消都保留原计划的审批人/原因；原生回执另记实际执行人，日志决议另记后续恢复人。取消仅适用于已证明目标未提交的计划，不推进ACK，不修复原SQL错误，并使旧错误版本失效。

## 四种部署方式与首版基线

所有原控制器和Agent配置一致：

```yaml
cluster:
  sharedAccess: true
  sharedTasks: true
  recoveryReview: true
  recoveryCommit: true
  recoverySkip: true
```

身份、存储、密钥及四种部署方式统一见[首版配置基线](/docs/zh/reference/first-release.html)。控制模式创建后固定，不再提供开发候选之间的自动升级。

首次保存跳过意图时，日志数据格式从3单向升级为4，与PREPARED计划在同一事务提交；顶层任务配置仍为`formatVersion: 3`。格式3到4是当前日志在首次准备跳过时的状态转换，不代表承诺支持旧开发程序。待处理计划阻止恢复，必须先继续、确认或安全取消。格式4的计划/缺口表丢失时拒绝重建空历史；应恢复一致的备份单元。

首次准备跳过时，日志连接需要创建恢复元数据表和回收索引的权限。日常重启和状态查询使用已有表。备份日志时同时保留表结构及索引。

目标原生凭据表与两个可空标记列按受控流程添加；MySQL DDL的隐式提交不代替源日志围栏。需要元数据建表/改表权限。此功能不会自动转换非事务表，不会重建已丢失的目标凭据。

## API

`POST /api/tasks/{task}/actions`使用当前修订和`X-Request-ID`；Cookie写请求还需原有CSRF/Origin。重试同一请求时参数保持完全相同。

```json
{
  "action": "SKIP_TRANSACTION",
  "expectedRevision": "当前任务修订",
  "subscriptionId": "pg",
  "errorCount": 1,
  "skip": {
    "evidenceId": "11111111-1111-1111-1111-111111111111",
    "evidenceHash": "审阅返回的64位摘要",
    "reason": "已审阅完整事务并明确接受该目标的数据缺口",
    "acceptDataLoss": true
  }
}
```

后续操作action为`SKIP_RETRY`、`SKIP_RECOVER`或`SKIP_CANCEL`，skip中改用`planId`和`planHash`，不再提交evidence引用。继续必须`acceptDataLoss: true`；恢复及取消必须明确为`false`。该字段必须是JSON布尔值，字符串、数字、NULL或缺失不代表批准。

- `GET /api/tasks/{task}/recovery-plans/{planId}`：原计划摘要，不读业务行。
- `POST .../recovery-plans/{planId}/inspect`，body为`{}`：有时点的只读原生提交核对，不执行DDL或推进断点。
- `POST /api/tasks/{task}/recovery-plans`：`{"subscriptionId":"pg","after":"","limit":20}`。
- `POST /api/tasks/{task}/gaps`：`{"subscriptionId":"pg","after":"0","limit":20}`。

列表最大100条，游标使用返回的`next`；序号/缺口游标使用字符串，不能转换成JavaScript浮点整数。原始行值仍通过授权事务审阅分页获取，不嵌入计划列表。超长源位置会整项省略并给出摘要，不能把截断GTID当作续传位置。

缺口列表的 `journalPayloadRetained` 表示原始和标准化负载是否都在日志中。开放缺口显示 `false`，表示日志中缺少至少一种负载，可使用独立保留的证据归档或一致备份。状态查询只检查记录是否存在。

## FAQ

**目标提交后Agent中断或日志ACK失败？** PREPARED计划会阻止普通恢复；保留同一原计划，在原Agent目录恢复后只读检查。COMMITTED才能恢复缺口确认。重新发起一个无关跳过操作不是恢复方法。

**只读检查UNKNOWN，是否可以强制取消？** 不提供强制取消。目标已提交与未提交的处理不同；连接失败、元数据丢失或备份不一致时不能猜测。

**管理员被停用或换人怎么办？** 待执行命令会重新验证账号修订及ADMIN权限。新的合法管理员可显式重新审批原计划，实际执行人、原审批人和恢复人分别保留。

**什么时候可以回收原始事务负载？** 开放缺口和待决跳过计划会保护该笔事务。所有目标都确认该序号，且该序号的所有缺口均经[共同校验点核验](/docs/zh/reference/gap-verification.html)并验证回执后，日志可以回收原始和标准化负载。原计划、原生回执与缺口历史持续保留。随后普通投递成功或历史报告匹配时，仍保留该笔事务。

**显示RUNNING是否代表数据完全一致？** 不代表。`hasGaps`和界面缺口警告必须一起看；`gapCountLimited`表示计数有上限。恢复与数据一致是不同状态。

**常见拒绝？** `SKIP_DISABLED`表示开关未开；`SKIP_REQUIRES_PIPELINE_PAUSED`要求整体暂停；`SKIP_RECOVERY_PENDING`要求先处理原计划；`SKIP_CHECKPOINT_RECONCILIATION_REQUIRED`应先核对原生提交；`SKIP_NATIVE_COMMIT_NOT_PROVEN`不能恢复确认；`SKIP_ALREADY_COMMITTED`不能取消；`SKIP_NATIVE_CHECKPOINT_CHANGED`/`SKIP_PLAN_CHANGED`必须重新读取并核实恢复单元。非法请求字段返回400 `REQUEST_INVALID`，不会因此接受命令。
