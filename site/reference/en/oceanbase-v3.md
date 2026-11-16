---
sourcePath: docs/en/oceanbase-v3.md
---

# OceanBase V3 destination and FAQ

中文：[OceanBase V3](/reference/zh-CN/oceanbase-v3.html). Example: [oceanbase-v3.yml](/reference-files/config/oceanbase-v3.yml).

## Current scope

V3 configuration, CLI, fan-out workers and the bilingual wizard are implemented. Native OceanBase CE 4.3.5.6 ARM64/Java 8 transactions, cross-database rollback, ownership/epoch fences, snapshots/types and partial CDC passed. **Full mixed restart/recovery acceptance has not passed; the adapter remains EXPERIMENTAL.** See the [evidence](/reference/verification/2026-11-15-oceanbase/README.html). This does not claim all versions, clusters or Oracle-mode support.

`product: OCEANBASE` uses MySQL Connector/J 8.4.0 and `jdbc:mysql://`, normally port 2881. Connect to a **MySQL-mode user tenant**, usually with `rivomesh@business`, rather than `root@sys`. Every new connection verifies OceanBase identity, mode and a non-system tenant, then forces `ob_read_consistency=STRONG`. A MySQL wire version is not the OceanBase product version. Oracle mode, seekdb and other compatible products are outside this verified profile.

## Start and recover

Fill in source candidates, the user tenant and explicit database mappings, then supply `MYSQL_PASSWORD` and `OCEANBASE_PASSWORD`. Source GTID/ROW/FULL and privileges are documented in the [V3 manual](/reference/en/pipeline-v3.html); UI steps are in the [console manual](/reference/en/console-and-deployment.html).

```bash
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar check config/oceanbase-v3.yml
java -jar sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar run config/oceanbase-v3.yml
```

In another terminal use `status config/oceanbase-v3.yml`. After repairing a deterministic failure, resume the affected target in the UI, or use `resume config/oceanbase-v3.yml oceanbase-business 7` with the same `java -jar ...` prefix. Replace 7 with the current `errorGeneration` from status; never guess it. Resume retries the original transaction. OceanBase is V3-only; select it in the wizard and provide a user-tenant identity. Extra destinations can select PostgreSQL or other products independently.

## Data, transactions and indexes

Explicit mappings send each source database to a destination database in the same tenant. A configuration can fan out to OceanBase, PostgreSQL and other targets with independent acknowledgements and pauses. Rivomesh can create mapped databases/tables; it does not provision clusters, pools, tenants or users.

Business changes and the sink checkpoint commit in one destination transaction, with a metadata row lock and epoch fencing. An uncertain commit is resolved by rereading the sink checkpoint. Capture progress never substitutes for apply progress. Independent destinations do not share a global atomic commit.

Keyless tables gain `_rivomesh_row_id` to retain duplicate multiplicity; business users must not edit it. UINT64 uses DECIMAL(20,0), decimals keep declared precision, JSON uses native JSON, binary uses LONGBLOB, and temporal values follow the relational-target mappings. Supported source generated expressions are evaluated by the existing source adapter and their values are copied into ordinary target columns. Procedures, triggers, foreign keys, partition layouts, physical index distribution and generated expressions are not automatically reproduced. Existing incompatible targets require an adoption plan.

The default `uniquePolicy: DOWNGRADE_BUSINESS` converts business UNIQUE indexes into ordinary indexes. Primary/actual identity keys must remain unique. Plain BTREE/simple GSI can use the current ordinary-index plan; global routing, global uniqueness and source partition semantics are not preserved. Expressions, prefixes, descending keys, fulltext and spatial methods require an explicit plan. `PRESERVE` can retain representable business uniqueness, subject to native DDL constraints; it does not reproduce arbitrary GSI semantics.

Downgrading assumes exclusive synchronization writes, valid source constraints and complete ordered source transactions. It does not guarantee uniqueness under independent target writes. Existing UNIQUE constraints are never silently dropped. Before takeover, stop incremental writes, reconcile the data and restore required constraints. The complete automated takeover workflow remains pending.

## Deployment and privileges

