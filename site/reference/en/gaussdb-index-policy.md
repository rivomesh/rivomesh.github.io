---
sourcePath: docs/en/gaussdb-index-policy.md
---

# Gauss index conversion, correctness, and application takeover

Updated: 2026-11-14. 中文：[Gauss 索引策略](/reference/zh-CN/gaussdb-index-policy.html). See [requirements and decisions](/reference/en/requirements-and-decisions.html) for scope and open questions.

**Status: v3 implements ordinary secondary indexes and business UNIQUE downgrade; v2 still creates columns/PK only.** `IndexPolicy` produces explicit actions and `JdbcSink` executes supported indexes on new tables. Expressions/prefixes/descending/special methods and existing UNIQUE/GSI require separate plans, never blind DROP. Business GSI model entries may become ordinary indexes; identity GSIs are not downgraded. Commercial distributed GaussDB still needs hardware acceptance. See the [V3 manual](/reference/en/pipeline-v3.html).

## Accepted synchronization policy

MySQL is authoritative. Only the synchronization service writes to targets during synchronization; applications may read them. Validate data and restore required constraints before application writes take over. For newly created Gauss business tables:

| Source object / target requirement | Synchronization policy |
|---|---|
| MySQL PRIMARY KEY | Preserve stable row identity and uniqueness; never downgrade to an ordinary index |
| Business secondary UNIQUE(email) or composite UNIQUE | Create a nonunique ordinary index with corresponding columns/order; preserve compatible column definitions and NOT NULL |
| Ordinary secondary index | Create an ordinary index supported by the target |
| GSI contemplated for secondary uniqueness or query acceleration | Use an ordinary secondary index, without global routing/uniqueness guarantees |
| Unique structure required for PK, row identity, or internal correctness | Excluded from relaxation; choose compatible distribution/constraints or fail preflight |
| Metadata transaction deduplication, owner/lease, and checkpoint uniqueness | Preserve; business-index relaxation does not apply |
| Existing target UNIQUE, GSI, FK dependencies, etc. | Inspect dependencies and produce a difference/migration plan; do not automatically DROP or weaken |

An ordinary index cannot replace a PK. Replacing a global UNIQUE with `UNIQUE(email, distribution_key)` is not equivalent: it allows duplicate email across distribution keys and still enforces a constraint that may be unnecessary during synchronization.

This topic covers openGauss/distributed GaussDB. Other adapters may also relax incompatible business secondary UNIQUE constraints under declared policies. Preserve PK/candidate identity and internal correctness; analytical Unique Key/materialization identity is not an optional secondary constraint. See [platform design](/reference/en/platform-design.html).

## What UNIQUE(email) means

Example source definition:

```sql
-- MySQL
CREATE TABLE customer (
    id BIGINT NOT NULL,
    email VARCHAR(64),
    PRIMARY KEY (id),
    UNIQUE KEY uk_customer_email (email)
);
```

Logical target example, not current generated output or a universal version-independent script:

```sql
-- Select actual types/lengths, distribution and index methods per target.
CREATE TABLE app.customer (
    id BIGINT NOT NULL,
    email VARCHAR(256),
    PRIMARY KEY (id)
);
CREATE INDEX ix_customer_email ON app.customer (email);
-- Distributed GaussDB also needs a compatible distribution plan, e.g. HASH(id).
-- Length follows the project's current UTF-8 byte expansion policy;
-- actual target versions still require validation.
```

Omitting target UNIQUE does not itself create duplicates. Final correctness depends on complete replication. At the same fully applied source transaction boundary, each source PK should correspond to the same target row if:

1. Every source transaction is logged and captured completely, with FULL row images, correct ordering, and correct routing.
2. PK mapping is one-to-one; target PK comparisons do not merge distinct source keys.
3. Snapshot/CDC handoff has no gaps, and durable GTID/checkpoints plus idempotent application handle redelivery.
4. Business changes and apply checkpoints commit atomically; retries never skip failed transactions; stale owners are fenced.
5. No external writes, trigger side effects, lossy conversions, or accidental merging of source tables occur.

Under these conditions, the source enforces email uniqueness and the target reproduces its rows. **The target ordinary index no longer enforces email uniqueness.** Retry idempotency relies on PKs and transaction checkpoints, not the email index. Removing UNIQUE is not a recovery mechanism.

