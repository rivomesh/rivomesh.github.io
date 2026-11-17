<script setup>
const targets = [
  {name:'openGauss / GaussDB', scope:'openGauss 部分验证；商业及分布式 GaussDB 待验证', href:'gaussdb-index-policy'},
  {name:'达梦 DM', scope:'DM8 指定模式 · 实验性', href:'dm-v3'},
  {name:'金仓 Kingbase', scope:'V9 PG / UTF8 · 实验性', href:'kingbase-v3'},
  {name:'GBase 8c', scope:'指定 PG / UTF8 模式 · 实验性', href:'gbase8c-v3'},
  {name:'OceanBase', scope:'MySQL 兼容模式 · 实验性', href:'oceanbase-v3'}
]
const capabilities = [
  {title:'全量与增量同步', text:'先读取已有表数据，再持续捕获新增、修改和删除。持久日志保存事件与进度，重启后按已确认位置继续。', href:'/docs/zh/start/quick-start.html'},
  {title:'多库、多目标分发', text:'显式配置来源库与目标映射。各目标独立投递、确认和恢复，单个目标的 SQL 错误可独立处理。', href:'/docs/zh/reference/pipeline-v3.html'},
  {title:'Web 任务管理', text:'通过向导或 YAML 创建任务，检查连接、查看进度与积压，编辑配置并查看版本历史。', href:'/docs/zh/start/create-task.html'},
  {title:'数据核对与修复', text:'在共同检查点比较数据，审阅计划后修复目标差异。当前首批验证业务目标为 MySQL / PostgreSQL。', href:'/docs/zh/start/data-validation.html'},
  {title:'多节点与共享访问', text:'集中查看节点和心跳，按需统一账号、跨节点会话与审计。任务主备恢复按外部日志与租约配置。', href:'/docs/zh/start/multi-node.html'},
  {title:'权限与操作记录', text:'按角色、节点和任务范围分配访问权限，查询及导出操作记录，追踪配置与管理操作。', href:'/docs/zh/start/access.html'}
]
const steps = [
  {title:'安装与登录', text:'从源码构建，或通过 Docker 启动控制台。', href:'install'},
  {title:'创建同步任务', text:'连接测试源与独立空目标，检查后启动。', href:'create-task'},
  {title:'核对结果与恢复', text:'检查字段值、持续变化及重启后的进度。', href:'monitoring'}
]
</script>

