---
sourcePath: docs/en/performance.md
---

# Performance measurement and hardware reference

中文：[性能测量](/reference/zh-CN/performance.html).

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
table, fixed-width ASCII payload and a LOCAL journal. Source loading warms caches;
it is not a cold-storage experiment. It measures neither peak sink throughput
nor p95/p99 event latency, durable snapshot-END acknowledgement, failover RTO or
steady-state saturation. It does not establish JSON/keyless/large-catalog,
multi-target, external-journal, commercial database or cluster performance.

## Building the hardware standard

Keep raw reports and run at least three repetitions for every workload/resource
combination. Report medians and ranges; compare identical artifacts, versions,
durability, dataset and storage. Record idle and loaded host conditions, disk
latency/IOPS, network RTT/bandwidth, utilization and sustained backlog growth.
Do not extrapolate linearly from CPU quotas or this small local profile.

The final reference matrix still needs independent physical-host runs, remote
targets, row-width/transaction/table-count sweeps, all targets and both journal
modes, sustained soak, consumer backpressure, capacity exhaustion and recovery
under backlog. An individual passing smoke run is evidence that this harness
works for that dataset, not completion of that matrix.

## Recorded harness smoke acceptance

[Raw report](/reference-files/docs/benchmarks/2026-11-15-mysql84-postgres17-smoke.json): 1,000 initial rows / 256-byte payload, 1,200 CDC changes, both exact row-stream SHA-256 comparisons matched and isolated cleanup succeeded. Actual MySQL 8.4.13 / PostgreSQL 17.12 / Temurin 8u512; one CPU and 1 GiB per container, worker heap 256 MiB. Host Apple M1 Pro / 16 GiB; shared Docker VM and other workloads, start load average 66.59. Recorded startup-inclusive snapshot visibility 23.08 s and write-inclusive CDC catch-up 1.94 s. This verifies the harness, **not** a representative capacity result or a hardware standard. No repeated-run or saturation claim follows from it.

## Runtime and journal profiles

`--java 8|11|17|21|25` selects the corresponding Temurin JRE worker image; default is 8. `--journal-mode LOCAL|EXTERNAL` defaults to LOCAL. The EXTERNAL profile uses a separate journal schema on the same PostgreSQL instance as the target, so journal and sink compete for that container's resources. It is not a remote dedicated journal benchmark. For example:

```bash
python3 tests/benchmark.py --java 21 --journal-mode EXTERNAL --rows 1000 \
  --storage-description 'Document actual storage and shared-host load'
```

Selecting a runtime is not a compatibility claim. Inspect a passing raw report and actual JVM version. This SQL profile can establish only MySQL-source/PostgreSQL-target snapshot/CDC coverage on that runtime; messaging/security/failover and other drivers need separate runtime acceptance.

To run every listed JRE against both journals sequentially, using one unchanged release:

```bash
python3 tests/runtime-matrix.py --rows 1000 \
  --storage-description 'Record physical storage, VM limits and shared-host contention'
```

The matrix retains progress and per-profile logs in `target/runtime-matrix/<id>/matrix.json`, links each raw benchmark report, and continues independent profiles after a failed profile. A passing profile requires source/target byte checks, observed journal backend, successful cleanup, the expected actual JVM version and the same release SHA-256. Changing the release aborts the matrix. These remain small SQL runtime checks; they do not validate every adapter on every JRE. Do not run other integration suites or rebuild concurrently.

## Accepted SQL runtime matrix

The ten-profile [matrix](/reference-files/docs/benchmarks/2026-11-15-runtime/matrix.json) passed on Temurin 8u512, 11.0.33, 17.0.21, 21.0.13 and 25.0.5, each with LOCAL and PostgreSQL EXTERNAL journals. Every run loaded 1,000 rows, applied 1,200 row changes and matched both full ordered byte-stream digests. Actual journal storage and JVM version were checked; every isolated cleanup succeeded. All used release SHA-256 `2985bbbb51b84ec8de97d8a9b44c88d5a5a1d737032b1e13263d03d4a9134aa0`.

The [archive index](/reference-files/docs/benchmarks/2026-11-15-runtime/archive-index.json) identifies every unmodified raw profile report and its SHA-256; the raw matrix retains original workspace report paths. These are small runtime checks on a busy shared host, with no cross-JRE throughput comparison or all-adapter compatibility claim. The first cold JVM runs varied substantially, reinforcing why these results are not a hardware capacity standard.
