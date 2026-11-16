---
kind: docs
locale: en
title: "Apache Doris"
sourcePath: docs/en/doris-v3.md
---

# Doris V3 target, recovery and FAQ

中文：[Doris V3](/docs/zh/reference/doris-v3.html). Example: [doris-v3.yml](/files/config/doris-v3.yml).

## Current scope

Native MySQL-protocol DDL/metadata and HTTP Stream Load are implemented. Independent native recovery and the actual MySQL+PostgreSQL mixed failure pipeline passed; see [archived evidence](/docs/zh/evidence/2026-11-15-doris.html). The first environment uses official `apache/doris:all-in-one-4.1.3` ARM64, internally reporting `doris-4.1.3-rc02-7126cf65d96`. This is not acceptance of every Doris release, cluster or production capacity.

Doris is an analytical materializer, separate from transactional relational sinks. It is neither a generic transactional MySQL Sink nor an external Journal. Sources remain MySQL; explicit database mappings and fan-out apply.

## Layout and visibility

Each source table owns a private Unique Key/Merge-on-Write physical table in `metadataSchema`. A source-named view in the mapped business database projects the original column order, hides internal fields and excludes retained tombstones. Internal names derive from pipeline/subscription/generation/table identity and fit the 64-character limit; full ownership hashes remain checked.

The internal key represents source PK/identity or normalized keyless occurrence identity, not business UNIQUE(email). Identical keyless values retain distinct occurrences. Sequence/row ordinal fit a LARGEINT version; older writes cannot replace newer state. Deletions retain a current-version tombstone instead of relying on native soft-delete cleanup. Query business views; never mutate private tables or remove tombstones.

A Stream Load has native visibility within its table batch, but source transactions can span multiple table/row batches: **cross-table source transaction visibility is not atomic**. Incomplete snapshots/backlogs are not cutover barriers. Only the sync service writes; this analytical layout is not an equivalent OLTP write takeover.

## Types and indexes

| Source normalized type | Doris storage |
|---|---|
| BOOLEAN / INT64 | BOOLEAN / BIGINT |
| UINT64 | LARGEINT, still checked against the source unsigned-64 range |
| DECIMAL | DECIMAL(P,S), configured range 1–76; decimal256 session enabled; MySQL 65-digit values tested |
| FLOAT32 / FLOAT64 | FLOAT / DOUBLE; nonfinite input rejected |
| STRING / JSON / DATE / TIME / DATETIME / TIMESTAMP | Lossless STRING text, not native JSONB/temporal semantics |
| BYTES / GEOMETRY | Base64 STRING, recoverable to original bytes |

Within the source adapter’s supported expression set, generated columns copy evaluated source values; target expressions are not recreated. NULL differs from missing fields and full images are required. `num_as_string=true` prevents intermediate JSON double conversion; source JSON travels inside a string, preserving its internal numbers.

Default `secondaryIndexes: INVERTED` converts plain BTREE/business UNIQUE/generic GSI metadata to nonunique per-column inverted indexes; composites can split. Business uniqueness, source ordering/collation, composite-prefix and global routing semantics are not preserved. Internal row identity is never downgraded. Expression/prefix/fulltext/spatial and unsupported types require a plan; `NONE` explicitly omits secondary indexes. `dorisIndexPlans` in check results records decisions/differences. Changing an initialized index/bucket/replica profile requires migration.

## Connections and permissions

`url` is the FE MySQL-protocol entry, usually 9030. `doris.loadUrl` is an HTTP origin, optionally a direct BE, usually 8040. FE 307/308 redirects require exact configured `redirectOrigins` (scheme/host/port), identical paths, no URL credentials/query, and no HTTPS downgrade. Every entry must belong to the same cluster; receipt checks do not replace correct network configuration.

Use separate username/password fields and environment references. Initial metadata identity checks use SHOW FRONTENDS/SHOW TABLETS, requiring a dedicated Doris ADMIN account; a least-privilege alternative is unfinished. Console roles are separate. Business readers should access views only. SQL/HTTP TLS still requires acceptance.

Default three replicas requires enough BEs. One-BE tests must explicitly select `replicas: 1`; the service never silently lowers redundancy. Replicas range 1–5; buckets default 4, range 1–64. Compose resource limits describe fixtures, not throughput standards.

The Web wizard exposes SQL/HTTP origins, redirect allowlist, replicas, buckets and index policy. Check before starting. Check reads source definitions and probes SQL features/HTTP health; it creates no tables and does not establish LOAD/DDL privileges.

SQL enforces finite connect/socket timeouts and disables Connector/J cancellation timers to avoid their disconnect-cleanup null pointer. Arbitrary programming errors are not reclassified as networking. HTTP has independent connect/read/request/response bounds and never silently retries an ambiguous PUT internally.

