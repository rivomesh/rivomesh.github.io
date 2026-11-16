---
kind: docs
locale: en
title: "Task inventory"
sourcePath: docs/sdd/001-control-recovery-compatibility/tasks.en.md
---

# SDD task backlog

RM-SDD-001 · 2026-11-16

Every task requires design/implementation,positive/negative/crash tests,bilingual docs and candidate evidence. The registry and four session tasks are accepted;43tasks remain open. See [session evidence](/docs/zh/evidence/2026-11-16-browser-sessions.html). Dependencies guide implementation,not a requirement to block common infrastructure on every vendor profile.

## Unified cluster control

- [x] T-CP-01 · Global node registry and state · P0 · Depends on: none
  Deliver: With two nodes,any console shows the same IDs,roles,versions/JDK/architecture,capacity,heartbeat age and ownership;stale/unreachable nodes are explicitly marked.
  Acceptance: AC-CP-01
- [ ] T-CP-02 · Global task/configuration authority · P0 · Depends on: CP-01
  Deliver: A task created/edited through A appears at B with the same global revision;IDs are unique within a cluster;independent sources remain isolated and standalone mode remains usable.
  Acceptance: AC-CP-02
- [ ] T-CP-03 · Durable cross-node command routing · P0 · Depends on: CP-02
  Deliver: Any entry controls tasks on B;typed commands cover create/check/lifecycle/retry/validation/repair and carry request ID,revision and owner generation;duplicate delivery is idempotent and acceptance is distinct from execution.
  Acceptance: AC-CP-03
- [ ] T-CP-04 · Failover,fencing and placement · P0 · Depends on: CP-03, JV-01, LG-05
  Deliver: Power loss,partition and stale-node return never permit dual writers;unconfirmed stops remain unknown/fenced;placement respects JDK,adapter,storage reachability and quotas;drain/move preserves progress.
  Acceptance: AC-CP-04
- [ ] T-CP-05 · Shared authorization,audit and secret references · P0 · Depends on: CP-02
  Deliver: Revocation at A is enforced at B;remote actions correlate by request/task/node/plan;secrets are not returned to UI and agents receive only authorized task references.
  Acceptance: AC-CP-05
- [ ] T-CP-06 · Cluster logs,metrics and diagnostics · P1 · Depends on: CP-01, CP-03, CP-05
  Deliver: UI filters node/task/destination status,lag,backlog,logs and errors with observation timestamps and bounded redacted log access.
  Acceptance: AC-CP-06
- [ ] T-CP-07 · Control-plane HA and worker independence · P0 · Depends on: CP-03, CP-05, SE-04
  Deliver: Another entry survives controller failure;accepted commands recover;existing workers continue safely under documented policy;replica count/shared files alone are insufficient.
  Acceptance: AC-CP-07
## Persistent login

- [x] T-SE-01 · Session survives page reload · P0 · Depends on: none
  Deliver: Reload/reopening the site restores an unexpired session and permissions without reentering the token;expired sessions return to login without unintended actions.
  Acceptance: AC-SE-01
- [x] T-SE-02 · Session expiry,logout and revocation · P0 · Depends on: SE-01
  Deliver: Idle/absolute expiry is configurable;logout,disable,rotation and revocation invalidate sessions as specified;tabs agree;remembering across browser closure is a separate configurable policy.
  Acceptance: AC-SE-02
- [x] T-SE-03 · Secure session transport and CSRF protection · P0 · Depends on: SE-01
  Deliver: No readable long-lived browser credential;protected cookie/equivalent transport,HTTPS and HttpOnly/SameSite policy are verified;cookie-authenticated mutations enforce CSRF/Origin checks;session IDs never enter URLs/logs.
  Acceptance: AC-SE-03
- [ ] T-SE-04 · Session continuity across controllers · P0 · Depends on: SE-02, SE-03, CP-02
  Deliver: Login at A remains valid at B;controller restart/failover follows expiry/recovery policy;revocation propagates as specified without relying on sticky sessions to hide missing state.
  Acceptance: AC-SE-04
- [x] T-SE-05 · CLI/API compatibility and identity conflicts · P1 · Depends on: SE-03, CP-05
  Deliver: Existing API tokens work;conflicting cookie/header identities follow explicit rules;restoration rechecks grants and late responses cannot revive logout;messages are bilingual.
  Acceptance: AC-SE-05
