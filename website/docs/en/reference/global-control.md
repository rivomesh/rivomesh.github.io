---
kind: docs
locale: en
title: "Global task control"
sourcePath: docs/en/global-control.md
---

# Global task control: activation, recovery and limits

[中文](/docs/zh/reference/global-control.html) · [SDD design](/docs/en/sdd/design-global-control.html)

2026-11-17: an optional fixed-owner global profile now wires public HTTP, UI, shared configuration, durable commands and remote reads. Local control remains the default. CP-02/03 remain PARTIAL: legacy task import, complete business workflows, capacity and fault matrices are not fully accepted. Automatic owner relocation is separate.

## Activation

Members share the control database, cluster.id, namespace, sharedAccess=true, sharedTasks=true and taskKey. Each has a distinct stable nodeId and private persistent task/data directories. taskKey is canonical Base64 text encoding 32 random bytes, supplied through protected environment configuration. Keep it out of task YAML. Never share controller.json. First activation requires empty task directories; existing registered tasks or YAML fail with GLOBAL_TASK_IMPORT_REQUIRED. There is no automatic legacy import tool yet.

The[platform example](/files/config/platform-global.example.yml)supports Linux. Follow the[first-release baseline](/docs/en/reference/first-release.html);node modes,identities and keys must agree. Mode mismatches refuse without automatic migration or local fallback.

```sh
java -jar rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform-global.example.yml
```

Supply database credentials, token, key and node ID through the deployment environment. The example enables Secure cookies: expose HTTPS and configure the correct publicOrigin at the proxy.

## Helm and native Kubernetes

The [global Helm values](/files/deploy/helm/rivomesh/values-global-control.yaml) reference existing Secrets: token in rivomesh-auth, and username/password/task-key in rivomesh-control-store. task-key contains the same Base64 key text on all members. Use separate releases, private PVCs and stable node IDs:

```sh
helm upgrade --install rivomesh-global-a deploy/helm/rivomesh --namespace rivomesh -f deploy/helm/rivomesh/values-global-control.yaml
helm upgrade --install rivomesh-global-b deploy/helm/rivomesh --namespace rivomesh -f deploy/helm/rivomesh/values-global-control.yaml
```

Alternatively adapt and apply the native manifests [A](/files/deploy/kubernetes/rivomesh-global-a.yaml) and [B](/files/deploy/kubernetes/rivomesh-global-b.yaml) with kubectl apply -f. Independent controllers must not share a private directory. Static Helm/native parity and invalid-configuration checks exist; live Kubernetes/CSI, node-fault and rolling-upgrade acceptance remain open. Docker uses the same independent persistent-directory and key requirements. Acceptance fixtures leave no persistent preview.

## UI and configuration

The session field taskControlScope=GLOBAL identifies this profile. Any entry lists authorized tasks with cursor pagination, owner/node state, global revision, Worker state, desired/active configuration and command results. Creation/import forms select the execution node; form import creates a new task and does not migrate old checkpoints. Unavailable owner execution is UNKNOWN, not stopped.

Create/edit/restore/actions return 202 for durable admission only. Configuration history separates desired/active; the active pointer advances after successful owner application. Failed proposals preserve the old active configuration. Masked secret references work across entries. Connection previews, raw differences and repair-plan reads use expiring owner queries and cannot complete while the owner is offline. Complete filtering, log aggregation and real-browser visual/accessibility acceptance remain open.

Global maximumTasks/maximumCommands differ from per-node maxTasks/maxRunningTasks. Defaults are 10000 global tasks and 1000 active commands; configuration ranges are resource guards, not hardware throughput promises. Queries are limited to 512KiB requests, 1MiB responses, 1–60 second lifetime, bounded readers and retained capacity.

## Admission and recovery

PENDING is durable queueing. DISPATCHED saves the exact original local request/revision before invocation. ACCEPTED is local durable admission. SUCCEEDED/FAILED come from actual operation receipts. UNKNOWN requires reconciliation, not a success claim or reissue under a new revision. Startup restores receipt protection and validates local configuration against shared authority before scheduling.

The latest startup fix scans all outstanding command pages, including undispatched STOP/PAUSE. Corresponding Workers cannot restore old RUNNING intent before local durable admission; older local operations may finish and stop commands receive priority retries. Rejection after authorization changes releases the block; uncertainty retains it. Focused tests and the application build pass; native business acceptance remains candidate-specific and does not retroactively change earlier evidence.

TASK_BUSY/OPERATION_PENDING retain the original request. Outstanding receipts bypass ordinary 500-entry pruning. Cancellation has a parent and reserved capacity: cancel undispatched work atomically, reconcile uncertain delivery first, and perform actual cancellation after local admission. Success does not imply all targets rolled back.

Offline STOP waits for the original owner. Restore its private directory/volume and keys; an empty directory cannot impersonate it. Default combined controllers stop their local Workers on exit. The explicit separated profile is covered by [execution lifecycle](/docs/en/reference/execution-lifecycle.html); relocation, drain, scheduling and cross-Agent fencing remain separate work. Source MySQL primary promotion is a separate fault scenario from controller-owner takeover.

## Operations FAQ

**How do I distinguish accepted from executed?** Inspect deliveryStatus, status, code and actual Worker/target checkpoints for the same request ID. HTTP 202 is not business commit evidence.

**Does refresh or another entry preserve login?** Shared sessions restore identity subject to cookie domain, Secure, SameSite, expiry and revocation. Different domains require correct proxy/session configuration.

**Can A stop an offline owner?** A durably queues STOP. It stays pending/unknown until the original owner supplies an actual receipt. Heartbeat expiry does not prove process termination.

**Can I edit owner fields, delete root tables or use an empty directory?** No. Authenticated metadata, counts, private-directory identity, receipts and configuration projections reject missing/substituted authority.

**Does control-store failure fall back to local accounts?** No. Management refuses control without shared authority. Existing data-process behavior follows its journal/lease/target protocol; management availability does not establish complete data-plane fencing.

**What belongs in backups?** Coordinate the control database, every private directory, logs/reports/local journal, external journal if selected, and original keys. Restoring just a cursor or old control snapshot is insufficient; automated coordination and old-backup fault matrices remain open.

**What is already evidenced?** Earlier candidates cover real PostgreSQL/MySQL control stores, two independent JVMs, HTTPS/shared login, A creating B-owned tasks and offline commands. Configuration fixtures also invoke real TaskService with fixture Workers. The startup fix and real cross-node business CDC are under additional acceptance. These do not establish all cluster, adapter or hardware profiles.

**Why is no persistent preview running?** The user requested temporary fixtures only. They remove their own containers/volumes and leave unrelated resources untouched.
