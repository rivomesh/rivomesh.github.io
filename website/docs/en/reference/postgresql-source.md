---
kind: docs
locale: en
title: "PostgreSQL source"
sourcePath: docs/en/postgresql-source.md
---

# PostgreSQL source

[中文](/docs/zh/reference/postgresql-source.html)

This experimental profile reads committed transactions from one writable PostgreSQL 17 or 18 primary using built-in `pgoutput`. Configure one source database per task. In this profile, `databases` lists source schemas. Declare destination mappings with `targets[].mappings`.

## Configure and run

1. Set `wal_level=logical` and reserve slot capacity for the durable stream and an exported snapshot. Give the source role `LOGIN`, `REPLICATION` and `SELECT` on the published tables.
2. Create a publication that explicitly lists the synchronized tables and includes INSERT, UPDATE and DELETE. Set `REPLICA IDENTITY FULL` on each table to retain full before images, including for keyless rows. Keep the publication scope stable and pause for review before schema changes.
3. Use the [example configuration](/files/config/postgresql-source-v3.yml) for the source, publication and destination. A PostgreSQL destination connection must be able to read `pg_control_system()` to verify physical identity. Configure distinct source and destination databases.
4. Run `check <config file>` to verify the connection and publication, then use `run <config file>`. In the management console, choose **V3 → PostgreSQL** in New task or import the V3 configuration. Enter one database, the source schemas, the publication and slot prefix. The wizard offers PostgreSQL and MySQL destinations. Save, run **Check** on the assigned Agent, then use **Start**.

