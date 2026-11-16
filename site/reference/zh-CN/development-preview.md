---
sourcePath: docs/zh-CN/development-preview.md
---

# Docker 开发预览

项目提供一个持续用于功能查看的开发实例。它使用独立 Compose 项目 `rivomesh-dev-preview`、独立状态目录和本机地址 &lt;http://127.0.0.1:18088&gt;。

```sh
python3 tools/dev-preview.py start
python3 tools/dev-preview.py status
python3 tools/dev-preview.py credentials
```

账号为 `admin`，访问密钥保存在 `target/development-preview/credentials.json`。当前登录方式为 Bearer 令牌：在登录页令牌输入框中输入访问密钥，不需要额外输入账号名。文件仅对当前用户开放，不能提交到仓库。

界面直接挂载 `sync-app/src/main/resources/console`，修改后刷新页面即可看到，HTTP 响应禁止缓存。后端与驱动使用完整构建后的 JAR 独立副本，不直接运行 Maven 正在改写的产物。每次后端构建成功后发布：

```sh
python3 tools/dev-preview.py update
```

更新会校验并复制 JAR、记录 SHA-256，然后重建自己的容器并验证健康状态和管理员登录。界面源码和后端可能暂时处于不同开发阶段；查看能力目录的实验/规划状态。这个实例不表示全部产品或场景已经通过验收。开发中配置与数据格式可调整；更新重启可能短暂中断访问。

持久状态位于 `target/development-preview/state`，重新部署保留账号及任务状态；清理整个 `target` 会同时删除开发状态和访问密钥。`stop` 只停止容器，不清理数据：

```sh
python3 tools/dev-preview.py stop
```

Docker 设置 `restart: unless-stopped`。Docker Desktop 启动后恢复此前运行的容器；主动 `stop` 的实例需要重新 `start`。在此容器中连接宿主机数据库应使用 `host.docker.internal`，而不是 `127.0.0.1`。源 MySQL 仍需满足 GTID、ROW/FULL 等配置条件，创建任务后先执行配置检查。

[English](/reference/en/development-preview.html)


临时验收容器按用完即删处理，不再为复用长期保留；当前管理界面预览和正在运行的构建/验收容器例外。清理仅针对本项目资源，不使用全局 prune 删除其他服务。
