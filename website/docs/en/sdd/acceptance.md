---
kind: docs
locale: en
title: "Acceptance matrix"
sourcePath: docs/sdd/001-control-recovery-compatibility/acceptance.en.md
---

# SDD acceptance matrix

RM-SDD-001 · 2026-11-16

These contracts track implementation acceptance. CP-01 and SE-01/02/03/04/05 accepted; CP-05 is partial and remaining scope stays open. Given a supported profile/authorization,when normal,error or interrupted operations occur,the outcomes below must hold. Include positive,refusal,duplicate and relevant restart/failover scenarios.

| ID | Requirement | Acceptance contract | Evidence state |
|---|---|---|---|
| AC-CP-01 | CP-01 | With two nodes,any console shows the same IDs,roles,versions/JDK/architecture,capacity,heartbeat age and ownership;stale/unreachable nodes are explicitly marked. | [PASS](/docs/zh/evidence/2026-11-16-node-registry.html) |
| AC-CP-02 | CP-02 | A task created/edited through A appears at B with the same global revision;IDs are unique within a cluster;independent sources remain isolated and standalone mode remains usable. | PARTIAL · [foundations](/docs/zh/evidence/2026-11-17-global-control-foundations.html) |
| AC-CP-03 | CP-03 | Any entry controls tasks on B;typed commands cover create/check/lifecycle/retry/validation/repair and carry request ID,revision and owner generation;duplicate delivery is idempotent and acceptance is distinct from execution. | PARTIAL · [foundations](/docs/zh/evidence/2026-11-17-global-control-foundations.html) |
| AC-CP-04 | CP-04 | Power loss,partition and stale-node return never permit dual writers;unconfirmed stops remain unknown/fenced;placement respects JDK,adapter,storage reachability and quotas;drain/move preserves progress. | NOT_RUN |
| AC-CP-05 | CP-05 | Revocation at A is enforced at B;remote actions correlate by request/task/node/plan;secrets are not returned to UI and agents receive only authorized task references. | PARTIAL · [shared-access](/docs/zh/evidence/2026-11-16-shared-access.html) |
| AC-CP-06 | CP-06 | UI filters node/task/destination status,lag,backlog,logs and errors with observation timestamps and bounded redacted log access. | NOT_RUN |
| AC-CP-07 | CP-07 | Another entry survives controller failure;accepted commands recover;existing workers continue safely under documented policy;replica count/shared files alone are insufficient. | NOT_RUN |
| AC-SE-01 | SE-01 | Reload/reopening the site restores an unexpired session and permissions without reentering the token;expired sessions return to login without unintended actions. | [PASS, single controller](/docs/zh/evidence/2026-11-16-browser-sessions.html) |
| AC-SE-02 | SE-02 | Idle/absolute expiry is configurable;logout,disable,rotation and revocation invalidate sessions as specified;tabs agree;remembering across browser closure is a separate configurable policy. | [PASS, single controller](/docs/zh/evidence/2026-11-16-browser-sessions.html) |
| AC-SE-03 | SE-03 | No readable long-lived browser credential;protected cookie/equivalent transport,HTTPS and HttpOnly/SameSite policy are verified;cookie-authenticated mutations enforce CSRF/Origin checks;session IDs never enter URLs/logs. | [PASS, single controller](/docs/zh/evidence/2026-11-16-browser-sessions.html) |
| AC-SE-04 | SE-04 | Login at A remains valid at B;controller restart/failover follows expiry/recovery policy;revocation propagates as specified without relying on sticky sessions to hide missing state. | DONE · [shared-access](/docs/zh/evidence/2026-11-16-shared-access.html) |
| AC-SE-05 | SE-05 | Existing API tokens work;conflicting cookie/header identities follow explicit rules;restoration rechecks grants and late responses cannot revive logout;messages are bilingual. | [PASS, single controller](/docs/zh/evidence/2026-11-16-browser-sessions.html) |
| AC-RC-01 | RC-01 | Distinguish source/read,decode,DDL/normalization,apply,ack and journal failures;UI offers only valid retry/compensation/skip/gap-recovery actions for that stage. | NOT_RUN |
| AC-RC-02 | RC-02 | Show source/transaction identity,event range,affected objects/destinations,raw/normalized hashes,before/after-image availability and checkpoints;bounded raw access is authorized and evidence is retained before action. | NOT_RUN |
| AC-RC-03 | RC-03 | For a known next failed transaction,ADMIN reviews destination scope/reason;cross-table events are not split;native SKIP receipt and safe progress commit locally and crash replay never skips another transaction. | NOT_RUN |
| AC-RC-04 | RC-04 | Provide a separate verified transaction/source-range quarantine/exclusion plan affecting all relevant subscriptions with original logs retained;unprovable boundaries are refused with log recovery,valid source or rebaseline alternatives;never fabricate successful application. | NOT_RUN |
| AC-RC-05 | RC-05 | If commit leads ACK,verify content and recover acknowledgment instead of compensating or declaring an unapplied skip;identity,generation,epoch,error/config/hash/checkpoint mismatches refuse action. | NOT_RUN |
| AC-RC-06 | RC-06 | Reconstruct initial affected identity state across repeated keys,PK moves,insert/delete chains,keyless occurrences,JSON/generated values;modify only reviewed scope;commit compensation/receipt atomically without rewriting the source transaction/GTID. | NOT_RUN |
| AC-RC-07 | RC-07 | UI offers typed insert/update/delete and import preview;precision,NULL,keys and occurrence IDs are validated;review before/after scope/counts;refuse drift and unsafe keyless bulk edits;no implicit source writes or dependency bypass. | NOT_RUN |
| AC-RC-08 | RC-08 | Track skipped transactions/ranges,destinations,reason,actor,hashes and original evidence;separate applied progress,safe coverage and running-with-gaps;only verification evidence closes a gap and accepted loss is not equality. | NOT_RUN |
| AC-RC-09 | RC-09 | Remote plans,approval,cancellation,receipts and evidence locations are traceable;controller/agent kill recovers the same request with idempotent commits/rollback;skip is not cutover approval. | NOT_RUN |
| AC-RC-10 | RC-10 | Declare recovery capability per adapter;SQL uses local transactions,analytical/queue adapters verified receipts/gap notifications;other subscriptions are not silently skipped and unresolved evidence is retained with backpressure/alerts. | NOT_RUN |
| AC-SO-01 | SO-01 | Each task declares source type,identity,namespace and version;GTID,LSN and SCN are not interchangeable;UI/preflight follow real capabilities and reject unsupported profiles. | NOT_RUN |
| AC-SO-02 | SO-02 | Pin patch/driver/log settings and verify snapshot-to-CDC,object capabilities,restart/promotion/log loss,supported DDL/recovery with explicit negative cases and independent evidence. | NOT_RUN |
| AC-SO-03 | SO-03 | Reverify current-release multi-database fan-out,types/generated columns,transactions,ASYNC/MGR,recovery/manual operations with explicit patch/topology scope. | NOT_RUN |
| AC-SO-04 | SO-04 | Provide reproducible8.2 environment,version/auth/status/binlog handling and a complete first sync/recovery matrix;string matching/JDBC connectivity alone is insufficient. | NOT_RUN |
| AC-SO-05 | SO-05 | Reverify supported current-release profiles and declare tagged/untagged GTID,anonymous events,row images,compression/partial-JSON capabilities or refusal;version labels are not blanket feature acceptance. | NOT_RUN |
| AC-SO-06 | SO-06 | Implement consistent snapshot/LSN handoff,slots/publications,ordering/replay,replica identity,types/DDL and recovery;verify WAL/slot loss/promotion per version;expose GUI/CLI/docs. | NOT_RUN |
| AC-SO-07 | SO-07 | Specify capture route,versions,privileges and driver distribution conditions;implement SCN snapshot,commit/rollback,redo/archive,DB identity/incarnation,checkpoint/replay;verify LOB,charset,PDB/RAC scope explicitly. | NOT_RUN |
| AC-JV-01 | JV-01 | The candidate controller/agent/worker actually starts on all five JDKs with real JVM version,artifact hash,architecture and dependencies recorded;Java8 class/driver requirements are verified. | NOT_RUN |
| AC-JV-02 | JV-02 | Each approved source profile crosses five JDKs for snapshot,CDC,restart and equality;record separate adapter/SDK/TLS/object/cluster/recovery gates and never label unrun combinations passed. | NOT_RUN |
| AC-JV-03 | JV-03 | Verify service loading,reflection/modules,auth/TLS/certificates,reconnect,precision and vendor minimum JDK;incompatible combinations are explicitly refused,not inferred from compilation. | NOT_RUN |
| AC-JV-04 | JV-04 | Provide five-JDK deployment profiles/placement constraints and verify command,event,state and rolling-upgrade compatibility;unsupported downgrade is refused with recovery guidance. | NOT_RUN |
| AC-DO-01 | DO-01 | Each requirement has stable ID,status,gap,dependencies,priority,acceptance and task;ZH/EN IDs match and changes preserve evidence scope. | NOT_RUN |
| AC-DO-02 | DO-02 | Provide runnable standalone/cluster examples for four deployment paths with stores,secrets/TLS,enrollment/drain,backup/restore/upgrades and local-storage boundaries;live K8s requires separate evidence. | NOT_RUN |
| AC-DO-03 | DO-03 | Each scenario states symptoms,cause,UI/API steps,positions,gaps,idempotency/undo limits across promotion,log loss,SQL/ack,node/storage,session and manual recovery. | NOT_RUN |
| AC-DO-04 | DO-04 | Document configuration,grants,codes,request/command/plan versions,source coordinates,consistency and source/sink/JDK profiles with examples/evidence;schema changes update both languages. | NOT_RUN |
| AC-DO-05 | DO-05 | Check links,examples,APIs and bilingual coverage;completion links candidate hash/native evidence;DOM is not visual,static YAML is not live deployment,and builds are not adapter acceptance. | NOT_RUN |
| AC-LG-01 | LG-01 | Record sync/recovery/manual capabilities by product,version,mode,distribution/index/driver/JDK;commercial distributed hardware is separately accepted,not inferred from PG protocol connectivity. | NOT_RUN |
| AC-LG-02 | LG-02 | Implement adoption/difference planning,constraint restoration,final source cut,write handoff and failback conditions;dual-write/bidirectional conflict policy is separately specified. | NOT_RUN |
| AC-LG-03 | LG-03 | Verify visibility,dedup/batch receipts,restart,old-backup,cluster and gaps per product without claiming ordinary SQL cross-table atomicity. | NOT_RUN |
| AC-LG-04 | LG-04 | Each queue verifies lost confirmations,election,durable receipts,resource loss,consumer dedup/backlog and skip-gap protocol with honest delivery/consumption boundaries. | NOT_RUN |
| AC-LG-05 | LG-05 | Local mode documents durable volume/pinning/disk-loss limits;external/shared modes are accepted per capability;move verifies logs,evidence,reports and secrets,not just cursors;independent journal infrastructure is not mandatory for every deployment. | NOT_RUN |
| AC-LG-06 | LG-06 | Verify upgrade/scale,pod/node failure,RWO/CSI remount,secret rotation and stale-owner fencing on a real cluster with published configuration/evidence. | NOT_RUN |
| AC-LG-07 | LG-07 | Bound memory/disk for large transactions/catalogs/slow sinks and publish multi-run hardware/workload results without linear extrapolation or count-only correctness. | NOT_RUN |
| AC-LG-08 | LG-08 | Preserve schema history/plans and identity keys;publish v2/v3/new control-gap schema migrations,backup/rollback or safe refusal with product-specific limits. | NOT_RUN |
| AC-LG-09 | LG-09 | Provide authorized report/receipt search,retention and active-file protection;real browsers verify cluster/session/confirmation/recovery/pagination and accessibility. | NOT_RUN |
| AC-LG-10 | LG-10 | Verify external identity/revocation,external audit and distribution conditions;complete license/NOTICE/SBOM/contribution docs without claiming Apache affiliation or trademark rights. | NOT_RUN |

