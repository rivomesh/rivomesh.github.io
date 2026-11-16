---
kind: docs
locale: zh
title: "安全审计"
sourcePath: docs/zh-CN/security-audit.md
---

# 安全审计、保留与导出

English：[Security audit](/docs/en/reference/security-audit.html)。审计记录管理 API 和控制器事件，独立于每任务40条操作记录及配置版本历史。

## 记录范围与权限

仅 ADMIN 可以打开“安全审计”、读取及导出。VIEWER/OPERATOR 的读取/导出尝试也记录权限拒绝。普通 API 请求记录 `HTTP_BEGIN` 与 `HTTP_END`，包括认证身份/角色、固定路由分类、已知任务ID、直接连接的对端IP、HTTP状态和安全错误码。未通过认证的身份为空，结果为401；权限/Origin拒绝记录403。健康探针、静态文件不记录。原始URL/查询、Authorization、请求正文、密码、行数据和异常全文不写入审计。客户端请求ID仅保存SHA-256，便于关联而不保留任意请求头内容；不信任代理转发的IP头。

`HTTP_END` 表示响应准备完成，不证明客户端收到响应。202也不证明任务执行成功。任务接受/执行结果通过 `OPERATION_COMMITTED` 记录PENDING和SUCCEEDED/FAILED，关联操作者及操作请求哈希；配置编辑、恢复也记录终态。控制器启动和正常停止单独记录。内部调用没有HTTP身份时不猜测操作者，旧历史不补造归属。CLI同步进程、数据库业务SQL及操作系统行为不属于这份控制台审计。

## 持久性与故障处理

数据位于 `dataDirectory/audit/events.mv.db`，采用H2事务、同步写入、连续序号及SHA-256链。私有审计目录权限0700、数据文件0600；不支持POSIX权限的平台需由ACL保护。控制器启动验证保留链及末尾。控制器注册表绑定审计库身份，审计文件删除/换成新空库时会拒绝启动。停止控制器后协调备份注册表、审计目录、配置版本及同步日志；不要直接复制运行中的H2文件作为一致备份。

开始处理API前先持久化开始事件；失败返回503 `AUDIT_UNAVAILABLE`，不会执行该HTTP请求的管理动作。已经接受的异步结果会与控制状态一起保存到持久待写列表，再写审计。审计提交后、待写列表清除前崩溃，重启按事件ID去重。若结果已提交后审计/注册表清理失败，操作可能已完成：使用原请求ID/版本核对结果，不要改用新请求盲目重复执行。无法记录结束事件时，已有BEGIN仅表明结果待核实。

审计故障不主动终止独立同步Worker；控制台管理请求会受阻，健康探针仍反映进程存活。检查私有持久卷的空间、权限及备份。哈希链损坏或审计身份改变时，恢复一致备份，不能删除审计文件后绕过检查。

## 保留窗口

平台配置 `auditMaxEvents` 默认1000000，范围1000–10000000。Linux/Docker配置直接设置；Helm使用 `--set platform.auditMaxEvents=2000000`，原生YAML调整ConfigMap后受控重启。UI/API返回当前上限及裁剪边界。旧记录在新事件事务中按前缀裁剪，同时保留 `anchorSequence/anchorHash`；不会把新窗口伪装成从零开始。数量上限不是物理磁盘字节配额，仍需监测H2文件和备份空间。频繁状态轮询也产生审计事件，需按实际请求量选择保留量。

分页以 `after/through` 固定窗口，从旧到新，每页默认100、最多1000条。读取时 `after=0` 表示当前保留窗口开头，`through=0` 表示本次读取时的头。后续沿返回的 `next` 和同一 `through` 读取。保留窗口超过旧游标返回409 `AUDIT_HISTORY_EXPIRED`，不能静默漏读；替换/回退导致的范围变化返回409 `AUDIT_HISTORY_CHANGED`。

## 界面与导出

ADMIN点击侧栏“安全审计”，查看序号、时间、身份、路由、任务和结果，点击“下一页”。“刷新保留窗口”开始新的固定窗口。“导出当前页”只导出当前100条及链边界；它不是全部历史。导出与当前页边界不一致时会拒绝下载。退出或关闭清除显示，迟到响应不能恢复旧身份的数据。

完整导出在有Python 3的管理机执行，令牌通过环境传入：

```bash
export RIVOMESH_TOKEN='从安全渠道提供ADMIN令牌'
python3 tools/audit-export.py --url http://127.0.0.1:8080 --output /private/rivomesh-audit.jsonl
python3 tools/audit-export.py --verify /private/rivomesh-audit.jsonl
# 界面单页JSON校验：
python3 tools/audit-export.py --verify-page /private/rivomesh-audit-page.json
```

完整导出使用固定截止序号，逐页校验序号/链/审计库身份/末尾哈希，流式写入0600文件，最后写COMPLETE标记，再发布正式文件。内存随页大小有界，不随总历史增长。禁止覆盖已有文件及跟随HTTP重定向。中断或保留窗口过期时保留 `.partial`，不生成成功文件；重新导出到新文件。导出期间产生的新审计事件不属于该固定窗口。单页校验成功且 `continuation` 非空只证明该页有效，不证明全部历史已导出。

## API

- `GET /api/audit?after=0&through=0&limit=100`：ADMIN查询，返回events、next、storeId及链边界。
- `GET /api/audit/export?...`：相同范围及权限，带JSON附件头；完整导出工具连续读取此接口。

请求查询参数只接受上述三个非负整数，limit为1–1000。查询与导出本身也被审计。

## 安全及验收边界

链和本地注册表可检测普通损坏、缺行和新空库替换，不能抵御可同时重写全部文件、重算整条链或协调回退所有备份的系统管理员。外部不可变存储/签名锚点、跨控制器聚合、账号管理及其审计仍待完成；精确任务授权见[授权手册](/docs/zh/reference/task-authorization.html)。请将导出及其截止哈希保存到独立受控位置；本功能不等于外部不可变合规审计系统。实际验证范围见[验证记录](/docs/zh/reference/validation.html)。

本地账号变更记录 ACCOUNT_COMMITTED，包含目标账号 subjectId 与目录版本；界面显示“任务 / 账号”。账号变更与审计待写记录原子保存，目录版本另有持久锚点，审计保留清理不删除该锚点；旧载荷导出保留原字节/哈希，见[账号管理](/docs/zh/reference/account-management.html)。外部不可变锚点仍待完成。
