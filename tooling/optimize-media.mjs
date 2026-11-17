import sharp from 'sharp'
import path from 'node:path'
const root=path.resolve('website/public/media')
for(const name of ['console-overview','task-wizard','connector-catalog']){
  for(const width of [900,1800])await sharp(path.join(root,name+'.png')).resize({width}).webp({quality:85}).toFile(path.join(root,`${name}-${width}.webp`))
}
console.log('Generated responsive WebP variants from the three original product screenshots; original PNGs retained.')
