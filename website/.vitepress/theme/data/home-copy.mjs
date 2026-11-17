export const homeCopy = {
 zh:{
  release:'RivoMesh · 0.1.0-SNAPSHOT / 开发预览',hero:['数据库实时同步，','可靠连接每一份数据'],lead:'融合全量同步与 CDC 增量采集。多目标独立投递、持久断点恢复与可视化管理，让跨数据库数据流转更可靠、灵活、可控。',tags:['全量 + CDC','多目标独立恢复','Web 可视化管理'],start:'快速开始',docs:'查看文档',scope:'当前采集源为 MySQL；PostgreSQL、Oracle 源在规划中。',preview:'真实工作台 · 开发预览截图',tour:'产品导览',
  workflowLabel:'同步流程',workflowTitle:'从业务变化，到每一个下游。',workflowText:'采集、持久化与目标确认各有职责。看清数据经过哪里，也看清进度保存在哪里。',
  coreLabel:'核心能力',coreTitle:'为持续同步设计。',coreText:'初始化、分发与日常管理，沿用同一条可恢复的数据链路。',
  core:[
   {title:'全量与增量衔接',text:'先准备已有数据，再按基线衔接日志中的变化；已持久化的进度支撑重启续传。',link:'全量与恢复机制',href:'pipeline-v3',kind:'timeline',labels:['全量读取','增量追平','持续同步'],detail:'源快照与目标投递分别记录进度'},
   {title:'多目标独立恢复',text:'每个目标单独投递和确认。修复某个目标的 SQL 错误后，重试原事务，其他目标保留各自进度。',link:'故障隔离与恢复',href:'recovery',kind:'targets',labels:['目标 A · 持续投递','目标 B · 修复后重试','目标 C · 独立确认'],detail:'机制示意 · 各目标不组成分布式原子事务'},
   {title:'管理与校验有据可查',text:'从任务向导、配置历史到错误与校验报告，在管理界面中完成日常操作与差异审阅。',link:'校验与审阅修复',href:'managed-validation',kind:'check',labels:['检查配置','查看状态','审阅差异'],detail:'逐行校验与修复首批验证：MySQL / PostgreSQL'}
  ],
  connectorsLabel:'连接器',connectorsTitle:'连接不同数据库与数据系统。',connectorsText:'从常用数据库开始，按连接方向与实际验证范围选择；完整目录提供筛选和兼容性说明。',
  useLabel:'应用场景',useTitle:'把同步能力用在实际工作中。',
  cases:[
   {title:'跨数据库实时同步',text:'将 MySQL 中的数据持续复制到独立数据库目标，为下游读取提供更新的数据。',route:'scenarios'},
   {title:'异构数据库集成',text:'显式配置库映射，核对类型、时间精度与索引差异，按目标协议投递。',route:'connectors'},
   {title:'分析数据持续更新',text:'将业务快照与后续变化送入 ClickHouse、Doris 或 Hive，按各自视图与物化协议读取。',route:'scenarios'},
   {title:'迁移与并行验证',text:'为独立验证环境准备全量和增量数据，再单独制定应用接管、切换与回退方案。',route:'scenarios'}
  ],
  domesticTitle:'支持信创数据库适配与改造验证',domesticText:'在国产数据库迁移或替代评估中，先跑通代表性数据，再核对结构差异、持续变化和恢复行为。保留原业务库，逐步验证改造方案。',domesticSteps:['确定版本与兼容模式','全量 + 增量同步','核对数据与对象差异','演练恢复与切换准备'],domesticNote:'openGauss 部分验证；达梦、金仓、GBase 8c 和 OceanBase 为指定模式的实验性适配。商业 GaussDB 另需验证。',domesticCta:'阅读信创适配指南',
  experienceLabel:'产品界面',experienceTitle:'从创建任务到日常排障。',experienceText:'直接查看现有产品中的任务工作台、配置向导与连接器目录。',video:'观看中文讲解与字幕',
  reliabilityLabel:'架构与可靠性',reliabilityTitle:'每一步进度，都有明确的归属。',reliabilityText:'可靠性来自明确的持久化、确认与恢复协议。数据库、分析和消息目标按各自语义工作。',
  reliability:[
   ['保存事件与源端进度','源事务和采集位置在持久日志中一同提交，未持久化的位置不会冒充已完成。','pipeline-v3'],
   ['按目标确认与恢复','事务型目标提交业务数据与本地断点；消息目标为确认后的至少一次投递，消费者需去重。','messaging-v3'],
   ['核对共同检查点','校验比较历史检查点的实际数据，修复先审阅计划；不把一份报告当作此后一直完全相等。','managed-repair']
  ],
  clusterTitle:'多节点管理与恢复',clusterText:'共享节点、账号、会话与审计。可选固定执行节点全局控制及管理入口 / 执行 Agent 分离，首批档案已验收；自动跨 Agent 接管和完整故障矩阵仍待扩展。',clusterCta:'部署条件与边界',architecture:'完整架构',evidence:'测试与验收记录',limits:'已知限制',
  startLabel:'开始试用',startTitle:'从一个测试库开始。',startText:'选择源码构建或 Docker Compose，启动自己的控制台。首次使用独立空目标，先完成小规模同步与恢复验证。',startNote:'打开 http://127.0.0.1:8080，使用自己设置的令牌登录。数据库日志、账号权限及 HTTPS 配置见快速开始。',download:'源码与下载说明',
  trustTitle:'为开发者保留清晰入口。',trustText:'试用指南、技术架构与验证资料分层组织，便于从第一次同步继续深入。',trustLinks:['GitHub 源码','问题反馈','贡献指南','实现状态','版本与发布','验证档案']
 },
 en:{
  release:'RivoMesh · 0.1.0-SNAPSHOT / development preview',hero:['Reliable database replication.','Built for recovery.'],lead:'Bring snapshots and change data capture into one recoverable pipeline. Deliver to independent destinations, retain durable checkpoints, and manage synchronization through a web workspace.',tags:['Snapshot + CDC','Independent recovery','Web task management'],start:'Get started',docs:'Read the docs',scope:'MySQL capture is available today. PostgreSQL and Oracle sources are planned.',preview:'Real workspace · English development preview',tour:'Product tour',
  workflowLabel:'How it works',workflowTitle:'From a database change to every destination.',workflowText:'Capture, durable storage and target acknowledgements have distinct responsibilities. Follow the data and the progress that makes recovery possible.',
  coreLabel:'Core capabilities',coreTitle:'Designed for continuous replication.',coreText:'Initialize, distribute and operate data flows through one recoverable pipeline.',
  core:[
   {title:'Snapshots meet change capture',text:'Initialize existing data, then catch up against recorded baselines. Persisted progress supports continuation after restart.',link:'Snapshot & recovery model',href:'pipeline-v3',kind:'timeline',labels:['Snapshot','Catch up','Stream changes'],detail:'Source snapshot and target delivery keep separate progress'},
   {title:'Recover each destination independently',text:'Each target delivers and acknowledges separately. Fix a target SQL error and retry its original transaction while other targets retain their progress.',link:'Isolation & recovery',href:'recovery',kind:'targets',labels:['Target A · delivering','Target B · retry after repair','Target C · acknowledging'],detail:'Mechanism illustration · not a distributed atomic transaction'},
   {title:'Operate with context',text:'Create and check tasks, inspect configuration history, diagnose errors and review validation reports in the web workspace.',link:'Validation & reviewed repair',href:'managed-validation',kind:'check',labels:['Check configuration','Inspect progress','Review differences'],detail:'Initial row validation/repair profile: MySQL / PostgreSQL'}
  ],
  connectorsLabel:'Connectors',connectorsTitle:'Connect databases and downstream systems.',connectorsText:'Start with representative databases. Source and sink profiles retain their own status; explore the full catalog for versions and compatibility.',
  useLabel:'Use cases',useTitle:'Put continuous data movement to work.',
  cases:[
   {title:'Cross-database replication',text:'Continuously copy MySQL data into a dedicated database target to keep downstream reads up to date.',route:'scenarios'},
   {title:'Heterogeneous integration',text:'Map databases explicitly and review type, temporal and index differences before delivering to each target.',route:'connectors'},
   {title:'Continuously updated analytics',text:'Send snapshots and changes to ClickHouse, Doris or Hive, using their documented views and materialization protocols.',route:'scenarios'},
   {title:'Migration & parallel validation',text:'Populate an independent validation environment, then plan application compatibility, cutover and rollback separately.',route:'scenarios'}
  ],
  domesticTitle:'Validate domestic database compatibility',domesticText:'Evaluate migration to openGauss, DM, KingbaseES, GBase 8c and OceanBase using representative data. Review schema and type differences, incremental changes and recovery before planning application cutover.',domesticSteps:['Confirm version & mode','Replicate snapshots & changes','Compare data & schema behavior','Rehearse recovery'],domesticNote:'openGauss is partially verified. DM, KingbaseES, GBase 8c and OceanBase have experimental, profile-specific adapters. Commercial GaussDB needs separate verification.',domesticCta:'Database adaptation guide',
  experienceLabel:'Product experience',experienceTitle:'See the workspace you will use.',experienceText:'Explore existing task controls, configuration steps and connector profiles through original product screenshots.',video:'Watch the narrated tour with English subtitles',
  reliabilityLabel:'Architecture & reliability',reliabilityTitle:'Know where progress is committed.',reliabilityText:'Recovery depends on explicit storage and acknowledgement protocols. Database, analytics and messaging targets use different delivery semantics.',
  reliability:[
   ['Persist events and source position','Source transactions and capture position commit together in the journal. Unpersisted progress is not reported as complete.','pipeline-v3'],
   ['Acknowledge per destination','Transactional targets commit data with a local checkpoint. Messaging is confirmed at least once; consumers must deduplicate.','messaging-v3'],
   ['Validate a common checkpoint','Compare actual data at a historical checkpoint, review a repair plan, and explicitly resume. A report is not a guarantee of permanent equality.','managed-repair']
  ],
  clusterTitle:'Multi-node management & recovery',clusterText:'Share node observations, accounts, sessions and audit. Optional fixed-owner controls and separate management/Agent lifecycles have initial acceptance profiles. Automatic cross-Agent failover and the full fault matrix remain open.',clusterCta:'Deployment requirements & scope',architecture:'Architecture reference',evidence:'Acceptance records',limits:'Known limitations',
  startLabel:'Get started',startTitle:'Start with a small test database.',startText:'Build from source or use Docker Compose to start your own console. Use a dedicated empty target and verify a small pipeline before expanding the scope.',startNote:'Open http://127.0.0.1:8080 and sign in with your own token. See the quick start for database logging, privileges and HTTPS settings.',download:'Source & download options',
  trustTitle:'Explore the project at your own depth.',trustText:'Move from the first pipeline to architecture, operating guides and profile-specific verification records.',trustLinks:['Source on GitHub','Report an issue','Contribute','Implementation status','Versions & downloads','Verification archives']
 }
}
