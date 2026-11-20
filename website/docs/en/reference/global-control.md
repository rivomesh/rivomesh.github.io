---
kind: docs
locale: en
title: "Global task control"
sourcePath: docs/en/global-control.md
---

# Global task control: activation, recovery and limits

[中文](/docs/zh/reference/global-control.html)

Task control defaults to local mode. In fixed-owner global mode, management entries share configuration and read-only state and route durable commands to the owning Agent. See [multi-node deployment](/docs/en/start/multi-node.html) for capacity, handoff and recovery profiles.

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

The session field taskControlScope=GLOBAL identifies this profile. Any entry lists authorized tasks with cursor pagination, owner/node state, global revision, Worker state, desired/active configuration and command results. Creation and import allow a specific execution node or automatic assignment. Import creates a new task. Unavailable owner execution is UNKNOWN, not stopped.

Create/edit/restore/actions return 202 for durable admission only. Configuration history separates desired/active; the active pointer advances after successful owner application. Failed proposals preserve the old active configuration. Masked secret references work across entries. Connection previews, raw differences and repair-plan reads use expiring owner queries and require the owner to be online.

Global maximumTasks/maximumCommands differ from per-node maxTasks/maxRunningTasks. Defaults are 10000 global tasks and 1000 active commands; configuration ranges are resource guards, not hardware throughput promises. Queries are limited to 512KiB requests, 1MiB responses, 1–60 second lifetime, bounded readers and retained capacity.

