---
sourcePath: docs/en/development-preview.md
---

# Docker development preview

The preview uses its own Compose project `rivomesh-dev-preview`, private state and loopback address &lt;http://127.0.0.1:18088&gt;.

```sh
python3 tools/dev-preview.py start
python3 tools/dev-preview.py status
python3 tools/dev-preview.py credentials
```

The account is `admin`. Its access token is stored in the owner-only `target/development-preview/credentials.json`; enter the token in the login form. The current authentication flow does not require a separate username field. Never commit this file.

UI resources are mounted directly from `sync-app/src/main/resources/console`; refresh after edits. Responses disable caching. Backend and JDBC updates use a copied complete application JAR, isolated from Maven's output. After a successful backend build, deploy it with:

```sh
python3 tools/dev-preview.py update
```

The helper validates/copies the JAR, records its SHA-256, recreates only the preview container and checks health plus administrator authentication. UI and backend may temporarily represent different development stages. The capability catalog distinguishes experimental/planned adapters. This preview does not imply full product or scenario acceptance. Configuration/data formats may change during development and restarts briefly interrupt access.

State persists under `target/development-preview/state`. Updates retain it; removing the entire `target` directory also removes preview state and credentials. To stop without deleting data:

```sh
python3 tools/dev-preview.py stop
```

`restart: unless-stopped` restarts a previously running instance when Docker Desktop returns. An explicitly stopped instance needs `start`. Use `host.docker.internal` to reach host databases from this container, not `127.0.0.1`. Source MySQL still requires GTID and ROW/FULL configuration; check a task before starting it.

[中文](/reference/zh-CN/development-preview.html)


Temporary acceptance containers are removed after use rather than retained for reuse. The live development console and currently running builds/tests stay available. Cleanup is scoped to this project; it does not globally prune other services.
