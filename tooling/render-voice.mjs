import fs from 'node:fs/promises'
import {existsSync} from 'node:fs'
import path from 'node:path'
import {execFileSync} from 'node:child_process'
import {createHash} from 'node:crypto'
import {alignSentences,normalize,parseVtt,formatVtt} from './voice/alignment.mjs'
import {wordTimestamps} from './voice/transcribe.mjs'

if(existsSync('.env.local'))process.loadEnvFile('.env.local')
const voice=process.env.RIVOMESH_VOICE||'marin'
if(!/^[a-z0-9-]+$/.test(voice))throw new Error('Invalid voice name')
const work=path.resolve(`.rivomesh-voice.local/${voice}`),baseline=path.join(work,'original'),output=path.join(work,'preview')
const media='website/public/media',timelineFile='website/.vitepress/data/tour.json'
const run=(cmd,args)=>execFileSync(cmd,args,{stdio:['ignore','pipe','pipe'],maxBuffer:10*1024*1024})
const probe=file=>JSON.parse(run('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,duration','-of','json',file]))
await fs.mkdir(baseline,{recursive:true});await fs.mkdir(output,{recursive:true})
for(const [source,name]of [[`${media}/rivomesh-tour.mp4`,'tour.mp4'],[`${media}/tour.zh-CN.vtt`,'zh.vtt'],[`${media}/tour.en.vtt`,'en.vtt'],[timelineFile,'tour.json']])if(!existsSync(path.join(baseline,name)))await fs.copyFile(source,path.join(baseline,name))
const timeline=JSON.parse(await fs.readFile(path.join(baseline,'tour.json'),'utf8'))
const zh=parseVtt(await fs.readFile(path.join(baseline,'zh.vtt'),'utf8')),en=parseVtt(await fs.readFile(path.join(baseline,'en.vtt'),'utf8'))
if(zh.length!==en.length)throw new Error('Chinese and English subtitle cue counts differ')
const zhOut=[],enOut=[],newTimeline=[],report=[];let cursor=0
for(const [i,chapter]of timeline.entries()){
 const stem=path.join(work,`chapter-${i+1}`),audio=await fs.readFile(stem+'.wav'),metadata=JSON.parse(await fs.readFile(stem+'.json','utf8'))
 const indices=zh.map((cue,j)=>cue.start>=chapter.time&&cue.start<chapter.time+chapter.duration?j:-1).filter(j=>j>=0),sentences=indices.map(j=>zh[j].text)
 if(normalize(metadata.sourceText)!==normalize(sentences.join('')))throw new Error('Audio copy differs from authoritative captions')
 if(normalize(metadata.transcript)!==normalize(metadata.sourceText))throw new Error(`Chapter ${i+1}: generation transcript differs from script; review before rendering`)
 const audioHash=createHash('sha256').update(audio).digest('hex');let timing
 try{timing=JSON.parse(await fs.readFile(stem+'.timing.json','utf8'))}catch{}
 if(timing?.audioHash!==audioHash){
  if(!process.env.OPENAI_API_KEY)throw new Error('Missing OPENAI_API_KEY for subtitle timestamp generation')
  const result=await wordTimestamps(audio,{key:process.env.OPENAI_API_KEY,proxy:process.env.HTTPS_PROXY||process.env.https_proxy})
  timing={audioHash,...result};await fs.writeFile(stem+'.timing.json',JSON.stringify(timing,null,2)+'\n')
 }
 const aligned=alignSentences(sentences,timing.words),audioDuration=Number(probe(stem+'.wav').format.duration),duration=Math.ceil(audioDuration+.7)
 for(const [j,cue]of aligned.cues.entries()){
  if(cue.end>audioDuration+.05)throw new Error('Subtitle extends beyond spoken audio')
  zhOut.push({...cue,start:cursor+cue.start,end:cursor+cue.end});enOut.push({...cue,start:cursor+cue.start,end:cursor+cue.end,text:en[indices[j]].text})
 }
 const slide=path.join(output,`slide-${i+1}.png`),part=path.join(output,`part-${i+1}.mp4`)
 run('ffmpeg',['-y','-v','error','-ss',String(chapter.time+.5),'-i',path.join(baseline,'tour.mp4'),'-frames:v','1',slide])
 run('ffmpeg',['-y','-v','error','-loop','1','-framerate','24','-i',slide,'-i',stem+'.wav','-t',String(duration),'-vf',`fade=t=in:st=0:d=0.3,fade=t=out:st=${duration-.3}:d=0.3,format=yuv420p`,'-af','loudnorm=I=-16:TP=-1.5:LRA=7,apad','-c:v','libx264','-preset','veryfast','-crf','24','-c:a','aac','-ar','48000','-b:a','128k',part])
 newTimeline.push({title:chapter.title,time:cursor,duration});report.push({chapter:i+1,title:chapter.title,model:metadata.model,voice:metadata.voice,audioDuration,duration,timestampSimilarity:aligned.similarity,sourceAudioSha256:audioHash,usage:metadata.usage})
 cursor+=duration;console.log(`Rendered chapter ${i+1}: ${duration}s; transcript alignment ${(aligned.similarity*100).toFixed(1)}%`)
}
await fs.writeFile(path.join(output,'concat.txt'),timeline.map((_,i)=>`file 'part-${i+1}.mp4'`).join('\n')+'\n')
run('ffmpeg',['-y','-v','error','-f','concat','-safe','0','-i',path.join(output,'concat.txt'),'-c','copy','-movflags','+faststart',path.join(output,'rivomesh-tour.mp4')])
await fs.writeFile(path.join(output,'tour.zh-CN.vtt'),formatVtt(zhOut));await fs.writeFile(path.join(output,'tour.en.vtt'),formatVtt(enOut))
await fs.writeFile(path.join(output,'tour.json'),JSON.stringify(newTimeline,null,2)+'\n')
const revision=createHash('sha256').update(await fs.readFile(path.join(output,'rivomesh-tour.mp4'))).digest('hex').slice(0,16)
await fs.writeFile(path.join(output,'tour-media.json'),JSON.stringify({revision},null,2)+'\n')
await fs.writeFile(path.join(output,'voice-report.json'),JSON.stringify({provider:'OpenAI',synthetic:true,revision,timestampModel:'whisper-1',duration:cursor,chapters:report},null,2)+'\n')
const published=probe(path.join(output,'rivomesh-tour.mp4'))
if(Math.abs(Number(published.format.duration)-cursor)>.15||published.streams.filter(s=>s.codec_type==='audio').length!==1)throw new Error('Rendered video duration or audio stream validation failed')
if(process.argv.includes('--apply')){
 for(const file of ['rivomesh-tour.mp4','tour.zh-CN.vtt','tour.en.vtt','voice-report.json'])await fs.copyFile(path.join(output,file),path.join(media,file))
 await fs.copyFile(path.join(output,'tour.json'),timelineFile)
 await fs.copyFile(path.join(output,'tour-media.json'),'website/.vitepress/data/tour-media.json')
 console.log('Applied reviewed narration and synchronized subtitles/timeline to website assets.')
}else console.log(`Preview only: ${output}/rivomesh-tour.mp4. Website assets unchanged; use --apply after review.`)
