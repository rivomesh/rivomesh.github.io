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

## 跨节点取消与恢复

在任一管理入口打开任务，从「事务恢复与数据缺口」选择「请求取消恢复操作」。按钮关联一条原请求，适用于补偿预览、补偿执行和手工修正执行。管理员也可以向同一操作接口提交 `RECOVERY_CANCEL`，请求体包含当前 `expectedRevision` 和原操作的 `parentRequestId`，请求头使用独立的 `X-Request-ID`。取消接口的成功响应表示已受理。最终状态以原操作为准。

| 原操作状态 | 处理 |
|---|---|
| `CANCELLED_BEFORE_DISPATCH` | 任务尚未下发。查阅取消审计和原请求。 |
| `RECOVERY_CANCELLED` | 运行中的预览已停止，或目标库已确认原写入没有提交回执。修复原故障后可以重新预览并审批。 |
| `RECOVERY_CANCEL_RESOLVING` | 执行节点正在只读核对原回执。恢复目标连接，等待原请求给出结果。 |
| `COMPENSATION_COMPLETED` 或 `CORRECTION_COMPLETED` | 目标已经提交。打开原操作的回执检查范围、摘要和断点。 |

取消和重启都保留任务的暂停状态及日志 ACK。控制节点断开后，可在另一入口查阅原请求。执行节点异常退出后，使用原 Agent 私有目录启动，服务自动恢复挂起的请求。已提交的业务变更和目标回执出自同一事务，重启按原请求读取原凭据。未提交的事务由目标库回滚，随后按原审批内容重试，或按已接受的取消请求核对回执。缺口记录和接管审批仍按各自流程处理。
