---
kind: docs
locale: en
title: "Console & deployment"
sourcePath: docs/en/console-and-deployment.md
---

# Console, multiple tasks, and deployment

Updated: 2026-11-18. 中文：[控制台与部署](/docs/zh/reference/console-and-deployment.html). This page describes implemented behavior; see [platform design](/docs/en/start/architecture.html) for the full roadmap.

## Runtime scope

Independent tasks run in isolated JVMs with bounded heap and concurrency. The multi-database wizard configures relational, analytical and eight messaging destinations plus local or external journals. See the [connector catalog](/docs/en/start/connectors.html) for product profiles. Legacy single-target tasks remain supported.

The bilingual workbench provides creation, connection/source-object checks, start/stop, shared pause/resume, progress/backlog, and operation history. Independent VIEWER/OPERATOR/ADMIN tokens enforce access. ADMIN can edit configuration, rotate credentials and restore revisions. Row validation and reviewed repairs at a common paused cut are available. Transactional PostgreSQL and MySQL have scoped profiles for [commit confirmation](/docs/en/reference/commit-acknowledgement.html), [transaction skipping](/docs/en/reference/transaction-skip.html), [gap verification](/docs/en/reference/gap-verification.html), [compensation](/docs/en/reference/transaction-compensation.html) and [manual correction](/docs/en/reference/manual-correction.html). Configure the corresponding gates in the [first-release baseline](/docs/en/reference/first-release.html). Plan business cutover separately. See [validation](/docs/en/reference/managed-validation.html) and [repair](/docs/en/reference/managed-repair.html).

Local task control is the default. Opt in with `cluster.sharedAccess=true` and `cluster.sharedTasks=true` for fixed-owner global tasks. Any entry manages authorized remote tasks while distinguishing durable admission, actual outcomes and uncertainty. See [global control](/docs/en/reference/global-control.html) for private directories/keys, upgrade refusal, Helm and native two-node deployment. Automatic execution takeover remains open.

## Local startup

Use Eclipse Temurin 21 LTS for Maven, the Controller, the Agent and each Worker.

```bash
mvn -s build/settings.xml verify
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
# Also export MYSQL_PASSWORD / GAUSSDB_PASSWORD before startup if tasks reference them.
java -Xmx128m -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform.yml
```

Open http://127.0.0.1:8080 and enter RIVOMESH_TOKEN. Default binding is loopback; tokens require at least 24 bytes and never belong in URLs. Use an appropriate TLS entry point/tunnel for remote access; the embedded server currently serves HTTP.

Creation does not start replication. Check connections/objects first, then start. Checks read source definitions and test target connectivity without DDL; startup still validates empty initial targets and DDL/replication privileges. Advanced candidate-node configuration can be loaded from files.

## Independent configurations

Place task YAML files in config/tasks and restart, or use the YAML import button/wizard. Paths resolve against platform.yml. Other directories are not scanned and external edits are not hot-reloaded.
Externally supplied tasks not yet edited in the console use private worker snapshots; external reload requires controller restart and identity validation. UI-created/edited tasks use private committed versions and a registry head. Task YAML/worker snapshots are repairable projections; editing them does not change configuration. ADMIN uses **Configuration & history** to preview/save/restore. See the [configuration handbook](/docs/en/reference/configuration-editor.html).

Use unique jobIds and distinct replication client serverIds on the same physical topology. Configured destination business/metadata namespace overlap is rejected. Operators must also avoid overlapping physical destinations hidden behind aliases/VIPs. Invalid files are reported independently without blocking valid tasks.

| Setting | Default | Meaning |
|---|---:|---|
| maxTasks | 20 | Maximum loaded tasks |
| maxRunningTasks | 2 | Concurrent workers; others wait for capacity |
| workerHeapMiB | 256 | Maximum worker heap; additionally budget native memory, controller, and databases |
| controlThreads | 4 | Bound on checks/status/control concurrency |
| pollMillis | 3000 | Scheduler/status interval |
| autoStart | false | Initial intent for newly discovered files only; saved intent wins, UI creation always starts stopped |

Unexpected exits restart with backoff; after five exits CRASH_LOOP requires repair and Start/retry. Saved running tasks recreate workers after controller restart using target checkpoints. Changed identity/connection configurations are not silently substituted.

