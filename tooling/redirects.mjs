import fs from 'node:fs/promises'
import path from 'node:path'
const root=path.resolve('website/.vitepress/dist'),redirects=JSON.parse(await fs.readFile('website/.vitepress/data/redirects.json','utf8'))
let count=0
for(const [from,to]of Object.entries(redirects)){
 const file=path.join(root,from.endsWith('/')?from+'index.html':from)
 try{await fs.access(file);continue}catch{}
 await fs.mkdir(path.dirname(file),{recursive:true})
 const canonical='https://rivomesh.github.io'+to
 await fs.writeFile(file,`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><link rel="canonical" href="${canonical}"><meta http-equiv="refresh" content="0;url=${to}"><title>RivoMesh · 文档已迁移</title></head><body><p>文档已迁移，<a href="${to}">进入新文档</a>。</p><script>location.replace(${JSON.stringify(to)}+location.search+location.hash)</script></body></html>`);count++
}
console.log(`Generated ${count} redirects for earlier documentation URLs.`)
