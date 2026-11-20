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

## 10 万行实测参考

两种日志模式各执行一次，使用相同候选包、MySQL 8.4.13、PostgreSQL 17.12 与 Temurin 8u512。宿主机为 Apple M1 Pro ARM64、10 个逻辑 CPU、16 GiB 内存，Docker Desktop 使用 SSD。每个服务限 1 CPU 和 1 GiB。Worker JVM 堆与数据库缓冲区各为 256 MiB。每行有 1,024 字节负载，快照每片 1,000 行，源端每事务最多 500 条变更。

| 日志 | 全量可见耗时 | 全量行/秒 | 12 万条变更可见耗时 | 变更/秒 | 源端写完后追平 |
|---|---:|---:|---:|---:|---:|
| LOCAL，宿主机挂载 | 24.83 秒 | 4,027 | 53.55 秒 | 2,241 | 23.13 秒 |
| EXTERNAL，目标 PostgreSQL 独立 schema | 21.61 秒 | 4,628 | 46.25 秒 | 2,595 | 14.04 秒 |

两组在全量后和增量后都通过源目标内容哈希核对。排查时，相同堆大小的 Worker 曾因单批载入过多事务耗尽内存。当前日志读取将每批事务前缀限制为 8 MiB，超过上限的首笔事务单独处理。PostgreSQL 压测的 UPDATE 将主键参数绑定为 BIGINT 后，执行计划从全表扫描切换为主键索引扫描。超大单事务和海量表需要另测。[实测报告和候选包](/files/docs/verification/baseline.json)

## Temurin 21 多轮硬件参考

宿主机为 Apple M1 Pro ARM64，10 个逻辑 CPU、16 GiB 内存。Docker Desktop 29.9.2 报告 10 个 vCPU、15.6 GiB 内存。各配置使用同一发布包，MySQL 8.4.13、PostgreSQL 17.12 和 Temurin 21.0.13+9。每种配置独立运行三轮，三个容器各限 1 GiB 及表中 CPU 数，Worker 堆 256 MiB。数据库使用持久化夹具卷。LOCAL 日志使用宿主机挂载，EXTERNAL 日志位于目标 PostgreSQL 的独立 schema。

每轮全量 20,000 行，每行有效载荷 256 字节，随后核对 24,000 条新增、更新和删除。表中括号为三轮最小值至最大值。

| 日志 | 每容器 CPU | 全量行/秒中位数 | 增量变更/秒中位数 | 源端写完后追平中位数 |
|---|---:|---:|---:|---:|
| LOCAL | 1 | 1,943（1,758–2,222） | 2,983（2,133–3,699） | 0.27 秒（0.26–0.42） |
| LOCAL | 2 | 2,986（2,442–3,345） | 2,962（2,954–3,000） | 0.29 秒（0.29–0.36） |
| EXTERNAL | 1 | 2,558（2,469–2,763） | 2,925（2,784–3,030） | 1.00 秒（0.88–1.29） |
| EXTERNAL | 2 | 3,143（1,554–3,382） | 3,038（2,169–3,472） | 0.36 秒（0.28–0.37） |

12 轮全量与增量均核对了排序后的源、目标数据字节。追平判定同时核对首尾主键，因为仅完成更新的中间状态也可能满足最终行数和版本合计。全量计时包含 Worker 启动，增量计时包含源端写入。测量值适用于该负载、资源配额和宿主机。[各轮实测、镜像与候选包](/files/docs/verification/baseline.json)

## 256 库映射与单笔大事务

同一候选包另测单个 MySQL 实例中的 256 个数据库，逐库映射到 PostgreSQL 的 256 个 schema。每库一张有主键的表、两行数据，每行载荷 8,192 字节。三个容器各限 2 CPU 和 1 GiB，Worker 堆 256 MiB，使用 LOCAL 日志。

| 检查 | 观测耗时 |
|---|---:|
| Worker 启动至 256 张表的快照全部持久确认 | 25.84 秒 |
| 同一事务的 768 条变更，共 8,505,279 字节 binlog，提交并在目标确认 | 4.32 秒 |
| 强杀后重启，追平停机期间提交的 256 条变更 | 21.42 秒 |

每阶段对两个数据库排序后的全部 512 行与夹具预期内容逐字节核对。强杀重启后原快照 ID 保持一致。复现需要 Python 3.11 或更高版本和 Docker Compose。

```bash
python3 tests/catalog-benchmark.py \
  --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --output target/catalog-256 --schemas 256 --payload-bytes 8192 --cpus 2
```

[内容摘要与实际夹具资源](/files/docs/verification/baseline.json)

## 慢目标与外部日志配额

慢目标场景使用独立 PostgreSQL 实例存储外部日志。默认映射 32 个数据库，每行载荷为 8,192 字节。源库提交 24 笔事务，每笔更新各库一条有主键的记录，binlog 保留完整前后镜像。四个服务各使用指定 CPU 配额和 1 GiB 内存上限，Worker 堆为 256 MiB。

