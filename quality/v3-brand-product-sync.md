# RivoMesh 官网 V3.0 交付记录

官网以 VitePress 现有架构交付。产品事实基线为 Java 仓库提交 `5c545222c4175e8407196636725063861a69d4b2`。文档导入固定读取一次提交的 Git 树，记录每篇文档、目录源码的 SHA-256 和提交号。验证基线记录了继承的历史证据与各候选包新增证据。该快照的 48 项 SDD 中，13 项完成对应范围、30 项部分实现、5 项新增待实现。[文档来源清单](../website/public/source-snapshot.json) · [验证基线](../website/docs/zh/evidence/baseline.md)

下表路径相对 Java 仓库。应用类位于 `sync-app/src/main/java/io/github/rivomesh/`，测试类位于其对应的 `src/test/java` 目录。实测指对应原始候选包和所列环境。

## 产品能力、证据与官网变更

| 能力 | 实现与验证 | 源码、手册或验收 | 官网变更 |
| --- | --- | --- | --- |
| 采集源 | MySQL 支持全量、GTID CDC 和断点恢复。5.7.44 与 8.4 有多目标格式记录，8.0 有旧格式主备档案，8.2.0 有开发集成记录，首版验收与主备矩阵待补。PostgreSQL、Oracle 列入规划。 | `MysqlCdcSource.java`、`SourceSelector.java`、`PipelineEngine.java`、`platform/AdapterCatalog.java`、`tests/mysql57-run.sh`、`tests/v3-ha-run.sh` | 首页与目录只列 MySQL 为可运行源。兼容性页标明版本及日志前置条件。 |
| 全量衔接与恢复 | 按表保留一致性读视图、基线与校验分片。失去未完成表的读视图后重读整表，目标按已提交分片续投。源事务与采集位置原子落日志。 | `MysqlCdcSource.java`、`PipelineEngine.java`、`cdc/JdbcJournal.java`、`cdc/SnapshotDispatcher.java`、`docs/en/pipeline-v3.md` | 首页流程图和架构说明展示快照、CDC、持久日志、Worker 与断点。 |
| 映射和数据语义 | 一个逻辑 MySQL 源显式映射多库，支持自动创建缺失表、逐目标线程、JSON、受支持的生成列和无主键重复行标识。业务 UNIQUE 可显式降级为普通索引，业务写切换前需恢复约束。运行中 DDL 会阻断。 | `PipelineConfig.java`、`PipelineEngine.java`、`cdc/JdbcSink.java`、`cdc/NormalizedJournal.java`、`docs/en/pipeline-v3.md`、`docs/en/gaussdb-index-policy.md` | 使用指南与同步手册链接到类型、索引和首次空目标要求。 |
| SQL 目标 | PostgreSQL 17.12、独立 MySQL 8.4 有全量、CDC、重启记录。openGauss 7.0.0-RC3 有指定验证。商业分布式 GaussDB 共用 GAUSS 入口，原生验证缺失。 | `PipelineSinks.java`、`platform/AdapterCatalog.java`、`docs/en/gaussdb-index-policy.md` | 目录按方向显示，拆开 openGauss 与商业 GaussDB。逐目标提交业务数据与断点。 |
| 信创关系目标 | 达梦原生 0 / UTF8 / blank 1、金仓 PG/UTF8、GBase 8c PG/UTF8 有首批全量与恢复测试，仍为实验性。OceanBase CE 4.3.5.6 MySQL 模式有原生事务、快照及部分 CDC 记录，完整联合恢复未通过。GBase 8a/8s 规划中。 | `docs/en/{dm,kingbase,gbase8c,oceanbase}-v3.md`、`tests/{dm,kingbase,gbase8c,oceanbase}-pipeline-run.sh` | 中英文适配指南复用目录数据，逐项列明版本、兼容模式与证据。 |
| 分析目标 | ClickHouse 25.8.33.6 直连 HTTP/RowBinary、Doris 4.1.3 Stream Load 有首批联合恢复记录。Hive 4.0.1 ACID ORC 有首批原生与混合验证，状态保留实验性，读写端都要关闭查询结果缓存。 | `cdc/{ClickHouse,Doris,Hive}Sink.java`、`docs/en/{clickhouse,doris,hive}-v3.md` | 完整目录列明物化、视图与回执语义，以及集群、TLS 或跨表可见性边界。 |
| 消息目标 | Kafka、RabbitMQ、Pulsar、RocketMQ、NATS JetStream、Redis Streams、ActiveMQ Classic、Artemis 已接入。各有确认和重启档案。Artemis 的完整混合链路待验。 | `cdc/MessageSink.java`、`platform/AdapterCatalog.java`、`docs/en/messaging-v3.md`、`docs/en/classic-v3.md`、`tests/messaging-run.sh` | 目录逐项给出版本、ACK 模式及验证缺口。Kafka 生产者幂等、RabbitMQ publisher confirm、Pulsar BookKeeper、RocketMQ 同步刷盘、JetStream ACK、Redis 同连接 WAITAOF 与两个 ActiveMQ 持久模式分别描述。消费者需要去重及自行跟踪业务处理。 |
| 日志与故障隔离 | 本地 H2 或外部 PostgreSQL/openGauss/独立 MySQL。每个目标独立投递、确认、暂停与恢复，受慢目标保留和日志配额限制。具备 GTID 条件的源候选切换及外部日志主备有指定验证。 | `PipelineEngine.java`、`cdc/JdbcJournal.java`、`cdc/FanoutDispatcher.java`、`docs/en/{pipeline-v3,recovery}.md` | 架构与首页分开解释源位点、目标 ACK、控制库和日志。 |
| 校验与审阅修复 | COMMON_CUT 逐行校验、差异查看与管理员评审修复，有 MySQL 8.4/PostgreSQL 17 指定环境记录。 | `PipelineReconciliation.java`、`PipelineRepair.java`、`docs/en/{managed-validation,managed-repair}.md` | 校验指南和真实产品界面说明共同点、差异与修复步骤。 |
| 失败事务恢复新增 | RC-02 留证和分页审阅，RC-05 原生提交确认，RC-03 完整事务跳过与持久缺口已有验收。普通 Resume 保留原事务重试，人工操作显式审批。 | `platform/{ConsoleServer,TaskService}.java`、`cdc/{JdbcSink,JdbcSkipJournal}.java`、`docs/verification/{README.md,baseline.json}` | 新增故障处理入口与中英文详细手册，修正旧版「手工跳过尚未实现」文字。 |
| 缺口复核新增 | RC-08 支持按审阅计划在围栏内重新扫描，并原子记回执。PostgreSQL 17 有固定 Agent 真实 CDC；MySQL 8.4 有原生合同。历史截面验证保留 SKIP，处理覆盖含跳过，连续应用停在首个缺口前。 | `cdc/{JdbcGapVerification,JdbcGapVerificationLedger}.java`、`docs/en/gap-verification.md`、`tests/global-control-pipeline.py` | 首页可靠性入口、监控和校验页说明两种水位及验证边界。 |
| 补偿与目标行修正新增 | RC-06 按前镜像恢复，RC-07 支持类型化录入、JSON 导入、变更前后预览与审批。PostgreSQL 17 有真实 CDC，MySQL 8.4 有原生合同。保持暂停，核对后显式重放原事务。 | `cdc/{TransactionCompensation,CorrectionBatch}.java`、`platform/{CompensationRequest,CorrectionRequest}.java`、`tests/ui/recovery-cases.mjs`、`target/current-verification/correction-cdc/manifest.json` | 导入两份双语手册，更新控制台、故障处理、实施状态与路线图。 |
| 单机控制 | 中英文向导、隔离 JVM Worker、状态/积压、配置编辑及修订恢复，CLI 支持检查、运行、状态、暂停/续投等，配置与部署为 YAML。账号、角色、任务授权、令牌轮换、浏览器会话与审计均有实现。 | `Main.java`、`PipelineMain.java`、`platform/{TaskWorker,AccessControl,AccountDirectory,AuditStore,BrowserSessions,ConfigurationVersions}.java`、`sync-app/src/main/resources/console/` | 控制台、安装、权限及产品导览随快照更新，工作台截图标明版本。 |
| 多节点控制 | 单机默认，启用共享控制库可观察节点并共享账号、会话与审计。固定 Agent 模式支持跨入口持久任务命令和管理/执行分离，已验证控制入口停机期间原 Worker 继续。自动迁移、自动跨 Agent 接管、全局排空和完整 HA 待实现。 | `platform/{NodeDirectory,GlobalControl,DurableCommands,OwnerRuntime,JdbcControlStore}.java`、`docs/en/{execution-lifecycle,first-release}.md`、CP-07 验收 | 架构、部署指南和路线图明确各部署模式及固定执行节点。删除过时的自动模式迁移启用说明。 |
| 构建与部署 | Maven Java 8 基线，Java 8/11/17/21/25 有部分场景记录。源码 JAR、Linux、非 root Docker/Compose、Kubernetes YAML 与 Helm。进程和就绪探针独立，共享控制指定 PostgreSQL 17/MySQL 8.4。真实 K8s/CSI 和完整 JDK/TLS 矩阵待验。 | `pom.xml`、`Dockerfile`、`deploy/docker-compose.yml`、`deploy/helm/rivomesh/`、`deploy/kubernetes/`、`config/platform*.yml` | 安装指南补充运行时、环境变量、日志与控制库分工、探针及首版固定模式。 |

