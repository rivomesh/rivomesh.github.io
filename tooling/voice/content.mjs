import fs from 'node:fs/promises'
export function localeFrom(args){const locale=args.find(arg=>arg.startsWith('--locale='))?.split('=')[1]||'zh';if(!['zh','en'].includes(locale))throw new Error('Locale must be zh or en');return locale}
export const workDirectory=(voice,locale)=>`.rivomesh-voice.local/${voice}${locale==='en'?'-en':''}`
export const mediaNames=locale=>locale==='en'?{video:'rivomesh-tour-en.mp4',poster:'tour-poster-en.png',zh:'tour-en.zh-CN.vtt',en:'tour-en.en.vtt',timeline:'tour-en.json',manifest:'tour-en-media.json',report:'voice-report-en.json'}:{video:'rivomesh-tour.mp4',poster:'tour-poster.png',zh:'tour.zh-CN.vtt',en:'tour.en.vtt',timeline:'tour.json',manifest:'tour-media.json',report:'voice-report.json'}
export const englishScript=async()=>JSON.parse(await fs.readFile('website/.vitepress/data/tour-en-script.json','utf8'))
export async function narrationChapters(locale){
 if(locale==='en'){
  return (await englishScript()).map(chapter=>({title:chapter.title,text:chapter.cues.map(cue=>cue.en).join(' ')}))
 }
 const timeline=JSON.parse(await fs.readFile('website/.vitepress/data/tour.json','utf8'))
 const sections=(await fs.readFile('website/public/media/transcript.txt','utf8')).trim().split(/\r?\n\s*\r?\n/)
 return sections.map((section,i)=>{const [title,...lines]=section.split(/\r?\n/);if(title!==timeline[i]?.title)throw new Error('Transcript and chapter titles differ');return {...timeline[i],title,text:lines.join('\n')}})
}
