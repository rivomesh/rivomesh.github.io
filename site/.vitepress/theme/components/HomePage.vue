<script setup>
import { ref, nextTick } from 'vue'
import { withBase } from 'vitepress'
const active = ref(0)
async function changeTab(delta){active.value=(active.value+delta+3)%3;await nextTick();document.getElementById('scenario-tab-'+active.value)?.focus()}
const scenarios=[
 {tag:'国产化适配评估',title:'从现有业务出发，验证新的数据库选择。',body:'将 MySQL 数据同步到独立目标环境，逐步核对类型、索引、事务与恢复行为。让数据库适配评估有数据、有过程、有依据。',source:'MySQL 业务库',targets:['PostgreSQL / openGauss','达梦 / 金仓 / GBase 8c'],note:'国产厂商目标按特定版本实验档案评估；业务切换仍需单独规划。'},
 {tag:'分析数据分发',title:'让分析系统跟上业务数据的变化。',body:'先同步已有数据，再传递新增、修改和删除。将数据送到 ClickHouse、Doris 或 Hive，为分析场景准备持续更新的数据副本。',source:'MySQL 业务数据',targets:['ClickHouse / Doris','Hive ACID 物化'],note:'分析目标使用各自物化和读取协议，集群、容量与安全需按环境验证。'},
 {tag:'多系统数据协同',title:'同一份数据，连接不同下游。',body:'用显式库映射连接多个目标，分别观察确认进度和错误状态。某个目标需要恢复时，可以定位到具体订阅，保留其他下游的处理进度。',source:'一个逻辑 MySQL 源',targets:['关系库 / 分析库','Kafka / Pulsar / 更多消息目标'],note:'多目标独立确认；消息为至少一次投递，消费者需按协议去重。'}
]
const benefits=[
 {icon:'01',title:'从全量，走向持续增量',body:'先传递已有数据，再读取 MySQL 变更日志。把一次性搬运，变成持续的数据连接。',link:'/reference/zh-CN/pipeline-v3.html'},
 {icon:'02',title:'让任务状态看得清',body:'中英文任务向导、配置检查、全量进度与积压状态。日常操作从一个 Web 工作台开始。',link:'/reference/zh-CN/console-and-deployment.html'},
 {icon:'03',title:'恢复有依据，操作有记录',body:'持久断点、独立目标确认、角色授权与审计。遇到错误后，沿着明确的上下文处理。',link:'/reference/zh-CN/security-audit.html'}
]
</script>
<template>
<div class="rm-home">
  <a class="release-strip" :href="withBase('/roadmap.html')"><span class="tiny-dot"></span> 正在构建，更透明地演进 <span class="release-tag">0.1.0-SNAPSHOT</span><span class="strip-more">查看 SDD 计划 ↗</span></a>
  <section class="rm-hero wrap">
    <div class="hero-copy"><div class="eyebrow"><span></span> OPEN DATA. CONNECTED BUSINESS.</div><h1>让业务数据<br>流向<span class="gradient-text">需要它的地方。</span></h1><p class="hero-description">面向政企数据集成的实时同步平台。<br>从 MySQL 出发，连接数据库、分析与消息系统，<br class="desktop-break">让数据流转可观察、可管理、可恢复。</p><div class="hero-actions"><a class="rm-button primary" :href="withBase('/guide/quick-start.html')">开始使用 <span>↗</span></a><a class="rm-button secondary" :href="withBase('/tour.html')"><span class="play-small">▶</span> 看产品讲解</a></div><div class="hero-footnote"><span>可恢复全量</span><i></i><span>持续增量</span><i></i><span>多目标分发</span></div></div>
    <div class="hero-visual" role="img" aria-label="数据流示意：MySQL 经过 RivoMesh 全量、增量和持久日志，分别流向关系数据库、分析系统和消息系统。非实时监控。">
      <div class="visual-top"><span><span class="tiny-dot"></span> DATA FLOW / 数据流示意</span><span>V3 PIPELINE</span></div>
      <div class="flow-canvas"><div class="source-node"><svg viewBox="0 0 40 44" fill="none" aria-hidden="true"><ellipse cx="20" cy="9" rx="15" ry="6"/><path d="M5 9v25c0 8 30 8 30 0V9M5 21c0 8 30 8 30 0"/></svg><strong>MySQL</strong><small>业务数据源</small></div><div class="flow-wire wire-in"><span></span></div><div class="engine-node"><img :src="withBase('/brand/logo-light.svg')" alt=""><strong>RivoMesh</strong><small>全量 + CDC</small></div><div class="flow-wire wire-out"><span></span></div><div class="target-nodes"><div><span class="node-symbol">▤</span><p>关系数据库<small>PostgreSQL · openGauss</small></p><span class="node-dot"></span></div><div><span class="node-symbol">◴</span><p>分析系统<small>ClickHouse · Doris · Hive</small></p><span class="node-dot"></span></div><div><span class="node-symbol">⌘</span><p>消息系统<small>Kafka · Pulsar · 更多</small></p><span class="node-dot"></span></div></div></div>
      <div class="flow-log"><span>01 <b>快照准备</b></span><em>→</em><span>02 <b>持续采集</b></span><em>→</em><span>03 <b>独立确认</b></span></div><div class="visual-bottom"><span class="journal-icon">▱</span><span>持久日志 · 保存事件与进度</span><span class="protocol-label">按目标协议恢复</span></div>
    </div>
  </section>
  <div class="ecosystem-ribbon wrap"><span class="ribbon-label">从业务库到更多数据系统</span><div><b>MySQL</b><b>PostgreSQL</b><b>openGauss</b><b>ClickHouse</b><b>Apache Doris</b><b>Apache Kafka</b></div><a :href="withBase('/ecosystem/')">查看适配状态 ↗</a></div>
  <section class="wrap value-section"><div class="section-heading"><div><div class="eyebrow">BUILT FOR YOUR DATA WORKFLOW</div><h2>把复杂的数据同步，<br>变成清晰的工作流程。</h2></div><p>从第一次试用到持续运维，<br>让业务人员理解价值，让技术团队掌握细节。</p></div><div class="benefit-grid"><a v-for="b in benefits" :key="b.icon" :href="withBase(b.link)" class="benefit"><span class="benefit-number">{{b.icon}} /</span><h3>{{b.title}}</h3><p>{{b.body}}</p><span class="text-link">了解工作原理 <b>↗</b></span></a></div></section>
  <section class="scenario-section"><div class="wrap"><div class="section-heading"><div><div class="eyebrow">SOLUTIONS, GROUNDED IN REAL NEEDS</div><h2>从你的业务场景开始。</h2></div><a class="text-link" :href="withBase('/guide/scenarios.html')">阅读试点指南 ↗</a></div><div class="scenario-tabs" role="tablist" aria-label="使用场景"><button v-for="(s,i) in scenarios" :id="'scenario-tab-'+i" :key="s.tag" role="tab" :aria-selected="active===i" :aria-controls="'scenario-panel-'+i" :tabindex="active===i?0:-1" :class="{selected:active===i}" @click="active=i" @keydown.right.prevent="changeTab(1)" @keydown.left.prevent="changeTab(-1)">{{s.tag}} <span>↗</span></button></div><div v-for="(s,i) in scenarios" v-show="active===i" :id="'scenario-panel-'+i" :key="i" role="tabpanel" :aria-labelledby="'scenario-tab-'+i" class="scenario-panel"><div><h3>{{s.title}}</h3><p>{{s.body}}</p><a class="text-link" :href="withBase('/guide/scenarios.html')">了解建议验证路径 →</a></div><div class="scenario-graphic"><div class="mini-source">▤ <b>{{s.source}}</b></div><span class="mini-arrow">→</span><img :src="withBase('/brand/logo.svg')" alt="RivoMesh"><span class="mini-arrow">→</span><div class="mini-targets"><div v-for="t in s.targets" :key="t">{{t}}</div></div></div><small class="scenario-note">{{s.note}}</small></div></div></section>
  <section class="wrap console-section"><div class="console-copy"><div class="eyebrow">A WORKSPACE FOR EVERY PIPELINE</div><h2>数据在流动。<br>过程，你看得见。</h2><p>通过向导创建任务，检查后启动；查看进度与目标状态，沿着错误上下文恢复。让同步任务有一个可以日常使用的工作台。</p><ul><li>任务向导与 YAML 配置导入</li><li>多目标状态与独立恢复入口</li><li>角色授权、操作记录与数据校验</li></ul><a class="text-link" :href="withBase('/tour.html')">查看真实界面与讲解 ↗</a></div><a class="console-image" :href="withBase('/tour.html')"><div class="browser-chrome"><i></i><i></i><i></i><span>RivoMesh / 开发预览</span></div><img :src="withBase('/media/console-overview.png')" alt="RivoMesh 开发预览控制台实际截图：导航、统计和同步任务列表" loading="lazy"><span class="image-caption">真实开发预览截图 · 以当前版本实际界面为准</span></a></section>
  <section class="docs-section"><div class="wrap docs-grid"><div><div class="eyebrow">START SMALL. KEEP MOVING.</div><h2>先跑通第一条链路。</h2><p>准备一个测试源和空目标，启动控制台，<br>从向导开始你的第一次数据同步。</p><div class="hero-actions"><a class="rm-button primary" :href="withBase('/guide/quick-start.html')">快速开始 ↗</a><a class="text-link" :href="withBase('/guide/')">浏览完整文档 →</a></div><small class="prerelease-note">发布前版本 · 先验证，再扩大范围</small></div><div class="terminal"><div class="terminal-bar"><span>TERMINAL</span><span>源码构建 / Java 8 + Maven</span></div><pre><code><span class="code-comment"># 1. 在 RivoMesh 源码目录构建</span>
