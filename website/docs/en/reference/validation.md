---
kind: docs
locale: en
title: "Validation records"
sourcePath: docs/en/validation.md
---

# Validation and recovery evidence

Updated 2026-11-15. 中文：[故障与恢复验证](/docs/zh/reference/validation.html). Counts below are **test executions, including repeated regressions**, not counts of distinct scenarios. An implemented protocol or Java 8 bytecode does not establish acceptance on every product version, security profile or JDK.

## OceanBase experimental adapter: full recovery NOT accepted (2026-11-15)

[Evidence and retained failures](/docs/zh/evidence/2026-11-15-oceanbase.html): candidate9a087 passed118Java/SDK unit/API tests,116app tests separately against the actual fat JAR, and31DOM checks. Native strong reads, cross-database rollback, ownership/epochs, snapshots/types and partial CDC passed. Four complete mixed attempts still failed administrative-DDL timeout, tenant initialization or OBD resource admission. These are not accepted full recovery; the catalog remains EXPERIMENTAL. Artifact differences, resource probes and all failures are retained for further investigation.

## Doris SQL-mode and encoding hardening (2026-11-15)

[Additional evidence](/docs/zh/evidence/2026-11-15-doris-hardening.html): catalog/receipt/row values now use binary server-prepared parameters, with interpolation fallback disabled. Actual release11667063 passed native restart/older-backup guards and new EMPTY/NO_BACKSLASH_ESCAPES quoted/backslash table, Unicode/emoji snapshot/CDC/session-reconstruction cases. Unit coverage verifies malformed UTF-16 is a deterministic pause. Current release9a087 additionally passed the actual MySQL8.4.13→PG17.12+Doris4.1.3 mixed recovery case; its14Doris adapter classes match the native-mode/old-backup release11667063. Artifact and scope distinctions are retained.

## Doris native and mixed recovery (2026-11-15)

[Archived evidence](/docs/zh/evidence/2026-11-15-doris.html):2 SDK +114 app tests and30 DOM checks passed; the final fat JAR separately passed114 app cases, not additional distinct tests. Final native MoW/index/PK/keyless/precision/restart and older nonempty FE+BE backup refusal passed. Actual MySQL8.4→PG17.12+Doris4.1.3 passed snapshot/CDC, independent target outage/automatic catch-up, worker kill, SQL repair/retry, missing-view isolation and honest pause fences. Comparing all65114 classes with the mixed-case release found only capability text changed; runtime resources match. Clusters/TLS/all JDKs/capacity/adoption/live DDL remain outside this acceptance.

## Exact task grants and final release (2026-11-15)

[Archived evidence](/docs/zh/evidence/2026-11-15-task-scopes.html): Maven passed2 SDK plus99 app tests; the exact final fat JAR separately passed all99 app tests. Repeated executions are not additional distinct cases.29 DOM checks and three Helm/native profile checks passed. Actual Java8 loads a platform file and verifies exact/empty grants, filtered listings, denied direct actions and grants after SIGKILL/restart; this management fixture uses a stub DB backend. The same final release separately passed actual MySQL8.4→PG17.12 configuration rotation/restore/restart CDC, with146 independently verified audit events. Account editing UI, live K8s and external immutable audit remain outside this acceptance.

## Global security audit (2026-11-15)

[Archived evidence](/docs/zh/evidence/2026-11-15-audit.html):98 Java/SDK unit/API,28 DOM and7 exporter checks passed. The same release passed Java8 actual HTTP/H2, native hash verification across exported pages, committed-event persistence after SIGKILL, and deleted-store startup refusal; the independent management fixture uses a stub DB backend. Actual MySQL8.4→PG17.12 credential/config restore/restart CDC also passed, with132 independently verified audit events. Helm/native parity is static acceptance, not live K8s or external immutable auditing.

## Configuration editing: final-release acceptance (2026-11-15)

[Archived evidence](/docs/zh/evidence/2026-11-15-configuration.html): 88 Java/SDK unit/API and25 DOM checks passed. The exact final release passed actual MySQL8.4→PostgreSQL17.12 stopped target-password rotation, failed old-credential CHECK, idempotent update, revision restore and controller restart with deleted projections, retaining original stream/snapshot identities. This does not establish visual/browser acceptance, all targets/source account DDL, or complete security auditing.

