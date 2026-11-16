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
 {icon:'01',title:'全量与 CDC 增量同步',body:'先同步数据库中已有的数据，再通过 MySQL binlog 持续捕获新增、修改和删除。',link:'/reference/zh-CN/pipeline-v3.html'},
 {icon:'02',title:'多库映射与多目标分发',body:'显式配置多个源库与目标映射。同一个逻辑源可投递到多个目标，各目标独立确认进度。',link:'/reference/zh-CN/pipeline-v3.html'},
 {icon:'03',title:'持久断点与故障恢复',body:'保存同步事件与处理进度。连接故障按策略重试，目标 SQL 错误修复后重试原事务。',link:'/reference/recovery.html'},
 {icon:'04',title:'Web 可视化任务管理',body:'使用中英文向导或 YAML 创建任务，检查连接，查看同步阶段、积压和各目标状态。',link:'/reference/zh-CN/console-and-deployment.html'},
 {icon:'05',title:'数据校验与审阅式修复',body:'在共同校验点比对数据，由管理员审阅修复计划。首版修复限定 MySQL / PostgreSQL 目标。',link:'/reference/zh-CN/managed-repair.html'},
 {icon:'06',title:'任务授权与操作审计',body:'通过 VIEWER、OPERATOR、ADMIN 角色与任务范围分配权限，查询和导出操作审计。',link:'/reference/zh-CN/security-audit.html'}
]
const architecture=[
 {label:'01 / 数据源',title:'MySQL 全量快照 + binlog',body:'读取已有表数据，并根据 binlog 捕获业务变化，按源端基线衔接全量与增量。',note:'采集源：MySQL',link:'/reference/zh-CN/pipeline-v3.html'},
 {label:'02 / 持久日志',title:'保存事件与同步进度',body:'使用本地持久日志或外部事务日志库，保存快照、变更事件与采集断点。',note:'日志：LOCAL / EXTERNAL',link:'/reference/zh-CN/pipeline-v3.html#日志部署选择'},
 {label:'03 / 多目标投递',title:'各目标独立投递与确认',body:'将数据写入数据库、分析系统或消息队列，按目标协议记录确认位置并恢复。',note:'目标：数据库 / 分析 / 消息',link:'/ecosystem/'}
]

