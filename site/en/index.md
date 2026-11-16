# RivoMesh documentation

RivoMesh is a Java-based data synchronization project with resumable snapshots, MySQL CDC, multi-target delivery and a web console. The current version is **0.1.0-SNAPSHOT, a pre-release preview**.

MySQL is the implemented source. PostgreSQL and Oracle source adapters remain planned. Target availability depends on the exact product, version and deployment profile; do not interpret a catalog entry as complete production certification.

## Operating manuals

- [Console and deployment](/reference/en/console-and-deployment)
- [V3 pipelines: multi-database and multi-target](/reference/en/pipeline-v3)
- [Configuration revisions](/reference/en/configuration-editor)
- [Messaging targets](/reference/en/messaging-v3) · [ActiveMQ Classic](/reference/en/classic-v3)
- [ClickHouse](/reference/en/clickhouse-v3) · [Doris](/reference/en/doris-v3) · [Hive](/reference/en/hive-v3)
- [OceanBase](/reference/en/oceanbase-v3) · [DM](/reference/en/dm-v3) · [Kingbase](/reference/en/kingbase-v3) · [GBase 8c](/reference/en/gbase8c-v3)
- [GaussDB index policy](/reference/en/gaussdb-index-policy)
- [Browser sessions](/reference/en/browser-sessions)
- [Accounts](/reference/en/account-management) · [Task authorization](/reference/en/task-authorization) · [Security audit](/reference/en/security-audit)
- [Reconciliation workflow](/reference/en/reconciliation-workflow) · [Managed validation](/reference/en/managed-validation)
- [COMMON_CUT repair](/reference/en/common-cut-repair) · [Managed repair](/reference/en/managed-repair)
- [Recovery](/reference/en/recovery) · [Validation](/reference/en/validation) · [Performance](/reference/en/performance)
- [Development preview](/reference/en/development-preview) · [Rename migration](/reference/en/rename-migration)

## Design and delivery plans

[Platform design](/reference/en/platform-design) · [Requirements and decisions](/reference/en/requirements-and-decisions) · [Implementation status](/reference/en/implementation-status)

[SDD specification](/reference/sdd/001-control-recovery-compatibility/spec.en) · [Plan](/reference/sdd/001-control-recovery-compatibility/plan.en) · [Tasks](/reference/sdd/001-control-recovery-compatibility/tasks.en) · [Acceptance](/reference/sdd/001-control-recovery-compatibility/acceptance.en)

All 48 requirements in RM-SDD-001 are unfinished. PARTIAL denotes an existing foundation, not completion. Priorities and proposed milestones are not release dates. Earlier manuals preserve historical batch notes; consult the latest dedicated manual and SDD baseline for current scope.

[Chinese home](/) · [Website repository](https://github.com/zhangjiayin/rivomesh.github.io)