```bash
python3 tests/catalog-benchmark.py --slow-target \
  --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --output target/catalog-slow-target --schemas 32 --payload-bytes 8192 --cpus 2
```

快照全部确认后，夹具仅暂停目标容器，并在日志库仍可访问时观察到 `JOURNAL_BACKPRESSURE`。至少连续观察 5 秒，源端的持久采集偏移和目标确认序号应保持原值，采集偏移应落后于源端最终偏移。每次检查待确认事务、快照和行身份记录的逻辑字节总和均在配额内，配额按 `12 × 映射库数 ×（载荷字节数 + 1,024）` 计算。报告分别记录观测到的逻辑峰值及日志表空间用量。表空间包括表、索引及 TOAST，不含 WAL 和数据库的其他文件。

夹具在目标暂停期间强杀 Worker，解除目标暂停后启动新 Worker。恢复后必须使用原日志世代及更高的租约纪元，追至源端的最终偏移和目标确认序号，并逐字节核对排序后的源目标数据及原快照 ID。恢复耗时从启动新 Worker 计至最终事务确认。

使用同一 Temurin 21 候选包、每个服务 2 CPU 时，源端提交 768 条变更并写入 12,724,136 字节 binlog。采集序号 3 与目标确认序号 0 在 9 次观测、共 5.34 秒内保持稳定。观测到的日志逻辑峰值为 3,244,602 字节，配额为 3,538,944 字节。停滞点的日志表空间为 638,976 字节。强杀重启后 18.76 秒追到源端最终偏移及确认序号 24。64 行数据全部一致，32 个快照 ID 保持一致，回收后待确认日志逻辑字节归零。[候选包、实测与内容摘要](/files/docs/verification/baseline.json)

## 建立硬件标准

保留原始报告，每种负载与资源组合至少执行三轮，报告中位数及范围。比较时保持发布包、版本、持久化条件、数据集和存储一致；记录宿主机空闲/有负载状态、磁盘延迟/IOPS、网络 RTT/带宽、资源利用率及持续积压增长。不能根据 CPU 配额或小型本地试验线性外推。

更广的硬件参考矩阵仍需独立物理机、远端目标、行宽/事务/表数量变化、其他目标、长期运行和消费者背压。慢目标实测覆盖所列配额和负载下的一套带独立外部日志的 SQL 目标。

## 工具验证范围

早期进程与日志结果保留当时的制品、JVM 和验收范围。当前候选容量测试统一使用 Eclipse Temurin 21 LTS，比较结果时核对原硬件、负载和存储。[验收基线](/files/docs/verification/baseline.json) · [固定历史快照](https://github.com/rivomesh/rivomesh/blob/419945c98f197bd6cc1c6cc3e75e9c6a4bb3188c/docs/verification/baseline.json)

## 运行时与日志配置

基准测试使用 Temurin 21。`--journal-mode LOCAL|EXTERNAL` 默认 LOCAL；EXTERNAL 使用目标 PostgreSQL 同一实例上的独立日志 schema，日志与目标争用该容器资源，不代表远程独立日志性能。示例：

```bash
python3 tests/benchmark.py --java 21 --journal-mode EXTERNAL --rows 1000 \
  --storage-description '填写实际存储及共享宿主机负载'
```

可以选择运行时不等于兼容性已经验收，需要检查通过的原始报告和实际 JVM 版本。这个 SQL 配置只能证明该运行时的 MySQL 源/PostgreSQL 目标全量/增量路径；消息、安全、故障切换及其他驱动仍需单独验收。

可用同一个 Temurin 21 发布包，顺序比较两种日志模式和不同 CPU 配额：

```bash
python3 tests/runtime-matrix.py --rows 20000 --cpu-limits 1 2 --repeat 3 \
  --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  --storage-description '记录物理存储、虚拟机限制及共享宿主机资源竞争'
```

矩阵在 `target/runtime-matrix/<id>/` 保留进度、逐轮日志及原始报告引用。每轮启动独立的服务，核对源与目标字节、实际日志后端、清理结果、实际 JVM 版本、发布包 SHA-256 及三个容器的 CPU 配额。单轮失败后继续其余测量，只有所有轮次通过的配置才报告中位数和范围。发布包改变会终止矩阵。测量期间避免运行其他竞争资源的任务及重新构建发布包。

### Controller、Agent 与 Worker 运行时验收

使用同一个发布包在 Temurin 21 上启动实际进程，验证 MySQL 到 PostgreSQL / MySQL 的全量和增量。结果记录各角色的真实 JVM 版本、架构及包摘要。

```bash
python3 tests/control-runtime.py --suite processes \
    --artifact sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
    --output target/control-runtime-processes
```