## Cross-cutting scenarios and evidence

| Scenario | Minimum checks |
|---|---|
| Two-node control | A controls B,owner failure/return,partition/unknown outcomes and requery,duplicate routing,global revocation |
| Persistent login | Reload,new tab,expiry,logout,cross-node route,controller reopen,grant changes,CSRF/identity conflicts;restoration triggers no task action |
| Destination skip | Multi-table transaction,explicit destinations,duplicates,receipt-before-ACK loss,stale generation/error,already-committed transaction,audit outage |
| Capture/decode failure | Proven/unproven boundaries,known/unknown impact,unreadable/purged logs,wrong source,all affected subscribers and refusal alternatives |
| Patch/compensation | Repeated keys,PK moves,insert/delete chains,keyless occurrence identity,NULL/JSON/time/numerics,schema/dependencies,drift,cancel/kill/retry |
| Gap ledger | Running remains visibly gapped,coverage is not applied;verification closes remediation while accepted loss stays distinct |
| Deployment/upgrade | Linux/Docker/Helm/nativeK8s,persistence/local disk,node/controller/volume faults,secret/config rotation,state migration or explicit refusal |

### Existing source/runtime evidence,not new tests

| Source profile | Java8 | Java11/17/21/25 | Whole current platform |
|---|---|---|---|
| MySQL5.7 | Basic historical5.7.44 | Dedicated source-version evidence missing | PARTIAL |
| MySQL8.0 | Historical8.0.46 V2/HA | Dedicated source-version evidence missing | PARTIAL;current V3/recovery needed |
| MySQL8.2 | No dedicated complete evidence found | Same | NEW |
| MySQL8.4 | Current representative SQL/repair paths | Older one-table SQL benchmark only | PARTIAL |
| PostgreSQL source | Not implemented | Not implemented | NEW;sink evidence is unrelated |
| Oracle source | Not implemented | Not implemented | NEW |

Each approved profile crosses five JDKs;targets,auth/TLS,types,journals,topology and faults are separate dimensions. Historical entries cannot become blanket support. Initial exact PG/Oracle versions/modes remain design decisions.

### Release evidence fields

Requirement/task/case IDs,candidate SHA,node/agent protocol,actual product/version/mode,JVM/architecture,driver,storage/durability,scope/workload,before/after coordinates,receipt/gap IDs,positive/refusal/duplicate/interruption outcomes,raw-log location,redaction,manual links and residual limits. Distinguish NOT_RUN,PASSED,FAILED,EXPERIMENTAL,UNSUPPORTED;having a script is not PASSED.
