<script setup>
import {computed} from 'vue'
import {useData} from 'vitepress'
import BrandLockup from './BrandLockup.vue'
import TechnicalBoundary from './TechnicalBoundary.vue'
const {frontmatter}=useData(),en=computed(()=>frontmatter.value.locale==='en')
</script>
<template>
  <figure class="pipeline-flow" :aria-label="en?'RivoMesh data and control flow':'RivoMesh 数据流与控制流'">
    <div class="flow-source">
      <small>{{en?'Capture example':'采集示例'}}</small>
      <h3>MySQL</h3>
      <p>{{en?'InnoDB snapshots':'InnoDB 全量快照'}}</p>
      <p>{{en?'GTID / row binlog capture':'GTID / 行级 binlog 采集'}}</p>
      <p><a :href="`/docs/${en?'en':'zh'}/start/compatibility.html`">{{en?'See all source profiles':'查看所有采集源'}}</a></p>
    </div>
    <div class="flow-arrow" aria-hidden="true"><svg viewBox="0 0 48 24" fill="none"><path d="M1 12h44m-8-7 8 7-8 7"/></svg></div>
    <div class="flow-engine">
      <div class="flow-brand"><BrandLockup/></div>
      <dl>
        <div><dt>{{en?'Worker':'执行 Worker'}}</dt><dd>{{en?'Normalize changes and map databases':'规范化变更与库映射'}}</dd></div>
        <div><dt>{{en?'Durable journal':'持久日志'}}</dt><dd>{{en?'Snapshot parts, source checkpoints and per-target ACKs':'快照分片、源检查点及各目标确认'}}</dd></div>
      </dl>
      <p>{{en?'Local H2 or external SQL journal':'本地 H2 或外部 SQL 日志'}}</p>
    </div>
    <div class="flow-arrow" aria-hidden="true"><svg viewBox="0 0 48 24" fill="none"><path d="M1 12h44m-8-7 8 7-8 7"/></svg></div>
    <div class="flow-targets">
      <small>{{en?'Independent sink confirmation':'各目标独立确认'}}</small>
      <div><h3>{{en?'Transactional SQL':'事务型 SQL'}}</h3><p>{{en?'Rows and target checkpoint commit together':'业务数据与目标断点一并提交'}}</p></div>
      <div><h3>{{en?'Analytical destinations':'分析目标'}}</h3><p>{{en?'Materialization receipts':'按目标协议记录物化回执'}}</p></div>
      <div><h3>{{en?'Message brokers':'消息系统'}}</h3><p>{{en?'Confirmed at-least-once publication':'经确认的至少一次发布'}}</p></div>
    </div>
    <figcaption>
      <div class="flow-control">
        <div><strong>{{en?'Management and execution':'管理与执行'}}</strong><p>{{en?'Web console and API control local Workers or send durable commands to a fixed Agent.':'Web 控制台与 API 管理本机 Worker，或向固定 Agent 提交持久化命令。'}}</p></div>
        <div><strong>{{en?'Optional shared control database':'可选共享控制库'}}</strong><p>{{en?'Node registry, shared access and command state. Replication events stay in the journal.':'保存节点目录、共享访问和控制命令状态。同步事件保存在持久日志。'}}</p></div>
      </div>
      <TechnicalBoundary :summary="en?'Deployment and recovery boundaries':'部署与恢复边界'" :href="`/docs/${en?'en':'zh'}/start/multi-node.html`"><p>{{en?'Enable Controller/Agent separation explicitly. The documented profiles cover initial Agent selection and administrator-approved handoff of a frozen task.':'管理与 Agent 分离需显式启用。指定部署组合支持新任务选择 Agent，以及管理员审批移交已冻结任务。'}}</p></TechnicalBoundary>
    </figcaption>
  </figure>
</template>
<style scoped>
.pipeline-flow{display:grid;grid-template-columns:1fr 32px 1.35fr 32px 1.25fr;align-items:center;gap:20px;margin:0;padding:30px;border:1px solid var(--line);border-radius:var(--radius-panel);background:var(--canvas)}.pipeline-flow small{font:10px/1.6 monospace;letter-spacing:.4px;color:var(--muted);display:block;margin-bottom:16px}.pipeline-flow h3{font-size:18px;font-weight:550;line-height:1.5}.flow-source>p{font-size:12px;color:var(--muted);margin-top:10px}.flow-arrow{color:var(--blue);display:flex;align-items:center;justify-content:center}.flow-arrow svg{width:100%;height:24px;stroke:currentColor;stroke-width:1.5}.pipeline-flow:hover .flow-arrow path{stroke-dasharray:5 4;animation:flow-trace 1.6s linear 2}@keyframes flow-trace{to{stroke-dashoffset:-18}}.flow-engine{border:1px solid var(--brand-line);border-radius:7px;padding:22px;background:var(--blue-soft)}.flow-brand{display:flex;align-items:center}.flow-brand :deep(.brand-lockup){width:152px!important;height:32px!important;max-width:100%}.flow-brand strong{font-size:22px;letter-spacing:-.4px;font-weight:600}.flow-engine dl{margin:16px 0}.flow-engine dl>div+div{margin-top:10px}.flow-engine dt{font-size:12px;font-weight:600}.flow-engine dd{font-size:11px;color:var(--muted);line-height:1.7;margin:3px 0 0}.flow-engine>p{border-top:1px solid var(--brand-line);padding-top:13px;font-size:11px;color:var(--blue)}.flow-targets>div{padding:10px 0;border-bottom:1px solid var(--line)}.flow-targets>div:last-child{border:0}.flow-targets h3{font-size:13px}.flow-targets p{font-size:11px;color:var(--muted);line-height:1.8;margin-top:5px}.pipeline-flow figcaption{grid-column:1/-1;font-size:11px;color:var(--muted);line-height:1.8;border-top:1px solid var(--line);padding-top:0;margin-top:0;border:0}.flow-control{display:grid;grid-template-columns:1fr 1fr;gap:18px;padding:18px 0 8px;border-top:1px solid var(--line)}.flow-control strong{font-size:12px;color:var(--ink)}.flow-control p{margin:4px 0}.flow-control+*{margin-top:8px}@media(max-width:600px){.flow-control{grid-template-columns:1fr;gap:10px}}@media(max-width:960px){.pipeline-flow{gap:12px;padding:22px;grid-template-columns:1fr 24px 1.4fr}.flow-targets{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;border-top:1px solid var(--line);padding-top:18px}.flow-targets>small{grid-column:1/-1;margin:0}.flow-targets>div{border:0;padding:0}.flow-engine+.flow-arrow{display:none}}@media(max-width:600px){.pipeline-flow{display:flex;flex-direction:column;align-items:stretch;padding:20px}.flow-source>span{margin-top:10px;padding-top:10px}.flow-arrow{transform:rotate(90deg);width:26px;height:32px;align-self:center}.flow-engine+.flow-arrow{display:block}.flow-targets{display:block;border-top:0;padding-top:0}.flow-targets>small{margin-bottom:8px}.flow-targets>div{padding:10px 0;border-bottom:1px solid var(--line)}.pipeline-flow figcaption{margin-top:8px}}
@media(prefers-reduced-motion:reduce){.pipeline-flow:hover .flow-arrow path{animation:none;stroke-dasharray:none}}</style>
