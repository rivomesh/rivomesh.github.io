import catalog from '../../data/connectors.json'

const profiles = {
 MYSQL_SOURCE: [
  '5.7.44 与 8.4 有多库档案中的全量、CDC 和恢复记录。8.0 有旧版单目标主备记录，8.2.0 有开发环境集成记录，尚未纳入首版验收基线。需 InnoDB、GTID、ROW/FULL 日志与快照读取权限。',
  'Snapshot, CDC and recovery records exist for 5.7.44 and 8.4 with the current pipeline format. 8.0 has legacy single-target failover evidence. 8.2.0 has a development integration run and awaits baseline acceptance. Requires InnoDB, GTID, ROW/FULL binlogs and snapshot privileges.'
 ],
 MYSQL_SINK: [
  '独立 MySQL 8.4 实例。全量、CDC 与重启续传有验证记录，业务写入和目标断点在同一事务提交。',
  'Separate MySQL 8.4 instance. Verified snapshot, CDC and restart recovery. Business rows and target checkpoints commit together.'
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
  'CE 4.3.5.6 ARM64，MySQL 兼容业务租户。已有原生事务、快照和部分 CDC 记录。完整联合恢复尚未通过，Oracle 兼容模式不在当前范围。',
  'CE 4.3.5.6 ARM64, MySQL-mode user tenant. Native transactions, snapshots and partial CDC have evidence. Full mixed recovery has not passed and Oracle mode is unavailable.'
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
  '3.9.2，专用单分区 Topic，acks=all 和幂等生产者。已验证 Broker 和 Worker 重启；未覆盖生产集群及 SASL/TLS 组合。',
  '3.9.2 with a dedicated single-partition topic, acks=all and an idempotent producer. Broker and Worker restarts verified. Cluster and SASL/TLS acceptance is pending.'
 ],
 RABBITMQ: [
  '4.1.4 quorum 队列，持久消息、强制路由和发布确认。已验证 Broker 和 Worker 重启；集群及 TLS 另验。',
  '4.1.4 quorum queue with persistent messages, mandatory routing and publisher confirms. Broker and Worker restarts verified. Cluster and TLS acceptance is pending.'
 ],
 PULSAR: [
  '4.0.14 持久非分区 Topic，按 BookKeeper 确认副本数投递。已有全量、CDC 和反复重启验证；集群、令牌与 TLS 另验。',
  '4.0.14 persistent non-partitioned topic with BookKeeper acknowledgment quorum. Snapshot, CDC and repeated restarts verified. Cluster, token and TLS acceptance is pending.'
 ],
 ROCKETMQ: [
  'Broker 5.5.0 / 客户端 5.5.1，单队列、同步刷盘和原生回执。有联合恢复及旧备份拒绝记录，ACL/TLS/复制另验。',
  'Broker 5.5.0 / client 5.5.1 with one queue, synchronous disk flush and native receipts. Mixed recovery and stale-backup refusal tested. ACL, TLS and replication remain open.'
 ],
 NATS_JETSTREAM: [
  '2.11.8，File 存储与 JetStream 发布确认。已验证 Broker 和 Worker 重启；集群及 TLS 另验。',
  '2.11.8 using File streams and JetStream publish ACKs. Broker and Worker restarts verified. Cluster and TLS acceptance is pending.'
 ],
 REDIS_STREAMS: [
  '7.4.2 直连单主，AOF、noeviction、同连接 WAITAOF。已验证重启；Sentinel、Cluster 和 TLS 组合另验。',
  '7.4.2 standalone direct primary with AOF, noeviction and same-connection WAITAOF. Restarts verified. Sentinel, Cluster and TLS profiles remain open.'
 ],
 ACTIVEMQ_CLASSIC: [
  '单 Broker 5.19.12，KahaDB、原生持久事务和指定消费者 ACK。有原生及联合恢复验收，TLS/集群/容量另验。',
  'One 5.19.12 KahaDB broker with persistent local transactions and selected consumer ACKs. Native and mixed recovery verified. TLS, clustering and capacity remain open.'
 ],
 ACTIVEMQ_ARTEMIS: [
  'Broker 2.57.0 / Core 客户端 2.19.1，持久非破坏性队列。原生传输、消费者 ACK、重启和旧备份拒绝已有记录，完整联合链路另验。',
  'Broker 2.57.0 / Core client 2.19.1 with a persistent non-destructive queue. Native transport, consumer ACK, restart and stale-backup refusal verified. Mixed pipeline acceptance remains open.'
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
export function connectorHref(row,locale){return row.status==='PLANNED'? `/docs/${locale}/start/roadmap.html`:`/docs/${locale}/reference/${manuals[row.id]||(messaging.includes(row.id)?'messaging-v3':'pipeline-v3')}.html`}
// The Java catalog groups GAUSS targets. Present the verified openGauss and unverified commercial profile separately.
const rows = catalog.flatMap(row=>row.id==='GAUSS_POSTGRESQL'?[row,{id:'GAUSSDB',role:'SINK',status:'LIMITED_IMPLEMENTATION'}]:[row])
export const products = [...new Set(rows.map(row=>row.id))].map(id=>({id,family:familyOf(id),entries:rows.filter(row=>row.id===id)}))
