---
sourcePath: docs/en/rename-migration.md
---

# Rivomesh rename and existing-task migration

Updated: 2026-11-14. 中文：[更名迁移](/reference/zh-CN/rename-migration.html).

This change migrates project identity/build references without changing replication algorithms, v2 state formats, configuration fingerprints, or SQL-error handling.

## Names

| Object | New value |
|---|---|
| Project / root Maven artifactId | Rivomesh / `rivomesh` |
| Directory | `rivomesh`, alongside `canal` |
| Maven groupId / Java base package | `io.rivomesh` |
| Executable artifactId / entry point | `rivomesh-app` / `io.rivomesh.Main` |
| Relocated driver artifactId / JDBC class | `rivomesh-gaussdb-driver` / `io.rivomesh.gaussdb.jdbc.Driver` |
| Source module directories | Retain `sync-app` and `gaussdb-driver`; directory names need not equal artifactIds |

Technical naming does not establish domain/trademark ownership or Apache acceptance; review separately before public release.

## Existing installations

1. Stop every old service node for the task; do not mix driver-package versions on one task.
2. Back up configuration and business/management data as one recovery unit. Preserve jobId, logical clusterId, source database, target URL/schema, and metadata schema. Never delete state or clear business tables for a rename.
3. Change any explicit target driver to `io.rivomesh.gaussdb.jdbc.Driver`; omitting it selects the new default. Do not substitute the test PostgreSQL driver for the relocated Gauss driver.
4. Update working directories, classpaths, JAR paths, monitoring/log references to `sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar`. Recompile custom code using renamed entry/model classes.
5. Run check/status, verify existing state, then run. PAUSED remains paused; repair and resume rather than bypassing errors through renaming.

Moving the root does not update external file contents. Check relative paths against the new working directory. Private local.yml is not rewritten automatically; repository examples/defaults are updated.

## Recovery boundary

The rename introduces no multi-source/multi-target/new-journal state format. Those changes require separate migrations, compatibility checks, and rollback plans; package changes alone cannot make incompatible checkpoints reusable.

See [README](https://github.com/rivomesh/rivomesh/blob/main/README.md) and [validation](/reference/en/validation.html) for current operation, and [platform design](/reference/en/platform-design.html) for planned capabilities.
