---
kind: docs
locale: en
title: "Performance & runtimes"
sourcePath: docs/en/performance.md
---

# Performance measurement and hardware reference

中文：[性能测量](/docs/zh/reference/performance.html).

Hardware capacity must come from reproducible measurements of a stated workload.
No rows/second or recovery-time promise applies independently of CPU, memory,
storage latency, network, row width, transaction size, table count, target count,
indexes, journal mode and competing workloads.

## Reproduce the first baseline

Build the release before starting the benchmark. Do not rebuild that JAR during
a run. Python 3, Docker Compose and the three fixture images are required.

```bash
mvn -s build/settings.xml -DskipTests package
python3 tests/benchmark.py --rows 10000 --payload-bytes 256 \
  --storage-description 'Describe physical disk, Docker VM, CPU/RAM and competing workloads'
```

On macOS, prefix the Python command with `caffeinate -i` to prevent idle system
sleep; lid closure, manual sleep and other suspension still invalidate timing.
For a specified resource envelope:

```bash
RIVOMESH_BENCH_CPUS=2 RIVOMESH_BENCH_DB_MEMORY=2g \
RIVOMESH_BENCH_WORKER_MEMORY=1g python3 tests/benchmark.py \
  --rows 100000 --chunk-size 1000 --payload-bytes 1024 --timeout 1800 \
  --storage-description 'Record the actual storage and host contention here'
```

The CPU and database-memory limits apply **to each** database container; the CPU
limit also applies to the worker. Default limits are one CPU and 1 GiB per
container, with a 256 MiB Java worker heap and 256 MiB database buffers. They are
limits, not reserved or dedicated host resources. Results identify actual image
IDs, Docker VM CPU/RAM, container limits, database durability settings, JVM
version, workload and release SHA-256. The local journal uses a host bind mount;
database files use fixture volumes. Record their physical storage separately.

Every run uses a random Compose project and copies the release to
`target/benchmarks/<run-id>/app.jar`. It creates only its own source/target, ports
remain internal, and cleanup removes only that project's containers/volumes.
The copied release, private fixture configuration, bounded logs and `report.json`
remain for review. Failed runs produce `status: FAILED`; they must not become
capacity reference rows. Inspect `containers.log` for startup/runtime failures.

## What the measurements mean

| Field | Meaning |
|---|---|
| `snapshotVisibilitySeconds` | Worker startup through visibility of all initially loaded target rows; includes JVM startup, discovery and automatic target creation |
| `snapshotRowsPerSecond` | Initial row count divided by that visibility interval |
| `sourceMutationSeconds` | Time to commit updates, deletes and inserts at the source |
| `cdcCatchUpSeconds` | First source mutation through visibility of the final target state; includes source writes |
| `cdcChangesPerSecond` | Number of changed rows, including deleted and inserted rows, divided by that interval |
| `afterWritesCatchUpSeconds` | Observed time between finishing source writes and observing the final target state |
| `snapshotContentSha256`, `cdcContentSha256` | Source and target ordered row streams must match, including IDs, versions and exact payload bytes |

Transactions are bounded to at most 500 changed rows. Validation streams row
bytes rather than collecting the dataset in Python memory. Byte validation runs
after each timed phase; a count-only match cannot produce a passing report.
The final target contains updated rows, the expected deletes and newly inserted
rows. Polling and Docker CLI overhead are included in observation times.

This profile is one MySQL 8.4 source, one PostgreSQL 17.12 target, one primary-key
table, fixed-width ASCII payload and either journal mode. Source loading warms caches;
it is not a cold-storage experiment. It measures neither peak sink throughput
nor p95/p99 event latency, durable snapshot-END acknowledgement, failover RTO or
steady-state saturation. It does not establish JSON/keyless/large-catalog,
multi-target, remote-journal, commercial database or cluster performance.

## Measured 100,000-row reference

One run per journal mode used the same artifact, MySQL 8.4.13, PostgreSQL 17.12 and Temurin 8u512. The Apple M1 Pro ARM64 host had 10 logical CPUs, 16 GiB RAM and Docker Desktop on SSD. Each service was capped at 1 CPU and 1 GiB. The Worker heap and database buffers were 256 MiB each. The workload used 1,024 payload bytes per row, 1,000-row snapshot parts and at most 500 changes per source transaction.

