---
sourcePath: docs/verification/2026-11-15-doris-hardening/README.md
---

# Doris SQL-mode and encoding hardening / SQL 模式与字符校验

2026-11-15. Accepted native release SHA-256 `11667063fff1ee2c39d23df260b5b3bfe3d4e944c9009a1b696e890515ae1fd8` (145805476 bytes), preserved privately in `target/release-evidence/doris-hardening-11667063.jar`.

- Maven: 2 Classic SDK +114 application tests, zero failure/error/skip.
- Actual Java 8 release/native Doris 4.1.3: full original materializer restart and older-nonempty FE/BE backup refusal repeated after switching catalog/receipt/row predicates to binary prepared parameters.
- Added actual EMPTY and NO_BACKSLASH_ESCAPES session profiles. Quoted/backslash table names, quote/backslash/Unicode/emoji text, snapshot, CDC and a new materializer/JDBC session preserving checkpoint all passed. The session mode was queried and checked, not assumed from a URL. The native placeholder probe included SQL-looking text and checked exact returned bytes/text.
- The adapter forces useServerPrepStmts=true and emulateUnsupportedPstmts=false; unsupported prepared protocols fail instead of silently falling back to literal interpolation. DDL comments accept internal safe identifiers only. Existing ownership/schema metadata and fingerprints remain compatible.
- Malformed UTF-16 input now throws a safe deterministic DORIS_TEXT_ENCODING_INVALID argument failure (no row/cause payload); unit coverage verifies it is not retried. Valid supplementary Unicode remains accepted.
- Original target cluster/TLS/other-JDK/capacity and arbitrary partial-table rollback limits remain. The earlier526mixed source pipeline predates this change. It is now supplemented by an actual current 9a087 mixed pipeline below.

First launch used an incorrect probe binary path; that probe is not acceptance. Official image actually provides /usr/bin/mysql. Native script initially invoked without bash lacked execute permission; it ran successfully with bash. No production configuration or unrelated containers were changed. Own rivomesh-doris-dev-421 volumes/containers were removed.


## Current release mixed pipeline accepted

Actual release `9a087db5fd615099ab8e780b2bde70c43b2d0f232961d8580134d119285ee593` (145809188 bytes) passed MySQL 8.4.13→PostgreSQL 17.12+Doris 4.1.3 on Java 8 after the binary prepared-parameter change: snapshot/CDC, uint64/65digit decimal/JSON/binary/generated/keyless, PK moves, independent Doris outage with PostgreSQL progress and automatic catch-up, actual worker SIGKILL preserving stream/snapshot IDs, PostgreSQL constraint repair/retry while Doris continues, missing-view isolation and truthful SQL FENCED/Doris UNCONFIRMED pause. Session10320 terminated exit0; own rivomesh-doris-pipeline-69965 containers/volumes were removed.

This exact9a release also passed 116 application tests independently against the fat JAR (root build separately2SDK+116app). The native EMPTY/NO_BACKSLASH_ESCAPES and older nonempty FE/BE backup case remains accepted on11667063; all14 Doris adapter classes match current9a byte-for-byte, with that comparison explicitly limited to those classes. Current mixed proof does not claim an entire-runtime comparison or repeat every native mode/backup matrix. OceanBase acceptance remains separate and incomplete despite sharing the release.
