---
kind: docs
locale: en
title: "First-release configuration"
sourcePath: docs/en/first-release.md
---

# First-release configuration baseline

No first release has been published. In-place upgrades between development candidates,old package aliases and automatic control-mode migration are unsupported. Internal format numbers are not released versions.

Choose the control store,access mode,roles,keys and persistent directories before first deployment. Enable full managed recovery consistently across all members:

```yaml
cluster:
  sharedAccess: true
  sharedTasks: true
  recoveryReview: true
  recoveryCommit: true
  recoverySkip: true
```

Namespaces are created directly in the configured mode. Mismatches refuse immediately,even after every member stops. Existing development environments require a separately assessed new test baseline;deleting code history does not authorize clearing business data or moving only cursors.

Linux/Docker use the same role configuration and independent persistent directories. Helm overlays controller/Agent values with`values-recovery-skip.yaml`;manual Kubernetes can reference`rivomesh-skip-*.yaml`. Examples do not establish liveK8s/CSI acceptance.

Restart recovery,leases/epochs,authorization revocation and damaged/stale-backup refusal are current behavior rather than obsolete development compatibility.

Replace superseded development implementations directly. Do not retain branches,configuration aliases or upgrade tests solely for old prerelease candidates. Documents describe current behavior;duplicate evidence/build snapshots converge on one [verification baseline](/docs/zh/evidence/baseline.html). Keep tests that validate current data correctness,recovery and security boundaries. Remove temporary containers,obsolete project images and intermediate builds once unused.

V2/V3 execution consolidation is a separate pending batch. See[current status](/docs/en/reference/implementation-status.html)and[SDD](/docs/en/sdd/spec.html);cleanup does not close unrelated feature gaps.
