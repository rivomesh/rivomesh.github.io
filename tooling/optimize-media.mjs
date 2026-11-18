import sharp from 'sharp'
import path from 'node:path'
const root=path.resolve('website/public/media')
const locales=process.argv.includes('--locale=en')?['en']:['zh','en']
for(const locale of locales)for(const base of ['console-overview','task-wizard','connector-catalog','target-recovery','data-validation','node-registry']){
  const name=base+(locale==='en'?'-en':'')
  for(const width of [900,1800])await sharp(path.join(root,name+'.png')).resize({width}).webp({quality:85}).toFile(path.join(root,`${name}-${width}.webp`))
}
console.log('Generated responsive WebP variants from the original localized product screenshots; original PNGs retained.')
