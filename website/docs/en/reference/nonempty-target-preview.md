---
kind: docs
locale: en
title: "Nonempty target adoption preview"
sourcePath: docs/en/nonempty-target-preview.md
---

# Existing PostgreSQL target preview

Use `preview-adoption` to assess existing MySQL data copied to PostgreSQL before registering or starting a pipeline. The preview compares mapped tables with source primary keys. It reports how many rows are missing, extra, changed or equal. Checks use the same canonical types as replication, including JSON values, timestamps and decimals.

```sh
java -jar rivomesh.jar preview-adoption config/task.yml postgres
```

The second argument names a V3 target ID. The target must be a PostgreSQL primary. Grant the target account schema usage and SELECT privileges on the mapped tables and any existing Rivomesh ownership and job tables. Use the MySQL read and lock privileges documented for [common-cut validation](/docs/en/reference/reconciliation-workflow.html). The preview reads PostgreSQL in a READ ONLY transaction and does not open a journal or write ownership, business rows or checkpoints.

Schedule the preview during a maintenance window. It holds the MySQL write gate for up to 15 seconds while it establishes the source snapshot and pins the target tables and PostgreSQL REPEATABLE READ snapshot. It releases the write gate before scanning rows. Read locks can delay DDL until the views close. The preview requires the original MySQL lock and snapshot sessions. A disconnect or driver reconnection invalidates the comparison. The report describes the two views at the recorded boundary. New commits after that boundary can change the result. [PostgreSQL transaction isolation](https://www.postgresql.org/docs/17/sql-set-transaction.html)

- `MATCH_REQUIRES_VERIFIED_BASELINE` means the examined rows compared equal. Keep the report for planning and verify the original data baseline, retained source logs and destination ownership before any adoption.
- `DIFFERENCES_FOUND` means at least one comparison found rows to add, remove or reconcile. Stable primary keys determine the corresponding rows. Choose a separate reconciliation or staging plan.
- `BLOCKED` means at least one mapped table cannot be compared safely. Review each table's blocker and any comparisons that succeeded. Existing owners or checkpoints, missing tables, keyless sources, structural mismatches, inheritance, partitions, row security, generation, triggers and extra constraints can block this profile.

The preview covers at most 100 discovered source tables, 100,000 rows per side of each compared table, 4 MiB per decoded or canonical row and 64 MiB of accounted retained comparison data per table. Read deadlines are 120 seconds for each view. The limits apply to decoded data in the verifier, while JDBC fetches and JVM overhead require additional memory. Limit, permission and view errors terminate the command without a comparison result. The JSON result contains table names and totals, and uses a SHA-256 digest to identify the observed source position.

## Plan adoption at a frozen source boundary

Use `plan-adoption` after `preview-adoption` finds matching data. This profile covers one nonempty InnoDB table in one directly connected MySQL 8.4 database and one UTF-8 PostgreSQL 17 primary. Configure one target and an external PostgreSQL journal with the same JDBC URL as the target, separate absent metadata schemas, and no existing writer assignment. Hold all application writers and pipeline workers stopped while reviewing the plan. [PostgreSQL transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html)

The source operator must enable and persist `read_only` and `super_read_only` and keep `persisted_globals_load` enabled. The MySQL account must see all tables and related schema metadata and have the grants for the global read lock and replication status checks. The planner refuses inbound replication and group membership. It takes a bounded lock on the original MySQL session and verifies the original physical server and exact binlog boundary before and after comparison. [MySQL FLUSH statement](https://dev.mysql.com/doc/refman/8.4/en/flush.html)

The source has a single signed `BIGINT` primary key, with an optional business UNIQUE on one other signed `BIGINT` or supported `VARCHAR` column. The optional UNIQUE requires `DOWNGRADE_BUSINESS` and its exact ordinary PostgreSQL B-tree index before planning. `preview-adoption` lists the expected ordinary index name under `indexPlan`. The source profile requires ordinary columns with defaults limited to `NULL` and admits signed integers, JSON and `utf8mb4_0900_bin` VARCHAR up to 4,000 characters. Target columns must have matching order and nullability and map to `bigint`, `jsonb` or equal-width `varchar` with explicit `pg_catalog."C"` collation. The target role needs ownership authority, schema and database creation privileges and permission to read `pg_control_system()`. Foreign keys, triggers, other indexes and constraints, existing Rivomesh metadata and target subscription membership stop the plan.

For `UNIQUE(email)`, the admitted key is one full `VARCHAR(1..320)` column. MySQL uses `utf8mb4_0900_bin` with `NO PAD`. PostgreSQL uses UTF-8, an equal-width `varchar` with the built-in deterministic `pg_catalog."C"` collation, the built-in B-tree `text_ops` and blocks of at least 8 KiB. The proof verifies the padding attribute, native comparison behavior and actual index operator class and collation. Case variants, trailing spaces and distinct Unicode normalization forms remain distinct, and multiple NULLs are permitted. This profile rejects case- or accent-insensitive collations, `PAD SPACE`, blank-padded types and prefix or expression keys. Values must be representable by both engines. PostgreSQL text types exclude U+0000. [MySQL binary collations](https://dev.mysql.com/doc/refman/8.4/en/charset-binary-collations.html) · [PostgreSQL collations](https://www.postgresql.org/docs/17/collation.html) · [PostgreSQL character types](https://www.postgresql.org/docs/17/datatype-character.html) · [PostgreSQL B-tree entry limits](https://www.postgresql.org/docs/17/btree.html)

```sh
java -jar rivomesh.jar plan-adoption config/task.yml postgres
java -jar rivomesh.jar plan-adoption config/task.yml postgres --expect-sha256 <reviewed-digest>
```

`ADOPTION_PLAN_OBSERVED` binds the exact source position, matching row count and digest, configuration and native target identities to the plan SHA-256 digest. The digest stays stable while those inputs match. Limits are 10,000 rows, 1 MiB per row, 16 MiB of retained comparison data and 30 seconds per read guard. JDBC and JVM overhead require additional memory. Keep the result in the operator's private records. PostgreSQL uses a read-only snapshot, so the approval step rechecks the plan while the target has an exclusive table lock.

## Adopt the approved PostgreSQL baseline

Keep the MySQL freeze active and keep application writes and every Rivomesh worker stopped. Use the same configured PostgreSQL user for the journal and the target. The role must be able to lock the target table and the event trigger catalog, and create both private metadata schemas plus the ownership table. Use the source table name from the plan, its exact digest and a stable request UUID with the local operator's audit identifier.

```sh
java -jar rivomesh.jar adopt-existing config/task.yml postgres <sourceTable> <reviewed-digest> <requestUUID> <actor> --acknowledge-exclusive-freeze
```

The command recomputes the source cut, schema, target native catalog and matching rows under the held freezes. PostgreSQL creates ownership, an already-complete snapshot and its acknowledgement, the captured MySQL position, the empty delivery checkpoint and the approval receipt in one transaction. The adopted job starts `PAUSED`. Business data remains where it was copied, so the normal worker can begin streaming from the approved binlog position.

If the command returns `ADOPTION_COMMIT_UNKNOWN`, keep the freeze and use the identical approval to confirm the durable receipt before resuming. A confirmed replay verifies the paused baseline, native table, rows, target ownership and both checkpoints. A changed request, incomplete metadata or drift fails closed. Keep the original review and receipt in the operator's private records. If the job has already resumed, use its normal status and recovery commands.

After a confirmed receipt, the maintenance operator can remove the source write fence and run `resume-pipeline` with `resumeErrorGeneration`, then start the ordinary worker. Keep target application writers stopped during sync. Retain the source binlog covering the approved cut until the worker catches up. Application write handover and failback remain separate operations.

## Restore the approved business UNIQUE at the original adoption cut

When the adoption includes `restoreUnique`, its `planSha256` includes the expected name and key of the new UNIQUE and the physical identity of the existing ordinary index. Keep the original MySQL freeze and the adopted job paused. Run the following command with a new restoration request UUID and operator. The command rechecks the original cut, table rows and native catalog, then adds a nondeferrable `UNIQUE NULLS DISTINCT` and commits one native receipt with the DDL. Keep the existing ordinary index. The approved restoration receipt becomes part of readiness for this table.

```sh
java -jar rivomesh.jar restore-adopted-unique config/task.yml postgres <sourceTable> <adoption-digest> <adoption-request> <adoption-actor> <restoration-request> <actor> --acknowledge-exclusive-freeze
```

On `ADOPTED_UNIQUE_COMMIT_UNKNOWN`, keep the freeze and retry the identical request. `prepare-target-writer` checks the approved restoration, including the physical constraint and ordinary index. Building the expected constraint manually does not supply the required receipt. The constraint remains in force after pre-write failback and ordinary CDC accepts it only with matching native proof.

## Record application writer readiness

Use `prepare-target-writer` while the single-table adoption is still paused at its original baseline. Keep the original MySQL source physically connected and durably frozen, and keep the application and Rivomesh writers stopped under exclusive administration of both databases. Provide the original adoption digest, request UUID and actor, plus the PostgreSQL writer login, a new request UUID and the reviewing operator. The target administration account needs to lock `pg_authid`, `pg_auth_members` and the event trigger catalog. [PostgreSQL privileges](https://www.postgresql.org/docs/17/ddl-priv.html)

```sh
java -jar rivomesh.jar prepare-target-writer config/task.yml postgres <sourceTable> <adoption-digest> <adoption-request> <adoption-actor> <writer-role> <review-request> <review-actor> --acknowledge-exclusive-freeze
```

The dedicated PostgreSQL login needs `CONNECT`, schema `USAGE` and table `SELECT`. Admission requires the role to be disconnected, have no role memberships and hold no table or column write privileges. Other grants that introduce a parallel writer, writable views accessible to this login, and executable user-defined `SECURITY DEFINER` routines also stop the review. Privileged administrators must keep exclusive control of schema, role and application-routing changes during the maintenance window.

`TARGET_WRITER_READINESS_RECORDED` identifies a native receipt recording the exact adoption, source cut, target rows and authority evidence, role identity and review approval. On `WRITER_READINESS_COMMIT_UNKNOWN`, repeat the original request while the source is still frozen and its cut can be verified. Replay checks the live row state, authority and cut again. Keep the receipt and its `receiptSha256` with the original migration plan.

## Activate one PostgreSQL writer or return the original source before any committed target write

This procedure covers the original paused single-table adoption cut. Keep the MySQL write fence in effect and keep application connections stopped while changing authority. Use the same adoption identifiers and the full readiness receipt SHA-256 with a fresh operation request UUID and actor. The operator owns application routing to the target after the acknowledged grant.

```sh
java -jar rivomesh.jar activate-target-writer config/task.yml postgres <sourceTable> <adoption-digest> <adoption-request> <adoption-actor> <readiness-receipt-sha256> <activation-request> <actor> --acknowledge-exclusive-freeze
```

Activation holds exclusive target table and role catalog locks, checks the frozen source and approved rows, grants the reviewed login `INSERT`, `UPDATE` and `DELETE` on this table, and records `TARGET_WRITER` in the journal. The normal `resume-pipeline` command refuses this state. The same PostgreSQL commit installs a protected statement trigger that records attempted business DML in its transaction. A rolled-back statement leaves no committed witness. A committed write followed by restoring the old row contents still leaves a witness. [PostgreSQL CREATE TRIGGER](https://www.postgresql.org/docs/17/sql-createtrigger.html)

Stop the target application and disconnect the dedicated login before requesting failback. Keep both administrative and application routes under exclusive control. The command locks the table, verifies the witness definition and catalog revision, checks both original row digests, then revokes the target write privileges before marking the pipeline `PAUSED`. `TARGET_WRITER_REVOKED` confirms that the original source is eligible for the operator to re-enable. If needed, resume the pipeline using the returned `resumeErrorGeneration` after reopening source writes.

```sh
java -jar rivomesh.jar failback-target-writer config/task.yml postgres <sourceTable> <adoption-digest> <adoption-request> <adoption-actor> <readiness-receipt-sha256> <failback-request> <actor> --acknowledge-exclusive-freeze
```

On `TARGET_WRITER_COMMIT_UNKNOWN`, keep application routes closed and the MySQL freeze active, and repeat the identical operation. `TARGET_WRITER_WRITE_OCCURRED` requires a separately reconciled reverse migration with an approved new source baseline. `TARGET_WRITER_HISTORY_UNCERTAIN` indicates the continuity marker is missing. PostgreSQL clears it after crash recovery, when an asynchronously acknowledged application commit and its write witness might both have been lost. A changed or missing witness requires investigation before any source write re-enable. [PostgreSQL unlogged tables](https://www.postgresql.org/docs/17/sql-createtable.html)

## Review downgraded UNIQUE indexes before handover

For an already managed PostgreSQL target, establish and complete a [common-cut report](/docs/en/reference/reconciliation-workflow.html) for the destination, and keep the pipeline paused. Suspend business writes and DDL on the target, then run the review with the same task configuration and report ID.

```sh
java -jar rivomesh.jar review-unique config/task.yml /private/reports <reportId> postgres
```

The review verifies the report scope, durable journal cut, target ownership, completed snapshots and physical checkpoint. It acquires the journal and target checkpoint locks, queries PostgreSQL, then rolls back the lock transactions. Business rows, indexes and checkpoints keep their current values. Scans cover up to 100 mapped tables and 128 relevant indexes under a 120-second deadline. Use the synchronization account, which can lock the current checkpoint rows.

For a downgraded simple business UNIQUE, the review counts conflicting key groups and rows using PostgreSQL's target column collations and default `NULLS DISTINCT` behavior. A multicolumn key with at least one NULL does not contribute to these counts. The response lists key column names and counts. Different collation rules can produce conflicts even when the original MySQL and PostgreSQL row contents compared equal. [PostgreSQL unique indexes](https://www.postgresql.org/docs/17/indexes-unique.html) · [ICU collations](https://www.postgresql.org/docs/17/collation.html)

- `DUPLICATES_FOUND` identifies conflicts to reconcile before restoring the constraint.
- `REQUIRES_RECONCILIATION` points to recorded exclusions, differences in the historical comparison or a special index that needs its own plan.
- `NO_DUPLICATES_OBSERVED` describes this read view. Review the final cut, SQL definition and expected business semantics before approving any constraint or write handover. Resuming or moving the checkpoint invalidates this report for a new review.
- `NO_DOWNGRADED_UNIQUE` indicates the selected scope has no relevant candidate.

This profile checks mapped plain PostgreSQL tables and default B-tree key semantics. GSI uniqueness, expressions, prefix lengths, nondefault operator classes and alternate null policies need separate review. Constraint creation, write handover and failback remain operator actions under the migration plan.

## Observe a frozen restoration plan

The bounded restoration planner covers one downgraded business UNIQUE on a keyed InnoDB table. It requires a direct standalone MySQL 8.4 endpoint with `source.topology: AUTO`, no configured candidate nodes, and a UTF-8 PostgreSQL 17 primary. Stop application writers on both sides, establish a matching common-cut report and keep Rivomesh paused. Then have the source database operator place the same MySQL instance in `read_only` and `super_read_only` mode. The source must stay on the report's exact server UUID, GTID, binlog file and offset. MySQL can still admit replication writes in read-only mode, so any configured inbound channel or Group Replication membership is rejected. [MySQL server variables](https://dev.mysql.com/doc/refman/8.4/en/server-system-variables.html)

Use the table ID and original index name shown by `review-unique`.

```sh
java -jar rivomesh.jar plan-unique-restore config/task.yml /private/reports <reportId> postgres <tableId> <sourceIndex>
```

The planner verifies a sealed matching report and rejects recorded source or target exclusions. It obtains a bounded MySQL global read lock on the already frozen server, checks the original session and rehashes source rows. It holds the paused journal fence and a PostgreSQL table and checkpoint lock while reading target rows, confirming ownership, checking uniqueness and observing the original ordinary index. The supported scope is 10,000 rows, 1 MiB per canonical row, a 16 MiB private scratch budget and a 30-second fence. The source account needs the common-cut read, lock and replication status privileges. The target account also needs permission to execute `pg_catalog.pg_control_system()` for physical identity. [PostgreSQL control data functions](https://www.postgresql.org/docs/17/functions-info.html)

Supported key columns are signed integers mapped to `bigint`, or ordinary MySQL `utf8mb4_0900_bin` VARCHAR mapped to PostgreSQL `varchar` or `text` with explicit `pg_catalog."C"` collation. The planner checks the existing ordinary B-tree index's columns, order, collation and default operator classes. Neither GSI nor expression or generated key columns are covered. Case variants, trailing spaces and NULL handling follow the stated profile. [MySQL binary collations](https://dev.mysql.com/doc/refman/8.4/en/charset-binary-collations.html) · [PostgreSQL unique indexes](https://www.postgresql.org/docs/17/indexes-unique.html)

`RESTORE_PLAN_OBSERVED` includes a stable SHA-256 digest of the plan, including report seal, exact positions, current table content, journal namespace and target physical identity and timeline. Keep the output as a review artifact. To compare the reviewed digest, rerun the command with `--expect-sha256 <digest>`. It verifies the live state again and refuses a changed plan, including an index rebuild. A change in source GTID, even outside the table, rejects this cut. Fresh row hashes also detect writes excluded from the MySQL binlog and external target edits. The observation expires when the freeze, target state or cut changes.

## Apply an approved PostgreSQL UNIQUE restoration

This CLI profile requires one destination and a PostgreSQL external journal configured with exactly the same JDBC URL as the destination. The operator runs with the PostgreSQL privileges to lock the journal, target metadata, business table and event trigger catalog, and to add a constraint and write a receipt. Enabled target event triggers stop execution. The operator keeps exclusive control of both databases during the maintenance window, including startup configuration, replication, privilege changes and application writers.

The direct, standalone MySQL source must have both `read_only` and `super_read_only` active and persisted, with `persisted_globals_load` enabled on the original instance. Native persistence supports a restart on the same host and data directory using the same startup options. Rivomesh checks both persisted flags, original source and binlog cut, and the pinned session immediately before committing PostgreSQL. Keep the write fence in place through receipt resolution and the separately managed business handover. [MySQL persisted system variables](https://dev.mysql.com/doc/refman/8.4/en/persisted-system-variables.html)

Review a version-2 plan and use its exact digest, a stable request UUID and the local operator's audit identifier.

```sh
java -jar rivomesh.jar restore-unique config/task.yml /private/reports <reportId> postgres <tableId> <sourceIndex> <digest> <requestUUID> <actor> --acknowledge-exclusive-freeze
```

The command recalculates the plan under the source freeze and a single PostgreSQL transaction that holds the journal cut, subscription, target checkpoint, snapshot, owner and business table locks. It adds one validated, nondeferrable `UNIQUE NULLS DISTINCT`, retains the ordinary index and stores the approved digest, actor, request ID and native catalog evidence in the same transaction. PostgreSQL must have `fsync` enabled, and the transaction uses synchronous commit. Business rows, pipeline state and write authority keep their existing values. [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/17/sql-altertable.html)

`UNIQUE_RESTORED` indicates an acknowledged PostgreSQL commit or a verified native receipt for the identical request. `UNIQUE_RESTORE_COMMIT_UNKNOWN` indicates that the driver could not confirm the commit. Keep the freeze and report, and retry the identical request to resolve it. A request with a different actor, scope or digest conflicts with the stored approval. A receipt whose native constraint has changed also requires operator review. Application write handover and failback remain separate operations.

### FAQ

**Does equality let me start a new pipeline on the existing tables?** A new run still requires compatible empty tables. The preview neither establishes a usable replication position nor grants ownership. For a nonempty target, plan a verified baseline and write handoff, or synchronize into separate empty schemas and reconcile before switching.

**Does it examine other tables in the destination schemas?** The preview examines same-named tables selected by the configured source-to-target schema mappings. Inventory any extra schemas or tables as part of the migration.

**Can this repair existing data or restore a downgraded UNIQUE constraint?** Use [common-cut repair](/docs/en/reference/common-cut-repair.html) for already managed targets and its own validation. Constraint restoration, final write handoff and failback need a product-specific plan.

[中文](/docs/zh/reference/nonempty-target-preview.html)