Preserve multiple NULLs allowed by the source; `GROUP BY email HAVING COUNT(*) > 1` alone is not a valid constraint check. Case, collation, trailing spaces, empty-string/NULL behavior, and type conversion can change equality semantics. Source uniqueness does not guarantee that a future target UNIQUE constraint will build successfully.

## Temporary duplicates during snapshot

The current snapshot uses online chunks followed by log replay, not one database-wide point-in-time snapshot. For example, the scanner reads `id=1,email=a`; a source transaction changes it to b and inserts `id=2,email=a`; the scanner then reads id=2. Before catch-up, the target may contain two distinct PKs with email=a even though every committed source state was valid.

Temporary secondary-key duplicates are not duplicate PK rows and must not cause data to be discarded. Complete ordered replay must restore the source state at the declared boundary. Snapshot/early catch-up output is not promised to be consistent; consumers requiring consistency wait for an agreed barrier and read protocol.

Ordinary secondary indexes permit these intermediate states, which fits the current scan method. Preserving selected target UNIQUE constraints in a future design would require revisiting snapshot/replay semantics and constraint timing, not merely adding UNIQUE to generated DDL.

## Can GSI become an ordinary index?

Yes, an ordinary index can be selected during **new-table index planning** to retain a basic access path on corresponding columns. This is a replacement with changed capabilities, not a lossless native conversion. MySQL has no Gauss GSI; keyword substitution in source DDL cannot implement it.

