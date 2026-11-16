import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
const source = path.resolve(process.argv[2] || '../rivomesh')
const destination = path.resolve('site/reference')
const publicDir = path.resolve('site/public/reference-files')
const sourceRepo = 'https://github.com/rivomesh/rivomesh/blob/main/'
async function walk(dir) {
  const result = []
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) result.push(...await walk(p)); else result.push(p)
  }
  return result
}
const docs = (await walk(path.join(source, 'docs'))).filter(f => f.endsWith('.md'))
const map = new Map(docs.map(f => [f, path.join(destination, path.relative(path.join(source, 'docs'), f))]))
const manifest = []
// Source manuals are kept as snapshots. Relative Markdown links stay on this site;
// referenced text/config/evidence files are copied so the snapshot works before source publication.
const copied = new Set()
async function fileLink(full) {
  if (!copied.has(full)) {
    const ext = path.extname(full)
    if (['.yml','.yaml','.json','.xml','.txt','.log','.py','.sh','.java','.js','.html','.css',''].includes(ext)) {
      const rel = path.relative(source, full)
      const dest = path.join(publicDir, rel + (/\.(java|sh|py|js|html|css)$/.test(rel) ? '.txt' : ''))
      await fs.mkdir(path.dirname(dest), {recursive:true})
      await fs.copyFile(full,dest)
      copied.add(full)
    } else return sourceRepo + path.relative(source,full)
  }
  return '/reference-files/' + path.relative(source,full).split(path.sep).join('/') + (/\.(java|sh|py|js|html|css)$/.test(full) ? '.txt' : '')
}
for (const [file,dest] of map) {
  const raw = await fs.readFile(file, 'utf8')
  const links = [...raw.matchAll(/(!?\[[^\]\n]*\]\()([^\s)]+)(\))/g)]
  let text = raw
  for (const m of links.reverse()) {
    const href=m[2]
    if (/^(?:https?:|mailto:|#|data:|\/)/.test(href)) continue
    const [pathname, hash] = href.split('#')
    const full=path.resolve(path.dirname(file),decodeURI(pathname))
    if (!full.startsWith(source + path.sep)) continue
    let target
    if(map.has(full)) target='/reference/'+path.relative(destination,map.get(full)).replace(/\.md$/,'.html').split(path.sep).join('/')
    else {
      try { const stat=await fs.stat(full); target=stat.isFile()?await fileLink(full):sourceRepo.replace('/blob/','/tree/')+path.relative(source,full) }
      catch { target=sourceRepo+path.relative(source,full) }
    }
    if(hash) target+='#'+hash
    text=text.slice(0,m.index)+m[1]+target+m[3]+text.slice(m.index+m[0].length)
  }
  // Imported prose is rendered as text; source examples retain their fenced code.
  let fenced = false
  text = text.split('\n').map(line => {
    if (/^\s*(```|~~~)/.test(line)) { fenced = !fenced; return line }
    if (fenced) return line
    return line.split(/(`+[^`]*`+)/g).map((part,i) => i % 2 ? part : part.replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\{\{/g,'&#123;&#123;')).join('')
  }).join('\n')
  await fs.mkdir(path.dirname(dest),{recursive:true})
  const sourcePath=path.relative(source,file)
  await fs.writeFile(dest,`---\nsourcePath: ${sourcePath}\n---\n\n${text}`)
  manifest.push({path:sourcePath,sha256:createHash('sha256').update(raw).digest('hex')})
}
for (const extra of ['config/platform.yml','config/pipeline-v3.yml']) await fileLink(path.join(source,extra))
const req=JSON.parse(await fs.readFile(path.join(source,'docs/sdd/001-control-recovery-compatibility/requirements.json'),'utf8'))
await fs.mkdir('site/.vitepress/data',{recursive:true})
await fs.writeFile('site/.vitepress/data/requirements.json',JSON.stringify(req,null,2)+'\n')
await fs.writeFile('site/.vitepress/data/source-manifest.json',JSON.stringify({snapshotDate:new Date().toISOString().slice(0,10),source:'rivomesh',documents:manifest,attachments:[...copied].map(f=>path.relative(source,f)).sort()},null,2)+'\n')
console.log(`Synced ${manifest.length} source documents, ${copied.size} referenced files, ${req.requirements.length} SDD requirements.`)
