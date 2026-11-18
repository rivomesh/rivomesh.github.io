---
kind: docs
locale: en
title: "RC-05: failed-transaction native checkpoint reconciliation"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-checkpoint-recovery.en.md
---

# RC-05: failed-transaction native checkpoint reconciliation

Status: RC-05 bounded profile accepted;see [evidence](/docs/zh/evidence/baseline.html). RC-02 historical evidence semantics remain unchanged;skip and compensation remain separate.

Delivery order: expose a read-only comparison in transaction review; add authorized, drift-checked, idempotent acknowledgment of verified commits; make the check mandatory for later skip/compensation operations and accept the complete UI workflow.

## Read-only comparison

The initial production profile is transactional PostgreSQL and MySQL destinations. Derive connections, subscriptions and mappings from the current task configuration. Verify its fingerprint and the journal subscription set. Open existing metadata only: no initialization, activation, normalization, ACK or resume.

Read the paused head before and after native I/O. Both observations must exactly match retained evidence, including source position, raw/normalized transactions, generation, owner epoch, subscription ACK, error generation/code and diagnostic. Require an existing normalized transaction; never reconstruct history from current source rows or allocate new keyless identities.

Automatic apply and recovery share `TransactionProjection`. Preserve complete transaction identity and BARRIER events, filter by destination mappings, and compute the native transaction hash using referenced historical schema versions.

| Native checkpoint | Result | Meaning |
| --- | --- | --- |
| Equal to journal ACK | CHECKPOINT_NOT_ADVANCED | Does not prove absent business data or authorize skipping |
| ACK+1 with identical transaction ID and projected hash | COMMITTED_UNACKNOWLEDGED | Reconcile acknowledgment; do not compensate/relabel as an unapplied skip |
| Invalid sequence, mismatched content or native epoch ahead | Refuse | Investigate divergence, wrong target or external writes |
| Native epoch behind | targetFenceRequired | Read-only inspection does not activate; later mutation must fence first |

Return evidence ID/hash, observation time and both checkpoints. This is a historical observation, never a durable execution approval. The UI must label it accordingly and handle older Agents returning no checkpoint field.

## Manual acknowledgment constraints

Recheck current authority, configuration, evidence and native checkpoint at execution. Hold journal job/subscription locks against ownership and resume changes; hold the native checkpoint row lock against concurrent apply. Commit journal ACK and a durable operation receipt atomically. Keep the subscription paused and increment its error generation. Repeated operation IDs return the original receipt without rewriting business rows.

The current confirmation refuses a lagging native epoch;complete fencing through the existing pause workflow and retain fresh evidence before retrying. Do not commit ACK while depending on an uncommitted native epoch update. This operation confirms a proven native APPLY; it does not fabricate a SKIP. New cross-node mutations require explicit protocol/capability admission before routing to Agents.

## Focused acceptance

Cover real commits leading ACK; ID/hash mismatches; mapping filters, empty projections and BARRIER; missing normalization/history; changed error/epoch/config; concurrent resume; missing metadata without recreation; lagging epoch without activation; and summaries without row values. Run related H2/native SQL and DOM contracts first, then the complete feature's end-to-end and compatibility gates.

## First manual-ACK profile

Require the entire pipeline PAUSED,not only the failing subscriber. Pause first advances the journal epoch and revokes old Workers;confirm destination fencing,then retain fresh evidence. At execution hold job/subscription and native checkpoint locks,require equal fenced epochs,commit ACK plus receipt atomically and leave both pauses in place. No automatic activation occurs in confirmation. A lagging destination requires retrying the existing pause/fence procedure and new evidence. The transactional implementation,HTTP/UI and protocol6 admission passed the bounded profile;see the [guide](/docs/en/reference/commit-acknowledgement.html).