工作期间 Java 工作区并发出现 RC-09 跨入口取消/提交结果恢复的未提交实现和 MySQL 8.2 扩展验证。RC-09 有定向构建与 DOM 记录，观察到的真实 CDC 清单仍为 FAIL。MySQL 8.2.0 开发夹具使用 MySQL 8.4 与 PostgreSQL 17 目标，`target/current-verification/mysql82-v3.log` 的应用模块汇总为 56 项通过（含单测与集成测试），缺少对应首版验收收录及完整主备、故障和 JDK 矩阵。这些工作区改动与验证保留原状，官网能力以已归档候选和对应证据为准。已验收的 RC-08 缺口复核取消仍在手册中。

## 品牌设计与素材

| 原创方案 | SVG 主标 | 设计要点 |
| --- | --- | --- |
| A 河流水獭 | [a.svg](../website/public/brand/concepts/a.svg) | 圆耳、宽吻和渐细尾部连成游水轮廓。16px 主要保留头与尾线，24px 起眼孔更清楚。作为正式标识。 |
| B 翠鸟 | [b.svg](../website/public/brand/concepts/b.svg) | 尖喙与俯冲剪影突出方向感，尾部细节在最小尺寸合并。 |
| C 燕子 | [c.svg](../website/public/brand/concepts/c.svg) | 后掠翼和分叉尾羽表达多路投递，最小尺寸的物种辨识较弱。 |

