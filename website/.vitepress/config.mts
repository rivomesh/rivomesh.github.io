import {defineConfig} from 'vitepress'
export default defineConfig({
  title:'RivoMesh',lang:'zh-CN',base:'/',cleanUrls:false,
  description:'RivoMesh 数据库实时同步平台：将 MySQL 全量与增量数据同步到信创数据库、分析系统和消息队列，支持多目标分发、持久断点、多节点观察与共享访问；源适配接口面向更多数据库扩展。',
  appearance:true,
  head:[['link',{rel:'icon',type:'image/svg+xml',href:'/brand/favicon.svg'}],['link',{rel:'alternate icon',href:'/favicon.ico'}],['link',{rel:'apple-touch-icon',href:'/brand/apple-touch-icon.png'}],['meta',{name:'theme-color',content:'#173875'}],['meta',{property:'og:image',content:'https://rivomesh.github.io/brand/social-card.png'}]],
  sitemap:{hostname:'https://rivomesh.github.io'},
  markdown:{headers:{level:[2,3]},theme:{light:'github-light',dark:'github-dark'},lineNumbers:false},
  vite:{build:{chunkSizeWarningLimit:650}},
  transformPageData(page){if(page.frontmatter.kind==='docs')page.frontmatter.description=page.description||`${page.title} · RivoMesh 0.1.0-SNAPSHOT 使用文档`}
})
