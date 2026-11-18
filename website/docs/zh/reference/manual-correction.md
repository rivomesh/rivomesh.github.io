---
kind: docs
locale: zh
title: "手工修正目标行"
sourcePath: docs/zh-CN/manual-correction.md
---

# 手工补数据与修正

[English](/docs/en/reference/manual-correction.html)

管理员可对因目标 SQL 错误暂停的任务补写缺失行、修改目标值或删除多余行。首批实现面向 PostgreSQL 和 MySQL 事务目标，沿用事务恢复的权限和暂停围栏。

1. 暂停整个任务，确认目标围栏生效。保存新的失败证据。目标已提交原事务但日志未确认时，先恢复确认。
2. 在事务证据窗口点击「手工补数据」。选择失败事务涉及的数据表和行操作，填写字段后点击「加入批次」。也可导入 JSON 文件或粘贴批次内容。
3. 点击「预览手工修正」。检查目标、表、行标识、修改前后的值及受影响行数。修改表单或导入内容后重新预览。
4. 填写原因并勾选确认后提交。操作记录显示提交结果。检查目标数据后，再显式恢复任务，让原事务继续处理。

| 操作 | 输入 |
|---|---|
| 新增 | 有键表。填写全部列，包含可空列和目标上物化的生成列 |
| 修改 | 用完整键，或无主键行的原始 ROW_ID 定位。仅填写修改字段 |
| 删除 | 用完整键或原始 ROW_ID 精确定位 |

每批最多 50 行，批次最多 128 KiB，预览行内容最多 512 KiB。键保持固定，批次内每个身份仅允许一条修改。导入及 API 使用 JSON 字符串保留精度，SQL NULL 使用 JSON `null`，JSON 列的 JSON 文本作为字符串传入。

```json
{
  "edits": [
    {
      "tableId": "从 schema 接口取得的 64 位表标识",
      "action": "UPDATE",
      "key": {"id": "9007199254740993"},
      "values": {"balance": "12345678901234567890.1234", "remark": null}
    }
  ]
}
```

`POST /api/tasks/{task}/corrections/schema` 与 `/corrections/preview` 使用当前 `expectedRevision`、目标 `subscriptionId`、失败目标的 `errorCount`，以及 `correction.evidenceId` 和 `correction.evidenceHash`。预览附加 `correction.batch` 或原始的 `correction.importJson`。执行将同一内容提交到任务的 `/actions`，设置 `action: CORRECTION_EXECUTE` 并附上预览 `hash` 作为 `approvedHash`、审批 `reason` 和 `X-Request-ID`。响应丢失时可用相同请求 ID 和原请求体重试。

| 场景 | 处理方式 |
|---|---|
| 断点、任务修订或目标行已变化 | 重新采集并预览，核对变更后再确认 |
| 无主键行有多条相同值 | 从规范化事务证据中获取具体 ROW_ID，仅修正该行 |
| 批次写入或凭据保存失败 | 检查错误及约束，修正输入后重新预览。整个批次在目标事务中回滚 |
| 外键、触发器或目标结构超出支持范围 | 先处理依赖或使用针对该表的独立修复方案 |
| 列值包含精确小数或超出 JavaScript 安全整数范围 | 使用字符串录入，避免先经过浮点转换 |

前后值通过管理员预览接口返回。任务列表和已提交凭据展示表范围、计数和摘要。修改只写目标，提交后源日志、GTID 和确认进度保持原状。
