---
kind: page
locale: en
title: Source and downloads
description: Build RivoMesh from source or use Docker Compose. Find real installation commands, pre-release status, deployment requirements and download options.
---

# Get RivoMesh

<p class="landing-lead">Build RivoMesh from source or use Docker Compose, then create your first replication pipeline.</p>

The current version is **0.1.0-SNAPSHOT, a preview**. The trial setup builds from source, including a local image when using Docker Compose.

## Choose a deployment method

<QuickStart />

Docker Compose needs Git, Docker and openssl. Install Eclipse Temurin 21 LTS and Maven to build and run locally. Use `mvn -version` and `java -version` to confirm the active JDK, then run the commands from the cloned core repository. Open <http://127.0.0.1:8080> and sign in with your own `RIVOMESH_TOKEN`.

[Full quick start](/docs/en/start/quick-start.html) · [Deployment reference](/docs/en/reference/console-and-deployment.html) · [GitHub source](https://github.com/rivomesh/rivomesh)

## Before the first pipeline

Use a small MySQL source and an independent empty business target. Confirm GTID, ROW/FULL logging, replication/snapshot privileges, network reachability and persistent storage. First-use target tables must be empty and exclusively written by the synchronization service.

The Java build produces `sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar`. Docker Compose builds a local image and persists controller data in a named volume. Keep credentials out of public configuration and URLs. Configure HTTPS and browser session policy for remote access.

## Version and release status

RivoMesh is preparing its first release. To try the current preview, build from the source above or use Docker Compose. Follow [GitHub Releases](https://github.com/rivomesh/rivomesh/releases) for published versions.

[Implementation status](/docs/en/reference/implementation-status.html) · [Known limitations](/docs/en/start/compatibility.html) · [Multi-node deployment](/docs/en/start/multi-node.html) · [Release inventory](/docs/en/reference/release-inventory.html)
