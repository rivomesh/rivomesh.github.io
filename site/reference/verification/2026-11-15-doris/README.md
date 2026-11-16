---
sourcePath: docs/verification/2026-11-15-doris/README.md
---

# Doris acceptance / Doris 验收

2026-11-15. Final release145805090 bytes, SHA-256 `43e7f6daf2cd1c3f00e1875a13b38771d1ef67a7c158728a08c8532fa91b9485`.

- Maven:2 Classic SDK +114 app unit/API tests passed, no failures/errors/skips. Final fat-JAR-first Java8/JUnit1.11.0 independently passed all114 app cases. These are repeated executions, not additional distinct scenarios.
- DOM:30 checks passed, including Doris native origins, redirect allowlist, explicit replicas/buckets/index policy, credential masking and v2 rejection. Real visual/accessibility acceptance remains pending.
- Native final release: official `apache/doris:all-in-one-4.1.3` ARM64 (index digest82a5cabc7900ebcd3d080412d636c0cebd6602799fffe2605c652b2ea7d42609), internally `doris-4.1.3-rc02-7126cf65d96`. Actual JDBC/Stream Load/private H2 journal and native rows/receipts, auto MoW/views, nonunique BTREE/GSI indexes, PK move, keyless multiplicity/delete, replay, stale version refusal, uint64/65-digit decimal/JSON/base64, server/client restart and actual older nonempty FE+BE backup refusal without changing saved checkpoint.
- Mixed actual pipeline: MySQL8.4.13→PostgreSQL17.12+Doris4.1.3, full/CDC/keyless/generated/JSON/binary/decimal/uint64; Doris outage while PostgreSQL continues, automatic catch-up through backend startup; worker SIGKILL and same stream/snapshot identities; PostgreSQL CHECK error while Doris advances, remove constraint/generation-bound CLI resume replays original transaction; missing Doris view pauses only Doris while PostgreSQL continues; PostgreSQL FENCED versus Doris UNCONFIRMED pause.
- The mixed case used release526bcede65f1146ac05cfa29cd08958c721f17cc4c8c8f0f21a68ae44ecb6e2c. Comparing all65114 classes and1236 runtime resources with the final release found ONLY AdapterCatalog.class changed (availability/help text), no other class or runtime-resource differences. The original mixed JAR is preserved privately under target/release-evidence/doris-pipeline-526bcede.jar.
- Helm/default/RBAC/scoped native manifest parity passed; no live Kubernetes/CSI proof.

Earlier failures are not acceptance: generated internal names exceeded native64-character limits; redirect response disconnects left stale JDK8 connections; Connector/J cancellation timer cleanup threw NPE on disconnect; native backend startup returned HY000/1105 which needed anchored transient classification. The accepted implementations fix these without retrying arbitrary NPEs or all generic SQL errors. Structured SQLState/vendor diagnostics omit SQL/data/password messages. Native load labels are attempt-scoped; versioned rows/read-back/permanent destination receipts provide idempotency.

The fixture uses one FE/BE, explicit1 replica, container6GiB/3CPU, FE heap768MiB, BE JNI256MiB/native2GiB. These limits are not hardware throughput standards. Cross-table transaction visibility, live DDL, nonempty adoption, arbitrary partial-table rollback, receipt GC, all JDK/TLS/multi-node/compute-storage separation/failover/capacity profiles remain unverified or unfinished. SQL/HTTP health does not prove LOAD/DDL privileges; initial identity checks require Doris ADMIN. All isolated test containers/volumes were cleaned. Private fixture configs/worker logs remain under target/broker-tests; archives contain no production credentials.