## Current accepted profiles

| Profile | Evidence | Boundary |
|---|---|---|
| V2 MySQL 8.0.46 / 8.4.13 → openGauss 7.0.0-RC3 | `target/platform-matrix-final.log`, 44 executions, no failures/errors/skips | Includes async promotion, MGR election and platform recovery; commercial distributed GaussDB is not covered |
| MySQL 5.7.44 | `target/mysql57-base.log`, 28 executions | Basic snapshot/JSON/CDC/restart; full 5.7 HA matrix remains pending |
| PostgreSQL 17.12 target | `target/sink-postgres.log`, 37 executions | Snapshot, transactional data/checkpoint, JSON and restart; other versions need acceptance |
| V3 SQL fan-out, LOCAL/EXTERNAL journals | `target/v3-final-after-keeper.log`, 53 executions | Separate MySQL 8.4, PostgreSQL 17 and openGauss 7 targets; HTTP controls and ownership |
| V3 async MySQL failover | `target/v3-ha-fixed.log` | Two workers, primary death, externally promoted replica, GTID dependencies and unhealthy SQL-thread rejection |
| V3 three-node MGR | `target/v3-group.log` | Primary dies during an unfinished MVCC snapshot; new election, snapshot rebase and catch-up |
| Independent SQL target delivery | `target/v3-cooperative-stop.log`, 31 executions | A locked Gauss checkpoint does not prevent PG/MySQL receiving changes within five seconds |
| Journal quota and recovery | `target/v3-backpressure-recovery-fixed.log`, 40 executions | Low-quota backpressure, reserved normalization workspace, heartbeat, shared pause, oversized transaction refusal, expansion/replay |
| SQL + four message targets | `target/messaging-redis-safe-reconnect.log`, 42 executions | Actual executable JAR, MySQL → PostgreSQL + Kafka 3.9.2 / RabbitMQ 4.1.4 / NATS 2.11.8 / Redis 7.4.2; worker kill and three consecutive broker restart rounds |
| Retry diagnostics | `target/retry-status-unit.log`, 35 executions; `target/ui-retry-status.log`, 10 DOM tests | Automatic retries stay RUNNING with a diagnostic code; no checkpoint/generation change or manual Resume action |
| CLI LOCAL keeper + retry status | `target/v3-local-keeper-retry-status.log`, 43 executions | Both journal modes, three actual SQL targets, real HTTP controls and LOCAL pause/restart transitions |

Redis acceptance additionally injects connection replacement between XADD and WAITAOF, insufficient replica fsyncs, handshake EOF, unsafe AOF/eviction settings, deleted streams and a disconnected non-default database. Confirmations never lead publication receipts; replay retains event IDs. Socket reopening cannot silently write into database 0. Sentinel, Cluster, replica promotion, TLS and power-loss acceptance remain pending.

Kafka/RabbitMQ/NATS/Redis tests use single-node broker profiles. Replica parameters, SASL/TLS configuration and hostname verification code do not substitute for real authenticated/cluster failure tests. Pulsar 4.0.14 transport and mixed-pipeline recovery now passed the separately recorded profiles below. RocketMQ initial native single-broker transport acceptance passed; mixed pipeline snapshot/CDC, worker kill and three broker restart rounds passed. Artemis Core has a separately recorded independent transport profile; seven-message-product mixed recovery has not passed. ActiveMQ Classic remains unfinished.

The later `target/messaging-visible-retry-recovery.log` passed 45 executions. Each of three rounds actually stops all four brokers, verifies PostgreSQL continues while every message destination persistently reports automatic retry without PAUSED, starts the brokers, and verifies catch-up plus automatic diagnostic clearing. Workers execute the release JAR; recovery requires no manual Resume.

Pulsar transport acceptance passed in `target/pulsar-transport-java25-shading.log`: the actual shaded artifact coexists with core dependencies, validates ownership/policies, publishes/reads, survives a broker restart and refuses missing initialized resources. `target/messaging-pulsar-ready-recovery.log` then passed **47 executions**, actual release JAR with a 256 MiB worker heap, PostgreSQL plus five message destinations, worker kill, snapshot/keyless/generated values and three deterministic stop/start rounds. Broker readiness is awaited separately (up to 180 seconds); the subsequent catch-up bound stays 60 seconds. That is test orchestration, not a hardware-independent recovery SLO.

