import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('website/.vitepress/dist')
const origin = new URL('https://rivomesh.github.io')
const readData = async name => JSON.parse(await fs.readFile('website/.vitepress/data/' + name + '.json', 'utf8'))
const [pages, navigation, redirects] = await Promise.all(['pages', 'navigation', 'redirects'].map(readData))

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const paths = await Promise.all(entries.map(entry => {
    const file = path.join(dir, entry.name)
    return entry.isDirectory() ? walk(file) : file
  }))
  return paths.flat()
}

const relative = file => '/' + path.relative(root, file).split(path.sep).join('/')
const files = await walk(root)
const known = new Set(files.map(relative))
const html = new Map(await Promise.all(files.filter(file => file.endsWith('.html')).map(async file => {
  const raw = await fs.readFile(file, 'utf8')
  const ids = new Set([...raw.matchAll(/\s(?:id|name)="([^"]+)"/g)].map(match => match[1]))
  return [relative(file), { raw, ids }]
})))
const records = new Map(pages.map(page => [page.route, page]))
const errors = new Set()
let links = 0

for (const [route, { raw }] of html) {
  const from = new URL(route, origin)
  for (const [, value] of raw.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const target = new URL(value.replaceAll('&amp;', '&'), from)
    if (target.hostname !== origin.hostname || !['https:', 'http:'].includes(target.protocol)) continue

    const requested = decodeURIComponent(target.pathname)
    const resolved = requested.endsWith('/') ? requested + 'index.html' : requested
    if (!known.has(resolved)) {
      errors.add(route + ' has a missing URL: ' + value)
    } else if (target.hash && html.has(resolved)) {
      const page = redirects[requested] || resolved
      const fragment = decodeURIComponent(target.hash.slice(1))
      if (!html.get(page)?.ids.has(fragment)) errors.add(route + ' has a missing anchor: ' + value)
    }
    links++
  }

  const record = records.get(route)
  if (!record) continue
  const sidebar = raw.match(/<nav[^>]*data-sidebar-scroll[^>]*>([\s\S]*?)<\/nav>/)?.[1]
  if (!sidebar) {
    errors.add('Missing stable sidebar: ' + route)
    continue
  }
  const menu = [...sidebar.matchAll(/<a\b([^>]+)>/g)].map(match => ({
    href: match[1].match(/href="([^"]+)"/)?.[1],
    current: match[1].includes('aria-current="page"'),
  })).filter(item => item.href?.startsWith('/docs/'))
  const expected = navigation[record.locale].flatMap(group => group.items.map(item => item.route))
  if (JSON.stringify(menu.map(item => item.href)) !== JSON.stringify(expected)) errors.add('Different sidebar tree: ' + route)
  const current = menu.filter(item => item.current)
  if (current.length !== 1 || current[0].href !== route) errors.add('Incorrect active document: ' + route)
}

if (errors.size) {
  console.error([...errors].join('\n'))
  process.exitCode = 1
} else {
  console.log(`Verified ${links} published navigation/asset URLs and anchors over ${html.size} HTML files, plus stable sidebars on ${pages.length} document pages.`)
}
