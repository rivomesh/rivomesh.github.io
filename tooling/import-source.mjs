import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
const source = path.resolve(process.argv[2] || '../rivomesh')
const root = path.resolve('website')
const repo = 'https://github.com/rivomesh/rivomesh'
const slug = '001-control-recovery-compatibility'
async function walk(dir) { const result=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const f=path.join(dir,e.name);if(e.isDirectory())result.push(...await walk(f));else result.push(f)}return result.sort() }
async function write(file,text){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,text)}
// Capture all source documents and the SDD inventory before generating any output.
const sourceFiles=(await walk(path.join(source,'docs'))).filter(f=>f.endsWith('.md'))
const inputs=new Map(await Promise.all(sourceFiles.map(async f=>[f,await fs.readFile(f,'utf8')])))
const requirements=JSON.parse(await fs.readFile(path.join(source,'docs/sdd',slug,'requirements.json'),'utf8'))
const catalogSource=await fs.readFile(path.join(source,'sync-app/src/main/java/io/rivomesh/platform/AdapterCatalog.java'),'utf8')
const manualNames={
 'pipeline-v3':['同步任务与 V3 配置','V3 pipelines'], 'console-and-deployment':['控制台与部署','Console & deployment'],
 'configuration-editor':['配置编辑与版本恢复','Configuration revisions'], 'development-preview':['开发预览','Development preview'],
 'account-management':['账号管理','Account management'], 'browser-sessions':['浏览器会话','Browser sessions'],
 'shared-access':['共享账号、会话与审计','Shared access'], 'node-registry':['共享节点目录','Node registry'],
 'task-authorization':['按任务授权','Task authorization'], 'security-audit':['安全审计','Security audit'],
 'reconciliation-workflow':['校验与修复流程','Reconciliation workflow'], 'managed-validation':['管理界面数据校验','Managed validation'],
 'common-cut-repair':['共同校验点修复','COMMON_CUT repair'], 'managed-repair':['管理界面数据修复','Managed repair'],
 'performance':['性能与运行时验证','Performance & runtimes'], 'recovery':['恢复与一致性','Recovery & consistency'],
 'validation':['验证记录汇总','Validation records'], 'platform-design':['完整平台设计','Platform design'],
 'requirements-and-decisions':['需求与决策','Requirements & decisions'], 'implementation-status':['当前实施状态','Implementation status'],
 'rename-migration':['版本与更名迁移','Rename migration'], 'gaussdb-index-policy':['GaussDB 索引策略','GaussDB index policy'],
 'messaging-v3':['消息目标与投递协议','Messaging targets'], 'classic-v3':['ActiveMQ Classic','ActiveMQ Classic'],
 ...Object.fromEntries([['clickhouse','ClickHouse'],['doris','Apache Doris'],['hive','Apache Hive'],['dm','达梦 DM'],['kingbase','金仓 Kingbase'],['gbase8c','GBase 8c'],['oceanbase','OceanBase']].map(([id,name])=>[id+'-v3',[name,name]]))
}
const groups={
 start:['开始使用','Get started'],sync:['安装与同步任务','Installation & tasks'],connectors:['数据源与目标','Sources & targets'],
 operations:['日常运维与数据核对','Operations & data quality'],security:['账号与权限','Accounts & access'],reference:['详细配置参考','Configuration reference'],
 architecture:['架构与实现','Architecture & implementation'],sdd:['SDD 规格与计划','SDD specifications'],evidence:['验收与参考记录','Evidence & reference']
}
const order=Object.keys(groups)
const assignments={
 sync:['pipeline-v3','console-and-deployment','configuration-editor','development-preview'],
 connectors:['gaussdb-index-policy','messaging-v3','classic-v3','clickhouse-v3','doris-v3','hive-v3','dm-v3','kingbase-v3','gbase8c-v3','oceanbase-v3'],
 security:['account-management','browser-sessions','shared-access','task-authorization','security-audit'],
 operations:['reconciliation-workflow','managed-validation','common-cut-repair','managed-repair','recovery','performance','rename-migration'],
 architecture:['platform-design','node-registry','requirements-and-decisions','implementation-status']
}
const titleFrom=(raw)=>raw.match(/^#\s+(.+)$/m)?.[1]||'Reference'
const map=new Map(), records=[]
for(const [file,raw]of inputs){
 const rel=path.relative(path.join(source,'docs'),file).split(path.sep).join('/');let locale='zh',sub,group='evidence',title=titleFrom(raw),rank=999
 if(rel.startsWith('zh-CN/')||rel.startsWith('en/')){
  locale=rel.startsWith('en/')?'en':'zh';const stem=path.basename(rel,'.md');sub=`reference/${stem}`
  for(const [g,names]of Object.entries(assignments))if(names.includes(stem)){group=g;rank=names.indexOf(stem)}
  title=manualNames[stem]?.[locale==='zh'?0:1]||title
 }else if(rel==='recovery.md'||rel==='validation.md'){const stem=rel.slice(0,-3);sub='reference/'+stem;group=stem==='recovery'?'operations':'evidence';title=manualNames[stem][0];rank=stem==='recovery'?5:0
 }else if(rel.startsWith('sdd/')){
  locale=rel.endsWith('.en.md')?'en':'zh';const stem=path.basename(rel).replace(/\.en\.md$|\.md$/,'');sub='sdd/'+(stem==='README'?'index':stem);group='sdd'
  const labels={README:['SDD 文档索引','SDD overview'],spec:['需求规格','Requirements'],plan:['实施计划','Implementation plan'],tasks:['任务清单','Task inventory'],acceptance:['验收矩阵','Acceptance matrix'],'design-control-store':['共享控制库设计','Control store design'],'design-sessions':['会话设计','Session design'],'design-global-control':['全局控制设计','Global control design'],'design-shared-access':['共享访问设计','Shared access design']}
  title=labels[stem]?.[locale==='zh'?0:1]||title;rank=Object.keys(labels).indexOf(stem)
 }else if(rel.startsWith('verification/')){sub='evidence/'+rel.split('/')[1]+(path.basename(rel)==='README.md'?'':'-'+path.basename(rel,'.md'));title=rel.split('/')[1].replace(/^2026-11-/,'11-')+' · '+title;rank=1
 }else{sub='reference/'+path.basename(rel,'.md');group='architecture';rank=99}
 if(['sync','operations','security'].includes(group))group='reference'
 if(path.basename(rel,'.md')==='development-preview')group='architecture'
 const route=`/docs/${locale}/${sub}.html`;const item={locale,route,title,group,rank,sourcePath:'docs/'+rel}
 map.set(file,item);records.push(item)
}
// Replace generated directories only; authored start pages are maintained separately.
for(const locale of ['zh','en'])for(const dir of ['reference','sdd','evidence'])await fs.rm(path.join(root,'docs',locale,dir),{recursive:true,force:true})
const attachments=new Map(), warnings=[]
async function resolveLink(file,href){
 if(/^(https?:|mailto:|#|data:|\/)/.test(href))return href.replaceAll('zhangjiayin/rivomesh','rivomesh/rivomesh')
 const m=href.match(/^([^#?]+)(.*)$/);if(!m)return href
 const full=path.resolve(path.dirname(file),decodeURI(m[1]));const fragment=m[2]
 if(map.has(full))return map.get(full).route+fragment
 if(!full.startsWith(source+path.sep))return href
 const rel=path.relative(source,full).split(path.sep).join('/')
 let stat;try{stat=await fs.stat(full)}catch{warnings.push(rel);return repo+'/blob/main/'+rel+fragment}
 const downloadable=stat.isFile()&&/\.(ya?ml|xml|json)$/.test(rel)&&!/(credentials|controller|secrets)\.json$/i.test(rel)
 if(downloadable){const dest=path.join(root,'public/files',rel);if(!attachments.has(rel)){await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(full,dest);attachments.set(rel,true)}return '/files/'+rel+fragment}
 return repo+(stat.isDirectory()?'/tree/main/':'/blob/main/')+rel+fragment
}
const hashes=[]
for(const [file,raw]of inputs){
 const meta=map.get(file);let content=raw.replaceAll('zhangjiayin/rivomesh','rivomesh/rivomesh')
 const matches=[...content.matchAll(/(!?\[[^\]\n]*\]\()([^\s)]+)(\))/g)]
 for(const match of matches.reverse()){const href=await resolveLink(file,match[2]);content=content.slice(0,match.index)+match[1]+href+match[3]+content.slice(match.index+match[0].length)}
 let fence=false;content=content.split('\n').map(line=>{if(/^\s*(```|~~~)/.test(line)){fence=!fence;return line}if(fence)return line;return line.split(/(`+[^`]*`+)/g).map((p,i)=>i%2?p:p.replace(/</g,'&lt;').replace(/\{\{/g,'&#123;&#123;')).join('')}).join('\n')
 const front=`---\nkind: docs\nlocale: ${meta.locale}\ntitle: ${JSON.stringify(meta.title)}\nsourcePath: ${meta.sourcePath}\n---\n\n`
 await write(path.join(root,meta.route.replace(/\.html$/,'.md')),front+content)
 hashes.push({path:meta.sourcePath,sha256:createHash('sha256').update(raw).digest('hex')})
}
for(const rel of ['config/platform.yml','config/pipeline-v3.yml']) await resolveLink(path.join(source,'README.md'),rel)
// Source-derived catalog, including explicitly planned products declared in loops.
const connectors=[]
for(const m of catalogSource.matchAll(/add\(rows,"([^"]+)","([^"]+)","([^"]+)","([^"]*)"\)/g))connectors.push({id:m[1],role:m[2],status:m[3],note:m[4]})
for(const m of catalogSource.matchAll(/for\(String id:Arrays\.asList\(([^)]+)\)\)\s*add\(rows,id,"([^"]+)","([^"]+)","([^"]*)"\)/g))for(const id of m[1].matchAll(/"([^"]+)"/g))connectors.push({id:id[1],role:m[2],status:m[3],note:m[4]})
// Authored documentation joins the same registry and the same sidebar tree.
const authored={
 'zh/start/install':{title:'安装与启动',group:'sync',rank:0},'zh/start/create-task':{title:'创建同步任务',group:'sync',rank:1},'zh/start/monitoring':{title:'查看状态与日常操作',group:'sync',rank:2},
 'zh/start/troubleshooting':{title:'常见故障处理',group:'operations',rank:0},'zh/start/data-validation':{title:'核对数据与修复差异',group:'operations',rank:1},'zh/start/backup':{title:'备份与故障恢复',group:'operations',rank:2},'zh/start/access':{title:'账号与使用权限',group:'security',rank:0},
 'zh/start/index':{title:'使用指南',rank:0},'zh/start/introduction':{title:'项目介绍',rank:1},'zh/start/quick-start':{title:'快速开始',rank:2},'zh/start/compatibility':{title:'兼容性与能力边界',rank:3},'zh/start/scenarios':{title:'场景与试点指南',rank:4},'zh/start/faq':{title:'常见问题',rank:5},'zh/start/connectors':{title:'连接器目录',rank:-1,group:'connectors'},'zh/start/roadmap':{title:'项目路线图',rank:-1,group:'sdd'},
 'en/start/index':{title:'User guide',rank:0},'en/start/introduction':{title:'Introduction',rank:1},'en/start/quick-start':{title:'Quick start',rank:2},'en/start/compatibility':{title:'Compatibility',rank:3},'en/start/connectors':{title:'Connector catalog',rank:-1,group:'connectors'},'en/start/roadmap':{title:'Roadmap',rank:-1,group:'sdd'}
}
for(const [key,meta]of Object.entries(authored))records.push({locale:key.split('/')[0],route:'/docs/'+key+'.html',title:meta.title,rank:meta.rank,group:meta.group||'start'})
const navigation={}
for(const locale of ['zh','en'])navigation[locale]=order.map(id=>({id,audience:['architecture','sdd','evidence'].includes(id)?'project':'user',defaultClosed:['reference','architecture','sdd','evidence'].includes(id),title:groups[id][locale==='zh'?0:1],items:records.filter(r=>r.locale===locale&&r.group===id).sort((a,b)=>a.rank-b.rank||a.route.localeCompare(b.route)).map(({route,title})=>({route,title}))})).filter(g=>g.items.length)
const search=[]
for(const record of records){let content;try{content=await fs.readFile(path.join(root,record.route.replace(/\.html$/,'.md')),'utf8')}catch{continue}
 const body=content.replace(/^---\n[\s\S]*?\n---\n/,'').replace(/```[\s\S]*?```/g,' ').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[<#>*_`|{}]/g,' ').replace(/\s+/g,' ').trim()
 search.push({route:record.route,title:record.title,locale:record.locale,audience:['architecture','sdd','evidence'].includes(record.group)?'project':'user',group:groups[record.group][record.locale==='zh'?0:1],text:body})
}
const snapshot={capturedAt:new Date().toISOString(),version:'0.1.0-SNAPSHOT',sourceRepository:repo,documents:hashes,attachments:[...attachments.keys()],sourceCatalogSha256:createHash('sha256').update(catalogSource).digest('hex'),sdd:{version:requirements.version,date:requirements.date,state:requirements.state,counts:Object.fromEntries(['DONE','PARTIAL','NEW'].map(s=>[s,requirements.requirements.filter(r=>r.status===s).length]))}}
await write(path.join(root,'.vitepress/data/navigation.json'),JSON.stringify(navigation,null,2)+'\n')
await write(path.join(root,'.vitepress/data/pages.json'),JSON.stringify(records,null,2)+'\n')
await write(path.join(root,'.vitepress/data/requirements.json'),JSON.stringify(requirements,null,2)+'\n')
await write(path.join(root,'.vitepress/data/connectors.json'),JSON.stringify(connectors,null,2)+'\n')
await write(path.join(root,'public/search-index.json'),JSON.stringify(search)+'\n')
await write(path.join(root,'public/source-snapshot.json'),JSON.stringify(snapshot,null,2)+'\n')
const redirects=Object.fromEntries([...map.entries()].map(([file,r])=>['/reference/'+path.relative(path.join(source,'docs'),file).replace(/\.md$/,'.html').split(path.sep).join('/'),r.route]))
Object.assign(redirects,{'/guide/':'/docs/zh/start/index.html','/guide/introduction.html':'/docs/zh/start/introduction.html','/guide/quick-start.html':'/docs/zh/start/quick-start.html','/guide/compatibility.html':'/docs/zh/start/compatibility.html','/guide/faq.html':'/docs/zh/start/faq.html','/guide/scenarios.html':'/docs/zh/start/scenarios.html','/roadmap.html':'/docs/zh/start/roadmap.html','/ecosystem/':'/docs/zh/start/connectors.html','/en/':'/docs/en/start/index.html','/community/':'/community.html','/community/brand.html':'/brand.html'})
await write(path.join(root,'.vitepress/data/redirects.json'),JSON.stringify(redirects,null,2)+'\n')
console.log(`Imported ${hashes.length} source documents; registered ${records.length} docs in one navigation tree per language; ${connectors.length} catalog entries; ${requirements.requirements.length} SDD requirements.`)
if(warnings.length)console.log(`Source references not present in checkout: ${[...new Set(warnings)].length} (linked to the public source repository).`)