The earlier `target/messaging-pulsar-mixed-first.log` failed while the Pulsar admin service was still starting at the test deadline. It is not counted as a pass. Safe typed retries retained the original receipt, and other targets caught up. `target/pulsar-transport-first.log` failed a compile-time ambiguous SDK type import; `target/pulsar-transport-shaded.log` failed because old Shade 3.5.1 could not parse the dependency's Java 25 multi-release classes. Shade 3.6.2 fixes packaging while retaining a Java 8 build baseline. These packaging checks are not an actual Java 25 runtime acceptance matrix. Latest DOM tests: 11 pass in `target/ui-pulsar-copies.log`.

## Verified behavior

- Atomic source transaction/capture positions, independent subscriber ACKs, content receipts, epoch fencing, checksums and gap refusal on H2/MySQL/PostgreSQL-family journals.
- Snapshot baseline/manifests/parts, complete-artifact reuse, incomplete MVCC rebase, per-table target confirmations and artifact GC only after every subscriber confirms.
- Cross-database source transactions; keyless duplicate occurrences, one-occurrence updates/deletes and persisted normalization reused by slow targets.
- Lossless unsigned/decimal/JSON values, SQL NULL versus JSON null, empty text/bytes, DATE/microseconds, logged STORED generation and supported historical VIRTUAL evaluation.
- Data/checkpoint atomicity, whole-transaction rollback, primary-key updates, target ownership, protected identity constraints and business UNIQUE conversion.
- Source-primary shutdown and external promotion, MGR majority election, SQL-thread 1032 failure rejection, retained GTIDs and fail-closed purged/missing history. The service does not promote database nodes or rewrite GTIDs.
- Target SQL/permission failures pause only that target. Stale Resume generations cannot clear newer failures. Temporary failures retry and retain their original transaction/checkpoint.
- Low-quota backpressure leaves unpersisted GTIDs unchanged while delivery/GC/heartbeats continue; workspace reservation prevents raw backlog from blocking its own normalization.
- Mandatory-return/negative or lost message confirmation does not advance publication receipts. Broker and journal are separate transactions, so duplicates are possible and consumers must stage/deduplicate/commit their own checkpoints.
- Shared pause persists before target fencing. SQL fences can be confirmed; in-flight broker requests remain explicitly unconfirmed and cannot be retracted by a journal epoch.

## Console, packaging and deployment

The bilingual wizard, masking, token handling, task creation without automatic start, SQL/MQ mappings, version-bound recovery, retry status and source-versus-target snapshot progress have DOM tests. Real HTTP tests cover authentication, origin rejection, bounded task resources, request deduplication, revision conflicts, corrupted configuration/state refusal, private snapshots and redacted status. The environment has no usable automated browser window; screenshot, keyboard and visual accessibility acceptance are not claimed.

The executable JAR has been tested as the worker artifact, with Java 8 entry bytecode and the relocated Gauss driver. Container acceptance previously verified non-root UID 10001, health endpoints, authentication, static assets, private configuration and volume restart. Helm lint/render, native-manifest parity, existing PVC and invalid configuration checks passed in `target/deployment-after-messaging.log`. A live Kubernetes/CSI deployment, full upgrade/soak tests and Java 11/17/21/25 runtime matrices remain required.

Tests create and remove only their own Compose projects. RESET, primary shutdown and test-data repairs apply only to isolated fixtures. Reproduction entry points include `tests/matrix.sh`, `tests/v3-run.sh`, `tests/v3-ha-run.sh`, `tests/v3-group-run.sh`, `tests/messaging-run.sh` and `tests/ui` (`npm test`). Scripts execute sequential Maven builds against shared output directories.

## Failed runs and limits

Failed logs are retained and are not counted as passes. Early H2 concurrent shutdown tests preceded cooperative stop/controller keepers. `target/v3-backpressure-recovery.log` exposed connect-time EOF during H2 handoff; bounded connection-open retry fixed that path. `target/v3-retry-status.log` exposed CLI automatic-server churn across PAUSED loops; a keeper spanning those loops is verified by the later 43-execution run.

