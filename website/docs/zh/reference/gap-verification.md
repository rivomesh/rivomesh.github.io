---
kind: docs
locale: zh
title: "数据缺口复核"
sourcePath: docs/zh-CN/gap-verification.md
---

# 数据缺口核验

[English](/docs/en/reference/gap-verification.html) · [事务跳过](/docs/zh/reference/transaction-skip.html) · [首版配置](/docs/zh/reference/first-release.html)

当前实现 PostgreSQL/MySQL 事务目标的计划、审批、重新扫描及持久凭据。核验不会补数据，不会重新应用跳过事务，也不会自动恢复同步。

## 界面操作

1. 先处理数据差异，再执行新的完整共同点对账。必须使用已完成、源数据已封存且结果为 MATCH 的报告；旧报告不能直接证明当前目标数据正确。
2. 在报告中点击“选择缺口并生成核验计划”，选择目标及未核验缺口，填写原因和最长执行秒数。单计划最多100条缺口、1000张受影响表；默认300秒，可配置1至86400秒。
3. 等待计划生成，在“事务恢复与数据缺口”打开计划。审阅目标、报告、共同点、表名、源行数、内容摘要、缺口集合与执行时限；表范围按50张分页。
4. 确认核验范围及“目标仅由同步服务写入”，填写审批原因，再点击“确认范围并重新核验”。仅管理员可以操作；202表示命令已接受，需继续查看最终结果。
5. 成功后查看 `VERIFIED_AT_COMMON_CUT` 凭据。它只说明所选表在指定历史共同点核验一致，保留原SKIP历史；任务继续暂停，接管切换还须执行独立检查。

目标有其他应用或管理员直接写入时，不能使用此围栏证明一致。计划创建人和确认人分别记录，不强制必须为不同账号。集群入口可以不同，实际核验在原Agent及其可恢复报告目录执行；不支持通过移动游标替代日志、报告或原始记录。

## API

所有操作要求管理员身份、任务/节点授权和匹配的 `expectedRevision`。浏览器会话还需CSRF。命令使用稳定的 `X-Request-ID`；响应丢失时以相同ID和原始请求体重试，不能随意修改原因或范围。

向 `POST /api/tasks/{task}/actions` 提交：

```json
{
  "action": "GAP_VERIFY_PLAN",
  "expectedRevision": "当前任务修订",
  "subscriptionId": "pg",
  "errorCount": 4,
  "gap": {
    "reportId": "已完成报告的UUID",
    "gaps": ["原SKIP计划ID"],
    "maximumMillis": 300000,
    "reason": "已审阅共同点报告及需要核验的完整缺口范围"
  }
}
```

`errorCount` 使用任务状态中的 `error_count`，是整个管道的错误代次，不是单个目标的错误次数。计划ID为该命令的请求ID，可通过 `GET /api/tasks/{task}/gap-verifications/{planId}` 读取计划和凭据。

审阅后提交 `GAP_VERIFY_EXECUTE`，同样指定目标、任务修订及计划中的 `errorGeneration`：

```json
{
  "action": "GAP_VERIFY_EXECUTE",
  "expectedRevision": "当前任务修订",
  "subscriptionId": "pg",
  "errorCount": 4,
  "gap": {
    "planId": "核验计划ID",
    "approvedHash": "GET返回的完整hash",
    "reason": "已确认计划范围并确认目标仅由同步服务写入"
  }
}
```

执行请求不能重新选择缺口、报告或执行时限。取消使用 `GAP_VERIFY_CANCEL`，不附带 `gap` 对象。查看结果沿用任务操作列表及计划读取接口。公开响应不包含业务行值；缺口列表的 `sequence` 和 `next` 是字符串，不能转成JavaScript浮点数。

## 故障与FAQ

| 情况 | 处理 |
|---|---|
| `GAP_LIVE_DATA_DIFFERENCES` | 重新扫描发现目标仍有差异，没有核验成功记录。先处置差异并生成合格报告，再审阅计划。 |
| 任务恢复、共同点/原生断点/schema变化 | 拒绝执行；重新对账并生成新计划，不能修改已保存计划绕过检查。 |
| `GAP_VERIFICATION_PLAN_CHANGED` / `GAP_VERIFICATION_RECORD_CHANGED` | 计划、凭据或关联损坏。恢复一致的持久状态；不会重建空历史。 |
| Agent/网络中断、响应未知 | 查询原计划凭据；相同审批请求可返回已提交结果，不重复扫描或重写记录。未提交的源事务全部回滚。 |
| 请求取消 | 取消是请求，不是回滚证明。看到 `GAP_VERIFICATION_CANCELLED_CHECK_RECEIPT` 时读取原计划；提交可能已经完成。 |
| `hasGaps=true`，但 `hasOpenGaps=false` | 存在SKIP历史，当前统计范围内的缺口均有共同点核验凭据；不表示实时一致。 |
| `gapCountLimited=true` | 数量为有界统计窗口的下界。`hasOpenGaps=null` 表示窗口外是否还有未核验项未知；继续分页查询。 |
| 接受数据丢失是否自动算一致 | 不算。接受跳过只建立缺口；必须重新扫描并匹配完整受影响表，才能追加指定共同点的核验凭据。 |

核验计划、原始SKIP记录及成功凭据保留在源日志元数据中；原生目标回执和业务数据不改写。审阅计划持久保存，核验凭据与全部选中缺口关联在同一源库事务提交；首版元数据结构直接创建，不提供旧开发候选的原地结构迁移。

## 水位含义

| 字段 | 含义 |
|---|---|
| `captured_sequence` | 已捕获的增量日志序号，十进制字符串 |
| `covered_sequence` | 所有目标安全覆盖序号的最小值，包含明确跳过 |
| `subscriptions[].safeCoveredSequence` | 指定目标已经确认覆盖的序号 |
| `subscriptions[].contiguousDeliveredSequence` | 从起点连续未跳过的前缀；止于首个历史SKIP之前 |
| `subscriptions[].firstSkippedSequence` | 首个历史跳过序号；没有跳过则为null |
| `subscriptions[].progressSemantics` | SQL_COMMITTED、BROKER_ACCEPTED或MATERIALIZER_ACKNOWLEDGED |

SQL目标的连续前缀表示已按原顺序提交的投影事务；核验成功不会把原SKIP改成APPLIED。Broker确认不表示消费者完成；物化确认不表示全部副本可见。新进度字段均为字符串以保留超过JavaScript安全整数范围的序号。全量快照完成度使用独立状态，不能由增量序号推断。
