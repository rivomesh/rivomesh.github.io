import fs from 'node:fs/promises'
import path from 'node:path'
import {JSDOM} from 'jsdom'
import {landingPages,pageRoute,pairedRoute} from '../website/.vitepress/site-routes.mjs'
const root=path.resolve('website/.vitepress/dist'),pages=JSON.parse(await fs.readFile('website/.vitepress/data/pages.json','utf8')),routes=pages.map(p=>p.route),origin='https://rivomesh.github.io'
const files=['index.html','en/index.html',...landingPages.flatMap(name=>[name+'.html','en/'+name+'.html']),...routes.map(route=>route.slice(1))]
const errors=[]
for(const file of files){
 const doc=new JSDOM(await fs.readFile(path.join(root,file),'utf8')).window.document
 const route=pageRoute(file.replace(/\.html$/,'.md')),en=file.startsWith('en/')||file.startsWith('docs/en/')
 const canonical=doc.querySelectorAll('link[rel="canonical"]')
 if(canonical.length!==1||canonical[0].href!==origin+route)errors.push(file+': canonical')
 if(doc.documentElement.lang!==(en?'en':'zh-CN'))errors.push(file+': html lang')
 for(const selector of ['meta[name="description"]','meta[property="og:title"]','meta[property="og:description"]','meta[property="og:url"]','meta[property="og:image"]'])if(doc.querySelectorAll(selector).length!==1||!doc.querySelector(selector)?.content)errors.push(file+': '+selector)
 if(doc.querySelector('meta[property="og:url"]')?.content!==origin+route)errors.push(file+': Open Graph URL')
 for(const [locale,lang]of [['zh','zh-CN'],['en','en']]){
  const alternate=pairedRoute(route,locale,routes),other=pairedRoute(route,locale==='zh'?'en':'zh',routes),links=doc.querySelectorAll(`link[rel="alternate"][hreflang="${lang}"]`)
  if(alternate&&other){if(links.length!==1||links[0].href!==origin+alternate)errors.push(file+': '+lang+' alternate')}
  else if(links.length)errors.push(file+': invented language counterpart')
 }
 if((file==='index.html'||file.startsWith('en/')||landingPages.some(name=>file===name+'.html'))&&doc.querySelectorAll('h1').length!==1)errors.push(file+': landing page H1')
 doc.defaultView.close()
}
for(const file of ['index.html','en/index.html']){
 const doc=new JSDOM(await fs.readFile(path.join(root,file),'utf8')).window.document
 for(const id of ['how-it-works','capabilities','connectors','use-cases','product','reliability','get-started'])if(!doc.getElementById(id))errors.push(file+': missing product section '+id)
 const hero=doc.querySelector('.hero-preview img');if(!hero||hero.loading==='lazy'||hero.getAttribute('width')!=='1800'||hero.getAttribute('height')!=='912')errors.push(file+': hero image priority/dimensions')
 const nav=doc.querySelector('.main-nav');if(file.startsWith('en/')&&!nav?.querySelector('a[href="/en/download.html"]'))errors.push(file+': English navigation')
 doc.defaultView.close()
}
const sitemap=await fs.readFile(path.join(root,'sitemap.xml'),'utf8')
if(!sitemap.includes('<xhtml:link')||!sitemap.includes('https://rivomesh.github.io/en/'))errors.push('Missing multilingual sitemap links')
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}else console.log(`Verified unique metadata, canonical/hreflang pairs and HTML language on ${files.length} pages; bilingual homepage sections, image dimensions and sitemap.`)
