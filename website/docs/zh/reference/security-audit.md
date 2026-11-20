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

## 用独立保存的检查点核验审计链

从可信的管理员导出提取已校验的审计库标识、末尾序号和 SHA-256 链摘要。检查点只记录这三项和格式版本。工具校验完整 JSONL 导出后，才创建新的私有检查点文件。

```sh
python3 tools/audit-export.py --verify /private/rivomesh-audit.jsonl \
  --anchor-out /private/rivomesh-head.json
```

把检查点交给独立的审计保管人员，或存入带保留策略和独立权限的外部档案库。选择能让相邻导出窗口重叠的频率。有新增事件或从备份恢复后，从独立档案库取回旧检查点，核对新的审计导出。

```sh
python3 tools/audit-export.py --verify /private/rivomesh-audit-later.jsonl \
  --against-anchor /independent/rivomesh-head.json \
  --anchor-out /private/rivomesh-head-later.json
```

`AUDIT_ANCHOR_MATCHED` 表示同一审计库的导出与可信的序号及摘要一致。该检查点可以对应一个导出事件，也可以正好位于第一条事件之前。校验成功后独立保存新的检查点。末尾回退返回 `AUDIT_ANCHOR_TAIL_ROLLBACK`，历史被改写返回 `AUDIT_ANCHOR_HASH_MISMATCH`，审计库改变返回 `AUDIT_ANCHOR_STORE_CHANGED`。保留窗口越过可信检查点时返回 `AUDIT_ANCHOR_OUTSIDE_EXPORT_WINDOW`，需要用独立留存的中间导出核对连续性。

### 签名检查点