三案分别提供标准、浅色反稿、单色标识和浅底、深底、单色横版组合。中英文评审页展示对比表与 16/24/32/48px 实样。[中文评审](../website/brand-review.md) · [英文评审](../website/en/brand-review.md) · [栅格检视表](../website/public/brand/identity-review.png)

- 主色 Flow Blue `#2859a6`，Night Ink `#172a45`，Signal Teal `#247f7c`，Mist `#f7f9fc`。深底配浅蓝或白色反稿。
- 正式矢量素材包括 `logo.svg`、`logo-on-light.svg`、`logo-light.svg`、`logo-monochrome.svg`、`logo-monochrome-light.svg`、`logo-square.svg` 及四种 `wordmark*.svg`。
- 应用素材包括 `favicon.svg`、三帧 `favicon.ico`、180px Apple Touch Icon、512px GitHub/应用头像、中英文 1200×630 分享图（PNG 和 SVG）及检视表。
- 浅色、深色、单色与导航、页脚、首页和 Open Graph 共用同一水獭几何源。标准标识推荐 24px 以上，横版推荐 128px 宽以上，四周留标识高度的 ⅛。字标为原创矢量路径。[品牌规范](../website/brand.md) · [几何源](../tooling/brand/identity.mjs)

## 网站与验证

- 修改中英文首页、连接器与适配指南、产品导览、安装、架构、运维、验证及实施状态等页面。沿用 VitePress、侧栏、搜索、语言切换和 GitHub Pages 构建。合并已撤下的开发期证据页，对原 URL 生成跳转。
- 组件涉及首页、连接器目录、数据流、评审与品牌展示、产品截图及路线图。首页用工作台总览，产品区默认创建向导，另有连接器和目标恢复实拍。校验和多节点指南各配真实共同点报告及单节点登记画面。截图使用 900/1800px WebP，并保留可放大的原始 PNG。[截图来源与哈希](console-screenshots-v3.json)
- 中英文已有视频、旁白、字幕、章节、封面及文字稿继续用现有版本。静态预览网站对 MP4 的字节范围请求返回 HTTP 206。Chrome 和 WebKit 验证了点播前零 MP4 请求、播放、字幕选择与切换、章节定位、下载链接和文字稿。两者桌面及 Chrome Android 模拟通过进入/退出全屏。WebKit iPhone 模拟播放通过，该环境没有 DOM 全屏接口。
- 在 Chrome 检查 320、375、390、768、1024、1440、1920px 各十二条页面，无整页横向溢出。抽看两版首页、移动端、深色品牌与连接器截图。实测主题标识切换、键盘导航、截图 Escape 与焦点恢复、连接器筛选、语言对应路由、命令复制及减少动态效果。[浏览器结果](v3-browser.json)
- 原生 Safari WebDriver 需要已启用远程自动化，Safari 界面控制调用超时。实际 iPhone 与原生 Safari 播放器全屏未验收。浏览器检测结果明确以 Chrome 和 Playwright WebKit 环境为准。
- Java 侧只读取源码、原有验收和构建包，并用临时隔离数据库校验控制台。Helm lint/render 与 Docker Compose 配置解析通过。未将静态检查计为 Kubernetes 集群验收。

### 工程检查结果

| 检查 | 结果 |
| --- | --- |
| `npm run check` | 146 篇文档、1,073 个本地链接、48 项 SDD、32 个 SVG、12 张截图原图及其响应式派生、两套视频资源检查通过 |
| `npm test` | 4 个测试文件，29 项测试通过 |
| `npm run build` | 静态构建通过，生成 192 个兼容跳转，检查 16,182 个构建产物导航与资源 URL、160 页语言及 SEO 元数据 |
| `git diff --check` | 通过 |

项目目前通过 VitePress 构建与内容检查脚本校验应用，未配置独立 Lint 或类型检查命令。