PostgreSQL supplies a consistent position when creating a logical replication slot. Rivomesh imports an exported MVCC snapshot for each table and captures concurrent transactions through the original LSN stream. It reports the flushed LSN only after journaling the complete transaction. Each task uses a slot bound to its journal generation. [PostgreSQL replication protocol](https://www.postgresql.org/docs/17/protocol-replication.html) · [pgJDBC replication API](https://jdbc.postgresql.org/documentation/server-prepare/)

The PostgreSQL source uses pgJDBC 42.7.14 with automatic flush advancement disabled. Ordinary keepalives and WAL outside the publication leave the durable journal position unchanged. Monitor retained WAL during extended intervals without published transactions. [pgJDBC download](https://jdbc.postgresql.org/download/) · [Replication stream builder](https://github.com/pgjdbc/pgjdbc/blob/REL42.7.14/pgjdbc/src/main/java/org/postgresql/replication/fluent/ChainedCommonStreamBuilder.java)

## Profile and recovery

- The initial type profile includes signed integers, booleans, bounded numeric values, text, JSON/JSONB and BYTEA. Keyed and keyless tables use full row identity.
- PostgreSQL `BYTEA` maps to PostgreSQL `BYTEA` and MySQL `LONGBLOB`. The logical connection uses hex even when the source server defaults to `escape`. Use the native fixture with `--source-image postgres:17.12 --bytea-values` and add `--bytea-escape-output` for the second profile to verify SQL `NULL`, empty values, raw octets and keyless multiplicity during snapshot, CDC, and restart. The fixture also checks unchanged out-of-line TOAST values and 16–32 KiB payloads. [PostgreSQL binary types](https://www.postgresql.org/docs/17/datatype-binary.html)
- PostgreSQL UUID values are copied as lowercase canonical text in `VARCHAR(36)`. PostgreSQL 17.12 to PostgreSQL 17.12 verified nullable UUID values and primary-key changes through CDC. Reproduce with `--uuid` in the native fixture. [PostgreSQL UUID representation](https://www.postgresql.org/docs/17/datatype-uuid.html)
- PostgreSQL `DATE` maps to `DATE` in both PostgreSQL and MySQL. The supported range is 1000-01-01 through 9999-12-31, and SQL `NULL` stays null. Snapshot and pgoutput use the same ISO representation. A civil date stays the same across Worker time zones and dates in the Gregorian calendar transition. [PostgreSQL date and time](https://www.postgresql.org/docs/17/datatype-datetime.html) · [MySQL DATE range](https://dev.mysql.com/doc/refman/8.4/en/datetime.html)
- PostgreSQL `TIME WITHOUT TIME ZONE` uses `TIME(6)` on PostgreSQL and MySQL targets, including the distinct `24:00:00` endpoint. Clock values retain microseconds and SQL `NULL`. `TIMETZ` remains unsupported. [PostgreSQL date/time types](https://www.postgresql.org/docs/17/datatype-datetime.html) · [MySQL TIME precision](https://dev.mysql.com/doc/refman/8.4/en/date-and-time-type-syntax.html)
- PostgreSQL timestamps with and without time zone use microsecond precision. A timestamp without time zone keeps its civil clock value, including civil times in a daylight-saving gap. A timestamp with time zone is copied as the equivalent UTC clock value. The PostgreSQL target stores `TIMESTAMP(6) WITHOUT TIME ZONE` and the MySQL target stores `DATETIME(6)`. Interpret the UTC column explicitly when a downstream application needs an instant. The shared range is `1000-01-01 00:00:00` through `9999-12-31 23:59:59.499999`. [PostgreSQL timestamp semantics](https://www.postgresql.org/docs/17/datatype-datetime.html) · [MySQL DATETIME range](https://dev.mysql.com/doc/refman/8.4/en/datetime.html)
- PostgreSQL 18 stored generated columns can be materialized as ordinary destination columns when the publication includes them. Use `ALTER PUBLICATION rivomesh_capture SET (publish_generated_columns=stored)` and retain `REPLICA IDENTITY FULL`. PostgreSQL 17 generated columns, PostgreSQL 18 virtual generated columns, publication filters, partition routing, TRUNCATE and automatic DDL migration require separate profiles. Preflight or capture reports unsupported relation changes and types.
- Restart uses the existing LSN and snapshot when the original primary, timeline, slot and journal remain available. Resume a failed target subscription after addressing its SQL error.
- With `POSTGRESQL_REQUIRED_WAL_UNAVAILABLE`, retain the old journal and record the last captured LSN. Evaluate whether the original slot and required WAL can be recovered. If needed, rebuild through a new pipeline and a reviewed destination scope.
- Common-cut validation and additional target, promotion and driver profiles need separate verification.

### Exact numeric values

Source columns must declare a finite precision. PostgreSQL returns each value after applying its source precision and rounding rules. Rivomesh selects a target `DECIMAL` that fits every finite value in the declaration.

| Source declaration | PostgreSQL and MySQL target storage | Example |
| --- | --- | --- |
| `NUMERIC(p,s)` with `0 <= s <= p` | `DECIMAL(p,s)` | `NUMERIC(65,30)` retains all 65 digits |
| `NUMERIC(p,s)` with negative `s` | `DECIMAL(p + abs(s),0)` | `NUMERIC(4,-2)` uses `DECIMAL(6,0)` and copies the source-rounded integer |
| `NUMERIC(p,s)` with `s > p` | `DECIMAL(s,s)` | `NUMERIC(2,4)` uses `DECIMAL(4,4)` and copies the source's fractional values |

The shared profile allows up to 65 target digits and 30 fractional digits. These mappings preserve stored values, SQL `NULL` and row identities. PostgreSQL applies the original rounding and range to writes at the source. The target declaration can have a wider domain. The source adapter retains the original type modifier for its publication shape check. [PostgreSQL numeric types](https://www.postgresql.org/docs/17/datatype-numeric.html) · [MySQL fixed-point types](https://dev.mysql.com/doc/refman/8.4/en/fixed-point-types.html)

Preflight reports `POSTGRESQL_NUMERIC_PRECISION_REQUIRED` for unconstrained `NUMERIC` and `POSTGRESQL_NUMERIC_PROFILE_UNSUPPORTED` when the mapped precision or scale exceeds the profile. A non-finite value such as `NaN` causes `POSTGRESQL_NUMERIC_NONFINITE`. Capture holds its previous LSN and leaves the entire transaction unapplied. Preserve the slot and journal, then use the capture recovery review to confirm the retained checkpoint and affected subscriptions. A later source update does not remove the original transaction from WAL.

Append `--source-image postgres:17.12 --numeric-values` to the fixture command below to verify PostgreSQL and MySQL snapshots, key changes, duplicate keyless updates and deletes, restart at the original LSN, and rejection of a transaction containing `NaN`.

### Floating-point types

PostgreSQL `REAL` and `DOUBLE PRECISION` map to the same types on a PostgreSQL target and to `FLOAT` and `DOUBLE` on MySQL. Snapshot and pgoutput sessions select exact floating-point text. Native checks cover adjacent representable values, subnormals, SQL NULL, keyless duplicates and continuation after restart. Both signs of zero are copied as zero and share the same row identity. [PostgreSQL floating-point types](https://www.postgresql.org/docs/17/datatype-numeric.html#DATATYPE-FLOAT) · [MySQL floating-point types](https://dev.mysql.com/doc/refman/8.4/en/floating-point-types.html)

NaN and positive or negative infinity cause `POSTGRESQL_FLOAT_NONFINITE`. At the affected streaming transaction, capture holds its previous LSN, both target receipts and the business rows. Append `--source-image postgres:17.12 --floating-values` to the native fixture command. [Verification](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#postgresql-real-and-double-precision-to-two-sql-targets)

### Native verification commands

Reproduce the native checks with `python3 tests/postgres-source-run.py --artifact <release jar> --output target/pg-source-proof`. The fixture simulates a lost PostgreSQL slot in disposable containers.

Add `--source-image postgres:17.12 --date-values` to run the civil date fixture against PostgreSQL and MySQL destinations. It covers a DATE primary-key change, an exact keyless occurrence, restart from the original slot and snapshot, and refusal of an infinite date without applying its transaction. BCE dates and dates outside the profile range produce the same `POSTGRESQL_DATE_OUT_OF_RANGE` diagnostic. Review source values and the retained LSN before retrying.

Add `--source-image postgres:17.12 --timestamp-values` to exercise both timestamp forms on the two SQL targets. The fixture checks DST boundaries, key changes, keyless duplicates, restart at the original LSN and refusal of the whole transaction when a timestamp yields `POSTGRESQL_TIMESTAMP_OUT_OF_RANGE`.

Add `--source-image postgres:17.12 --clock-values` to verify both SQL destinations, the two midnight endpoints, keys, keyless rows, restart at the original LSN and preflight refusal of `TIMETZ`.

Use Temurin 21 for current builds and fixtures. Earlier cross-runtime results are archived with their exact artifact. [Verification record](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/README.md#postgresql-source-runtime-matrix)

PostgreSQL 18.7 with PostgreSQL 17.12 as the destination passed eight Temurin 21 checks. The fixture covers stored generated values on keyed and keyless updates, materialization at the destination and omission from the publication. Add `--source-image postgres:18 --generated` to reproduce. [Generated column publication](https://www.postgresql.org/docs/18/logical-replication-gencols.html)

## Verified TLS connections

Set the PostgreSQL source and destination JDBC URLs separately. Each can use `sslmode=verify-full&sslrootcert=/run/rivomesh/trust/ca.pem&channelBinding=require` when the server requires SCRAM with channel binding. Place the public CA certificate in the execution Agent's read-only filesystem. The DNS name in each URL must match the server certificate, including the stable writer name when using a database HA service. Run **Check** on the execution Agent after changing certificates or mounts. [pgJDBC TLS](https://jdbc.postgresql.org/documentation/ssl/) · [pgJDBC connection properties](https://jdbc.postgresql.org/documentation/use/)

For the direct PostgreSQL 17.12 source and destination profile, add `--source-image postgres:17.12 --tls` to the native fixture. It generates temporary CAs and server certificates, inspects live TLS sessions and verifies that preflight refuses the wrong source hostname or target CA. [PostgreSQL TLS statistics](https://www.postgresql.org/docs/17/monitoring-stats.html#MONITORING-PG-STAT-SSL-VIEW)

## Synchronized standby promotion

For a new task, keep one stable PostgreSQL writer endpoint in `source.postgresql.url` and set `source.postgresql.failoverSlot: true`. Equip the primary with a physical standby slot listed in `synchronized_standby_slots`. Configure the standby with that `primary_slot_name`, `hot_standby_feedback=on`, `sync_replication_slots=on` and a valid database name in `primary_conninfo`. Verify that the logical slot on the standby is persistent, synchronized and has received the required WAL before routing a failover. [PostgreSQL slot synchronization](https://www.postgresql.org/docs/17/logicaldecoding-explanation.html#LOGICALDECODING-REPLICATION-SLOTS-SYNCHRONIZATION) · [Failover checklist](https://www.postgresql.org/docs/17/logical-replication-failover.html)

The database HA service fences the previous primary, promotes the standby and routes the writer endpoint. Rivomesh reconnects through that endpoint. The promoted server must have the original system ID, an actual timeline history covering the durable LSN and snapshot coordinates, and the original failover slot. The slot must retain the required WAL and its confirmed LSN must not lead the journal. Retain the journal and old WAL if any of these checks fails. Configure the next physical standby before attempting another promotion.

PostgreSQL 17.12 on Temurin 21 passed actual primary SIGKILL, native promotion, continued delivery with unchanged snapshot IDs, and refusal of a route back to the original timeline. The fixture checks the active timeline via `IDENTIFY_SYSTEM`. Select `--source-image postgres:17.12 --failover` and append `--reject-old-primary` to run the divergent-route case. Load balancer products, cascading topologies and further version combinations have separate acceptance. [Streaming replication protocol](https://www.postgresql.org/docs/17/protocol-replication.html)

## Review a paused schema change

If a row transaction announces a changed relation through pgoutput, Rivomesh stops at the previous durable LSN with `POSTGRESQL_RELATION_CHANGED_REQUIRES_PLAN`. Open the capture failure review to compare the current publication against the journal schema. The read-only comparison shows table identity, recorded and current digests, and changed column names. A changed PostgreSQL type declaration, such as `TIMESTAMP` to `TIMESTAMP(6)`, is shown under modified columns. The view also flags relative reordering of existing columns. Treat it as an observation of the current publication. Later DDL can change the results because PostgreSQL pgoutput delivers relation metadata and row changes while DDL statements are outside the stream. A publication outside the supported profile returns the discovery diagnostic and retains the previous LSN. The review applies no DDL and makes no checkpoint changes. [PostgreSQL logical replication restrictions](https://www.postgresql.org/docs/17/logical-replication-restrictions.html) · [Relation messages](https://www.postgresql.org/docs/17/protocol-logical-replication.html)

Run the disposable native example with `python3 tests/postgres-source-run.py --ddl-review --source-image postgres:17.12 --artifact <release jar> --output target/pg-ddl-review`.
