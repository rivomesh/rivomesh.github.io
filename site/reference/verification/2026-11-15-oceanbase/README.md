---
sourcePath: docs/verification/2026-11-15-oceanbase/README.md
---

# OceanBase experimental implementation — full recovery NOT accepted

2026-11-15. 中文状态：**已实现实验适配，完整联合恢复验收未通过**。Do not treat native contract markers as a passed complete pipeline.

Current candidate `9a087db5fd615099ab8e780b2bde70c43b2d0f232961d8580134d119285ee593`,145809188 bytes. Maven: 2 Classic SDK + 116 application unit/API tests passed; actual-fat-JAR-first Java 8 separately passed 116 application cases. These are repeated executions, not extra distinct scenarios.31 DOM checks passed. Source/UI/native examples and EN/ZH FAQ are implemented.

## Proven implementation and native stages

- Official ARM64 `oceanbase/oceanbase-ce:4.3.5.6-106000012026040916`, index digest31086a6900c21c479c2bcd942b6a28c53b17a51f4e9b9eb8eafcc596adfcd2e3. Native VERSION5.7.25-OceanBase_CE-v4.3.5.6, MYSQL tenant1002, MySQL Connector/J 8.4.0/Java 8.
- Every new sink connection verifies vendor/mode/non-system tenant and forces STRONG reads. Native tests changed a session to WEAK then verified the profile restored STRONG. The adapter is an explicit product rather than a MySQL label; Oracle mode and an OceanBase journal are not enabled.
- Actual release/JDBC native contract passed cross-database atomic business/checkpoint rollback after a duplicate-PK error, committed replay, alias ownership refusal, epoch fencing and reopen. No alternative production classes were substituted; external fixture compiles against the actual fat JAR.
- Current candidate mixed runs reached and passed actual MySQL 8.4.13→PostgreSQL 17.12+OceanBase snapshots, uint64/65digit decimal/JSON/binary/generated-value checks, PK move and keyless2→1delete before the controlled outage.
- First release4b4260fe9078856106d5b3fb8f1d71d857528d315c752bef0f1e27bb1f2cb8a3 additionally passed outage catch-up, worker SIGKILL retaining stream/snapshot identities and PostgreSQL CHECK isolation before failing in fixture administrative DDL. It precedes catalog-before-DDL optimization; do not transfer whole-runtime proof to9a.
- Current catalog-before-DDL optimization avoids no-op CREATE DATABASE/metadata/owner-table DDL for existing OceanBase objects, retaining engine/owner/fingerprint/transaction checks. Other product paths retain their original creation behavior.
- first-native-indexes.log records an actual ordinary/nonunique secondary index after source business UNIQUE conversion in the first native environment. Global-routing/partition/uniqueness equivalence is not implied.

## Failed complete cases — retained in full

1. `pipeline-first-failed.log` release4b: fixture administrative ADD CHECK used15s socket timeout and failed after the earlier stages above. This is NOT a passed pipeline.
2. `pipeline-catalog-failed.log` candidate9a, container6G/3CPU, instance5G/system1G, unit2G: user tenant remained initializing beyond360s (host readiness480s). The application retried SQL08004/vendor8001 without skipping data. Root cause is unresolved. Resource probe showed META~1GiB/USER~1GiB; that observation alone does not prove causation.
3. `pipeline-memory-failed.log` SAME9a, container7G/3CPU, instance6G/unit3G: OBD refused restart because host memory availability was below6G. Observer never launched despite the image's `boot success!` banner. Private OBD logs and process checks establish this; cgroup OOM count was0. No force-delete or resource-check bypass was used.
4. `pipeline-cpu-failed.log` SAME9a, container6G/6CPU, instance5G/unit2G: native contract/snapshot stages passed, but the user tenant again did not become ready within the recovery window. More CPU did NOT establish a fix. `resource-cpu.log` records actual allocation.

All isolated projects422..429 were cleaned after failed stages; the last two nonfunctional/failed fixtures were explicitly killed only after their Java acceptance process had failed, allowing the host health-wait process to finish cleanup. No unrelated containers, host sysctls, source GTIDs or checkpoints were modified. Raw private task documents, complete OBD/observer logs and configs remain under target and are not published here. Failed cases are not counted as passed acceptance.

## Boundaries and next work

Remain EXPERIMENTAL until the full case completes. Continue diagnosing user-tenant restart with adequate isolated resources, then verify automatic catch-up, worker restart, both SQL-error rollback/repair paths, persistent pause, missing-table refusal and final fences in one reproducible run. Cluster/OBProxy/TLS/other JDKs, Oracle mode, existing nonempty adoption, live DDL, large catalogs/transactions, capacity/soak and broader vendor modes remain pending. Fixture quotas are not production sizing or throughput recommendations. Existing broader Rivomesh goal remains active.

`doris-class-comparison.json` checks only14 Doris adapter classes against accepted native11667063; it is explicitly not a whole-runtime proof.
