---
kind: docs
locale: zh
title: "验证记录汇总"
sourcePath: docs/validation.md
---

# 验证范围

[当前实施状态](/docs/zh/reference/implementation-status.html) · [首版验证基线](/docs/zh/evidence/baseline.html)

本页统一指向当前基线，不再重复记录逐次构建、失败尝试和旧发布候选。不同版本/产品/JDK的记录不能合并为全矩阵通过。

## Temurin 21 本地回归

macOS 默认 JVM 临时目录可能经过 `/var` 符号链接。恢复测试会拒绝证据路径内的符号链接。运行回归时，把 Maven 测试 JVM 的临时目录设为项目下的物理路径，保留同样的证据路径校验。

```bash
mkdir -p target/surefire-tmp
test_tmp="$(cd target/surefire-tmp && pwd -P)"
mvn -B -s build/settings.xml "-DargLine=-Djava.io.tmpdir=\"$test_tmp\"" verify
```

## MySQL 5.7.44 当前 V3 档案

早期 Java 8 记录使用 Connector/J 8.4.0 和 MySQL 5.7.44 linux/amd64，已通过单机多库多目标、GTID 主从切换和单主组复制。当前复验使用 Eclipse Temurin 21 LTS。覆盖无主键重复行、JSON、支持的生成列表达式、进程强杀续传、DDL 暂停、主从 SQL 错误与日志缺失保护。日志缺失时保留原断点，恢复缺失日志或切换到持有完整日志的合格节点后再恢复。执行 `tests/matrix.sh --v3 5.7.44` 复验。见[验收摘要](/docs/zh/evidence/baseline.html#so-02-mysql-57-v3)。
