#!/usr/bin/env python3
"""Isolated, content-checked MySQL -> PostgreSQL end-to-end baseline; stdlib only."""
import argparse
import datetime
import hashlib
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import sys
import threading
import time
import uuid

ROOT = Path(__file__).resolve().parents[1]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--rows", type=int, default=10000)
    parser.add_argument("--payload-bytes", type=int, default=256)
    parser.add_argument("--chunk-size", type=int, default=1000)
    parser.add_argument("--timeout", type=int, default=900)
    parser.add_argument("--java", choices=("8", "11", "17", "21", "25"), default="8")
    parser.add_argument("--journal-mode", choices=("LOCAL", "EXTERNAL"), default="LOCAL")
    parser.add_argument("--storage-description", required=True,
                        help="Physical disk/storage, VM and contention notes; do not include secrets")
    args = parser.parse_args()
    if not (10 <= args.rows <= 1000000 and 32 <= args.payload_bytes <= 8192
            and 1 <= args.chunk_size <= 10000 and 30 <= args.timeout <= 86400):
        parser.error("rows 10..1000000, payload 32..8192, chunk 1..10000, timeout 30..86400 required")
    run_id = "rivomesh-bench-" + uuid.uuid4().hex[:12]
    directory = ROOT / "target" / "benchmarks" / run_id
    directory.mkdir(parents=True, mode=0o700)
    artifact = ROOT / "sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar"
    if not artifact.is_file():
        parser.error("Build the release JAR first: mvn -s build/settings.xml -DskipTests package")
    shutil.copyfile(artifact, directory / "app.jar")
    env = dict(os.environ, RIVOMESH_BENCH_DIR=str(directory),
               RIVOMESH_BENCH_WORKER_IMAGE="eclipse-temurin:" + args.java + "-jre")
    compose = ["docker", "compose", "-p", run_id, "-f", str(ROOT / "tests/benchmark-compose.yml")]
    report = {"formatVersion": 1, "runId": run_id, "status": "RUNNING",
              "startedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
              "host": {"system": platform.system(), "release": platform.release(),
                       "machine": platform.machine(), "logicalCpus": os.cpu_count(),
                       "processor": platform.processor()},
              "storageDescription": args.storage_description,
              "workload": vars(args), "measurements": {},
              "limits": {"cpusPerContainer": env.get("RIVOMESH_BENCH_CPUS", "1"),
                         "databaseMemory": env.get("RIVOMESH_BENCH_DB_MEMORY", "1g"),
                         "workerMemory": env.get("RIVOMESH_BENCH_WORKER_MEMORY", "1g"),
                         "workerHeapMiB": 256},
              "scope": "One source, one target, one keyed table, " + args.journal_mode + " journal, ASCII payload; "
                       "startup-inclusive snapshot visibility and write-inclusive CDC catch-up. "
                       "Not peak throughput, p99 latency, crash recovery, a hardware standard or an SLO."}
    try:
        report["host"]["physicalMemoryBytes"] = os.sysconf("SC_PAGE_SIZE") * os.sysconf("SC_PHYS_PAGES")
    except (ValueError, OSError, AttributeError):
        report["host"]["physicalMemoryBytes"] = None
    if hasattr(os, "getloadavg"):
        report["host"]["loadAverageAtStart"] = os.getloadavg()
    disk = shutil.disk_usage(directory)
    report["host"]["journalFilesystemCapacityAtStart"] = {
        "totalBytes": disk.total, "freeBytes": disk.free}
    if platform.system() == "Darwin":
        description = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"],
                                     stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                                     text=True, timeout=10)
        if description.returncode == 0:
            report["host"]["processor"] = description.stdout.strip()
    with (directory / "app.jar").open("rb") as stream:
        digest = hashlib.sha256()
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
        report["artifactSha256"] = digest.hexdigest()

    def run(command, sql=None, check=True):
        try:
            return subprocess.run(command, input=sql, text=True, stdout=subprocess.PIPE,
                                  stderr=subprocess.PIPE, env=env, check=check, timeout=240)
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as failure:
            diagnostic = failure.stderr or ""
            if isinstance(diagnostic, bytes):
                diagnostic = diagnostic.decode("utf-8", errors="replace")
            (directory / "command-failure.stderr").write_text(diagnostic)
            raise

    def db_command(product):
        if product == "mysql":
            return compose + ["exec", "-T", "-e", "MYSQL_PWD=Bench@Test123", "mysql",
                              "mysql", "-uroot", "--batch", "--raw", "--skip-column-names"]
        return compose + ["exec", "-T", "postgres", "psql", "-U", "postgres", "-d", "bench",
                          "-v", "ON_ERROR_STOP=1", "-At"]

    def sql(product, statement, check=True):
        return run(db_command(product), statement, check)

    def content_digest(product):
        query = ("SELECT id,version,HEX(payload) FROM bench.items ORDER BY id;" if product == "mysql"
                 else "COPY (SELECT id,version,upper(encode(convert_to(payload,'UTF8'),'hex')) "
                      "FROM bench_copy.items ORDER BY id) TO STDOUT;")
        # Stream row bytes; validation does not load the full dataset into Python memory.
        with (directory / (product + "-validation.stderr")).open("w") as errors:
            process = subprocess.Popen(db_command(product), stdin=subprocess.PIPE,
                                       stdout=subprocess.PIPE, stderr=errors, env=env)
            watchdog = threading.Timer(240, process.kill)
            watchdog.daemon = True
            watchdog.start()
            try:
                process.stdin.write(query.encode())
                process.stdin.close()
                digest = hashlib.sha256()
                for block in iter(lambda: process.stdout.read(65536), b""):
                    digest.update(block)
                process.stdout.close()
                if process.wait(timeout=10):
                    raise RuntimeError("CONTENT_VALIDATION_QUERY_FAILED")
            finally:
                watchdog.cancel()
                if process.poll() is None:
                    process.kill()
                    process.wait(timeout=10)
            return digest.hexdigest()

    def verify_content(phase):
        source, target = content_digest("mysql"), content_digest("postgres")
        report["measurements"][phase + "SourceContentSha256"] = source
        report["measurements"][phase + "TargetContentSha256"] = target
        if source != target:
            raise RuntimeError("CONTENT_MISMATCH_" + phase.upper())
        report["measurements"][phase + "ContentSha256"] = source

    def await_target(rows, versions):
        deadline = time.monotonic() + args.timeout
        while time.monotonic() < deadline:
            visible = sql("postgres", "SELECT to_regclass('bench_copy.items');")
            if visible.stdout.strip():
                result = sql("postgres", "SELECT count(*)::text||':'||coalesce(sum(version),0)::text "
                             "FROM bench_copy.items;")
                if result.stdout.strip() == str(rows) + ":" + str(versions):
                    return time.monotonic()
            running = run(compose + ["ps", "--status", "running", "--services"])
            if "worker" not in running.stdout.splitlines():
                raise RuntimeError("WORKER_EXITED")
            time.sleep(0.25)
        raise RuntimeError("TARGET_CATCH_UP_TIMEOUT")

    config = {"formatVersion": 3, "pipelineId": "bench", "nodeId": "bench-node", "sourceType": "MYSQL",
              "source": {"clusterId": "bench-source", "host": "mysql", "port": 3306,
                         "username": "root", "password": "Bench@Test123", "serverId": 910991,
                         "topology": "AUTO"}, "databases": ["bench"],
              "journal": {"mode": "LOCAL", "path": "/bench/journal", "maxBytes": 10737418240},
              "targets": [{"id": "postgres", "product": "POSTGRESQL", "username": "postgres",
                           "password": "Bench@Test123", "metadataSchema": "rivomesh_bench",
                           "url": "jdbc:postgresql://postgres:5432/bench?connectTimeout=5&socketTimeout=30",
                           "mappings": {"bench": "bench_copy"}}], "chunkSize": args.chunk_size,
              "maxTransactionRows": 100000, "pollIntervalMillis": 100}
    if args.journal_mode == "EXTERNAL":
        # Separate schema, intentionally sharing the target PostgreSQL instance.
        config["journal"] = {"mode": "EXTERNAL", "product": "POSTGRESQL",
                             "url": config["targets"][0]["url"], "username": "postgres",
                             "password": "Bench@Test123", "namespace": "rivomesh_bench_journal",
                             "maxBytes": 10737418240}
    config_file = directory / "pipeline.json"
    config_file.write_text(json.dumps(config, indent=2))
    config_file.chmod(0o600)
    (directory / "report.json").write_text(json.dumps(report, indent=2) + "\n")
    started = False
    try:
        info = run(["docker", "info", "--format", "{{json .}}"])
        raw = json.loads(info.stdout)
        report["docker"] = {key: raw.get(key) for key in
                            ("ServerVersion", "NCPU", "MemTotal", "Driver", "OperatingSystem", "Architecture")}
        started = True
        run(compose + ["up", "-d", "--wait", "--wait-timeout", "180", "mysql", "postgres"])
        ids = run(compose + ["ps", "-q", "mysql", "postgres"]).stdout.split()
        details = json.loads(run(["docker", "inspect"] + ids).stdout)
        report["containers"] = [{"imageId": item["Image"], "image": item["Config"]["Image"],
                                 "nanoCpus": item["HostConfig"].get("NanoCpus"),
                                 "memoryBytes": item["HostConfig"].get("Memory"),
                                 "mountTypes": sorted(set(m["Type"] for m in item["Mounts"]))}
                                for item in details]
        report["databaseRuntime"] = {
            "mysqlVersionFlushSyncBuffer": sql("mysql", "SELECT @@version,"
                "@@innodb_flush_log_at_trx_commit,@@sync_binlog,@@innodb_buffer_pool_size;").stdout.strip(),
            "postgresVersionDurabilityBuffer": sql("postgres", "SELECT version(); SELECT "
                "current_setting('fsync'),current_setting('synchronous_commit'),"
                "current_setting('shared_buffers');").stdout.strip()}
        sql("mysql", "CREATE DATABASE bench CHARACTER SET utf8mb4; CREATE TABLE bench.items "
            "(id BIGINT NOT NULL PRIMARY KEY,version INT NOT NULL,payload VARCHAR(8192) NOT NULL) ENGINE=InnoDB;")
        load_start = time.monotonic()
        for start in range(1, args.rows + 1, 500):
            values = ["(%d,0,'%s')" % (i, ("row-%d-" % i).ljust(args.payload_bytes, "x"))
                      for i in range(start, min(start + 500, args.rows + 1))]
            sql("mysql", "INSERT INTO bench.items VALUES " + ",".join(values) + ";")
        report["measurements"]["sourceLoadSeconds"] = time.monotonic() - load_start
        snapshot_start = time.monotonic()
        run(compose + ["up", "-d", "--no-deps", "worker"])
        snapshot_end = await_target(args.rows, 0)
        seconds = snapshot_end - snapshot_start
        report["measurements"].update(snapshotVisibilitySeconds=seconds,
                                      snapshotRowsPerSecond=args.rows / seconds)
        verify_content("snapshot")
        cdc_start = time.monotonic()
        for start in range(1, args.rows + 1, 500):
            sql("mysql", "UPDATE bench.items SET version=1 WHERE id BETWEEN %d AND %d;" %
                (start, min(start + 499, args.rows)))
        removed = max(1, args.rows // 10)
        # Keep every source transaction bounded, including deletes and inserts.
        for start in range(1, removed + 1, 500):
            sql("mysql", "DELETE FROM bench.items WHERE id BETWEEN %d AND %d;" %
                (start, min(start + 499, removed)))
        for start in range(args.rows + 1, args.rows + removed + 1, 500):
            values = ["(%d,1,'%s')" % (i, ("row-%d-" % i).ljust(args.payload_bytes, "x"))
                      for i in range(start, min(start + 500, args.rows + removed + 1))]
            sql("mysql", "INSERT INTO bench.items VALUES " + ",".join(values) + ";")
        write_end = time.monotonic()
        cdc_end = await_target(args.rows, args.rows)
        seconds = cdc_end - cdc_start
        report["measurements"].update(sourceMutationSeconds=write_end - cdc_start,
                                      cdcCatchUpSeconds=seconds,
                                      cdcChanges=args.rows + 2 * removed,
                                      cdcChangesPerSecond=(args.rows + 2 * removed) / seconds,
                                      afterWritesCatchUpSeconds=cdc_end - write_end)
        verify_content("cdc")
        if args.journal_mode == "LOCAL":
            database = directory / "journal/rivomesh.mv.db"
            if not database.is_file() or database.stat().st_size == 0:
                raise RuntimeError("JOURNAL_BACKEND_NOT_OBSERVED")
            report["journalEvidence"] = {"mode": "LOCAL", "databaseBytes": database.stat().st_size}
        else:
            rows = sql("postgres", "SELECT count(*) FROM rivomesh_bench_journal.rm3_job "
                       "WHERE pipeline_id='bench';").stdout.strip()
            if rows != "1":
                raise RuntimeError("JOURNAL_BACKEND_NOT_OBSERVED")
            footprint = sql("postgres", "SELECT coalesce(sum(pg_total_relation_size(c.oid)),0) "
                            "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
                            "WHERE n.nspname='rivomesh_bench_journal' AND c.relkind='r';").stdout.strip()
            report["journalEvidence"] = {"mode": "EXTERNAL", "pipelineRows": 1,
                                          "databaseBytes": int(footprint)}
        worker_id = run(compose + ["ps", "-q", "worker"]).stdout.strip()
        worker = json.loads(run(["docker", "inspect", worker_id]).stdout)[0]
        report["worker"] = {"imageId": worker["Image"],
                            "nanoCpus": worker["HostConfig"].get("NanoCpus"),
                            "memoryBytes": worker["HostConfig"].get("Memory")}
        report["worker"]["javaVersion"] = run(compose + ["exec", "-T", "worker", "java", "-version"]).stderr.strip()
        report["status"] = "PASSED"
    except BaseException as failure:
        report["status"] = "FAILED"
        # Commands/stderr can contain credentials: retain only the exception class here.
        report["failureClass"] = type(failure).__name__
        if isinstance(failure, RuntimeError) and str(failure).startswith(
                ("CONTENT_", "WORKER_EXITED", "TARGET_CATCH_UP_")):
            report["failureCode"] = str(failure)
        raise
    finally:
        original_failure = report["status"] == "FAILED"
        cleanup_failure = None
        if started:
            try:
                with (directory / "containers.log").open("w") as log:
                    subprocess.run(compose + ["logs", "--no-color", "--tail", "200"],
                                   stdout=log, stderr=subprocess.STDOUT, env=env, timeout=60)
            except Exception as failure:
                report["diagnosticsFailureClass"] = type(failure).__name__
            try:
                cleanup = subprocess.run(compose + ["down", "-v", "--remove-orphans"],
                                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                                         text=True, env=env, timeout=120)
                report["cleanupExitCode"] = cleanup.returncode
                (directory / "cleanup.log").write_text(cleanup.stdout)
                if cleanup.returncode:
                    cleanup_failure = "CLEANUP_FAILED"
            except Exception as failure:
                cleanup_failure = type(failure).__name__
            if cleanup_failure:
                report["cleanupFailureClass"] = cleanup_failure
                report["status"] = "FAILED"
        report["finishedAt"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if hasattr(os, "getloadavg"):
            report["host"]["loadAverageAtEnd"] = os.getloadavg()
        result = directory / "report.json"
        result.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
        print(str(result), flush=True)
        if cleanup_failure and not original_failure:
            raise RuntimeError("BENCHMARK_CLEANUP_FAILED")


if __name__ == "__main__":
    try:
        main()
    except Exception as failure:
        # Never echo a subprocess command: its arguments can include credentials.
        print("Benchmark failed (" + type(failure).__name__ + "); inspect its report and diagnostics.",
              file=sys.stderr)
        sys.exit(1)
