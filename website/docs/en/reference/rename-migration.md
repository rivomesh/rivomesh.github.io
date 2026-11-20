---
kind: docs
locale: en
title: "Rename migration"
sourcePath: docs/en/rename-migration.md
---

# Rivomesh rename and existing-task migration

Updated: 2026-11-17. 中文：[更名迁移](/docs/zh/reference/rename-migration.html).

The Java base package and Maven groupId are now `io.github.rivomesh`. Entry points, reflective loading, relocated drivers, tests and deployment scripts use that namespace. Rebuild every module; do not reuse transport SDK JARs or compiled directories from the previous namespace. The initial public repository is &lt;https://github.com/rivomesh/rivomesh>.

Historical scripts, source manifests, logs and checksums under `docs/verification/` retain their original package names and belong to their historical candidates. They do not certify the renamed build. See [implementation status](/docs/en/reference/implementation-status.html) for current recovery evidence and outstanding compatibility profiles.

This change migrates project identity/build references without changing replication algorithms, v2 state formats, configuration fingerprints, or SQL-error handling.

## Names

| Object | New value |
|---|---|
| Project / root Maven artifactId | Rivomesh / `rivomesh` |
| Directory | `rivomesh`, alongside `canal` |
| Maven groupId / Java base package | `io.github.rivomesh` |
| Executable artifactId / entry point | `rivomesh-app` / `io.github.rivomesh.Main` |
| Relocated driver artifactId / JDBC class | `rivomesh-gaussdb-driver` / `io.github.rivomesh.gaussdb.jdbc.Driver` |
| Source module directories | Retain `sync-app` and `gaussdb-driver`; directory names need not equal artifactIds |

Technical naming does not establish domain/trademark ownership or Apache acceptance; review separately before public release.

## Existing installations

1. Stop every old service node for the task; do not mix driver-package versions on one task.
2. Back up configuration and business/management data as one recovery unit. Preserve jobId, logical clusterId, source database, target URL/schema, and metadata schema. Never delete state or clear business tables for a rename.
3. Change any explicit target driver to `io.github.rivomesh.gaussdb.jdbc.Driver`; omitting it selects the new default. Do not substitute the test PostgreSQL driver for the relocated Gauss driver.
4. Update working directories, classpaths, JAR paths, monitoring/log references to `sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar`. Recompile custom code using renamed entry/model classes.
5. Run check/status, verify existing state, then run. PAUSED remains paused; repair and resume rather than bypassing errors through renaming.

Moving the root does not update external file contents. Check relative paths against the new working directory. Private local.yml is not rewritten automatically; repository examples/defaults are updated.

## Recovery boundary

The rename introduces no multi-source/multi-target/new-journal state format. Those changes require separate migrations, compatibility checks, and rollback plans; package changes alone cannot make incompatible checkpoints reusable.

See [README](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/README.md) and [validation](/docs/en/start/verification.html) for current operation, and [platform design](/docs/en/start/architecture.html) for planned capabilities.
