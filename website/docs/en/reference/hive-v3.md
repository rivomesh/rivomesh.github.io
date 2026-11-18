---
kind: docs
locale: en
title: "Apache Hive"
sourcePath: docs/en/hive-v3.md
---

# Hive destination, recovery and FAQ

中文：[Hive V3](/docs/zh/reference/hive-v3.html). Example: [hive-v3.yml](/files/config/hive-v3.yml).

## Status

**The first independent native and actual mixed recovery profiles passed; the catalog retains an experimental label.** CLI/Web V3 configuration, isolated JDBC, native HiveServer2 checks, ACID ORC history and latest-version views are implemented. Hive4.0.1/Java8 independent acceptance covered PK moves, keyless multiplicity, precision, lost-confirmation replay, case-folding, restart and older nonempty backup refusal. Actual MySQL8.4.13→PostgreSQL17.12+Hive passed snapshot/CDC, independent Hive outage and catch-up, worker SIGKILL resume, SQL constraint repair/retry, missing-view isolation and truthful pause fences. The final artifact/worktree-assets gate passed too; see [evidence](/docs/zh/evidence/baseline.html). This does not accept every Hive version, cluster or production capacity profile.

The first fixture is official `apache/hive:4.0.1` ARM64, one HiveServer2, persistent embedded Derby and local warehouse. It is not a production/HA deployment. HDFS/S3, external Metastore, Tez, Kerberos, TLS, clusters and other JDKs remain unverified.

## Layout and consistency

Hive is a versioned analytical destination, not the transactional JDBC sink or a Journal. Each source table has a managed ACID ORC history table in `metadataSchema`. A view with the source table name in the mapped database selects the latest internal identity/version, filters tombstones and exposes source columns only.

A primary-key move writes an old-identity tombstone plus a new row. Identical keyless rows retain separate normalized identities. Retries may leave duplicate physical versions; the business view should expose one current row per identity. History row count is not source row count. Only Rivomesh writes this layout; do not edit history, ownership properties or tombstones.

One source transaction can span multiple Hive statements/tables: **cross-table source transaction visibility is not atomic**. JDBC commit is not an atomic business-data/checkpoint boundary here. An unfinished snapshot or backlog is not a cutover barrier, and this layout cannot directly take over OLTP writes.

## Types

| Normalized source type | Hive storage |
|---|---|
| BOOLEAN / INT64 | BOOLEAN / BIGINT |
| UINT64 | DECIMAL(20,0), bounded to unsigned 64-bit |
| DECIMAL precision ≤38 | DECIMAL(P,S), refusing overflow or rounding |
| DECIMAL precision >38 | STRING preserving digits and declared scale |
| FLOAT32 / FLOAT64 | FLOAT / DOUBLE; non-finite values refused |
| STRING / JSON / DATE / TIME / DATETIME / TIMESTAMP | STRING; not native JSON/temporal semantics |
| BYTES / GEOMETRY | base64 STRING preserving decoded bytes |

Generated columns retain evaluated values for expressions already supported by the source adapter; expressions are not recreated in Hive. Reassess comparison, ordering and query functions for the destination types, especially wide decimal strings. Full row images and explicit missing-vs-null checks remain required.

First-profile names use ASCII letters/digits/underscore, cannot start with a digit, and are at most128 characters; mapped databases also follow common configuration length limits. Unsupported source names are not silently rewritten. `_rivomesh_` columns are reserved.

## UNIQUE, GSI and ordinary indexes

