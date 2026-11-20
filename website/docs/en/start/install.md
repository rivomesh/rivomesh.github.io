---
kind: docs
locale: en
title: Installation and sign-in
---

# Install and sign in

Build from the core repository using Eclipse Temurin 21 LTS and Maven, or build the image locally with Docker Compose. Use `mvn -version` and `java -version` to confirm the JDK for a local build.

[Source and deployment commands](/en/download.html) · [Quick start](quick-start)

## Prepare the environment

Use a reachable MySQL source with GTID, ROW logging and FULL row images, an independent empty target, persistent storage, and database accounts with the privileges required by the [pipeline manual](../reference/pipeline-v3). Snapshot initialization requires a brief global read lock and appropriate permissions.

## Start the console

Run the documented commands from [the quick start](quick-start). Open <http://127.0.0.1:8080> and sign in with your own `RIVOMESH_TOKEN`. Default local settings are for loopback access. Configure HTTPS, Cookie and Origin policies before remote use.

Docker Compose builds from source. Use addresses reachable from the container, and retain the named data volume. Docker Desktop can reach host services through `host.docker.internal` when appropriate.

## Before sharing the installation

1. Provide an HTTPS entry point and assign individual accounts.
2. Persist task, controller, journal, configuration and report directories.
3. Verify inserts, updates, deletes and restart recovery on a small test pipeline.
4. For several nodes, read [multi-node deployment](multi-node) before sharing any storage.

[Create a task](create-task) · [Deployment reference](../reference/console-and-deployment) · [Browser sessions](../reference/browser-sessions)

## Deployment profiles and probes

Standalone uses persistent local control data. The default task journal uses H2. An external journal can use PostgreSQL, openGauss or a separate MySQL instance. Shared control profiles have PostgreSQL 17 and MySQL 8.4 records. Keep the control database and journal namespaces and credentials distinct.

`GET /healthz` checks process liveness. `GET /readyz` can return 503 when a configured control service is unavailable. Check end-to-end replication in the task workspace. The Dockerfile builds and runs on Temurin 21. Native Kubernetes YAML and Helm use a prebuilt image. The live two-node tests cover same-volume remounts, image and configuration replacement, and Secret rotation. Verify cross-node volume availability and additional failure modes separately. See [execution lifecycle](../reference/execution-lifecycle).

Shared control examples use `RIVOMESH_NODE_ID`, `RIVOMESH_CONTROL_USERNAME`, `RIVOMESH_CONTROL_PASSWORD` and, for shared tasks, `RIVOMESH_TASK_KEY`. Set the control mode before initialization. See [first-release configuration](../reference/first-release) and [deployment commands and profiles](../reference/console-and-deployment).