<template>
  <div class="product-home">
    <section class="product-intro section-container">
      <div class="intro-copy">
        <p class="release-note">开源数据库同步 · 0.1.0-SNAPSHOT / 发布前版本</p>
        <h1>数据库实时同步</h1>
        <p class="intro-lead">面向信创改造与业务数据集成</p>
        <p class="intro-description">将业务数据持续同步到信创数据库、分析系统和消息队列。提供全量与增量同步、持久断点及 Web 管理。</p>
        <p class="source-scope">当前采集源为 MySQL。源适配接口面向更多数据库扩展，PostgreSQL、Oracle 源已列入规划。</p>
        <div class="intro-actions">
          <a class="button primary" href="/docs/zh/start/quick-start.html">快速开始</a>
          <a class="button secondary" href="/docs/zh/start/xinchuang.html">信创适配指南</a>
          <a class="plain-link" href="https://github.com/rivomesh/rivomesh">GitHub ↗</a>
        </div>
      </div>
      <figure class="product-preview">
        <a href="/tour.html" aria-label="查看控制台截图与产品讲解"><img src="/media/console-overview.png" alt="RivoMesh 任务工作台，查看任务列表、运行状态及管理操作" width="1200" height="686"></a>
        <figcaption>任务工作台 · 开发预览截图 <a href="/tour.html">查看产品导览 →</a></figcaption>
      </figure>
    </section>

    <div class="recent-update section-container">
      <span>近期进展</span>
      <p>共享账号、跨节点会话与审计已有双节点验证记录；全局任务与远端命令正在接入。</p>
      <a href="/docs/zh/reference/global-control.html">查看实现范围 →</a>
    </div>

    <section class="connections-section section-container" aria-labelledby="connections-title">
      <div class="home-section-heading">
        <h2 id="connections-title">连接业务数据与下游系统</h2>
        <a href="/docs/zh/start/connectors.html">完整连接器目录 →</a>
      </div>
      <div class="connection-layout">
        <div class="source-column">
          <h3>采集源</h3>
          <div class="current-source"><strong>MySQL</strong><span>已实现</span></div>
          <p>读取已有数据，通过 binlog 捕获后续变化。</p>
          <div class="planned-sources"><h4>后续源类型</h4><p>PostgreSQL、Oracle <span>规划中</span></p><p>其他数据库通过源适配接口逐步扩展。</p><a href="/docs/zh/start/xinchuang.html#源端扩展计划">了解源端扩展 →</a></div>
        </div>
        <div class="target-column">
          <h3>信创数据库目标</h3>
          <ul class="domestic-targets">
            <li v-for="target in targets" :key="target.name"><a :href="`/docs/zh/reference/${target.href}.html`"><strong>{{target.name}}</strong><span>{{target.scope}}</span><span class="row-arrow" aria-hidden="true">→</span></a></li>
          </ul>
          <p class="target-note">按指定版本、驱动与模式适配。用于数据同步和改造验证，应用切换需单独评估。</p>
          <dl class="other-targets">
            <div><dt>其他关系数据库</dt><dd>MySQL · PostgreSQL</dd></div>
            <div><dt>分析系统</dt><dd>ClickHouse · Apache Doris · Apache Hive</dd></div>
            <div><dt>消息系统</dt><dd>Kafka · Pulsar · RabbitMQ · RocketMQ 等</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section class="capabilities-section section-container" aria-labelledby="capabilities-title">
      <div class="home-section-heading"><h2 id="capabilities-title">同步与管理能力</h2><a href="/docs/zh/start/introduction.html">项目介绍 →</a></div>
      <dl class="capability-list"><div v-for="item in capabilities" :key="item.title"><dt><a :href="item.href">{{item.title}} <span aria-hidden="true">→</span></a></dt><dd>{{item.text}}</dd></div></dl>
    </section>

    <section class="deployment-section" aria-labelledby="deployment-title">
      <div class="section-container deployment-layout">
        <div class="deployment-intro"><h2 id="deployment-title">多节点部署</h2><p>根据使用需要，分别配置节点观察、共享访问和同步任务主备恢复。控制器保留各自的持久目录。</p><a href="/docs/zh/start/multi-node.html">部署步骤与恢复条件 →</a></div>
        <dl class="deployment-details">
          <div><dt>节点状态</dt><dd>通过共享控制库查看节点、心跳、资源和任务观察。</dd></div>
          <div><dt>统一访问</dt><dd>显式启用共享账号、会话和审计，在不同入口使用统一身份。</dd></div>
          <div><dt>任务主备</dt><dd>符合条件的工作进程通过外部日志与租约接管，旧进程受到写入隔离。</dd></div>
          <div class="integration-note"><dt>接入中</dt><dd>公开控制台的任务操作仍针对本机。全局任务控制、自动迁移和控制面高可用尚未完成。</dd></div>
        </dl>
      </div>
    </section>

    <section class="getting-started section-container" aria-labelledby="start-title">
      <div class="home-section-heading"><h2 id="start-title">开始使用</h2><a href="/docs/zh/start/index.html">全部使用文档 →</a></div>
      <ol class="start-steps"><li v-for="(step,index) in steps" :key="step.title"><span class="step-index">0{{index+1}}</span><div><h3><a :href="`/docs/zh/start/${step.href}.html`">{{step.title}} →</a></h3><p>{{step.text}}</p></div></li></ol>
      <div class="project-note"><p>使用前请按实际数据库版本、数据类型和故障场景验证。项目计划与验收记录持续更新。</p><div><a href="/docs/zh/start/roadmap.html">产品路线图</a><a href="/project.html">架构与验证资料</a><a href="/community.html">参与项目</a></div></div>
    </section>
  </div>
</template>

