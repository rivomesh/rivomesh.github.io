---
kind: docs
locale: en
title: "Global task control progress"
sourcePath: docs/en/global-control.md
---

# Global task control: implementation and recovery limits

[中文](/docs/zh/reference/global-control.html) · [SDD design](/docs/en/sdd/design-global-control.html)

2026-11-17: the public console still uses local task control. The components below are implemented and have focused tests; runtime, migration and UI integration are ongoing. CP-02/03 are not complete. There is no deployment flag enabling complete global control yet. Sharing controller.json or increasing replica count does not complete that work.

| Component | Implemented | Open |
|---|---|---|
| GlobalTaskStore | Globally unique IDs, encrypted configurations, revisions, authorized SQL pagination, request replay | Public runtime wiring, migration and complete business acceptance; configuration/history/restore and desired/active version workflows now have focused development tests |
| AgentDirectory | Registry lease/incarnation/private directory binding; missing or replaced authority refuses reseeding | Formal agent lifecycle, relocation and failover |
| DurableCommands / OwnerExecution | Durable admission, immutable original local request/revision, real TaskService invocation, receipt recovery, cancellation and local-busy retry | Public routing, startup receipt protection and independent execution lifecycle |
| GlobalTaskViews | Authenticated encrypted observations, separate global/owner revisions, UNKNOWN for stale/offline owners | Complete logs/metrics/filtering/UI |
| OwnerQueries | Typed read-only requests, encrypted results, expiry, fresh authorization and size/capacity limits | Entry/reader-pool integration and configuration preview translation |

## Admission, execution and unknown outcomes

PENDING means durable admission. DISPATCHED means delivery to the fixed owner; the exact original local request/revision is persisted before invocation. ACCEPTED means local durable acceptance, not asynchronous business success. SUCCEEDED/FAILED follow actual local receipts. UNKNOWN means evidence is insufficient: never claim success or issue the operation again under a new revision.

Lost replies reconcile the original receipt. Reopening reuses the original request. A service can record an already committed outcome after actor authorization changes, while new execution rechecks current identity. Missing receipts plus a changed local revision remain UNKNOWN; the complete operator reconciliation workflow is still open.

TASK_BUSY/OPERATION_PENDING wait without changing the request/revision. Outstanding local receipts are protected from ordinary500-entry pruning while active. Formal global startup must restore all outstanding protections before mutation APIs become available.

## Cancellation and offline owners

Cancellation has a parent and reserved admission capacity. An undispatched parent can be atomically cancelled. A dispatched parent with an uncertain reply is reconciled first; actual cancellation follows local acceptance. A successful cancellation request does not prove all targets rolled back: inspect the original operation and native receipts.

Offline owner execution is UNKNOWN. STOP remains pending rather than claiming that a remote process stopped. Renewed heartbeats do not establish safe takeover of old Workers. Reusing nodeId with an empty replacement directory is refused; restore the original directory/volume. Automatic migration/failover remains CP-04/07.

## Queries and confidentiality

The query channel rejects mutations. Requests/results bind the task, owner, directory, node epoch and shared account revision and use authenticated encryption. Authorization is rechecked before execution, result publication and delivery. Row/report values are not placed in node URLs. Current component limits are512KiB requests,1MiB results, bounded retained capacity and1–60second expiry; these are not hardware throughput promises.

ownerObservedAt is observation publication time; observedAt retains the original local status sampling time. Republishing an observation must not make old source/destination metrics look newly sampled.

## FAQ

**Why can shared login work before global tasks?** Identity, sessions, configuration and execution ownership are separate authorities. SE-04 is accepted; CP-02/03 integration remains open.

**Can database owner/directory fields be edited manually to force takeover?** No. Authenticated records refuse substitution. Moving only a cursor also does not restore events, reports, keys or Worker fencing.

**Does a control-store outage fall back to local identities?** No. Existing data-process behavior follows the selected journal/fencing profile; the management plane cannot treat unavailable shared authority as healthy.

**Does native SQL acceptance establish full cluster safety?** No. `tests/owner-control-native.py` exercises real PostgreSQL/MySQL and TaskService with fixture Workers. It does not establish two-JVM HTTP, actual business CDC, liveK8s/CSI, automatic failover or capacity acceptance.

**Why is no persistent preview running?** The user explicitly requested none. Temporary fixtures remove their own containers/volumes/images and leave unrelated projects untouched.

2026-11-17 configuration increment: cross-entry secret references, remote previews, authenticated parent-chain history/pagination, restore, rejection preserving active configuration and global request-ID collision guards passed56focused cases. This work is newer than1e474ad1; package/native acceptance is tracked separately. Current SDD:6DONE/33PARTIAL/9NEW.
