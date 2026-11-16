---
sourcePath: docs/verification/2026-11-15-row-reconciliation/README.md
---

# SQL row reconciliation / SQL 逐行校验首批验收

2026-11-15. Source sealing, typed SQL scans, persisted differences and CLI are implemented and accepted for the profiles below. **Reviewed repair, management jobs/UI, adoption/cutover and the full Rivomesh objective remain incomplete.** [中文工作流](/reference/zh-CN/reconciliation-workflow.html) / [English workflow](/reference/en/reconciliation-workflow.html).

## Final artifact and regression gates

Final runtime SHA256 `acdb9a58b77151e3c30ddfdcdb3587fd4680a503edc5d7585288ca0bbc05ea8c`,187694420bytes. `package-final.log`:181application+2Classic SDK=183root Java/SDK cases,0failure/error/skip. `release-unit-final.log`:181application cases independently pass with the actual final JAR first. Repeated executions are not additional distinct cases.41DOM cases and deployment static checks pass; no new validation UI is claimed.

Production Java/assets stayed frozen from the accepted build through all native profiles and artifact gates. TODO remains SHA256 `0e77e9ea608a9fedd041851753dc6b59f462c49ee86151b750692bac7e6ad4f7`. The preserved runtime is under target/release-evidence/reconciliation-final.jar; it is private build output rather than a source-controlled binary.

## Actual database acceptance

`native-local.log`, `native-postgresql.log`, `native-mysql.log`, `native-gauss.log`:one complete sequential run of the same scenario on LOCAL/H2, EXTERNAL PostgreSQL, a separate MySQL journal, and openGauss journals. Source MySQL8.4 spans sales/billing; destinations are PostgreSQL17 and a separate MySQL8.4. The openGauss service here is a journal, not a claim of distributed GaussDB target acceptance.

- Native SQL target reader verifies bool, float32/float64, binary, Unicode, date, microsecond datetime/timestamp, negative1microsecond TIME, JSON/uint64/65digit DECIMAL and NULL. An early partial close releases its physical checkpoint fence.
- Preserve prior actual global-write/metadata locks, consistent source MVCC after later writes, changed-schema refusal, gate/read deadlines, unfinished cursor abort and a SIGKILL view-holder releasing a blocked writer.
- Snapshot includes negative subsecond TIME and a virtual TIME generated column; keyless negative subsecond rows are updated and restored through actual CDC, proving snapshot identities agree with binlog before-images.
- Isolate a MySQL target on a SQL CHECK error, actually stop it, and establish a PostgreSQL-only cut while new source writes remain outside the pinned view.
- Stage source rows with journal occurrence IDs and seal them. A child JVM persists one partial target row while holding its actual SQL checkpoint lock, then receives SIGKILL. Source seal and partial scan reopen; comparison discards partial targets and completes with the original six source rows. This is real process recovery, not only an in-process close/reopen test.
- Reconciliation verifies physical checkpoints/configuration/generation/epoch/error version/schema/positions and refuses an old completed report as authorization after concurrent resume. Explicit resume catches up later source CDC; the isolated MySQL target is restarted, its CHECK repaired, and the original event retried.
- CLI validate-stage establishes a new two-target cut. Deliberately delete one PostgreSQL keyed row, change one, insert an extra row, and replace one keyless occurrence ID without changing its business values.
- Actually stop the source MySQL after sealing. Comparison uses private saved source rows, detects all keyed and keyless differences, and verifies the untouched MySQL target matches. Source is restarted afterward. CLI historical-report and comparison replay, private difference values and one-item keyset pages are checked.
- Restart the Worker and retain the durable pause. Missing checkpoint metadata remains absent; administrative reads never recreate it.

`row-results.log` independently reads the eight private summary projections without exporting row values:each mode yields one MATCH report with12staged source+target rows/3table results, plus one DIFFERENCES report with21staged rows/6table results and totals2missing,2extra,1changed. Equal row counts alone are insufficient:the wrong keyless ID produces missing+extra.

## GBase regression and Docker preview

`gbase-regression.log`:the existing native MySQL8.4→PostgreSQL17+GBase8cV6 S1.3.0B19 PG mixed fault profile passes on this exact runtime after the source TIME selection change. It covers snapshot/CDC/types/keyless, outage/catch-up, Worker SIGKILL, SQL-error repair/retry, persistent pause, missing-table isolation and fences. It is a replication regression, not GBase row-validation acceptance.

`preview.log` / `preview-http.log`:the development Docker console is healthy at http://127.0.0.1:18088, authenticates admin and serves this copied runtime/source UI. Credentials remain private and are omitted from evidence. Native session38667 returned exit0 after all four journal profiles and GBase cleanup; no fixture process remains.

## Retained failures and fixes

- `real-alias-failed.log`:initial runtime02772549… rejected MySQL FLOAT32 because REAL defaults to DOUBLE. Target DDL now uses explicit FLOAT for the MySQL dialect; no global SQL-mode change or silent alteration of existing tables.
- `typed-mismatch-failed.log` and `negative-subsecond-failed.log`:runtime8b55a1cc… exposed JDBC TIME formatting losing the sign of negative one microsecond. The diagnostic contains only fixed synthetic fixture values. Source snapshot, consistent-view selection, virtual-generated evaluation and target comparison now cast MySQL TIME expressions to CHAR; binlog signed-microsecond decoding is unchanged. Final typed/CDC profiles pass.
- `set-order-failed.log`:runtime485bbf29… passed LOCAL but failed a source-seal check after an EXTERNAL PostgreSQL report reopen because Set iteration order changed. Seal inputs now explicitly sort selected-target and mapped-table sets. A deterministic multi-table/multi-target deserialize regression was added; the final full four-mode matrix passes. The failed run was not counted as accepted.

## Boundaries still open

Reports are private plaintext H2 files, not encrypted or externally anchored evidence. Logical quotas and per-row limits are checked; physical-file checks at batch boundaries are not hard filesystem quotas. Very large catalog/transaction/table capacity and soak standards are unaccepted. Lost incomplete source MVCC scans require a new cut, while sealed-source target scans can be reread if their original certificate remains valid. No operation here advances synchronization checkpoints, repairs business rows, restores UNIQUE constraints, skips transactions or authorizes takeover. UI/API jobs/permissions/audit and reviewed idempotent repair receipts are next work. Other vendor reader modes, distributed GaussDB, MQ downstream validation, analytical visibility protocols, PG/Oracle sources and remaining full-platform requirements stay open. Own native fixtures are disposable; unrelated containers are untouched. No visual/accessibility acceptance claim.
