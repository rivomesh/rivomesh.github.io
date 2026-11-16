---
kind: docs
locale: en
title: "Node registry"
sourcePath: docs/en/node-registry.md
---

# Shared node registry and heartbeat

中文：[节点目录](/docs/zh/reference/node-registry.html). Contract: [CP-01](/docs/en/sdd/design-control-store.html). This feature shares observations; task/configuration commands, accounts, audit and browser sessions remain controller-local. Global remote control/failover are unfinished.

ADMIN opens **Node registry**. Standalone mode shows one node with an ID retained in private `node-id`. With a shared control database, all endpoints in the same clusterId read the same directory. VIEWER/OPERATOR retain existing task grants without global registry access.

Cards show release SHA/version, real JVM/architecture/CPU/heap, configured task/running capacities, registration epoch, database observation time, heartbeat/expiry and task IDs/Worker state/observation time. HEALTHY means a valid heartbeat lease, not healthy data destinations. STALE means expiry; STOPPED means graceful deregistration committed. Query failure clears old healthy cards instead of presenting cached success.

Task lists are observations, not global configuration/scheduling authority. Task pages/actions remain local. Do not copy/start configurations elsewhere merely because a node is STALE. CDC/target leases still govern execution; registry leases cannot authorize Worker takeover. Remote commands, data/secret/report reachability, shared permissions/audit and controller HA require later acceptance.

## Linux and Docker

Use independent local control, task and report directories and unique stable nodeIds. Sharing controller.json/audit H2 directories or a PVC is not a shared control protocol. See [platform-cluster.yml](/files/config/platform-cluster.yml).

```yaml
cluster:
  id: migration-registry
  nodeId: ${RIVOMESH_NODE_ID}
  driver: org.postgresql.Driver
  url: jdbc:postgresql://control-db:5432/rivomesh_control
  username: ${RIVOMESH_CONTROL_USERNAME}
  password: ${RIVOMESH_CONTROL_PASSWORD}
  namespace: rivomesh_control
  heartbeatMillis: 2000
  leaseMillis: 15000
  maximumNodes: 1000
```

Initial native control-store profiles are PostgreSQL17 and MySQL8.4. H2 memory is for in-process protocol tests. For MySQL use `com.mysql.cj.jdbc.Driver`, a MySQL URL and a database namespace. Tables require InnoDB/utf8mb4_bin; incompatible existing tables are rejected. Configure TLS through driver parameters; production TLS is not disabled automatically.

Startup needs schema/database and control-table creation permissions plus SELECT/INSERT/UPDATE/DELETE and bootstrap session-lock access. Existing tables are never cleared/dropped; incompatible formats refuse startup. A shared SQL instance is possible with a separate namespace and dedicated privileges.

nodeId, username/password and optional advertiseUrl support a whole-value `${ENV_NAME}` reference. advertiseUrl is observational only, with no user info/path/query/fragment. Connection/query timeouts are bounded; directory APIs omit database URLs, credentials, paths and raw business data.

heartbeatMillis is100–30000ms. leaseMillis is1000–300000ms and at least three heartbeat intervals. maximumNodes is1–10000. Defaults are2s/15s/1000. Lease/capacity are consistent cluster settings without online editing. Capacity includes retained STALE/STOPPED records; historical-node administration remains future work. Each node publishes up to200task observations. Keyset pages default to20nodes and allow at most50.

## Helm and native Kubernetes

Set the real URL and an existing username/password Secret in [values-cluster.yaml](/files/deploy/helm/rivomesh/values-cluster.yaml). Install independent releases/PVCs:

```sh
helm upgrade --install rivomesh-node-a deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-cluster.yaml
helm upgrade --install rivomesh-node-b deploy/helm/rivomesh -n rivomesh -f deploy/helm/rivomesh/values-cluster.yaml
```

Each release stays a single-replica Recreate deployment with a stable release-name nodeId. Increasing one Deployment's replicas while sharing its PVC is invalid. Accounts/sessions are not shared; load balancing independent controllers is not controller HA.

For manual YAML edit/apply [node-a](/files/deploy/kubernetes/rivomesh-node-a.yaml) and [node-b](/files/deploy/kubernetes/rivomesh-node-b.yaml), including image/store/Secret references. Static parity is checked; live Kubernetes/CSI/upgrades/controller HA remain unaccepted. See [session HTTPS configuration](/docs/en/reference/browser-sessions.html).

## Failure handling and FAQ

- **NODE_ID_IN_USE:** another live incarnation holds this ID. Stop the duplicate or use a unique stable ID. After confirmed power loss, wait for expiry without editing epochs.
- **NODE_REGISTRATION_FENCED:** a replacement owns the registration. The old process cannot renew or deregister it. Correct deployment IDs and restart; this does not establish Worker takeover.
- **CONTROL_STORE_PROTOCOL_MISMATCH:** cluster format/lease/capacity differ or authority metadata is missing. Restore consistent settings/state; startup never overwrites it automatically.
- **CONTROL_STORE_UNAVAILABLE / readiness503:** registry connection/query failure or expired heartbeat. healthz remains live; Workers follow their own journal leases. After recovery, an expired but unreplaced incarnation re-registers with a higher epoch; replaced processes remain fenced.
- **Killed nodes briefly remain HEALTHY:** until expiry, death cannot be confirmed. Use heartbeat/expiry timestamps; the observation window is not failover authorization.
- **Old process overwrites replacement:** active-ID and incarnation/epoch checks reject old heartbeats and shutdowns.
- **Graceful shutdown did not show STOPPED:** kill, storage failure or lost commit confirmation falls back to STALE through expiry.
- **Backup/restore:** back up the SQL control namespace and each node's existing accounts/audit/configuration/reports. Restoring the registry alone does not restore tasks or provide HA. Rollback of metadata/epochs requires review; external immutable backup anchors remain unfinished.

Development preview uses `http://127.0.0.1:18088` and `http://localhost:18089` for two endpoints reading one registry. Different hostnames avoid same-name cookies overwriting across ports. Existing private preview credentials remain; sign in separately. Acceptance fixtures are removed; the development preview remains available.
