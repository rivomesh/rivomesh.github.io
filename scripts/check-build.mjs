import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('site/.vitepress/dist'), base=process.env.SITE_BASE||'/'
async function walk(p){const out=[];for(const e of await fs.readdir(p,{withFileTypes:true})){const f=path.join(p,e.name);if(e.isDirectory())out.push(...await walk(f));else out.push(f)}return out}
const files=await walk(root),known=new Set(files),broken=[];let count=0
for(const file of files.filter(f=>f.endsWith('.html'))){
 const html=await fs.readFile(file,'utf8')
 const pageUrl='https://local.test'+base+path.relative(root,file).replaceAll(path.sep,'/')
 for(const [,raw]of html.matchAll(/(?:href|src)="([^"]+)"/g)){
  if(raw.startsWith('#')||/^(https?:|data:|mailto:|tel:|javascript:)/.test(raw))continue
  const u=new URL(raw.replaceAll('&amp;','&'),pageUrl)
  if(!u.pathname.startsWith(base)){broken.push(`${path.relative(root,file)}: escaped base path ${raw}`);continue}
  const rel=decodeURIComponent(u.pathname.slice(base.length));let target=path.join(root,rel)
  if(!rel||rel.endsWith('/'))target=path.join(target,'index.html')
  if(!known.has(target))broken.push(`${path.relative(root,file)}: ${raw}`)
  count++
 }
}
if(broken.length){console.error([...new Set(broken)].join('\n'));process.exitCode=1}else console.log(`Validated ${count} rendered asset/navigation URLs across ${files.filter(f=>f.endsWith('.html')).length} HTML pages under ${base}`)
