---
kind: docs
locale: en
title: Quick start
---

# Quick start

Prepare Java 8, Maven, a MySQL test source and an independent empty PostgreSQL / openGauss target. MySQL needs GTID, ROW/FULL binlog settings and the replication/snapshot privileges described in the [pipeline manual](../reference/pipeline-v3).

## Build the core project

```bash
git clone https://github.com/rivomesh/rivomesh.git
cd rivomesh
mvn -s build/settings.xml verify
```

## Start the console

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
java -Xmx128m -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform.yml
```

Open <http://127.0.0.1:8080> and sign in with the token. Keep credentials out of URLs and Git. Production browser access requires the HTTPS/session deployment settings in the [session manual](../reference/browser-sessions).

## Create and verify a pipeline

Use the default pipeline wizard to configure source identity, databases, an independent target, explicit mappings and a persistent journal. Save, check, and then start. Validate snapshot values, inserts, updates, deletes and Worker restart recovery.

Targets require empty business tables on first use. The check operation does not validate every runtime privilege. Default recovery retries the original transaction; it does not skip failed data.

[Console and deployment](../reference/console-and-deployment) · [Multi-database pipelines](../reference/pipeline-v3)
