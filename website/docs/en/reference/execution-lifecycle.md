---
kind: docs
locale: en
title: "Controller and Agent lifecycle"
sourcePath: docs/en/execution-lifecycle.md
---

# Separate management entries and execution Agents

[中文](/docs/zh/reference/execution-lifecycle.html) · [Global control](/docs/en/reference/global-control.html)

The protocol4 separated profile passes348app/actual-JAR tests,76DOM and5x152controls,PG/MySQL stores,actual multi-database/two-target CDC,all-controller loss,store outage,pending accepting-entry recovery,nonroot processes and SQL role races.Automatic Agent takeover and complete journal/adapter/JDK matrices remain open. [Evidence](/docs/en/start/verification.html).

| Configuration role | Registry role | Responsibility |
|---|---|---|
| COMBINED | CONTROLLER_WORKER | Compatible management/local execution in one process |
| CONTROLLER | CONTROLLER | UI/API,shared login,configuration and durable admission;execution capacity0 |
| AGENT | AGENT | Fixed-owner execution,Worker supervision,observations and typed reads;HTTP probes only |

## Activation

Every member sets cluster.sharedAccess=true,sharedTasks=true,separateExecution=true and an explicit role. Control database,cluster.id,namespace and Base64 task key match; node IDs and private directories/volumes are independent. separateExecution=false keeps protocol3 combined behavior; defaults do not silently become separated deployments.

Separation uses protocol4. Stop all old members normally and confirm STOPPED before upgrade; expiry/unreachability is insufficient. Preserve tasks,journals,reports,keys and directory UUIDs. Old programs refuse the new protocol; direct database downgrade is unsupported.

An existing combined owner with tasks retains its original nodeId/directory when reopening as AGENT. A controller refuses an execution directory with tasks,including shared ownership hidden behind an empty replacement directory. Legacy local-to-global import remains a separate migration.

Controllers cannot receive execution tasks. Create requests specify an Agent; the UI filters controllers and pages to find Agents. Committing transactions recheck role/ownership instead of trusting an earlier directory/role read.

## Linux

The [controller example](/files/config/platform-controller.example.yml) uses8080;the [Agent example](/files/config/platform-agent.example.yml) uses8081. Adjust control connections and supply token,control credentials and task key environment values,then run independently:

```sh
RIVOMESH_NODE_ID=controller-a java -jar rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform-controller.example.yml
RIVOMESH_NODE_ID=agent-a java -jar rivomesh-app-0.1.0-SNAPSHOT.jar agent config/platform-agent.example.yml
```

Use separate configuration copies/directories and distinct ports on one host. Supervise with separate systemd services; management service dependencies must not stop the Agent. Agent termination stops its own supervised Workers.

## Docker

Build the current image first. Supply RIVOMESH_TOKEN,RIVOMESH_TASK_KEY,RIVOMESH_CONTROL_URL,RIVOMESH_CONTROL_USERNAME,RIVOMESH_CONTROL_PASSWORD. The example assumes PostgreSQL control storage:

```sh
docker compose -f deploy/docker-compose-execution.yml up -d
```

It creates controller-a,controller-b,agent-a with three private volumes. Management ports bind loopback8080/8082;Agent probes bind8081. Browser access still needs HTTPS/proxy configuration for production cookies. Stopping management must not delete/stop Agent state. The file does not create the external control database.

## Helm and native Kubernetes

Use the shared Secrets documented under [global control](/docs/en/reference/global-control.html),then install independent releases:

```sh
helm upgrade --install rivomesh-controller-a deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-controller.yaml
helm upgrade --install rivomesh-controller-b deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-controller.yaml
helm upgrade --install rivomesh-agent-a deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-agent.yaml
```

Without Helm,adapt/apply native manifests [A](/files/deploy/kubernetes/rivomesh-controller-a.yaml),[B](/files/deploy/kubernetes/rivomesh-controller-b.yaml),[Agent](/files/deploy/kubernetes/rivomesh-agent-a.yaml). Each release has one replica/private PVC. Add Agents with distinct releases/node IDs/volumes. Static rendering/invalid-setting checks exist;live Kubernetes/CSI/node-fault acceptance is separate.

## Deployment profiles

| Deployment | Single instance | Multiple management entries and Agents |
|---|---|---|
| Linux | [Systemd unit](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/deploy/linux/rivomesh.service) and [platform file](/files/deploy/linux/platform.yml) | Independent [Controller](/files/config/platform-controller.example.yml) and [Agent](/files/config/platform-agent.example.yml) launches above |
| Docker | [Standalone Compose](/files/deploy/docker-compose.yml) | [Execution Compose](/files/deploy/docker-compose-execution.yml) |
| Kubernetes with Helm | [Chart defaults](/files/deploy/helm/rivomesh/values.yaml) | [Controller values](/files/deploy/helm/rivomesh/values-controller.yaml) and [Agent values](/files/deploy/helm/rivomesh/values-agent.yaml) |
| Native Kubernetes | [Standalone manifest](/files/deploy/kubernetes/rivomesh.yaml) | [Controller A](/files/deploy/kubernetes/rivomesh-controller-a.yaml), [Controller B](/files/deploy/kubernetes/rivomesh-controller-b.yaml), [Agent A](/files/deploy/kubernetes/rivomesh-agent-a.yaml) |

