import fs from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'
import sharp from 'sharp'
const root=path.resolve('website'),pages=JSON.parse(await fs.readFile(path.join(root,'.vitepress/data/pages.json'),'utf8')),navigation=JSON.parse(await fs.readFile(path.join(root,'.vitepress/data/navigation.json'),'utf8'))
async function walk(dir){const out=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){if(['dist','cache'].includes(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())out.push(...await walk(p));else out.push(p)}return out}
async function isFile(p){try{return(await fs.stat(p)).isFile()}catch{return false}}
const errors=[];let links=0
for(const locale of ['zh','en']){const actual=navigation[locale].flatMap(g=>g.items.map(i=>i.route)),expected=pages.filter(p=>p.locale===locale).map(p=>p.route);if(actual.length!==new Set(actual).size)errors.push(`Duplicate ${locale} navigation entries`);if(JSON.stringify([...actual].sort())!==JSON.stringify(expected.sort()))errors.push(`Incomplete ${locale} navigation tree`)}
for(const p of pages){if(!await isFile(path.join(root,p.route.replace(/\.html$/,'.md'))))errors.push('Missing document '+p.route)}
for(const file of (await walk(root)).filter(p=>p.endsWith('.md'))){const text=await fs.readFile(file,'utf8');for(const [,href]of text.matchAll(/!?\[[^\]\n]*\]\(([^\s)]+)\)/g)){if(/^(https?:|mailto:|#|data:)/.test(href))continue;const url=decodeURI(href.split('#')[0]),target=url.startsWith('/')?path.join(root,url):path.resolve(path.dirname(file),url);const candidates=[target,target+'.md',target.replace(/\.html$/,'.md'),path.join(target,'index.md'),path.join(root,'public',url)];if(!(await Promise.all(candidates.map(isFile))).some(Boolean))errors.push(`${path.relative(root,file)}: ${href}`);links++}}
const searchIndex=JSON.parse(await fs.readFile(path.join(root,'public/search-index.json'),'utf8'))
if([...pages,...searchIndex].some(page=>page.route.includes('/sdd/')||page.route.endsWith('/requirements-and-decisions.html')))errors.push('Internal planning documents must stay out of the published registry and search index.')
for(const asset of ['favicon.ico','brand/logo.svg','brand/logo-light.svg','brand/wordmark.svg','brand/social-card.png','brand/apple-touch-icon.png','media/console-overview.png','media/task-wizard.png','media/connector-catalog.png','media/rivomesh-tour.mp4','media/tour.zh-CN.vtt','media/transcript.txt','media/transcript.en.txt','media/tour.en.vtt','media/console-overview-900.webp','media/console-overview-1800.webp','media/task-wizard-900.webp','media/task-wizard-1800.webp','media/connector-catalog-900.webp','media/connector-catalog-1800.webp','robots.txt','search-index.json','source-snapshot.json'])if(!await isFile(path.join(root,'public',asset)))errors.push('Missing asset '+asset)
const captureRecord=JSON.parse(await fs.readFile('quality/console-screenshots-v3.json','utf8'))
const captures=new Map(captureRecord.captures.map(capture=>[capture.name,capture]))
// Check every localized image used by the shared preview component, including responsive variants.
for(const locale of ['zh','en'])for(const base of ['console-overview','task-wizard','connector-catalog','target-recovery','data-validation','node-registry']){
 const name=base+(locale==='en'?'-en':'')
 for(const [suffix,width]of [['.png',1800],['-900.webp',900],['-1800.webp',1800]]){
  const asset='media/'+name+suffix,file=path.join(root,'public',asset)
  if(!await isFile(file)){errors.push('Missing localized screenshot '+asset);continue}
  const info=await sharp(file).metadata()
  if(info.width!==width||info.height!==Math.round(width*912/1800))errors.push('Incorrect screenshot dimensions '+asset)
  if(suffix==='.png'&&createHash('sha256').update(await fs.readFile(file)).digest('hex')!==captures.get(name)?.sha256)errors.push('Screenshot does not match capture record '+asset)
 }
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Verified ${pages.length} documents, complete fixed navigation trees, ${links} local links and required media.`)