`target/messaging-redis-first.log` and `target/messaging-redis-repeated-recovery.log` exposed an unclassified Redis constructor connection failure. The constructor now uses typed retry classification. Later intermediate runs also exposed unguarded test-reader network calls during startup; those readers now retry only known connection/metadata transients. `target/messaging-redis-safe-reconnect.log` is the passing three-round acceptance. Earlier Rabbit/Kafka test-configuration and test-predicate failures remain documented in the Chinese record.

Commercial distributed GaussDB, other vendor/analytics targets, complete live DDL, populated-target adoption, manual repair/skip, migration cutover/failback and full RBAC are unfinished. Async replication can permanently lose transactions before promotion; CDC cannot reconstruct such losses, forged GTIDs or source writes never recorded in binlog. Use the [runtime manual](/docs/en/reference/pipeline-v3.html) and [message recovery contract](/docs/en/reference/messaging-v3.html) for operational boundaries.

## RocketMQ transport and destination setup

`target/rocketmq-transport-cached.log` passed against the current executable JAR, Java 8 and actual native broker 5.5.0 with client 5.5.1. It checks isolated Netty/Fastjson2 loading, capability-check resource noncreation, confirmed body/key/channel, preserved history through broker restart, a new client resuming the same binding, refusal of ASYNC_FLUSH and a missing initialized topic. This is one local synchronous disk copy; no ACL/TLS, replicated/controller/DLedger, power-loss or throughput claim is made. `target/rocketmq-transport-expanded.log` additionally passed interrupted topic provisioning, foreign manifest refusal and queue-change refusal.

`target/consumer-setup-fixed-unit.log`: 38 core executions, no failure/error/skip. `target/ui-rocketmq-profile.log`: 13 DOM tests passed, including consumer resource/guarantee text escaping, credential exclusion and the RocketMQ broker/retention wizard. `target/messaging-rocketmq-mixed.log`: 49 executions passed with no failure/error/skip. Actual release JAR, MySQL → PostgreSQL plus six message products; worker kill and three all-broker stop/start rounds, SQL continues while all MQ subscriptions remain RUNNING with retry diagnostics, automatic catch-up clears diagnostics. This is a small fault fixture, not a hardware-independent throughput or latency SLO.

`python3 tests/verify-artifact.py` passed (`target/artifact-rocketmq.log`): current console bytes, Java 8 application bytecode, entry point/JDBC services, private SDK classes, no test classes/old package/duplicate ZIP entries, core SLF4J API preserved. Artifact 138290998 bytes, SHA-256 `f1f1e7921e03ef85402229a05e30e4164042371da53bc15e83aac59f5e691879`. Later source changes require a new package/check.

## Role enforcement

`target/roles-http-unit.log`: 41 executions passed, no failures/errors/skips; includes real HTTP VIEWER read-only, OPERATOR task-control versus create denial, ADMIN creation, redacted session identity, duplicate credential rejection and required administrator validation. `target/ui-roles-permissions.log`: 15 DOM tests passed, including viewer/operator controls, role display and a late 401 response from an older login leaving the newer session intact. `target/artifact-roles-first.log` passed after these application changes: 138296667 bytes, SHA-256 `a17b35d9e1c64a78863af073ab85b940c92a2480db28d67d22cbbc59db4b2b4b`.

Role attribution follow-up: `target/roles-attribution-unit.log` 41 executions passed; authentic HTTP actor overrides spoofed body fields, same-actor replay remains idempotent, another authenticated identity receives 409, creator/operator identities survive controller restart. `target/ui-roles-attribution.log` 16 DOM tests passed, including escaped attribution display. `target/helm-roles-attribution.log` passed default+RBAC native parity, Secret-only role wiring, no-admin/duplicate/illegal-role/literal-token refusal. Real K8s/CSI remains pending. `target/artifact-roles-attribution.log` passed current artifact verification: 138297471 bytes, SHA-256 `2207ed57288d5377e28972647222e68990eb1680b400f586ec0a4e977e77f13e`. Native Chrome additionally returned `cgWindowNotFound`; no visual or accessibility acceptance is claimed.

