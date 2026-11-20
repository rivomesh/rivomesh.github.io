---
kind: docs
locale: zh
title: "发布包与驱动依赖清单"
sourcePath: docs/zh-CN/release-inventory.md
---

# 发布包清单与 Apache 准备

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

清单读取 Hive SDK 内层 Maven properties，按 Maven Central 公布的 SHA-256 识别三个 Bouncy Castle 1.86 JAR，并在存在 Kafka 客户端类时读取其构建属性。SHA-256 为 `02906330f9cc73efa8e4516ef3838f3ee3607a12f943e0352664a8db5711b5f3` 的外置厂商候选包识别出 151 个包内坐标，其中 46 个未列入含 175 个组件的 Maven BOM。新识别的组件也进入 `requiredComponentReviews`。许可列表为空时需要核查上游，未识别的内容仍需人工审核。Oracle 源预检使用部署方提供的驱动。[Hive JDBC 构建](https://github.com/apache/hive/blob/rel/release-4.0.1/jdbc/pom.xml) · [Bouncy Castle 下载](https://www.bouncycastle.org/download/bouncy-castle-java/) · [Kafka 构建属性](https://github.com/apache/kafka/blob/3.9.2/clients/src/main/java/org/apache/kafka/common/utils/AppInfoParser.java)

`6491ea3` 的 Temurin 21 普通 JAR 的 SHA-256 为 `33c95ba4ab9c39ed98a7d6cba377fa236aa493a4846019c04cb2d3d8ea7d585c`。对应的 CycloneDX 1.6 Maven BOM 包含 175 个组件，SHA-256 为 `5af703c8df65db5544097f32c233934fb51043084f1a42dd4263e17ceaac8492`。清单识别出 155 个随包分发的坐标，其中 48 个未列入 Maven BOM，另有 21 个外层许可或通知文件。需要审核的 151 个组件中，有 50 项未在 Maven BOM 声明许可，需要单独补充证据。源码在 `META-INF/rivomesh-licenses/` 保留 GaussDB 与 GBase8c 的上游许可原文。识别到对应驱动标记时，清单会核对内嵌许可的字节摘要。

## ASF 分发审查

开发包内嵌 MySQL Connector/J 8.4.0 社区版，适用 GPLv2 和 Universal FOSS Exception。ASF 当前的 Category X 政策覆盖 GPL 及未获明确允许的例外。发现包内驱动时检查返回 `BUNDLED_MYSQL_CONNECTOR_J`。Apache Flink CDC 采用部署方单独安装驱动的方案。Rivomesh 的外置 JDBC 候选包采用这一打包方式，集成方式和其余分发内容仍需 ASF 审查。[Connector/J 8.4.0 许可证](https://github.com/mysql/mysql-connector-j/blob/8.4.0/LICENSE) · [ASF 第三方许可证政策](https://www.apache.org/legal/resolved.html#category-x) · [Flink CDC MySQL 文档](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/flink-sources/mysql-cdc/)

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

### 外置厂商候选包的内容审查

SHA-256 为 `02906330f9cc73efa8e4516ef3838f3ee3607a12f943e0352664a8db5711b5f3` 的外置厂商 JAR 有 105 个外层 Maven 坐标。对应 BOM 含 175 个组件，SHA-256 为 `0eb72993c39c1c048ac9739dbb6410e39ea93e162a420eb39f6af6ecb2390e89`。外层有四项未进入 BOM，分别是 Logback Classic/Core 1.3.5、RocketMQ Logback 扩展 1.0.1 和 JCTools Core 4.0.5。Logback 1.3.5 提供 EPL 1.0 与 LGPL 2.1 两种条款。扩展和 JCTools 的自身代码发布于 Apache 2.0 条款。单独核对 Logback 的所选条款、包名变更和二进制声明条件。[Logback 1.3.5](https://github.com/qos-ch/logback/blob/v_1.3.5/LICENSE.txt) · [RocketMQ logging](https://github.com/aliyun-mq/rocketmq-logging/blob/master/LICENSE) · [JCTools 4.0.5](https://github.com/JCTools/JCTools/blob/v4.0.5/LICENSE) · [ASF 第三方政策](https://www.apache.org/legal/resolved.html#category-b)

同一候选包内嵌的 Hive JDBC 4.0.1 独立 JAR 有 44 个 Maven 坐标，其中 42 个在外层 Maven 元数据与汇总 BOM 中均缺失。单独核对这个 JAR 的内容和通知。另有三个嵌套 Bouncy Castle 1.86 JAR，版本来自 bundle manifest，包内各有 MIT 许可文件。将对应的 JAR 摘要与 manifest 关联到 BOM 条目。[Hive JDBC 4.0.1 构建](https://github.com/apache/hive/blob/rel/release-4.0.1/jdbc/pom.xml) · [Bouncy Castle 许可](https://www.bouncycastle.org/licence.html)

```sh
unzip -p "$candidate" rivomesh-sdk/hive-jdbc-4.0.1-standalone.jar > target/hive-jdbc-review.jar
unzip -Z1 target/hive-jdbc-review.jar
```

外层 `NOTICE` 与 Kafka Clients 3.9.2 原包逐字节相同，`META-INF/NOTICE` 与 ActiveMQ Classic Client 5.16.8 原包相同。Kafka 版本标记和一个消费者类也与上游包一致，清单用这一版本标记将 Kafka 纳入 `requiredComponentReviews`。普通构建的 `LICENSE` 还包含 Connector/J 许可手册，`META-INF/LICENSE` 与 GBase8c 上游许可文件相同。清单的 `outerPackageDocumentDependencyMatches` 记录每项已识别匹配的包内路径、SHA-256、上游组件及上游路径。匹配表示文件字节相同。通用许可证模板可能在多种制品中出现，不计入此项匹配。[ASF 许可文档要求](https://www.apache.org/legal/release-policy.html#licensing)

### 使用独立审阅的文件准备包级文档

权利人提供已审阅的 LICENSE 和 NOTICE 后，可在 Linux 或 macOS 上用 Python 3 显式运行准备步骤，从指定 shaded JAR 生成独立制品。从构建和审阅记录取得这三个 SHA-256 值。输出需要支持硬链接的文件系统、无符号链接的已存在目录和新文件名。日常 Maven 构建可照常进行。

```sh
mkdir -p target/review
python3 tests/prepare-release-documents.py \
  --artifact "$candidate" --artifact-sha256 "$RIVOMESH_INPUT_JAR_SHA256" \
  --license /reviewed/LICENSE --license-sha256 "$RIVOMESH_REVIEWED_LICENSE_SHA256" \
  --notice /reviewed/NOTICE --notice-sha256 "$RIVOMESH_REVIEWED_NOTICE_SHA256" \
  --output target/review/rivomesh-prepared.jar
```

工具将审阅后的原始字节写入 JAR 根目录与 `META-INF` 下的四个标准路径。缺少输入、摘要不符、将已识别的依赖文档用作项目文档、外层 JAR 已签名、外层条目重复或输出已存在，都会拒绝生成。JAR 的运行清单及其他条目的内容、压缩方法保持一致。四个位置原有的文件另存于 `META-INF/rivomesh-licenses/`。`META-INF/rivomesh-release-documents.json` 记录原路径、新路径和摘要，并附上可核验的上游来源。

使用准备后的 JAR 和新摘要运行包清单及候选制品验收。准备步骤仅装配传入文件。源码权利、依赖条款和实际分发范围随后按下面的门禁独立审阅。

### 分发审核记录

人工审核完成后，运行清单命令并附加 `--asf-review target/candidate/distribution-review.json`。审核记录包含以下字段。

| 字段 | 审核证据 |
| --- | --- |
| `formatVersion` | 整数 `1` |
| `artifactSha256`、`mavenBomSha256` | 本次候选包清单中的对应 SHA-256 值 |
| `sourceRightsEvidence` | 源码来源、权利和贡献审查记录的引用 |
| `packagedContentsEvidence` | 实际分发内容的审查记录，包含嵌套或重定位依赖、原生库、通知和其他素材 |
| `packageLicenseFiles` | 对象，键为 `META-INF/LICENSE` 和 `META-INF/NOTICE`，值为 JAR 内已审核文件的 SHA-256 |
| `componentReviews` | 对象，键与 `requiredComponentReviews` 一致。每项含适用许可条款字符串 `license` 及证据引用字符串 `evidence` |

指定 `--asf-review` 时，审查记录缺项、摘要不匹配、分发包许可文件缺失、厂商通知缺失或修改、包内仍含 Connector/J，或存在无法识别的嵌套 JAR，都会输出 `ASF_DISTRIBUTION_REVIEW_BLOCKED` 并返回退出码 1。即使审核记录完整，JAR 根目录或 `META-INF/LICENSE`、`META-INF/NOTICE` 使用已识别的单一依赖文档时，也会由 `PACKAGE_DOCUMENT_MATCHES_DEPENDENCY` 阻断。单独保存在依赖声明路径下的上游文档继续用于审阅。`UNIDENTIFIED_NESTED_JAR` 会给出完整嵌套路径和 JAR 的 SHA-256。可以直接生成普通清单取得这些信息，再按可核验的元数据或已公布的二进制摘要确认组件身份。

`ASF_DISTRIBUTION_REVIEW_RECORDED` 表示记录与实际 JAR 匹配且扫描未发现已知阻断项。适用许可和完整内容由审核人员核对。每个对外分发的源码包、二进制包和镜像都分别审查。[ASF 分发包许可要求](https://www.apache.org/legal/release-policy.html#licensing)

源码仍需在权利人审查后补齐项目级 LICENSE 和 NOTICE。准备这两个文件前，先记录代码、素材和厂商组件的来源及贡献权。再核对实际分发 JAR 中的包级文档及需要随包附带的依赖声明。新孵化项目的初始代码按 Incubator 的 podling IP 指南办理。[Podling IP 审查指南](https://incubator.apache.org/guides/ip_clearance.html)

准备阶段使用项目名 **Rivomesh** 和命名空间 `io.github.rivomesh`。后续提案、名称和品牌审查以 ASF 指南为准。[提案指南](https://incubator.apache.org/guides/proposal.html) · [名称检索](https://incubator.apache.org/guides/names.html) · [品牌指南](https://incubator.apache.org/guides/branding.html)

## 候选包功能验收

冻结一份候选 JAR，并将它用于 [Chrome](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/ui/browser-smoke.mjs)、[原生 CDC](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/global-control-pipeline.py) 和 [Kubernetes](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/kubernetes-csi-runtime.py) 实测。运行 Kubernetes 用例时传入 `--artifact-sha256`，核对两种部署中实际运行的 JAR。将原候选包和各项生成的清单传给门禁。

```sh
python3 tests/release-evidence-gate.py \
  --artifact target/candidate/rivomesh.jar \
  --browser target/candidate/browser/manifest.json \
  --kubernetes target/candidate/kubernetes/manifest.json \
  --native-cdc target/candidate/native-cdc/manifest.json
```

门禁同时检查 验收证据、文档链接、中英文 API 和连接器覆盖、发布包资源，并以测试凭据解析随包提供的 YAML 示例。单独检查这些内容时使用 `--examples-only`。完整命令要求真实浏览器、独立 Agent 原生恢复，以及两种 Kubernetes 实机部署均使用同一候选包。其他适配器或部署档案的原生结果分别登记在[验收基线](/docs/zh/evidence/baseline.html)。分发审查单独登记并使用同一候选包摘要。