For either Kubernetes path create the [namespace](/files/deploy/kubernetes/namespace.yaml), provide the control database accessible from pods, and create `rivomesh-auth` (key `token`) and `rivomesh-control-store` (keys `username`, `password`, `task-key`) from protected files. Linux and Docker pass the same values through the environment. Set `sessions.secureCookie: true` and the same HTTPS `sessions.publicOrigin` on each management entry behind one ingress. Keep Agent probes on the deployment network. Use database TLS and trusted CA settings supported by the selected JDBC profile. See [session deployment](/docs/en/reference/browser-sessions.html) and [shared credentials](/docs/en/reference/shared-access.html).

If there is no independent database available for control metadata, deploy standalone with its private directory. LOCAL journals use the owning Agent's private directory or PVC. EXTERNAL journals put capture transactions, snapshot pieces and subscription checkpoints in a separate database namespace. Shared task definitions, accounts, sessions and command metadata remain in the control store. Agent-local validation/repair reports, audit projections, keys and Worker configuration remain part of the owner recovery set. [Journal settings](/docs/en/reference/pipeline-v3.html) · [Shared control](/docs/en/reference/global-control.html)

## Enrollment, maintenance and restoration

1. Enroll each Controller and Agent with a unique stable `nodeId` and private directories. Verify the role and fresh registration in **Nodes** and `GET /api/nodes`. Choose the intended Agent when creating a task. Record the owner and directory or PVC identity.
2. To drain an Agent for planned maintenance, stop assigning new tasks, issue STOP through either entry for each owned task and wait for original request receipts and stopped Workers. For a controlled cut, pause first and verify destination acknowledgments. Confirm capture leases are inactive before stopping the Agent service. Restart the same node/volume and explicitly start stopped tasks when maintenance is complete.
3. For a coordinated backup, quiesce the tasks and management writes. Back up the control database, all private node directories and keys, external journals if configured, and target business/checkpoint stores at the approved cut. Use a database-consistent backup method for each store. Preserve permissions and volume identity. Restore a matched set in an isolated environment, verify the node/configuration identities and each target receipt, and only then resume. [Recovery and cutover](/docs/en/reference/reconciliation-workflow.html)
4. Before changing the release, runtime or drivers, record the active artifact, configurations and checkpoints. Keep the same node IDs, paths and keys during the rehearsal. Use separate validation for deployments with mixed versions or cross-node volume replacement. The initial release procedure uses a controlled stop and restart. [First-release configuration](/docs/en/reference/first-release.html) · [Compatibility matrix](/docs/en/reference/compatibility.html)

The live evidence includes Helm and native YAML on a two-node Kubernetes cluster, configuration and Secret replacement, local CSI remount and Worker-node interruption. Cross-node CSI availability and automatic Agent relocation have separate acceptance. [Kubernetes live evidence](/docs/en/start/verification.html)

## Recovery FAQ

**What if every management entry stops?** The Agent independently reads the shared queue. The tested LOCAL/H2 profile continues CDC;management rejoin reads the same owner and authority. This does not relocate execution to another Agent.

**Does CDC survive control-store failure?** In the tested LOCAL/H2 profile,the same Worker continues source capture and independent business writes. Management APIs/registration readiness refuse control without local-account fallback. Recovered storage permits renewed registration and observations. External-journal shared failures,other adapters and production topologies require their own profiles.

**Why does the Agent have no login page?** Its HTTP endpoint serves GET /healthz and /readyz only;administration paths return404 AGENT_PROBE_ONLY. Use management entries;typed owner queries travel through shared storage.

**What if the Agent exits or is killed?** Its Workers are affected;management shows pending/unknown. Restore original Agent directory,nodeId and keys;queued offline STOP is processed before restoring old RUNNING intent. Expiry does not prove process termination. For stopped tasks with a frozen writer, follow the scoped [Agent handoff procedure](/docs/en/reference/global-control.html).

**Are Agent secrets least-privilege isolation?** No. Agents remain in the trusted control domain;Workers filter controller environment variables. Roles do not establish tenant/OS isolation. Least-secret/external-identity work remains separately tracked.

**NODE_ID_IN_USE after restart?** SIGKILL leaves an old lease until expiry;never bypass the guard.Supervisors may retry normally;if another member keeps renewing,fix duplicate configuration.

**VALIDATION_BARRIER_MOVED immediately after configuration restart?** Process liveness and already-equal rows do not establish a new journal claim.Check shared state and actual incremental catchup before retrying.The task detail shows the capture lease separately from Worker process status.
