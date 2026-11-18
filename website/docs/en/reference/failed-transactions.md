---
kind: docs
locale: en
title: "Failed transaction diagnostics"
sourcePath: docs/en/failed-transactions.md
---

# Failed-transaction diagnostics and manual recovery

[中文](/docs/zh/reference/failed-transactions.html) · [SDD contract](/docs/en/sdd/design-failed-transactions.html)

The UI supports destination phase summaries,original incremental retry,snapshot-part recovery and [administrator transaction review](/docs/en/reference/failure-review.html). Bounded inspection/[durable evidence](/docs/en/reference/failure-evidence.html) now back explicit raw/normalized event pages. Manual skip and independent corrective entry remain unavailable. Common-cut report-driven repair is documented in [managed repair](/docs/en/reference/managed-repair.html);it is not failed-queue compensation.

## UI workflow

1. Open the paused destination in task details. Record destination ID,error generation,ACK,error code,phase and failed sequence when available.
2. For activation faults,check connectivity,credentials,permissions and metadata. For apply faults,check types,constraints and destination data. For projection faults,check mappings and historical schemas. For reconciliation faults,verify native receipts and journal ACKs before changing anything;do not manually advance positions.
3. Fix the cause and select “Resume this target.” The request binds its error generation,retrying the whole original incremental transaction or reconciling/resuming snapshot parts. Stale generations refuse. Pipeline resume and destination resume are distinct.
4. Check catch-up and run appropriate reconciliation. Accepted commands,live processes or matching ACKs alone do not prove business takeover readiness.

Activation can fail before a transaction is identified,so no invented failed sequence is shown. Legacy pauses without trusted phase records remain Unknown. Corrupt diagnostics are visibly unavailable and raw inspection refuses. Equal SQLStates do not make activation and apply faults equivalent.

Existing global task queries carry summaries through different management entries. Summaries contain only phase,sequence and failure epoch;no event IDs,row values,SQL or credentials. Existing task-view grants apply. Ordinary status does not gain raw-value access. Initial preparation/snapshot have dedicated diagnostics;legacy records may remain Unknown. Complete source connection/read/decode/DDL phases remain open. See [native snapshot evidence](/docs/zh/evidence/baseline.html).

[Accepted scope and evidence](/docs/zh/evidence/baseline.html) cover internal inspection,two-entry real SQL fault/restart and five-JRE foundation contracts;they do not accept the complete manual recovery workflow.

## Internal inspection limits

`Journal.inspectFailure(subscription, expectedErrorGeneration, maximumBytes)` reads only a paused subscriber's next whole transaction. It binds stream generation,current epoch,configuration fingerprint,error generation and ACK and verifies raw/existing normalized hashes. It never connects to or activates business destinations,creates normalization,changes keyless identities or advances ACK. Missing complete boundaries refuse rather than being guessed.

Raw and normalized payloads share a maximum4MiB budget;diagnostics have a separate16KiB limit. Stored-length checks and bounded character streaming enforce limits,with UTF-8 byte verification. Unconsumed normalization reservations may conservatively refuse a payload early. Oversize refuses the whole review rather than approving a truncated transaction. Streaming large-transaction review remains open.

This low-level inspection is not an execution plan;managed access adds [durable creation,authorization and audit](/docs/en/reference/failure-review.html). Its returned object alone is not durable evidence or approval. Paused ACKs pin history;resume can allow collection. UI review reads retained records. Manual native-checkpoint reconciliation,approval and gaps remain open. Preparation/snapshot faults explicitly refuse inspection as failed incremental transactions.

## FAQ

**Can I skip an error like a MySQL replica?** Not yet. One source transaction can span tables/events. Future skip applies to a whole transaction for an explicit destination and requires native SKIP receipts,durable gaps and idempotent recovery. Editing ACKs/GTIDs or deleting logs breaks recovery guarantees.

**What if the destination committed but the response was lost?** Automatic delivery verifies destination checkpoints,transaction IDs and projected-content hashes before repairing journal ACKs. Unknown outcomes stop/retry rather than authorizing skip. Manual compensation must reconcile first too.

**Can a source update fix an old transaction?** It creates a new transaction;persisted old events remain unchanged. Fix the destination condition preventing old replay. Future compensation must use historical images and current destination state.

**Does restart clear an error?** No. Pause,error generation and phase diagnostics persist. Explicit resume remains necessary. Healthy destinations may continue while the paused subscriber retains history and consumes quota.

**Can Unknown be treated as an apply error?** No. Legacy records,corrupt diagnostics and capture/decode faults do not establish a known skippable transaction. Inspect source history,retention and historical configuration first.

**What if required binlogs were purged or cannot be decoded?** Destination resume cannot recreate source history. Restore logs,use a qualified source retaining required history or prepare a new baseline/rebuild. Controlled gap recovery and all-affected-destination accounting remain open under RC-04/08.

**Can I patch destination rows directly?** Synchronization assumes exclusive destination writes. Unplanned edits can affect constraints,keyless identities and replay. Typed UI corrective entry,drift checks and atomic compensation receipts belong to RC-06/07 and are not available yet.
