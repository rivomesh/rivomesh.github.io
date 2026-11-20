---
kind: docs
locale: en
title: "Oracle source"
sourcePath: docs/en/oracle-source.md
---

# Oracle source, archived capture and preflight

[中文](/docs/zh/reference/oracle-source.html)

The Oracle 26ai profile verifies one writable CDB/PDB, archive mode, force and minimal supplemental logging, source identity and Flashback read access. Archived capture and durable SCN recovery to PostgreSQL were revalidated on ARM64 with Oracle Free 23.26.4.0.0, Temurin 21 and Oracle JDBC 23.26.4.0.0. Other versions, types, RAC and failover need separate verification.

1. Provide an Oracle JDBC JAR compatible with your Java runtime alongside the Rivomesh JAR. [Oracle JDBC compatibility](https://docs.oracle.com/en/database/oracle/oracle-database/26/jjdbc/JDBC-getting-started.html)
2. Give the CDB-root account read access to `V_$DATABASE`, `V_$INSTANCE` and the selected PDB in `V_$PDBS`. Configure its `CONTAINER_DATA` visibility for that PDB. Give the PDB account read access to its `V_$PDBS` identity and `SELECT` and `FLASHBACK` on the declared tables. [Oracle container data privileges](https://docs.oracle.com/en/database/oracle/oracle-database/26/dbseg/managing-commonly-and-locally-granted-privileges.html)
3. Configure the two services and uppercase `OWNER.TABLE` names with the [probe example](/files/config/oracle-source-probe.yml).

```sh
java -cp 'rivomesh.jar:ojdbc8.jar' io.github.rivomesh.Main probe-oracle config/oracle-source-probe.yml
```

The report includes DBID, the resetlogs SCN, PDB GUID and a common snapshot SCN. It checks a Flashback read in each table at that SCN and reports primary-key presence. For `ORACLE_WRITABLE_PDB_REQUIRED`, verify the PDB is open read/write and the root account can see that PDB. For `ORACLE_PDB_AUTHORITY_MISMATCH`, compare the supplied service and PDB identity.

The [native fixture](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/tests/oracle-source-probe.py) verifies keyed and keyless tables, a historical update/delete and rejection of the root service supplied as the PDB.

Add `--logminer` for the native archive verification. One commit XID contains an update and keyless delete with redo and undo SQL, and the committed-only result excludes a rolled-back insert. [Oracle LogMiner](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html)

Add `archiveWindow.startScn` and `archiveWindow.endScnExclusive` as decimal strings to validate a selected archived interval. The root account needs read access to `V_$THREAD` and `V_$ARCHIVED_LOG`. The check covers the current resetlogs incarnation and one redo thread. `CATALOG_CONTIGUOUS` reports uninterrupted catalog coverage. `ORACLE_ARCHIVE_LOG_GAP` indicates that the archive catalog does not cover the entire interval. Retain the original interval and verify physical files with LogMiner before a recovery.

Set `archiveWindow.decodeCommitted: true` to read the registered archive files with LogMiner. The CDB-root account additionally needs `LOGMINING`, `EXECUTE` on `SYS.DBMS_LOGMNR` and access to `SYS.V_$LOGMNR_CONTENTS`. The report includes the committed transaction count, operation counts and SHA-256 of typed changes. The probe reads the generated redo and undo statements as data. It accepts complete images for supported `NUMBER(p,s)`, `VARCHAR2` and `DATE` columns, and refuses crossing transactions, split redo statements, missing supplemental images and unsupported operations or types. Enable appropriate supplemental logging on each table before recording the interval.

The decoded output includes the last typed commit coordinate with commit SCN and XID. Replay groups complete transactions with per-transaction event ordinals. It refuses an ambiguous sequence if different XIDs share a commit SCN. The native fixture also rotates an initially unarchived suffix and verifies a second distinct commit coordinate.

## V3 Oracle to PostgreSQL

Use [the V3 example](/files/config/oracle-source-v3.yml) with `source.type: ORACLE`. The first experimental profile uses Oracle 26ai Free 23.26.4.0.0 on ARM64 and PostgreSQL 17.12. Declare uppercase source owners and tables, owner-to-destination schemas and one writable PDB. The root account additionally needs read access to `V_$TRANSACTION` and `V_$PDB_INCARNATION`, plus the archive and LogMiner permissions above. Use all-column supplemental logging for each selected table. The PDB account reads the selected tables, their metadata and the common Flashback SCN.

```sh
java -cp 'rivomesh.jar:ojdbc8.jar' io.github.rivomesh.Main check config/oracle-source-v3.yml
java -cp 'rivomesh.jar:ojdbc8.jar' io.github.rivomesh.Main run config/oracle-source-v3.yml
```

For the UI, launch the runtime that owns the Worker (`serve` in combined mode or `agent` in a separated cluster) with the same classpath. In New task choose **V3 → Oracle** or import the V3 task. Enter the CDB root and PDB services separately, the PDB name and uppercase `OWNER.TABLE` selections. Map each source owner to a PostgreSQL schema and run **Check** on the assigned Agent before starting. The supervised Worker inherits the separately supplied Oracle JDBC driver from the owner’s classpath. The profile supports bounded `NUMBER(p,s)`, `VARCHAR2` and `DATE` in keyed and keyless rows. The snapshot uses one SCN per capture start. An interrupted unfinished snapshot can restart from a new Flashback view while completed snapshots remain reusable.

Capture polls closed archive segments. The durable coordinate binds CDB DBID and resetlogs, PDB GUID, UID and incarnation, captured SCN and the retained archive floor. A transaction already open at the snapshot can hold that floor back. When its commit lands in a closed archive, the complete transaction enters the journal. The floor advances only after coverage passes the SCN of a later active-transaction sample. Retain archives starting from the reported floor. Verify archive rotation and retention under the real workload.

A missing archive, unsupported record, ambiguous ordering or unreviewed DDL stops capture with the previous durable position. Use the capture review and preserve the source and journal. Source promotion, RAC, online-redo capture, native binary JSON, LOBs, other generated expressions and further target profiles require separate acceptance. [Oracle active transactions](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/V-TRANSACTION.html) · [PDB incarnation](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/V-PDB_INCARNATION.html)

### Archived DDL review

When a selected PDB's archived DDL stops capture with `ORACLE_REDO_DDL_REQUIRES_PLAN`, open **Capture recovery** on the failed task or call its read-only `GET /api/tasks/{id}/capture-recovery` endpoint. The report binds the error generation and the last durable checkpoint hash. The `CURRENT_ORACLE_PDB_CATALOG_VS_JOURNAL` comparison uses the last recorded schema version and digest for each selected table, plus a separate digest of the definition visible now. It reports changes in supported column names, types, sizes, nullability, column order and the recorded primary key. Checkpoint admission checks that the retained Oracle source is eligible to revisit the cut.

The current catalog may reflect later DDL. It cannot establish the historical shape or the SQL at the blocked archive record. Oracle's versioned LogMiner dictionary tracking requires a different dictionary mode than the current online catalog reader. An unsupported shape or unavailable catalog check produces an `UNAVAILABLE` result with its source error. An unchanged visible definition can coexist with a blocked DDL record because the selected tables or the recorded metadata may omit the changed object. Preserve the archive floor and review a replacement baseline. Applying or advancing past Oracle DDL requires a separate approved transition. [Oracle LogMiner dictionary tracking](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html)

The disposable acceptance fixture uses `tests/oracle-source-probe.py --logminer --pipeline --ddl-review` with a Temurin 21 artifact and the Oracle JDBC driver. It compares the first current schema, a later edit and an unsupported current shape against the same recorded checkpoint.

When the stopping scan supplies a complete `USER DDL` or `INTERNAL DDL` row with verified PDB identity, the report also includes `blockedArchiveEvent`. The top-level `USER DDL (PlSql=0 RecDep=0)` form seen on Oracle Free 26ai qualifies. The report records the SCN, `RS_ID`, `SSN`, archive window and SHA-256 of the SQL text as read by JDBC. The journal stores the fingerprint with the failure generation under the capture lease. It checks the checkpoint hash again when serving the report. A subsequent catalog query or archive scan cannot substitute a different row for that failure. The journal keeps at most one observation per pipeline. A newer failure can replace the stored observation under its own generation.

An older failure, incomplete row or failed evidence write returns `ORACLE_DDL_EVIDENCE_UNRECORDED`. A corrupted or differently bound record returns `ORACLE_DDL_EVIDENCE_INVALID`. Both leave the existing DDL stop in force. The fingerprint documents the observed row from the online catalog session. Approval of a nullable column addition still needs the historical dictionary and complete DML at the boundary, a verified schema delta and target receipts at the original cut. Add `--ddl-fingerprint` to the disposable DDL review fixture to compare the stored hash with the archive record and then archive a later DDL and DML.

### Savepoints and partial rollback

Archived capture uses LogMiner with `COMMITTED_DATA_ONLY`. On Oracle Free 26ai 23.26.4.0.0, the nested `SAVEPOINT` and `ROLLBACK TO` fixture produced seven canceled changes and seven compensation records in the unfiltered archive. The committed-only scan returned the four surviving changes for that transaction on both reads. The test covers successive changes to the same keyed row, a canceled primary-key change, a canceled delete and duplicate keyless rows. [Oracle LogMiner](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html) · [Oracle redo record fields](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/V-LOGMNR_CONTENTS.html)

This acceptance covers the tested scalar columns on a single Oracle instance and closed archives. If a selected row still exposes a rollback flag, capture can stop with `ORACLE_REDO_PARTIAL_ROLLBACK_UNSUPPORTED` in the `SOURCE_DECODE` phase. Inspect the capture status with the DBA and retain the reported SCN, its archive floor and the journal. The target's skip and row repair workflows apply to journaled transactions. A source decode failure must be resolved at the source or through a reviewed rebuild from a new baseline.

Reproduce the closed-archive and Flashback comparisons with `tests/oracle-source-probe.py --logminer --savepoint-evidence`, the Temurin 21 JAR and the Oracle JDBC driver. Add `--pipeline --savepoint-pipeline` to check independent PostgreSQL subscriptions with separate data and metadata schemas, including original snapshots and target receipts after a forced Controller and Worker restart.

### BLOB and CLOB preflight

For a selected Oracle table with `BLOB` or `CLOB`, preflight checks the storage mode in `ALL_LOBS` and refuses archived capture. `ORACLE_SECUREFILES_LOB_UNDO_UNAVAILABLE` identifies SecureFiles, for which LogMiner does not supply LOB undo SQL. `ORACLE_BASICFILES_LOB_REQUIRES_PROFILE` identifies BasicFiles, which needs a separate complete-image and replay profile. `ORACLE_LOB_STORAGE_UNPROVEN` applies to partitioned LOBs or when the reader cannot determine the storage mode. [Oracle LogMiner data types and SecureFiles](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html) · [Oracle ALL_LOBS](https://docs.oracle.com/en/database/oracle/oracle-database/26/refrn/ALL_LOBS.html)

On Oracle Free 26ai 23.26.4.0.0, Flashback recovered the original nonempty values for BasicFiles and SecureFiles BLOB and CLOB. All 12 short-value updates for those tables yielded undo SQL with `PAYLOAD = NULL`, including updates with a known non-NULL prior value. A two-byte or two-character write into a 5,000-unit value emitted `SEL_LOB_LOCATOR` and `LOB_WRITE` records with status 2 and no undo. Two scans of the closed archive returned the same 30 records byte for byte. To reproduce with a disposable database and the source probe, add `--logminer --lob-evidence --lob-preflight` and supply the JAR and Oracle JDBC driver.

When preflight refuses a table, check the selected owner, table and LOB storage with the database administrator. Keep the durable SCN and its archives when investigating an existing job. If that table must migrate, arrange a separate LOB-capable migration and verify the contents before cutover. LOB locators and fragments alone cannot serve as full values, and empty LOBs have a different meaning from SQL NULL.

### Character data and padding

The Oracle source profile admits `VARCHAR2` with byte or character length semantics. It also admits `CHAR` when the PDB database charset is `AL32UTF8`, and `NVARCHAR2` and `NCHAR` when the PDB additionally uses `AL16UTF16` as its national charset. The three added types must be declared with at most 4,000 bytes in the Oracle dictionary. Preflight reports `ORACLE_CHARACTER_CHARSET_UNSUPPORTED` or `ORACLE_CHARACTER_STORAGE_UNSUPPORTED` when these checks fail. The PostgreSQL target stores the source character values in variable-length text, including the padding supplied by Oracle. [Oracle character types](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Data-Types.html)

Oracle Free 26ai 23.26.4.0.0 preserved supplementary characters, combining code points, quotes and trailing spaces in the tested Flashback and archived transactions. Empty character input became SQL NULL. Oracle padded `CHAR(8 CHAR)` by characters and `NCHAR(8)` by UTF-16 code units. LogMiner emitted escaped `UNISTR` literals for the national character rows and column extraction matched Flashback across 60 required images. Capture validates Unicode escapes and paired surrogates without executing the generated SQL. [Oracle nulls](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Nulls.html) · [Oracle UNISTR](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/UNISTR.html)

The restart acceptance used two PostgreSQL 17.12 subscriptions. Each kept its original snapshots and matched Oracle Flashback byte for byte through archived inserts, updates, SQL NULL assignments and keyed or keyless deletes. The Controller and Worker were forcibly stopped before the last two transactions. Reproduce archive and Flashback checks with `tests/oracle-source-probe.py --logminer --character-evidence`, Temurin 21 and the Oracle JDBC driver. Run the independent dual-subscription restart fixture with `--logminer --pipeline --character-pipeline`.

### Native binary JSON

The Oracle SQL `JSON` type stores OSON. Rivomesh preflight returns `ORACLE_REDO_COLUMN_TYPE_UNSUPPORTED` for a selected table with that type. In a disposable Oracle Free 26ai 23.26.4.0.0 PDB, enabling all-column supplemental logging succeeded, but traditional LogMiner returned 24 native JSON table records with status 2 and `Unsupported` in both SQL image fields. Four transactions covered keyed and keyless inserts, whole-document updates, path updates and deletes. LogMiner decoded each regular `VARCHAR2` marker, and both reads of the closed archive returned identical records. [Oracle JSON data type](https://docs.oracle.com/en/database/oracle/oracle-database/26/adjsn/json-data-type.html) · [Oracle LogMiner supported types](https://docs.oracle.com/en/database/oracle/oracle-database/26/sutil/oracle-logminer-utility.html)

The local PDB LogMiner session recovered all four scalar control values. For the 24 native JSON records, `COLUMN_PRESENT` reported zero for both images and `MINE_VALUE` returned SQL NULL. Those results indicate absent images. Flashback JDBC could still read the full documents, distinguish SQL NULL from JSON null and preserve typed date and binary scalars with `OracleJsonValue`. On the tested driver, `getBytes()` on the native JSON column returned UTF-8 JSON text. The diagnostic uses `tests/oracle-source-probe.py --logminer --native-json-evidence` with a Temurin 21 runtime and the Oracle JDBC driver. [Oracle LogMiner column extraction](https://docs.oracle.com/en/database/oracle/oracle-database/26/arpls/DBMS_LOGMNR.html) · [Oracle JDBC JSON value types](https://docs.oracle.com/en/database/oracle/oracle-database/26/jajdb/oracle/sql/json/OracleJsonValue.html)

### Textual JSON columns

An Oracle `VARCHAR2` column declared with up to 4,000 bytes maps to PostgreSQL `jsonb` when an enabled, validated, nondeferrable `CHECK` tests that single column for strict JSON and unique object keys. The check can be declared at column or table level. Other `VARCHAR2` columns retain their string mapping. [Oracle SQL/JSON constraints](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/is-json-condition.html)

```sql
CREATE TABLE RIVO_APP.DOCUMENTS (
    ID NUMBER(12) PRIMARY KEY,
    PAYLOAD VARCHAR2(1000 BYTE)
        CHECK (PAYLOAD IS JSON (STRICT WITH UNIQUE KEYS))
);
ALTER TABLE RIVO_APP.DOCUMENTS ADD SUPPLEMENTAL LOG DATA (ALL) COLUMNS;
```

Keep both modifiers inside the same parentheses. Oracle Free 23.26.4 returns `ORA-02252` for the split form `IS JSON (STRICT) WITH UNIQUE KEYS` in a `CHECK`.

Both Flashback and archived capture verify strict syntax, one complete JSON value and unique object keys. SQL `NULL` remains distinct from JSON `null`. PostgreSQL `jsonb` preserves the value and may change whitespace, member order and numeric formatting. Preflight returns `ORACLE_TEXT_JSON_PRIMARY_KEY_UNSUPPORTED` for a textual JSON primary key because distinct source strings can become equivalent target keys. Values outside either database's JSON representation use its usual error and recovery flow. [PostgreSQL JSON types](https://www.postgresql.org/docs/17/datatype-json.html)

Adding or removing this constraint on a synchronized column changes its target type mapping. Review the destination schema and existing data before resuming capture through the DDL recovery workflow. Oracle returns `ORA-40664` if the column already has an `IS JSON` constraint. Replace the existing constraint during the reviewed schema migration. [Oracle ORA-40664](https://docs.oracle.com/en/error-help/db/ora-40664/)

## Oracle DATE in PostgreSQL

Oracle `DATE` maps to PostgreSQL `timestamp(6) without time zone` and preserves the date, hours, minutes, seconds and SQL `NULL`. Capture sets the Gregorian calendar and American date language on its own Oracle sessions. PostgreSQL reads and writes use `LocalDateTime` so the Worker time zone does not move a valid Oracle wall-clock time during a daylight-saving transition. An existing destination column must also use `timestamp without time zone`. [Oracle DATE storage](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Data-Types.html) · [Oracle format models](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Format-Models.html) · [PostgreSQL JDBC date and time types](https://jdbc.postgresql.org/documentation/query/)

The profile accepts dates from 1582-10-15 through 9999-12-31. A value before that range, including BCE, raises `ORACLE_DATE_VALUE_OUT_OF_RANGE` when its era and format can be decoded. Unexpected LogMiner date masks raise `ORACLE_DATE_FORMAT_UNSUPPORTED`. Inspect the source values, the affected table and the durable position before retrying an interrupted run. Oracle's `TIMESTAMP` variants require a separate profile.

Run `tests/oracle-source-probe.py --logminer --pipeline` with the frozen JAR and Oracle JDBC arguments to reproduce the temporary real databases and actual SIGKILL/restart. Add `--text-json` for strict textual JSON or `--date-values` for Oracle DATE, covering Flashback, archived CDC and recovery for both keyed and keyless tables. [Evidence](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#oracle-archived-cdc-and-restart)

## Integer virtual columns

For Oracle 26ai, select **Sync supported integer virtual columns** in the Oracle source form or set `source.oracle.allowVirtualNumericColumns: true` in the V3 YAML. Check the task before starting.

The profile accepts three expressions for virtual `NUMBER(p,0)` columns. Multiply one physical integer column by a literal integer from 1 to 999, add two physical integer columns, or subtract one physical integer column from another. Each operand and output needs an explicit precision of at most 18. The output precision must hold the entire declared operand ranges. With `AMOUNT NUMBER(12)` and `ADJUSTMENT NUMBER(12)`, for example, `TOTAL NUMBER(16,0) GENERATED ALWAYS AS (AMOUNT + ADJUSTMENT) VIRTUAL` fits this profile. Virtual primary keys, function expressions and decimal operands require a separate profile. [Oracle column expressions](https://docs.oracle.com/en/database/oracle/oracle-database/26/sqlrf/Column-Expressions.html)

The Worker reads the original Flashback value and verifies it against the same arithmetic used on archived physical operands. PostgreSQL receives a regular numeric column containing that value. Redo and undo generate separate before and after images, so repeated writes within one transaction and keyless duplicate rows keep their original values and multiplicity. A SQL NULL in either operand produces a SQL NULL result.

Enable the setting when creating the journal. It changes the source fingerprint. An existing task needs a separately reviewed schema and checkpoint migration before it can adopt this profile.

Run `tests/oracle-source-probe.py --logminer --pipeline --virtual-columns --startup-timeout 480` with the frozen application and Oracle JDBC arguments. The fixture checks old and new outputs, keyless duplicates, restart from the same snapshot IDs and unsupported expression refusal. Use `--virtual-evidence` for the separate dictionary, Flashback and archived operand inspection. [Verification evidence](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#oracle-virtual-column-feasibility)

## Oracle virtual column feasibility

Oracle Free 26ai `23.26.4.0.0` exposed the virtual `NUMBER` definition `"AMOUNT"*2` without a physical segment column. A native Flashback read returned the original generated values and duplicate multiplicity at one SCN. The archived redo and undo contained the physical operands for two successive updates of the same row, a SQL NULL insert and a keyless delete. They omitted the generated value. The independent `COLUMN_PRESENT` probe returned `ORA-00904` for the qualified operand, so its presence flags are unavailable. That feasibility run established which operand images are available in native archives.

Use `tests/oracle-source-probe.py --logminer --virtual-evidence --startup-timeout 480` with the frozen application and Oracle JDBC arguments. This profile inspects a disposable native database. [Evidence](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#oracle-virtual-column-feasibility)