## Native broker progress / older backup recovery

`target/rocketmq-native-progress-restore.log` passed native queue/CommitLog offset + event/body digest verification, matching client resume, mismatching digest refusal, and actual older nonempty volume restore refusal. The fixture gracefully stops its isolated broker before copying/restoring its own volume. The restored first event remains and the second confirmed event is absent; the saved later receipt prevents continuation. This is not a power-loss, quorum, arbitrary-corruption or consumer checkpoint test.

`target/messaging-native-progress.log`: 53 executions passed with no failures/errors/skips. Actual Java 8 release JAR, PostgreSQL plus six message products, worker crash and three all-broker stop/start rounds; confirmed native receipts survive and targets catch up automatically. Two additional MessageSink cases cover generation-scoped compare-and-set/lease fencing and refusing to invent a missing native receipt on an established publication. `target/v3-native-progress-external.log` passed 47 executions, including native receipt persistence/CAS/old-lease rejection/reopen across actual MySQL/PostgreSQL/openGauss journals and V3 SQL/HTTP recovery.

`target/ui-native-progress.log`: 16 DOM tests passed. `target/artifact-native-progress.log`: current release accepted, 138300921 bytes, SHA-256 `bc62a79154044249ea0071180246c6a918c2ae596905b98cb55fe2e5e90d5621`. Earlier artifact hashes are historical.


Artemis native receipt acceptance: `target/artemis-native-progress-final.log` passed against the actual Java 8 release JAR/current broker. Includes unchanged-identity older nonempty backup refusal, matching/altered/malformed receipts, empty replacement remaining empty, restart, exact messages and non-destructive ACK. `target/ui-artemis-native-progress.log`: 17 DOM cases passed. Seven-product mixed recovery is a separate pending run; prior timeout run is not acceptance.


The performance harness passed a 1,000-row/1,200-change actual release-JAR MySQL 8.4.13 → PostgreSQL 17.12 smoke run with two exact source/target row-stream digests and successful isolated cleanup. See [raw report and limitations](/docs/en/reference/performance.html). Latest seven-product full Maven run `target/messaging-artemis-cookie-fixed.log`: 53 executions passed, one pipeline case failed while Pulsar returned persistent admin HTTP 500. It does not establish seven-product recovery acceptance; the original server exception is being investigated.

`target/pulsar-admin-wrapped-diagnostics.log` passed the actual release-JAR native profile, including a genuinely refused admin connection, wrapped timeout/TLS classification checks, preservation of actual HTTP 500 classification, broker restart, retained publication, policy refusal and missing-topic protection. TLS classification checks are not a real TLS handshake/interoperability test. `target/ui-pulsar-admin-diagnostics.log` passed 17 DOM cases. `target/artifact-pulsar-diagnostics.log` accepted 144060299 bytes, SHA-256 `2985bbbb51b84ec8de97d8a9b44c88d5a5a1d737032b1e13263d03d4a9134aa0`, superseding prior artifact summaries. Earlier HTTP-500-labelled pipeline failures must not be interpreted as confirmed HTTP 500 responses: broker access logs and the SDK cause chain showed the ambiguity; new codes distinguish client transport failures.

Current-release follow-up: `target/unit-pulsar-diagnostics-current.log` passed **48** unit/API executions with no failures/skips against the release JAR and Java 8. `target/messaging-pulsar-gc-diagnostics.log` passed **one** separate focused full snapshot/CDC/worker-kill/three-all-broker-restarts case with PostgreSQL and seven message products, including initialized Artemis queue-loss isolation. Neither number should be presented as a newly passing 54-execution Maven suite. The earlier full-suite run's failing pipeline case is retained as historical failed evidence. JRE/journal SQL matrix execution is recorded separately once results are inspected.


The ten SQL JRE/journal profiles in `target/runtime-matrix-first.log` passed; every raw report was independently checked for source/target snapshot/CDC digests, actual JVM, actual journal backend, identical release and cleanup. See [archived raw matrix](/docs/en/reference/performance.html). ClickHouse HTTP foundation tests `target/clickhouse-http-response-loss.log` passed five local HTTP-server cases, including a genuinely lost response after the request body was received and confirmation that the client did not replay it. These are transport tests compiled separately against the release, not a completed ClickHouse adapter or actual ClickHouse-server acceptance.


