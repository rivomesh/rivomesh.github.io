---
kind: docs
locale: en
title: Multi-node deployment
---

# Multi-node deployment and recovery

RivoMesh separates shared node observation, shared access and synchronization failover. Public console task operations currently address the local node; complete global task routing and control-plane HA are still being integrated.

| Capability | Current scope |
| --- | --- |
| Node registry | Administrators can inspect nodes, runtime versions, resources, leases and task observations through a shared control database |
| Shared accounts, sessions and audit | Explicit `cluster.sharedAccess: true`; PostgreSQL 17 / MySQL 8.4 two-node acceptance records include cross-node revocation and restart recovery |
| Synchronization failover | Eligible standby workers use an external journal, matching logical task and target settings, distinct node IDs, leases and target fencing |
| Global task control | Task storage, durable commands and read-only query components have focused tests; public runtime and console integration remain incomplete |

Each controller needs its own persistent control, task, configuration, key and report directories. Do not share `controller.json`, a controller directory or a PVC between controllers. Configure the shared control database with [platform-cluster.yml](/files/config/platform-cluster.yml), using a stable, unique node ID per node.

The control database and external transaction journal have different responsibilities. A shared control database does not make local synchronization events available on another machine. Cross-host continuation requires the external journal profile in the [pipeline manual](../reference/pipeline-v3). One task has one active owner, rather than being split across workers for parallel processing.

For shared access, stop all old members normally before migration, back up local directories and the control database, initialize from the selected bootstrap node, review account/node permissions, and then start other nodes. Use consistent session/audit policies and HTTPS. Read the [shared access manual](../reference/shared-access) before changing an existing installation.

Stopping a local worker does not stop every standby. Pausing the shared pipeline prevents ordinary takeover; inspect target isolation results separately. A healthy heartbeat does not prove business synchronization is healthy, and an expired lease does not prove a process has stopped.

Helm provides [cluster values](/files/deploy/helm/rivomesh/values-cluster.yaml) and [shared-access values](/files/deploy/helm/rivomesh/values-shared-access.yaml), with independent releases per node. Real Kubernetes/CSI, automatic migration and control-plane HA require separate acceptance.

[Node registry](../reference/node-registry) · [Recovery](../reference/recovery) · [Global control progress](../reference/global-control)
