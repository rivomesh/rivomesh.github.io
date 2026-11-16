---
sourcePath: docs/zh-CN/account-management.md
---

# 本地账号、角色、任务授权与令牌恢复

English：[Account management](/reference/en/account-management.html)。任务授权语义见[任务授权](/reference/zh-CN/task-authorization.html)，审计见[安全审计](/reference/zh-CN/security-audit.html)。

## 当前能力与管理入口

管理员登录后打开“账号与授权”。界面支持新增账号、修改角色和任务范围、停用/重新启用、轮换访问令牌、删除账号。VIEWER/OPERATOR 无权调用账号管理 API。这里是本地 Bearer 令牌身份，不是密码登录或 OIDC；外部身份提供商仍待实现。

角色继续使用 VIEWER（查看授权任务）、OPERATOR（查看并操作授权任务）、ADMIN（全局管理）。指定任务列表为空意味着没有任务权限；“所有当前及未来任务”对应 `taskIds: null`。ADMIN 必须全局授权，不能加任务范围。界面保留暂未加载的任务 ID，允许提前授权；不接受通配符。

最后一个允许登录的 ADMIN 不能被停用、删除或降级。删除是保留审计身份的软删除：原令牌失效、该 ID 不能重新分配，历史记录不消失。停用账号可重新启用。账号目录最多200个身份（含删除保留），每人最多10000个精确任务 ID；不是外部目录服务的容量承诺。

## 配置管理与界面管理

默认 `accessMode: CONFIG` 保留原部署行为：每次启动读取平台配置中的 `authToken`/`users`，令牌支持环境变量。账号页面先展示这些身份，不能直接修改。核对列表并勾选说明后点击“启用界面管理”，才把当前身份和授权转入持久目录。

启用后，目录位于控制目录的 `controller.json` 中，权限由该目录决定。即使配置仍写 CONFIG，重启也不会用旧配置中的令牌/范围覆盖已启用的目录；改变 Secret 或环境变量不会自动撤销或重置托管身份。日常修改使用界面/API。部署配置还会执行格式检查，不能保留非法角色、重复配置身份或缺失的必要引用。

如需去掉旧引导凭据，初始化后可换用 [platform-managed.yml](/reference-files/config/platform-managed.yml)：`accessMode: MANAGED`，省略 `authToken/users`，保持原控制/任务目录。空数据目录没有管理员时会拒绝启动，不会创建匿名管理员；不能把它当首次安装配置。

Linux/Docker 继续使用原持久目录。Helm 已提供 [values-managed.yaml](/reference-files/deploy/helm/rivomesh/values-managed.yaml)，对应[原生 Kubernetes 清单](/reference-files/deploy/kubernetes/rivomesh-managed.yaml)。该配置不再注入引导令牌 Secret，需要已初始化的控制目录及匹配审计库；新建空 PVC 不能恢复身份。真实 Kubernetes/CSI 验收尚未完成。

## 令牌的生成、轮换与不确定结果

界面用浏览器随机源生成32字节随机令牌。先保存新令牌，再勾选确认并提交；预览不包含令牌，服务端列表、审计和响应不返回令牌或摘要。新账号/轮换令牌要求32–4096个可见 ASCII 字符；兼容引导令牌仍沿用至少24字符规则。建议使用生成按钮，不自行编写低熵令牌。

服务端只把 SHA-256 摘要写入持久账号记录，认证使用摘要比较。未新增浏览器持久凭据存储；关闭编辑、关闭账号窗口或退出会清空令牌输入。传输和访问令牌保护继续遵循[部署安全说明](/reference/zh-CN/console-and-deployment.html)。

轮换提交后旧令牌立即不能用于新请求。修改自己的令牌成功后，页面用新令牌继续认证；自己的停用/删除会退出会话。角色与授权在后续请求刷新，已接受的异步任务可能继续，撤销用户不等于暂停数据流。提交任务控制时还会检查授权版本，过期请求返回 `AUTHORIZATION_CHANGED`。

如果响应丢失，界面保留请求标识和未改变的正文供重试；服务端保存最多500个账号变更回执，旧版本正文不会在回执过期后越过版本校验重做。自己的轮换若已提交但响应丢失，旧令牌会失效，应使用事先保存的新令牌重新登录；不要因为登录失败就删除目录或修改同步断点。

## 并发、持久化与审计

所有变更携带目录 `expectedRevision` 和 `X-Request-ID`。其他管理员先修改时返回 `ACCOUNTS_REVISION_CHANGED`，需要刷新、重新核对。已处理的相同请求不重复应用；同一标识不能用于另一正文或身份。未知请求字段和非法任务范围拒绝处理。

