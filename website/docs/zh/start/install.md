---
kind: docs
locale: zh
title: 安装与启动
---

# 安装与启动

本页帮助负责部署的人员启动 RivoMesh 控制台。业务使用者如果已经拿到访问地址和账号，可以直接阅读[创建同步任务](create-task)。

## 准备什么

| 项目 | 要求 |
| --- | --- |
| 运行环境 | Java 8、Maven；使用其他 JDK 前先核对兼容性 |
| 数据源 | 可连接的 MySQL，开启 GTID、ROW 格式和 FULL 行镜像 |
| 同步目标 | 支持的数据库或消息系统；首次试用建议 PostgreSQL 独立空 schema |
| 存储 | 为配置、同步日志和管理数据准备持久磁盘 |
| 网络与账号 | 部署机器能访问源与目标；数据库管理员准备相应权限 |

[连接器目录](connectors)列出具体产品范围。源库全量读取涉及短时读锁，请先在测试环境确认影响。

## 方式一：Java 服务

当前版本通过源码构建。以下命令在 RivoMesh 核心项目目录执行：

```bash
git clone https://github.com/rivomesh/rivomesh.git
cd rivomesh
mvn -s build/settings.xml verify
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
java -Xmx128m -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform.yml
```

打开 <http://127.0.0.1:8080>，使用刚设置的 `RIVOMESH_TOKEN` 登录。默认只允许本机访问。令牌应保存到受控的密码管理位置，不能写进公开配置或网址。

## 方式二：Docker Compose

已安装 Docker 的环境可在同一项目目录执行：

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
docker compose -f deploy/docker-compose.yml up -d --build
```

此方式会构建本地镜像。填写数据库地址时，应使用容器能访问到的地址；Docker Desktop 访问宿主机通常使用 `host.docker.internal`。

## 交给其他人员使用前

1. 配置 HTTPS 访问入口，再提供远程访问地址。
2. 按职责准备管理员、操作员、只读账号，避免多人共用管理身份。
3. 确认配置、日志及控制器数据目录挂载到持久存储。
4. 用少量测试数据完成新增、修改、删除和重启恢复验证。

HTTPS、容器持久目录、Linux 服务及 Kubernetes 参数见[部署配置参考](../reference/console-and-deployment)，浏览器登录设置见[会话配置参考](../reference/browser-sessions)。

## 部署多个节点

需要节点状态观察、统一登录或跨主机续传时，先阅读[多节点部署与恢复](multi-node)，分别准备共享控制库、独立节点目录和外部事务日志。

## 接下来

控制台可以正常登录后，进入[创建同步任务](create-task)。启动失败或页面无法打开时，查看[常见故障处理](troubleshooting)。

## 部署模式与探针

单机把控制数据保存在本地持久目录，任务默认使用本地 H2 日志。外部日志可使用 PostgreSQL、openGauss 或独立的 MySQL 实例。共享控制库有 PostgreSQL 17 和 MySQL 8.4 验收记录。控制库与日志各自使用独立命名空间和权限。

`GET /healthz` 检查进程存活，`GET /readyz` 在已配置的控制服务不可用时可返回 503。同步链路应在工作台检查。Dockerfile 默认使用 Java 8 构建及运行，并包含探针。原生 Kubernetes YAML 和 Helm 模板使用预先构建的镜像，真实 Kubernetes / CSI 验收仍待完成。

共享控制示例使用 `RIVOMESH_NODE_ID`、`RIVOMESH_CONTROL_USERNAME`、`RIVOMESH_CONTROL_PASSWORD`。共享任务还需 `RIVOMESH_TASK_KEY`。初始化前选定控制模式，详见[首版部署基线](../reference/first-release)与[部署手册](../reference/console-and-deployment)。