mvn -s build/settings.xml verify

<span class="code-comment"># 2. 设置访问令牌</span>
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"

<span class="code-comment"># 3. 启动 Web 控制台</span>
java -Xmx128m -jar \
  sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  serve config/platform.yml</code></pre><div class="terminal-bottom"><span class="tiny-dot"></span> 打开 localhost:8080，使用令牌登录</div></div></div></section>
  <section class="wrap roadmap-section"><div class="section-heading"><div><div class="eyebrow">DEVELOPED IN THE OPEN</div><h2>每一步演进，都有迹可循。</h2></div><p>以规格驱动开发，让需求、任务与验收相互关联。<br>已实现与下一步计划，清楚地呈现。</p></div><div class="roadmap-preview"><a :href="withBase('/reference/zh-CN/implementation-status.html')"><span class="status-label">当前基础</span><h3>同步、控制台与审阅式修复</h3><p>多库多目标、持久日志、任务授权，以及限定 SQL 目标的校验修复首版。</p><b>查看实施状态 ↗</b></a><a :href="withBase('/roadmap.html')"><span class="status-label planned">SDD 演进计划</span><h3>统一控制、源端与运行时扩展</h3><p>48 项未完成需求公开追踪，涵盖会话、跨节点控制、人工恢复与兼容性。</p><b>探索路线图 ↗</b></a><a :href="withBase('/community/')"><span class="status-label community">一起建设</span><h3>从一次反馈，到一份贡献</h3><p>从文档、复现步骤和适配验证开始，共同把数据连接做得更好。</p><b>参与项目 ↗</b></a></div></section>
  <section class="bottom-cta wrap"><img :src="withBase('/brand/logo-light.svg')" alt=""><div><h2>连接数据，也连接新的可能。</h2><p>从理解 RivoMesh 开始，找到适合你的同步路径。</p></div><a class="rm-button" :href="withBase('/guide/')">进入文档中心 ↗</a></section>
</div>
</template>
