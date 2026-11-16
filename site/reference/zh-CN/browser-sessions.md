---
sourcePath: docs/zh-CN/browser-sessions.md
---

# 浏览器登录保持与会话恢复

English：[Browser sessions](/reference/en/browser-sessions.html)。规格：RM-SDD-001 的 SE-01/02/03/05；跨控制节点共享会话 SE-04 仍未完成。

## 登录和恢复

仍使用部署令牌或托管账号令牌登录。页面用一次 `POST /api/session` 将 Bearer 令牌换成服务器会话，立即清空输入框；后续通过 HttpOnly Cookie 认证。页面脚本不保存长期令牌，不把会话写入 URL、localStorage 或 sessionStorage。刷新、新标签页和重新打开同一站点时，先 `GET /api/session` 恢复身份、任务范围和 CSRF 凭证，再加载任务；失效时回到登录页。语言偏好仍可写 localStorage。

会话存储有 Store 接口，目前只有有界内存实现。**控制服务重启会清空全部浏览器会话，需要重新登录**；任务、账号和审计仍按各自持久化协议恢复。此功能不代表多控制实例登录连续性，也不能把多个独立控制器放到负载均衡后当成已支持集群。共享控制/会话权威状态将在后续阶段实现。

退出立即清空界面、配置草稿、原始差异及权限，并向服务端撤销当前会话。其他标签页通过 BroadcastChannel 收到退出通知；不支持该接口的浏览器在下次 API 请求/轮询发现失效。登录和退出请求在同一页面串行，避免晚到的登录响应留下有效 Cookie。旧 API 响应不能恢复已清除的界面。服务端未确认退出时显示失败提示，可再次点击退出重试；只清空界面不能当成已经撤销服务器凭证。

## 配置

`PlatformConfig.sessions` 和 Helm 顶层 `sessions` 支持相同字段：

| 字段 | 默认 | 语义 |
|---|---|---|
| enabled | true | 是否允许换取浏览器会话；关闭后 Bearer API 仍可用 |
| secureCookie | true | 生产 Cookie 为 `__Host-rivomesh-session`，要求 HTTPS；HttpOnly、SameSite=Strict、Path=/，无 Domain |
| publicOrigin | 不设置 | 代理后的精确外部地址，例如 `https://sync.example.com`，不含末尾斜线、路径、查询或用户信息 |
| idleSeconds | 1800 | 最后一次通过校验的 API 请求后空闲期限，30～86400 秒；包括页面定时状态请求 |
| absoluteSeconds | 28800 | 从登录起的硬期限；不少于空闲期限，最多 604800 秒；轮询不能延长 |
| rememberBrowser | false | 默认会话 Cookie；true 时设置不超过绝对期限的 Max-Age，浏览器关闭后可保留，服务重启仍失效 |
| maximum | 1000 | 单控制器最大在用会话数，1～10000；创建时清理过期记录，满额拒绝新登录 |

时长和容量是可调整默认策略，不是容量性能承诺。定时轮询会延长服务器空闲时间；如要求无人操作即退出，还需后续的人机空闲策略。浏览器自身的“恢复上次会话”可能保留会话 Cookie，不能用关浏览器代替退出。

生产反向代理示例：

```yaml
sessions:
  secureCookie: true
  publicOrigin: https://sync.example.com
  idleSeconds: 1800
  absoluteSeconds: 28800
  rememberBrowser: false
  maximum: 1000
```

TLS 在代理终止，控制服务本身仍是 HTTP。代理应只允许授权网络到达后端，向浏览器提供 HTTPS；`publicOrigin` 明确外部地址，程序不信任客户端提供的 X-Forwarded-*。不配置时按 `https://Host` 验证浏览器来源。Cookie 写请求必须有精确匹配的 Origin 和正确 `X-CSRF-Token`，缺失或错误均拒绝。

开发预览 `http://127.0.0.1:18088` 及本地示例显式使用 `secureCookie: false`，Cookie 名为 `rivomesh-dev-session`。仅用于 HTTP 开发/本地访问。生产请改为上面的 HTTPS 配置。Helm 默认 Secure；本地 port-forward 预览可显式 `--set sessions.secureCookie=false`，生产指定 `--set sessions.publicOrigin=https://sync.example.com`。原生 YAML 的 ConfigMap 中修改相同字段。

## API 合同和身份撤销

| 请求 | 认证/结果 |
|---|---|
| POST /api/session | 只接受有效 Bearer；返回当前身份、CSRF 凭证及绝对到期时间，通过 Set-Cookie 签发会话；浏览器带 Origin 时须匹配部署配置 |
| GET /api/session | Cookie 返回身份、范围、csrfToken、expiresAt；Bearer 保持原身份视图，不签发 Cookie |
| POST /api/session/logout | Cookie + Origin + X-CSRF-Token；撤销服务端会话并清除 Cookie；任何角色均可退出 |
| 其他 API | Cookie 写请求必须通过 Origin/CSRF，随后继续检查原有角色、任务范围、修订、请求 ID 和审计 |

显式 Authorization 永远按 Bearer 校验，错误时不回退 Cookie；如果有效 Cookie 与有效 Bearer 属于不同账号，返回 409 `AUTHENTICATION_CONFLICT`。同账号显式 Bearer 继续使用 API 规则，不要求 Cookie CSRF。API/CLI 不会因为服务器新增会话而必须改为 Cookie。会话/CSRF 均不写入审计；日志保留账号和操作结果。

当前采用严格的目录修订撤销策略：**任何托管账号创建、修改、启用/停用、删除、令牌轮换或托管激活，都会使该控制器此前签发的全部浏览器会话在下次请求时失效**。这也包括执行修改的管理员，界面会要求重新登录。长期 Bearer 仍按最新目录逐次校验。配置模式更改身份须重启；重启清空会话。已经执行的同步操作不会因退出而撤销，仍按任务操作记录查询结果。

## FAQ 和故障处理

- **刷新又出现登录页？** 检查会话是否达到绝对期限、控制器是否重启、账号目录是否改变，以及浏览器是否允许本站 Cookie。跨控制器轮询当前不受支持。
- **HTTP 页面登录后无法恢复？** 默认 Secure Cookie 不经 HTTP 发送；本地开发显式设 `secureCookie: false`，生产配置 HTTPS。检查是否用了不同主机名或协议，Cookie 不在不同站点之间共享。
- **403 ORIGIN_REJECTED？** 检查浏览器地址与 publicOrigin、TLS 和代理入口；不要通过移除 Origin/CSRF 检查解决。
- **403 CSRF_REJECTED？** 刷新恢复当前会话的 CSRF 凭证，旧页面和已轮换会话的凭证不能重用。
- **修改账号后全部退出？** 这是当前严格修订策略，重新登录即可；被停用/轮换的旧令牌不能继续使用。
- **409 SESSION_CAPACITY_REACHED？** 关闭页面不等于服务端退出；先退出不再使用的会话，等待过期，或按内存预算提高 maximum。重启会清空全部会话，但不是日常容量管理方式。
- **退出提示未确认？** 恢复网络/审计服务后再次退出。需要立即封禁时，由其他管理员停用账号或轮换令牌；这会触发上述目录修订撤销。不要把 API 失败当成成功。

验收覆盖单控制器的真实 HTTP、TLS 代理、到期/撤销、Bearer 冲突及 DOM 竞态；完整浏览器交互/可访问性与多控制节点仍属于后续验收范围。具体结果以本轮归档证据为准。
