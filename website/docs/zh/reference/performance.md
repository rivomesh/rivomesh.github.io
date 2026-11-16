---
kind: docs
locale: zh
title: "性能与运行时验证"
sourcePath: docs/zh-CN/performance.md
---

# 性能测量与硬件参考

English: [Performance](/docs/en/reference/performance.html).

“多少硬件能达到多少性能”必须来自明确负载的可复现测量。CPU、内存、存储延迟、网络、行宽、事务大小、表数量、目标数量、索引、日志模式和其他负载都会影响结果，不能脱离这些条件承诺吞吐或恢复时间。

## 复现首个基准

先构建发布包，测量过程中不要重新构建该 JAR。需要 Python 3、Docker Compose 和夹具使用的三个镜像。

```bash
mvn -s build/settings.xml -DskipTests package
python3 tests/benchmark.py --rows 10000 --payload-bytes 256 \
  --storage-description '填写物理磁盘、Docker 虚拟机、CPU/内存及同时运行的其他负载'
```

macOS 可以在 Python 命令前加 `caffeinate -i` 防止空闲休眠；合盖、手动休眠及其他挂起仍会使计时失效。指定资源条件的例子：

```bash
RIVOMESH_BENCH_CPUS=2 RIVOMESH_BENCH_DB_MEMORY=2g \
RIVOMESH_BENCH_WORKER_MEMORY=1g python3 tests/benchmark.py \
  --rows 100000 --chunk-size 1000 --payload-bytes 1024 --timeout 1800 \
  --storage-description '填写实际存储和宿主机资源竞争情况'
```

CPU 和数据库内存限制分别作用于**每个**数据库容器，CPU 限制同时作用于 Worker。默认每个容器 1 CPU、1 GiB 内存；Java 堆 256 MiB，数据库缓冲区 256 MiB。这是上限，不代表宿主机为其预留或独占资源。报告记录实际镜像 ID、Docker 虚拟机 CPU/内存、容器限制、数据库持久化参数、JVM 版本、负载及发布包 SHA-256。本地日志为宿主机绑定目录，数据库文件为夹具数据卷，应分别记录对应物理存储。

每轮使用随机 Compose 项目，复制发布包到 `target/benchmarks/<run-id>/app.jar`。只创建自己的源库/目标库，不映射宿主端口，结束时只清理本项目的容器和数据卷。复制的发布包、私有夹具配置、有界日志及 `report.json` 留供复核。失败结果为 `status: FAILED`，不能纳入性能参考表；启动或运行错误查看 `containers.log`。

## 指标含义

| 字段 | 含义 |
|---|---|
| `snapshotVisibilitySeconds` | 从启动 Worker 到最初全部目标行可见，包含 JVM 启动、发现和自动建表 |
| `snapshotRowsPerSecond` | 初始行数除以上述可见耗时 |
| `sourceMutationSeconds` | 源端提交更新、删除和插入的耗时 |
| `cdcCatchUpSeconds` | 从首次源端变更到目标最终状态可见，包含源端写入 |
| `cdcChangesPerSecond` | 变更行数（含删除和新增）除以上述耗时 |
| `afterWritesCatchUpSeconds` | 源端写完后，到观察到目标最终状态的耗时 |
| `snapshotContentSha256`、`cdcContentSha256` | 源/目标按 ID 排序的行字节流必须一致，覆盖 ID、版本和正文原始字节 |

每个源事务最多变更 500 行。校验采用流式读取，不把全部数据集载入 Python 内存。两阶段计时结束后分别执行字节校验，仅行数一致不能产生通过结果。最终目标需要同时包含更新、预期删除和新增。轮询与 Docker CLI 开销包含在观察耗时内。

首个配置限定为单 MySQL 8.4 源、单 PostgreSQL 17.12 目标、单主键表、固定宽度 ASCII 正文和 LOCAL 日志。加载源数据会预热缓存，不是冷存储试验。它不测目标极限吞吐、p95/p99 事件延迟、持久化 SNAPSHOT_END 确认、故障切换 RTO 或稳态饱和性能，也不能证明 JSON/无主键/大量表、多目标、外部日志、商业数据库或集群的性能。

