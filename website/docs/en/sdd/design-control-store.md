---
kind: docs
locale: en
title: "Control store design"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-control-store.en.md
---

# CP-01/02/03: shared control storage and node registry

[中文](/docs/zh/sdd/design-control-store.html). Establish the contract before implementation/acceptance. Node visibility alone does not provide global task control.

Standalone local mode remains the default. Explicit `cluster` configuration selects a separate SQL control namespace: PostgreSQL/MySQL initially, with H2 for protocol tests. Control metadata and CDC journals/business targets have different roles; separate namespaces may reuse an SQL instance. Use dedicated credentials and bounded connections/queries; never expose connection URLs, credentials or business data in the UI.

`rmc_cluster` stores clusterId, protocol format and a consistent lease duration. Incompatible settings refuse startup. `rmc_node` stores stable nodeId, process incarnation, registration epoch, database-clock heartbeat/lease, lifecycle state and actual version/JVM/architecture/capacity. Registration serializes capacity checks on the cluster row. Another process cannot overwrite an active nodeId. Heartbeat and shutdown check incarnation/epoch so stale processes cannot renew or change a replacement's row. Database time determines expiry.

`rmc_node_task` initially contains only whitelisted observations: task ID, revision, desired/Worker state and observation time. It is not global task authority and cannot authorize scheduling/recovery. Duplicate observed task IDs indicate a conflict; they do not establish uniqueness or failover. Global configuration/commands, idempotent receipts, execution fencing, shared accounts/audit and shared sessions remain CP-02/03/04/05/07 and SE-04 work.

Registry reads use a consistent database snapshot and return observation time, heartbeat, expiry, HEALTHY/STALE/STOPPED, epoch and real version/JVM/architecture/CPU/heap/configured capacity. Keyset pagination and bounded node/task counts limit responses. Expired records remain visibly stale; storage failure returns503 rather than claiming cached health.

Initially only ADMIN can inspect global node/task observations. VIEWER/OPERATOR retain existing task permissions. The UI distinguishes registry visibility from local task operations until remote commands are implemented. Filesystem paths, secrets and raw logs are excluded. Registry leases do not replace CDC/target Worker fencing.

Startup validates/creates the control schema, registers and starts a bounded independent heartbeat thread. Graceful shutdown stops heartbeats and marks only its own incarnation STOPPED. Kill/power loss becomes STALE through database expiry. Control-store failure affects readiness and registry requests; existing Workers retain their journal lease behavior without global takeover commands.

Acceptance covers independent local directories sharing the registry, concurrent registration, active-ID collision, expiry/replacement, stale heartbeat/shutdown refusal, server time/capacity/pagination, redaction and HTTP roles. Native PostgreSQL/MySQL two-node startup/kill/reopen/storage-outage checks, current artifact/UI and bilingual operations are required. Passing the registry closes only CP-01.
