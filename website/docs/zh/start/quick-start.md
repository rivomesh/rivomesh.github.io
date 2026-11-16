---
kind: docs
locale: zh
title: 快速开始
---

# 快速开始

本指南使用 Web 控制台建立第一条 V3 同步链路。建议先准备少量测试数据，只选一个目标，便于判断每一步是否达到预期。

## 1. 准备环境

- Java 8 与 Maven；其他 JDK 的验证档案见[性能与运行时手册](../reference/performance)。
- 一个符合 GTID、ROW/FULL 行镜像等要求的 MySQL 测试源。
- 一个独立 PostgreSQL / openGauss 测试目标，使用空业务表或空 schema。
- 数据库连接账号、网络访问与持久存储。管理 schema 与业务 schema 分开，目标业务表由同步服务独占写入。

::: warning 数据库准备
V3 全量快照需要短时全局读锁及相应权限，读取过程还涉及 MVCC 视图和元数据锁。请由数据库管理员核对日志、复制账号、快照权限及业务影响，完整条件见 [V3 运行手册](../reference/pipeline-v3)。
:::

## 2. 获取源码并构建

```bash
git clone https://github.com/rivomesh/rivomesh.git
cd rivomesh
mvn -s build/settings.xml verify
```

以下命令均在下载的 **rivomesh 目录**运行。

## 3. 启动 Web 控制台

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
java -Xmx128m -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform.yml
```

打开 <http://127.0.0.1:8080>，使用 `RIVOMESH_TOKEN` 登录。此配置适合本机试用；生产访问请按[浏览器会话手册](../reference/browser-sessions)配置 HTTPS、Cookie 与 Origin。不要把令牌提交到 Git、放入 URL 或填写到本站。

也可以从源码构建容器：

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
docker compose -f deploy/docker-compose.yml up -d --build
```

该命令构建本地镜像。容器里的数据库地址应从容器网络视角填写；Docker Desktop 访问宿主机可使用 `host.docker.internal`。

## 4. 创建并检查任务

1. 点击“新建任务”，使用 V3 格式，填写稳定的任务标识与逻辑源标识。
2. 填写 MySQL 地址、库名、账号与复制客户端 `serverId`。这个 ID 应区别于数据库节点和其他复制客户端。
3. 添加一个目标，配置源 database → 目标 schema/database 映射。首次验证使用独立空目标。
4. 单机评估可选择本地日志并预留空间；跨主机续传场景按运行手册配置外部事务日志。
5. 保存后先执行“检查”，查看返回结果，再启动任务。检查不覆盖全部运行时建表与快照权限。

## 5. 核对同步结果

观察快照、目标投递、增量与积压状态。在源测试表插入、修改、删除记录，核对目标的实际字段值。停止并重启 Worker，确认原配置与持久状态能够继续使用。

单个目标的 SQL 错误可能使该目标暂停。先修复权限、类型或表结构等原因，再重试原事务。普通恢复不会自动跳过记录。不要直接修改 GTID、断点或队列表来绕过错误。

## 6. 保存恢复所需资料

备份控制器目录、任务配置、日志和目标状态，给源 binlog 留出足够的停机与积压保留窗口。删除本地日志或目标管理表，可能使已有任务无法安全恢复。

[完整部署手册](../reference/console-and-deployment) · [V3 配置与恢复](../reference/pipeline-v3) · [常见问题](faq)
