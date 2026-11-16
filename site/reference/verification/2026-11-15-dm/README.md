---
sourcePath: docs/verification/2026-11-15-dm/README.md
---

# DM8 native-mode acceptance / 达梦原生验收

2026-11-15. **首批配置通过，目录保持EXPERIMENTAL；整个Rivomesh目标尚未完成。** [中文手册](/reference/zh-CN/dm-v3.html) / [English](/reference/en/dm-v3.html)。

## Final current release

Final immutable SHA256 `2753680903200ace25175d36fa4d9f9d3f699e2e0574f664b466535c8659a16b`,186792196bytes. `pipeline-final.log`,session33970 exit0, reruns the **complete** native/empty-layout/mixed-fault profile against the final actual JAR, including artifact gates and cleanup of own project5957. `package-final.log`:151root Java/SDK cases pass,0failure/error/skip. `release-unit-final.log`,session28304 exit0:149application cases independently pass with the final JAR first. `ui-final.log`:40DOM checks pass. These repeated executions are not additional distinct scenarios.

`runtime-comparison.json` compares66166classes and every archive resource with acceptedffc42c: only AdapterCatalog.class changes to describe verified capabilities. Other runtime/resource bytes are identical, and final native acceptance was still repeated. Production sources/assets remained frozen during each native run. `artifact-final.log` verifies source asset equality, driver services and Java8 vendor/application bytecode. Root TODO unchanged SHA256 `0e77e9ea608a9fedd041851753dc6b59f462c49ee86151b750692bac7e6ad4f7`.

## Accepted runtime and scope

`pipeline-ffc42c-passed.log`, actual Java8 fat JAR SHA256 `ffc42c7e55998e1e6aa56346a8dd119f72a404e1281e510c4d8055a2c1a60001`,186792152bytes, session70919 exit0. Native DM8.1.4.80 ARM64/vendor JDBC8.1.3.140, source MySQL8.4.13 and peer PostgreSQL17.12. Source, release classes and console assets stayed frozen for the complete case; both artifact gates passed.

- Every connection checks actual DM product/banner, native COMPATIBLE_MODE0, UTF8, CASE_SENSITIVE1, BLANK_PAD_MODE1, NORMAL/PRIMARY+OPEN and COMMIT_WRITE WAIT; sets session UTC and preserves empty strings. No global parameters/promotion/license bypass.
- Actual two-schema business/checkpoint commit, committed replay, duplicate-PK rollback preserving sequence and business rowcount, reopen, alias ownership refusal and old-epoch refusal pass.
- Existing empty tables with insufficient byte-based UTF8 VARCHAR, too-small binary or SECOND(0) interval are refused. Corrected native layouts are accepted without advancing stream sequence. Character capacity uses actual ALL_TAB_COLUMNS CHAR_USED/CHAR_LENGTH/DATA_LENGTH, not the vendor driver's byte precision alone.
- Real MySQL snapshot/CDC covers uint64,65digit decimal retained as reviewed VARCHAR text at source scale, JSON retained as reviewed CLOB text, bounded binary, generated values, empty strings/NULL, Unicode/quotes including supplementary emoji, DATE and microsecond timestamps. Business UNIQUE metadata proves ordinary-index conversion.
- TIME0..6 signed microseconds, negative25hours and negative1microsecond, keyless multiset delete/update pass. Native day/second interval arithmetic is compared with independent source integer microseconds.
- Mixed-case TextKeys table, source NO PAD binary-collation string PKs 'a'/'a '/'A'/emoji, trailing-space PK move and case-sensitive delete pass.
- DM outage while PostgreSQL continues, automatic DM catchup, actual worker SIGKILL preserving generation/snapshot, separate SQL CHECK repair/retry on PostgreSQL and DM, another worker restart preserving the DM pause, missing DM table isolation while PostgreSQL continues, and final transactional target fences all pass.

`package-ffc42c.log`:2Classic SDK+149application cases=151pass,0failure/error/skip. `release-unit-ffc42c.log`:149application cases independently pass with the actual fat JAR first. Repeated executions are not additional distinct scenarios. `ui.log`:40DOM checks pass. `deployment.log`:Helm/native static checks pass; this is not liveK8s acceptance.

