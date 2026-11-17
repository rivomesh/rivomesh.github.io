---
kind: docs
locale: zh
title: "11-16-shared-access · Reproduction"
sourcePath: docs/verification/2026-11-16-shared-access/commands.md
---

# Reproduction

Use the frozen artifact and test/source snapshots identified by candidate-manifest.json. The application build was bounded to Maven512MiB/Surefire256MiB after verifying and installing unchanged SDK artifacts; sdk-cache-install.log records that step. Preserve the dependency cache for reproducibility. Do not substitute later working-tree classes for frozen classes.

```sh
npm --prefix tests/ui test
python3 tests/verify-artifact.py target/release-evidence/shared-access-journal-final.jar
python3 tests/node-registry-native.py --product POSTGRESQL --shared-access --tls --artifact target/release-evidence/shared-access-journal-final.jar
python3 tests/node-registry-native.py --product MYSQL --shared-access --artifact target/release-evidence/shared-access-journal-final.jar
python3 tests/control-runtime.py --artifact target/release-evidence/shared-access-journal-final.jar --test-classes target/release-evidence/shared-access-journal-tests-a1ec34fc060b --suite extended --heap-mib 256 --output target/control-runtime-journal
RIVOMESH_MANAGED_ONLY=true RIVOMESH_VALIDATION_WAIT_SECONDS=300 RIVOMESH_RELEASE_MANIFEST=target/release-evidence/shared-access-journal-manifest.json RIVOMESH_TEST_ARTIFACT=target/release-evidence/shared-access-journal-final.jar bash tests/validation-barrier-run.sh
python3 tests/deployment-check.py --image <temporary-image-containing-the-frozen-artifact>
python3 tests/sdd-check.py
```

Native fixtures allocate temporary ports and remove their own resources. Docker smoke used the production Java8 nonroot runtime layout with the frozen JAR; its temporary image was deleted after acceptance. Five-JDK results cover the nine classes listed in runtime-manifest.json, not all source/destination/driver/TLS combinations. The300s fixture deadline accommodates host load; it does not change production lease/fencing settings or define a performance SLA.