Hive removed its old indexing feature from3.0; there is no equivalent ordinary B-tree conversion here. [Official index documentation](https://hive.apache.org/docs/latest/language/languagemanual-indexing/). Business secondary indexes are explicitly omitted. Review the differences and set `acknowledgeIndexOmission: true`; initialization refuses secondary indexes without that acknowledgement.

Source business UNIQUE is not enforced in Hive. GSI global routing, uniqueness, covering layout and performance are not retained. ACID/ORC/bucketing are not substitutes. Internal identity/version correctness is preserved. Convergence assumes an authoritative source, exclusive destination writes, complete catch-up and identity-preserving conversions; see [index policy](/docs/en/reference/gaussdb-index-policy.html).

## Connection and deployment

Require `hive.txn.manager=org.apache.hadoop.hive.ql.lockmgr.DbTxnManager`, `hive.support.concurrency=true`, `hive.query.results.cache.enabled=false`, and managed full-ACID ORC tables/views. Operate Metastore, warehouse, transaction cleanup and compaction; session flags alone are insufficient. [Hive transactions](https://hive.apache.org/docs/latest/user/hive-transactions/).

Only direct binary `jdbc:hive2://host:port/database` is accepted, with optional `auth=noSasl|none` and `ssl=true|false`. Discovery, HTTP, Kerberos, URL credentials, initialization scripts and arbitrary session options are refused. Credentials use separate fields/environment references. `noSasl` is a matching-server option, not the production security default. TLS is configurable but not accepted by native testing yet.

`queryTimeoutSeconds` is1–1800 (default300). Binary socket timeout is bounded to5–120 seconds and internal connect retries are0. A timeout does not prove the statement was absent. Default SQL/response limits are4MiB/16MiB, at most10,000 returned rows; overflow fails rather than confirming truncated results. Events also obey `maxMessageBytes`.

Use a dedicated writer with private metadata-table DDL/read/write and property/description/definition access, plus mapped view DDL/read. Minimum grants depend on the authorization plugin and remain to be verified. Readers should access business views only. `check` is read-only and cannot prove write permissions. Its `hiveIndexPlans` entries expose per-table index actions, required acknowledgement and `columnStorage` types; omission is never reported as an ordinary-index conversion.

A pinned standalone Hive SDK runs in a private classloader without replacing core logging/Jackson/Guava. First use extracts and verifies about42MiB under a private `java.io.tmpdir` cache. Read-only Docker/K8s filesystems need a restricted writable temporary volume; do not share an untrusted cache.

## Confirmation and recovery

Implementation writes versions, reads back actual identity/version/tombstone/values, writes and reads a target receipt, saves Journal transport progress, then advances the destination transaction checkpoint. Physical row count alone cannot confirm an uncertain write.

Reconnect checks ownership, layout, view definition, resource properties and the latest receipt. Established missing objects are not recreated at old progress. Resource UUID is a Rivomesh Metastore property, not independently authenticated storage identity. Coordinate Metastore, warehouse and Journal backups. Arbitrary partial-table/file rollback, forged metadata or partial history loss are not claimed to be fully detected.

The first independent native case passed server restart and refusal of an older nonempty Metastore+warehouse backup while Journal retains newer progress; see the exact release and scope in [evidence](/docs/zh/evidence/baseline.html). Connection failures retry by classification; deterministic structure/permission/data errors pause this destination. Resume retries original data, without changing GTIDs or silently skipping. Pause cannot establish that every in-flight Hive request has been cancelled.

Journal ACK-based reclamation does not reclaim Hive history. Monitor history, tombstones, receipts and ACID delta files separately. Receipt compression, safe history GC, compaction soak and hardware sizing remain unfinished.

## FAQ

**Why append versions instead of ordinary UPDATE/DELETE?** History, versions and tombstones support snapshot replay, uncertain requests, PK moves and keyless identity under one layout. Read the view rather than the physical table.

**Can Hive take over the application?** This analytical layout has neither source cross-table atomicity nor enforced business UNIQUE. Takeover needs a separately designed data model, reconciliation, barrier and constraints.

**Does Hive block other destinations?** Delivery threads are independent; other destinations can progress while Hive is unavailable. Unconfirmed data retains shared Journal space and eventually causes capture backpressure at quota. The first mixed profile passed; Journal exhaustion and the wider fault matrix remain unverified.

**Can an existing nonempty table be adopted?** Arbitrary adoption/overwrite is not implemented. Ownership or shape mismatch is refused. Live DDL, nonempty adoption and repair require later workflows.

**How is the native case reproduced?** After building, run `bash tests/hive-materializer-run.sh`. It operates only its own named volumes and stops the server before coordinated Metastore/warehouse backup/restore. Failed raw logs stay in `target/`; inspect actual scenario coverage rather than relying on a marker alone.

The fixture uses `HIVESERVER2_PID_DIR` on a dedicated ephemeral runtime mount to avoid a stale PID matching a new process after container restart. Metastore and warehouse remain persistent volumes. This fixture correction is not a production Hive HA implementation.

## Query cache and consistent reads

The mixed fixture returned three detail rows but a cached COUNT0. A fresh session with only query-results cache disabled returned COUNT3 while stats optimization remained enabled. This observation does not establish the same problem for every Hive release/deployment. The first supported profile requires the server default and all reader sessions to use `hive.query.results.cache.enabled=false`; the writer session must also disable it. Read-only preflight and write-time checks refuse enabled cache with `HIVE_QUERY_CACHE_DISABLED_REQUIRED`, without silently changing global settings.

Disabling cache only on the writer cannot protect other readers. Do not re-enable it in application connections or manually add rows based on stale cached counts. Correct server/reader settings before check/resume; this does not require resetting data, task identity or checkpoints. The original cache-enabled mixed run was explicitly aborted and is not accepted complete recovery. The cache-disabled profile passed independent materialization/restart/older-backup refusal; the frozen-release complete mixed run passed too; see [evidence](/docs/zh/evidence/baseline.html).
