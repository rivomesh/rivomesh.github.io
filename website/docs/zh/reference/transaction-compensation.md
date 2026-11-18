---
kind: docs
locale: zh
title: "失败事务补偿"
sourcePath: docs/zh-CN/transaction-compensation.md
---

# 失败事务补偿

[English](/docs/en/reference/transaction-compensation.html)

事务补偿用失败事务的完整前镜像还原目标受影响行，适用于下一个待应用事务因目标数据偏离而失败的情况。首批实现面向 PostgreSQL 和 MySQL 事务目标。启用现有的事务跳过能力配置后，管理员可在同一个恢复入口使用预览与审批。

1. 暂停整个任务，确认目标库暂停围栏生效。重新采集失败证据，检查故障阶段为目标应用且原事务尚未提交。
2. 在失败证据窗口选择「生成事务补偿预览」。预览列出受影响表、行标识数量和增删行数。对于要恢复原值的行，预览会列为删除当前行并插入原值。
3. 在「事务恢复与数据缺口」选择「审阅事务补偿计划」。核对范围，填写原因，勾选确认后执行。
4. 操作结果显示「补偿已提交」后，按目标及任务状态显式恢复同步。原事务随后由常规同步重放。

预览覆盖一个目标和一个完整事务，最多 1,000 个受影响标识。按源事务顺序折叠同键修改、主键移动和插入删除链。无主键重复行使用证据中的 ROW_ID。重新读取目标时沿用对账的 JSON、数值与时间类型规则。

确认后会复查目标行和断点。数据变化时重新预览。若原事务已在目标提交，先恢复该提交的日志确认。表有触发器、外键或受限制的结构时，需要独立处理依赖后再评估。目标连接使用已有对账修复所需的依赖可见权限。

通过 `POST /api/tasks/{task}/actions` 提交 `COMPENSATION_PLAN` 或 `COMPENSATION_EXECUTE`。请求带 `X-Request-ID`、`expectedRevision`、`subscriptionId`、目标的 `errorCount`，以及 `compensation.evidenceId` 和 `compensation.evidenceHash`。执行还需 `compensation.approvedHash` 与 `compensation.reason`，摘要取自预览操作结果的 `hash`。响应未知时，查询操作历史，或使用同一请求 ID 和原始请求体重试。目标行和凭据在同一事务提交，随后任务保持暂停。