## Manual recovery,skip and corrective data

- [ ] T-RC-01 · Phase-aware fault classification · P0 · Depends on: none
  Deliver: Distinguish source/read,decode,DDL/normalization,apply,ack and journal failures;UI offers only valid retry/compensation/skip/gap-recovery actions for that stage.
  Acceptance: AC-RC-01
- [ ] T-RC-02 · Failed-transaction inspection and evidence retention · P0 · Depends on: RC-01, CP-05
  Deliver: Show source/transaction identity,event range,affected objects/destinations,raw/normalized hashes,before/after-image availability and checkpoints;bounded raw access is authorized and evidence is retained before action.
  Acceptance: AC-RC-02
- [ ] T-RC-03 · Skip a complete destination transaction · P0 · Depends on: RC-02, RC-05, RC-08
  Deliver: For a known next failed transaction,ADMIN reviews destination scope/reason;cross-table events are not split;native SKIP receipt and safe progress commit locally and crash replay never skips another transaction.
  Acceptance: AC-RC-03
- [ ] T-RC-04 · Controlled capture/decode gap recovery · P0 · Depends on: RC-01, RC-02, RC-08, SO-01
  Deliver: Provide a separate verified transaction/source-range quarantine/exclusion plan affecting all relevant subscriptions with original logs retained;unprovable boundaries are refused with log recovery,valid source or rebaseline alternatives;never fabricate successful application.
  Acceptance: AC-RC-04
- [ ] T-RC-05 · Uncertain commit and checkpoint reconciliation · P0 · Depends on: RC-02
  Deliver: If commit leads ACK,verify content and recover acknowledgment instead of compensating or declaring an unapplied skip;identity,generation,epoch,error/config/hash/checkpoint mismatches refuse action.
  Acceptance: AC-RC-05
- [ ] T-RC-06 · Failed-transaction before-image compensation · P0 · Depends on: RC-02, RC-05
  Deliver: Reconstruct initial affected identity state across repeated keys,PK moves,insert/delete chains,keyless occurrences,JSON/generated values;modify only reviewed scope;commit compensation/receipt atomically without rewriting the source transaction/GTID.
  Acceptance: AC-RC-06
- [ ] T-RC-07 · Guided manual corrective data entry · P0 · Depends on: RC-02, RC-05, RC-06
  Deliver: UI offers typed insert/update/delete and import preview;precision,NULL,keys and occurrence IDs are validated;review before/after scope/counts;refuse drift and unsafe keyless bulk edits;no implicit source writes or dependency bypass.
  Acceptance: AC-RC-07
- [ ] T-RC-08 · Consistency-gap ledger and honest watermarks · P0 · Depends on: RC-02
  Deliver: Track skipped transactions/ranges,destinations,reason,actor,hashes and original evidence;separate applied progress,safe coverage and running-with-gaps;only verification evidence closes a gap and accepted loss is not equality.
  Acceptance: AC-RC-08
- [ ] T-RC-09 · Durable distributed recovery jobs · P0 · Depends on: CP-03, RC-03, RC-06, RC-07
  Deliver: Remote plans,approval,cancellation,receipts and evidence locations are traceable;controller/agent kill recovers the same request with idempotent commits/rollback;skip is not cutover approval.
  Acceptance: AC-RC-09
- [ ] T-RC-10 · Destination-specific recovery and retention · P1 · Depends on: RC-08, LG-03, LG-04
  Deliver: Declare recovery capability per adapter;SQL uses local transactions,analytical/queue adapters verified receipts/gap notifications;other subscriptions are not silently skipped and unresolved evidence is retained with backpressure/alerts.
  Acceptance: AC-RC-10
## Source compatibility

- [ ] T-SO-01 · Source protocol and capability configuration · P0 · Depends on: none
  Deliver: Each task declares source type,identity,namespace and version;GTID,LSN and SCN are not interchangeable;UI/preflight follow real capabilities and reject unsupported profiles.
  Acceptance: AC-SO-01
