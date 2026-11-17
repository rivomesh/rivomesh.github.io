---
kind: docs
locale: zh
title: "11-17-execution-lifecycle · Preserved nonroot fixture failures"
sourcePath: docs/verification/2026-11-17-execution-lifecycle/attempt-nonroot/README.md
---

# Preserved nonroot fixture failures

Both runs used the finalaa17cf5b JAR. First: rejoining a SIGKILLed controller before its old lease expired correctly returnedNODE_ID_IN_USE; the fixture now waits on database-clock leases. Second: immediately validating after a Worker restart could race its journal claim; the unchanged validation guard rejectedVALIDATION_BARRIER_MOVED before a cut was sealed. The fixture now requires a newly written source transaction to reach actual targets before validating. It does not weaken/ignore guards or relabel failed operations. The final nonroot and MySQL profiles pass with these explicit preconditions. Worker initialization readiness remains a UI/diagnostic improvement; arbitrary barrier movement still requires inspection.