Huawei documents GSI distribution independent of the base table. Its example contrasts an ordinary index visiting all DNs with GSI routing a qualifying lookup to one DN. This design therefore accepts possible extra cross-node query work and promises no equivalent performance. Verify exact version capabilities. [CREATE GLOBAL INDEX](https://support.huaweicloud.com/intl/zh-cn/distributed-devg-v8-gaussdb/gaussdb-12-0546.html), [official query-plan example](https://support.huaweicloud.com/intl/zh-cn/distributed-devg-v8-gaussdb/gaussdb-12-1729.html).

Design consequences:

- Ordinary indexes provide neither cross-DN global uniqueness nor GSI's separate distribution/covering design; changing an index does not redistribute its base table.
- Retaining indexed columns does not preserve query plans, covering behavior, or JOIN performance. Validate representative queries with `EXPLAIN`.
- A global structure required to enforce PK identity cannot be relaxed. Prefer distribution compatible with the PK; fail preflight when correctness cannot be preserved.
- Existing GSI may support constraints or other dependencies. Migration must inspect ownership, dependencies, validity, and rollback paths before removal.

Partition GLOBAL/LOCAL indexes describe partition coverage and must not be confused with distributed GSI. openGauss partition-index syntax is not evidence of GaussDB GSI capability. [openGauss index documentation](https://docs.opengauss.org/zh/docs/latest/database_administration_guide/creating_and_managing_indexes.html).

## Distributed business and metadata tables

Relaxing business secondary constraints does not remove restrictions involving PKs, distribution/partition columns, or types. Distribution planning must be deterministic, explainable, and overridable, with an explicit write strategy for PK/distribution-key changes.

Metadata requires its own design: deduplication keys, task IDs, stream ordering, and lease operations must satisfy distributed constraints, while business changes and local target checkpoints remain atomic. Do not delete `UNIQUE(job_id, transaction_key)` to avoid GSI, or infer source ordering from independent CN-generated IDs. The current metadata layout has not been validated on commercial distributed GaussDB and is not a deployment template for it.

## Planning and resumable execution

Implementation requires these steps, not merely removing a UNIQUE keyword:

1. Discover source index metadata: PK/secondary classification, column order, prefix lengths, expressions, sort direction, visibility, and method. Persist a versioned conversion manifest.
2. Generate executable DDL and capability differences for the target product/version/mode, distribution/partitioning, and types. Deduplicate equivalent target indexes; use stable digests when shortening names.
3. Create columns and PKs before snapshot; persist definitions, policy, and fingerprints. Correct row identity comes first.
4. Prefer ordinary business secondary-index creation after initial catch-up, with bounded concurrency. CDC progress and index readiness are separate: streaming does not imply every index is READY.
5. Persist planned/started/succeeded/failed states and definition digests per target/table/index. After restart, inspect catalog definitions and validity before proceeding. Adapter-specific recovery must cover nontransactional DDL and invalid indexes left by online builds.
6. A matching name with a different definition is not success. Retain diagnostics and retry the object without resetting snapshot cursors or skipping business transactions. Pause a target if DDL failure compromises safe writes; a missing acceleration-only index may instead leave CDC running with a failed index phase.

Report prefix, expression, FULLTEXT, SPATIAL, invisible, oversized, and unsupported-collation indexes individually. Initially automate only ordinary column-based B-tree-like indexes; explicitly list other objects as unsupported/manual work rather than claiming complete index synchronization. Do not silently expand a prefix index to the full column, which may exceed limits or change plans.

## Application takeover

This is a planned operating procedure, not an existing automated command. Validate each target independently; simultaneous takeover of every target is unnecessary:

1. Freeze relevant source business writes and DDL; record a final source GTID barrier and eliminate dual-write entry points.
2. Wait for the target to apply through that barrier with no failed transactions, missing logs, or unfinished snapshot. Use proven target application progress, not shared capture GTID alone.
3. At the same frozen boundary, compare row counts, PK sets, chunk digests/required row values, and semantics for restored constraints. Retain original UNIQUE definitions in the conversion manifest.
4. Validate duplicates, NULLs, lengths, and dependencies using actual target equality rules; build required UNIQUE/FK constraints. If distributed constraints need GSI or redistribution, plan and validate that separately. Ordinary indexes during synchronization do not justify omitting constraints permanently after takeover.
5. Once all required constraints are valid and checks pass, stop or fence synchronization writes to that target, then permit application writes. Failure blocks takeover; repair and retry without deleting conflicting rows to force success.

After application writes begin, the original one-way sync service cannot safely overwrite that target without coordination. Failback or bidirectional replication requires a separate design; GTID retention does not provide it. Other mirror targets may retain their own subscriptions, but after business moves to the new database the original MySQL source does not automatically receive those new writes.

## FAQ

**Will retries insert extra rows without UNIQUE?** The keyed design uses PKs and transaction checkpoints; an ordinary email index does not deduplicate. No-PK support is now a first-release requirement but remains unimplemented. It needs candidate identity or consistent-baseline/multiset handling, not the keyed guarantee; see [platform design](/reference/en/platform-design.html).

**Are repeated email values always errors?** No. Distinguish NULLs, comparison differences, and pre-catch-up mixed scan states. Judge against source definitions at a declared boundary; do not automatically delete rows.

**Are ordinary indexes always faster than GSI?** No. They may reduce write maintenance but increase the DNs visited by queries. Measure actual workloads.

**Will existing target UNIQUE indexes change automatically?** No. Current code does not do this; the design first produces an object/dependency migration plan. Constraint-owned indexes are not standalone objects to DROP blindly.

**Does an interrupted index build restart the snapshot?** The design retains data checkpoints and resumes index work after catalog inspection. Implementation and fault validation remain pending.

**Is constraint restoration guaranteed to succeed?** No. Actual validation and constraint creation gate takeover. Incompatible distribution/constraints or inconsistent data must block it.

## Acceptance checklist

- Single/composite UNIQUE becomes nonunique with traceable ordering, nullability, and conversion manifests; PK/internal uniqueness remains intact.
- Temporary email duplicates during online scans converge to the frozen source boundary; updates, deletes, PK changes, and transaction redelivery preserve rows.
- Validate independently lagging targets; index failure on one target must not corrupt another target's state.
- Test process death around index DDL, connection loss, uncertain responses, definition conflicts, invalid indexes, and stale owners.
- Use real multi-CN/DN GaussDB to validate distribution compatibility, global row identity, transaction ordering, and ordinary-index plans; validate openGauss separately.
- Before takeover, validate collations, empty strings/NULLs, target uniqueness, and the frozen barrier. Deliberate conflicts must block switching without discarding data.

The current [validation record](/reference/en/validation.html) excludes these new capabilities. It must not be used to claim index conversion or commercial distributed GaussDB acceptance.


Doris business UNIQUE/GSI conversion uses nonunique inverted indexes; its internal UNIQUE KEY protects source row identity only. This is not GaussDB B-tree equivalence and does not preserve business uniqueness, collation or global routing. See the [Doris handbook](/reference/en/doris-v3.html).
