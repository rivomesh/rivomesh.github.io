---
kind: docs
locale: zh
title: "版本与更名迁移"
sourcePath: docs/zh-CN/rename-migration.md
---

# Rivomesh 更名与已有任务迁移

更新日期：2026-11-14。English: [Rename migration](/docs/en/reference/rename-migration.html)。

本次仅迁移项目身份及相关构建引用，未改变同步算法、v2 状态表格式、配置指纹算法或 SQL 错误处理。

## 新名称

| 对象 | 新值 |
|---|---|
| 项目与根 Maven artifactId | Rivomesh / `rivomesh` |
| 项目目录 | `rivomesh`，与 `canal` 同级 |
| Maven groupId / Java 基础包 | `io.rivomesh` |
| 可执行 artifactId / 入口 | `rivomesh-app` / `io.rivomesh.Main` |
| 重定位驱动 artifactId / JDBC 类 | `rivomesh-gaussdb-driver` / `io.rivomesh.gaussdb.jdbc.Driver` |
| 源码模块目录 | 保留 `sync-app`、`gaussdb-driver`，无需与 artifactId 同名 |

命名是技术更名，不代表已取得域名/商标或被 Apache 接纳；对外发布前另完成相应审查。

## 已有运行环境

1. 停止该任务所有旧服务节点；不要让不同驱动包名版本混跑同一任务。
2. 备份原配置及同一恢复单元中的业务数据/管理状态。保留原 jobId、逻辑 clusterId、源库、目标 URL/schema 和管理 schema，不删除状态表或重新清空业务表。
3. 如果配置中显式指定目标 driver，将其改为 `io.rivomesh.gaussdb.jdbc.Driver`；不指定则使用新默认值。不要把 Gauss 重定位驱动错误地替换成测试用 PostgreSQL 驱动。
4. 更新服务工作目录、classpath、JAR 路径与监控/日志引用，改用 `sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar`。已有自定义代码引用入口/模型时需要重新编译。
5. 使用 check/status 核对连接和已有阶段，再启动 run。已有 PAUSED 保持暂停；修复原因后 resume，不能把更名当作跳过错误的方式。

配置文件内容不因根目录移动自动改变。若脚本使用外部相对路径，按新的工作目录核对。私有 local.yml 不自动改写；只更新仓库中的示例及默认值。

## 恢复边界

本次更名没有引入多目标/多源/新日志状态格式。未来引入这些能力必须单独设计状态迁移、兼容检查与回退，不能只改包名后复用新旧不同语义的断点。

当前运行和真实数据库验证见 [README](https://github.com/rivomesh/rivomesh/blob/main/README.md) 与[验证记录](/docs/zh/reference/validation.html)。规划中的新功能见[完整方案](/docs/zh/reference/platform-design.html)。
