---
kind: docs
locale: zh
title: "11-17-global-configuration · Global configuration/history workflows / 全局配置工作流"
sourcePath: docs/verification/2026-11-17-global-configuration/README.md
---

# Global configuration/history workflows / 全局配置工作流

2026-11-17 · SHA256: `565c2b6d34f74c130a2df70a7c3e4566c6e0ae858de34461c65fcb408de20851` ·187897453bytes.

Frozen artifact `target/release-evidence/global-configuration-final.jar`; [manifest](/files/docs/verification/2026-11-17-global-configuration/candidate-manifest.json) binds production JAR, compiled fixture snapshot and source hashes. Native test mains were added and test-compiled after packaging without production changes; [fixture compile](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-configuration/fixture-compile.log) records that separate step. Later owner runtime/resource/public-entry changes are outside this candidate.

| Check | Result | Evidence |
|---|---|---|
| Java8 Maven app package |316 executed;zero failures/errors/skips; conditional integration classes explicitly excluded | [build](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-configuration/app-build.log) |
| Actual-JAR-first app |316 pass;zero skips | [unit](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-configuration/release-unit.log) |
| PostgreSQL17 native configuration | cross-entry shared secret references, owner preview, atomic proposal/command, active only after owner commit, replay, verified history/restore, rejection preserving active | [PG](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-configuration/postgresql.log) |
| MySQL8.4 native configuration | same configuration protocol using actual packaged classes | [MySQL](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-configuration/mysql.log) |
| Java8/11/17/21/25 controls |111cases each;555executions;256MiB;15classes in manifest | [runtime](/files/docs/verification/2026-11-17-global-configuration/runtime-manifest.json) |
| Actual CDC/managed repair regression | MySQL8.4 to PostgreSQL17 + MySQL, LOCAL/H2 journal; typed/keyless differences, reviewed repairs, lost replies, SIGKILL, cancellation, source outage/retry and controller reopen | [CDC](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-configuration/cdc-repair.log) |
| Artifact | Java8 bytecode, resources and drivers accepted | [artifact](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-global-configuration/artifact.log) |

Desired and active configuration versions are distinct. Rejected proposals keep the old active pointer and owner configuration. History has an authenticated parent chain and logical ordering; shared secret references and history tokens work across entries. Restore makes a new version and reuses the original client receipt on replay. Read-only previews bind the global revision while owner invocation checks the actual local revision. Requests cannot reuse configuration/action IDs across ledgers; missing catalog rows do not silently become replacement tasks.

Global configuration native fixtures use real SQL and TaskService with fixture Workers in one JVM; they do not prove public two-JVM routing, actual business CDC under global mode or automatic Worker relocation. The separate actual CDC regression uses the existing LOCAL public controller profile. Five-JDK controls are not a full connector/source/target/TLS matrix. Shared IAM acceptance remains [A1](/docs/zh/evidence/2026-11-16-shared-access.html); initial global foundations [1e47](/docs/zh/evidence/2026-11-17-global-control-foundations.html).

CP-02/03 remain PARTIAL. Public global runtime, startup migration, resource admission and complete UI/HTTP acceptance are newer work. Temporary fixture containers/volumes were removed; no permanent preview was started. Seven SDK artifacts remain reused after unchanged hash/source verification, without a fresh full-reactor claim.

Reproduce native configuration with the exact frozen files:

```sh
python3 tests/owner-control-native.py --product POSTGRESQL --fixture configuration --artifact target/release-evidence/global-configuration-final.jar --test-classes target/release-evidence/global-configuration-tests-565c2b6d34f7 --release-manifest target/release-evidence/global-configuration-manifest.json
python3 tests/owner-control-native.py --product MYSQL --fixture configuration --artifact target/release-evidence/global-configuration-final.jar --test-classes target/release-evidence/global-configuration-tests-565c2b6d34f7 --release-manifest target/release-evidence/global-configuration-manifest.json
python3 tests/control-runtime.py --artifact target/release-evidence/global-configuration-final.jar --test-classes target/release-evidence/global-configuration-tests-565c2b6d34f7 --suite global --heap-mib 256 --output target/control-runtime-global-config
RIVOMESH_MANAGED_ONLY=true RIVOMESH_VALIDATION_WAIT_SECONDS=300 RIVOMESH_RELEASE_MANIFEST=target/release-evidence/global-configuration-manifest.json RIVOMESH_TEST_ARTIFACT=target/release-evidence/global-configuration-final.jar bash tests/validation-barrier-run.sh
```

[中文](/docs/zh/reference/global-control.html) · [English](/docs/en/reference/global-control.html).
