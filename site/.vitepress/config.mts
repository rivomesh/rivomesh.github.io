import { defineConfig } from 'vitepress'
const base = process.env.SITE_BASE || '/'
const origin = process.env.SITE_ORIGIN || 'https://rivomesh.github.io'
const doc = (name: string) => '/reference/zh-CN/' + name
const items = (entries: [string,string][]) => entries.map(([text,name])=>({text,link:doc(name)}))
const sidebar = [
  {text:'认识 RivoMesh',items:[{text:'文档导航',link:'/guide/'},{text:'项目介绍',link:'/guide/introduction'},{text:'快速开始',link:'/guide/quick-start'},{text:'场景与试点建议',link:'/guide/scenarios'},{text:'常见问题',link:'/guide/faq'}]},
  {text:'使用与部署',items:items([['V3 多库多目标','pipeline-v3'],['控制台与部署','console-and-deployment'],['配置编辑与版本恢复','configuration-editor'],['开发预览','development-preview']])},
  {text:'连接器与兼容性',collapsed:true,items:[{text:'连接器目录',link:'/ecosystem/'},...items([['消息系统','messaging-v3'],['ActiveMQ Classic','classic-v3'],['ClickHouse','clickhouse-v3'],['Apache Doris','doris-v3'],['Apache Hive','hive-v3'],['OceanBase','oceanbase-v3'],['达梦 DM','dm-v3'],['金仓 Kingbase','kingbase-v3'],['GBase 8c','gbase8c-v3'],['GaussDB 索引策略','gaussdb-index-policy']])]},
  {text:'运维与数据质量',collapsed:true,items:[...items([['浏览器会话','browser-sessions'],['账号管理','account-management'],['按任务授权','task-authorization'],['安全审计','security-audit'],['校验与修复流程','reconciliation-workflow'],['管理界面数据校验','managed-validation'],['共同校验点修复','common-cut-repair'],['管理界面数据修复','managed-repair'],['性能测量','performance'],['更名迁移','rename-migration']]),{text:'恢复与一致性',link:'/reference/recovery'},{text:'验证记录',link:'/reference/validation'}]},
  {text:'架构、规划与贡献',collapsed:true,items:[...items([['完整平台方案','platform-design'],['需求与决策','requirements-and-decisions'],['实施状态','implementation-status']]),{text:'SDD 路线图',link:'/roadmap'},{text:'需求规格',link:'/reference/sdd/001-control-recovery-compatibility/spec'},{text:'实施计划',link:'/reference/sdd/001-control-recovery-compatibility/plan'},{text:'任务清单',link:'/reference/sdd/001-control-recovery-compatibility/tasks'},{text:'验收矩阵',link:'/reference/sdd/001-control-recovery-compatibility/acceptance'},{text:'参与贡献',link:'/community/'}]}
]
export default defineConfig({
  title:'RivoMesh',description:'RivoMesh 是基于 Java 的数据库实时同步平台，将 MySQL 已有数据与新增、修改、删除持续同步到数据库、分析系统和消息队列，支持全量同步、CDC 增量、断点恢复、多目标分发与 Web 管理。',
  lang:'zh-CN',base,cleanUrls:false,lastUpdated:false,
  sitemap:{hostname:origin+base},
  head:[['link',{rel:'icon',type:'image/svg+xml',href:base+'brand/favicon.svg'}],['link',{rel:'alternate icon',href:base+'favicon.ico'}],['link',{rel:'apple-touch-icon',href:base+'brand/apple-touch-icon.png'}],['meta',{name:'theme-color',content:'#15394b'}],['meta',{property:'og:image',content:origin+base+'brand/social-card.png'}]],
  markdown:{lineNumbers:true},
  themeConfig:{
    logo:{light:'/brand/logo.svg',dark:'/brand/logo-light.svg'},siteTitle:'RivoMesh',
    nav:[{text:'项目',items:[{text:'项目介绍',link:'/guide/introduction'},{text:'同步架构',link:'/#architecture'},{text:'实施状态',link:doc('implementation-status')},{text:'SDD 路线图',link:'/roadmap'}]},{text:'文档',link:'/guide/'},{text:'连接器',link:'/ecosystem/'},{text:'下载',link:'/download'},{text:'社区',items:[{text:'参与贡献',link:'/community/'},{text:'源码仓库',link:'https://github.com/rivomesh/rivomesh'},{text:'问题反馈',link:'https://github.com/rivomesh/rivomesh/issues'},{text:'Pull Requests',link:'https://github.com/rivomesh/rivomesh/pulls'}]},{text:'0.1.0 · 预发布',items:[{text:'获取与构建',link:'/download'},{text:'实施状态',link:doc('implementation-status')},{text:'SDD 计划',link:'/reference/sdd/001-control-recovery-compatibility/plan'}]},{text:'English',link:'/en/'}],
    sidebar:{'/guide/':sidebar,'/reference/zh-CN/':sidebar,'/reference/sdd/':sidebar,'/reference/recovery':sidebar,'/reference/validation':sidebar,'/reference/en/':[{text:'English documentation',items:[{text:'Overview',link:'/en/'},...['pipeline-v3','console-and-deployment','messaging-v3','account-management','security-audit','managed-validation','managed-repair','performance','implementation-status','platform-design'].map(name=>({text:name.replaceAll('-',' '),link:'/reference/en/'+name}))]}]},
    search:{provider:'local',options:{miniSearch:{options:{tokenize:(text:string)=>text.toLowerCase().match(/[a-z0-9_]+|[\u4e00-\u9fff]/g)||[],processTerm:(term:string)=>term}},locales:{root:{translations:{button:{buttonText:'搜索文档',buttonAriaLabel:'搜索文档'},modal:{noResultsText:'未找到相关内容',resetButtonTitle:'清空',backButtonTitle:'返回',displayDetails:'显示详情',footer:{selectText:'选择',navigateText:'切换',closeText:'关闭'}}}}}}},
    outline:{label:'本页目录',level:[2,3]},docFooter:{prev:'上一篇',next:'下一篇'},sidebarMenuLabel:'文档目录',returnToTopLabel:'回到顶部',darkModeSwitchLabel:'切换主题',notFound:{title:'页面未找到',quote:'从文档导航重新出发，找到你需要的内容。',linkLabel:'返回首页'},
    socialLinks:[{icon:'github',link:'https://github.com/rivomesh/rivomesh'}],
    footer:{message:'RivoMesh · 数据库实时同步平台',copyright:'© 2026 RivoMesh contributors'}
  }
})