</script>
<template>
<div class="rm-home">
  <a class="release-strip" :href="withBase('/roadmap.html')"><span class="tiny-dot"></span> 0.1.0 发布前预览 <span class="release-tag">0.1.0-SNAPSHOT</span><span class="strip-more">查看 SDD 计划 ↗</span></a>
  <section class="rm-hero wrap">
    <div class="hero-copy"><div class="eyebrow"><span></span> JAVA · DATABASE SYNCHRONIZATION</div><h1>RivoMesh<br><span class="gradient-text">数据库实时同步平台</span></h1><p class="hero-description">先同步已有数据，再持续同步新增、修改和删除。<br>将 MySQL 数据同步到 PostgreSQL、openGauss 等数据库，以及分析系统和消息队列；通过 Web 控制台创建、监控和恢复任务。</p><div class="hero-actions"><a class="rm-button primary" :href="withBase('/guide/quick-start.html')">快速开始 <span>↗</span></a><a class="rm-button secondary" :href="withBase('/guide/')">阅读文档 <span>→</span></a></div><div class="hero-footnote"><span>全量同步</span><i></i><span>CDC 增量同步</span><i></i><span>断点恢复</span><i></i><span>多目标分发</span></div><div class="hero-resource-links"><a :href="withBase('/download.html')">获取源码与构建 →</a><a :href="withBase('/tour.html')">观看产品演示 →</a></div></div>
    <div class="hero-visual" role="img" aria-label="数据流示意：MySQL 经过 RivoMesh 全量、增量和持久日志，分别流向关系数据库、分析系统和消息系统。非实时监控。">
      <div class="visual-top"><span><span class="tiny-dot"></span> DATA FLOW / 数据流示意</span><span>V3 PIPELINE</span></div>
      <div class="flow-canvas"><div class="source-node"><svg viewBox="0 0 40 44" fill="none" aria-hidden="true"><ellipse cx="20" cy="9" rx="15" ry="6"/><path d="M5 9v25c0 8 30 8 30 0V9M5 21c0 8 30 8 30 0"/></svg><strong>MySQL</strong><small>业务数据源</small></div><div class="flow-wire wire-in"><span></span></div><div class="engine-node"><img :src="withBase('/brand/logo-light.svg')" alt=""><strong>RivoMesh</strong><small>全量 + CDC</small></div><div class="flow-wire wire-out"><span></span></div><div class="target-nodes"><div><span class="node-symbol">▤</span><p>关系数据库<small>PostgreSQL · openGauss</small></p><span class="node-dot"></span></div><div><span class="node-symbol">◴</span><p>分析系统<small>ClickHouse · Doris · Hive</small></p><span class="node-dot"></span></div><div><span class="node-symbol">⌘</span><p>消息系统<small>Kafka · Pulsar · 更多</small></p><span class="node-dot"></span></div></div></div>
      <div class="flow-log"><span>01 <b>快照准备</b></span><em>→</em><span>02 <b>持续采集</b></span><em>→</em><span>03 <b>独立确认</b></span></div><div class="visual-bottom"><span class="journal-icon">▱</span><span>持久日志 · 保存事件与进度</span><span class="protocol-label">按目标协议恢复</span></div>
    </div>
  </section>
  <div class="ecosystem-ribbon wrap"><span class="ribbon-label">从业务库到更多数据系统</span><div><b>MySQL</b><b>PostgreSQL</b><b>openGauss</b><b>ClickHouse</b><b>Apache Doris</b><b>Apache Kafka</b></div><a :href="withBase('/ecosystem/')">查看适配状态 ↗</a></div>
  <section class="wrap value-section"><div class="section-heading"><div><div class="eyebrow">CORE CAPABILITIES</div><h2>核心功能</h2></div><p>覆盖数据采集、目标投递、任务管理与故障恢复。<br>各项能力的具体范围见对应运行手册。</p></div><div class="benefit-grid"><a v-for="b in benefits" :key="b.icon" :href="withBase(b.link)" class="benefit"><span class="benefit-number">{{b.icon}} /</span><h3>{{b.title}}</h3><p>{{b.body}}</p><span class="text-link">了解工作原理 <b>↗</b></span></a></div></section>
  <section id="architecture" class="wrap architecture-section" aria-labelledby="architecture-title"><div class="section-heading"><div><div class="eyebrow">SYNCHRONIZATION ARCHITECTURE</div><h2 id="architecture-title">同步架构</h2></div><a class="text-link" :href="withBase('/reference/zh-CN/platform-design.html')">阅读架构与设计文档 ↗</a></div><p class="architecture-intro">RivoMesh 以独立 Java 服务运行，直接订阅 MySQL 复制协议，将全量数据与增量事件经持久日志投递到下游。</p><div class="architecture-grid"><a v-for="step in architecture" :key="step.label" :href="withBase(step.link)" class="architecture-step"><span>{{step.label}}</span><h3>{{step.title}}</h3><p>{{step.body}}</p><small>{{step.note}}</small></a></div><p class="architecture-note">多目标分别确认进度；事务型数据库、分析系统和消息队列使用各自的投递协议。消息目标为至少一次投递，消费者需按协议去重。</p></section>
  <section class="scenario-section"><div class="wrap"><div class="section-heading"><div><div class="eyebrow">USE CASES</div><h2>应用场景</h2></div><a class="text-link" :href="withBase('/guide/scenarios.html')">阅读试点指南 ↗</a></div><div class="scenario-tabs" role="tablist" aria-label="使用场景"><button v-for="(s,i) in scenarios" :id="'scenario-tab-'+i" :key="s.tag" role="tab" :aria-selected="active===i" :aria-controls="'scenario-panel-'+i" :tabindex="active===i?0:-1" :class="{selected:active===i}" @click="active=i" @keydown.right.prevent="changeTab(1)" @keydown.left.prevent="changeTab(-1)">{{s.tag}} <span>↗</span></button></div><div v-for="(s,i) in scenarios" v-show="active===i" :id="'scenario-panel-'+i" :key="i" role="tabpanel" :aria-labelledby="'scenario-tab-'+i" class="scenario-panel"><div><h3>{{s.title}}</h3><p>{{s.body}}</p><a class="text-link" :href="withBase('/guide/scenarios.html')">了解建议验证路径 →</a></div><div class="scenario-graphic"><div class="mini-source">▤ <b>{{s.source}}</b></div><span class="mini-arrow">→</span><img :src="withBase('/brand/logo.svg')" alt="RivoMesh"><span class="mini-arrow">→</span><div class="mini-targets"><div v-for="t in s.targets" :key="t">{{t}}</div></div></div><small class="scenario-note">{{s.note}}</small></div></div></section>
  <section class="wrap console-section"><div class="console-copy"><div class="eyebrow">A WORKSPACE FOR EVERY PIPELINE</div><h2>Web 可视化控制台</h2><p>通过向导创建任务，检查后启动；查看进度与目标状态，沿着错误上下文恢复。让同步任务有一个可以日常使用的工作台。</p><ul><li>任务向导与 YAML 配置导入</li><li>多目标状态与独立恢复入口</li><li>角色授权、操作记录与数据校验</li></ul><a class="text-link" :href="withBase('/tour.html')">查看真实界面与讲解 ↗</a></div><a class="console-image" :href="withBase('/tour.html')"><div class="browser-chrome"><i></i><i></i><i></i><span>RivoMesh / 开发预览</span></div><img :src="withBase('/media/console-overview.png')" alt="RivoMesh 开发预览控制台实际截图：导航、统计和同步任务列表" loading="lazy"><span class="image-caption">真实开发预览截图 · 以当前版本实际界面为准</span></a></section>
  <section class="docs-section"><div class="wrap docs-grid"><div><div class="eyebrow">START SMALL. KEEP MOVING.</div><h2>快速开始</h2><p>准备一个测试源和空目标，启动控制台，<br>从向导开始你的第一次数据同步。</p><div class="hero-actions"><a class="rm-button primary" :href="withBase('/guide/quick-start.html')">快速开始 ↗</a><a class="text-link" :href="withBase('/guide/')">浏览完整文档 →</a></div><small class="prerelease-note">发布前版本 · 先验证，再扩大范围</small></div><div class="terminal"><div class="terminal-bar"><span>TERMINAL</span><span>源码构建 / Java 8 + Maven</span></div><pre><code><span class="code-comment"># 1. 在 RivoMesh 源码目录构建</span>