账号变更、版本和审计待写事件原子保存到控制状态，再写入审计链及独立账号版本锚点。审计不可用时管理请求失败，已提交事件通过待写记录恢复，不返回虚假的回滚承诺。账号审计记录包含操作者、动作、目标账号与版本，不含令牌。审计界面“任务 / 账号”显示变更对象。

旧审计记录导出保留原载荷与哈希，不因新增字段改写历史。这里的版本2只指 controller.json 格式，与任务配置 formatVersion 或同步数据检查点版本无关。启用托管目录后控制状态升级为版本2，旧程序会拒绝读取；不能简单替换旧 JAR 回滚。账号目录缺失，或与审计版本锚点不匹配，会拒绝启动，不回退为旧配置身份。完整备份应协调控制状态、审计库及配置版本存储；同时回退全部存储可能恢复旧权限，当前没有外部不可变锚点来识别任意一致旧备份，恢复后需复核撤销与令牌状态。

## 全部管理员令牌丢失时

这是服务主机上的离线恢复，不是无认证 HTTP 后门：

1. 停止控制服务，保持数据卷和文件完整，不删除审计或控制状态。
2. 准备平台配置，指向原控制/任务目录；在 `authToken`（对应 `legacy-admin`）或 `users` 中配置一个明确的 ADMIN 身份及令牌，建议环境变量提供随机令牌。
3. 运行：

   ```bash
   java -jar rivomesh-app-0.1.0-SNAPSHOT.jar recover-access config/platform.yml legacy-admin
   ```

4. 命令取得控制目录独占锁，仅恢复选定配置管理员，保留其他账号和任务意图，写入 `ACCOUNT_RECOVER` 审计；不会启动 Worker。控制服务仍运行时会拒绝执行。
5. 启动服务，用恢复令牌登录并核对目录与审计。配置中的其他令牌不会因此全部重新启用。

缺失/损坏的账号目录、审计不匹配不属于单纯令牌丢失，命令不会绕过验证；先恢复协调备份并核对版本，不手工降级状态版本。

## API

所有接口仅 ADMIN 可用；写请求需要 JSON、`X-Request-ID` 和 `expectedRevision`。

| 方法与路径 | 正文（除 expectedRevision 外） |
|---|---|
| `GET /api/accounts` | 返回模式、版本和脱敏身份列表 |
| `POST /api/accounts/activate` | 无；显式转为持久账号管理 |
| `POST /api/accounts` | id、role、enabled、taskIds、token |
| `PUT /api/accounts/{id}` | role、enabled、taskIds；不接受 token |
| `POST /api/accounts/{id}/token` | token |
| `DELETE /api/accounts/{id}` | 无；保留身份的软删除 |

常见409：`ACCOUNT_LAST_ADMIN`、`ACCOUNTS_REVISION_CHANGED`、`REQUEST_ID_REUSED`、`ACCOUNT_EXISTS`、`ACCOUNT_TOKEN_COLLISION`。停用/旧令牌认证为401，无账号管理权限为403，无授权任务路由继续返回404。

## FAQ 与验收边界

**配置里的旧管理员令牌还能应急登录吗？** 托管模式不会因重启复活旧令牌。需要按离线恢复流程显式恢复选定管理员。

**删除用户会停止其创建的数据流吗？** 不会。用户权限与持久任务执行意图分开；需要暂停数据流时由有权操作的身份执行暂停。

**如何撤销所有任务权限？** 选择“指定任务”，清空全部勾选和其他任务 ID，保存。不要选择“所有当前及未来任务”。

**能滚回旧程序吗？** 托管控制状态版本2不供旧程序读取；旧程序拒绝是保护措施。同步数据检查点格式没有因账号功能改变，但控制平台回滚需要单独迁移方案。

Java8实际发布包已通过旧版本审计升级/哈希、强杀续存、旧/缺失账号目录拒绝、旧程序拒绝、离线恢复与独占锁；真实 MySQL→PostgreSQL 用例通过运行期间撤销授权、轮换令牌及控制器重启后不复活权限，且流代次/快照/CDC保持，见[验收记录](/reference/verification/2026-11-15-accounts/README.html)。这不代表 OIDC、密码/MFA、分布式身份目录、多控制器同时写入或真实K8s集群已经完成。

浏览器登录保持、退出及目录变更后所有会话失效的策略见[浏览器会话](/reference/zh-CN/browser-sessions.html)。