- [ ] T-SO-02 · MySQL5.7 supported profile · P1 · Depends on: SO-01
  Deliver: Pin patch/driver/log settings and verify snapshot-to-CDC,object capabilities,restart/promotion/log loss,supported DDL/recovery with explicit negative cases and independent evidence.
  Acceptance: AC-SO-02
- [ ] T-SO-03 · MySQL8.0 current V3 acceptance · P1 · Depends on: SO-01
  Deliver: Reverify current-release multi-database fan-out,types/generated columns,transactions,ASYNC/MGR,recovery/manual operations with explicit patch/topology scope.
  Acceptance: AC-SO-03
- [ ] T-SO-04 · MySQL8.2 compatibility and acceptance · P1 · Depends on: SO-01
  Deliver: Provide reproducible8.2 environment,version/auth/status/binlog handling and a complete first sync/recovery matrix;string matching/JDBC connectivity alone is insufficient.
  Acceptance: AC-SO-04
- [ ] T-SO-05 · MySQL8.4 expanded compatibility · P1 · Depends on: SO-01
  Deliver: Reverify supported current-release profiles and declare tagged/untagged GTID,anonymous events,row images,compression/partial-JSON capabilities or refusal;version labels are not blanket feature acceptance.
  Acceptance: AC-SO-05
- [ ] T-SO-06 · PostgreSQL source adapter · P1 · Depends on: SO-01
  Deliver: Implement consistent snapshot/LSN handoff,slots/publications,ordering/replay,replica identity,types/DDL and recovery;verify WAL/slot loss/promotion per version;expose GUI/CLI/docs.
  Acceptance: AC-SO-06
- [ ] T-SO-07 · Oracle source adapter · P1 · Depends on: SO-01
  Deliver: Specify capture route,versions,privileges and driver distribution conditions;implement SCN snapshot,commit/rollback,redo/archive,DB identity/incarnation,checkpoint/replay;verify LOB,charset,PDB/RAC scope explicitly.
  Acceptance: AC-SO-07
## Java runtime compatibility

- [ ] T-JV-01 · Java8/11/17/21/25 runnable releases · P0 · Depends on: none
  Deliver: The candidate controller/agent/worker actually starts on all five JDKs with real JVM version,artifact hash,architecture and dependencies recorded;Java8 class/driver requirements are verified.
  Acceptance: AC-JV-01
- [ ] T-JV-02 · Cross-JDK source/sink/recovery matrix · P1 · Depends on: JV-01, SO-02, SO-03, SO-04, SO-05, SO-06, SO-07
  Deliver: Each approved source profile crosses five JDKs for snapshot,CDC,restart and equality;record separate adapter/SDK/TLS/object/cluster/recovery gates and never label unrun combinations passed.
  Acceptance: AC-JV-02
- [ ] T-JV-03 · Driver isolation,dependencies and TLS compatibility · P1 · Depends on: JV-01
  Deliver: Verify service loading,reflection/modules,auth/TLS/certificates,reconnect,precision and vendor minimum JDK;incompatible combinations are explicitly refused,not inferred from compilation.
  Acceptance: AC-JV-03
- [ ] T-JV-04 · Multi-JDK deployment and mixed-version upgrades · P1 · Depends on: CP-04, JV-02, JV-03, LG-08
  Deliver: Provide five-JDK deployment profiles/placement constraints and verify command,event,state and rolling-upgrade compatibility;unsupported downgrade is refused with recovery guidance.
  Acceptance: AC-JV-04
## Complete documentation

- [ ] T-DO-01 · Bilingual traceable SDD baseline · P0 · Depends on: none
  Deliver: Each requirement has stable ID,status,gap,dependencies,priority,acceptance and task;ZH/EN IDs match and changes preserve evidence scope.
  Acceptance: AC-DO-01
- [ ] T-DO-02 · Deployment and cluster operations docs · P1 · Depends on: CP-07, SE-04, JV-04, LG-05, LG-06
  Deliver: Provide runnable standalone/cluster examples for four deployment paths with stores,secrets/TLS,enrollment/drain,backup/restore/upgrades and local-storage boundaries;live K8s requires separate evidence.
  Acceptance: AC-DO-02
