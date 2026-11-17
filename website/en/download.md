---
kind: page
locale: en
title: Source and downloads
description: Build RivoMesh from source or use Docker Compose. Find real installation commands, pre-release status, deployment requirements and download options.
---

# Get RivoMesh

<p class="landing-lead">Build the synchronization service from public source and choose the deployment profile that fits your environment.</p>

The current version is **0.1.0-SNAPSHOT, a pre-release**. There is no formal GitHub Release or verified public container image in this website's checked baseline. The commands below build from source; they do not download a prebuilt distribution.

## Choose a deployment method

<QuickStart />

Docker Compose needs Git, Docker and openssl. Java deployment needs Git, Java 8, Maven and openssl. Run commands from the cloned core repository. Open <http://127.0.0.1:8080> and sign in with your own `RIVOMESH_TOKEN`.

[Full quick start](/docs/en/start/quick-start.html) · [Deployment reference](/docs/en/reference/console-and-deployment.html) · [GitHub source](https://github.com/rivomesh/rivomesh)

## Before the first pipeline

Use a small MySQL source and an independent empty business target. Confirm GTID, ROW/FULL logging, replication/snapshot privileges, network reachability and persistent storage. First-use target tables must be empty and exclusively written by the synchronization service.

The Java build produces `sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar`. Docker Compose builds a local image and persists controller data in a named volume. Keep credentials out of public configuration and URLs. Configure HTTPS and browser session policy for remote access.

## Version and release status

[GitHub Releases](https://github.com/rivomesh/rivomesh/releases) is the release destination; its existence does not imply a published package. Until a release is provided, use the source build above. Signed archives, checksums, public images and upgrade guidance must be checked against the actual release.

[Implementation status](/docs/en/reference/implementation-status.html) · [Known limitations](/docs/en/start/compatibility.html) · [Multi-node deployment](/docs/en/start/multi-node.html) · [License status](/en/community.html#license-and-release-status)
