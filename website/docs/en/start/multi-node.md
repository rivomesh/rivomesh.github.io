---
kind: docs
locale: en
title: Multi-node deployment
---

# Multi-node deployment and recovery

RivoMesh separates shared node observation, shared access and synchronization failover. Task operations are local by default. An optional fixed-owner global mode now supports shared task views, durable commands, configuration/history and read-only queries. Explicit controller/Agent separation has an accepted initial profile; automatic cross-Agent relocation and the full HA matrix remain open.

| Capability | Current scope |
| --- | --- |
| Node registry | Administrators can inspect nodes, runtime versions, resources, leases and task observations through a shared control database |
| Shared accounts, sessions and audit | Explicit `cluster.sharedAccess: true`; PostgreSQL 17 / MySQL 8.4 two-node acceptance records include cross-node revocation and restart recovery |
| Synchronization failover | Eligible standby workers use an external journal, matching logical task and target settings, distinct node IDs, leases and target fencing |
| Global task control | Optional fixed-owner mode is integrated into HTTP and the console, with cross-entry maintenance acceptance for MySQL/PostgreSQL targets; full migration, cancellation, fault and capacity profiles remain incomplete |

Each controller needs its own persistent control, task, configuration, key and report directories. Do not share `controller.json`, a controller directory or a PVC between controllers. Configure the shared control database with [platform-cluster.yml](/files/config/platform-cluster.yml), using a stable, unique node ID per node.

The control database and external transaction journal have different responsibilities. A shared control database does not make local synchronization events available on another machine. Cross-host continuation requires the external journal profile in the [pipeline manual](../reference/pipeline-v3). One task has one active owner, rather than being split across workers for parallel processing.

Configure the chosen access and task mode before namespace initialization. The current candidate refuses mismatched modes even when all members are stopped. Read the [first-release baseline](../reference/first-release) and [shared access manual](../reference/shared-access), and use consistent session/audit policies and HTTPS.

Stopping a local worker does not stop every standby. Pausing the shared pipeline prevents ordinary takeover; inspect target isolation results separately. A healthy heartbeat does not prove business synchronization is healthy, and an expired lease does not prove a process has stopped.

Helm provides [cluster values](/files/deploy/helm/rivomesh/values-cluster.yaml) and [shared-access values](/files/deploy/helm/rivomesh/values-shared-access.yaml), with independent releases per node. Real Kubernetes/CSI, automatic cross-Agent relocation and additional HA profiles require separate acceptance.

[Node registry](../reference/node-registry) · [Recovery](../reference/recovery) · [Global control progress](../reference/global-control)

## Enable optional fixed-owner global mode

In addition to shared access, set `cluster.sharedTasks: true` and configure the same protected 32-byte Base64 `taskKey` on all members. Each node needs a stable ID and its original independent persistent directory. See the [global profile](/files/config/platform-global.example.yml) and [global control manual](../reference/global-control). Use fresh task directories for initial activation. Existing local task data needs a separately assessed plan.

HTTP 202 means accepted, not finished. An offline owner keeps a command pending/unknown until it provides a reliable receipt. This mode does not automatically move execution to another owner.

## Separate management and execution

The explicit controller/Agent profile has acceptance records for PostgreSQL17/MySQL8.4 control storage, LOCAL/H2 journals, MySQL8.4 capture and PostgreSQL17/MySQL8.4 targets. Existing Workers continue in tested all-controller-loss scenarios; this does not relocate execution to another Agent. Default combined deployment remains coupled. See [execution lifecycle](../reference/execution-lifecycle) for roles, upgrade conditions and exact evidence.

## Node registry in the console

<ScreenshotPreview name="node-registry" locale="en" alt="The RivoMesh 5c54522 English console showing the standalone node profile." />

The RivoMesh 5c54522 English console showing the standalone node profile.
