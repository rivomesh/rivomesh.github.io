---
kind: docs
locale: en
title: "Reconciliation workflow"
sourcePath: docs/en/reconciliation-workflow.md
---

# Data reconciliation, repair and a common cut

The common barrier, MySQL consistent view, private disk staging, transactional SQL row comparison and CLI are implemented. The LOCAL/H2 and external PostgreSQL/MySQL/openGauss barrier profiles passed native acceptance; the newer row-comparison scope is recorded separately. The accepted CLI and UI repair profiles are described in the [repair guide](/docs/en/reference/managed-repair.html).

## Implemented foundation

`SourceAdapter.ConsistentRead` represents one view across tables. Source-specific `covers` interprets position coverage; generic `SourcePosition` does not order GTID/LSN/SCN strings. MySQL uses GTID-set coverage.

`PipelineValidationBarrier.open(config, selectedTargets, maximumGateMillis, maximumReadMillis)` checks the existing journal identity/running state/completed snapshots, obtains a bounded MySQL global read lock, establishes one REPEATABLE READ view and pins declared table metadata across configured databases. It records the source cut, waits for capture/normalization and selected target ACKs, then rechecks generation/epoch/position/sequence/snapshot acknowledgments under the journal job lock before persistently pausing and incrementing the epoch. Selected SQL targets acquire local transactional fences and must report the same sequence. `JdbcSink.existing` never creates lost checkpoint metadata. The source write gate is released while its MVCC view remains available for table reads.

Unselected targets can be paused or offline; they are not presented as validated. The certificate contains source/capture positions, configuration fingerprint, generation, epoch, sequence, error version, schema hashes and selected target checkpoints. It proves a synchronization boundary, not row equality. Concurrent control or checkpoint changes invalidate eligibility. Source writes may continue after gate release; the task stays paused until explicit recovery processes later binlog events.

## Bounds and recovery

The explicit source-gate limit is1–120seconds; the read session has a separate limit, at least as long and at most24hours. Deadlines abort owned connections, with session wait_timeout as an additional cleanup measure. No global settings are changed. Network failures prevent an exact millisecond guarantee of server-side unlock; monitor database sessions as well.

The source MVCC transaction holds table metadata locks and old row versions, which can delay DDL and grow undo. Native tests observe actual lock waits and release. Early closure of an unfinished cursor aborts the entire validation view instead of draining an unbounded result or treating a partial scan as complete. SIGKILL releases connections; durable pause cannot be bypassed by restart. Lost MVCC views cannot be reconstructed from files; incomplete source scans need a new cut. Fence failure retains the persisted pause. The protocol assumes a consistent writable destination endpoint and does not replace database HA routing/old-primary isolation.

Selected destinations currently use transactional SQL. MQ producer acknowledgement is not downstream data validation; analytical visibility/materialization requires product-specific support.

