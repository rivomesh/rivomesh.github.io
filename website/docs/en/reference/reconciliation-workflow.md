---
kind: docs
locale: en
title: "Reconciliation workflow"
sourcePath: docs/en/reconciliation-workflow.md
---

# Data reconciliation, repair and a common cut

The common barrier, MySQL consistent view, private disk staging, transactional SQL row comparison and CLI are implemented. The LOCAL/H2 and external PostgreSQL/MySQL/openGauss barrier profiles passed native acceptance; the newer row-comparison scope is recorded separately. **The first COMMON_CUT repair CLI is now accepted in the linked repair handbook; the first managed repair UI is separately accepted;other compensation modes and cutover remain incomplete.**

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

- An interrupted incomplete source scan cannot resume its lost MVCC cursor. Inspect the durable pause, explicitly resume as appropriate and establish a new cut. Never mix source views.
- Once source data is sealed, `validate-compare` checks configuration/generation/epoch/error version/positions and physical target checkpoints, validates the source seal and row checksums, discards partial destination scans and rereads them. The source database need not be online during this phase.
- Resuming/reconfiguring the pipeline or changing checkpoints invalidates continued comparison. Historical reports remain readable and do not prove current equality.
- Success, failure and timeout all retain the pause. Use the current error version with the existing `status` / `resume-pipeline` controls to resume explicitly.

The first end-to-end native comparison profile uses MySQL8.4 sources and PostgreSQL17/MySQL8.4 destinations. Other transactional adapters share the reader interface but their vendor/version/mode/distributed acceptance remains separate. Messaging and analytical destinations do not yet implement this comparison protocol.

## FAQ

- **Why did replication stop advancing after validation?** Establishing the cut durably pauses it. Review the report/task state and explicitly resume using the current error version. Monitor source binlog retention and journal capacity while paused.
- **Can a longer timeout resume an incomplete source scan?** A lost MySQL MVCC transaction cannot be reconstructed. Keep the failed report, follow explicit task recovery and establish a new cut with an appropriate read budget.
- **Why can equal keyless business values still produce missing/extra rows?** Incorrect occurrence IDs break later UPDATE/DELETE processing. Counts or business-value-only comparison would miss this.
- **Can I rewrite hashes after `VALIDATION_SOURCE_SEAL_MISMATCH`?** Do not alter the summary/H2 contents to force acceptance. It can indicate corruption, changed data or a development-era report format difference. Retain evidence and establish a new validation run; historical summaries remain useful for diagnosis.
- **Did validation repair rows or rebuild UNIQUE constraints?** No. It only reads destinations. Reviewed repair and pre-takeover constraint restoration require subsequent workflows.

## Remaining workflow

The first management jobs, cancellation, summaries, task grants and report audit now have bilingual UI/API. ADMIN raw difference-row details are now implemented; complete report catalogs/retention, richer retry/quota planning and job/controller HA remain pending. Keyless repair must retain journal occurrence IDs. Additional vendor/type/mode/fault profiles remain to be verified.

Reviewed repair plans must show affected objects/counts/boundaries, enforce authorization/configuration versions/idempotency/audit, commit business repair and native receipts locally without rewriting the synchronization GTID/sequence, and resolve lost responses. Arbitrary nonempty adoption and failed-transaction compensation/skip need separate consistency-gap handling. Final cutover needs a fresh final source barrier, target visibility/data checks, restored constraints and write handoff; an earlier historical cut after source writes resumed is not a current takeover permit.

[中文](/docs/zh/reference/reconciliation-workflow.html)


The first managed workflow now supports destination selection, background jobs, cancellation, target retries and table summaries. See [Managed validation](/docs/en/reference/managed-validation.html). ADMIN raw difference-row UI is now implemented. Managed repair UI is now separately accepted;cutover UI remains pending.

The first [COMMON_CUT repair CLI](/docs/en/reference/common-cut-repair.html) now has four-journal native acceptance for MySQL/PostgreSQL. It is separate from validation-only operations and has a separately accepted authenticated [managed workflow](/docs/en/reference/managed-repair.html);see [transaction compensation](/docs/en/reference/transaction-compensation.html) for the separate SQL workflow. Business cutover remains open.