<style scoped>
.product-home{font-size:14px}
.product-intro{display:grid;grid-template-columns:1fr 1.03fr;gap:60px;align-items:center;padding:72px 0 58px}
.release-note{font-size:12px;color:var(--muted);margin-bottom:23px}
.intro-copy h1{font-size:46px;line-height:1.3;font-weight:650;letter-spacing:-1px;margin-bottom:15px}
.intro-lead{font-size:22px;line-height:1.6;margin-bottom:18px;font-weight:500}
.intro-description{font-size:15px;line-height:1.95;color:var(--muted);max-width:480px}
.source-scope{font-size:12px;line-height:1.9;color:var(--muted);max-width:450px;margin-top:16px}
.intro-actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px;margin-top:27px}
.intro-actions .button{padding:10px 20px;border-radius:4px;box-shadow:none;transform:none}
.plain-link{font-size:12px;margin-left:8px;color:var(--muted)}
.product-preview{min-width:0;margin:0}
.product-preview>a{display:block;border:1px solid var(--line);border-radius:4px;overflow:hidden;background:var(--surface)}
.product-preview img{display:block;width:100%;height:auto;aspect-ratio:1.75;object-fit:cover;object-position:top}
.product-preview figcaption{display:flex;justify-content:space-between;gap:15px;font-size:11px;color:var(--muted);margin-top:13px}
.product-home a:hover{color:var(--blue)}
.intro-actions .primary:hover{color:#fff}
.recent-update{display:flex;align-items:baseline;gap:22px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:17px 0;font-size:12px}
.recent-update>span{font-weight:600;white-space:nowrap}
.recent-update>p{flex:1;color:var(--muted);line-height:1.9}
.recent-update>a{white-space:nowrap;color:var(--blue)}
.home-section-heading{display:flex;align-items:baseline;justify-content:space-between;gap:24px;margin-bottom:30px}
.home-section-heading h2,.deployment-intro h2{font-size:25px;line-height:1.6;font-weight:600;letter-spacing:-.3px}
.home-section-heading>a,.deployment-intro>a{font-size:12px;color:var(--blue)}
.connections-section{padding:58px 0}
.connection-layout{display:grid;grid-template-columns:1fr 2fr;gap:60px}
.connection-layout h3{font-size:13px;font-weight:600;margin-bottom:15px}
.source-column{border-right:1px solid var(--line);padding-right:40px}
.current-source{display:flex;align-items:baseline;gap:15px;margin:20px 0 8px}
.current-source strong{font-size:23px;font-weight:600}
.current-source span{font-size:11px;color:var(--green)}
.source-column p{font-size:12px;line-height:1.9;color:var(--muted)}
.planned-sources{margin-top:35px}
.planned-sources h4{font-size:12px;font-weight:500;color:var(--muted);margin-bottom:10px}
.planned-sources p{margin:6px 0}
.planned-sources p span{font-size:10px;margin-left:10px}
.planned-sources>a{font-size:12px;color:var(--blue);display:inline-block;margin-top:11px}
.domestic-targets{list-style:none}
.domestic-targets li+li{border-top:1px solid var(--line)}
.domestic-targets a{display:grid;grid-template-columns:180px 1fr 12px;gap:12px;align-items:baseline;padding:12px 0;line-height:1.75}
.domestic-targets strong{font-size:14px;font-weight:550}
.domestic-targets span{font-size:11px;color:var(--muted)}
.domestic-targets .row-arrow{color:var(--blue)}
.target-note{color:var(--muted);font-size:11px;line-height:1.9;margin-top:14px}
.other-targets{border-top:1px solid var(--line);margin-top:24px;padding-top:14px}
.other-targets>div{display:grid;grid-template-columns:130px 1fr;gap:15px;margin:7px 0;font-size:12px;line-height:1.8}
.other-targets dt{font-weight:500}.other-targets dd{color:var(--muted);margin:0}
.capabilities-section{border-top:1px solid var(--line);padding:47px 0 54px}
.capability-list{display:grid;grid-template-columns:1fr 1fr;column-gap:65px;margin:0}
.capability-list>div{padding:23px 0;border-top:1px solid var(--line)}
.capability-list dt{font-size:16px;font-weight:550;margin-bottom:9px}
.capability-list dt span{font-size:13px;color:var(--muted);margin-left:5px}
.capability-list dd{font-size:13px;line-height:1.95;color:var(--muted);margin:0;max-width:490px}
.deployment-section{background:var(--surface);border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:45px 0}
.deployment-layout{display:grid;grid-template-columns:1fr 1.7fr;gap:75px}
.deployment-intro p{font-size:13px;line-height:1.95;color:var(--muted);margin:16px 0 22px;max-width:310px}
.deployment-details{margin:0}
.deployment-details>div{display:grid;grid-template-columns:90px 1fr;gap:20px;padding:13px 0;border-bottom:1px solid var(--line);font-size:13px;line-height:1.9}
.deployment-details>div:first-child{padding-top:0}.deployment-details>div:last-child{border-bottom:0;padding-bottom:0}
.deployment-details dt{font-weight:550}.deployment-details dd{color:var(--muted);margin:0}
.deployment-details .integration-note{font-size:12px}
.getting-started{padding:52px 0 35px}
.start-steps{list-style:none;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:40px}
.start-steps>li{display:flex;gap:17px}
.step-index{font-size:13px;font-family:monospace;color:var(--muted);padding-top:3px}
.start-steps h3{font-size:15px;font-weight:550;margin-bottom:8px}
.start-steps p{font-size:12px;color:var(--muted);line-height:1.9}
.project-note{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:12px 30px;border-top:1px solid var(--line);margin-top:38px;padding-top:22px;font-size:11px;color:var(--muted)}
.project-note>div{display:flex;gap:20px}.project-note a{color:var(--blue)}
@media(min-width:1450px){.product-intro{padding-top:85px;padding-bottom:70px;gap:75px}.intro-copy h1{font-size:51px}}
@media(max-width:1050px){.product-intro{gap:35px;padding:50px 0}.intro-copy h1{font-size:38px}.intro-lead{font-size:19px}.intro-description{font-size:14px}.connection-layout{gap:35px}.domestic-targets a{grid-template-columns:150px 1fr 12px}.deployment-layout{gap:40px}.recent-update{gap:15px}.recent-update>a{font-size:11px}}
@media(max-width:760px){.product-intro{grid-template-columns:1fr;gap:33px;padding:35px 0}.intro-copy h1{font-size:39px}.intro-description{max-width:580px}.source-scope{max-width:550px}.product-preview{max-width:580px}.release-note{margin-bottom:18px}.recent-update{flex-wrap:wrap;gap:7px 15px}.recent-update>p{flex-basis:calc(100% - 70px)}.recent-update>a{margin-left:63px}.home-section-heading{margin-bottom:22px;align-items:start}.home-section-heading h2,.deployment-intro h2{font-size:22px}.home-section-heading>a{white-space:nowrap;font-size:11px;padding-top:6px}.connections-section{padding:35px 0}.connection-layout{grid-template-columns:1fr;gap:28px}.source-column{padding:0 0 24px;border-right:0;border-bottom:1px solid var(--line)}.planned-sources{margin-top:18px}.current-source{margin-top:10px}.capability-list{column-gap:30px}.capabilities-section{padding:30px 0}.deployment-layout{grid-template-columns:1fr;gap:25px}.deployment-section{padding:30px 0}.deployment-intro p{max-width:580px;margin:10px 0 14px}.getting-started{padding-top:32px}.start-steps{gap:25px;grid-template-columns:1fr}.project-note{margin-top:28px}}
@media(max-width:520px){.intro-copy h1{font-size:34px;letter-spacing:-.8px}.intro-lead{font-size:18px}.release-note{font-size:10px}.intro-description{font-size:13px}.source-scope{font-size:11px}.intro-actions{gap:10px}.intro-actions .button{padding:9px 15px;font-size:12px}.plain-link{font-size:11px;margin-left:0}.product-preview figcaption{font-size:9px;gap:10px}.home-section-heading{flex-wrap:wrap;gap:5px}.home-section-heading h2{font-size:21px}.home-section-heading>a{padding:0}.domestic-targets a{grid-template-columns:1fr 12px;gap:2px 10px;padding:11px 0}.domestic-targets a>span:not(.row-arrow){grid-column:1;grid-row:2}.domestic-targets .row-arrow{grid-column:2;grid-row:1/3;align-self:center}.other-targets>div{grid-template-columns:100px 1fr;font-size:11px;gap:10px}.capability-list{grid-template-columns:1fr}.capability-list>div{padding:18px 0}.capability-list dt{font-size:15px}.capability-list dd{font-size:12px}.deployment-details>div{grid-template-columns:65px 1fr;gap:12px;font-size:12px}.project-note>div{gap:15px}.recent-update{font-size:11px}}
</style>
