import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import {concepts,mark,wordmark,lettering,palette,selected} from './brand/identity.mjs'

const root=path.resolve('website/public/brand')
await fs.mkdir(path.join(root,'concepts'),{recursive:true})
const write=(name,content)=>fs.writeFile(path.join(root,name),content+'\n')
const variants={
 'logo.svg':{},'logo-on-light.svg':{},'logo-light.svg':{color:palette.light},
 'logo-monochrome.svg':{color:palette.ink},'logo-monochrome-light.svg':{color:'#fff'},
 'logo-square.svg':{tile:true},'favicon.svg':{tile:true,small:true}
}
for(const [name,options] of Object.entries(variants))await write(name,mark(options))
const lockupVariants={'':{},'-light':{dark:true},'-monochrome':{mono:true},'-monochrome-light':{mono:true,dark:true}}
for(const [suffix,options] of Object.entries(lockupVariants))await write(`wordmark${suffix}.svg`,wordmark(options))
for(const concept of Object.keys(concepts)){
 await write(`concepts/${concept}.svg`,mark({concept}))
 await write(`concepts/${concept}-light.svg`,mark({concept,color:palette.light}))
 await write(`concepts/${concept}-mono.svg`,mark({concept,color:palette.ink}))
 for(const [suffix,options] of Object.entries(lockupVariants))await write(`concepts/${concept}-wordmark${suffix}.svg`,wordmark({concept,...options}))
}

const faviconSizes=[16,32,48]
const raster=(svg,size)=>sharp(Buffer.from(svg)).resize(size,size).png()
const pngs=await Promise.all(faviconSizes.map(size=>raster(mark({tile:true,small:true}),size).toBuffer()))
const header=Buffer.alloc(6+16*pngs.length)
header.writeUInt16LE(1,2)
header.writeUInt16LE(pngs.length,4)
let offset=header.length
pngs.forEach((buffer,index)=>{
 const entry=6+16*index,size=faviconSizes[index]
 header[entry]=size;header[entry+1]=size
 header.writeUInt16LE(1,entry+4);header.writeUInt16LE(32,entry+6)
 header.writeUInt32LE(buffer.length,entry+8);header.writeUInt32LE(offset,entry+12)
 offset+=buffer.length
})
await fs.writeFile('website/public/favicon.ico',Buffer.concat([header,...pngs]))
await raster(mark({tile:true}),180).toFile(path.join(root,'apple-touch-icon.png'))
await raster(mark({tile:true}),512).toFile(path.join(root,'avatar-512.png'))

const brandLockup=(x,y,scale)=>`<g transform="translate(${x} ${y}) scale(${scale})"><g fill="${palette.light}">${concepts[selected].body}</g><g transform="translate(79 12) scale(1.18)">${lettering('#f2f6fc')}</g></g>`
function share(locale){
 const [headline,subtitle]=locale==='zh'?['数据库实时同步，','可靠连接每一份数据']:['Reliable database replication.','Built for recovery.']
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" lang="${locale==='zh'?'zh-CN':'en'}">
 <rect width="1200" height="630" fill="${palette.ink}"/>
 <path d="M822 448c126 0 133-105 235-105h143M822 448h378M822 448c126 0 133 105 235 105h143" stroke="#49648b" stroke-width="2" fill="none"/>
 <circle cx="822" cy="448" r="6" fill="${palette.light}"/>
 ${brandLockup(60,60,1.7)}
 <g font-family="Noto Sans CJK SC, Noto Sans SC, PingFang SC, Arial, sans-serif">
 <text x="64" y="295" font-size="59" font-weight="700" fill="#f2f6fc">${headline}</text>
 <text x="64" y="369" font-size="47" font-weight="600" fill="${palette.light}">${subtitle}</text>
 <text x="64" y="550" font-size="24" fill="#bccbdf">rivomesh.github.io</text>
 </g></svg>`
}
for(const locale of ['zh','en']){
 const svg=share(locale)
 await write(`social-card-${locale}.svg`,svg)
 await sharp(Buffer.from(svg)).png().toFile(path.join(root,`social-card${locale==='en'?'-en':''}.png`))
}

let cells='<rect width="1040" height="620" fill="#f7f9fc"/>'
for(const [index,[key,{name,body}]] of Object.entries(concepts).entries()){
 const x=34+index*331
 cells+=`<rect x="${x}" y="32" width="310" height="278" rx="10" fill="#fff" stroke="#dce4ef"/><text x="${x+20}" y="68" font-family="sans-serif" font-size="19" fill="${palette.ink}">${name}</text><g transform="translate(${x+90} 85) scale(2)" fill="${palette.blue}">${body}</g>`
 for(const [i,size] of [16,24,32,48].entries()){
  cells+=`<g transform="translate(${x+23+i*65} 219) scale(${size/64})" fill="${palette.ink}">${body}</g><text x="${x+23+i*65}" y="285" font-family="sans-serif" font-size="12" fill="${palette.ink}">${size}px</text>`
 }
 cells+=`<rect x="${x}" y="324" width="310" height="81" rx="10" fill="${palette.night}"/>${wordmark({concept:key,dark:true}).replace('<svg ',`<svg x="${x+24}" y="338" width="262" height="55" `)}`
}
cells+=`<text x="34" y="455" font-family="sans-serif" font-size="18" fill="${palette.ink}">River Otter favicon · rasterized at the indicated size, shown at 2×</text>`
for(const [i,size] of [16,24,32,48].entries()){
 const bitmap=await raster(mark({tile:true,small:true}),size).toBuffer()
 cells+=`<image x="${34+i*130}" y="478" width="${size*2}" height="${size*2}" image-rendering="pixelated" href="data:image/png;base64,${bitmap.toString('base64')}"/><text x="${34+i*130}" y="600" font-family="sans-serif" font-size="13" fill="${palette.ink}">${size}px</text>`
}
await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="620">${cells}</svg>`)).png().toFile(path.join(root,'identity-review.png'))
console.log('Generated three SVG identities, outlined wordmarks, icons and localized social cards.')