独立的审计保管方可使用 OpenSSL 给检查点签名。示例使用保管方已有的 ECDSA P-256 密钥。首次签名前核实导出的来源及审计库标识。签名私钥在 Rivomesh 和检查点档案之外保管。原始 JSON 字节与分离签名成对保存。[OpenSSL 签名命令](https://docs.openssl.org/3.0/man1/openssl-dgst/)

```sh
openssl dgst -sha256 -sign /custodian/keys/audit-signing.pem \
  -out /custodian/checkpoints/rivomesh-head.sig /custodian/checkpoints/rivomesh-head.json
```

在验证端独立配置信任的 PEM 公钥和预期 `storeId`。这两项取自可信的初始登记流程。从保管方取得最新的可信检查点，再使用 Python 3 和 `PATH` 中的 OpenSSL 核验后续导出。将 `your-enrolled-store-id` 替换为登记的标识。

```sh
python3 tools/audit-export.py --verify /private/rivomesh-audit-later.jsonl \
  --against-anchor /independent/rivomesh-head.json \
  --anchor-signature /independent/rivomesh-head.sig \
  --anchor-public-key /trusted/audit-public.pem \
  --anchor-store-id your-enrolled-store-id \
  --anchor-out /private/rivomesh-head-later.json
```

`AUDIT_ANCHOR_SIGNATURE_VERIFIED` 表示签名有效，且签名检查点与预期的审计库及已核验的导出一致。签名参数缺失、签名无效、公钥错误、审计库改变或签名验证器不可用时，命令失败且不写出下一检查点。核验后可由保管方另行签名。签名检查点认证到其对应序号的历史摘要，后续记录的摘要在保管方签署更新的检查点后获得独立认证。

### 用 S3 Object Lock 留存签名检查点

独立保管方签署已核验的导出末尾检查点后，可通过定时任务运行 `tools/audit-retain-s3.py`。执行环境需要 Python 3、OpenSSL，以及支持 `put-object --if-none-match` 和 `head-object --checksum-mode` 的 AWS CLI v2。应独立登记 AWS 区域、桶名、12 位桶所有者账号、审计 `storeId` 及 PEM 验证公钥。使用已启用 Object Lock 的 AWS S3 通用桶及 IAM 工作负载身份。工具会忽略 CLI 配置中的自定义端点。[AWS S3 Object Lock](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lock.html)

将归档任务的 `s3:PutObject`、`s3:PutObjectRetention`、`s3:GetObject`、`s3:GetObjectVersion` 和 `s3:GetObjectRetention` 权限限制在归档前缀。若使用 SSE-KMS，另行授予任务所需的 KMS 权限。使用桶策略强制归档写入携带 `If-None-Match`。删除、绕过治理保留和桶管理权限应归任务身份之外的角色保管。命令参数、检查点和回执均不携带签名私钥或 AWS 凭据。[条件写入桶策略](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes-enforce.html)

```sh
python3 tools/audit-retain-s3.py \
  --export /private/rivomesh-audit-later.jsonl \
  --checkpoint /custodian/checkpoints/rivomesh-head-later.json \
  --signature /custodian/checkpoints/rivomesh-head-later.sig \
  --public-key /trusted/audit-public.pem --store-id your-enrolled-store-id \
  --region us-east-1 --bucket your-enrolled-audit-bucket --bucket-owner 123456789012 \
  --prefix rivomesh/audit --retain-until 2030-01-01T00:00:00Z
```

为本次归档选定一个未来的 UTC 保留截止时间，与原始签名文件一起保管供重试。Linux 定时器和 Kubernetes CronJob 都可以给每批签名导出执行这一命令。工具写入前核验完整导出、分离签名、审计库标识和末尾检查点，每个审计库的每个序号对应一个带 `COMPLIANCE` 保留和 SHA-256 校验值的对象。写入完成或写入响应丢失后，工具核对 S3 精确对象版本的摘要、保留模式和截止时间，再输出 `AUDIT_CHECKPOINT_RETAINED` JSON 回执。将回执中的对象键和 `versionId` 存入独立目录，对非零退出告警。重试只接受字节一致且保留期限满足要求的版本。内容冲突或版本不可验证时，需要人工核对。[S3 条件写入](https://docs.aws.amazon.com/AmazonS3/latest/userguide/conditional-writes.html) [S3 版本元数据](https://docs.aws.amazon.com/cli/latest/reference/s3api/head-object.html)

恢复时将 `RIVOMESH_ARCHIVE_KEY` 和 `RIVOMESH_ARCHIVE_VERSION` 分别设为回执的 `key` 和 `versionId`，读取回执指定的版本。

```sh
umask 077
aws s3api get-object --region us-east-1 --bucket your-enrolled-audit-bucket \
  --expected-bucket-owner 123456789012 --key "$RIVOMESH_ARCHIVE_KEY" \
  --version-id "$RIVOMESH_ARCHIVE_VERSION" --checksum-mode ENABLED /private/retained-audit.json
```

对象的 JSON 字段为 `formatVersion`、`checkpoint` 和 `signature`。将后两个 Base64 字段解码成原始 JSON 和分离签名，然后按前面的签名检查点流程验证。

### 留存完整审计事件

在同一留存命令中加上 `--retain-events`，把原始 JSONL 导出和签名后的最终检查点存入同一个 `COMPLIANCE` 对象版本。将回执保存在独立的归档目录中。回执包含起始边界（不含）、最终序列、事件数量、SHA-256 和精确的 S3 版本 ID。在本地清理移除上一次已验收断点之后的事件前完成导出。

第一次归档必须包含序列为零的初始边界。后续归档加上 `--previous-checkpoint /custodian/checkpoints/previous.json --previous-signature /custodian/checkpoints/previous.sig`，使用最近一次独立验收的完整归档的签名检查点。上一批的最终序列必须是本批事件，或刚好位于首条事件之前。如果本批起点已经越过该序列，工具会在上传前返回 `AUDIT_ANCHOR_OUTSIDE_EXPORT_WINDOW`。先恢复包含缺口的中间归档或较早的数据库副本，再证明缺失区间。重试使用原导出和原签名文件。

归档对象首行包含检查点及其签名。其余字节是原始 JSONL 导出，包括起始边界和完成标记。每次归档或核验先生成私有临时副本，流式处理内容。单次 S3 PUT 最多 5 GB，上传时限为十分钟。为完整对象预留临时空间，按磁盘、上行带宽和本地审计保留范围安排导出频率。[S3 单次上传校验](https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity-upload.html)

使用前面的 `get-object` 命令下载目录登记的精确对象版本，保存为 `/private/retained-events.jsonl`。离线核验使用独立配置的公钥和库标识。核验滚动归档时需一并提供上一批的检查点和签名。

```sh
python3 tools/audit-retain-s3.py --verify-event-archive /private/retained-events.jsonl \
  --public-key /trusted/audit-public.pem --store-id your-enrolled-store-id
```

将输出中的 `checksumSHA256`、`fromExclusive`、`sequence` 和 `checkpointHash` 与独立回执比对。`AUDIT_EVENT_ARCHIVE_VERIFIED` 表示内嵌签名检查点和每一条事件链路都有效。MinIO 实测覆盖精确版本恢复、锁定、重试、跨批次衔接和篡改识别。AWS 身份和桶策略须在部署环境中核验。

## API

- `GET /api/audit?after=0&through=0&limit=100`：ADMIN查询，返回events、next、storeId及链边界。
- `GET /api/audit/export?...`：相同范围及权限，带JSON附件头；完整导出工具连续读取此接口。

请求查询参数只接受上述三个非负整数，limit为1–1000。查询与导出本身也被审计。

## 安全及验收边界

本地链和注册表可检测普通损坏、缺行和新空库替换。离线核验依赖独立保管的最新可信检查点。签名验证检查点字节，旧检查点的签名也可能仍然有效。S3 在回执记录的到期时间前保护已确认的 `COMPLIANCE` 对象版本。运维方独立维护存储策略及最新可信序号。精确任务授权见[授权手册](/docs/zh/reference/task-authorization.html)，实际验证范围见[验收记录](/docs/zh/start/verification.html)。

本地账号变更记录 ACCOUNT_COMMITTED，包含目标账号 subjectId 与目录版本；界面显示“任务 / 账号”。账号变更与审计待写记录原子保存，目录版本另有持久锚点，审计保留清理不删除该锚点；旧载荷导出保留原字节/哈希，见[账号管理](/docs/zh/reference/account-management.html)。
