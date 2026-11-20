---
kind: docs
locale: zh
title: "OIDC 单点登录"
sourcePath: docs/zh-CN/oidc-login.md
---

# 使用组织账号登录

[English](/docs/en/reference/oidc-login.html)

Rivomesh 支持通过一个 OpenID Connect（OIDC）身份提供方登录共用 HTTPS 入口的 Controller。组织身份须明确绑定到已有的 Rivomesh 账号。角色、任务权限和节点权限均由共享账号目录决定。身份提供方传入的邮箱、用户名、角色和用户组都不会授予 Rivomesh 权限。浏览器令牌登录和 Bearer API 仍可使用。

## 配置身份提供方和 Controller

在身份提供方注册机密客户端，启用授权码流程、PKCE S256、`client_secret_basic` 以及 `RS256` 签名。登记确切的回调地址，例如 `https://sync.example.gov/auth/oidc/callback`。绑定使用提供方向该客户端签发的、区分大小写的稳定 `sub`。同一个用户在不同 OIDC 客户端的 pairwise subject 可能不同。授权端点和令牌端点必须是与 issuer 同源的固定 HTTPS 地址。通过可信的管理通道取得提供方当前使用的 `kid` 和 RSA 公钥。[OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html)、[OAuth 2.0 安全最佳实践](https://www.rfc-editor.org/rfc/rfc9700.html)

以可运行的[全局共享控制配置](/docs/zh/reference/global-control.html)为基础。在新建绑定前，先把所有成员升级到支持外部身份绑定的版本。为承接登录路径的 Controller 配置相同的 OIDC 参数和外部站点地址。控制库账号须允许初始化共享表 `rmc_oidc_attempt`。Agent 无需配置 OIDC 或组织身份密钥。

```yaml
sessions:
  enabled: true
  secureCookie: true
  publicOrigin: https://sync.example.gov
oidc:
  issuer: https://identity.example.gov/tenant
  authorizationEndpoint: https://identity.example.gov/tenant/authorize
  tokenEndpoint: https://identity.example.gov/tenant/token
  clientId: rivomesh-console
  clientSecret: "${RIVOMESH_OIDC_CLIENT_SECRET}"
  keyId: provider-rsa-2026
  rsaPublicKey: BASE64_DER_SUBJECT_PUBLIC_KEY_INFO
```

`rsaPublicKey` 使用 2048–4096 位 RSA 公钥的 DER SubjectPublicKeyInfo 标准 Base64，去掉 PEM 首尾行和空白。Linux 和 Docker 通过 Controller 进程环境配置客户端密钥。手动 Kubernetes 将平台配置放入 ConfigMap，再通过 Pod 的 `secretKeyRef` 注入 `RIVOMESH_OIDC_CLIENT_SECRET`。使用 Helm 时，在全局控制配置基础上设置 `sessions.publicOrigin` 和 `oidc.enabled=true`，其他 OIDC 参数沿用以上名称。通过 `oidc.existingSecret` 和 `oidc.clientSecretKey` 引用 Kubernetes Secret。

在同一 HTTPS 入口转发 `/`、`/auth/oidc/*` 和 `/api/*`。避免入口访问日志保存回调的请求参数。确保 Controller 能通过 JVM 信任的证书链访问提供方，且各节点时钟同步。启用后登录页出现 **使用组织账号登录**。也可书签访问同一域名下的 `/auth/oidc/start`。

## 绑定和撤销

使用管理员账号进入控制台的 **账号与授权**。在已有账号上选择 **绑定组织身份**，填写组织身份提供方为此客户端签发的、区分大小写的 subject。表单显示当前 issuer，预览仅显示是否填写了 subject。绑定后，账号卡片显示 issuer 和主体摘要。需要变更时选择 **替换组织身份**，也可使用 **撤销组织身份** 移除绑定。提交成功后请重新登录。

当前 Controller 停用组织账号登录后，仍可查看和撤销已有绑定。目录修订冲突时，先刷新账号并重新核对。提交结果不明时，如果会话仍有效，可原样重试以沿用同一请求 ID。如果会话已经失效，请重新登录后查看账号卡片。

### API

1. 使用现有 Rivomesh 管理员账号登录，创建或核对本地账号的角色、任务权限和节点权限。
2. 通过 `GET /api/accounts` 取得当前目录修订值。
3. 调用 `PUT /api/accounts/{accountId}/external-identity`，提供新的 `X-Request-ID`、目录修订、确切 issuer 和 subject。使用管理员浏览器会话时，须提供对应的 `Origin` 和 `X-CSRF-Token`。管理员也可用 Bearer API 认证操作。
4. 撤销时向同一路径发出 `DELETE`，提供新的 `X-Request-ID`，请求体只包含 `expectedRevision`。本地账号和令牌仍可登录，也可独立停用或轮换。

绑定请求体示例

```json
{
  "expectedRevision": "current-directory-revision",
  "issuer": "https://identity.example.gov/tenant",
  "subject": "subject-issued-to-this-client"
}
```

管理员在账号列表 API 可查看 issuer 和 subject 的 SHA-256 摘要。一个提供方身份只能绑定一个账号。绑定、替换和撤销按共享目录修订规则使所有 Controller 的旧浏览器会话失效。管理员操作记录为 `ACCOUNT_EXTERNAL_BIND` 和 `ACCOUNT_EXTERNAL_REVOKE`。登录回调成功后，审计可追踪本地账号，授权码、令牌和 subject 不写入审计。

## 常见问题

- **OIDC_LOGIN_DENIED**。从 Rivomesh 登录页重新开始。发起登录的浏览器须在五分钟内使用一次回调。新尝试仍失败时，核对确切 issuer、用户 subject、ID Token 的受众、签名公钥和本地账号状态。
- **OIDC_PROVIDER_UNAVAILABLE**。检查每个 Controller 到固定令牌端点的连通性和 JVM 证书信任，恢复后重新发起登录。已消费的回调不能重试。控制库不可用时返回 `CONTROL_STORE_UNAVAILABLE`。
- **ACCOUNT_EXTERNAL_IDENTITY_CONFLICT**。在共享目录核对已有绑定，明确撤销后再绑定给另一个账号。
- **组织账号停用或已退出**。要立刻撤销 Rivomesh 会话，请撤销本地的外部绑定或停用本地账号。会话以 ID Token 到期时间和 Rivomesh 会话期限中较早者为准。Rivomesh 退出结束本地会话。此档案不接收提供方的退出通知，也不会定期反查组织会话。
- **提供方轮换签名密钥**。协调所有 Controller 更新固定的 `kid` 和公钥后重启。配置切换期间已发起的登录从头开始。此档案采用固定端点与公钥，配置不自动发现或轮换。过渡时仍可使用本地令牌登录。

原 H2 模拟档案覆盖异常签名、一次性 state 和跨入口撤权。真实 Keycloak 26.7.4 也已在两个共享 PostgreSQL 的 Controller 和同一 HTTPS 入口通过。Chrome 从 A 发起登录，再经 B 完成 PKCE S256 回调。签名中的提供方管理员角色不改变本地 Viewer 和任务/节点权限。在 B 撤销绑定后，两个入口都拒绝原会话。[实库验收](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#native-keycloak-login-across-two-controllers) · [复验脚本](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/keycloak-oidc/README.md)
