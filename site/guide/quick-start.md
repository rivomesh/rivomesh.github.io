# 快速开始

本指南先启动 Web 控制台，再通过向导建立第一条任务。建议使用独立测试库和少量数据，完成新增、修改、删除与重启验证后再扩大范围。

## 1. 准备环境

- 已取得 RivoMesh 源码；项目正在准备公开发布，源码发布入口见[获取与构建](/download)。
- 已安装 JDK 8 和 Maven，执行构建的机器可访问 Maven 仓库。其他 JDK 档案见[兼容性说明](compatibility)。
- 准备一个可访问的 MySQL 测试源和独立的 PostgreSQL / openGauss 测试目标。
- 目标使用空业务表或允许建表的空 schema，管理 schema 与业务 schema 分开；目标表由同步服务独占写入。

::: warning 开始前请数据库管理员核对
MySQL 需要 GTID、ROW/FULL 行镜像、复制权限及全量快照所需权限。V3 建立快照时使用短时全局读锁，读取期间保留 MVCC 视图和元数据锁。先在测试环境评估业务影响，完整条件见 [V3 手册](/reference/zh-CN/pipeline-v3)。
:::

## 2. 构建并启动控制台

在 **RivoMesh 源码根目录**执行，网站仓库不包含 Java 服务：

```bash
mvn -s build/settings.xml verify
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
java -Xmx128m -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform.yml
```

打开 <http://127.0.0.1:8080>，使用环境变量 `RIVOMESH_TOKEN` 中的令牌登录。令牌只保留在你自己的终端环境，不要发送到网站、放进 URL 或提交 Git。

若使用容器，在完成构建后执行：

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
docker compose -f deploy/docker-compose.yml up -d --build
```

这会从本地源码构建镜像，不依赖尚未发布的公共镜像。数据库连接地址须从容器网络视角填写；Docker Desktop 访问宿主机可使用 `host.docker.internal`。Compose 数据卷保存控制器与托管日志，不要随意删除。

## 3. 在向导中创建任务

1. 点击“新建任务”，保留默认 V3 格式，填写任务标识和逻辑源标识。
2. 填写 MySQL 地址、复制客户端 `serverId`、库名和账号。`serverId` 应区别于源数据库节点和其他复制客户端。
3. 添加第一个目标，填写目标连接与源库 → 目标 schema 的映射。初次验证只选一个目标，便于排查。
4. 单机试点选择本地日志并预留容量。跨主机接管使用外部事务日志库，详见运行手册。
5. 保存后先点“检查”。检查成功只说明部分连接和配置满足条件，完整运行权限仍会在启动时验证。
6. 启动任务，查看快照准备、全量投递和目标确认状态。等待追平后再进行数据验证。

## 4. 验证第一条链路

在源库测试表插入、更新、删除少量记录，核对目标值。观察进度和积压，再停止/重启 Worker，验证按原配置和原持久状态续传。不同目标的延迟可能不同，不能只用“任务启动成功”判断同步完成。

如遇 SQL 错误，先查看错误上下文、权限、类型和目标结构。修复原因后使用对应恢复操作，默认重试原事务；当前没有人工跳过失败事务功能。

## 5. 保留配置与恢复资料

备份控制器数据目录、任务配置与日志，并按数据库自身方式备份目标状态。源 binlog 保留时间应覆盖可能的积压和停机窗口。不要删除断点、修改 GTID 或清空非空目标来尝试“重新启动”。

下一步：[完整控制台与部署手册](/reference/zh-CN/console-and-deployment) · [V3 运行手册](/reference/zh-CN/pipeline-v3) · [账号管理](/reference/zh-CN/account-management)
