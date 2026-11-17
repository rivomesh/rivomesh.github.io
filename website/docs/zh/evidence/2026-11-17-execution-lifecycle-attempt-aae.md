---
kind: docs
locale: zh
title: "11-17-execution-lifecycle · Intermediate role candidate with known admission races"
sourcePath: docs/verification/2026-11-17-execution-lifecycle/attempt-aae/README.md
---

# Intermediate role candidate with known admission races

SHA256 `aae849e314456bfd06c271b5ffa9aab2acd1db1e7a92de0cb22cc930cacd59b0` passed346app/actual-JAR tests,5x150controls and the initial PostgreSQL separated lifecycle. Two later regressions FAILED: cached Agent bindings could admit a task after role change; tasks accepted between controller construction/registration were not rechecked. These failures disqualify complete role-admission acceptance. The transaction fix belongs to finalaa17cf5b,not this candidate.
