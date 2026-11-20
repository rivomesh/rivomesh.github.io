---
kind: docs
locale: en
title: "Release packages & driver inventory"
sourcePath: docs/en/release-inventory.md
---

# Release inventory and Apache preparation

[中文](/docs/zh/reference/release-inventory.html)

Build the release candidate with Eclipse Temurin 21 LTS, then generate the dependency inventory from the repository root. This produces one CycloneDX Maven SBOM and a comparison against the actual shaded JAR. [CycloneDX Maven plugin](https://cyclonedx.github.io/cyclonedx-maven-plugin/)

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

The comparison binds the exact JAR and Maven BOM by SHA-256. The outer Maven fields describe the outer JAR. `packagedComponentEvidence` adds component locations and the hashes of the identifying entries or JARs. `embeddedNestedJars` lists each nested JAR, its coordinates and license files. Examine `packagedCoordinatesOutsideMavenBom` and `unidentifiedNestedJars` when reviewing the complete binary contents.

The scan reads Maven properties inside the Hive SDK, identifies the three packaged Bouncy Castle 1.86 JARs by their published Maven Central SHA-256 digests, and reads Kafka build properties when the client class is present. In the external-vendor candidate at SHA-256 `02906330f9cc73efa8e4516ef3838f3ee3607a12f943e0352664a8db5711b5f3`, it finds 151 packaged coordinates against the 175-component Maven BOM, including 46 absent from that BOM. The `requiredComponentReviews` map includes the newly identified components. An empty license list requires upstream evidence, and unidentified contents still require manual review. Oracle source preflight uses an operator-provided driver. [Hive JDBC build](https://github.com/apache/hive/blob/rel/release-4.0.1/jdbc/pom.xml) · [Bouncy Castle downloads](https://www.bouncycastle.org/download/bouncy-castle-java/) · [Kafka build properties](https://github.com/apache/kafka/blob/3.9.2/clients/src/main/java/org/apache/kafka/common/utils/AppInfoParser.java)

The normal Temurin 21 JAR from `6491ea3` has SHA-256 `33c95ba4ab9c39ed98a7d6cba377fa236aa493a4846019c04cb2d3d8ea7d585c`. Its CycloneDX 1.6 Maven BOM has 175 components and SHA-256 `5af703c8df65db5544097f32c233934fb51043084f1a42dd4263e17ceaac8492`. The scan identifies 155 packaged coordinates, including 48 absent from the Maven BOM, and 21 outer license or notice files. Of 151 component reviews required for this JAR, 50 have no declared license in the Maven BOM and need separate evidence. The source preserves exact upstream GaussDB and GBase8c notices under `META-INF/rivomesh-licenses/`. The inventory checks these against the corresponding upstream bytes when it finds the driver marker.

## ASF distribution review

The development JAR bundles MySQL Connector/J 8.4.0 Community under GPLv2 with the Universal FOSS Exception. The current ASF Category X policy covers GPL and exceptions it does not specifically allow. The review check reports `BUNDLED_MYSQL_CONNECTOR_J` while this driver is present. Apache Flink CDC documents a separate operator-installed driver. Rivomesh's external JDBC candidate follows that packaging pattern and still needs ASF review of its integration model and all other distributed components. [Connector/J 8.4.0 license](https://github.com/mysql/mysql-connector-j/blob/8.4.0/LICENSE) · [ASF third-party license policy](https://www.apache.org/legal/resolved.html#category-x) · [Flink CDC MySQL documentation](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.6/docs/connectors/flink-sources/mysql-cdc/)

### Candidate with an external MySQL JDBC driver

Build the distinct JAR and check its contents against the aggregate Maven BOM.

```sh
mvn -B -s build/settings.xml -Pexternal-mysql-jdbc -pl sync-app -am -DskipTests package
candidate=sync-app/target/rivomesh-app-0.1.0-SNAPSHOT-external-mysql-jdbc.jar
python3 tests/release-inventory.py \
  --artifact "$candidate" \
  --maven-bom target/rivomesh-cyclonedx.json \
  --output target/external-mysql-inventory.json \
  --expect-external-mysql
```

The external profile excludes Connector/J from this JAR, including its service provider and bundled notices. The Maven BOM still describes build dependencies. Review `mavenComponentsWithoutEmbeddedCoordinates` alongside the binary inventory to distinguish the remaining build components from packaged components. `--expect-external-mysql` checks the candidate and its nested JARs. The binlog reader remains packaged separately from the JDBC driver.

On a manual installation, obtain a supported Connector/J JAR separately under its applicable terms. Provide the driver from an operator-controlled file wherever the configuration uses a MySQL-protocol JDBC connection, including the source, a target or the control database. Launch with the explicit classpath and main class.

```sh
mysql_driver=/opt/rivomesh-drivers/mysql-connector-j-8.4.0.jar
java -cp "$candidate:$mysql_driver" io.github.rivomesh.Main serve /etc/rivomesh/platform.yml
```

An execution Agent uses `agent` in place of `serve` and inherits the same JDBC classpath into its Workers. For a systemd service that uses this candidate, set its `ExecStart` to the classpath command with absolute paths. The repository's standard Docker build continues to package the development JAR.

Check a MySQL pipeline using the same classpath and `check` with its pipeline configuration. `JDBC_DRIVER_UNAVAILABLE` indicates that the JVM could not load the driver class. Verify the operator JAR path and the process's read permissions.

Run a disposable MySQL 8.4 acceptance profile to exercise the external JAR through Controllers, an Agent and its Worker. This uses the MySQL control store, PostgreSQL and MySQL targets, and a rolling restart.

```sh
python3 tests/global-control-pipeline.py --artifact "$candidate" \
  --external-mysql-driver "$mysql_driver" \
  --output target/external-mysql-native \
  --separate-execution --rolling-restart --control-product MYSQL
```

### Candidate with external vendor JDBC drivers

Build the `external-vendor-jdbc` profile on its own. The resulting application JAR keeps the binlog reader, PostgreSQL and H2 drivers. It excludes MySQL Connector/J, the GaussDB and GBase8c wrappers, Kingbase and Dameng JDBC. The separate `external-mysql-jdbc` profile continues to bundle the four target connectors. Maven's build BOM still includes dependencies used to build and test the application, and the reactor may produce driver JARs separately. [Maven Shade artifact selection](https://maven.apache.org/plugins/maven-shade-plugin/examples/includes-excludes.html)

```sh
mvn -B -s build/settings.xml -Pexternal-vendor-jdbc -pl sync-app -am -DskipTests package
candidate=sync-app/target/rivomesh-app-0.1.0-SNAPSHOT-external-vendor-jdbc.jar
python3 tests/verify-artifact.py "$candidate" --jdbc-profile external-vendor-jdbc
python3 tests/release-inventory.py --artifact "$candidate" \
  --maven-bom target/rivomesh-cyclonedx.json \
  --output target/external-vendor-inventory.json --expect-external-vendor-jdbc
```

The inventory scans the candidate and nested JARs for known classes, JDBC service providers, Maven metadata and identifiable upstream notices. The external profile check covers the binary application candidate. Source archives and deployment images have their own contents and review evidence.

Supply only the driver files needed by a deployment, from locations controlled by the operator. For GaussDB or openGauss, use the project's separately built relocated GaussDB wrapper for the supported profile. Its class name lets it coexist with the bundled PostgreSQL driver. GBase8c can use the verified upstream `gbase8c-jdbc-3.0.0B02.jar`. The existing checked Kingbase and Dameng versions are `kingbase8-9.0.1.jar` and `DmJdbcDriver18-8.1.3.140.jar`.

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

Use the same launch classpath for the Agent or standalone pipeline. The Agent passes that classpath to its Workers. The offline acceptance checks the exact application JAR with an empty vendor classpath and again with all five operator files. It checks class origins, URL matching, the typed missing-driver error and the Dameng error classification.

```sh
java -cp "$candidate" tests/roles/ExternalVendorJdbcAcceptance.java
java -cp "$classpath" tests/roles/ExternalVendorJdbcAcceptance.java \
  "$mysql_driver" "$gauss_driver" "$gbase_driver" "$kingbase_driver" "$dameng_driver"
```

The native Dameng profile uses this same candidate with only the external Connector/J and Dameng driver files on the operator classpath. It verified actual authentication and driver origins, missing-driver refusal, Dameng error handling and reconnect after a database restart. [Dameng native reproduction](/docs/en/reference/dm-v3.html#native-dameng-connection-with-an-external-java-21-driver)

The native Kingbase target profile runs the candidate with only its external Kingbase JDBC JAR. It exercises actual authentication and class origin, then verifies native transaction receipts and replay through the same endpoint after an outage. [Kingbase native reproduction](/docs/en/reference/kingbase-v3.html#native-kingbase-connection-with-an-external-java-21-driver)

### Contents review of the external vendor candidate

The external-vendor JAR at SHA-256 `02906330f9cc73efa8e4516ef3838f3ee3607a12f943e0352664a8db5711b5f3` has 105 outer Maven coordinates against its 175-component BOM at SHA-256 `0eb72993c39c1c048ac9739dbb6410e39ea93e162a420eb39f6af6ecb2390e89`. Its four outer BOM differences are Logback Classic and Core 1.3.5, the RocketMQ Logback extensions 1.0.1, and JCTools Core 4.0.5. Logback 1.3.5 publishes alternative EPL 1.0 and LGPL 2.1 terms. The extensions and JCTools publish Apache 2.0 terms for their own code. Review Logback separately from the extension, including the selected terms, the relocated classes and the applicable binary notice conditions. [Logback 1.3.5](https://github.com/qos-ch/logback/blob/v_1.3.5/LICENSE.txt) · [RocketMQ logging](https://github.com/aliyun-mq/rocketmq-logging/blob/master/LICENSE) · [JCTools 4.0.5](https://github.com/JCTools/JCTools/blob/v4.0.5/LICENSE) · [ASF third-party policy](https://www.apache.org/legal/resolved.html#category-b)

The same candidate embeds a Hive JDBC 4.0.1 standalone JAR with 44 Maven coordinates, 42 of which are absent from both the outer Maven metadata and the aggregate BOM. Inspect that JAR's contents and notices independently. Three separately nested Bouncy Castle 1.86 JARs expose their versions in bundle manifests and carry their own MIT license files. Use their payload hashes and manifests to associate the packaged files with the corresponding BOM entries. [Hive JDBC 4.0.1 build](https://github.com/apache/hive/blob/rel/release-4.0.1/jdbc/pom.xml) · [Bouncy Castle license](https://www.bouncycastle.org/licence.html)

```sh
unzip -p "$candidate" rivomesh-sdk/hive-jdbc-4.0.1-standalone.jar > target/hive-jdbc-review.jar
unzip -Z1 target/hive-jdbc-review.jar
```

The outer `NOTICE` matches Kafka Clients 3.9.2 byte for byte. Its `META-INF/NOTICE` matches ActiveMQ Classic Client 5.16.8. Kafka's version marker and a consumer class also match its upstream JAR. The scanner uses the version marker to include Kafka in `requiredComponentReviews`. The normal build also contains the Connector/J licensing manual at `LICENSE` and a copy of the GBase8c upstream license at `META-INF/LICENSE`. The report's `outerPackageDocumentDependencyMatches` records each recognized match with the exact package path, SHA-256, upstream component and upstream path. A match identifies the reference bytes. Standard license templates can appear in multiple artifacts and are outside this matching rule. [ASF licensing documentation](https://www.apache.org/legal/release-policy.html#licensing)

### Prepare package documents from separately reviewed files

After the rights holders provide the reviewed LICENSE and NOTICE files, use the opt-in Python 3 step on Linux or macOS to prepare a separate JAR from the exact shaded build. Obtain the three SHA-256 values from the build and review records. Use a new output filename in an existing directory without symbolic links on a filesystem that supports hard links. The ordinary Maven profiles remain available without these materials.

```sh
mkdir -p target/review
python3 tests/prepare-release-documents.py \
  --artifact "$candidate" --artifact-sha256 "$RIVOMESH_INPUT_JAR_SHA256" \
  --license /reviewed/LICENSE --license-sha256 "$RIVOMESH_REVIEWED_LICENSE_SHA256" \
  --notice /reviewed/NOTICE --notice-sha256 "$RIVOMESH_REVIEWED_NOTICE_SHA256" \
  --output target/review/rivomesh-prepared.jar
```

The step copies the reviewed bytes to both root paths and both `META-INF` paths. It refuses missing or mismatched inputs, known dependency documents supplied as project documents, signed outer JARs, duplicate outer entries and existing outputs. The JAR manifest and the content and compression methods of the other entries are preserved. Any original files in the four paths are preserved under `META-INF/rivomesh-licenses/`. `META-INF/rivomesh-release-documents.json` records their old and new paths and hashes, along with verified upstream references when available.

Use the prepared JAR and its new SHA-256 for the package inventory and candidate tests. Document preparation assembles the supplied files. Review the rights, dependency terms and actual distribution independently with the gate below.

### Distribution review record

Run the inventory with `--asf-review target/candidate/distribution-review.json` to check an exact JAR against a completed manual review. Use the following fields in that record.

| Field | Review evidence |
| --- | --- |
| `formatVersion` | Integer `1` |
| `artifactSha256`, `mavenBomSha256` | Corresponding SHA-256 values from this candidate's inventory |
| `sourceRightsEvidence` | Reference to the source provenance, rights and contribution review |
| `packagedContentsEvidence` | Reference to the review of the exact package, including nested or shaded dependencies, native libraries, notices and other assets |
| `packageLicenseFiles` | Object mapping `META-INF/LICENSE` and `META-INF/NOTICE` to their reviewed SHA-256 values in the JAR |
| `componentReviews` | Object keyed exactly by `requiredComponentReviews`. Each value has a `license` string for the selected terms and an `evidence` string for the corresponding review record |

With `--asf-review`, the inventory writes `ASF_DISTRIBUTION_REVIEW_BLOCKED` and exits with code 1 on an incomplete record, digest mismatch, missing package licensing file, missing or changed vendor notice, bundled Connector/J, or an unidentified nested JAR. `PACKAGE_DOCUMENT_MATCHES_DEPENDENCY` also blocks a known individual dependency document at the JAR root or at `META-INF/LICENSE` or `META-INF/NOTICE`, even with a complete review record. A copy in a dedicated dependency attribution location remains available for review. `UNIDENTIFIED_NESTED_JAR` includes the full nested location and the JAR's SHA-256. Run the inventory without `--asf-review` to collect these findings and identify the component from verifiable metadata or its published binary digest.

`ASF_DISTRIBUTION_REVIEW_RECORDED` confirms the record matches the inspected JAR and that the scanner found no known blocker. Reviewers determine the applicable terms and verify all content. Repeat the review for each source archive, binary and image that will be distributed. [ASF distribution licensing requirements](https://www.apache.org/legal/release-policy.html#licensing)

The source tree still needs project-level LICENSE and NOTICE files after review by the rights holders. Record the contribution rights and provenance of code, assets and vendor components before preparing those files. Verify that the exact JAR carries the resulting package-level documents and the required dependency attributions. For a new podling, follow the initial codebase process in the Incubator's podling IP guide. [Podling IP clearance](https://incubator.apache.org/guides/ip_clearance.html)

Use the project name **Rivomesh** and namespace `io.github.rivomesh` during preparation. The ASF proposal, naming and branding guides define the later review and adoption process. [Proposal guide](https://incubator.apache.org/guides/proposal.html) · [Name search](https://incubator.apache.org/guides/names.html) · [Branding](https://incubator.apache.org/guides/branding.html)

## Candidate functionality gate

Keep an immutable copy of the candidate JAR and pass it to the [Chrome](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/ui/browser-smoke.mjs), [native CDC](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/global-control-pipeline.py), and [Kubernetes](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/kubernetes-csi-runtime.py) fixtures. Set `--artifact-sha256` on the Kubernetes fixture to verify the JAR inside both running workloads. Pass the exact candidate and each generated manifest to the gate.

```sh
python3 tests/release-evidence-gate.py \
  --artifact target/candidate/rivomesh.jar \
  --browser target/candidate/browser/manifest.json \
  --kubernetes target/candidate/kubernetes/manifest.json \
  --native-cdc target/candidate/native-cdc/manifest.json
```

The gate also checks acceptance evidence, local links, bilingual API and connector coverage, packaged resources, and all shipped YAML examples using synthetic credentials. `--examples-only` runs these checks by themselves. The full command requires a real browser, successful native recovery with separate Agents, and both live Kubernetes deployment profiles on the same artifact. Record separate native results for each additional adapter or deployment profile on the [verification baseline](/docs/zh/evidence/baseline.html). Record the distribution review separately using the same candidate digest.
