---
kind: docs
locale: en
title: "Implementation plan"
sourcePath: docs/sdd/001-control-recovery-compatibility/plan.en.md
---

# Design boundaries,decisions and delivery order

RM-SDD-001 · v0.9 · 2026-11-17 · IMPLEMENTING: transaction skip and gap recovery

[Spec](/docs/en/sdd/spec.html) · [Tasks](/docs/en/sdd/tasks.html) · [Acceptance](/docs/en/sdd/acceptance.html) · [中文](/docs/zh/sdd/plan.html)

Current authority: [requirements.json](/files/docs/sdd/001-control-recovery-compatibility/requirements.json),[tasks](/docs/en/sdd/tasks.html) and [acceptance](/docs/en/sdd/acceptance.html). **13 DONE,30 PARTIAL,5 NEW;35 open**. [RC-05](/docs/en/sdd/design-checkpoint-recovery.html) and[RC-03](/docs/zh/evidence/baseline.html)passed bounded profiles;Bounded gap verification and compensation have passed. Bounded manual correction has passed. Distributed recovery jobs are next.

## Current baseline

Maintain the current first-release specification and [verification baseline](/docs/zh/evidence/baseline.html). Superseded candidate inventories, permanent previews and old-binary upgrade procedures are removed. Accepted scope and limitations remain explicit; historical tests do not certify new changes.

## Request traceability

| User item | SDD range | Incomplete items |
|---|---|---|
| 1 Unified cluster control | CP-01–CP-07 | 5 |
| 2 Persistent login | SE-01–SE-05 | 0 |
| 3 Skip and corrective data | RC-01–RC-10 | 5 |
| 4 Source versions/PG/Oracle | SO-01–SO-07 | 7 |
| 5 Five Java versions | JV-01–JV-04 | 4 |
| 6 Complete docs | DO-01–DO-05 | 5 |
| Preserved previous scope | LG-01–LG-10 | 10 |

Currentv0.9:48items total,13DONE,5NEW and30PARTIAL;35remain open. PARTIAL means foundations exist but the whole requirement is incomplete,not that accepted features must be rebuilt.

## Confirmed scope

Unified multi-node management must control remote tasks from any entry,not just aggregate local pages. Login survives reload with effective logout/revocation. Reviewed manual skip/corrective data are required while automatic recovery remains no-skip by default. MySQL5.7/8.0/8.2/8.4,PostgreSQL and Oracle sources are committed scope rather than optional future placeholders. Java8/11/17/21/25 require real runtime evidence. Complete bilingual scenarios/FAQ and all earlier destination,mapping,optional-storage,deployment and migration requirements remain.

## Proposed cluster architecture

Separate logical management entry,shared control authority,node agents/workers and source-journal/destination protocols. Control metadata,sessions and CDC journal are different concepts;they may share a suitable SQL instance in separate namespaces or use separate deployments. Standalone mode need not acquire an independent journal service.

Global node/task IDs,revisions and grants come from authoritative cluster state. Agents execute durable typed/idempotent commands bound to owner generation;local ProcessBuilder is no longer the sole execution channel. Remote interfaces do not expose arbitrary host shells. Distinguish accepted,queued,executing,confirmed,rejected,failed and unknown outcomes;timeouts do not prove a stop. Stale owners and delayed commands are fenced.

Report/plan/raw-event/secret locations need ownership and integrity references. Local-only logs/reports pin placement to a recoverable node/volume unless actual reachability is established;moving only a cursor is invalid. Standalone embedded state remains a profile;multiple controllers need verified shared authority/session semantics. Agent lifecycle is separated from console shutdown under an explicit continuation/pause policy.

Candidate entities are Cluster,Node (incarnation/heartbeat/capabilities/resources),Task (source/targets/revision/owner),Command (request/grants/expectations/result),Session,RecoveryPlan and ConsistencyGap. Final schemas/backends/protocols are follow-up designs,not existing APIs.

## Proposed login persistence

Preserve API tokens but exchange browser login for a revocable short-lived server session. Prefer a protected cookie inaccessible to page script with production HTTPS and CSRF/Origin checks rather than writing a long-lived administrator token to localStorage. [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html).

Restore session/grants before loading tasks;controllers share authority. Logout,disable,rotation and permission revocation invalidate appropriately. Bearer APIs remain compatible and identity conflict rules are explicit. Idle/absolute expiry,remembering across browser closure and OIDC are configurable policy decisions;this inventory does not invent a confirmed duration or mandatory two-person approval.

## Recovery semantics

| Action | Meaning | Progress/data boundary |
|---|---|---|
| Retry | Replay the original transaction | Resolve uncertain commit before more writes |
| Existing COMMON_CUT repair | Correct historical differences | Remain paused;old report retains differences |
| Pending failed-transaction compensation | Restore initial affected identity state | Preserve original event,occurrence IDs,PK moves and ordering;do not prematurely count source transaction as applied |
| Pending manual patch | Reviewed typed destination edits | No implicit source writes;review before/after/counts and refuse drift/dependency violations |
| Bounded destination skip | Omit one complete known transaction for selected targets | Native SKIP receipt plus gap ledger;coverage may advance while applied progress remains honest |
| Pending capture-range quarantine/exclusion | Separate plan before complete event formation | Identify every affected subscriber and retain raw logs;unprovable boundaries are refused with log/valid-source/rebaseline recovery alternatives |