## Native ClickHouse and secondary indexes (2026-11-15)

The earlier HTTP-only checkpoint is superseded by the implemented native adapter; see the [handbook](/docs/en/reference/clickhouse-v3.html). `target/clickhouse-pipeline-first.log` passed24 executions, including ONE real LOCAL-H2 MySQL8.4→ClickHouse25.8.33.6+PostgreSQL17.12 pipeline, not24 end-to-end cases. It covers snapshot/CDC, keyless/type boundaries, target outage, process kill/restart and missing-view isolation.

`target/clickhouse-index-definition-fixed-unit.log`:58 core/API tests,0fail/error/skip. `target/ui-clickhouse-index.log`:19 DOM passes, including safe check-result display. `target/clickhouse-index-native-definition-fixed.log`: actual release/Java8/ClickHouse25.8.33.6 acceptance passed BTREE/GSI to two deduplicated skip indexes, no stale-row resurrection through FINAL after indexed-value update (caller explicitly disables exact mode, owned view remains correct), PK moves/keyless deletes/replay, client/server restart, and refusal after actual restoration of an older nonempty volume. Accepted artifact c39fe5719d80bde6a5452ff49663e08b09609ecfd0fc3acbf89a6e212f098c0b,144098850bytes, `target/artifact-clickhouse-index-fixed.log`.

`target/clickhouse-index-native-first.log` failed because server-added default index_granularity caused an overly strict canonical-definition mismatch; explicitly fixing8192 resolved it. That failed log is not acceptance. `target/clickhouse-index-pipeline.log` subsequently passed28 executions, including one real-source UNIQUE/generated-index conversion, index deletion pausing only ClickHouse, restoring that index and resuming the original error generation to catch up while PostgreSQL continues, and later missing-view isolation. No ClickHouse cluster/TLS/power-loss/all-JRE/large-catalog/soak acceptance is implied.

Final compatibility acceptance: `target/clickhouse-index-compat-unit.log`58PASS/0fail/error/skip and `target/ui-clickhouse-index-compat.log`19PASS. `target/clickhouse-index-native-compat.log` actual-release Java8 native acceptance passed explicit NONE create/reopen without indexes plus indexed FINAL/replay/restart/old-volume rollback protection. Omitted config options retain NONE and the old fingerprint; new wizard/example explicitly opt into DATA_SKIPPING. Current artifact144098892bytes SHA25695dbdbb462929ed1a262072e80d1db885696fa53007d5315c38c4d951c193212. Earlier28-pipeline acceptance predates this default-only compatibility adjustment. All own test resources cleaned.


## ActiveMQ Classic (2026-11-15)

Native actual-release Java8 acceptance passed `target/classic-native-selector-fixed.log`: single KahaDB5.19.12 broker, native OpenWire5.16.8 client, persistent local transactions, actual EVENT consumer ACK preserving OWNER, wrong-selector refusal, purge/no-auto-reseed, receipt tamper, client/server restart and actual older nonempty backup rollback refusal. `target/classic-subscription-selector-fixed.log`:2 SDK+63core/API passes,0fail/error/skip; UI20passes in `target/ui-classic-first.log`. Native release1a1945e3f91658e3f666a79af66b5da1d6ec0eb8ea2ff00cd3d9f8242a017115/145723459bytes.

`target/classic-pipeline-prebuilt.log` passed ONE real LOCAL-H2 MySQL8.4→Classic+PostgreSQL17 pipeline with selected durable-ACK consumer, snapshot/CDC/keyless/JSON/generated values, worker SIGKILL/resume, broker outage/catch-up with SQL continuing, SQL CHECK error while Classic continues, original-error-generation repair/retry, purge protection and explicit weak MQ pause fencing. Pre/post artifact6eb2a8bb053fcf777b765713e5c21aeb675e586f53c79098e5dffb2103afb954/145723578bytes. That release only updated catalog/help since the preceding native run. No eight-MQ joint, replicated/TLS/power-loss/capacity/all-JRE acceptance is claimed. Earlier native configuration/HTTP-origin failures and first pipeline harness Python error remain failed evidence. See [Classic handbook](/docs/en/reference/classic-v3.html).