## Confirmation and failures

Loads require strict mode, zero filtering and exact input-row confirmation. Publish Timeout/running labels do not advance checkpoints. Each attempt uses a new load label: versioned rows/permanent destination receipts provide idempotency, not cancelled/expired labels. Success/finished labels still require native row key/version/tombstone/value verification; metadata content is also read back.

After confirming data, the service persists a target batch receipt, then Journal transport progress, then the subscription checkpoint. Ambiguous responses/crashes can replay. Destinations acknowledge independently: relational targets can progress through a Doris outage until journal quota imposes backpressure.

Restart checks native tablet identity, ownership, DDL, views and latest confirmed receipt. Initialized missing objects are not recreated empty at an old checkpoint. Restoring a coherent older nonempty FE+BE backup while keeping a newer journal is refused when the newest receipt is absent. Restore the right target or plan a rebuild. Coordinate data, metadata and journal backups; arbitrary per-table/incoherent rollback or external tampering requires reconciliation and is not comprehensively detected.

Pause reports `UNCONFIRMED_IN_FLIGHT_MATERIALIZATION`; already submitted requests cannot be retracted. Relational targets may report FENCED. This is not a Doris business cutover barrier. Deterministic data/schema/permission faults pause that subscription; after repair resume its error generation without skipping the original transaction.

## FAQ

**Where are business UNIQUE/GSI constraints?** They become nonunique acceleration. Source enforcement and exclusive synchronization preserve caught-up data; external writes are unsupported. Doris internal UNIQUE KEY protects row identity, not business uniqueness.

**Why views and private tables?** They hide occurrence IDs, versions and tombstones while preserving public column order. Do not replace views with unrelated tables or treat private storage as identical source DDL.

**SQL connects but loading fails?** HTTP health does not test LOAD privilege, and SQL/HTTP are separate entries. Verify same-cluster origins, accounts, privileges and explicit FE redirect destinations.

**Does one SQL fault stop all targets?** Deterministic faults pause their target. Repair and use independent UI resume or `resume config.yml subscriptionId expectedErrorGeneration`; do not edit GTIDs/checkpoints.

**Can it adopt existing nonempty objects?** Current ownership checks create missing private objects/views and reject conflicting existing data/layout. Adoption, live DDL, layout migration and cutover workflows remain unfinished.

**Does retained space clean itself?** Source journals reclaim by independent ACK. Target receipts/tombstones/indexes are outside logical journal quota and need storage monitoring. Receipt compaction/retention, soak and hardware capacity reports remain unfinished.

## Primary references and limits

Design references: [Stream Load](https://doris.apache.org/docs/4.x/data-operate/import/import-way/stream-load-manual/), [Unique Key concurrency](https://doris.apache.org/docs/4.x/data-operate/update/unique-update-concurrent-control/), [JSON precision](https://doris.apache.org/docs/4.x/data-operate/import/file-format/json/), [tablet identity/privileges](https://doris.apache.org/docs/4.x/sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET/), [official fixture image](https://doris.apache.org/community/developer-guide/all-in-one-image/). Product documentation is not project acceptance; see [validation](/docs/en/reference/validation.html). Complete clusters/compute-storage separation, combined FE/BE faults, TLS, all JDKs, huge catalogs/transactions, adoption/repair/migration and capacity matrices remain pending.

## SQL modes and text validation

Catalog, receipt and row-verification values use binary server-prepared MySQL parameters. The adapter forces `useServerPrepStmts=true` and `emulateUnsupportedPstmts=false`; an unsupported protocol fails instead of silently reverting to literal interpolation. DDL comments contain safe internal identifiers only. Actual Doris4.1.3/Java8 EMPTY and `NO_BACKSLASH_ESCAPES` profiles passed quoted/backslash names, Unicode/emoji text, snapshot, CDC and session reconstruction. Malformed UTF-16 fails deterministically with `DORIS_TEXT_ENCODING_INVALID`, rather than retrying invalid text indefinitely; see [additional evidence](/docs/zh/evidence/2026-11-15-doris-hardening.html).

Sources: [Doris prepared statements](https://doris.apache.org/docs/4.x/key-features/prepared-statement/), [string literals](https://doris.apache.org/docs/3.x/sql-manual/basic-element/literal/string-literal/).

After the binding change, current release9a087 also passed an actual MySQL8.4.13→PostgreSQL17.12+Doris4.1.3 pipeline with outage catch-up, worker kill, SQL repair/retry and missing-view isolation. The native mode/old-backup case used11667063; all14Doris adapter classes match9a byte-for-byte. See [additional evidence](/docs/zh/evidence/2026-11-15-doris-hardening.html) for artifact and scope distinctions.