## Stop, pause, resume

- Stop local worker affects this controller's worker only; another deployed standby may take over.
- Shared pause persists PAUSED and invalidates owners on initialized tasks. Before initialization only local intent is paused, reported as LOCAL_PAUSED_NOT_INITIALIZED.
- Resume after repair is bound to an error generation and retries the original failed transaction. Old requests cannot clear newer failures; restart does not bypass pause.

No queues are deleted or GTIDs changed. Database administrators still repair source replication errors. Failed status reads show the last successful time and an explicit stale-data indication.
The workbench shows at most 100 tables/task with the total count; other tables continue syncing. Full table status remains available through CLI; paginated search will follow.

V3 task details show the Worker process and capture lease separately. `captureLeaseState` is `CLAIMED`, `EXPIRED`, or `UNCLAIMED` as observed using the journal's clock. The console shows an unknown lease when it cannot read fresh journal state. Consult the source failure stage and checkpoint to diagnose a Worker that is running while capture is stalled.

An administrator can open **Capture diagnostics** in a V3 task from either management entry. The owner supplies timestamped capture-start, phase-failure, retry and journal backpressure events. It scans at most two 64 KiB segments and returns up to 25 records per page using opaque cursors. Endpoint `GET /api/tasks/{id}/diagnostics?limit=20&after={cursor}` uses the existing authorization and owner-query limits. A lost owner returns an unavailable query. An expired cursor requires reopening the first page. Phase events omit driver messages, SQL, row values and credentials. The raw Worker logs remain private.

## Durable files and APIs

tasksDirectory stores configurations; dataDirectory/controller.json stores intent, revisions, and operation history using atomic replacement. A file lock permits one controller per directory; corrupt state is not silently reset. V2 checkpoints remain in target metadata. V3 stores capture/snapshot artifacts/subscriber ACKs in LOCAL or EXTERNAL journals, transactional checkpoints with target business data, and confirmed message receipts in the journal. LOCAL uses dataDirectory/journals/pipelineId; use EXTERNAL for cross-host HA. Never delete a journal and continue from old target checkpoints.
dataDirectory/worker-configs holds the selected startup configurations and must receive the same credential protection as task files.

Configuration files may contain credentials and are written with mode 0600. Task status APIs omit passwords, raw JDBC URLs, row payloads and snapshot key values. ADMIN configuration APIs return editable documents with opaque references for credentials and credential-bearing URLs; ordinary credential-free URLs are visible. Protect directories/backups too. Worker logs rotate between two approximately 8 MiB files and are not served by the Web API.

| API | Purpose |
|---|---|
| GET /healthz, /readyz | Unauthenticated process probes. Readiness returns 503 if configured control services are unavailable. |
| GET /api/tasks | Sanitized tasks/status/load errors/operations |
| POST /api/tasks | Create stopped task using config object or yaml string |
| GET /api/tasks/{id} | Single-task view |
| POST /api/tasks/{id}/actions | START / STOP / PAUSE / RESUME / RESUME_TARGET / CHECK |
| GET /api/tasks/{id}/configuration, /configuration/history | ADMIN redacted configuration and revisions |
| POST /api/tasks/{id}/configuration/validate, /configuration/restore/validate | ADMIN preview edits or restore |
| PUT /api/tasks/{id}/configuration, POST .../configuration/restore | ADMIN commit/restore a new revision without reverting checkpoints |
| GET /api/capabilities | Implemented/partially verified/planned adapters |

Use Authorization: Bearer. Writes require JSON and X-Request-ID; actions carry expectedRevision and RESUME also global errorCount. RESUME_TARGET needs subscriptionId and its independent errorCount. Message pause can leave in-flight publication unconfirmed and does not establish a business cutover fence. HTTP 202 means accepted, with final results under operations. Identical request replays are idempotent. Retain 500 request receipts and 40 operations/task; old requests remain subject to revision checks. One pending operation per task.

## Docker

```bash
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"
docker compose -f deploy/docker-compose.yml up -d --build
```

Compose exposes loopback port 8080, persists control/configuration data, and allows 90 seconds to stop. The image runs nonroot; MAVEN_IMAGE/JAVA_IMAGE build arguments support prepared internal bases. Images are not publicly published; build/import them. Review bundled driver distribution terms before external release.

