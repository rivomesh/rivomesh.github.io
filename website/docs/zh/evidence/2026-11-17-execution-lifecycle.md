---
kind: docs
locale: zh
title: "11-17-execution-lifecycle · Independent execution lifecycle / 独立执行生命周期"
sourcePath: docs/verification/2026-11-17-execution-lifecycle/README.md
---

# Independent execution lifecycle / 独立执行生命周期

2026-11-17 · SHA256 `aa17cf5b6d9c21e302af818c5f48ff7c46bbb32d3a532ab1fa0491abe43403bf` ·187926437bytes.

[Candidate manifest](/files/docs/verification/2026-11-17-execution-lifecycle/candidate-manifest.json) binds the frozen app JAR,compiled tests and source hashes. App-only Java8 build reuses seven unchanged SDK artifacts;no fresh reactor/full-adapter claim.

| Check | Result | Evidence |
|---|---|---|
| Application package/actual JAR first |348pass each,zero failures/errors/skips;conditional native integration classes explicitly excluded from Maven | [build](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/app-build.log),[unit](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/release-unit.log) |
| Five JREs |Java8/11/17/21/25,152cases each,760executions,arm64/256MiB;fixture Workers | [manifest](/files/docs/verification/2026-11-17-execution-lifecycle/runtime-manifest.json) |
| UI |76DOM cases,including role labels/controller filtering/Agent pagination;JAR resources match | [UI](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/ui.log),[artifact](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/artifact.log) |
| PostgreSQL17 control + production runtime image |two controller JVMs plus probe-only Agent/real Worker,allUID10001/private named volumes;MySQL8.4 two-source-database CDC to PostgreSQL17/MySQL8.4 | [lifecycle](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/nonroot-postgresql-lifecycle.log),[manifest](/files/docs/verification/2026-11-17-execution-lifecycle/nonroot-lifecycle-manifest.json) |
| MySQL8.4 control |same actual separated business/fault/maintenance workflow,plain JRE containers | [lifecycle](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/mysql-lifecycle.log),[manifest](/files/docs/verification/2026-11-17-execution-lifecycle/mysql-lifecycle-manifest.json) |
| PostgreSQL/MySQL transactional role admission |stale binding rollback,late ownership blocking registration,three SQL row-lock races with both valid outcomes;protocol3 live/expired refusal,STOPPED upgrade to4,old mode refusal | [PG](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/postgresql-admission.log),[MySQL](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/mysql-admission.log) |
| Deployment |Helm/native role profiles and negative guards;Docker Compose three independent volumes;temporary nonroot default-image auth/UI/private-file/idempotency/volume restart smoke | [deployment](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/deployment.log),[Docker](https://github.com/rivomesh/rivomesh/blob/main/docs/verification/2026-11-17-execution-lifecycle/docker.log) |

CP-07 acceptance is the explicit separated profile:kill managementA whileB executes a remote command;kill all management containers while the SAME Worker PID continues actual insert/update/delete delivery;rejoin management on the original authority;stop the dedicated control database beyond registration lease expiry while LOCAL/H2 journal CDC continues and management/readiness refuse control;restore store/registration without restarting Worker. Agent kill,offline STOP before old RUNNING restoration and original private-journal catchup are verified. A STOP durably accepted atA completes under the original request whileA remains dead,observed throughB. Cross-entry configuration/history/restore,actual validation/raw differences/reviewed SQL repair and explicit resume also pass.

Role/config preflight is not the final admission authority. Committing commands recheck owner role under the node-row lock;controller registration rechecks shared ownership under that same serialization boundary. Native races produce eitherCREATED/CONTROLLER_OWNS_TASKS orOWNER_ROLE_REQUIRED/REGISTERED,never both success. Failed creation rolls back task/config/request/counters. Fixture Workers in those transaction tests do not replace the separate real business lifecycle runs.

DefaultCOMBINED/protocol3 remains compatible and coupled. Protocol4 requires explicitseparateExecution;old members must stop normally before upgrade. Pure management nodes have no Worker capacity and cannot hide owned tasks using an empty directory. Agents expose GET health/readiness only;administration routes return404. Agent identity remains nodeId plus original private directory. This is not cross-Agent failover or tenant/OS secret isolation.

Accepted data-plane profile:Java8,one fixed Agent,LOCAL/H2 journal,MySQL8.4 source,two mapped databases,PostgreSQL17/MySQL8.4 business targets,and dedicated PostgreSQL17 or MySQL8.4 control storage. Five-JRE controls are not a full source/target/SDK/TLS matrix. External-journal/shared-failure variants,automatic relocation/fencing,K8s/CSI,large capacity,other adapters and failed-transaction skip/patch/gaps remain separately open. Lifecycle HTTP is loopback/plain HTTP;earlier shared-IAM HTTPS evidence is [b2b9a078](/docs/zh/evidence/2026-11-17-global-maintenance.html).

Intermediate [role-admission races](/docs/zh/evidence/2026-11-17-execution-lifecycle-attempt-aae.html) and [nonroot fixture failures](/docs/zh/evidence/2026-11-17-execution-lifecycle-attempt-nonroot.html) remain failed evidence. Current lifecycle scripts are hash-bound in final manifests;native Java helper hash appears in both SQL logs. The tested runtime image uses the production final Docker stage with the exact frozen JAR,not a fresh multistage Maven build. Image JAR hash/UID are [recorded](/files/docs/verification/2026-11-17-execution-lifecycle/image-manifest.json). All temporary containers/volumes and the image were removed;no permanent preview.

本轮关闭CP-07的上述已验收分离档案，不关闭CP-04自动执行接管或整个集群/连接器矩阵。配置恢复后需确认新Worker真正追平，再开始校验；保护性拒绝不会自动伪装成校验成功。

[中文操作手册](/docs/zh/reference/execution-lifecycle.html) · [English operations](/docs/en/reference/execution-lifecycle.html).
