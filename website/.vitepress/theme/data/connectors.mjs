import catalog from '../../data/connectors.json'

const profiles = {
 MYSQL_SOURCE: [
  'Temurin 21 已验证 5.7.44、8.0.46、8.2.0 和 8.4.13 的单机、异步 GTID 提升及三节点单主组复制档案。需要 InnoDB、GTID 与 ROW/FULL 日志。',
  'Scoped Temurin 21 tests cover all four MySQL versions from 5.7.44 to 8.4.13 in standalone, asynchronous GTID promotion and three-member single-primary groups. Requires InnoDB, GTID and ROW/FULL binlogs.'
 ],
 MYSQL_SINK: [
  '独立 MySQL 8.4 实例。全量、CDC 与重启续传有验证记录，业务写入和目标断点在同一事务提交。',
  'Separate MySQL 8.4 instance. Verified snapshot, CDC and restart recovery. Business rows and target checkpoints commit together.'
 ],
 POSTGRESQL_SOURCE: [
  '实验性。17.12 / 18.7 使用 pgoutput。已验证指定 17.12 同步槽提升、18.7 存储型生成列，以及 17.12 BYTEA / TOAST 重启后继续写入两类 SQL 目标。',
  'Experimental pgoutput profiles on 17.12 and 18.7. Scoped tests cover 17.12 synchronized-slot promotion, 18.7 stored generated columns, and 17.12 BYTEA/TOAST restart into both SQL targets.'
 ],
 ORACLE_SOURCE: [
  '实验性。Oracle Free 26ai 单 PDB，Flashback 全量与归档 LogMiner 增量写入 PostgreSQL。已验证原 SCN 重启和 DDL 停驻。需另备 Oracle JDBC。',
  'Experimental Oracle Free 26ai single-PDB profile. Flashback snapshots and archived LogMiner deliver to PostgreSQL. Original-SCN restart and DDL refusal verified. Requires a separately supplied Oracle JDBC driver.'
 ],
 POSTGRESQL: [
  '17.12 已验证全量、增量、重启与 JSON，按事务提交目标断点。受控恢复另有 PostgreSQL 17 专项记录。',
  '17.12 has snapshot, CDC, restart and JSON evidence with transactional target checkpoints. PostgreSQL 17 has separate reviewed recovery evidence.'
 ],
 GAUSS_POSTGRESQL: [
  '7.0.0-RC3 有全量、CDC 与恢复档案。上线前检查索引降级、约束与应用写入条件。',
  '7.0.0-RC3 has snapshot, CDC and recovery evidence. Review index downgrades, constraints and application writes before cutover.'
 ],
 GAUSSDB: [
  '共用 GAUSS 目标入口，已实现索引预检与映射。商业分布式产品缺少原生实测，不能沿用 openGauss 的验收结果。',
  'Uses the GAUSS target path with index preflight and mapping. Native distributed commercial GaussDB has no accepted test profile.'
 ],
 DM: [
  'DM8.1.4.80，原生模式 0 / UTF8 / blank 1，驱动 8.1.3.140。首批全量、CDC、故障恢复与类型映射已验证，其他模式和集群另验。',
  'DM8.1.4.80 native mode 0 / UTF8 / blank 1 with driver 8.1.3.140. Initial snapshot, CDC, restart and conversion coverage. Other modes and clusters remain open.'
 ],
 KINGBASE: [
  'V009R001C001B0025，PG/UTF8，驱动 9.0.1。首批全量、CDC、无主键与故障恢复已验证。其他兼容模式、RAC 和分布式未验收。',
  'V009R001C001B0025 in PG/UTF8 mode with driver 9.0.1. Initial snapshot, CDC, keyless rows and recovery are verified. Other modes, RAC and distributed deployments remain open.'
 ],
 GBASE_8C: [
  'V6_S1.3.0B19，PG/UTF8，JDBC 3.0.0B02。首批全量、CDC、无主键与故障恢复已验证。8a 和 8s 单独跟踪。',
  'V6_S1.3.0B19 in PG/UTF8 mode with JDBC 3.0.0B02. Initial snapshot, CDC, keyless rows and recovery are verified. 8a and 8s are tracked independently.'
 ],
 OCEANBASE: [
  'CE 4.3.5.6 ARM64 的 MySQL 兼容租户通过指定原生事务、快照、CDC、Worker 重启和 SQL 故障修复。Oracle 兼容模式和集群待验收。',
  'The CE 4.3.5.6 ARM64 MySQL-mode tenant passed scoped transaction, snapshot, CDC, Worker restart and SQL recovery tests. Oracle mode and cluster profiles remain open.'
 ],
 CLICKHOUSE: [
  '25.8.33.6 单节点，原生 HTTP/RowBinary、版本化物化及 FINAL 视图。已演练独立停机和重启续传，集群另验。',
  '25.8.33.6 direct single server using HTTP/RowBinary and versioned FINAL views. Independent outage and restart recovery tested. Cluster profiles remain open.'
 ],
 DORIS: [
  '4.1.3 ARM64，原生 Stream Load、Unique MoW 视图和持久回执。已有联合恢复验证，集群、TLS 和容量另验。',
  '4.1.3 ARM64 using Stream Load, Unique MoW views and durable receipts. Mixed recovery tested. Cluster, TLS and capacity remain open.'
 ],
 HIVE: [
  '4.0.1 ARM64 单 HiveServer2，ACID ORC 历史与视图。已有联合恢复验证。读写端须关闭查询结果缓存；集群和跨表原子可见性不在范围内。',
  '4.0.1 ARM64 with one HiveServer2, ACID ORC history and views. Mixed recovery tested. Disable query result caching for readers and writers. Cross-table atomic visibility and clustered deployment are outside this profile.'
 ],
 KAFKA: [
  '3.9.2 单分区专用 Topic 有 KRaft Leader 切换、ISR 不足拒绝及原消费位点恢复记录。Kafka 4.1.2 的物理 Topic ID 缺口通知与回执采用独立配置。',
  'Kafka 3.9.2 dedicated single-partition topics have KRaft leader election, insufficient ISR refusal and consumer offset recovery evidence. Physical Topic ID gap notices and receipts on 4.1.2 use a separate profile.'
 ],
 RABBITMQ: [
  '4.1.4 三成员 quorum 队列已验证 Leader 故障、少数派拒绝、重放和消费者确认。TLS 与容量待验收。',
  'The 4.1.4 three-member quorum queue has leader-loss, minority refusal, replay and consumer acknowledgement evidence. TLS and capacity remain open.'
 ],
 PULSAR: [
  '4.0.14 持久非分区 Topic 有全量、CDC 和重启记录。另有指定双 Broker、三 BookKeeper、TLS/JWT 和原账本回执核对档案。',
  '4.0.14 persistent non-partitioned topics have snapshot, CDC and restart evidence. Scoped profiles cover two brokers, three BookKeepers, TLS/JWT and original-ledger receipt review.'
 ],
 ROCKETMQ: [
  'Broker 5.5.0 / 客户端 5.5.1。指定档案支持原生提交回执与只读核对，可选 Controller 提升使用三个数据副本并要求至少两个同步副本。',
  'Broker 5.5.0 / client 5.5.1. Scoped profiles cover native commit receipt review and opt-in Controller promotion with three data replicas and at least two in sync.'
 ],
 NATS_JETSTREAM: [
  '2.11.8 File 存储。有三副本、客户端 TLS、Leader 故障、失去多数派拒绝、恢复后重试及原流回执核对记录。',
  '2.11.8 File streams. Tests cover three replicas, client TLS, leader loss, majority-loss refusal, retry after recovery and original-stream receipt review.'
 ],
 REDIS_STREAMS: [
  '7.4.2 直连档案有外部提升、WAITAOF 和消费者确认记录。8.0.2 有私有 CA、ACL 和原 AOF 冷重启记录。回执核对读取保存的条目 ID。',
  'The 7.4.2 direct profile covers operator promotion, WAITAOF and consumer acknowledgements. A separate 8.0.2 profile covers a private CA, ACL and original-AOF cold restart. Receipt review reads the retained entry ID.'
 ],
 ACTIVEMQ_CLASSIC: [
  '5.19.12 KahaDB。已验证原生事务、指定消费者确认、共享存储主备及旧非空备份拒绝。精确故障核对需已确认的新格式回执。',
  '5.19.12 KahaDB. Native transactions, selected consumer acknowledgement, shared-store failover and stale nonempty backup refusal have evidence. Exact failure review requires the current receipt format.'
 ],
 ACTIVEMQ_ARTEMIS: [
  '2.57.0 / Core 客户端 2.19.1，持久非破坏性队列。有共享存储主备、旧备份拒绝以及原队列回执核对记录。',
  '2.57.0 / Core client 2.19.1 with a persistent non-destructive queue. Evidence covers shared-store failover, stale backup refusal and receipt lookup in the original queue.'
 ]
}
const names = {
 MYSQL:'MySQL',POSTGRESQL:'PostgreSQL',ORACLE:'Oracle',GAUSS_POSTGRESQL:'openGauss',GAUSSDB:'GaussDB',
 DM:['达梦 DM','DM'],KINGBASE:['金仓 KingbaseES','KingbaseES'],GBASE_8C:'GBase 8c',GBASE_8A:'GBase 8a',GBASE_8S:'GBase 8s',OCEANBASE:'OceanBase',
 CLICKHOUSE:'ClickHouse',DORIS:'Apache Doris',HIVE:'Apache Hive',KAFKA:'Apache Kafka',PULSAR:'Apache Pulsar',
 RABBITMQ:'RabbitMQ',ROCKETMQ:'RocketMQ',NATS_JETSTREAM:'NATS JetStream',REDIS_STREAMS:'Redis Streams',
 ACTIVEMQ_CLASSIC:'ActiveMQ Classic',ACTIVEMQ_ARTEMIS:'ActiveMQ Artemis'
}
const domestic = ['GAUSS_POSTGRESQL','GAUSSDB','DM','KINGBASE','GBASE_8C','OCEANBASE','GBASE_8A','GBASE_8S']
const analytics = ['CLICKHOUSE','DORIS','HIVE']
const messaging = ['KAFKA','PULSAR','RABBITMQ','ROCKETMQ','NATS_JETSTREAM','REDIS_STREAMS','ACTIVEMQ_CLASSIC','ACTIVEMQ_ARTEMIS']
const manuals = {GAUSS_POSTGRESQL:'gaussdb-index-policy',GAUSSDB:'gaussdb-index-policy',DM:'dm-v3',KINGBASE:'kingbase-v3',GBASE_8C:'gbase8c-v3',OCEANBASE:'oceanbase-v3',CLICKHOUSE:'clickhouse-v3',DORIS:'doris-v3',HIVE:'hive-v3',ACTIVEMQ_CLASSIC:'classic-v3'}
export const statusLabels = {
 AVAILABLE:['已验证','Verified profile'],
 PARTIALLY_VERIFIED:['部分验证','Partially verified'],
 LIMITED_IMPLEMENTATION:['部分实现 · 待实测','Partial implementation · unverified'],
 EXPERIMENTAL:['实验性','Experimental'],
 PLANNED:['暂不支持 · 规划中','Not supported · Planned']
}
const localized = (values,locale)=>values[locale==='en'?1:0]
function familyOf(id){return domestic.includes(id)?'DOMESTIC':analytics.includes(id)?'ANALYTICS':messaging.includes(id)?'MESSAGING':'RELATIONAL'}
export function connectorName(id,locale){const name=names[id];return Array.isArray(name)?localized(name,locale):name}
export function connectorNote(row,locale){
 if(row.status==='PLANNED')return localized(['目前没有可运行的连接器。','A runnable connector is planned.'],locale)
 return localized(profiles[row.id+'_'+row.role]||profiles[row.id],locale)
}
export function connectorHref(row,locale){
 if(row.status==='PLANNED')return `/docs/${locale}/start/roadmap.html`
 const sourceManual=row.role==='SOURCE'?{POSTGRESQL:'postgresql-source',ORACLE:'oracle-source'}[row.id]:undefined
 const manual=sourceManual||manuals[row.id]||(messaging.includes(row.id)?'messaging-v3':'pipeline-v3')
 return `/docs/${locale}/reference/${manual}.html`
}
// The Java catalog groups GAUSS targets. Present the verified openGauss and unverified commercial profile separately.
const rows = catalog.flatMap(row=>row.id==='GAUSS_POSTGRESQL'?[row,{id:'GAUSSDB',role:'SINK',status:'LIMITED_IMPLEMENTATION'}]:[row])
export const products = [...new Set(rows.map(row=>row.id))].map(id=>({id,family:familyOf(id),entries:rows.filter(row=>row.id===id)}))
