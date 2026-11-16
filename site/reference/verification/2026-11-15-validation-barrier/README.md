---
sourcePath: docs/verification/2026-11-15-validation-barrier/README.md
---

# Common validation barrier / 共同校验屏障基础验收

2026-11-15. **This is a synchronization-cut foundation, not completed row reconciliation/repair/cutover or a new UI workflow.** [中文设计与边界](/reference/zh-CN/reconciliation-workflow.html) / [English](/reference/en/reconciliation-workflow.html). The full Rivomesh objective remains incomplete.

## Final accepted runtime

SHA256 `d50ff25fbfe3954b0134bd04d703b00f8f697262b8cec7d8ea0e488354e0e336`,187654135bytes. `package-final.log`:160application+2Classic SDK=162root Java/SDK cases pass,0failure/error/skip. `release-unit-final.log`,session63671 exit0:160app cases independently pass with the actual final JAR first. Repeated executions are not additional distinct scenarios. 41DOM cases and deployment static checks pass. The Docker preview is healthy, authenticates admin and uses this same copied JAR/source UI; credentials remain private under target/.

All production Java/assets remained frozen during native acceptance and final artifact gates. TODO unchanged SHA256 `0e77e9ea608a9fedd041851753dc6b59f462c49ee86151b750692bac7e6ad4f7`.

## Native acceptance

`native-local.log`,session17893 exit0, own project95049:MySQL8.4 source across sales/billing databases, PostgreSQL17.12 and a separate MySQL8.4 target, LOCAL/H2 journal. Every case uses the actual final fat JAR.

- Observe an actual source writer waiting for the global read lock, then confirm it commits after gate release while all table reads still use the earlier MVCC view.
- Observe actual DDL waiting for the pinned metadata lock, then completing after view close. Changed source schemas are rejected.
- Gate and read deadlines abort the view; partial cursor close aborts rather than draining an unbounded result or accepting a partial scan.
- SIGKILL a separate view-holder JVM with a blocked source writer; confirm the writer completes before the configured gate deadline.
- Source tables include keyless duplicate JSON, TIME and65digit DECIMAL across databases. The source gate's consistent data is read after later writes, rather than comparing the current changing source to a paused target.
- A MySQL peer target first pauses on a SQL CHECK error, then is actually stopped. The selected PostgreSQL target still reaches its captured/normalized/applied cut and acquires a physical epoch fence. Unselected targets are not presented as validated.
- New source writes proceed after release, the SQL target remains at the declared cut, old target epochs fail, and concurrent resume invalidates the certificate.
- Resuming captures later CDC; the peer is restarted, its constraint repaired, and the original failure retried. A second cut fences both SQL targets. Worker restart preserves the shared pause.
- Strict administrative target open refuses missing checkpoint metadata and does not recreate it.

`native-postgresql.log`, `native-mysql.log`, `native-gauss.log`:the same complete profile repeated with EXTERNAL PostgreSQL, separate MySQL and openGauss journals. Sequential matrix host session32599 exit0, own projects863/1226/338. The MySQL journal is a separate service from the intentionally stopped MySQL destination. These are four journal configurations, not a complete version/HA/security/capacity matrix. Native fixtures use cached mysql:8.4,postgres:17.12 and opengauss/opengauss-server:latest images from the declared compose file.

`gbase-regression.log`,session15080 exit0, own project97085:the existing actual MySQL8.4.13→PostgreSQL17.12+GBase8cV6 S1.3.0B19 PG profile passes its full snapshot/CDC/types/TIME/keyless/text-key/outage/worker-kill/SQL-repair/missing-table/fence case on this same final runtime.

All own test projects were cleaned; the separate development preview remains running. No unrelated containers, source GTIDs, business checkpoints, host sysctls or global compatibility settings were changed.

## Failed initial run

`cursor-close-failed.log`,session7594 exit1, own project91378, initial runtime SHA08061462edfc04df347bd8bcae70ac8d8074f74d5670695b03ba6b0c90385bd0,187653921bytes. Early cursor close intentionally aborted the connection but cleanup then exposed the driver's Socket-is-closed SQLException. The full run did not pass. Production now suppresses expected cleanup SQLExceptions only for this intentional incomplete-cursor abort; the view remains ineligible with SOURCE_VALIDATION_CURSOR_INCOMPLETE. The corrected final case and all journal profiles passed.

## Remaining scope

Persistent quota-controlled row staging, complete typed target comparison, differences/reports/repair receipts/UI, nonempty adoption and manual skip/compensation remain unimplemented. A certificate alone is not row equality or permission to cut over. MQ downstream validation and analytical visibility need their own protocols. Source PG/Oracle and vendor/version/topology/security/large-scale/soak matrices, live K8s/CSI/controller HA and the remaining full-platform requirements stay open. Native browser inventory is empty; no visual/accessibility acceptance claim.