| Journal | Snapshot visibility | Snapshot rows/s | 120,000 changes visible | Changes/s | Catch-up after writes |
|---|---:|---:|---:|---:|---:|
| LOCAL, host bind mount | 24.83 s | 4,027 | 53.55 s | 2,241 | 23.13 s |
| EXTERNAL, schema on target PostgreSQL | 21.61 s | 4,628 | 46.25 s | 2,595 | 14.04 s |

Both runs matched source and target content hashes after snapshot and CDC. During diagnosis, a Worker with the same heap exhausted memory while loading an unbounded payload batch. The journal now limits fetched transaction prefixes to 8 MiB and processes an oversized first transaction alone. PostgreSQL also changed from a sequential scan to a primary-key index scan for the benchmark UPDATE when the BIGINT key was bound as BIGINT. Individual transaction limits and large-catalog scaling remain separate measurements. [Reports and exact artifact](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/baseline.json)

## Repeated Temurin 21 capacity reference

The Apple M1 Pro ARM64 host had 10 logical CPUs and 16 GiB RAM. Docker Desktop 29.9.2 reported 10 vCPUs and 15.6 GiB RAM. Three independent runs per combination used MySQL 8.4.13, PostgreSQL 17.12, Temurin 21.0.13+9 and the same release artifact. Each of the three containers had 1 GiB RAM and the listed CPU quota. The worker heap was 256 MiB. Both database services used persistent fixture volumes. The LOCAL journal used a host bind mount and EXTERNAL used a separate schema on the destination PostgreSQL instance.

Each trial loaded 20,000 rows with a 256-byte payload, then checked 24,000 insert, update and delete changes. Figures show the median and the minimum–maximum range across all three trials.

| Journal | CPUs per container | Snapshot rows/s | CDC changes/s | Catch-up after source writes |
|---|---:|---:|---:|---:|
| LOCAL | 1 | 1,943 (1,758–2,222) | 2,983 (2,133–3,699) | 0.27 s (0.26–0.42) |
| LOCAL | 2 | 2,986 (2,442–3,345) | 2,962 (2,954–3,000) | 0.29 s (0.29–0.36) |
| EXTERNAL | 1 | 2,558 (2,469–2,763) | 2,925 (2,784–3,030) | 1.00 s (0.88–1.29) |
| EXTERNAL | 2 | 3,143 (1,554–3,382) | 3,038 (2,169–3,472) | 0.36 s (0.28–0.37) |

All 12 cases matched exact ordered source and target bytes after both phases. The visibility check includes the expected first and last IDs, because the intermediate update-only state can share the final row count and version sum. The measurements include worker startup for snapshots and source writes for CDC. They apply to this workload and the recorded host. [Trial values, image IDs and artifact SHA-256](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/baseline.json)

## 256 mapped databases and a large transaction

On the same artifact, a separate run used 256 MySQL databases in one instance and 256 explicitly mapped PostgreSQL schemas. Each held one keyed table with two rows and an 8,192-byte payload per row. Each container had two CPUs and 1 GiB RAM, the Worker heap was 256 MiB, and the journal was LOCAL.

| Check | Observed |
|---|---:|
| Start Worker through 256 durable snapshot acknowledgments | 25.84 s |
| One source transaction with 768 changes and 8,505,279 binlog bytes through target acknowledgment | 4.32 s |
| Restart after SIGKILL and catch up on 256 changes committed while offline | 21.42 s |

Each phase compared all 512 ordered rows from both databases with the generated fixture data. Snapshot identifiers were identical after restart. The fixture uses Python 3.11 or later and Docker Compose.

```bash
python3 tests/catalog-benchmark.py \
  --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --output target/catalog-256 --schemas 256 --payload-bytes 8192 --cpus 2
```

[Content hashes and exact fixture resources](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/baseline.json)

## Slow destination and external journal quota

The slow-target profile uses a separate PostgreSQL instance for the external journal. At the default 32 mappings and 8,192 payload bytes per row, each of 24 source transactions updates one keyed row in each schema with full row images. Each of the four services uses the requested CPU quota and 1 GiB RAM. The Worker heap is 256 MiB.

```bash
python3 tests/catalog-benchmark.py --slow-target \
  --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --output target/catalog-slow-target --schemas 32 --payload-bytes 8192 --cpus 2
```

