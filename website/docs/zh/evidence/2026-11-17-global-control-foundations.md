---
kind: docs
locale: zh
title: "11-17-global-control-foundations · Global task/control foundations / 全局控制基础验收"
sourcePath: docs/verification/2026-11-17-global-control-foundations/README.md
---

# Global task/control foundations / 全局控制基础验收

2026-11-17 · SHA256: `1e474ad174f9425ac83af2642c5ec707ddb7435ba5ee5e898003c92a5d612019` ·187891446bytes.

Frozen artifact: `target/release-evidence/owner-control-foundations-final.jar`. [Manifest](/files/docs/verification/2026-11-17-global-control-foundations/candidate-manifest.json) binds the JAR, compiled fixture classes and historical source manifest. Later configuration/history work is outside this candidate.

| Check | Result | Evidence |
|---|---|---|
| Java8 application Maven package |332 discovered,307 executed,25 conditional integration tests skipped;zero failures/errors | [build](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-control-foundations/app-build.log) |
| Actual-JAR-first application |307 executed,zero skips/failures | [unit](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-control-foundations/release-unit.log) |
| PostgreSQL17 actual JAR first | encrypted commands, agent/lease/directory binding, real TaskService lifecycle/receipt recovery, revocation, global observations/pages and expiring queries | [PG](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-control-foundations/postgresql.log) |
| MySQL8.4 actual JAR first | same control protocol, InnoDB/binary-collation metadata, SQL indexes | [MySQL](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-control-foundations/mysql.log) |
| Artifact | bytecode/resources/drivers accepted | [artifact](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-control-foundations/artifact.log) |
| SDK reuse | seven unchanged artifact hashes and17SDK/parent source/POM hashes verified against accepted baseline; no fresh full-reactor reshading claim | [SDK](/files/docs/verification/2026-11-17-global-control-foundations/sdk-cache-manifest.json) |

CP-02 and CP-03 become PARTIAL, not DONE. GlobalTaskStore/GlobalTaskPlane, AgentDirectory, DurableCommands/OwnerExecution, GlobalTaskViews and OwnerQueries are internal components with real SQL acceptance. The public console remains LOCAL; runtime wiring, global startup/migration, cross-node resource admission and full HTTP/UI/business CDC acceptance remain open. Node grants refer to task owners, allowing an authorized owner-A user to use entry-B without granting B as an execution owner.

Native fixtures run real PostgreSQL/MySQL and actual packaged TaskService, but use fixture Workers in one JVM. They do not establish two independent controller JVMs/HTTP, actual business CDC, Worker failover, liveK8s/CSI, hardware capacity or all source/target/JDK combinations. Temporary fixture containers/volumes were removed. No permanent preview was started.

The current development tree adds configuration history/active-version workflows after this freeze; its focused results must not be relabeled as proof for this hash. Shared-session/actual CDC baseline remains [A1](/docs/zh/evidence/2026-11-16-shared-access.html).

Reproduce with the frozen files:

```sh
python3 tests/verify-artifact.py target/release-evidence/owner-control-foundations-final.jar
python3 tests/owner-control-native.py --product POSTGRESQL --artifact target/release-evidence/owner-control-foundations-final.jar --test-classes target/release-evidence/owner-control-tests-1e474ad174f9 --release-manifest target/release-evidence/owner-control-manifest.json
python3 tests/owner-control-native.py --product MYSQL --artifact target/release-evidence/owner-control-foundations-final.jar --test-classes target/release-evidence/owner-control-tests-1e474ad174f9 --release-manifest target/release-evidence/owner-control-manifest.json
```

[中文状态与FAQ](/docs/zh/reference/global-control.html) · [English](/docs/en/reference/global-control.html).
