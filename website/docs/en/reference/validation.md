---
kind: docs
locale: en
title: "Validation records"
sourcePath: docs/en/validation.md
---

# Verification scope

[Current status](/docs/en/reference/implementation-status.html) · [First-release baseline](/docs/zh/evidence/baseline.html)

This entry points to the current baseline rather than repeating build/attempt histories. Separate versions/products/JDK scopes do not establish a complete compatibility matrix.

## Local regression with Temurin 21

On macOS, the default JVM temporary directory can pass through the `/var` symbolic link. The recovery tests reject symbolic links in evidence paths. Give the Maven test JVM a temporary directory under the physical project path to exercise the same guard.

```bash
mkdir -p target/surefire-tmp
test_tmp="$(cd target/surefire-tmp && pwd -P)"
mvn -B -s build/settings.xml "-DargLine=-Djava.io.tmpdir=\"$test_tmp\"" verify
```

## MySQL 5.7.44 V3 profile

The archived Java 8 run used Connector/J 8.4.0 and MySQL 5.7.44 linux/amd64. It passed standalone fan-out, GTID asynchronous promotion and single-primary Group Replication. The checks include keyless duplicates, JSON, supported generated expressions, crash restart, DDL refusal, replica SQL failure and binlog-loss refusal with the checkpoint retained. Restore the missing logs or select an eligible source that still has them before resuming. With the current release JDK, Eclipse Temurin 21 LTS, run `tests/matrix.sh --v3 5.7.44` to exercise this MySQL version. See the [acceptance record](/docs/zh/evidence/baseline.html#so-02-mysql-57-v3).
