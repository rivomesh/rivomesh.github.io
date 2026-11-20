---
kind: docs
locale: zh
title: "发布包与驱动依赖清单"
sourcePath: docs/zh-CN/release-inventory.md
---

# 构建包与驱动依赖

[English](/docs/en/reference/release-inventory.html)

使用 Eclipse Temurin 21 LTS 构建候选包后，在项目根目录生成 CycloneDX Maven SBOM，并将它与最终的 shaded JAR 核对。[CycloneDX Maven 插件](https://cyclonedx.github.io/cyclonedx-maven-plugin/)

```sh
mvn -B -s build/settings.xml \
  org.cyclonedx:cyclonedx-maven-plugin:2.9.1:makeAggregateBom \
  -DoutputFormat=json -DoutputName=rivomesh-cyclonedx \
  -DincludeTestScope=false -Dcyclonedx.skipAttach=true
python3 tests/release-inventory.py \
  --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --maven-bom target/rivomesh-cyclonedx.json \
  --output target/release-inventory.json
```

清单以 SHA-256 绑定实际候选 JAR 与 Maven BOM。外层 Maven 字段描述外层 JAR。`packagedComponentEvidence` 记录组件位置及其标识文件或 JAR 的摘要。`embeddedNestedJars` 列出每个嵌套 JAR 的坐标和许可文件。审核完整制品时查看 `packagedCoordinatesOutsideMavenBom` 和 `unidentifiedNestedJars`。

## 外置 JDBC 驱动配置

### 外置 MySQL JDBC 驱动的候选包

构建独立命名的候选 JAR，并结合 Maven 聚合 BOM 检查包内内容。

```sh
mvn -B -s build/settings.xml -Pexternal-mysql-jdbc -pl sync-app -am -DskipTests package
candidate=sync-app/target/rivomesh-app-0.1.0-SNAPSHOT-external-mysql-jdbc.jar
python3 tests/release-inventory.py \
  --artifact "$candidate" \
  --maven-bom target/rivomesh-cyclonedx.json \
  --output target/external-mysql-inventory.json \
  --expect-external-mysql
```

该构建配置从候选包中排除 Connector/J，包括 JDBC 服务声明和随该依赖打包的通知。Maven BOM 仍记录构建依赖。结合 `mavenComponentsWithoutEmbeddedCoordinates` 和实际二进制清单，核对构建依赖与分发内容。`--expect-external-mysql` 检查候选包及内嵌 JAR。binlog 读取组件独立于 JDBC 驱动保留在包内。

手动部署时，由部署方按适用许可单独获取受支持的 Connector/J JAR。源库、目标库或控制库使用 MySQL 协议 JDBC 时，由部署方提供该文件。通过显式 classpath 和主类启动。

```sh
mysql_driver=/opt/rivomesh-drivers/mysql-connector-j-8.4.0.jar
java -cp "$candidate:$mysql_driver" io.github.rivomesh.Main serve /etc/rivomesh/platform.yml
```

执行节点将 `serve` 换成 `agent`，其 Worker 继承同一 JDBC classpath。systemd 服务使用此候选包时，用绝对路径写入上述 `ExecStart`。仓库的标准 Docker 构建继续打包开发版 JAR。

用同一个 classpath 执行 `check` 并传入 MySQL 流水线配置。`JDBC_DRIVER_UNAVAILABLE` 表示 JVM 无法加载该驱动类。检查部署方驱动文件的路径及进程的读取权限。

用一次性 MySQL 8.4 环境验收 Controller、Agent 和 Worker 的外置驱动路径。该用例使用 MySQL 控制库、PostgreSQL 和 MySQL 两个目标，并执行滚动重启。

```sh
python3 tests/global-control-pipeline.py --artifact "$candidate" \
  --external-mysql-driver "$mysql_driver" \
  --output target/external-mysql-native \
  --separate-execution --rolling-restart --control-product MYSQL
```

### 外置厂商 JDBC 驱动的候选包

单独使用 `external-vendor-jdbc` 构建。应用 JAR 保留 binlog 读取组件、PostgreSQL 和 H2 驱动，排除 MySQL Connector/J、GaussDB 和 GBase8c 驱动模块，以及金仓和达梦 JDBC。独立的 `external-mysql-jdbc` 配置继续内嵌四个目标驱动。Maven 构建 BOM 仍记录构建和测试依赖，Maven 多模块构建也可能单独生成驱动 JAR。[Maven Shade 构件筛选](https://maven.apache.org/plugins/maven-shade-plugin/examples/includes-excludes.html)

```sh
mvn -B -s build/settings.xml -Pexternal-vendor-jdbc -pl sync-app -am -DskipTests package
candidate=sync-app/target/rivomesh-app-0.1.0-SNAPSHOT-external-vendor-jdbc.jar
python3 tests/verify-artifact.py "$candidate" --jdbc-profile external-vendor-jdbc
python3 tests/release-inventory.py --artifact "$candidate" \
  --maven-bom target/rivomesh-cyclonedx.json \
  --output target/external-vendor-inventory.json --expect-external-vendor-jdbc
```

清单检查候选包及嵌套 JAR 中已知的类、JDBC 服务声明、Maven 元数据和可识别的上游通知。该检查覆盖候选应用二进制包。源码归档和部署镜像分别记录其实际内容及审核证据。

部署方仅提供任务所需的驱动，并自行管理文件路径。GaussDB 或 openGauss 使用项目单独构建的已重定位 GaussDB 驱动模块，允许同一 JVM 加载内嵌的 PostgreSQL 驱动。GBase8c 可使用已核对的原厂 `gbase8c-jdbc-3.0.0B02.jar`。当前验证的金仓和达梦驱动版本为 `kingbase8-9.0.1.jar`、`DmJdbcDriver18-8.1.3.140.jar`。

```sh
driver_dir=/opt/rivomesh-drivers
mysql_driver="$driver_dir/mysql-connector-j-8.4.0.jar"
gauss_driver="$driver_dir/rivomesh-gaussdb-driver-0.1.0-SNAPSHOT.jar"
gbase_driver="$driver_dir/gbase8c-jdbc-3.0.0B02.jar"
kingbase_driver="$driver_dir/kingbase8-9.0.1.jar"
dameng_driver="$driver_dir/DmJdbcDriver18-8.1.3.140.jar"
classpath="$candidate:$mysql_driver:$gauss_driver:$gbase_driver:$kingbase_driver:$dameng_driver"
java -cp "$classpath" io.github.rivomesh.Main serve /etc/rivomesh/platform.yml
```

执行 Agent 或独立流水线使用相同启动 classpath，Agent 将其传给 Worker。离线验收使用同一个应用 JAR，分别验证缺少厂商驱动及提供五个驱动文件时的类来源、URL 匹配、驱动缺失错误和达梦错误分类。

```sh
java -cp "$candidate" tests/roles/ExternalVendorJdbcAcceptance.java
java -cp "$classpath" tests/roles/ExternalVendorJdbcAcceptance.java \
  "$mysql_driver" "$gauss_driver" "$gbase_driver" "$kingbase_driver" "$dameng_driver"
```

达梦实库档案使用同一种候选包，部署方的 classpath 只添加外置 Connector/J 和达梦驱动。实测涵盖连接认证、驱动加载来源、缺驱动拒绝、达梦原生错误处理和数据库重启后重连。[达梦实库复现](/docs/zh/reference/dm-v3.html#java-21-外置达梦驱动实库验收)

金仓目标实库档案的候选包只添加外置金仓 JDBC。测试核对驱动来源和连接认证，并核验中断后在同一地址恢复时的事务回执和重放行为。[金仓实库复现](/docs/zh/reference/kingbase-v3.html#java-21-外置金仓驱动实库验收)
