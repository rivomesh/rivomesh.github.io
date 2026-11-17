<script setup>
import {computed,ref} from 'vue'
import {useData} from 'vitepress'
import data from '../../data/requirements.json'
import {homeCopy} from '../data/home-copy.mjs'
const {frontmatter}=useData(),lang=computed(()=>frontmatter.value.locale==='en'?'en':'zh-CN'),english=computed(()=>lang.value==='en')
const epic=ref('ALL'),state=ref('ALL'),query=ref('')
const epics={CLUSTER:['统一控制','Cluster control'],SESSION:['浏览器会话','Sessions'],RECOVERY:['人工恢复','Manual recovery'],SOURCE:['源端兼容','Source compatibility'],JAVA:['Java 运行时','Java runtimes'],DOCS:['完整文档','Documentation'],CARRYOVER:['历史范围','Carryover']}
const counts=computed(()=>Object.fromEntries(['DONE','PARTIAL','NEW'].map(s=>[s,data.requirements.filter(r=>r.status===s).length])))
const rows=computed(()=>data.requirements.filter(r=>(epic.value==='ALL'||r.epic===epic.value)&&(state.value==='ALL'||r.status===state.value)&&`${r.id} ${r.title[lang.value]} ${r.gap[lang.value]}`.toLowerCase().includes(query.value.toLowerCase())))

const current=computed(()=>homeCopy[english.value?'en':'zh'].core)
// Product directions reference the existing requirement inventory; statuses are never maintained twice.
const directions=[
 {ids:['CP-02','CP-03','CP-04','CP-06'],title:['多节点任务管理','Multi-node task management'],text:['完善跨节点操作、任务诊断和故障恢复；自动跨 Agent 接管仍未提供。','Extend cross-node operations, diagnostics and recovery. Automatic cross-Agent failover is not available.'],route:'multi-node'},
 {ids:['RC-01','RC-02','RC-07'],title:['故障诊断与修复流程','Fault diagnosis and repair workflows'],text:['完善失败事务审阅、错误定位和修复操作，减少排障步骤。','Improve failed-transaction inspection, diagnosis and guided corrective actions.'],route:'troubleshooting'},
 {ids:['LG-01','LG-03','LG-04'],title:['数据库与消息目标适配','Database and messaging compatibility'],text:['扩展国产数据库、分析系统和消息目标的版本、集群及恢复验证范围。','Broaden version, cluster and recovery coverage across database, analytics and messaging targets.'],route:'connectors'},
 {ids:['JV-01','JV-02','JV-03'],title:['运行环境兼容性','Runtime compatibility'],text:['扩展 Java 版本、驱动和源目标组合的运行与恢复测试。','Expand runtime and recovery coverage across Java versions, drivers and source/target combinations.'],route:'compatibility'},
 {ids:['SO-06','SO-07'],title:['更多数据库采集源','Additional source databases'],text:['PostgreSQL 与 Oracle 全量和增量采集源列入规划，当前尚不可用于采集。','PostgreSQL and Oracle snapshot/CDC sources are planned and are not currently available.'],route:'connectors'},
 {ids:['RC-03','RC-04','RC-06','RC-08'],title:['受控人工恢复','Controlled manual recovery'],text:['规划事务跳过、补偿与缺口跟踪；当前普通恢复仍会重试原事务。','Plan transaction skipping, compensation and gap tracking. Current resume retries the original transaction.'],route:'backup'},
 {ids:['JV-04'],title:['升级与混合运行环境','Upgrade and mixed-runtime operations'],text:['规划跨 Java 版本部署和混合版本升级流程。','Plan cross-Java deployment and mixed-version upgrade workflows.'],route:'compatibility'}
]
const milestones=computed(()=>directions.map(item=>{
 const states=item.ids.map(id=>{const row=data.requirements.find(row=>row.id===id);if(!row)throw new Error('Unknown roadmap requirement: '+id);return row.status})
 const phase=states.every(state=>state==='DONE')?'DONE':states.some(state=>state==='PARTIAL'||state==='DONE')?'PARTIAL':'NEW'
 return {...item,phase}
}))
const phases=[{id:'DONE',title:['已完成对应范围','Completed scope']},{id:'PARTIAL',title:['正在完善','In progress']},{id:'NEW',title:['后续计划','Planned']}]
</script>
<template><div class="product-roadmap">
 <section class="roadmap-current" aria-labelledby="current-capabilities">
  <h2 id="current-capabilities">{{english?'Available today':'当前可用能力'}}</h2>
  <p>{{english?'MySQL snapshot and CDC capture, independent destination recovery, and web-based task management. Check connector profiles and deployment requirements before use.':'MySQL 全量与增量采集、多目标独立恢复和 Web 任务管理已可使用；部署前请核对连接器版本与使用条件。'}}</p>
  <ul class="roadmap-capabilities"><li v-for="item in current" :key="item.href"><a :href="`/docs/${english?'en':'zh'}/reference/${item.href}.html`">{{item.title}} <span aria-hidden="true">→</span></a></li></ul>
 </section>
 <section v-for="phase in phases.filter(phase=>milestones.some(item=>item.phase===phase.id))" :key="phase.id" class="roadmap-phase" :data-phase="phase.id">
  <h2>{{phase.title[english?1:0]}}</h2>
  <div class="roadmap-directions"><article v-for="item in milestones.filter(item=>item.phase===phase.id)" :key="item.ids.join('-')">
   <h3>{{item.title[english?1:0]}}</h3><p>{{item.text[english?1:0]}}</p><a :href="`/docs/${english?'en':'zh'}/start/${item.route}.html`">{{english?'Current support and requirements':'当前支持范围与使用条件'}} →</a>
  </article></div>
 </section>
 <p class="roadmap-timing">{{english?'Planned capabilities are not available for deployment. No release dates are committed here; consult the current documentation when choosing a deployment.':'规划能力尚不能用于实际部署。本页不承诺发布时间，选择部署方案请以当前使用文档为准。'}}</p>
 <details id="engineering-details" class="roadmap-records"><summary>{{english?'Detailed requirements and verification records':'详细需求与验收记录'}} <span>({{data.requirements.length}})</span></summary>
 <div class="roadmap-records-body"><p>{{english?'The full inventory retains requirement IDs, priorities, dependencies and acceptance conditions. DONE closes only the recorded scope; PARTIAL and NEW remain incomplete.':'完整清单保留需求编号、优先级、依赖与验收条件。DONE 仅表示对应范围已完成，PARTIAL 与 NEW 仍有未完成工作。'}}</p>
