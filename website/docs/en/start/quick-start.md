---
kind: docs
locale: en
title: Quick start
---

# Quick start

Install Eclipse Temurin 21 LTS and Maven. Check `mvn -version` and `java -version` to confirm both use Temurin 21. Prepare a MySQL test source with GTID and ROW/FULL binlog settings, plus a dedicated PostgreSQL 17 target with an empty business schema. Confirm the replication and snapshot privileges in the [pipeline manual](../reference/pipeline-v3).

## Build the core project

```bash
git clone https://github.com/rivomesh/rivomesh.git
cd rivomesh
mvn -s build/settings.xml verify
```

## Start the console

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
java -Xmx512m -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform.yml
```

Open <http://127.0.0.1:8080> and sign in with the token. Keep credentials out of URLs and Git. Production browser access requires the HTTPS/session deployment settings in the [session manual](../reference/browser-sessions).

To build the local container instead, run `docker compose -f deploy/docker-compose.yml up -d --build` with the same token set. Enter database addresses that the container can reach.

## Create and verify a pipeline

Use the default pipeline wizard to configure source identity, databases, an independent target, explicit mappings and a persistent journal. Save, check, and then start. Validate snapshot values, inserts, updates, deletes and Worker restart recovery.

Targets require empty business tables on first use. The check operation does not validate every runtime privilege. Default recovery retries the original transaction; it does not skip failed data.

For experimental captures, follow the separate [PostgreSQL](../reference/postgresql-source) or [Oracle](../reference/oracle-source) setup guide.

[Console and deployment](../reference/console-and-deployment) · [Multi-database pipelines](../reference/pipeline-v3)
