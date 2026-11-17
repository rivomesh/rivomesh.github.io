import fs from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {delivery,narrate} from './voice/realtime.mjs'

if(existsSync('.env.local'))process.loadEnvFile('.env.local')
const args=process.argv.slice(2),chapterArg=args.find(a=>a.startsWith('--chapter='))
const model=process.env.RIVOMESH_VOICE_MODEL||'gpt-realtime-2.1',voice=process.env.RIVOMESH_VOICE||'marin'
if(!/^[a-z0-9-]+$/.test(voice))throw new Error('Invalid voice name')
const work=path.resolve(`.rivomesh-voice.local/${voice}`)
const timeline=JSON.parse(await fs.readFile('website/.vitepress/data/tour.json','utf8'))
const sections=(await fs.readFile('website/public/media/transcript.txt','utf8')).trim().split(/\r?\n\s*\r?\n/)
const chapters=sections.map((section,i)=>{const [title,...lines]=section.split(/\r?\n/);if(title!==timeline[i]?.title)throw new Error('Transcript and chapter titles differ');return {title,text:lines.join('\n'),...timeline[i]}})
if(args.includes('--plan')){console.log(JSON.stringify({model,voice,output:work,chapters},null,2));process.exit(0)}
if(!process.env.OPENAI_API_KEY)throw new Error('Missing OPENAI_API_KEY. Add it to ignored .env.local, never to tracked files.')
const number=Number(chapterArg?.split('=')[1]||1)
if(!Number.isInteger(number)||number<1||number>chapters.length)throw new Error('Chapter must be between 1 and '+chapters.length)
await fs.mkdir(work,{recursive:true})
for(const [i,chapter]of chapters.entries()){
 if(!args.includes('--all')&&i!==number-1)continue
 const fingerprint=createHash('sha256').update(JSON.stringify({text:chapter.text,model,voice,instructions:delivery})).digest('hex')
 const file=path.join(work,`chapter-${i+1}`)
 let cached;try{cached=JSON.parse(await fs.readFile(file+'.json','utf8'))}catch{}
 if(!args.includes('--force')&&cached?.fingerprint===fingerprint&&existsSync(file+'.wav')){console.log(`Reused chapter ${i+1}; no API request.`);continue}
 console.log(`Generating chapter ${i+1}: ${chapter.title} (${model}, ${voice})`)
 const result=await narrate({text:chapter.text,key:process.env.OPENAI_API_KEY,model,voice,proxy:process.env.HTTPS_PROXY||process.env.https_proxy})
 await fs.writeFile(file+'.wav',result.audio)
 const {audio,...metadata}=result
 await fs.writeFile(file+'.json',JSON.stringify({fingerprint,model,voice,title:chapter.title,sourceText:chapter.text,...metadata},null,2)+'\n')
 console.log(`Saved ${file}.wav (${result.duration.toFixed(2)}s); AI-generated narration, not a human recording.`)
}