## Linux service

Install the JAR at /opt/rivomesh/rivomesh.jar and create a rivomesh account. Copy deploy/linux/platform.yml to /etc/rivomesh/platform.yml and place the token in administrator-readable /etc/rivomesh/platform.env. Install deploy/linux/rivomesh.service, allow the service account to write /var/lib/rivomesh, adjust the Java path, then run systemctl daemon-reload and systemctl enable --now rivomesh.

## Kubernetes: Helm and native manifests

Build and push/import an accessible image first. Prepare a private, untracked .env file containing token=your-private-token:

```bash
kubectl apply -f deploy/kubernetes/namespace.yaml
kubectl -n rivomesh create secret generic rivomesh-auth --from-env-file=/private/rivomesh-token.env
# Option 1: Helm; adjust the image repository/tag
helm upgrade --install rivomesh deploy/helm/rivomesh -n rivomesh --set image.repository=registry.example/rivomesh
# Option 2: no Helm required; edit image/PVC settings first
kubectl -n rivomesh apply -f deploy/kubernetes/rivomesh.yaml
kubectl -n rivomesh port-forward service/rivomesh 8080:8080
```

Choose one manager for these resources, not both. Native YAML is rendered from the same Chart defaults. Helm supports existing Secrets/PVCs, storage class, resources, and concurrency, with schema/template validation. Regenerate native manifests using helm template rivomesh deploy/helm/rivomesh --namespace rivomesh.

The control plane currently uses one replica, Recreate updates, and persistent PVC. Scaling replicas does not provide controller HA. Existing per-task database lease recovery remains; coordinated multi-controller scheduling is future work. Source outages/paused tasks do not fail process probes. Restart after Secret/native ConfigMap changes under an operational plan while preserving task identity.

Manifests include persistence, restricted privileges, read-only root filesystem, temporary storage, graceful shutdown, and probes. Validate actual clusters, CSI, architectures, and OS dependencies separately; rendering is not live Kubernetes acceptance.

## FAQ

**Does controller restart repeat the snapshot?** Matching task configuration/intact target state resumes existing checkpoints. Controller files do not replace target data/checkpoints.

**Can another node write after pause?** Shared pause uses the same task-row lock as business transactions, so old owners cannot commit new work after pause finishes. Before initialization, local pause has no global effect.

**Why is a task queued?** maxRunningTasks is reached. Stop another worker or adjust configuration/restart within hardware capacity.

**Why did resume fail?** The error generation changed, the target is unavailable, or configuration differs. Refresh/repair rather than editing checkpoints.

**Do these manifests run every planned target?** No. They deploy implemented functionality; planned adapters remain marked unavailable.

## Development verification

