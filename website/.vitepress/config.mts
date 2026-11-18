import {defineConfig} from 'vitepress'
import fs from 'node:fs'
import {pageRoute,pairedRoute} from './site-routes.mjs'
const origin='https://rivomesh.github.io'
const documentRoutes=JSON.parse(fs.readFileSync(new URL('./data/pages.json',import.meta.url),'utf8')).map((page:any)=>page.route)
export default defineConfig({
  title:'RivoMesh',lang:'zh-CN',base:'/',cleanUrls:false,
  description:'RivoMesh 数据库实时同步平台：全量与 CDC 增量采集、多目标独立投递、持久断点恢复和 Web 管理。',
  locales:{root:{label:'简体中文',lang:'zh-CN'},en:{label:'English',lang:'en',link:'/en/'}},
  appearance:true,
  head:[['link',{rel:'icon',type:'image/svg+xml',href:'/brand/favicon.svg'}],['link',{rel:'alternate icon',href:'/favicon.ico'}],['link',{rel:'apple-touch-icon',href:'/brand/apple-touch-icon.png'}],['meta',{name:'theme-color',content:'#2859a6'}]],
  sitemap:{hostname:origin,transformItems(items){return items.filter(item=>item.url!=='404.html').map(item=>{const route=pageRoute(item.url.replace(/\.html$/,'.md'));const zh=pairedRoute(route,'zh',documentRoutes),en=pairedRoute(route,'en',documentRoutes);return {...item,url:route,links:zh&&en?[{lang:'zh-CN',url:origin+zh},{lang:'en',url:origin+en}]:[]}})}},
  markdown:{headers:{level:[2,3]},theme:{light:'github-light',dark:'github-dark'},lineNumbers:false},
  vite:{build:{chunkSizeWarningLimit:650}},
  transformPageData(page){
    const en=page.frontmatter.locale==='en'||page.relativePath.startsWith('en/')||page.relativePath.startsWith('docs/en/')
    page.frontmatter.lang=en?'en':'zh-CN'
    if(!page.frontmatter.description)page.frontmatter.description=en?`${page.title} — RivoMesh documentation for database replication, CDC and recoverable multi-destination delivery.`:`${page.title} · RivoMesh 数据库实时同步文档，了解全量与增量、多目标投递和恢复的实际使用范围。`
    page.description=page.frontmatter.description
  },
  transformHead({pageData}){
    const route=pageRoute(pageData.relativePath),en=pageData.frontmatter.lang==='en',description=pageData.description||pageData.frontmatter.description
    const head:any[]=[['link',{rel:'canonical',href:origin+route}],['meta',{property:'og:type',content:'website'}],['meta',{property:'og:site_name',content:'RivoMesh'}],['meta',{property:'og:title',content:`${pageData.title} | RivoMesh`}],['meta',{property:'og:description',content:description}],['meta',{property:'og:url',content:origin+route}],['meta',{property:'og:locale',content:en?'en_US':'zh_CN'}],['meta',{property:'og:image',content:origin+(en?'/brand/social-card-en.png':'/brand/social-card.png')}],['meta',{property:'og:image:width',content:'1200'}],['meta',{property:'og:image:height',content:'630'}],['meta',{property:'og:image:alt',content:en?'RivoMesh river otter and reliable database replication':'RivoMesh 水獭标识与数据库实时同步'}],['meta',{name:'twitter:card',content:'summary_large_image'}]]
    const zh=pairedRoute(route,'zh',documentRoutes),english=pairedRoute(route,'en',documentRoutes)
    if(zh&&english)head.push(['link',{rel:'alternate',hreflang:'zh-CN',href:origin+zh}],['link',{rel:'alternate',hreflang:'en',href:origin+english}],['link',{rel:'alternate',hreflang:'x-default',href:origin+english}])
    if(pageData.relativePath==='404.md')head.push(['meta',{name:'robots',content:'noindex'}])
    if(pageData.frontmatter.kind==='home')head.push(['script',{type:'application/ld+json'},JSON.stringify({'@context':'https://schema.org','@type':'SoftwareSourceCode',name:'RivoMesh',description,codeRepository:'https://github.com/rivomesh/rivomesh',url:origin+route,programmingLanguage:'Java',version:'0.1.0-SNAPSHOT'})])
    return head
  }
})