Final package: `target/classic-final-unit-package.log`2 SDK +63 core/API passes,0fail/error/skip; UI20 passes. Current145723617-byte release SHA256290adcc746a64c427ccefc6de712b8fbb7bbdc7ed4d48fcd2757485e99b6c2fe. All65091 class files were compared with the accepted pipeline release; only AdapterCatalog.class changed (status text). Runtime protocol resources are byte-identical. See [archived evidence](/docs/zh/evidence/2026-11-15-classic.html).


## Hive first profile (2026-11-15)

[Archived evidence](/docs/zh/evidence/2026-11-15-hive.html) separates native Sink and actual MySQL8.4.13→PostgreSQL17.12+Hive4.0.1 acceptance. Frozen9ba60d (184136264bytes) passed the complete mixed case and final artifact gate, session21923 exit0 with own resources cleaned. Scope: snapshot/CDC/keyless/generated/type boundaries, Hive outage with SQL progress/catch-up, worker SIGKILL retaining identities, SQL rollback/repair/retry, missing-view isolation and truthful weaker pause results.

Independent native5c23ea passed lost-confirmation replay, case-folded columns, restart and older nonempty Metastore+warehouse backup refusal. All65129 classes/SDK/runtime resources match9ba60d; only bilingual console guidance changed.128 root unit/API,126 separate fat-JAR application and33DOM checks passed; the final UI packaging skipped Java tests and is not an extra execution. Writer/readers must disable query-results cache; enabled cache is refused. Failed cache/PID/stale-assets cases remain archived failures. See [Hive handbook](/docs/en/reference/hive-v3.html) for pending cluster/storage/security/soak/performance matrices.


## Local account lifecycle (2026-11-15)

Final releasec6b2638b624c1757b2309b20e6518e2d81885337910bba63484e0cd755794646,184157177bytes passed [actual-process upgrade/auth/recovery and real SQL continuity](/docs/zh/evidence/2026-11-15-accounts.html). CONFIG activation, roles/scopes, rotation/disable/delete, last-admin, replay, older/missing state and old-program refusal, SIGKILL persistence and exclusive offline recovery preserving RUNNING intent without launching a worker all passed. Old audit exports/hash bytes remain verifiable after upgrade.

136 root unit/API (134app+2SDK),134 separate final-fat-JAR app cases,38DOM and static Helm/native checks passed. Final audit-UI packaging skipped Java tests; every65135 class/other resource matches accepted35465b except console/audit.js. Final native/SQL cases still reran on exactc6b263. Live MySQL→PostgreSQL grant/token changes preserve dataflow identities/CDC and do not resurrect on controller restart; configuration restore regression and168-event native audit proof passed. Own containers cleaned. This does not accept external identity/immutable anchors, multiple writing controllers, live K8s/CSI or capacity matrices.


## 2026-11-15 GBase 8c and Docker development preview

GBase8cV6 S1.3.0B19 PG/UTF8 / vendor JDBC3.0.0B02 first native MySQL8.4.13+PostgreSQL17.12 mixed snapshot/CDC, TIME0..6, keyless/text-key, target outage/catch-up, worker SIGKILL, independent SQL repair/retry, persistent pause, missing-table isolation and fences passed. Final JAR SHA256 `2b462813f74210cab0b2f93a40d700c27c45dffd5ac0de5061995638fa4e6034`,187636341bytes;157root Java/SDK tests,155actual-JAR-first app tests,41DOM checks and deployment static checks pass. These repeated executions are not additional distinct cases. The Docker development preview uses this same copied JAR and passed health/admin/source-UI/unauthenticated-denial HTTP verification. Credentials remain private.

首批 GBase 8c 配置已通过；8a/8s、分布式/其他兼容模式、安全/容量等仍待完成，保持实验状态。完整目标尚未完成。详见 / full scope and failed runs: [GBase8c evidence](/docs/zh/evidence/2026-11-15-gbase8c.html).


## 2026-11-15 Common validation cut / 共同屏障

