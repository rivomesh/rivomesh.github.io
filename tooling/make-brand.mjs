import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import {concepts,mark,wordmark,lettering,palette,previousBody} from './brand/identity.mjs'
const root=path.resolve('website/public/brand')
await fs.mkdir(path.join(root,'concepts'),{recursive:true})
async function write(name,content){await fs.writeFile(path.join(root,name),content+'\n')}
for(const [key,concept]of Object.entries(concepts))await write(`concepts/${key}.svg`,mark({concept:key}))
await write('concepts/previous.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g color="#2e60d6">${previousBody}</g></svg>`)
for(const [name,options]of Object.entries({'logo.svg':{},'logo-on-light.svg':{},'logo-light.svg':{color:palette.light},'logo-monochrome.svg':{color:'#111'},'logo-monochrome-light.svg':{color:'#fff'},'logo-square.svg':{tile:true},'favicon.svg':{tile:true,small:true}}))await write(name,mark(options))
await write('wordmark.svg',wordmark());await write('wordmark-light.svg',wordmark({dark:true}));await write('wordmark-monochrome.svg',wordmark({mono:true}))
const pngs=await Promise.all([16,32,48].map(size=>sharp(Buffer.from(mark({tile:true,small:true}))).resize(size,size).png().toBuffer()))
const header=Buffer.alloc(6+16*pngs.length);header.writeUInt16LE(1,2);header.writeUInt16LE(pngs.length,4);let offset=header.length
pngs.forEach((buffer,i)=>{const k=6+16*i,size=[16,32,48][i];header[k]=size;header[k+1]=size;header.writeUInt16LE(1,k+4);header.writeUInt16LE(32,k+6);header.writeUInt32LE(buffer.length,k+8);header.writeUInt32LE(offset,k+12);offset+=buffer.length})
await fs.writeFile('website/public/favicon.ico',Buffer.concat([header,...pngs]))
await sharp(Buffer.from(mark({tile:true}))).resize(180,180).png().toFile(path.join(root,'apple-touch-icon.png'))
await sharp(Buffer.from(mark({tile:true}))).resize(512,512).png().toFile(path.join(root,'avatar-512.png'))
const share=(locale='en')=>`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="${palette.night}"/><path d="M800 0v630M0 470h1200" stroke="#283951"/><g transform="translate(64 60) scale(1.6)"><g color="${palette.light}" fill="currentColor">${concepts.b.body}</g><g transform="translate(79 12) scale(1.18)">${lettering('#f2f6fc')}</g></g><text x="68" y="300" font-family="system-ui,Arial,sans-serif" font-size="${locale==='zh'?54:62}" font-weight="600" fill="#f2f6fc">${locale==='zh'?'数据库实时同步':'Reliable database replication.'}</text><text x="68" y="375" font-family="system-ui,Arial,sans-serif" font-size="${locale==='zh'?34:42}" fill="${palette.light}">${locale==='zh'?'可靠连接每一份数据':'Built for recovery.'}</text><text x="68" y="532" font-family="system-ui,Arial,sans-serif" font-size="21" fill="#a2b3ca">SNAPSHOT + CDC   /   INDEPENDENT RECOVERY</text><text x="68" y="576" font-family="system-ui,Arial,sans-serif" font-size="18" fill="#a2b3ca">rivomesh.github.io</text></svg>`
for(const locale of ['zh','en']){const svg=share(locale);await write(`social-card-${locale}.svg`,svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,`social-card${locale==='en'?'-en':''}.png`))}
// Standalone contact sheet for inspecting the actual geometry and favicon rasterization.
let cells='<rect width="1040" height="760" fill="#f7f9fc"/>'
for(const [i,key]of ['a','b','c'].entries()){const x=40+i*335;cells+=`<rect x="${x}" y="36" width="305" height="310" rx="12" fill="#fff" stroke="#dce4ef"/><text x="${x+20}" y="70" font-family="sans-serif" font-size="18" fill="#172a45">${key.toUpperCase()} / ${concepts[key].name}</text><g transform="translate(${x+90} 95) scale(2)" fill="currentColor" color="${palette.blue}">${concepts[key].body}</g>`;for(const [n,size]of [16,24,32].entries())cells+=`<g transform="translate(${x+25+n*85} 270) scale(${size/64})" fill="currentColor" color="${palette.blue}">${concepts[key].body}</g>`}
cells+=`<rect x="40" y="385" width="960" height="168" rx="12" fill="${palette.night}"/><g transform="translate(78 420) scale(1.4)"><g color="${palette.light}" fill="currentColor">${concepts.b.body}</g><g transform="translate(79 12) scale(1.18)">${lettering('#f2f6fc')}</g></g>`
for(const [i,size]of [16,24,32,48].entries()){const bitmap=await sharp(Buffer.from(mark({tile:true,small:true}))).resize(size,size).png().toBuffer();cells+=`<image x="${60+i*120}" y="612" width="${size*2}" height="${size*2}" image-rendering="pixelated" href="data:image/png;base64,${bitmap.toString('base64')}"/><text x="${60+i*120}" y="735" font-family="sans-serif" font-size="13" fill="#172a45">${size}px ×2</text>`}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="760">${cells}</svg>`)).png().toFile(path.join(root,'identity-review.png'))
console.log('Generated three original SVG concepts, production marks/outlined wordmarks, favicon, icons and localized 1200×630 sharing cards. Video untouched.')
