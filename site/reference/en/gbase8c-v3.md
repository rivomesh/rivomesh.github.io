---
sourcePath: docs/en/gbase8c-v3.md
---

# GBase 8c destination

`GBASE_8C` is an experimental adapter using the vendor's `com.gbase8c.Driver` and `jdbc:gbase8c://`. **8a, 8c and 8s are separate product families**; PostgreSQL wire compatibility does not establish support for all three. 8a/8s remain separate planned adapters. The first profile targets V6 S1.3.0B19 ARM64, PG/UTF8; the first actual MySQL+PostgreSQL mixed snapshot/CDC/TIME/keyless/text-key/outage/catch-up/worker-kill/SQL-repair/missing-table acceptance passed. This applies to that profile and is not a full production matrix claim.

See [config/gbase8c-v3.yml](/reference-files/config/gbase8c-v3.yml). CLI and the Web v3 wizard share this adapter. Pre-create a PG-compatible UTF8 database and a synchronization account allowed to create schemas/tables/indexes and execute DML. The service does not change global compatibility settings or promote database nodes.

Use a separate login. Native tests confirmed that initialization owner `omm` cannot connect remotely, and `CREATEDB` alone does not authorize schema creation inside `postgres`. An administrator can grant the required database scope:

```sql
GRANT CREATE, CONNECT ON DATABASE postgres TO rivomesh_writer;
```

Existing schemas/tables need their own permissions or ownership. Synchronization does not require SYSADMIN. The fixture's CREATEDB attribute exists to create a negative compatibility-mode test database; pre-created production databases do not require copying that attribute. See the [vendor permission guide](https://www.gbase.cn/community/post/5726).

## Session and data contract

Every physical connection checks the metadata product and actual kernel version before vendor-specific SQL. It requires PG mode, UTF8, preserved empty strings and case/trailing-space-sensitive text comparisons. It sets session UTC, synchronous local commit and standard string escaping. Read-only endpoints raise a retryable connection error. Other compatibility modes require separate semantic and type plans.

Quoted identifiers, row tables and primary keys are used. Keyless rows have internal occurrence IDs. JSON maps to JSONB; UINT64 to DECIMAL(20,0), wide decimals retain precision, binary maps to BYTEA, timestamps retain microseconds, and MySQL TIME becomes a signed INTERVAL. Generated values are taken from the source; complete target-side expression reconstruction is not promised. A native probe confirmed VARCHAR(100) holds 100 four-byte Unicode characters.

Business changes and the target checkpoint share a local transaction and epoch fence. One unavailable target does not prevent independent targets acknowledging data. This does not imply cross-target distributed atomicity or protection against arbitrary physical backup rollback, split brain or external business writers.

## Index and distributed scope

`DOWNGRADE_BUSINESS` turns non-identity business UNIQUE into ordinary indexes. Simple business GSI conversion loses global uniqueness and routing. Primary, identity and internal uniqueness cannot be downgraded. Existing UNIQUE is not automatically dropped; expression/prefix/full-text/spatial indexes need a reviewed plan. Only the synchronization service may write destination business tables; validate and restore constraints before takeover.

Distributed tables add distribution-key and unique-constraint restrictions: see the [vendor SQL reference](https://www.gbase.cn/docs/gbase-8c/04%20%E5%8F%82%E8%80%83%E6%89%8B%E5%86%8C/02%20SQL%E5%8F%82%E8%80%83/SQL%E8%AF%AD%E6%B3%95/). A single-instance PG acceptance cannot establish CN/DN, DSS shared-storage, HA failover, cross-shard transaction or redistribution compatibility. Distribution-key changes, metadata/ownership placement, preserved UNIQUE and global indexes require independent planning and native verification.

## Recovery and FAQ

- On downtime/network failure, retain journal/checkpoints and wait for the same writable destination. Size retained logs and source binlog retention for the outage.
- SQL errors pause the affected subscription. Inspect/fix the cause and resume the original transaction. Manual skip/compensating data editing is not implemented.
- Missing business tables isolate the affected target. Do not edit checkpoints; rebuilding or resnapshotting requires a separate plan.
- Arbitrary nonempty adoption is rejected. Empty existing tables still need column/key/trigger/FK/index/ownership validation.
- Unsupported live source DDL pauses safely; complete online schema evolution is pending.
- The vendor filename is `gbase8c-jdbc-3.0.0B02.jar`, its embedded Maven version is `3.0.0`, and runtime DriverVersion contains an unresolved placeholder. Exact input identity uses fixed filenames and SHA-256, not that version string.

## Reproducible inputs

[Vendor downloads](https://www.gbase.cn/download/gbase-8c?category=DRIVER_PACKAGE). Driver ZIP SHA-256: `3c2645993cd2e20a19941fc4d4bb5aba0f02ca378766543b6dd259a50c382721`; JAR SHA-256: `fe115f05124f6b9f37e49c829a0def28f7d09a6d871dd62a0c9f856b0aaa7e91`. The build verifies both, preserves vendor classes and a dedicated license resource, and checks Java 8-compatible bytecode.

Native fixtures use separately obtained lawful vendor binaries. No database binaries/licenses are distributed in the repository. The local base image in `tests/gbase8c/Dockerfile` supplies Linux userland; the actual executable is verified vendor `gbased`, not openGauss pretending to be GBase.

[中文](/reference/zh-CN/gbase8c-v3.html)

## Native fixture reproduction / 原生夹具复现

Use Python 3.12+ and a lawful matching ARM64 vendor installer:

```sh
python3 tests/gbase8c/prepare.py /path/to/GBase8cV6_S1.3.0B19_Unified_centos7.6_aarch64.tar.gz
SYNC_MAVEN_CACHE=/tmp/rivomesh-container-maven-cache bash tests/gbase8c-pipeline-run.sh
```

Installer SHA-256: `6946abaa7666cbfadea3957682020262a102e52c6f7b4632d1f93fee9d3400b7`; extracted B19 kernel SHA-256: `69663acfbb786c3f05cc434fb9f6d42806609b69c818c6e6ce0c4234748ad582`, matching its vendor checksum. The unified installer also contains a B10 kernel; this fixture explicitly selects B19.