Use the same V3 task document with Linux, Docker, Helm or native Kubernetes deployment. Rivomesh manifests do not deploy OceanBase itself; database operations manage production clusters, OBProxy, tenant resources and isolation. The target account needs metadata access and appropriate mapped-database/table/index creation and business/metadata read/write privileges. A successful connection check does not prove all DDL/DML privileges. Supply passwords through environment references or protected configuration.

LOCAL Journal supports same-host recovery. Cross-host worker takeover uses the already-supported external PostgreSQL/openGauss/MySQL journal. `journal.product: OCEANBASE` is rejected until that backend has its own acceptance. Controller HA and live Kubernetes/CSI acceptance remain separate work.

## Failures and FAQ

- **Tenant mismatch:** verify the user suffix, OBProxy routing and tenant compatibility mode. System/Oracle tenants are rejected; mode is never changed automatically.
- **Outage/restart:** recognized transient connection failures back off and reconnect, then catch up from destination progress. Other sinks continue until journal backpressure applies. OceanBase manages its own leader elections; multi-node/OBProxy failover needs separate acceptance.
- **SQL failure:** only the affected subscription pauses. Repair permissions, types or constraints, then use the current `errorGeneration` in UI/CLI to replay the original transaction. Restart does not bypass the pause or skip events.
- **Deleted tables/metadata:** an empty replacement is not silently created under an old checkpoint. Preserve evidence and plan a rebuild. A normal resume cannot repair deleted data or lost history.
- **Why STRONG reads:** a recovery decision must observe committed checkpoint state. WEAK reads can return an older value; URL settings cannot override this profile's STRONG requirement.
- **Why a separate product from MYSQL:** the wire protocol is similar, but vendor, tenant and consistency requirements differ.
- **Source DDL:** initial auto-creation does not imply complete online DDL. Unsupported structural changes retain safe progress and require a conversion plan; do not edit GTIDs to bypass them. Full DDL, reconciliation/repair and migration workflows remain pending.
- **Existing targets:** compatible empty tables can pass shape/ownership checks. A newly adopted nonempty table needs a provable baseline and adoption plan even if it looks identical. Rivomesh does not silently clear it or attach an unproved checkpoint.
- **Capacity:** fixture CPU/memory/disk quotas are correctness-test settings, not hardware throughput standards. Benchmark row width, transaction size, indexes, fan-out, backlog windows and tenant resources. Hardware capacity reports remain pending.

## Official references

- [Official Docker fixture and resource settings](https://github.com/oceanbase/docker-images/blob/main/oceanbase-ce/README.md)
- [MySQL-mode transaction control](https://docs.oceanbase.com/oceanbase-database/V4.2.1-control-mysql-transactions)
- [System variables](https://www.oceanbase.com/docs/common-oceanbase-database-cn-1000000005283255)

## Test-image startup diagnostics

The official all-in-one image is a fixture, not a production deployment. The current fixture sets instance memory_limit=5G/system_memory=1G, user resource-unit memory_size=2G/log_disk_size=2G, instance logs5G/data2G, and a container limit of 6G/6 CPUs. These are test settings, not production capacity recommendations or throughput standards.

Unit memory is not exclusively business-tenant memory: an actual 2GiB unit probe showed roughly 1GiB for the user tenant after splitting with its metadata tenant. Other tenants, caches and host load affect recovery. A `boot success!` banner is insufficient; this image can print it even when OBD memory checks prevented observer startup. Check the actual observer process, user-tenant connection, container health and OBD logs together. Do not delete existing data or skip synchronization checkpoints to repair inadequate startup resources. Do not blindly use `obd cluster start -f`; this version's -f means force-delete, not bypassing resource checks.

## Recovery acceptance still pending

All four mixed runs retain their failures. The first15s administrative-DDL timeout followed successful outage catch-up, worker kill and PostgreSQL constraint isolation. With revised timeouts/catalog checks, the 5GiB instance/2GiB unit remained in user-tenant initialization beyond the recovery deadline; increasing CPU did not make the full case pass. A probe showed roughly 1GiB for the user tenant, which alone does not establish root cause. The6GiB instance/3GiB unit was rejected by OBD's available-memory precheck and never launched observer, despite a success banner. Checks were not bypassed, transactions were not skipped and checkpoints were not reset. These results do not establish complete automatic recovery or attribute every failure to Rivomesh or OceanBase; investigation and full acceptance remain required.
