---
kind: docs
locale: en
title: "Connector, runtime & API compatibility"
sourcePath: docs/en/compatibility.md
---

# Connector, runtime and API profiles

[中文](/docs/zh/reference/compatibility.html)

Choose a profile by source version and topology, target product and mode, then Java runtime. Each row records the scope with native evidence or identifies work still pending. Check the exact candidate hash in the [verification baseline](/docs/zh/evidence/baseline.html) and [machine-readable manifests](/files/docs/verification/baseline.json) before selecting a build for acceptance.

## Sources and coordinates

| Configuration | Native scope | Configuration and recovery |
|---|---|---|
| `MYSQL` 5.7.44 | Temurin 21 standalone and three-member single-primary Group Replication to MySQL and PostgreSQL. Async GTID promotion and missing binlog refusal passed with a PostgreSQL target. | [Pipeline configuration](/docs/en/reference/pipeline-v3.html), [missing-log recovery](/docs/en/reference/capture-recovery.html) |
| `MYSQL` 8.0.46 | Temurin 21 standalone and three-member single-primary Group Replication to both SQL targets. Async GTID promotion passed with a PostgreSQL target. | [Pipeline configuration](/docs/en/reference/pipeline-v3.html), [recovery runbook](/docs/en/reference/reconciliation-workflow.html) |
| `MYSQL` 8.2.0 | Temurin 21 standalone and three-member single-primary Group Replication to both SQL targets. Async GTID promotion passed with a PostgreSQL target. | [Version-specific test commands](/docs/en/reference/pipeline-v3.html#mysql-820-source-regression) |
| `MYSQL` 8.4.13 | Temurin 21 standalone, async GTID promotion and three-member single-primary Group Replication to both SQL targets. Binlog admission and the former group primary returning read-only have separate native proofs. | [8.4 binlog profile](/docs/en/reference/pipeline-v3.html#mysql-84-binlog-profile) |
| `POSTGRESQL` 17.12 | Experimental Temurin 21 profile. Synchronized-slot promotion resumes automatically and an earlier timeline is refused. Common-cut verification is pending. | [Source guide](/docs/en/reference/postgresql-source.html), [task example](/files/config/postgresql-source-v3.yml) |
| `POSTGRESQL` 18.7 | Experimental Temurin 21 profile. PostgreSQL 17.12 materializes published stored generated columns as ordinary columns. | [Source guide and publication](/docs/en/reference/postgresql-source.html) |
| `ORACLE` 26ai Free 23.26.4.0.0 | Temurin 21 with a separately supplied Oracle JDBC driver. Single-PDB Flashback and single-thread archived CDC to PostgreSQL. RAC and source promotion remain pending. | [Probe privileges and recovery](/docs/en/reference/oracle-source.html), [V3 example](/files/config/oracle-source-v3.yml) |

MySQL uses the logical source cluster ID and untagged GTID sets. PostgreSQL uses the logical source ID plus system ID, timeline, slot and LSN. The Oracle probe uses DBID, resetlogs SCN, PDB GUID and SCN. `SourcePosition.formatVersion` is currently 1 and is interpreted by `sourceType`. Compare coordinates within the original authority and protocol. The [multi-database sample](/files/config/pipeline-v3.yml) uses `formatVersion: 3`, `source.clusterId`, `databases` and an explicit `mappings` object per target. Use independent configurations for separate MySQL clusters.

## Targets and consistency

| Target identifiers | Scope and delivery contract | Manual |
|---|---|---|
| `MYSQL`, `POSTGRESQL` | MySQL 8.4 and PostgreSQL 17.12 native transactional targets with business writes and checkpoint in one commit. | [Relational pipeline](/docs/en/reference/pipeline-v3.html) |
| `GAUSS` | openGauss 7.0.0-RC3 native transactional profile. Commercial distributed GaussDB constraints, GSI behavior and deployment acceptance are pending. | [Gauss index policy and takeover](/docs/en/reference/gaussdb-index-policy.html) |
| `DM`, `KINGBASE`, `GBASE_8C` | The first archived native transactional profiles used Java 8. Consult each guide for the exact server mode, driver, field conversions and recovery checks. | [DM](/docs/en/reference/dm-v3.html), [Kingbase](/docs/en/reference/kingbase-v3.html), [GBase 8c](/docs/en/reference/gbase8c-v3.html) |
| `GBASE_8A`, `GBASE_8S` | Planned separate products. | [Product status](/docs/en/reference/implementation-status.html) |
| `OCEANBASE` | The archived CE 4.3.5.6 MySQL-mode profile passed native transactions, snapshot, CDC, restart and SQL recovery on Java 8. Oracle mode and clusters remain pending. | [OceanBase](/docs/en/reference/oceanbase-v3.html) |
| `CLICKHOUSE`, `DORIS`, `HIVE` | First native analytical profiles. Versioned materialization and receipts, with visibility and replay rules defined per engine. | [ClickHouse](/docs/en/reference/clickhouse-v3.html), [Doris](/docs/en/reference/doris-v3.html), [Hive](/docs/en/reference/hive-v3.html) |
| `KAFKA`, `PULSAR`, `RABBITMQ`, `ROCKETMQ`, `ACTIVEMQ_CLASSIC`, `ACTIVEMQ_ARTEMIS`, `REDIS_STREAMS`, `NATS_JETSTREAM` | Bounded broker profiles with confirmed at-least-once publishing. Deduplicate stable event IDs and track consumer completion separately. | [Messaging](/docs/en/reference/messaging-v3.html), [ActiveMQ Classic](/docs/en/reference/classic-v3.html) |

The V3 wizard reads `GET /api/capabilities` for source availability and limits destinations to the selected engine’s supported products. PostgreSQL and Oracle source forms preserve their separate version, source identity, namespaces and credentials. For each planned or experimental deployment, check the product manual's topology, authorization, retention and backup scope.

## Release runtime

**Eclipse Temurin 21 LTS is the sole supported build and runtime.** The release uses Java 21 class files. Controller, Agent and Worker processes use Temurin 21 on Linux, Docker and Kubernetes. Record the actual JVM version, architecture and artifact SHA in each native run. Use the matching Temurin 21 fixture to verify a new source, destination, journal or recovery profile. [Reproduction commands](/docs/en/reference/performance.html)

Each result in the source and destination tables applies to its original candidate and environment. Earlier runtime experiments and profiles such as `fiveJdkProcesses`, `postgresqlSourceRuntimeMatrix` and `postgresqlStoredGenerated` retain their original artifact hashes and reproduction commands in the archive. [Verification manifests](/files/docs/verification/baseline.json) · [Fixed historical snapshot](https://github.com/rivomesh/rivomesh/blob/419945c98f197bd6cc1c6cc3e75e9c6a4bb3188c/docs/verification/baseline.json)

## Management requests

Use Bearer credentials for CLI or an HttpOnly browser session. Browser writes supply the configured Origin and `X-CSRF-Token`. VIEWER reads task-scoped status, OPERATOR can issue routine commands within its grants, and ADMIN can configure, inspect sensitive row evidence and authorize data repair. [Browser sessions](/docs/en/reference/browser-sessions.html) · [Grants](/docs/en/reference/task-authorization.html)

| Endpoint family | Request and result |
|---|---|
| `/api/session`, `/api/session/logout`, `/api/nodes`, `/api/tasks` | Identity and scope, node/owner observation and task pagination. Global creation includes `ownerNodeId`. [Console API](/docs/en/reference/console-and-deployment.html) |
| `/api/tasks/{id}/configuration` and `/api/tasks/{id}/actions` | Mutations bind to the current `expectedRevision` and original `X-Request-ID`. Local create returns 201 and local configuration update returns 200. Global mutations and action admission return 202. Follow the persisted operation receipt. [Configuration](/docs/en/reference/configuration-editor.html) · [Command lifecycle](/docs/en/reference/execution-lifecycle.html) |
| `/api/tasks/{id}/capture-recovery`, `/api/tasks/{id}/capture-exclusions`, `/api/tasks/{id}/failure-evidence` | Read the retained source failure generation and the authorized target evidence. [Source review](/docs/en/reference/capture-recovery.html) · [Transaction evidence](/docs/en/reference/failure-review.html) |
| `/api/tasks/{id}/recovery-plans`, `/api/tasks/{id}/gaps`, `/api/tasks/{id}/gap-verifications`, `/api/tasks/{id}/corrections`, `/api/tasks/{id}/validations` | Inspect evidence and immutable plan references, then submit the matching action and generation. [Skip](/docs/en/reference/transaction-skip.html) · [Verification](/docs/en/reference/gap-verification.html) · [Correction](/docs/en/reference/manual-correction.html) · [Managed repair](/docs/en/reference/managed-repair.html) |
| `/api/accounts`, `/api/audit` | ADMIN account directory and authorized audit reads. [Accounts](/docs/en/reference/account-management.html) · [Audit](/docs/en/reference/security-audit.html) |

For example:

```sh
curl --fail-with-body -X POST "$RIVOMESH_ORIGIN/api/tasks/orders/actions" \
  -H "Authorization: Bearer $RIVOMESH_TOKEN" \
  -H "X-Request-ID: orders-stop-001" -H 'Content-Type: application/json' \
  -d '{"action":"STOP","expectedRevision":"replace-with-current-revision"}'
```

Use the revision from `GET /api/tasks/orders`. A repeated request ID reuses the same committed command identity with matching content. Retry uncertain delivery under that ID and reconcile its receipt. Plan IDs, hashes, report IDs, command receipts and pipeline/subscription error generations remain tied to the reviewed source, target and configuration. The [recovery runbook](/docs/en/reference/reconciliation-workflow.html) shows payloads and completion conditions.

A 400 response indicates invalid input, 401 missing or invalid credentials, 403 missing permission or rejected browser authority, and 404 an absent or inaccessible task. A 409 response requires inspecting the returned conflict code and refreshing the revision or generation. A 503 response indicates unavailable shared authority or audit persistence. Resume with the same request ID only if retrying the same action and payload. [Global control](/docs/en/reference/global-control.html)

## Upgrade boundaries

Record the artifact hash, profile, active configuration version and last confirmed checkpoint before changing JDKs, drivers or deployment settings. Quiesce operations and review destination receipts, journal retention and every persistent store before restoring or changing a topology. Follow the [first-release baseline](/docs/en/reference/first-release.html), [deployment guide](/docs/en/reference/console-and-deployment.html) and [cutover runbook](/docs/en/reference/reconciliation-workflow.html). Update both language versions and their configuration or API example when a field or profile changes.