## Failed runs remain failures

- `pipeline-case-failed.log`,8229cfe6: product/profile and native DML/replay/duplicate error/checkpoint stages ran, then the fixture's unquoted lowercase contract-table read folded to uppercase and failed. The production sink already quotes business identifiers. This whole run did not pass.
- `pipeline-source-items-quote-failed.log`,same8229: native contract/types/snapshot passed; a fixture edit put double quotes around MySQL source id in the PK-move UPDATE, so MySQL treated it as a string literal and rejected it. This is not CDC acceptance.
- `pipeline-source-time-quote-failed.log`,same8229: corrected items UPDATE, but the analogous duration UPDATE still had the fixture mistake. Both source statements were corrected without disguising them as successful runs.
- `pipeline-missing-code-failed.log`,same8229: snapshot/CDC/TIME, outage/catchup, worker restart and both SQL repair cases passed; final missing-table reason assertion failed. Actual target was PAUSED and PostgreSQL continued, but DM reported SQLState22000/vendor-2106. Production diagnosis now maps only actual DMException/-2106 to TARGET_TABLE_MISSING_REBUILD_REQUIRED; other vendor/data errors retain their states. The complete corrected ffc42c run passed.

Own failed projects88232/90621/92629/94062 and passed1680 were cleaned, as were development containers6811/6812. No unrelated containers, host sysctls, source GTIDs or business checkpoints were altered to get a pass. Private task documents, journal files and raw database logs stay under ignored target/.

## Native probes and reproducible fixture

`native-types-probe.log` preserves expected negative type findings: table BOOLEAN is rejected by this version, BIT works, DECIMAL(65,30) is rejected, native day/second interval/VARCHAR(n CHAR)/JSON/CLOB/BLOB types parse. The connector uses reviewed CLOB text rather than claiming every JSON implementation is equivalent. `native-values-probe.log` proves interval strings need the native INTERVAL literal form and records actual JDBC metadata/value roundtrips. `native-catalog-probe.log` records CHAR/BYTE capacities, BLANK_PAD_MODE1 and actual duplicate-object SQLState22000/vendor-2124.

Downloaded ARM64 tar from the DM download domain,575825920bytes, SHA256 `f08359576241c17110446aa3e19794650b95add43840a5da9d5070240b1e53c8`; image config ID `eb5f243c8f4322596d0eac611c0fa2d8cd8a03a5d3f69889f3549a530354b210`, tag `dm8:dm8_20250924_rev288894_HWarm_kylin10_64`. The public path is `https://download.dameng.com/product/DM8/Docker/mouthversion/2025.03/dm8_20250924_HWarm_kylin10_sp1_64_ent_8.1.4.80_pack29/dm8_20250924_HWarm_kylin10_sp1_64_rq_ent_8.1.4.80_pack29.tar`, linked from the vendor community. Database binaries/licenses are not redistributed. Native initialization reported a14day trial ending2026-11-29; no license files/checks were modified. Supply a lawful compatible build to reproduce later.

Pinned Maven Central driver JAR SHA256 `9af4ff4d6ed15948507f528a18ab9b7196b3600d9169ad7998c19869031a3c6f`, class major52. Vendor POM declares Apache-2.0; full dependency/NOTICE review remains pending.

The fixture uses vendor initialization inside its own non-privileged Docker container, with internal dmdba and a persistent data volume. Its supervisor asks DmService to stop cleanly before ending the vendor launcher; raw shutdown logs confirmed successful database shutdown. It does not change host users/limits. Health requires an exact SQL result marker with correct quoted credentials, not the presence of digit1 in error output. Trial/resource settings are not performance sizing claims.

## Unaccepted scope

Other versions/modes, DSC/DPC/MPP/HA write routing, TLS, other JDKs, arbitrary nonempty adoption/custom collations, complete DDL/index conversion, old physical backup/power-loss/soak, huge catalogs/transactions and hardware capacity remain pending. V2/DM Journal are not enabled. Actual K8s/CSI, controller HA, PG/Oracle sources and remaining migration/platform requirements are still open.