Replica-like operation is a UX/recovery requirement,not a command-copy requirement. MySQL differentiates GTID and non-GTID skipping:[official guidance](https://dev.mysql.com/doc/refman/8.4/en/replication-administration-skip.html). Rivomesh needs its own audited heterogeneous receipt/gap protocol,not source empty-transaction injection,gtid_executed editing or a universal sql_replica_skip_counter wrapper.

Committed destinations with lagging journal ACK must recover acknowledgment,not compensate or invent an unapplied skip. Destination skip scope is independent;capture exclusion may affect all relevant targets and must declare that scope. Analytical/queue adapters require their own verified protocol rather than SQL transaction promises.

A proposed gap record links source/range,transaction/raw/normalized hashes,target scope,reason,actor/approval,original evidence,receipts and subsequent validation. Open,in-remediation,verified resolution and explicitly accepted loss are distinct;accepted loss is not equality. Final enums/transitions are pending design.

## Source and runtime profiles

| Source | Existing scope | Remaining |
|---|---|---|
| MySQL5.7 | Basic5.7.44 evidence | Current V3 objects/recovery/HA/runtime profile |
| MySQL8.0 | Historical8.0.46 V2/HA | Current V3/new recovery acceptance |
| MySQL8.2 | No dedicated complete evidence found | New profile,compatibility differences and native tests |
| MySQL8.4 | Representative V3/recovery | Broader auth/log/topology/target/JDK matrix |
| PostgreSQL | PLANNED source | Snapshot/LSN/slot,transactions,promotion;PG sink support is unrelated |
| Oracle | PLANNED source | Capture route/version/grants/distribution,SCN/redo/archive,types and recovery |

PG slot snapshot export binds baseline/stream position;recovery can resend events and needs dedup. Promotion depends on exact version and slot conditions:[logical decoding](https://www.postgresql.org/docs/18/logicaldecoding-explanation.html),[failover](https://www.postgresql.org/docs/18/logical-replication-failover.html). Oracle identity/incarnation cannot be reduced to one SCN number:[Oracle19 LogMiner fields](https://docs.oracle.com/en/database/oracle/oracle-database/19/refrn/DBA_LOGMNR_SESSION.html). These are design references,not implemented source claims.

Runtime evidence binds candidate SHA,actual JVM/architecture,driver,source profile,destination,journal,auth/TLS and workload. Each approved source profile crosses five JDKs for snapshot,CDC,restart and content checks. Four MySQL profiles plus one PG and one Oracle profile imply at least30source/JDK baseline combinations,not the total target,type,HA or security matrix. Show unrun,failed,experimental and unsupported separately.

## Proposed sequencing

| Milestone | Work | Exit |
|---|---|---|
| M0 this change | Requirements,gaps,tasks,acceptance,evidence baseline | 48traceable IDs and documentation checks |
| M1 | Session and shared-state contracts;fix reload persistence | SE-01/02/03 and standalone compatibility;storage abstraction remains extensible |
| M2 | Nodes,remote commands,grants/audit,control HA/session continuity | Two-node control,partition/stale-owner/controller-failure acceptance |
| M3 | Failed inspection,gap ledger,SQL-first skip/compensation/patches | Reviewed boundaries,refusals,receipt recovery,UI/docs;other adapters are not mislabeled supported |
| M4 | Four MySQL profiles and PG source | Candidate/runtime/object/recovery gates per profile |
| M5 | Oracle and more vendor/storage/runtime/deployment profiles | Native version/grants/data evidence with explicit PDB/RAC scope |
| M6 | Earlier backlog,cutover,live K8s,capacity/soak/release gates | Function,migration,bilingual docs and unambiguous evidence per requirement |

The user subsequently authorized implementation;this ordering is not a delivery-date promise. Common session/source contracts may progress independently;not every phase must be strictly serial.

## Open details without reopening confirmed scope

Control-store product/HA,agent enrollment/auth and standalone upgrade;session expiry/browser-closure/identity policy;exact initial PG versions/database-schema scope and slot failover;Oracle version/capture/CDB-PDB-RAC/storage/distribution;initial recovery profiles,large-event retention and safe capture-range exclusion;Linux architecture,liveK8s/CSI/vendor hardware and benchmark resources. These are profile/policy details,not reasons to ask again whether already-confirmed features are wanted. No universal TPS/RTO number is invented.

## Definition of done

A requirement closes only with linked design/task/API/UI,positive/refusal/duplicate/crash tests,state/config migration,bilingual docs and the same candidate artifact evidence. Build success is not connector acceptance;static YAML is not liveK8s;DOM/HTTP is not visual/accessibility acceptance. This inventory does not mark48runtime requirements implemented.
