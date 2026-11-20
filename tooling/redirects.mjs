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
