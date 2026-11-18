---
kind: docs
locale: en
title: "CP-07: management and execution lifecycle separation (separated profile accepted)"
sourcePath: docs/sdd/001-control-recovery-compatibility/design-execution-lifecycle.en.md
---

# CP-07: management and execution lifecycle separation (separated profile accepted)

Protocol4 implements independent CONTROLLER/AGENT and compatible COMBINED profiles.The declared LOCAL-journal profile completes CP-07 acceptance.Combined mode still owns HTTP and local Workers in one process;container termination affects its Workers.Only the explicit separated profile provides the tested independent lifecycle.Automatic execution takeover and the complete matrix remain separate.

## Responsibilities

Provide explicit controller, execution-agent and compatible combined profiles. Controllers serve authorized APIs/sessions/configuration and submit queries without restoring local Workers. Agents retain the fixed-owner private directory, execute durable commands, publish observations and answer typed reads. Their probe endpoint must not expose administration APIs. Combined mode preserves the existing single-deployment experience.

Roles describe responsibility, not tenant isolation. Agents remain in the trusted control domain with documented control-store/key/native-journal access. Workers still filter controller credentials. Adding a role string does not establish least-secret or OS isolation.

## Identity and upgrades

Stable nodeId plus original private-directory UUID remain authoritative. Controllers cannot be execution owners; an old Agent binding cannot allow new tasks after a node changes to controller-only. Roles/execution capability must participate in the shared membership protocol so old members cannot bypass admission. Define mixed-version refusal, graceful-stop prerequisites, directory restoration, coordinated backup and rollback limits.

Splitting an existing combined node preserves owner/checkpoints/targets/reports. Its directory belongs only to an Agent keeping the original nodeId. A controller-only node must refuse an existing execution directory with tasks. An empty directory does not authorize deleting historical authority.

## Fault semantics

Controller exit/SIGKILL leaves independent Agent/Workers running when the selected journal/lease/target protocol permits it; other entries continue observation and durable admission. Losing every controller does not imply STOP. Agent exit still requires explicit stop/unknown/original-owner recovery rules. Automatic relocation and stale-Worker fencing remain CP-04.

Control-store failure never falls back to local mutation. Continued CDC depends on native journal/fencing and requires actual tests. Heartbeat expiry does not prove Worker termination. Probes, close ordering and deadlines must not launch unobserved Workers.

## Minimum acceptance

Two controller JVMs plus an independent Agent/Worker and real SQL business data: create through A for the Agent, query/control through B; kill A while CDC continues; lose every controller while verifying the declared data-plane policy; restore management with identical task/positions/reports. Revocation and control-store outages still reject invalid commands. Agent exit/kill/original-directory reopen, wrong roles/empty directories/old members need positive and negative cases. Document Linux/Docker/Helm/native process/storage profiles; live Kubernetes/CSI acceptance is separate.

[中文](/docs/zh/sdd/design-execution-lifecycle.html) · [Current global control](/docs/en/reference/global-control.html)

2026-11-17: protocol4 implementation and declared LOCAL-journal lifecycle accepted. [Evidence](/docs/zh/evidence/baseline.html). Current deployment instructions and remaining limits are in the operations guide.
