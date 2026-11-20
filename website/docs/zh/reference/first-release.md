---
kind: docs
locale: zh
title: "首版部署基线"
sourcePath: docs/zh-CN/first-release.md
---

# 首版配置基线

当前尚未首次发布，不支持开发候选之间的原地升级、旧包名兼容或自动控制模式迁移。内部格式编号不等于已发布版本。

首版构建、部署和验收仅支持 Eclipse Temurin 21 LTS。Controller、Agent 和 Worker 都使用 Temurin 21。

首次部署前一次确定所有节点的控制库、访问模式、角色、密钥和持久目录。完整管理恢复能力使用一致的配置：

```yaml
cluster:
  sharedAccess: true
  sharedTasks: true
  recoveryReview: true
  recoveryCommit: true
  recoverySkip: true
```

命名空间创建时直接写入对应模式；不匹配立即拒绝，停止全部节点也不会自动迁移。已有开发环境需要另行评估并建立新的测试基线，不得把删除代码历史理解成删除业务数据或只复制游标。

Linux和Docker使用同一份角色配置及每节点独立目录。Helm使用控制器/Agent values叠加`values-recovery-skip.yaml`；手工Kubernetes可参考`rivomesh-skip-*.yaml`。示例不证明真实K8s/CSI已通过验收。

任务/会话/证据/回执的重启恢复、租约与epoch隔离、权限撤销和损坏/旧备份拒绝仍是当前功能，不属于应删除的开发版本兼容代码。

开发中直接替换已废弃实现，不增加只为旧开发候选保留的分支、配置别名或升级测试。文档描述当前可用行为；重复证据与构建快照收敛到单一[验证基线](/docs/zh/start/verification.html)。保留验证当前数据正确性、故障恢复和安全边界所需的测试；临时容器、过期专用镜像及中间构建在不再使用时清理。

## 本地日志备份和恢复

复制 LOCAL 目录前，先停止任务并关闭所有连接该 H2 日志的进程连接。把任务配置、本地日志、目标业务数据、快照元数据及事务回执备份到同一个恢复点。受管任务还应备份相关 Agent 和控制库状态。按各目标产品的一致性备份方式操作，并保留原断点恢复所需的源日志历史。[H2 备份操作](https://h2database.com/html/tutorial.html#backup_restore)

先恢复到隔离存储，核对任务与日志代次、快照 ID、源位点、目标检查点和事务回执，再启动同步。目标检查点不匹配时会暂停投递。待处理日志事务的负载校验和损坏时，读取会失败。排查时保留原始备份。

当前包的测试复制已关闭的 LOCAL 日志和 H2 JDBC 测试目标，使用合成 MySQL GTID，验证恢复续传、去重、不同时间点的检查点拒绝，以及待处理事务负载损坏拒绝。

```bash
python3 tests/local-state-restore.py --artifact rivomesh.jar \
  --java "$JAVA_HOME/bin/java" --javac "$JAVA_HOME/bin/javac" \
  --output target/local-state-restore/manifest.json
```

MySQL 8.4 到 PostgreSQL 17 的实库演练先停止 Worker 并关闭 H2，在同一个已隔离位点备份本地日志和 PostgreSQL 自定义格式归档，再以单事务恢复目标库内容。原 PostgreSQL 库保留集群标识和数据库 OID。重启后从原 GTID 续传停机期间提交的 MySQL 事务，两个快照 ID 均保持一致。将归档恢复到另一个数据库并修改目标 URL 时，服务会返回 `JOURNAL_IDENTITY_MISMATCH`。[PostgreSQL 备份](https://www.postgresql.org/docs/17/app-pgdump.html) · [PostgreSQL 恢复](https://www.postgresql.org/docs/17/app-pgrestore.html)

使用 Java 21 JDK、Docker Compose 和本地的 `mysql:8.4`、`postgres:17` 镜像复现。

```bash
python3 tests/local-state-restore-native.py --artifact rivomesh.jar \
  --java "$JAVA_HOME/bin/java" --output target/local-state-restore-native
```

V2/V3双执行链还在单独合并中。以[当前状态](/docs/zh/reference/implementation-status.html)为准，不把清理标成其他未完成功能的完成。