mvn -s build/settings.xml verify

<span class="code-comment"># 2. 设置访问令牌</span>
export RIVOMESH_TOKEN="$(openssl rand -hex 32)"

<span class="code-comment"># 3. 启动 Web 控制台</span>
java -Xmx128m -jar \
  sync-app/target/rivomesh-app-0.1.0-SNAPSHOT.jar \
  serve config/platform.yml</code></pre><div class="terminal-bottom"><span class="tiny-dot"></span> 打开 localhost:8080，使用令牌登录</div></div></div></section>
  <section class="wrap roadmap-section"><div class="section-heading"><div><div class="eyebrow">DEVELOPED IN THE OPEN</div><h2>项目进展与社区</h2></div><p>以规格驱动开发，让需求、任务与验收相互关联。<br>已实现与下一步计划，清楚地呈现。</p></div><div class="roadmap-preview"><a :href="withBase('/reference/zh-CN/implementation-status.html')"><span class="status-label">当前基础</span><h3>同步、控制台与审阅式修复</h3><p>多库多目标、持久日志、任务授权，以及限定 SQL 目标的校验修复首版。</p><b>查看实施状态 ↗</b></a><a :href="withBase('/roadmap.html')"><span class="status-label planned">SDD 演进计划</span><h3>统一控制、源端与运行时扩展</h3><p>48 项未完成需求公开追踪，涵盖会话、跨节点控制、人工恢复与兼容性。</p><b>探索路线图 ↗</b></a><a :href="withBase('/community/')"><span class="status-label community">一起建设</span><h3>从一次反馈，到一份贡献</h3><p>从文档、复现步骤和适配验证开始，共同把数据连接做得更好。</p><b>参与项目 ↗</b></a></div></section>
  <section class="bottom-cta wrap"><img :src="withBase('/brand/logo-light.svg')" alt=""><div><h2>开始配置你的第一个同步任务</h2><p>阅读部署与配置文档，验证全量、增量和重启恢复。</p></div><a class="rm-button" :href="withBase('/guide/')">进入文档中心 ↗</a></section>
</div>
</template>
