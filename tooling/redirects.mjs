import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('website/.vitepress/dist'),redirects=JSON.parse(await fs.readFile('website/.vitepress/data/redirects.json','utf8'))
let count=0
for(const [from,to]of Object.entries(redirects)){
 const file=path.join(root,from.endsWith('/')?from+'index.html':from)
 try{await fs.access(file);continue}catch{}
 await fs.mkdir(path.dirname(file),{recursive:true})
 const canonical='https://rivomesh.github.io'+to
 const english=to.startsWith('/en/')||to.startsWith('/docs/en/')
 const lang=english?'en':'zh-CN'
 const title=english?'Documentation moved':'文档已迁移'
 const link=english?'Open the current document':'进入新文档'
 await fs.writeFile(file,`<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0;url=${to}"><title>RivoMesh · ${title}</title></head><body><p><a href="${to}">${link}</a></p><script>location.replace(${JSON.stringify(to)}+location.search+location.hash)</script></body></html>`);count++
}
console.log(`Generated ${count} redirects for earlier documentation URLs.`)

await fs.writeFile(path.join(root,'404.html'),`<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.ico">
<title>页面未找到 / Page not found | RivoMesh</title>
<style>
:root{color-scheme:light dark;font:1rem/1.65 system-ui,sans-serif;background:light-dark(#f5f8fc,#111c2c);color:light-dark(#182e4a,#eff6ff)}
body{margin:0;padding:1rem;min-height:100vh;box-sizing:border-box;display:grid;place-items:center}
main{box-sizing:border-box;width:min(100%,36rem);padding:clamp(1.25rem,6vw,3rem);border:1px solid light-dark(#cfdae7,#3f526e);border-radius:1rem;background:light-dark(#fff,#182638)}
h1{line-height:1.25;margin:0 0 .6rem}
a{color:light-dark(#245493,#accaff);text-underline-offset:.2em}
nav{display:flex;gap:.5rem 1rem;flex-wrap:wrap;margin-top:1.5rem}
</style>
</head>
<body>
<main>
<h1>页面未找到 <span lang="en">/ Page not found</span></h1>
<p>这个链接可能已经迁移。请从首页或使用指南查找当前内容。</p>
<p lang="en">This link may have moved. Start from the home page or documentation.</p>
<nav aria-label="RivoMesh">
<a href="/">中文首页</a><a href="/docs/zh/start/index.html">中文使用指南</a>
<a href="/en/" lang="en">English home</a><a href="/docs/en/start/index.html" lang="en">English documentation</a>
</nav>
</main>
</body>
</html>
`)
