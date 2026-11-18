import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import sharp from 'sharp'
import {concepts,mark,selected,wordmark} from './brand/identity.mjs'

const root='website/public/brand/'
const conceptFiles=Object.keys(concepts).flatMap(id=>['','-light','-mono','-wordmark','-wordmark-light','-wordmark-monochrome','-wordmark-monochrome-light'].map(suffix=>`concepts/${id}${suffix}.svg`))
const vectors=['logo.svg','logo-on-light.svg','logo-light.svg','logo-monochrome.svg','logo-monochrome-light.svg','logo-square.svg','wordmark.svg','wordmark-light.svg','wordmark-monochrome.svg','wordmark-monochrome-light.svg','favicon.svg',...conceptFiles]
for(const name of vectors){
 const svg=await fs.readFile(root+name,'utf8')
 assert.match(svg,/<svg[^>]+viewBox=/,`${name}: scalable viewBox`)
 assert.match(svg,/<path\b/,`${name}: vector geometry`)
 assert.doesNotMatch(svg,/<(?:text|image|script|foreignObject)\b|https?:\/\/(?!www\.w3\.org\/2000\/svg)/,`${name}: standalone outlined identity`)
 assert.ok(Buffer.byteLength(svg)<8000,`${name}: compact asset`)
}
assert.equal((await fs.readFile(root+'logo.svg','utf8')).trim(),mark({concept:selected}))
assert.equal((await fs.readFile(root+'wordmark.svg','utf8')).trim(),wordmark({concept:selected}))
const favicon=mark({tile:true,small:true})
assert.equal((await fs.readFile(root+'favicon.svg','utf8')).trim(),favicon)
for(const [name,width,height]of [['apple-touch-icon.png',180,180],['avatar-512.png',512,512],['social-card.png',1200,630],['social-card-en.png',1200,630],['identity-review.png',1040,620]]){
 const metadata=await sharp(root+name).metadata()
 assert.equal(metadata.width,width,name);assert.equal(metadata.height,height,name)
}
const ico=await fs.readFile('website/public/favicon.ico')
assert.equal(ico.readUInt16LE(2),1,'ICO format');assert.equal(ico.readUInt16LE(4),3,'three favicon sizes')
for(const [i,size]of [16,32,48].entries()){
 const entry=6+16*i;assert.equal(ico[entry],size);assert.equal(ico[entry+1],size)
 const length=ico.readUInt32LE(entry+8),offset=ico.readUInt32LE(entry+12)
 const bitmap=await sharp(ico.subarray(offset,offset+length)).metadata()
 assert.equal(bitmap.width,size);assert.equal(bitmap.height,size)
 const actual=await sharp(ico.subarray(offset,offset+length)).raw().toBuffer()
 const expected=await sharp(Buffer.from(favicon)).resize(size,size).raw().toBuffer()
 assert.deepEqual(actual,expected,`favicon ${size}px renders the selected geometry`)
}
console.log(`Brand check: ${vectors.length} standalone SVGs, five raster dimensions and matching 16/32/48px ICO frames.`)