Primary MySQL references: [consistent snapshots](https://dev.mysql.com/doc/refman/8.4/en/commit.html), [FLUSH](https://dev.mysql.com/doc/refman/8.4/en/flush.html), [session timeouts](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html).

## Row comparison and CLI

The synchronizer must be the only writer of destination business tables. Begin with a RUNNING pipeline, completed snapshots and selected targets able to reach the common cut. Establishing the cut briefly blocks writes across the MySQL instance. After releasing source writes, the pipeline stays PAUSED until explicitly resumed.

```sh
java -jar rivomesh-app.jar validate-data config/task.yml /private/reports postgres,shadow

# Separate source sealing from target comparison; stage prints the report ID.
java -jar rivomesh-app.jar validate-stage config/task.yml /private/reports postgres,shadow
java -jar rivomesh-app.jar validate-compare config/task.yml /private/reports <reportId>

# Historical summary, even after the original cut became stale.
java -jar rivomesh-app.jar validation-report config/task.yml /private/reports <reportId>
```

CLI defaults:30second source gate,1hour source view,10minutes per destination table,1GiB logical staging budget and4MiB per row. Java callers can set explicit limits. Source rows, target rows and keyless identity records all consume the budget; it is not a1GiB source-data allowance. Physical-file checks run at batch commit boundaries; H2 pages/indexes/temporary data can require additional space. Use filesystem/container quotas for a hard physical limit. Large-scale capacity remains unaccepted.

The source scan uses the original MVCC view. Keyless occurrence IDs are paged from the durable journal and matched against the complete canonical source multiset. Only complete source scans are sealed. Supported POSIX systems use0700directories/0600files, with same-process and cross-process writer locks. Staging is not encrypted; place it on appropriately private storage.

Each destination scan holds the physical checkpoint row lock on the same connection used for reading. Ownership, schema, completed snapshot and exact checkpoint are checked without recreating metadata, advancing sequence or modifying business rows. Types share the synchronization canonicalization contract. Keyless internal identities are compared as well as values; equal data with wrong identities yields missing and extra differences.

MySQL TIME expressions are explicitly cast to CHAR for source snapshots, consistent views, virtual-generated evaluation and target validation. This avoids JDBC temporal formatting losing a negative subsecond sign: `-00:00:00.000001` must remain negative one microsecond. MySQL FLOAT32 targets explicitly use FLOAT; default-mode REAL aliases DOUBLE, as documented in the [official numeric type reference](https://dev.mysql.com/doc/refman/8.4/en/numeric-type-syntax.html). Existing incorrect table types need an explicit migration plan; validation never alters them automatically.

Per-target/table results contain counts, content roots and `missing`, `extra`, `changed` totals. Equal results produce `VALIDATION_MATCH`, otherwise `VALIDATION_DIFFERENCES`. The Java store supports identity-hash keyset pages of up to200differences. Summaries omit business row values; raw values in private staging remain sensitive.

Recovery boundaries:

- A lost MySQL gate or snapshot session invalidates an incomplete source scan even if the driver reconnects to the same server. Inspect the durable pause, explicitly resume as appropriate and establish a new cut.
- Once source data is sealed, `validate-compare` checks configuration/generation/epoch/error version/positions and physical target checkpoints, validates the source seal and row checksums, discards partial destination scans and rereads them. The source database need not be online during this phase.
- Resuming/reconfiguring the pipeline or changing checkpoints invalidates continued comparison. Historical reports remain readable and do not prove current equality.
- Success, failure and timeout all retain the pause. Use the current error version with the existing `status` / `resume-pipeline` controls to resume explicitly.

The first end-to-end native comparison profile uses MySQL8.4 sources and PostgreSQL17/MySQL8.4 destinations. Other transactional adapters share the reader interface but their vendor/version/mode/distributed acceptance remains separate. Messaging and analytical destinations do not yet implement this comparison protocol.

## FAQ

- **Why did replication stop advancing after validation?** Establishing the cut durably pauses it. Review the report/task state and explicitly resume using the current error version. Monitor source binlog retention and journal capacity while paused.
- **Can a longer timeout resume an incomplete source scan?** A lost MySQL MVCC transaction cannot be reconstructed. Keep the failed report, follow explicit task recovery and establish a new cut with an appropriate read budget.
- **Why can equal keyless business values still produce missing/extra rows?** Incorrect occurrence IDs break later UPDATE/DELETE processing. Counts or business-value-only comparison would miss this.
- **Can I rewrite hashes after `VALIDATION_SOURCE_SEAL_MISMATCH`?** Do not alter the summary/H2 contents to force acceptance. It can indicate corruption, changed data or a development-era report format difference. Retain evidence and establish a new validation run; historical summaries remain useful for diagnosis.
- **Did validation repair rows or rebuild UNIQUE constraints?** Validation reads destinations. Use the [managed repair workflow](/docs/en/reference/managed-repair.html) for reviewed row changes and verify constraints before handover.
## Recovery runbook

Record the task ID, configuration revision, capture position, error generation, affected subscriptions and request ID. The V3 capture position covers complete source transactions retained in the journal. Each target's acknowledgment covers its acknowledged prefix. When a skip has opened a gap, compare the open gaps, contiguous applied position and safe covered position. Use the observation time to establish how recent each displayed state is.

The console keeps operation history. API writes use `POST /api/tasks/{task}/actions` with `expectedRevision` and `X-Request-ID`. Browser sessions also use CSRF tokens. Use the task or subscription `errorCount` specified by the corresponding workflow. If a response is lost, look up that request or retry with the same ID and body. Inspect command admission and the actual commit separately.

| Symptom and cause | Console or API action | Checkpoints, gaps and retries |
|---|---|---|
| MySQL primary changes or replication IO/SQL stops | Inspect the connection stage and candidate topology. Have the database operator fence the old primary, repair replication, promote an eligible primary and confirm retained GTID history. | Rivomesh reconnects at the durable GTID. Lag, replica failure or multiple writable candidates leave the original checkpoint in place until an eligible source is available. See [source failover](/docs/zh/reference/recovery.html). |
| Missing MySQL binlog, PostgreSQL slot or WAL, or a decoding failure | Open **Review capture recovery** as an administrator or call `GET /api/tasks/{task}/capture-recovery`. Recover the logs or select a source with the required history. Review a new baseline if the logs are unavailable. | The read-only review preserves the old position and lists every potentially affected subscription. Keep the error paused while the source range is unproved. See [capture recovery](/docs/en/reference/capture-recovery.html). |
| A reviewable MySQL decoder fault | Retain the original transaction, verify its exact GTID and destinations, then approve the source skip for an eligible keyed row transaction. | The task remains paused and both target ACKs remain unchanged. Resume later changes separately and reconcile the recorded source gap. [Source skip](/docs/en/reference/capture-recovery.html#approve-a-source-transaction-skip) |
| Target SQL, permission or constraint error | Find the failed subscription, resolve the native error and use `RESUME_TARGET` for that subscription. Healthy subscriptions can continue. | Use its current error generation. The same transaction replays at the original position. SQL data and the native receipt commit together. |
| Target commit succeeded and its journal acknowledgment or response was lost | Pause the task, retain the failure evidence and inspect the native receipt. Use the administrator confirmation workflow or `CONFIRM_COMMIT` for a supported profile. | Reconcile the acknowledgment for that exact transaction. Preserve the committed rows. Explicitly resume the task and subscription after review. See [commit acknowledgment](/docs/en/reference/commit-acknowledgement.html). |
| Controller or Agent goes offline while a command is pending | Inspect the owner, observation time and operation result from an available controller. In the fixed-Agent profile, a durable `STOP` request can wait for the original Agent. | A live Worker can continue against its journal. An unreachable owner shows unknown state. Check the persisted request after restart. Verify journal, keys and target identity before relocation. See [global control](/docs/en/reference/global-control.html). |
| Local volume or external journal is unavailable, or quota is exhausted | Inspect the journal storage stage. Restore the original volume or external store, check generation, durable position and native receipts, then restart. Review transaction size and capacity for quota failures. | Preserve the journal, configuration, snapshot artifacts and receipts. Rebuild a reviewed baseline when the original journal cannot be restored. See [deployment and storage](/docs/en/reference/console-and-deployment.html). |
| Browser refresh, session revocation or changed permissions | A normal refresh uses a valid session. Sign in again after expiration or revocation. Administrators can revoke sessions through their account and session controls. | Session state leaves data checkpoints unchanged. After signing in, use the same operation ID to inspect work in progress. See [browser sessions](/docs/en/reference/browser-sessions.html). |
| A complete failed transaction needs exclusion | Have an administrator review evidence, target scope and reason, then use target transaction skipping. Check the native `SKIP` receipt before resuming. | Exclude the complete next transaction for that subscription and retain the explicit gap. Safe coverage can advance while contiguous applied progress retains the earlier boundary. See [transaction skip](/docs/en/reference/transaction-skip.html) and [gap verification](/docs/en/reference/gap-verification.html). |
| Repair rows or undo target effects of a failed transaction | Review before/after values, scope and the receipt hash. Choose before-image compensation or a typed correction. Record execute and cancel requests against the original operation. | Write corrections and receipts atomically, then retain the pause. Replay the original event after compensation. Recheck the gap and original position after a correction. Check the original result after cancellation. See [compensation](/docs/en/reference/transaction-compensation.html) and [manual correction](/docs/en/reference/manual-correction.html). |

Relational, analytical and messaging targets report product-specific progress. A broker acknowledgment confirms acceptance by the broker. Verify application or persistence using the downstream system. Native SQL receipts, compensation and gap verification follow the accepted profiles in the linked guides.

## Cutover and fallback

For an initial comparison of existing MySQL data in a PostgreSQL target, use the [existing target preview](/docs/en/reference/nonempty-target-preview.html).

Keep the source authoritative for business writes and let Rivomesh write the targets. Pause business writes for the final cut, establish a fresh common boundary, compare destination content and downstream visibility, and restore business constraints before handing over writes. Revalidate UNIQUE or GSI constraints that were represented as ordinary indexes against the target product. Historical reports retain the earlier results. Validate the new business state and a fallback baseline separately after cutover. Nonempty target adoption, automatic Agent takeover and cross-product constraint recovery follow their explicit acceptance profiles.

[中文](/docs/zh/reference/reconciliation-workflow.html)