Final JAR SHA256 `d50ff25fbfe3954b0134bd04d703b00f8f697262b8cec7d8ea0e488354e0e336`,187654135bytes.162root Java/SDK cases,160actual-JAR-first app cases,41DOM checks and deployment static checks pass. Native source lock/MVCC/metadata/deadline/SIGKILL and transactional-target quiescence passed LOCAL/H2 plus EXTERNAL PostgreSQL/MySQL/openGauss journal profiles, including a real unselected SQL-target outage and restored CDC. The full existing GBase 8c mixed fault case also passes on this runtime. This is not a row-diff/repair/cutover or UI acceptance claim.

共同屏障基础通过，不代表行级对账/修复已完成。完整范围、失败记录及边界见 / [Evidence](/docs/zh/evidence/2026-11-15-validation-barrier.html).


## 2026-11-15 SQL row comparison and CLI

Final JAR SHA256 `acdb9a58b77151e3c30ddfdcdb3587fd4680a503edc5d7585288ca0bbc05ea8c`,187694420bytes.183root Java/SDK cases (181app+2Classic SDK),181independent actual-JAR-first app cases,41DOM and deployment static checks pass. Complete native profiles passed LOCAL/H2 and external PostgreSQL/MySQL/openGauss journals:sealed source MVCC, negative-subsecond/keyless snapshot+CDC, actual target-scan-holder SIGKILL recovery, discarded partial target scans, comparison while the source is actually stopped, missing/extra/changed and wrong-occurrence detection, CLI and durable pause. Eight summary projections independently match expected counts. Destinations are MySQL8.4/PostgreSQL17; distributed GaussDB and other vendor reader profiles remain unaccepted. Reviewed repair, management jobs/UI and takeover/cutover remain pending. REAL mapping, negative-subsecond formatting and Set-order seal failures are retained. [Evidence](/docs/zh/evidence/2026-11-15-row-reconciliation.html).


## 2026-11-16 Managed validation jobs / 管理界面校验作业

Final JAR SHA256 `34a4675fe853e2976392d1909a9b45d551f0d939e9c82ae448988a6d7a93ce4b`,187705360bytes.187root Java/SDK cases (185app+2Classic SDK),185independent actual-JAR-first app cases,44DOM and deployment static checks pass. Native LOCAL/H2 and external PostgreSQL/MySQL/openGauss profiles all pass real HTTP/controller/Worker startup,request replay,SQL comparison,physical relation-lock cancellation,sealed-source retry,report/audit persistence across controller restart and durable pause. Eight managed summaries independently match expected counts and exact six-operation sequences. A fresh external MySQL journal stays absent during status reads,then initializes on Worker START. Final Docker preview and seven assets pass HTTP checks. Raw row details/repair,skip,cutover,HA/scale/vendor matrices remain unaccepted. [Evidence](/docs/zh/evidence/2026-11-16-managed-validation.html).

2026-11-16:ADMIN-only difference pages and raw historical values accepted across all four real journal profiles;191root/189actual-JAR-first/46DOM pass. Size,integrity,scope,audit and text-only rendering checks pass. Repair remains pending. [Evidence](/docs/zh/evidence/2026-11-16-difference-details.html).

2026-11-16:COMMON_CUT repair CLI passes the full four-journal native matrix against MySQL8.4/PostgreSQL17,including source-offline planning/repair,live drift refusal,real SQL rollback,commit-reply loss,child SIGKILL before/after commit,keyless identity restoration,receipt replay and unchanged CDC positions.200root/198actual-JAR-first/46DOM pass. Authenticated managed repair/dependency handling,failed-transaction compensation/skip,other vendor modes and full production acceptance remain pending. [Evidence](/docs/zh/evidence/2026-11-16-common-cut-repair.html).

2026-11-16:managed COMMON_CUT repair passes full LOCAL and focused external MySQL/PostgreSQL/openGauss journal profiles with real SQL/HTTP/Worker processes:review/hash/revision/grant checks,trigger/FK/metadata visibility refusal,relation-lock cancellation,source-offline retry,receipts and controller reopen.207root/205actual-JAR-first/49DOM pass. Failed-transaction compensation/skip,complete dependency plans,adoption/cutover and full HA/vendor/capacity remain pending. [Evidence](/docs/zh/evidence/2026-11-16-managed-repair.html).
