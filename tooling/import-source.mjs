import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { documentCopy } from './document-copy.mjs'
const source = path.resolve(process.argv[2] || '../rivomesh')
const root = path.resolve('website')
const repo = 'https://github.com/rivomesh/rivomesh'
const baselineRoute = '/docs/zh/evidence/baseline.html'
const registry = path.join(root, '.vitepress/data')
async function write(file,text){await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,text)}
// Pin all imported documents, attachments and catalog data to one committed source tree.
// In-progress product changes can coexist with a reproducible documentation refresh.
const git=(...args)=>execFileSync('git',['-C',source,...args],{encoding:'utf8',maxBuffer:16*1024*1024})
const sourceCommit=git('rev-parse','--verify',(process.argv[3]||'HEAD')+'^{commit}').trim()
const sourcePaths=new Set(git('ls-tree','-r','--name-only','-z',sourceCommit).split('\0').filter(Boolean))
const sourceDirectories=new Set()
for(const file of sourcePaths){
 for(let dir=path.posix.dirname(file);dir!=='.';dir=path.posix.dirname(dir))sourceDirectories.add(dir)
}
const readSource=file=>git('show',sourceCommit+':'+file)
const sourceFiles=[...sourcePaths].filter(f=>f.startsWith('docs/')&&f.endsWith('.md')&&!f.startsWith('docs/sdd/')&&!f.endsWith('/requirements-and-decisions.md')).sort()
const inputs=new Map(sourceFiles.map(f=>[path.join(source,f),readSource(f)]))
const catalogSource=readSource('sync-app/src/main/java/io/github/rivomesh/platform/AdapterCatalog.java')
const previousPages=JSON.parse(await fs.readFile(path.join(registry,'pages.json'),'utf8'))
const previousRedirects=JSON.parse(await fs.readFile(path.join(registry,'redirects.json'),'utf8'))
const manualNames={
 'pipeline-v3':['多库、多目标同步配置','Multi-database pipelines'], 'console-and-deployment':['控制台与部署','Console & deployment'],
 'configuration-editor':['配置编辑与版本恢复','Configuration revisions'], 'development-preview':['开发预览','Development preview'],
 'account-management':['账号管理','Account management'], 'browser-sessions':['浏览器会话','Browser sessions'],
 'execution-lifecycle':['管理与执行 Agent 分离','Controller and Agent lifecycle'],
 'global-control':['跨节点任务控制','Global task control'],
 'postgresql-source':['PostgreSQL 源端','PostgreSQL source'], 'oracle-source':['Oracle 源端','Oracle source'],
 'compatibility':['连接器、运行时与 API 兼容矩阵','Connector, runtime & API compatibility'],
 'capture-recovery':['源端采集故障恢复','Source capture recovery'], 'nonempty-target-preview':['非空目标接管预览','Nonempty target adoption preview'],
 'oidc-login':['OIDC 单点登录','OIDC sign-in'], 'release-inventory':['发布包与驱动依赖清单','Release packages & driver inventory'],
 'shared-access':['共享账号、会话与审计','Shared access'], 'node-registry':['共享节点目录','Node registry'],
 'task-authorization':['按任务授权','Task authorization'], 'security-audit':['安全审计','Security audit'],
 'reconciliation-workflow':['校验与修复流程','Reconciliation workflow'], 'managed-validation':['管理界面数据校验','Managed validation'],
 'common-cut-repair':['共同校验点修复','COMMON_CUT repair'], 'managed-repair':['管理界面数据修复','Managed repair'],
 'performance':['性能与运行时验证','Performance & runtimes'], 'recovery':['恢复与一致性','Recovery & consistency'],
 'validation':['验证记录汇总','Validation records'], 'platform-design':['完整平台设计','Platform design'],
 'implementation-status':['当前实施状态','Implementation status'],
 'rename-migration':['版本与更名迁移','Rename migration'], 'gaussdb-index-policy':['GaussDB 索引策略','GaussDB index policy'],
 'messaging-v3':['消息目标与投递协议','Messaging targets'], 'classic-v3':['ActiveMQ Classic','ActiveMQ Classic'],
 'first-release':['首版部署基线','First-release configuration'],
 'failed-transactions':['失败事务诊断','Failed transaction diagnostics'],
 'failure-evidence':['失败事务证据','Failed transaction evidence'],
 'failure-review':['证据留存与审阅','Retain and review failure evidence'],
 'commit-acknowledgement':['提交确认与断点恢复','Commit acknowledgement recovery'],
 'transaction-skip':['受控事务跳过','Controlled transaction skipping'],
 'gap-verification':['数据缺口复核','Data-gap verification'],
 'transaction-compensation':['失败事务补偿','Failed transaction compensation'],
 'manual-correction':['手工修正目标行','Manual target corrections'],
 ...Object.fromEntries([['clickhouse','ClickHouse'],['doris','Apache Doris'],['hive','Apache Hive'],['dm','达梦 DM'],['kingbase','金仓 Kingbase'],['gbase8c','GBase 8c'],['oceanbase','OceanBase']].map(([id,name])=>[id+'-v3',[name,name]]))
}
const groups={
 start:['开始使用','Get started'],sync:['安装与同步任务','Installation & tasks'],connectors:['数据源与目标','Sources & targets'],
 operations:['日常运维与数据核对','Operations & data quality'],security:['账号与权限','Accounts & access'],reference:['详细配置参考','Configuration reference'],
 architecture:['架构与实现','Architecture & implementation'],evidence:['验收与参考记录','Evidence & reference']
}
const order=Object.keys(groups)
const projectGroups=['architecture','evidence']
const assignments={
 sync:['pipeline-v3','console-and-deployment','first-release','configuration-editor','nonempty-target-preview','development-preview'],
 connectors:['compatibility','postgresql-source','oracle-source','gaussdb-index-policy','messaging-v3','classic-v3','clickhouse-v3','doris-v3','hive-v3','dm-v3','kingbase-v3','gbase8c-v3','oceanbase-v3'],
 security:['account-management','browser-sessions','oidc-login','shared-access','task-authorization','security-audit'],
 operations:['reconciliation-workflow','managed-validation','common-cut-repair','managed-repair','capture-recovery','failed-transactions','failure-evidence','failure-review','commit-acknowledgement','transaction-skip','gap-verification','transaction-compensation','manual-correction','recovery','performance','rename-migration'],
 architecture:['platform-design','global-control','implementation-status','release-inventory'],
 evidence:['validation'],
 reference:['node-registry','execution-lifecycle']
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
 }else if(rel==='verification/README.md'){sub='evidence/baseline';title='首版验证基线 / Verification baseline';rank=0
 }else if(rel.startsWith('verification/')){sub='evidence/'+rel.slice('verification/'.length).replace(/\/README\.md$|\.md$/,'').replaceAll('/','-');title=rel.split('/')[1].replace(/^2026-11-/,'11-')+' · '+title;rank=1
 }else{sub='reference/'+path.basename(rel,'.md');group='architecture';rank=99}
 if(['sync','operations','security'].includes(group))group='reference'
 if(path.basename(rel,'.md')==='development-preview')group='architecture'
 if(rel==='development-v3.md')title='历史实现参考'
 const route=`/docs/${locale}/${sub}.html`;const item={locale,route,title,group,rank,sourcePath:'docs/'+rel}
 map.set(file,item);records.push(item)
}
const routes=new Set()
for(const record of records){if(routes.has(record.route))throw new Error('Duplicate imported route: '+record.route);routes.add(record.route)}
// Replace generated directories only; authored start pages are maintained separately.
for(const locale of ['zh','en'])for(const dir of ['reference','sdd','evidence'])await fs.rm(path.join(root,'docs',locale,dir),{recursive:true,force:true})
await fs.rm(path.join(root,'public/files/docs/sdd'),{recursive:true,force:true})
await fs.rm(path.join(registry,'requirements.json'),{force:true})
const attachments=new Map(), warnings=[]
async function resolveLink(file,href){
 if(/^(https?:|mailto:|#|data:|\/)/.test(href))return href.replaceAll('zhangjiayin/rivomesh','rivomesh/rivomesh')
 const m=href.match(/^([^#?]+)(.*)$/);if(!m)return href
 const full=path.resolve(path.dirname(file),decodeURI(m[1]));const fragment=m[2]
 if(map.has(full))return map.get(full).route+fragment
 if(!full.startsWith(source+path.sep))return href
 const rel=path.relative(source,full).split(path.sep).join('/')
 if(rel.endsWith('/requirements-and-decisions.md')||rel.startsWith('docs/sdd/')){
  const locale=rel.startsWith('docs/en/')?'en':map.get(file).locale
  return '/docs/'+locale+'/reference/implementation-status.html'
 }
 if(!sourcePaths.has(rel)&&!sourceDirectories.has(rel)){
  if(rel.startsWith('docs/verification/'))return baselineRoute
  warnings.push(rel);return repo+'/blob/'+sourceCommit+'/'+rel+fragment
 }
 const downloadable=sourcePaths.has(rel)&&/\.(ya?ml|xml|json)$/.test(rel)&&!/(credentials|controller|secrets)\.json$/i.test(rel)
 if(downloadable){const dest=path.join(root,'public/files',rel);if(!attachments.has(rel)){await write(dest,readSource(rel));attachments.set(rel,true)}return '/files/'+rel+fragment}
 return repo+(sourceDirectories.has(rel)?'/tree/':'/blob/')+sourceCommit+'/'+rel+fragment
}
const hashes=[]
for(const [file,raw]of inputs){
 const meta=map.get(file);let content=raw.replaceAll('zhangjiayin/rivomesh','rivomesh/rivomesh')
 // Keep protocol fields and file paths intact; present configuration revisions as a technical detail.
 if(meta.sourcePath.endsWith('-v3.md') && meta.group!=='architecture'){
  content=content.replace(/^# (.+)$/m,(_,title)=>'# '+title.replace(/V3\s*/g,'').replace(/v3\s*/g,'').trim())
  if(meta.sourcePath.endsWith('/pipeline-v3.md'))content=content.replace(/^(# .+)$/m,`$1\n\n${meta.locale==='zh'?'本手册介绍多库、多目标同步。配置中的 \`formatVersion: 3\`（界面可能标为 V3）是任务配置格式，用于区分旧的单库单目标任务，不是数据库版本或用户需要掌握的开发阶段。新建任务使用默认格式；已有任务不能只改版本号迁移。':'This manual covers multi-database, multi-target synchronization. \`formatVersion: 3\` (V3 in some console labels) identifies the task configuration format, not a database version or development phase. Keep the default for new tasks; changing the number does not migrate an existing task.'}`)
 }
 content=documentCopy(meta,content)
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
 'zh/start/multi-node':{title:'多节点部署与恢复',group:'sync',rank:3},'zh/start/xinchuang':{title:'信创数据库适配与改造',group:'start',rank:4},
 'zh/start/architecture':{title:'同步平台架构',rank:7},'zh/start/replication':{title:'源端同步原理',rank:8},
 'zh/start/index':{title:'使用指南',rank:0},'zh/start/introduction':{title:'项目介绍',rank:1},'zh/start/quick-start':{title:'快速开始',rank:2},'zh/start/compatibility':{title:'兼容性与能力边界',rank:3},'zh/start/scenarios':{title:'场景与试点指南',rank:4},'zh/start/faq':{title:'常见问题',rank:5},'zh/start/connectors':{title:'连接器目录',rank:-1,group:'connectors'},'zh/start/roadmap':{title:'项目路线图',rank:6,group:'start'},
 'en/start/install':{title:'Installation and sign-in',group:'sync',rank:0},'en/start/create-task':{title:'Create a synchronization task',group:'sync',rank:1},'en/start/monitoring':{title:'Progress and daily operations',group:'sync',rank:2},
 'en/start/troubleshooting':{title:'Troubleshooting',group:'operations',rank:0},'en/start/data-validation':{title:'Validate data and review repairs',group:'operations',rank:1},'en/start/backup':{title:'Backup and recovery',group:'operations',rank:2},'en/start/access':{title:'Accounts and permissions',group:'security',rank:0},'en/start/scenarios':{title:'Use cases and evaluation',rank:4},'en/start/faq':{title:'Frequently asked questions',rank:5},
 'en/start/multi-node':{title:'Multi-node deployment',group:'sync',rank:3},'en/start/xinchuang':{title:'Database compatibility validation',group:'start',rank:4},
 'en/start/architecture':{title:'Replication architecture',rank:7},'en/start/replication':{title:'How source replication works',rank:8},
 'en/start/index':{title:'User guide',rank:0},'en/start/introduction':{title:'Introduction',rank:1},'en/start/quick-start':{title:'Quick start',rank:2},'en/start/compatibility':{title:'Compatibility',rank:3},'en/start/connectors':{title:'Connector catalog',rank:-1,group:'connectors'},'en/start/roadmap':{title:'Roadmap',rank:6,group:'start'}
}
for(const [key,meta]of Object.entries(authored))records.push({locale:key.split('/')[0],route:'/docs/'+key+'.html',title:meta.title,rank:meta.rank,group:meta.group||'start'})
const navigation={}
for(const locale of ['zh','en'])navigation[locale]=order.map(id=>({id,audience:projectGroups.includes(id)?'project':'user',defaultClosed:id==='reference'||projectGroups.includes(id),title:groups[id][locale==='zh'?0:1],items:records.filter(r=>r.locale===locale&&r.group===id).sort((a,b)=>a.rank-b.rank||a.route.localeCompare(b.route)).map(({route,title})=>({route,title}))})).filter(g=>g.items.length)
const search=[]
for(const record of records){let content;try{content=await fs.readFile(path.join(root,record.route.replace(/\.html$/,'.md')),'utf8')}catch{continue}
 const body=content.replace(/^---\n[\s\S]*?\n---\n/,'').replace(/```[\s\S]*?```/g,' ').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/[<#>*_`|{}]/g,' ').replace(/\s+/g,' ').trim()
 search.push({route:record.route,title:record.title,locale:record.locale,audience:projectGroups.includes(record.group)?'project':'user',group:groups[record.group][record.locale==='zh'?0:1],text:body})
}
const snapshot={capturedAt:new Date().toISOString(),version:'0.1.0-SNAPSHOT',sourceRepository:repo,sourceCommit,documents:hashes,attachments:[...attachments.keys()],sourceCatalogSha256:createHash('sha256').update(catalogSource).digest('hex')}
await write(path.join(root,'.vitepress/data/navigation.json'),JSON.stringify(navigation,null,2)+'\n')
await write(path.join(root,'.vitepress/data/pages.json'),JSON.stringify(records,null,2)+'\n')
await write(path.join(root,'.vitepress/data/connectors.json'),JSON.stringify(connectors,null,2)+'\n')
await write(path.join(root,'public/search-index.json'),JSON.stringify(search)+'\n')
await write(path.join(root,'public/source-snapshot.json'),JSON.stringify(snapshot,null,2)+'\n')
const redirects=Object.fromEntries([...map.entries()].map(([file,r])=>['/reference/'+path.relative(path.join(source,'docs'),file).replace(/\.md$/,'.html').split(path.sep).join('/'),r.route]))
function replacement(route){
 if(route.startsWith('/docs/zh/evidence/'))return baselineRoute
 const retired=route.match(/^\/docs\/(zh|en)\/(?:sdd\/.*|reference\/(?:development-(?:preview|v3)|requirements-and-decisions))\.html$/)
 return retired?`/docs/${retired[1]}/reference/implementation-status.html`:undefined
}
for(const page of previousPages)if(page.sourcePath&&!routes.has(page.route)&&replacement(page.route))redirects[page.route]=replacement(page.route)
for(const [from,to] of Object.entries(previousRedirects)){
 if(redirects[from]||routes.has(from))continue
 const target=routes.has(to)?to:replacement(to)
 if(target)redirects[from]=target
}
Object.assign(redirects,{'/guide/':'/docs/zh/start/index.html','/guide/introduction.html':'/docs/zh/start/introduction.html','/guide/quick-start.html':'/docs/zh/start/quick-start.html','/guide/compatibility.html':'/docs/zh/start/compatibility.html','/guide/faq.html':'/docs/zh/start/faq.html','/guide/scenarios.html':'/docs/zh/start/scenarios.html','/roadmap.html':'/docs/zh/start/roadmap.html','/ecosystem/':'/docs/zh/start/connectors.html','/community/':'/community.html','/community/brand.html':'/brand.html'})
await write(path.join(root,'.vitepress/data/redirects.json'),JSON.stringify(redirects,null,2)+'\n')
console.log(`Imported ${hashes.length} source documents; registered ${records.length} docs in one navigation tree per language; ${connectors.length} catalog entries.`)
if(warnings.length)console.log(`Source references not present in checkout: ${[...new Set(warnings)].length} (linked to the public source repository).`)
