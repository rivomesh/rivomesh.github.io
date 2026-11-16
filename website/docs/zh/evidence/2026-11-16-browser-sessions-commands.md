---
kind: docs
locale: zh
title: "11-16-browser-sessions · Reproduction commands"
sourcePath: docs/verification/2026-11-16-browser-sessions/commands.md
---

# Reproduction commands

Run from the repository root. Maven and acceptance use a frozen candidate; do not edit application code or UI while they run. These commands exclude separately invoked native integration fixtures. Docker preview updates retain configured accounts and task state.

```sh
caffeinate -i docker run --rm -v "$PWD:/project" \
  -v /tmp/rivomesh-container-maven-cache:/root/.m2/repository \
  -w /project maven:3.9-eclipse-temurin-8 \
  mvn -B -s build/settings.xml '-Dtest=!**/*IntegrationTest' \
  -Dsurefire.failIfNoSpecifiedTests=false package

python3 tests/verify-artifact.py

caffeinate -i docker run --rm -v "$PWD:/project" -w /project \
  maven:3.9-eclipse-temurin-8 java -Xmx256m \
  -cp /project/sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar:/project/sync-app/target/test-classes:/project/target/tools/junit-platform-console-standalone-1.11.0.jar \
  org.junit.platform.console.ConsoleLauncher execute --disable-banner --fail-if-no-tests \
  --scan-classpath=/project/sync-app/target/test-classes \
  '--exclude-classname=.*IntegrationTest' \
  --reports-dir=/project/target/browser-sessions-release-unit

npm --prefix tests/ui test
caffeinate -i python3 tests/browser-sessions-tls.py
caffeinate -i python3 tests/browser-sessions-runtime.py
python3 tests/deployment-check.py
python3 tools/dev-preview.py update
python3 tests/development-preview-check.py
python3 tests/sdd-check.py
```

The standalone JUnit runner is the existing local tool at `target/tools/junit-platform-console-standalone-1.11.0.jar`. The session-runtime script records real JVM versions, image IDs and architecture and selects only BrowserSessionsTest. It does not claim a complete source/target/runtime compatibility matrix. TLS acceptance creates and removes only its own fixture container/certificate/state.