## 建立硬件标准

保留原始报告，每种负载与资源组合至少执行三轮，报告中位数及范围。比较时保持发布包、版本、持久化条件、数据集和存储一致；记录宿主机空闲/有负载状态、磁盘延迟/IOPS、网络 RTT/带宽、资源利用率及持续积压增长。不能根据 CPU 配额或小型本地试验线性外推。

最终参考矩阵仍需独立物理机、远端目标、行宽/事务/表数量变化、全部目标与两种日志模式、长期运行、消费者背压、容量耗尽及带积压恢复验收。单次小规模通过只能证明工具在该数据集可用，不代表整个硬件标准完成。

## 已记录的工具冒烟验收

[原始报告](/files/docs/benchmarks/2026-11-15-mysql84-postgres17-smoke.json)：初始 1,000 行、正文 256 字节，增量 1,200 次行变更；两阶段完整行字节流 SHA-256 均一致，隔离资源清理成功。实际 MySQL 8.4.13 / PostgreSQL 17.12 / Temurin 8u512；每容器 1 CPU、1 GiB，Worker 堆 256 MiB。宿主机 Apple M1 Pro / 16 GiB，Docker 虚拟机与其他负载共享，开始时负载均值 66.59。记录到包含启动的全量可见耗时 23.08 秒、包含源写入的增量追平 1.94 秒。该结果验证工具可用，**不是**具有代表性的容量结果或硬件标准，也不代表多轮或饱和测试完成。

## 运行时与日志配置

`--java 8|11|17|21|25` 选择对应 Temurin JRE 的 Worker 镜像，默认 8。`--journal-mode LOCAL|EXTERNAL` 默认 LOCAL；EXTERNAL 使用目标 PostgreSQL 同一实例上的独立日志 schema，日志与目标争用该容器资源，不代表远程独立日志性能。示例：

```bash
python3 tests/benchmark.py --java 21 --journal-mode EXTERNAL --rows 1000 \
  --storage-description '填写实际存储及共享宿主机负载'
```

可以选择运行时不等于兼容性已经验收，需要检查通过的原始报告和实际 JVM 版本。这个 SQL 配置只能证明该运行时的 MySQL 源/PostgreSQL 目标全量/增量路径；消息、安全、故障切换及其他驱动仍需单独验收。

可以使用同一个未改变的发布包，顺序验证所列全部 JRE 与两种日志：

```bash
python3 tests/runtime-matrix.py --rows 1000 \
  --storage-description '记录物理存储、虚拟机限制及共享宿主机资源竞争'
```

矩阵在 `target/runtime-matrix/<id>/matrix.json` 保留进度、逐配置日志及原始报告引用，单项失败后继续其他独立配置。通过必须同时满足源/目标字节一致、实际日志后端已观察到、清理成功、实际 JVM 版本正确及发布包 SHA-256 一致；发布包改变会终止矩阵。它仍是小规模 SQL 运行时检查，不代表所有适配器在所有 JRE 都已验证。不要与其他集成测试或重新构建同时运行。

## 已通过的 SQL 运行时矩阵

[10 项矩阵](/files/docs/benchmarks/2026-11-15-runtime/matrix.json) 已全部通过：Temurin 8u512、11.0.33、17.0.21、21.0.13、25.0.5，分别使用 LOCAL 与 PostgreSQL EXTERNAL 日志。每轮加载 1,000 行、执行 1,200 次行变更，两阶段完整有序行字节摘要一致，核对了实际日志存储及 JVM 版本，所有隔离资源均清理成功。统一发布包 SHA-256 为 `2985bbbb51b84ec8de97d8a9b44c88d5a5a1d737032b1e13263d03d4a9134aa0`。

[归档索引](/files/docs/benchmarks/2026-11-15-runtime/archive-index.json) 列出每项未改动的原始报告及 SHA-256，原始矩阵保留工作区报告路径。它们是繁忙共享宿主机上的小规模运行时验证，不用于跨 JRE 吞吐比较，也不代表所有适配器兼容。首次 JVM 启动耗时波动很大，进一步说明这些结果不能作为硬件容量标准。
