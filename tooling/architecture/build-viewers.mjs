import { readFile, writeFile } from 'node:fs/promises'

const directory = new URL('../../website/public/architecture/', import.meta.url)
const pages = {
  zh: {
    lang: 'zh-CN', title: 'RivoMesh 同步平台架构', back: '返回架构说明', other: 'English',
    open: '查看原尺寸图片',
    alt: '管理链路从控制台和 API 到 Controller、共享控制存储与 Agent。同步链路从 MySQL、PostgreSQL 或 Oracle 经 Worker 采集、持久日志和独立投递到各目标。校验与恢复使用共同校验点及目标回执。',
  },
  en: {
    lang: 'en', title: 'RivoMesh replication architecture', back: 'Architecture guide', other: '简体中文',
    open: 'Open full-size image',
    alt: 'The control path runs from the console and API through the Controller and shared control store to the Agent. Workers capture MySQL, PostgreSQL or Oracle changes, write the durable journal and deliver independently to each target. Validation and recovery use common cuts and destination receipts.',
  },
}

const css = `
:root{color-scheme:light dark;font:1rem/1.55 system-ui,sans-serif;color:light-dark(#172d49,#edf4ff);background:light-dark(#f4f7fb,#101a29)}
body{margin:0}
main{max-width:100rem;margin:auto;padding:clamp(.75rem,3vw,2.2rem)}
nav{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem 1.25rem;margin-bottom:1rem}
nav>div{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem}
a{color:light-dark(#245493,#afcbff);text-underline-offset:.2em}
a:focus-visible{outline:2px solid currentColor;outline-offset:4px}
img{display:block;width:100%;height:auto;border-radius:.6rem}
`

for (const [locale, page] of Object.entries(pages)) {
  const opposite = locale === 'zh' ? 'en' : 'zh'
  const guide = '/docs/' + locale + '/start/architecture.html'
  const image = '/architecture/' + locale + '.webp'
  const html = `<!doctype html>
<html lang="${page.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${page.title}</title>
<link rel="icon" type="image/svg+xml" href="/brand/favicon.svg">
<link rel="canonical" href="https://rivomesh.github.io${guide}">
<style>${css}</style>
</head>
<body>
<main>
  <nav>
    <a href="${guide}">${page.back}</a>
    <div><a href="${image}">${page.open}</a><a href="/architecture/${opposite}.html" hreflang="${pages[opposite].lang}">${page.other}</a></div>
  </nav>
  <img src="${image}" width="1586" height="992" alt="${page.alt}">
</main>
</body>
</html>
`
  const output = new URL(locale + '.html', directory)
  if (process.argv.includes('--check')) {
    if ((await readFile(output, 'utf8')) !== html) throw new Error('Regenerate ' + output.pathname)
  } else {
    await writeFile(output, html)
  }
}