Filter the shared task list by exact task ID or execution node ID. Both filters also work together. `GET /api/tasks?ownerNodeId=agent-a&taskId=orders&limit=20` applies account grants and the requested filters before computing the total or next page. Keep the same filters when using `after`. Within a task select a destination to isolate its state, SQL error and pending journal transactions. The count is the difference between captured and safely covered sequence at the observation time. Stale observations hide this count. Consumer completion requires its own measurement. [Evidence](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#global-task-filters-and-destination-backlog)

In **Diagnostics**, administrators can switch from **Source capture** to an individual destination. The scoped endpoint is `GET /api/tasks/orders/diagnostics?subscriptionId=warehouse&limit=20`. It returns recent destination pauses, retries and cleared retries with observation timestamps. Capture and destination events have separate rotating files in the execution Agent's private log directory. Destination files share two 64 KiB segments per task. Events can expire during heavy fault activity. Keep the same destination when using `after`. Error text, SQL, row values and credentials are excluded. A cleared retry records the Worker’s recovery observation. Check the destination's acknowledged sequence and pending count for delivery progress.

Each Agent shares a budget of eight diagnostics pages per second across its Controller entries, with an initial burst of 16 pages. On HTTP 429 with `DIAGNOSTICS_RATE_LIMITED`, use the `Retry-After` header and retry the original cursor. Each page carries at most 25 events. Other task status reads and control commands have their own request paths.

For PostgreSQL sources and transactional SQL destinations, the task status field `lastDeliveryTiming` shows the last verifiable sample for each destination. It compares the source commit timestamp on the logical replication wire with the time the Worker observed the destination return from commit. It includes transport time and assumes the source and Worker clocks agree. Synchronize those clocks. If the Worker sees the destination complete before the source timestamp, the API reports `CLOCK_SKEW` without a duration. Both timestamps are UTC. Delay in whole milliseconds and the journal sequence are decimal strings. [PostgreSQL logical replication message formats](https://www.postgresql.org/docs/17/protocol-logicalrep-message-formats.html)

The sample belongs to a specific confirmed transaction. During a pause, retry or backlog, the console labels it historical. Before the first sample or when a newer acknowledgment lacks a direct observation, it reports `UNKNOWN`. Empty projections, snapshots, barriers, skips and reconciliation after an uncertain commit do not produce a sample. Run status, pending count and contiguous delivery progress describe the current task. The latest sample survives Worker restarts and collection of its original log entry.

The same measurement is available for direct MySQL 8.4 writes when `source.expectedVersion` is set to `"8.4"` or an exact 8.4 patch release. Use a local or external journal without writer assignment and a transactional SQL destination. The sample uses the standard GTID event's `original_commit_timestamp` in microseconds, verified against the connected writer's identity and version. The source must have originated the write and report the same original and immediate timestamps. Relayed transactions, older binlogs, missing timestamp metadata, Group Replication and writer-assignment journals report `UNKNOWN`. Group Replication records its original timestamp when the transaction is ready for certification. [MySQL replication delay timestamps](https://dev.mysql.com/doc/refman/8.4/en/replication-delayed.html) · [GTID event format](https://dev.mysql.com/doc/dev/mysql-server/8.4.13/classmysql_1_1binlog_1_1event_1_1Gtid__event.html)

### Automatic assignment for new tasks

In the create wizard or YAML import, select **Assign an Agent automatically**. The control store chooses an authorized, live Agent with task capacity. It compares assigned tasks as a share of each Agent's `maxTasks` and reserves the chosen slot in the same transaction that persists the task. Use `placement: "AUTO"` with `POST /api/tasks`, the configuration and an `X-Request-ID`. To choose a specific Agent, send `ownerNodeId`.

For V3 tasks with a MySQL or PostgreSQL source, MySQL or PostgreSQL destinations and an external PostgreSQL journal, automatic placement checks up to three eligible Agents in capacity order. Each Agent checks its Java 21 Worker launcher and the components required by the source, destinations and journal, then opens the configured journal with a bounded read-only `SELECT 1`. Connector/J is required when MySQL is the source or a destination. Only MySQL sources require the binlog reader. A failed candidate does not acquire the task. If all candidates fail, `AGENT_PLACEMENT_UNAVAILABLE` leaves the global task and journal unchanged. Fix the Agent's driver, credential or journal route and repeat the create request.

This check confirms journal authentication at the time of placement. Use **Check connections and objects** on the saved task to inspect its source and destinations. Other connector and journal profiles still use the existing capacity-based placement rules.

The saved task lists its actual owner. Repeating the accepted request ID and configuration from either Controller returns that owner even if the cluster has since filled its task slots.

### Assess transfer to another Agent

In the task details, select **Assess Agent handoff**. Choose a candidate from the node directory and record the assessment. The dialog shows the candidate's registry status and the recorded blockers. Select **Refresh nodes and assessment** to read current information from either entry. If a submission outcome is unknown, **Retry the same assessment** preserves its request ID and inputs. If another entry saved a newer assessment, review that receipt before recording a replacement.

An administrator can record a handoff assessment from either Controller. Send `POST /api/tasks/{id}/handoff` with an `X-Request-ID` and a JSON body containing `candidateNodeId` and the task's `expectedRevision`. `GET /api/tasks/{id}/handoff` reads the current assessment. To refresh it, send a new request ID and set `expectedAssessment` to the current assessment ID. Retrying the current request with its original inputs returns the same assessment. Both Agents and the task must be in the caller's scope.

The assessment binds the task revision and active configuration, the two Agent registrations, candidate task capacity and the original Agent's observed capture position. It checks for outstanding commands and a complete, acknowledged cut on a supported MySQL source with a PostgreSQL external journal and PostgreSQL or MySQL targets. A change in the observed cut, pending work, Agent registration or available capacity marks the assessment `STALE`. Its checkpoint is represented by a digest. The response excludes source positions, credentials and private recovery files.

`EVIDENCE_REQUIRED` means these control-plane checks passed. The candidate must still prove connectivity and access to the original recovery reports and receipts. `BLOCKED` identifies earlier prerequisites such as an active Worker or exhausted task capacity. Assessment leaves the task owner, Worker, capacity reservations and journal unchanged. The response carries `executionAuthorized: false`.

Send `POST /api/tasks/{id}/handoff/probe` with `expectedAssessment` to ask the currently enrolled candidate to verify the original journal generation, MySQL GTID history and native PostgreSQL/MySQL target receipts. The request uses the candidate's own connection settings and secret resolution. The two read-only queries expire within 30 seconds and verify the task revision and both Agent enrollments again on completion. The latest assessment retains the sanitized result. A stale or replaced assessment requires a refresh before probing again.

The original Agent reports presence of its private validation, source and failure evidence directories and its retained operation receipt count. This inventory leaves private custody with the original Agent and reports `ORIGINAL_PRIVATE_EVIDENCE_CUSTODY_UNPROVEN`. Successful candidate verification clears the connectivity blocker while fresh. The result still carries `executionAuthorized: false`.

To verify custody of completed validation reports, mount the same private storage on both Agents and set `cluster.handoffEvidenceRoot` to the existing absolute path on each Agent. Use owner-only POSIX permissions and an execution identity that can access the mount. The original Agent needs write access and the candidate needs read access. The mount must support file locks and atomic same-directory rename. Earlier tasks and installations continue to use their original report directories.

For Helm, set `cluster.handoffEvidenceClaim` to the same existing ReadWriteMany PVC in both Agent releases. Set each release's `persistence.existingClaim` to its own initialized private state PVC. The chart mounts the shared claim at `/app/handoff-evidence` and passes that path to Rivomesh. Prepare both volumes for the Agent's UID and GID `10001`. The shared claim root requires mode `0700`. This profile omits Pod `fsGroup` so Kubernetes preserves the filesystem permissions. [Kubernetes volume permissions](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/#configure-volume-permission-and-ownership-change-policy-for-pods)

For native Kubernetes YAML, add the existing shared PVC to each Agent Deployment and mount it at `/app/handoff-evidence`. Keep each Agent's own state PVC mounted at `/app/data`. Omit `spec.template.spec.securityContext.fsGroup` for this profile and set `cluster.handoffEvidenceRoot: /app/handoff-evidence` in each Agent ConfigMap. Roll out the updated Agents after preparing the two volumes.

During a probe, the original Agent locks each completed report and exports the exact `rows.mv.db` and `summary.json` bytes. Each attempt handles up to 32 reports within a shared 64 MiB payload budget for reports and historical failure evidence. The scoped archive replaces the previous export for that original task only after a complete write. The candidate verifies the archive digest, assessment, task revision and both Agent directory identities. `probe.sharedReportCustody` reports the result, file size and digest. The protected mount holds the report data. Original archives, signing keys and repair plans remain under the original Agent’s private state. The probe preserves task ownership and returns `executionAuthorized: false`.

The same probe can verify closed operation receipts through `probe.sharedReceiptCustody`. The original Agent matches the signed global command history against its private request signatures, actors and outcomes. It archives only these closed records and the candidate checks their exact bytes in the scoped archive. This first profile covers up to 64 global commands for the selected task. A missing, pruned, mismatched or unresolved local receipt keeps custody unproven. The response contains counts and digests. Receipt import and transfer authorization require separate verification.

`probe.sharedFailureEvidenceCustody` reports custody of up to 64 historical failure records. Under the original store lock, the original Agent verifies the authority scope and the HMAC and content digest of every retained record. The archive contains their exact authority and record bytes. The original Agent keeps the signing key. The candidate verifies the archive digest received over the authenticated owner route, the assessment scope, and the number and shape of archived entries. Missing authority, a changed record, or a busy store prevents the original Agent from publishing that export. The response exposes counts, size and digest. Using a preserved record for recovery requires the original authorization and key.

`probe.sharedRawCaptureCustody` verifies authenticated MySQL binlog archives through a separate private ZIP. Under the native archive lock, the original Agent verifies its HMAC receipt for each retained file and checks the exact file locator, byte count, digest and original owner. It exports the full raw file and its receipt. The candidate obtains the scoped ZIP digest through the authenticated Agent route, then verifies both archive and per-file digests and sizes. Each task can include up to 64 raw archives under a separate 64 MiB budget. A mixed store with unbound files, missing receipts or changed bytes fails source custody while leaving the separate report archive intact. The original Agent provides authenticity with its private key. Controllers expose only custody status, counts, size and digest. The ZIP is limited to verification, with transfer execution subject to separate fencing and approval.

When both Agents verify the exact stopped cut and the original closed receipts, the assessment returns `preparationEvidenceSha256`. If a validation report directory exists, it also requires verified completed-report custody. An administrator can submit `POST /api/tasks/{task}/handoff/preparation` with an `X-Request-ID` and the `expectedAssessment`, `expectedRevision`, and `expectedEvidenceSha256` fields. `GET` on the same route returns the latest preparation, including its expiration and the original and candidate Agent identities.

A preparation expires after 15 minutes on the control database clock. Until expiration or release, new commands and configuration edits for the task are blocked. The candidate reserves one task slot and one Worker slot. The first profile counts every task already assigned to the candidate as a potential Worker, including stopped tasks. Explicit and automatic task placement account for the reservation. A current administrator can immediately release it with `POST /api/tasks/{task}/handoff/preparation/release`, an `X-Request-ID`, and `expectedPreparation`, then manage the original task again. Replaying the same accepted request with the same actor and input returns its recorded preparation even after release or expiration. This preparation keeps the original task owner and writer generation. Transfer execution requires verified source and failure evidence and separate journal and control-store fencing.

To stage verified evidence during an active preparation, an administrator submits `POST /api/tasks/{task}/handoff/preparation/stage` with `X-Request-ID`, `expectedPreparation`, `expectedRevision` and `expectedEvidenceSha256`. The candidate checks the original archive digest and scope, verifies completed reports under their report locks and writes a sealed manifest with per-file SHA-256 values. The candidate then publishes the directory atomically under its private state path. An authenticated replay verifies the existing files without replacing them. A new Agent incarnation or an expired or released preparation requires a new review. The response reports counts and `executionAuthorized: false`. The candidate stages completed reports and closed receipts for custody only. The staged files have distinct names. The standard validation report reader refuses to open a staged directory. A candidate can hold up to 16 staging directories, including interrupted copies. Its live task registry, report paths and writer rights stay unchanged.

For a new fixed-owner MySQL task with a PostgreSQL external journal and MySQL or PostgreSQL targets, set `nodeId` to the registered original Agent ID, set `journal.managedWriter: true`, and set `journal.writerAssignment` to a new UUID. Run `java -jar rivomesh.jar init-writer task.yml` with the journal credentials before creating the task on that Agent. Automatic placement and ordinary configuration changes to this writer binding are refused. Existing unassigned journals require their own migration. The standalone `transfer-writer` command refuses this journal even when the candidate configuration omits `managedWriter`.

A verified preparation records the original assignment and a private successor assignment for this request. The response reports digests through `writerActivation`. When both stores use the same PostgreSQL JDBC URL and the control database role can lock the journal rows, `checkedInControlTransaction` confirms that the control transaction checked the same expired or released journal lease, capture cut, and acknowledged subscription positions. The task and writer placement stay with the original Agent during this check.

For a managed task whose PostgreSQL control and journal share one database, the stage response can include `offlineInventory` with `profile: CLOSED_RECEIPTS_ONLY`. The stopped original Agent confirms that its private reports, failure records and raw captures are absent and that it has no previously adopted history. The Controller compares every closed receipt with the current authenticated command history. The candidate seals the exact receipt payload on its private volume and can recheck it there after the shared transfer archive is unavailable. Candidate state and the transfer archive must use disjoint paths. For disaster recovery, put the candidate volume in a separate storage failure domain. A previously sealed ordinary stage retains its unchanged readiness and needs a new preparation to certify complete inventory. This receipt certifies the bounded inventory; freezing a writer and changing ownership require separate execution steps.

In the console, open **Assess Agent handoff**. After verifying the current evidence, choose **Reserve task and Worker slots**. You can view the same receipt and expiration from either Controller. During an active reservation, choose **Stage reports and receipts** to copy the verified report archive and closed receipts into private storage on the candidate. The console shows their counts after the candidate verifies them. Select **Reverify staged reports and receipts** to check the same files again. After reopening the panel from either Controller, **Stage reports and receipts** also verifies an existing staged copy for that reservation. Select **Release reservation** before sending a new command to the original task.

After the control transaction commits ownership, open the handoff panel and select **Refresh handoff status**. **Ownership committed** means the candidate still needs to install the reviewed configuration. **Candidate configuration installed** records that the candidate saved the task in a stopped state. **Evidence received** adds the counts of verified reports and closed receipts received by the candidate. The panel binds the signed receipt to the candidate and the committed configuration. After the Worker is admitted, later lifecycle revisions leave the handoff receipt available. The same administrator needs grants for the task and both Agents.

The verified same-store profile installs original reports and closed receipts after the internal transfer. The candidate can serve that history read-only from either Controller at the original cut. While it is stopped, `HANDOFF_PARKED` and journal formats 15–18 block direct Worker launch and generic resume. Upgrade the Controllers and Agents that share this journal before running the new handoff profile. Older units refuse the new format. Worker start has its own approval after ownership transfer and SQL target fencing.

### Freeze the original writer

An administrator can freeze the original writer while its Agent is healthy, the task is stopped and every SQL destination has acknowledged the same cut. This workflow requires an initial managed journal assignment, one PostgreSQL control and journal database, and a staged `CLOSED_RECEIPTS_ONLY` inventory. Retain `offlineInventory.manifestSha256` from the staging response. Both Agent bindings and the task revision must still be current.

Submit `POST /api/tasks/{task}/handoff/preparation/freeze-original` with a new `X-Request-ID` and four JSON fields, `expectedPreparation`, `expectedRevision`, `expectedEvidenceSha256` and `expectedInventorySha256`. Give the inventory field the staged manifest digest. The candidate rechecks that exact private copy. The original Agent rechecks its stopped task, complete local receipts and current native cut. The shared PostgreSQL transaction advances the epoch, clears the original journal lease and records `ORIGINAL_FROZEN`. Check the frozen epoch from either Controller in the preparation receipt. Ownership and destination data stay at the original cut. The freeze blocks ordinary START, configuration changes, release and ownership confirmation.

To cancel a freeze, use `POST /api/tasks/{task}/handoff/preparation/cancel-freeze` with the same four values and a different request ID. The original Agent must be healthy on the same private directory, including after a process restart. Cancellation rechecks its original inventory and native cut. Only a still-frozen record can be cancelled. The original assignment becomes available at a higher unclaimed journal epoch, and the task remains stopped until explicitly started. Repeating the same request reads the recorded phase. Cancellation requires restoring the original Agent if it is offline.

### Transfer a frozen task after losing the original Agent

Use the frozen preparation and exact candidate enrollment recorded while the original Agent was healthy. The original node must report `STALE` after its exact registered lease expires on the database clock. Confirm the original Agent is unavailable. A live lease, a different original lease identity or an unavailable candidate blocks the transfer. For unplanned loss before a durable freeze, restore the original Agent and its private state.

Open the frozen preparation in the handoff panel and refresh until the original Agent lease shows as expired. Review the freeze request and inventory digest, confirm that the original Agent is unavailable and choose **Transfer frozen task ownership**. For automation, the administrator who froze the task can submit `POST /api/tasks/{task}/handoff/preparation/commit-offline-owner` from either Controller. Use a new `X-Request-ID`, the same four values used to freeze the task, and JSON boolean `"confirmOriginalUnavailable": true`. The request checks the freezing administrator’s current task and Agent permissions. The candidate rechecks its exact private sealed inventory and the native source and destination cut. The shared archive can be unavailable once the candidate copy is verified. A missing or modified candidate copy blocks transfer.

The shared PostgreSQL transaction changes the task owner and assigns the previously frozen, unclaimed journal epoch to the candidate. Ownership then projects as a stopped task and the candidate adopts the closed receipts. Check the signed preparation from either Controller. Its `offlineOwnerCommit` identifies the freeze and approval requests. If the response is lost, reissue the identical request with the same administrator and request ID. After commit the original assignment is retired, including if its old directory and Agent later return.

Keep the task stopped until the receipt reports `EVIDENCE_ADOPTED`. Approve **Fence SQL targets**, wait for `TARGETS_FENCED` and separately approve **Start candidate Worker**. The writable candidate resumes from the same cut. This workflow requires the initial managed MySQL-source journal assignment, a shared PostgreSQL control and journal database, PostgreSQL or MySQL targets, and the complete `CLOSED_RECEIPTS_ONLY` profile.

### Commit a reviewed owner change

Stage and verify the evidence for a prepared same-store managed SQL handoff. The **Commit ownership transfer** action uses the exact staged receipt. The candidate checks its private files, writer configuration and authorization again before the control database commits ownership. The original Agent must have stopped at the reviewed cut. If original source or failure evidence still needs to be adopted, the transfer is refused.

For automation, send `POST /api/tasks/{id}/handoff/preparation/commit-owner` with `X-Request-ID`, `expectedPreparation`, `expectedRevision` and `expectedEvidenceSha256`. Use the original prepared revision and digest. The Controller retrieves the private candidate configuration and preparation from signed records. An accepted transfer moves ownership to the candidate and parks the journal transactionally. The candidate then installs the task as stopped and receives the report history.

If the Controller disconnects, read the preparation from either entry. Retry a bound operation with the same request ID. The preparation returns `commitRequestId` while a request is bound and after transfer. A fresh preparation is required when the reviewed cut, candidate binding or authorization changes before commit.

### Verify a handoff across separate journal and control databases

A managed PostgreSQL journal in a separate database can verify the original stopped cut and stage reports and closed receipts under a reservation. The candidate must reach the journal, source and destinations as well as the control database. Restoring a disconnected journal route allows a fresh probe. An authenticated stage retry can verify an existing private copy when the shared archive is unavailable.

The console shows why ownership commit is unavailable. The preparation returns `checkedInControlTransaction: false` and `commitBlocker: HANDOFF_MANAGED_CONTROL_CUT_REQUIRED`. Both Controller entries refuse ownership commit before binding the request. The original Agent and the journal and target checkpoints remain in place. Release the reservation to restart the original Agent from the same cut. Ownership activation across databases needs a separate durable protocol.

### Fence the parked SQL targets

After the candidate has adopted the signed report and receipt history, an administrator can select **Fence SQL targets** in the handoff panel. For API approval, use `POST /api/tasks/{id}/handoff/preparation/fence-targets` with `X-Request-ID` and the JSON fields `expectedPreparation` and `expectedRevision`. Use the preparation ID and the **committed** task revision displayed in the handoff panel. `202` acknowledges durable approval. Read `GET /api/tasks/{id}/handoff/preparation` or refresh the handoff panel to follow `FENCE_PENDING` and `TARGETS_FENCED`.

The first profile uses a MySQL source, one shared PostgreSQL control and journal database, and at most eight PostgreSQL or MySQL targets at a common original epoch. The candidate independently verifies its installed configuration, archived evidence, source log coverage, and original target checkpoints and snapshots. Each target transaction advances its writer epoch under its checkpoint row lock. Transaction receipts, snapshot IDs and source position remain at the reviewed cut. The journal stays parked and the Worker stays stopped.

Keep the same request ID to read the receipt from either Controller. If the candidate or a database stops during execution, the approved request stays pending and the candidate resumes from the native target epochs when it returns. A different request cannot replace a current approval. If account authorization changes while fencing is pending, refresh and select **Approve SQL fencing again**. Use a fresh request ID when approving through the API. A changed cut or lost snapshot keeps the request pending. The handoff panel shows the latest verified blocker and its timestamp. The Agent log also records the `HANDOFF_TARGET_FENCE` diagnostic. Worker activation requires separate admission.

### Start the candidate Worker

After **Targets fenced**, select **Start candidate Worker**. The API uses `POST /api/tasks/{id}/handoff/preparation/start-worker` with a new `X-Request-ID` and the same `expectedPreparation` and `expectedRevision` as the fencing request. Retry an uncertain result with the same request ID and payload.

| Handoff state | What to check |
| --- | --- |
| `START_PENDING` | The approval is durable. The candidate checks the source cut and each native target checkpoint again. If a check fails, the Worker remains stopped. Refresh the handoff panel to see the latest blocker and when the candidate observed it. |
| `WORKER_ADMITTED` | The shared PostgreSQL transaction opened the journal to the candidate assignment and recorded the approved request. The candidate still needs to save the local start intent. |
| `WORKER_PROJECTED` | The candidate saved the start intent. Check the Worker state and capture lease in task details to confirm actual execution. |

Journal formats 19–22 mark the admitted assignment, preserve enabled recovery features and fence older runtimes. The candidate still acquires the normal exclusive lease and respects available Worker slots. It consumes the original source checkpoint and snapshot generation. Once the start intent is saved, use the ordinary task controls. Replaying the handoff approval preserves a later operator stop. Task and node grants govern access to original report history and closed receipts. New reports are stored in the candidate’s ordinary workspace.

During the pending approval, a changed target receipt, unavailable source logs or a revoked administrator authorization leaves the task parked. Check the candidate log and restore the reviewed database state before retry. If authorization changes, an eligible administrator can refresh the handoff panel and select **Approve Worker start again**. The panel allocates a fresh request ID. API callers should use a fresh request ID and the existing preparation and committed revision. This profile covers the same PostgreSQL control/journal store and the same MySQL and PostgreSQL target profiles as the fencing step. Automatic host takeover and partition recovery have separate acceptance criteria.

## Admission and recovery

PENDING is durable queueing. DISPATCHED saves the exact original local request/revision before invocation. ACCEPTED is local durable admission. SUCCEEDED/FAILED come from actual operation receipts. UNKNOWN requires reconciliation, not a success claim or reissue under a new revision. Startup restores receipt protection and validates local configuration against shared authority before scheduling.

The latest startup fix scans all outstanding command pages, including undispatched STOP/PAUSE. Corresponding Workers cannot restore old RUNNING intent before local durable admission; older local operations may finish and stop commands receive priority retries. Rejection after authorization changes releases the block; uncertainty retains it. Focused tests and the application build pass; native business acceptance remains candidate-specific and does not retroactively change earlier evidence.

TASK_BUSY/OPERATION_PENDING retain the original request. Outstanding receipts bypass ordinary 500-entry pruning. Cancellation has a parent and reserved capacity: cancel undispatched work atomically, reconcile uncertain delivery first, and perform actual cancellation after local admission. Success does not imply all targets rolled back.

Offline STOP waits for the original owner. Restore its private directory or volume and the associated keys. In a combined deployment, Controller shutdown stops its local Workers. In a separate deployment, Agents have their own lifecycle. MySQL primary promotion has separate recovery procedures.

### Unexpected original Agent outage

1. Open the same task from either management entry. **Execution node control lease** shows the current lease in the shared control database. `GET /api/tasks/{task}` returns `ownerControlState` alongside the existing `ownerState`, which also tracks whether the task observation is current. After the control lease expires, the Worker, run intent and capture lease are `UNKNOWN`. The assigned node and task revision retain their last committed values. A new process using the same node ID can acquire a control lease before it binds to the assigned directory. The task then shows registration in progress, with Worker and capture state still `UNKNOWN`. A different private directory is refused with `AGENT_DIRECTORY_CHANGED`.
2. Open **Assess Agent handoff** and check **Original Agent control lease**. A previous assessment becomes `STALE`. Start a new assessment to see `ORIGINAL_TASK_STATE_UNVERIFIED` when the original Worker and its native cut are unverified. The probe refuses the assessment and the candidate gains no ownership or start authority from it.
3. To keep the task stopped when the original Agent returns, submit STOP from either entry and record its request ID. Restart the original Agent with its existing private directory, keys and node identity. Queueing STOP advances the task revision and preserves the active configuration version. Wait for the same request to reach `SUCCEEDED` and for both entries to show Worker `STOPPED` and capture lease `UNCLAIMED` or `EXPIRED`. Retain the source logs during the outage. Check the target positions before explicitly starting the original task.

The control lease and journal capture lease each have their own native fence. The original Agent registers a new control generation when it reuses its directory, and the Worker acquires a new capture generation on start. Lease expiry alone is insufficient evidence of a drained Worker, complete private recovery evidence or the reviewed cut on both targets. The atomic handoff with control and journal in the same PostgreSQL database still requires current original Agent, source and target proofs and administrator approval. If the original Agent cannot return or the partition persists, keep the existing assignment while you recover that evidence.

For an unreachable original Agent, the handoff receipt shows the last recorded drain cut, original report/receipt custody and whether the review still matches the current task. The offline panel is read-only. A complete independent archive and durable writer freeze are required to make such an outage eligible for future transfer.

### Asymmetric control-network partition

For a managed writer with control and journal in the same PostgreSQL database, the Agent and its targets can remain reachable while the Agent loses its database path. Both management entries report the shared control lease as `STALE` after it expires. The Worker, run intent and capture lease are `UNKNOWN` while the entries lack a current signed observation.

The Agent disarms starts for managed journal Workers when it loses control authority and terminates their local processes. It keeps the saved run intent and journal position. Once the link is restored, the same Agent must revalidate its signed directory, current lease generation and task configuration. It waits for former Worker processes to exit and loads durable STOP and PAUSE commands before allowing managed Workers to launch. This happens inside the original Agent process.

To keep a task stopped while restoring the link, queue STOP through either Controller. Check the same request ID for `SUCCEEDED` and confirm the original task is stopped before starting it explicitly. Retain the source logs and verify both target receipts if a transaction was in flight. The candidate does not gain ownership from lease expiry. Separate control and journal stores, destination-specific cuts and approval without the original private evidence require their own validation.

#### A SQL transaction in flight

Each SQL destination has its own native transaction receipt and journal acknowledgement. During a control-path partition, the journal can already contain the source transaction while a destination still waits on a row lock. Compare the retained sequence and each destination receipt before deciding which delivery remains outstanding. PostgreSQL exposes blocking sessions through `pg_blocking_pids`. [PostgreSQL lock inspection](https://www.postgresql.org/docs/17/functions-info.html) · [PostgreSQL row locks](https://www.postgresql.org/docs/17/explicit-locking.html)

The same-store fixture holds the PostgreSQL row lock until the former Worker has exited. The MySQL target already has a native commit and journal acknowledgement. Releasing the PostgreSQL lock while the original Agent is still partitioned leaves the former PostgreSQL transaction rolled back. After restoring the original Agent, wait for its queued STOP to succeed before explicitly starting it. The captured position stays at the recorded transaction and only the PostgreSQL delivery is replayed. The fixture checks the same transaction identity and counts one committed insert and one committed update in each target database log.

#### A committed target with a missing journal acknowledgement

During a partition a target's native checkpoint can be one transaction ahead of its journal acknowledgement. The target commits its business rows and native receipt together. Once the original Agent returns, the Worker compares the retained transaction's ID and projected hash with the target receipt. A matching receipt advances that destination's acknowledgement. The sibling target keeps its confirmed position. The accepted source position and both targets' prior business writes remain stable.

The shared PostgreSQL control and journal fixture can interrupt the acknowledgement for either the PostgreSQL or the MySQL 8.4 target. The fixture first locks the chosen target’s business row, waits for the other target to commit and acknowledge the source transaction, then moves the lock to the chosen target’s journal acknowledgement row. The MySQL case verifies the real InnoDB record wait through Performance Schema. After the original Agent returns, confirm the queued STOP and explicitly start the task. The fixture checks the unchanged native receipt identities, the recovered acknowledgement and the commit history of both targets. [MySQL native lock waits](https://dev.mysql.com/doc/refman/8.4/en/performance-schema-data-lock-waits-table.html)

Managed PostgreSQL acknowledgements set a transaction-local idle timeout before acquiring journal row locks. The existing capture lease duration bounds the timeout and a shorter nonzero PostgreSQL session setting takes precedence. When a disconnected client has left an idle acknowledgement transaction, PostgreSQL rolls it back and releases its locks even while the Agent route remains down. [PostgreSQL client connection defaults](https://www.postgresql.org/docs/17/runtime-config-client.html)

A permanently unavailable original Agent keeps the handoff blocked while its signed stopped state and private recovery evidence are missing. Administrator approval still requires the original directory binding, current evidence for the reviewed cut and the original and candidate node grants. An intact target receipt can settle a delivery acknowledgement while ownership remains assigned to the original Agent.

## Operations FAQ

**How do I distinguish accepted from executed?** Inspect deliveryStatus, status, code and actual Worker/target checkpoints for the same request ID. HTTP 202 is not business commit evidence.

**Does refresh or another entry preserve login?** Shared sessions restore identity subject to cookie domain, Secure, SameSite, expiry and revocation. Different domains require correct proxy/session configuration.

**Can A stop an offline owner?** A durably queues STOP. It stays pending/unknown until the original owner supplies an actual receipt. Heartbeat expiry does not prove process termination.

**Can I edit owner fields, delete root tables or use an empty directory?** No. Authenticated metadata, counts, private-directory identity, receipts and configuration projections reject missing/substituted authority.

**Does control-store failure fall back to local accounts?** No. Management refuses control without shared authority. Existing data-process behavior follows its journal/lease/target protocol; management availability does not establish complete data-plane fencing.

**What belongs in backups?** Coordinate the control database, every private directory, logs/reports/local journal, external journal if selected, and original keys. Restoring just a cursor or old control snapshot is insufficient; automated coordination and old-backup fault matrices remain open.

**What is already evidenced?** Earlier candidates cover real PostgreSQL/MySQL control stores, two independent JVMs, HTTPS/shared login, A creating B-owned tasks and offline commands. Configuration fixtures also invoke real TaskService with fixture Workers. The startup fix and real cross-node business CDC are under additional acceptance. These do not establish all cluster, adapter or hardware profiles.

**Why is no persistent preview running?** The user requested temporary fixtures only. They remove their own containers/volumes and leave unrelated resources untouched.
