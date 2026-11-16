import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('site')
async function walk(p){const out=[];for(const e of await fs.readdir(p,{withFileTypes:true})){if(['node_modules','dist','cache'].includes(e.name))continue;const f=path.join(p,e.name);if(e.isDirectory())out.push(...await walk(f));else out.push(f)}return out}
const files=await walk(root), errors=[]
async function exists(p){try{return(await fs.stat(p)).isFile()}catch{return false}}
let checked=0
for(const f of files.filter(f=>f.endsWith('.md'))){
 const raw=await fs.readFile(f,'utf8')
 for(const [,href]of raw.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)\)/g)){
  if(/^(https?:|mailto:|#|data:)/.test(href))continue
  const url=decodeURI(href.split('#')[0]);let target
  if(url.startsWith('/'))target=path.join(root,url);else target=path.resolve(path.dirname(f),url)
  const publicFile=path.join(root,'public',url)
  const candidates=[target,target+'.md',target.replace(/\.html$/,'.md'),path.join(target,'index.md'),publicFile]
  if(!(await Promise.all(candidates.map(exists))).some(Boolean)) errors.push(`${path.relative(root,f)}: ${href}`)
  checked++
 }
}
const req=JSON.parse(await fs.readFile('site/.vitepress/data/requirements.json','utf8'))
const ids=new Set(req.requirements.map(r=>r.id))
if(ids.size!==req.requirements.length)errors.push('Duplicate SDD requirement IDs')
for(const r of req.requirements){if(!r.title['zh-CN']||!r.acceptance['zh-CN'])errors.push(`Missing requirement text: ${r.id}`);for(const dep of r.dependsOn)if(!ids.has(dep))errors.push(`Unknown dependency ${dep}`)}
for(const asset of ['favicon.ico','brand/logo.svg','brand/logo-light.svg','brand/social-card.png','brand/apple-touch-icon.png','media/console-overview.png','media/task-wizard.png','media/connector-catalog.png','media/rivomesh-tour.mp4','media/tour.zh-CN.vtt'])if(!await exists(path.join(root,'public',asset)))errors.push('Missing asset '+asset)
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Validated ${checked} local documentation links, ${ids.size} SDD requirements and required media.`)
