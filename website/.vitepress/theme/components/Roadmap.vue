<script setup>
import {computed} from 'vue'
import {useData} from 'vitepress'

const {frontmatter}=useData()
const locale=computed(()=>frontmatter.value.locale==='en'?'en':'zh')
const labels={
 zh:{available:'当前可用',experimental:'实验性档案',next:'后续验证'},
 en:{available:'Available today',experimental:'Experimental profiles',next:'Next verification priorities'}
}
const sections={
 available:[
  {
   title:{zh:'MySQL 全量与增量同步',en:'MySQL snapshots and CDC'},
   text:{zh:'单机、异步 GTID 提升和三成员单主组复制均有指定 Temurin 21 实测档案。',en:'Temurin 21 evidence covers standalone, async GTID promotion and three-member single-primary Group Replication on the listed versions.'},
   route:'start/compatibility'
  },
  {
   title:{zh:'按目标恢复与数据核对',en:'Destination recovery and data validation'},
   text:{zh:'查看各目标进度，在指定 SQL 档案中审阅失败事务，执行共同点校验、修复及缺口复核。',en:'Track each destination and use reviewed recovery, common-cut validation, repair and gap verification on the documented SQL profiles.'},
   route:'start/data-validation'
  },
  {
   title:{zh:'Agent 分配与移交',en:'Agent placement and handoff'},
   text:{zh:'合格的新任务可自动选择 Agent。在指定 PostgreSQL 存储组合中，可审批移交已停止且冻结写入的任务。',en:'Eligible new tasks can select an Agent automatically. The documented PostgreSQL storage profile allows a reviewed handoff of a stopped task with a frozen writer.'},
   route:'start/multi-node'
  },
  {
   title:{zh:'组织账号登录',en:'Organization sign-in'},
   text:{zh:'共享 HTTPS 入口可以接入一个 OIDC 提供商，并通过绑定的本地账号执行任务与节点授权。',en:'Shared HTTPS entries can use one OIDC provider. Bound local accounts govern task and node permissions.'},
   route:'reference/oidc-login'
  }
 ],
 experimental:[
  {
   title:{zh:'PostgreSQL 逻辑复制',en:'PostgreSQL logical capture'},
   text:{zh:'从 PostgreSQL 17/18 采集到 PostgreSQL 或 MySQL。已有同步槽提升和指定类型的恢复实测。',en:'Capture from PostgreSQL 17/18 into PostgreSQL or MySQL. Native tests cover synchronized-slot promotion and recovery for specified data types.'},
   route:'reference/postgresql-source'
  },
  {
   title:{zh:'Oracle 归档采集',en:'Oracle archived capture'},
   text:{zh:'已验证 Oracle 26ai Free 单 PDB Flashback 快照和归档增量写入 PostgreSQL。',en:'The verified Oracle 26ai Free profile uses single-PDB Flashback snapshots and archived CDC into PostgreSQL.'},
   route:'reference/oracle-source'
  }
 ],
 next:[
  {
   title:{zh:'扩展采集与结构变更验证',en:'Broader capture and schema-change verification'},
   text:{zh:'继续验证 PostgreSQL 共同点校验、更多类型和结构变更，以及 Oracle RAC、LOB 与恢复场景。',en:'Extend PostgreSQL common-cut validation, type and schema-change coverage, and Oracle RAC, LOB and recovery profiles.'},
   route:'reference/implementation-status'
  },
  {
   title:{zh:'扩大故障恢复与连接器覆盖',en:'Broader failure and connector coverage'},
   text:{zh:'验证未能预先冻结的 Agent 故障、独立控制库与日志的恢复，以及更多数据库和消息系统的集群、TLS 与容量组合。',en:'Verify unexpected Agent outages before a freeze, recovery with separate control and journal databases, and more database and broker cluster, TLS and capacity profiles.'},
   route:'start/compatibility'
  }
 ]
}
</script>

<template>
  <div class="product-roadmap">
    <section v-for="(items,phase) in sections" :key="phase" :data-phase="phase" class="roadmap-phase">
      <h2>{{labels[locale][phase]}}</h2>
      <div class="roadmap-directions">
        <article v-for="item in items" :key="item.route">
          <h3><a :href="`/docs/${locale}/${item.route}.html`">{{item.title[locale]}}</a></h3>
          <p>{{item.text[locale]}}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.roadmap-directions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px}
.roadmap-directions article{min-width:0;padding:16px 0 22px;border-bottom:1px solid var(--line)}
.roadmap-directions h3{font-size:16px;margin:0 0 9px}
.roadmap-directions p{font-size:14px;color:var(--muted);margin:0}
@media(max-width:600px){.roadmap-directions{grid-template-columns:1fr}}
</style>
