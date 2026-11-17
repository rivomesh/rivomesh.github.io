import catalog from '../../data/connectors.json'
export const connectorNames = {MYSQL:'MySQL',POSTGRESQL:'PostgreSQL',ORACLE:'Oracle',GAUSS_POSTGRESQL:'openGauss / GaussDB',DM:'达梦 DM',KINGBASE:'金仓 KingbaseES',GBASE_8C:'GBase 8c',GBASE_8A:'GBase 8a',GBASE_8S:'GBase 8s',OCEANBASE:'OceanBase',CLICKHOUSE:'ClickHouse',DORIS:'Apache Doris',HIVE:'Apache Hive',KAFKA:'Apache Kafka',PULSAR:'Apache Pulsar',RABBITMQ:'RabbitMQ',ROCKETMQ:'RocketMQ',NATS_JETSTREAM:'NATS JetStream',REDIS_STREAMS:'Redis Streams',ACTIVEMQ_CLASSIC:'ActiveMQ Classic',ACTIVEMQ_ARTEMIS:'ActiveMQ Artemis'}
export const domestic = ['GAUSS_POSTGRESQL','DM','KINGBASE','GBASE_8C','OCEANBASE','GBASE_8A','GBASE_8S']
const analytics = ['CLICKHOUSE','DORIS','HIVE']
const messaging = ['KAFKA','PULSAR','RABBITMQ','ROCKETMQ','NATS_JETSTREAM','REDIS_STREAMS','ACTIVEMQ_CLASSIC','ACTIVEMQ_ARTEMIS']
export const statusLabels = {AVAILABLE:['已验证','Verified profile'],PARTIALLY_VERIFIED:['部分验证','Partially verified'],EXPERIMENTAL:['实验性','Experimental'],PLANNED:['暂不支持 · 规划中','Not supported · Planned']}
const manuals = {GAUSS_POSTGRESQL:'gaussdb-index-policy',DM:'dm-v3',KINGBASE:'kingbase-v3',GBASE_8C:'gbase8c-v3',OCEANBASE:'oceanbase-v3',CLICKHOUSE:'clickhouse-v3',DORIS:'doris-v3',HIVE:'hive-v3',ACTIVEMQ_CLASSIC:'classic-v3'}
const notes = {
 MYSQL_SOURCE:['MySQL 指定版本的全量、增量与恢复；部署前核对 GTID、行镜像与权限。','Snapshot, CDC and recovery for documented MySQL versions. Check GTID, row images and privileges.'],
 MYSQL_SINK:['独立 MySQL 8.4 实例，已验证全量、增量与重启；首次使用空目标。','Independent MySQL 8.4 instance; snapshot, CDC and restart verified. Start with empty business tables.'],
 POSTGRESQL:['PostgreSQL 17.12：全量、增量、重启及 JSON。目标适配不代表源端采集。','PostgreSQL 17.12: snapshot, CDC, restart and JSON. Target support does not imply source support.'],
 GAUSS_POSTGRESQL:['openGauss 7.0.0-RC3；商业 GaussDB 与分布式形态待独立验证。','openGauss 7.0.0-RC3. Commercial and distributed GaussDB require separate acceptance.'],
 DM:['DM8.1.4.80 指定 UTF8 模式；首批全量、增量及故障恢复验证，其他模式待评估。','DM8.1.4.80, documented UTF8 profile. Initial snapshot, CDC and recovery records; other modes remain unverified.'],
 KINGBASE:['金仓 V9 PG/UTF8 模式；首批同步与恢复记录，其他模式、集群待评估。','KingbaseES V9 PG/UTF8 profile. Initial synchronization and recovery records; other modes and clusters remain unverified.'],
 GBASE_8C:['指定 PG/UTF8 模式，首批同步与恢复记录。8a、8s 是独立产品。','Documented PG/UTF8 profile with initial synchronization/recovery records. 8a and 8s are separate products.'],
 OCEANBASE:['MySQL 兼容业务租户；已有原生事务及部分同步记录，完整联合恢复尚未通过。','MySQL-mode user tenant; native transactions and partial synchronization records. Full mixed recovery acceptance remains incomplete.'],
 CLICKHOUSE:['25.8 单节点，版本化物化及 FINAL 视图；集群待独立验证。','25.8 direct single server; versioned materialization and FINAL views. Clusters require separate verification.'],
 DORIS:['4.1.3 Stream Load 与 Unique MoW 视图；已有首批恢复记录，集群另验。','4.1.3 Stream Load and Unique MoW views with initial recovery records. Clusters require separate acceptance.'],
 HIVE:['4.0.1 ACID ORC 历史与视图；读写端需关闭查询结果缓存。','4.0.1 ACID ORC history/views. Query result caching must be disabled for writers and readers.']
}
export function familyOf(id){return domestic.includes(id)?'DOMESTIC':analytics.includes(id)?'ANALYTICS':messaging.includes(id)?'MESSAGING':'RELATIONAL'}
export function connectorName(id,locale){return locale==='en'?({DM:'DM',KINGBASE:'KingbaseES'}[id]||connectorNames[id]):connectorNames[id]}
export function connectorNote(row,locale){const i=locale==='en'?1:0;if(row.status==='PLANNED')return ['已列入规划，当前不能作为可运行连接器使用。','Planned; not currently available as a runnable connector.'][i];return (notes[row.id+'_'+row.role]||notes[row.id]||['确认后的至少一次投递；消费者需去重，具体 Broker、版本与恢复范围见手册。','Confirmed at-least-once delivery; consumers must deduplicate. See the manual for broker versions and recovery scope.'])[i]}
export function connectorHref(row,locale){return row.status==='PLANNED'?`/docs/${locale}/start/roadmap.html`:`/docs/${locale}/reference/${manuals[row.id]||(messaging.includes(row.id)?'messaging-v3':'pipeline-v3')}.html`}
// Keep source and target status separate, including when one product supports both roles.
export const products = [...new Set(catalog.map(r=>r.id))].map(id=>({id,family:familyOf(id),entries:catalog.filter(r=>r.id===id)}))
export const connectorCatalog = catalog
