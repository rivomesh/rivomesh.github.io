<script setup>
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
const filter=ref('全部'), query=ref('')
const rows=[
 ['MySQL','源端','可用','5.7.44 基础、8.0 历史 V2/HA、8.4 代表性 V3；逐版本核对','pipeline-v3'],
 ['PostgreSQL','源端','规划中','原生采集、快照与 LSN 衔接仍待实现',''],['Oracle','源端','规划中','源适配、版本、权限与恢复仍待实现',''],
 ['PostgreSQL','关系数据库','可用','17.12 指定档案：全量 / CDC / 重启 / JSON','pipeline-v3'],['MySQL','关系数据库','可用','8.4 独立实例，多目标与两类日志恢复','pipeline-v3'],['openGauss / GaussDB','关系数据库','部分验证','openGauss 7 指定版本；商业分布式 GaussDB 待验','gaussdb-index-policy'],
 ['达梦 DM','关系数据库','实验性','DM8.1.4.80 native0 / UTF8 / blank1 首批档案','dm-v3'],['金仓 Kingbase','关系数据库','实验性','V009R001C001B0025 PG / UTF8 首批档案','kingbase-v3'],['GBase 8c','关系数据库','实验性','V6 S1.3.0B19 PG / UTF8 首批档案','gbase8c-v3'],['OceanBase','关系数据库','实验性','MySQL 兼容业务租户；完整联合重启恢复待验','oceanbase-v3'],['GBase 8a / 8s','关系数据库','规划中','与 8c 分属不同产品，需分别适配',''],
 ['ClickHouse','分析系统','部分验证','25.8 单直连服务，版本物化 / FINAL 视图 / 恢复','clickhouse-v3'],['Apache Doris','分析系统','部分验证','4.1.3 ARM64，Unique MoW / Stream Load 首批档案','doris-v3'],['Apache Hive','分析系统','实验性','4.0.1 ACID ORC 历史 / 视图；需关闭结果缓存','hive-v3'],
 ...[['Apache Kafka','3.9.2 专用单分区 Topic'],['Apache Pulsar','4.0.14 持久非分区 Topic'],['RabbitMQ','4.1.4 quorum queue'],['RocketMQ','5.5.0 Broker / 5.5.1 Client，单队列'],['NATS JetStream','2.11.8 File stream'],['Redis Streams','7.4.2 单机直连 / AOF'],['ActiveMQ Artemis','2.57.0 Broker / Core 协议']].map(([name,note])=>[name,'消息系统','部分验证',note+'；集群/TLS/容量待扩验','messaging-v3']),['ActiveMQ Classic','消息系统','部分验证','5.19.12 单 KahaDB；恢复及旧备份保护首批验收','classic-v3']
]
const visible=computed(()=>rows.filter(r=>(filter.value==='全部'||r[1]===filter.value||r[2]===filter.value)&&r.join(' ').toLowerCase().includes(query.value.toLowerCase())))
</script>
<template><div class="catalog-tools"><div class="filter-buttons" role="group" aria-label="筛选连接器"><button v-for="f in ['全部','源端','关系数据库','分析系统','消息系统','规划中']" :key="f" :class="{selected:filter===f}" :aria-pressed="filter===f" @click="filter=f">{{f}}</button></div><label class="catalog-search">搜索连接器<input v-model="query" type="search" placeholder="例如 PostgreSQL、达梦"></label></div><p class="result-count" aria-live="polite">{{visible.length}} 项匹配 · 状态来源于源码能力目录与专门手册</p><div class="connector-grid"><article v-for="(r,i) in visible" :key="r[0]+r[1]" class="connector-card"><div class="connector-top"><span class="connector-monogram">{{r[0].replace('Apache ','').slice(0,2).toUpperCase()}}</span><span class="status-pill" :class="{'experimental':r[2]==='实验性','planned':r[2]==='规划中','available':r[2]==='可用'}">{{r[2]}}</span></div><h2>{{r[0]}}</h2><span class="connector-category">{{r[1]}}</span><p>{{r[3]}}</p><a :href="withBase(r[4]?'/reference/zh-CN/'+r[4]+'.html':'/roadmap.html')">{{r[4]?'阅读运行手册':'查看 SDD 计划'}} ↗</a></article></div><p v-if="!visible.length">没有匹配项，请调整筛选或搜索词。</p></template>
