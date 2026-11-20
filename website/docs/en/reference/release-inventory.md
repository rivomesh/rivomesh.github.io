---
kind: docs
locale: en
title: "Release packages & driver inventory"
sourcePath: docs/en/release-inventory.md
---

# Build packages and driver dependencies

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

## External JDBC driver profiles

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