- [ ] T-DO-03 · Recovery scenarios and FAQ · P1 · Depends on: RC-09, RC-10, SE-05
  Deliver: Each scenario states symptoms,cause,UI/API steps,positions,gaps,idempotency/undo limits across promotion,log loss,SQL/ack,node/storage,session and manual recovery.
  Acceptance: AC-DO-03
- [ ] T-DO-04 · Configuration/API/compatibility and upgrade docs · P1 · Depends on: SO-01, JV-02, CP-03
  Deliver: Document configuration,grants,codes,request/command/plan versions,source coordinates,consistency and source/sink/JDK profiles with examples/evidence;schema changes update both languages.
  Acceptance: AC-DO-04
- [ ] T-DO-05 · Documentation and evidence release gates · P1 · Depends on: DO-01, DO-02, DO-03, DO-04, LG-09
  Deliver: Check links,examples,APIs and bilingual coverage;completion links candidate hash/native evidence;DOM is not visual,static YAML is not live deployment,and builds are not adapter acceptance.
  Acceptance: AC-DO-05
## Preserved earlier scope

- [ ] T-LG-01 · Domestic transactional database matrix · P1 · Depends on: JV-01
  Deliver: Record sync/recovery/manual capabilities by product,version,mode,distribution/index/driver/JDK;commercial distributed hardware is separately accepted,not inferred from PG protocol connectivity.
  Acceptance: AC-LG-01
- [ ] T-LG-02 · Nonempty adoption,constraints,cutover/failback · P1 · Depends on: RC-09, SO-01
  Deliver: Implement adoption/difference planning,constraint restoration,final source cut,write handoff and failback conditions;dual-write/bidirectional conflict policy is separately specified.
  Acceptance: AC-LG-02
- [ ] T-LG-03 · ClickHouse/Doris/Hive production profiles · P1 · Depends on: JV-01
  Deliver: Verify visibility,dedup/batch receipts,restart,old-backup,cluster and gaps per product without claiming ordinary SQL cross-table atomicity.
  Acceptance: AC-LG-03
- [ ] T-LG-04 · Queue cluster and recovery profiles · P1 · Depends on: JV-01
  Deliver: Each queue verifies lost confirmations,election,durable receipts,resource loss,consumer dedup/backlog and skip-gap protocol with honest delivery/consumption boundaries.
  Acceptance: AC-LG-04
- [ ] T-LG-05 · Optional storage and cross-node reachability · P0 · Depends on: CP-02
  Deliver: Local mode documents durable volume/pinning/disk-loss limits;external/shared modes are accepted per capability;move verifies logs,evidence,reports and secrets,not just cursors;independent journal infrastructure is not mandatory for every deployment.
  Acceptance: AC-LG-05
- [ ] T-LG-06 · Live K8s/CSI and node-fault acceptance · P1 · Depends on: CP-04, CP-07, LG-05
  Deliver: Verify upgrade/scale,pod/node failure,RWO/CSI remount,secret rotation and stale-owner fencing on a real cluster with published configuration/evidence.
  Acceptance: AC-LG-06
- [ ] T-LG-07 · Large catalogs,transactions and hardware standards · P1 · Depends on: JV-02, LG-05
  Deliver: Bound memory/disk for large transactions/catalogs/slow sinks and publish multi-run hardware/workload results without linear extrapolation or count-only correctness.
  Acceptance: AC-LG-07
- [ ] T-LG-08 · Historical DDL,types,indexes and state migration · P1 · Depends on: SO-01
  Deliver: Preserve schema history/plans and identity keys;publish v2/v3/new control-gap schema migrations,backup/rollback or safe refusal with product-specific limits.
  Acceptance: AC-LG-08
- [ ] T-LG-09 · Report retention and real-browser acceptance · P1 · Depends on: CP-06, SE-05, RC-09
  Deliver: Provide authorized report/receipt search,retention and active-file protection;real browsers verify cluster/session/confirmation/recovery/pagination and accessibility.
  Acceptance: AC-LG-09
- [ ] T-LG-10 · External identity,immutable audit and Apache preparation · P2 · Depends on: CP-05, SE-05
  Deliver: Verify external identity/revocation,external audit and distribution conditions;complete license/NOTICE/SBOM/contribution docs without claiming Apache affiliation or trademark rights.
  Acceptance: AC-LG-10
