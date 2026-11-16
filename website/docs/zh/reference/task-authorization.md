---
kind: docs
locale: zh
title: "按任务授权"
sourcePath: docs/zh-CN/task-authorization.md
---

# 按任务授权

English：[Task authorization](/docs/en/reference/task-authorization.html)。完整示例：[platform-task-scopes.yml](/files/config/platform-task-scopes.yml)。

角色决定可执行的动作，`users[].taskIds` 决定 VIEWER/OPERATOR 可见、可操作的任务。使用精确任务ID，不支持通配符、前缀、数据库名或目标schema匹配。可以预先分配尚未加载的任务ID。

```yaml
users:
  - id: admin
    role: ADMIN
    token: ${RIVOMESH_ADMIN_TOKEN}
  - id: sales-operator
    role: OPERATOR
    token: ${RIVOMESH_OPERATOR_TOKEN}
    taskIds: [sales-migration, orders-migration]
  - id: sales-reader
    role: VIEWER
    token: ${RIVOMESH_VIEWER_TOKEN}
    taskIds: [sales-migration]
  - id: unassigned-operator
    role: OPERATOR
    token: ${RIVOMESH_UNASSIGNED_TOKEN}
    taskIds: []
```

- 省略 `taskIds`（包括旧配置）保留部署内全部任务权限，后续新增任务也可见。显式空列表表示没有任务权限。需要限定权限时务必提供列表。
- VIEWER只读，OPERATOR可检查、启停、暂停及恢复授权任务；授权不允许它们创建、导入、读取/修改配置或读取全局审计。
- ADMIN管理整个部署，不能配置 `taskIds`，避免误以为全局管理接口已经按任务隔离。至少保留一个ADMIN；兼容的 `authToken` 也是全局管理员。
- 重复ID、通配符、路径或非法名称会被拒绝。最多10000个精确授权ID；这不改变平台实际加载任务数上限。

`GET /api/tasks` 仅返回授权任务，聚合计数由过滤后的列表生成。受限账号不返回无效配置文件列表，因为未加载文件无法可靠归属。管理员仍可诊断这些配置。直接访问未授权或不存在的任务均返回404 `TASK_NOT_FOUND`；操作在读取正文前拒绝，不会改变任务版本或执行动作。403仍用于角色本身不允许的接口，例如OPERATOR读取配置/审计。

`GET /api/session` 返回本账号 `taskScope`：数组表示精确授权，null表示未限制。界面显示授权数量，鼠标悬停身份可查看ID。没有已加载授权任务时显示专门说明；退出清空授权提示和任务数据。服务器仍是权限边界，界面过滤不能替代API检查。

## 部署与撤销

Linux/Docker使用上述配置，令牌通过环境提供。授权、角色和令牌在HTTP服务启动时保存不可变快照；改原配置/Secret不会立即影响运行中的服务，需受控重启管理进程。重启后旧授权撤销，不改变同步断点。每次管理请求按当前快照检查，旧请求ID不能绕过新的任务限制。

Helm使用 `deploy/helm/rivomesh/values-task-scopes.yaml`，Secret引用与原RBAC示例相同；手动Kubernetes使用 `deploy/kubernetes/rivomesh-task-scopes.yaml`。这是默认清单/RBAC清单的替代配置，不是额外部署一份同名资源。自定义 `auth.users[].taskIds` 为数组，空列表会渲染为 `[]`；原生清单由相同Chart生成。修改后执行受控重启。真实Kubernetes/CSI验收仍未完成。

授权失败进入全局[审计](/docs/zh/reference/security-audit.html)，由ADMIN查看。本地账号/授权编辑界面已实现，见[账号管理](/docs/zh/reference/account-management.html)；OIDC/SSO、分组及每个动作单独授权仍未完成；管理私有配置仍属于管理员操作。此功能隔离控制台任务访问，不提供数据库账号、OS文件或跨部署令牌隔离，也不意味着控制器已经支持多副本调度。

默认 CONFIG 仍使用启动配置快照；显式启用界面托管后，持久目录管理身份和授权，重启不复活旧配置令牌。授权变更对后续请求生效，已接受的异步操作可能继续。