Maven verify runs unit and API tests. With Eclipse Temurin 21 LTS, `tests/matrix.sh` defaults to the V3 standalone, asynchronous GTID failover and Group Replication profiles for MySQL 5.7.44, 8.0.46, 8.2.0 and 8.4.13.
Optionally run npm ci --prefix tests/ui --ignore-scripts and npm test --prefix tests/ui for the actual HTML/JavaScript DOM interactions. Node is a development-test dependency only, not a service requirement.
After building, python3 tests/deployment-check.py --image rivomesh:0.1.0-SNAPSHOT checks Helm/native parity, nonroot image, authentication, file permissions, request replay, and volume recovery. It removes only its own containers/volumes and never deploys into user Kubernetes clusters.
A Chrome smoke test opens the real console, signs in with the keyboard, verifies session restoration after reload and checks the accessible diagnostics dialog and mobile viewport. Broader workflows and browsers have separate acceptance. [Browser record](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#worker-diagnostic-events-and-chrome-smoke)

The console uses the Rivomesh website wordmark and its light and dark palettes. It follows the browser's system preference until you choose an appearance with the moon or sun control in the navigation. Your browser remembers that choice. Keyboard users can use the first link, **Skip to main content**, to bypass navigation.

## Individual access roles

Use [platform-rbac.yml](/files/config/platform-rbac.yml) instead of the shared-token example, set its three token environment variables, then run `java -jar rivomesh-app-0.1.0-SNAPSHOT.jar serve config/platform-rbac.yml`. Each token must be distinct printable ASCII, 24–4096 characters; unresolved environment references are rejected. At most 32 configured users are accepted, with unique IDs and at least one ADMIN. Tokens are not passwords. Browser sign-in exchanges the token for a revocable short-lived session that survives reload; see [sessions, HTTPS/CSRF and sign-out](/docs/en/reference/browser-sessions.html).

| Role | Read tasks/status/catalog | Check/start/stop/pause/resume existing tasks | Create/import | Read/edit configuration and revisions |
|---|---|---|---|---|
| VIEWER | Yes | No | No | No |
| OPERATOR | Yes | Yes | No | No |
| ADMIN | Yes | Yes | Yes | Yes |

Roles determine actions; `users[].taskIds` can restrict VIEWER/OPERATOR to exact tasks. Omission preserves deployment-wide access, an empty array grants no tasks, and ADMIN is deployment-wide. See [task grants and revocation](/docs/en/reference/task-authorization.html). OPERATOR is restricted to CHECK, START, STOP, PAUSE, RESUME and RESUME_TARGET; unknown future actions require ADMIN until explicitly authorized. The API rejects forbidden requests before reading a mutation body or invoking the task service. UI buttons reflect those permissions, but the server remains the enforcement boundary.

`GET /api/session` returns the current identity, role, permissions and task scope, never tokens or other accounts. The console refreshes permissions and clears drafts on logout/auth loss; stale responses cannot clear a new login. Default CONFIG uses startup identities. After explicit managed activation, the durable directory is authoritative and restart/configuration changes do not overwrite managed grants. ADMIN account UI/API, rotation and offline recovery are documented in [accounts](/docs/en/reference/account-management.html).

In CONFIG/bootstrap mode, `authToken` is the global `legacy-admin`; omit it when using only individual accounts. Configured identities require distinct credentials. Managed activation preserves the current identities, after which the durable directory controls changes. Local user/grant UI, rotation and offline recovery are implemented. Shared HTTPS entries can use one [OIDC provider](/docs/en/reference/oidc-login.html). Manage token rotation and browser session expiry separately. See [security audit](/docs/en/reference/security-audit.html) for external anchors and object locking.

For Linux use the selected platform file in the existing service command/environment. For Docker or native Kubernetes mount it as the platform configuration and inject the referenced tokens through the deployment secret/environment mechanism. The default Helm/native profile keeps the backward-compatible shared token. For individual roles use the example below; neither profile embeds token values. Do not put literal tokens in committed values or exported diagnostic bundles.

For Helm roles, provision Secret `rivomesh-accounts` with distinct `admin-token`, `operator-token`, `viewer-token` keys, then use `helm upgrade --install rivomesh deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-rbac.yaml`. For manual YAML use `deploy/kubernetes/rivomesh-rbac.yaml` instead of the default manifest; choose one manager/profile for the same resources. Both native files are rendered from the Chart and checked for parity. Custom users use `auth.users: [{id, role, secretRef: {name, key}}]`, with `auth.legacyTokenEnabled: false` to disable shared access. At least one ADMIN is required. Duplicate IDs/Secret keys, invalid roles and literal `token` values are rejected during rendering; different Secret keys with equal actual credentials are rejected by the application at startup.

For CONFIG/bootstrap identity only, Secret environment values are read at startup; updating a Secret requires a controlled rollout. Managed identities must instead be rotated through account UI/API. To omit bootstrap credentials use accessMode: MANAGED with matching initialized controller/audit storage; see [accounts](/docs/en/reference/account-management.html).

New configurations created through HTTP record `createdBy`, `createdRole`, `createdAt`. Task operations record the authenticated `actorId` and `actorRole`, including their asynchronous outcome, and retain them across controller restart. The server supplies these fields; request-body identity fields cannot impersonate another account. New idempotency receipts also bind the request ID to that identity/role: matching identity replay is idempotent, another identity receives `REQUEST_IDENTITY_CHANGED`. Older receipts without attribution retain their compatibility behavior; old records and direct filesystem/internal API changes are not assigned an invented identity.

This is bounded operational history: 40 operations per task and 500 request receipts in the controller registry; the UI displays the most recent eight operations. The independent global store records denied API/security events and asynchronous outcomes, with integrity checks, retention, export and an audit screen; see the [security audit handbook](/docs/en/reference/security-audit.html). Deployments can retain signed anchors and object-locked archives separately.


ClickHouse V3 targets use native versioned materialization and FINAL query views;
transactions can become visible in separate row batches. The wizard defaults to
non-unique skipping-index conversion. After **Check**, expand **Check results and
operation details** in task history to review `clickhouseIndexPlans`, including
unsupported indexes and lost uniqueness/order/global-routing guarantees. YAML
import supports explicit `clickhouse.secondaryIndexes: NONE` for earlier data-only
tasks; omitting the new field retains NONE automatically. See the [ClickHouse handbook](/docs/en/reference/clickhouse-v3.html) before changing profiles.


The Doris wizard configures SQL/Stream Load HTTP origins, redirect allowlist, replicas/buckets and index policy. Default3 replicas; one-BE tests explicitly select1. Expand `dorisIndexPlans` in check results. Pause leaves materialization in flight unconfirmed, not a cutover barrier. Initial identity checks require a Doris ADMIN account; see the [Doris handbook](/docs/en/reference/doris-v3.html).

Optional protocol5 adds administrator evidence creation,raw/normalized pages and typed image review. See [review operations](/docs/en/reference/failure-review.html) for activation/upgrade and deployment profiles. Default legacy profiles do not upgrade automatically. See [implementation status](/docs/en/reference/implementation-status.html) for scoped recovery.

### Two-node live verification

The same ARM64 build passed Helm and native YAML on two-node Kubernetes v1.31.0. Each format verified cookie login after refresh, initial delivery, remount of the same RWO CSI volume, incremental recovery, configuration rollout and Secret rotation. The node-local profile uses `hostpath.csi.k8s.io`. The shared NFS CSI profile also verified a replacement application image and same-claim relocation to another live node without resnapshot or manual START.

Load the candidate image on every node of a disposable cluster and enable `csi-hostpath-driver`. The runner creates and deletes namespaces with unique names.

```sh
python3 tests/kubernetes-csi-runtime.py --context rivomesh-test \
  --image rivomesh:0.1.0-SNAPSHOT --output target/kubernetes-proof
```

For the shared volume profile, provide a StorageClass that can attach a ReadWriteOnce volume to either node sequentially. Load both images on every node. The isolated [NFS fixture](/files/tests/kubernetes-nfs-fixture.yaml) uses a Ganesha service and temporary storage. Install the [NFS CSI driver](https://github.com/kubernetes-csi/csi-driver-nfs) and create a StorageClass with provisioner `nfs.csi.k8s.io`, the Service ClusterIP as `parameters.server`, `parameters.share: /` and the tested mount option `nfsvers=4.0`.

```sh
python3 tests/kubernetes-csi-runtime.py --context rivomesh-test \
  --storage-class rivomesh-shared --csi-driver nfs.csi.k8s.io \
  --image rivomesh:before --upgrade-image rivomesh:after --cross-node \
  --output target/kubernetes-shared-proof
```

For a planned move, confirm the old Pod has exited before attaching its claim on the new node. Keep the claim UID, PV backing volume and application configuration. Verify the original snapshot ID, a newer lease and incremental delivery before declaring recovery. An external journal can fence concurrent Workers. Agent handoff to a different private directory has separate requirements.

See the [verification record](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#lg-06-live-kubernetes-rwo-csi).

The worker-outage profile stops a worker in a disposable Minikube cluster while the database remains on the control plane. CDC resumes with the same volume and a newer lease when the worker returns. Add `--worker-outage-node <test worker>` to run the native YAML outage profile.

### Java 21 deployment

The Docker build defaults to the Temurin 21 Maven image and the Temurin 21 JRE. Helm and native Kubernetes use the built application image. For Linux, confirm that the service's Java executable reports Java 21. For a rolling application update, keep one management entry available and follow the durable task checkpoints and owner lease through each replacement. Record the deployed image digest, Java version and application SHA in the deployment evidence.

Before replacing a Java 21 application image, record the exact JAR and image IDs, confirm the old version's intended task state and take consistent backups of the Agent directory, control store and external journal where used. Keep the same persistent volume on a rolling restart. If restoration is necessary, stop writers, restore a coordinated point and reconcile target-native receipts before restarting from the saved position. A prior development-format application is outside the first-release rollback scope. [Live evidence](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#java-21-exact-release-candidate)