<div class="roadmap-summary"><div><strong>{{data.requirements.length}}</strong><span>{{english?'Requirements':'需求总数'}}</span></div><div v-for="s in ['DONE','PARTIAL','NEW']" :key="s"><strong>{{counts[s]}}</strong><span>{{s}}</span></div></div><p class="snapshot-label">{{data.specId}} · v{{data.version}} · {{data.date}} · {{data.state}}</p><div class="catalog-controls"><label>{{english?'Direction':'需求方向'}}<select v-model="epic"><option value="ALL">{{english?'All directions':'全部方向'}}</option><option v-for="(name,key) in epics" :key="key" :value="key">{{name[english?1:0]}}</option></select></label><label>{{english?'State':'状态'}}<select v-model="state"><option value="ALL">{{english?'All states':'全部状态'}}</option><option v-for="s in ['DONE','PARTIAL','NEW']" :key="s">{{s}}</option></select></label><label class="grow">{{english?'Find requirement':'查找需求'}}<input v-model="query" type="search" :placeholder="english?'CP-03 / MySQL / session…':'CP-03 / MySQL / 会话…'"></label></div><p class="result-summary" aria-live="polite">{{rows.length}} {{english?'matching requirements':'项匹配需求'}}</p><details v-for="r in rows" :key="r.id" class="requirement-item"><summary><code>{{r.id}}</code><strong>{{r.title[lang]}}</strong><span class="priority-chip">{{r.priority}}</span><span class="state-chip" :class="r.status.toLowerCase()">{{r.status}}</span></summary><p><b>{{english?'Current gap / scope: ':'当前差距 / 已记录范围：'}}</b>{{r.gap[lang]}}</p><p><b>{{english?'Acceptance: ':'验收条件：'}}</b>{{r.acceptance[lang]}}</p><p v-if="r.dependsOn.length"><b>{{english?'Dependencies: ':'依赖：'}}</b>{{r.dependsOn.join('、')}}</p><p v-if="r.verification?.archive"><a :href="'/docs/zh/evidence/'+r.verification.archive.split('/')[2]+'.html'">{{english?'Recorded evidence':'查看记录的验收证据'}} →</a></p></details><p v-if="!rows.length">{{english?'No matching requirements.':'没有匹配需求，请调整筛选。'}}</p>
 </div></details>
</div></template>

<style scoped>
.roadmap-capabilities{list-style:none;padding:0!important;display:flex;flex-wrap:wrap;gap:10px 24px}.roadmap-capabilities a{font-size:13px}.roadmap-capabilities span{margin-left:8px}.roadmap-directions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px}.roadmap-directions article{min-width:0;padding:16px 0 22px;border-bottom:1px solid var(--line)}.roadmap-directions h3{font-size:16px;margin:0 0 9px}.roadmap-directions p{font-size:13px;color:var(--muted);margin:0 0 10px}.roadmap-directions a{font-size:12px}.roadmap-timing{font-size:12px;color:var(--muted);margin:30px 0!important}.roadmap-records{border:1px solid var(--line);border-radius:var(--radius-panel);margin-top:28px}.roadmap-records>summary{cursor:pointer;padding:16px 20px;min-height:48px;font-size:14px;font-weight:550}.roadmap-records>summary span{color:var(--muted);font-size:12px}.roadmap-records-body{border-top:1px solid var(--line);padding:16px 20px}.roadmap-records-body>p{font-size:12px;color:var(--muted)}.roadmap-records>summary:focus-visible{outline:2px solid var(--blue);outline-offset:3px}@media(max-width:600px){.roadmap-directions{grid-template-columns:1fr}.roadmap-records-body{padding:12px}.roadmap-records>summary{padding:14px 12px}.roadmap-capabilities{display:block}.roadmap-capabilities li{padding:5px 0}}
</style>
