---
kind: docs
locale: en
title: Installation and sign-in
---

# Install and sign in

Build from the core repository using Java 8/Maven, or build its Docker Compose image locally. The current version is a source-built pre-release; no public container image is assumed.

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