After all snapshots are acknowledged, the fixture pauses only the destination. It observes `JOURNAL_BACKPRESSURE` while the journal stays reachable. For at least five seconds, the durable capture offset must stay behind the final source offset, and neither the capture offset nor the destination acknowledgment may advance. Each observation checks that pending transaction, snapshot and identity bytes together fit the logical quota, calculated as `12 × schemas × (payload bytes + 1,024)`. The report retains the maximum observed logical size and separately measures total journal relation size. Relation size includes heap, indexes and TOAST, and excludes WAL and other database files.

The fixture kills the Worker during the outage, unpauses the destination and starts a fresh Worker process. Recovery must reach the final source offset and target acknowledgment in the original journal generation at a newer epoch. It compares all ordered source and target row bytes and the original snapshot identifiers. The reported recovery time runs from Worker restart through the final acknowledged transaction.

On the same Temurin 21 artifact with two CPUs per service, the source committed 768 changes and wrote 12,724,136 binlog bytes. Capture held at sequence 3 and target acknowledgment at 0 for 5.34 seconds over nine observations. The maximum observed logical size was 3,244,602 bytes against a 3,538,944-byte quota. Journal relations occupied 638,976 bytes at the stalled cut. After SIGKILL and restart, the Worker reached acknowledgment 24 and the final source offset in 18.76 seconds. All 64 rows matched, all 32 snapshot identifiers stayed identical, and collection reduced pending logical bytes to zero. [Exact artifact, measurements and content hashes](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/baseline.json)

## Building the hardware standard

Keep raw reports and run at least three repetitions for every workload/resource
combination. Report medians and ranges; compare identical artifacts, versions,
durability, dataset and storage. Record idle and loaded host conditions, disk
latency/IOPS, network RTT/bandwidth, utilization and sustained backlog growth.
Do not extrapolate linearly from CPU quotas or this small local profile.

The broader reference matrix still needs independent physical-host runs, remote
targets, row-width/transaction/table-count sweeps, additional targets, sustained
soak and consumer backpressure. The slow-target result covers one separately
journaled SQL target with the stated quota and workload.

## Harness validation scope

The earlier process and journal runs retain their tested artifacts, runtimes and scope. Current candidate measurements use Eclipse Temurin 21 LTS. Compare capacity only with the recorded host, workload and storage. [Verification baseline](https://github.com/rivomesh/rivomesh/blob/48aa0ac91b07e071e84209bbfeb13395cde3c2c0/docs/verification/baseline.json) · [Fixed historical snapshot](https://github.com/rivomesh/rivomesh/blob/419945c98f197bd6cc1c6cc3e75e9c6a4bb3188c/docs/verification/baseline.json)

## Runtime and journal profiles

The benchmark uses Temurin 21. `--journal-mode LOCAL|EXTERNAL` defaults to LOCAL. The EXTERNAL profile uses a separate journal schema on the same PostgreSQL instance as the target, so journal and sink compete for that container's resources. It is not a remote dedicated journal benchmark. For example:

```bash
python3 tests/benchmark.py --java 21 --journal-mode EXTERNAL --rows 1000 \
  --storage-description 'Document actual storage and shared-host load'
```

Selecting a runtime is not a compatibility claim. Inspect a passing raw report and actual JVM version. This SQL profile can establish only MySQL-source/PostgreSQL-target snapshot/CDC coverage on that runtime; messaging/security/failover and other drivers need separate runtime acceptance.

To compare CPU quotas with both journal modes on one Temurin 21 artifact, run independent trials sequentially:

```bash
python3 tests/runtime-matrix.py --rows 20000 --cpu-limits 1 2 --repeat 3 \
  --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --storage-description 'Record physical storage, VM limits and shared-host contention'
```

The matrix retains progress, per-trial logs and links to each raw benchmark report in `target/runtime-matrix/<id>/`. Each trial uses fresh services. A passing trial requires source and target byte checks, the observed journal backend, successful cleanup, the expected JVM version, the same artifact SHA-256 and the requested CPU quota on all three containers. The matrix continues after a failed trial and reports the median and range only for combinations whose trials all pass. Changing the artifact aborts the matrix. Run it without competing workloads or a concurrent release build to make comparisons reproducible.

### Controller, Agent and Worker runtime verification

Use one release package to start the actual processes on Temurin 21 and verify MySQL to PostgreSQL and MySQL snapshot and CDC. The report records each role’s JVM version, architecture and package hash.

```bash
python3 tests/control-runtime.py --suite processes \
    --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
    --output target/control-runtime-processes
```
