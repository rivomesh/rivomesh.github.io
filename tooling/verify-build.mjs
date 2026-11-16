import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('website/.vitepress/dist'),pages=JSON.parse(await fs.readFile('website/.vitepress/data/pages.json','utf8')),navigation=JSON.parse(await fs.readFile('website/.vitepress/data/navigation.json','utf8'))
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p)}return out}
const files=await walk(root),known=new Set(files),errors=[];let links=0
const docs=new Map(pages.map(p=>[p.route,p]))
for(const file of files.filter(p=>p.endsWith('.html'))){const raw=await fs.readFile(file,'utf8'),url='https://rivomesh.github.io/'+path.relative(root,file).split(path.sep).join('/');
 for(const [,value]of raw.matchAll(/(?:href|src)="([^"]+)"/g)){if(/^(https?:|mailto:|tel:|data:|javascript:|#)/.test(value))continue;const target=new URL(value.replaceAll('&amp;','&'),url);let rel=decodeURIComponent(target.pathname);if(rel.endsWith('/'))rel+='index.html';const full=path.join(root,rel);if(!known.has(full))errors.push(`${path.relative(root,file)}: ${value}`);links++}
 const record=docs.get(new URL(url).pathname);if(record){const sidebar=raw.match(/<nav[^>]*data-sidebar-scroll[^>]*>([\s\S]*?)<\/nav>/)?.[1];if(!sidebar){errors.push('Missing stable sidebar: '+record.route);continue}
 const menu=[...sidebar.matchAll(/<a\b([^>]+)>/g)].map(m=>({href:m[1].match(/href="([^"]+)"/)?.[1],current:m[1].includes('aria-current="page"')})).filter(i=>i.href?.startsWith('/docs/'));const expected=navigation[record.locale].flatMap(g=>g.items.map(i=>i.route));if(JSON.stringify(menu.map(i=>i.href))!==JSON.stringify(expected))errors.push('Different sidebar tree: '+record.route);const current=menu.filter(i=>i.current);if(current.length!==1||current[0].href!==record.route)errors.push('Incorrect active document: '+record.route)}
}
if(errors.length){console.error([...new Set(errors)].join('\n'));process.exitCode=1}else console.log(`Verified ${links} published navigation/asset URLs and identical sidebar ordering + exact active page on all ${pages.length} document pages (${files.filter(p=>p.endsWith('.html')).length} HTML files including redirects).`)
