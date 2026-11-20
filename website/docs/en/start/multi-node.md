---
kind: docs
locale: en
title: Multi-node deployment
---

# Multi-node deployment and recovery

RivoMesh separates shared node observation, shared access and synchronization failover. Task operations are local by default. Optional global mode supports shared task views, durable commands, configuration history and read-only queries. In a separated deployment, eligible new tasks can select an Agent automatically. Transfer of existing tasks follows a separate reviewed handoff.

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

Helm provides [cluster values](/files/deploy/helm/rivomesh/values-cluster.yaml) and [shared-access values](/files/deploy/helm/rivomesh/values-shared-access.yaml), with independent releases per node. Live two-node Kubernetes evidence covers same-volume remounts, image and configuration replacement, Secret rotation and recovery with an external journal. Cross-node volume availability and additional HA profiles require separate verification.

[Node registry](../reference/node-registry) · [Recovery](../reference/recovery) · [Global control progress](../reference/global-control)

## Enable optional fixed-owner global mode

In addition to shared access, set `cluster.sharedTasks: true` and configure the same protected 32-byte Base64 `taskKey` on all members. Each node needs a stable ID and its original independent persistent directory. See the [global profile](/files/config/platform-global.example.yml) and [global control manual](../reference/global-control). Use fresh task directories for initial activation. Existing local task data needs a separately assessed plan.

HTTP 202 confirms admission. Follow the original request receipt to establish its outcome. An offline owner keeps a command pending or unknown until it provides a reliable receipt.

## Separate management and execution

Configure explicit Controller and Agent roles. With the tested PostgreSQL/MySQL control stores and LOCAL/H2 journals, the same Worker can continue during a complete management outage. When management returns, read the original request receipt. See [execution lifecycle](../reference/execution-lifecycle) for deployment conditions and exact evidence.

### Assign a new task automatically

Choose automatic assignment when creating or importing a task. With a MySQL or PostgreSQL source, MySQL or PostgreSQL destinations and an external PostgreSQL journal, up to three candidate Agents verify their Temurin 21 Worker launcher, required connectors and journal reachability in capacity order. If all checks fail, `AGENT_PLACEMENT_UNAVAILABLE` leaves the task and journal unchanged. Fix the driver, credential or route before submitting again. Other profiles use capacity-based assignment. Once saved, check the selected owner and run connection and object checks against the source and targets.

### Approve handoff of a frozen task

The offline profile requires a MySQL source, MySQL or PostgreSQL destinations, an initial managed journal writer assignment, and one PostgreSQL database for both control and external journal.

1. Stop the task while the original Agent is healthy and confirm that every destination acknowledged the same cut. Assess the candidate, reserve task and Worker capacity, and stage the full set of closed receipts in its private persistent directory.
2. Review the `CLOSED_RECEIPTS_ONLY` inventory. Confirm that it has no reports, failure evidence or raw capture files that need a separate transfer, then explicitly freeze the original writer.
3. If the original Agent becomes unavailable after the freeze, verify its expired lease and the candidate's exact sealed evidence and destination cut. A permitted administrator can approve the ownership change. The task stays stopped on the candidate.
4. Wait for evidence adoption, approve SQL target fencing, and approve starting the candidate Worker separately. Retain the request IDs and receipts.

If the original Agent fails before a durable freeze, recover its original directory and keys first. See the [global control manual](../reference/global-control) for eligibility and receipt states.

## Node registry in the console

<ScreenshotPreview name="node-registry" locale="en" alt="Node registry in the RivoMesh English-language console." />
