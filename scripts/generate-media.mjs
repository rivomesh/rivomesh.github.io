import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import {execFileSync} from 'node:child_process'
const out='site/public/media'
await fs.mkdir(out,{recursive:true})
for(const [name,input] of [['console-overview','console'],['task-wizard','wizard'],['connector-catalog','catalog']]){
 const p=`/tmp/rivomesh-${input}-window.png`
 try {await fs.access(p);const m=await sharp(p).metadata();await sharp(p).extract({left:0,top:242,width:m.width,height:m.height-242}).resize({width:1920}).png().toFile(`${out}/${name}.png`)} catch(e){console.log(`Screenshot ${name}: ${e.message}`)}
}
const favicon=await sharp('site/public/brand/favicon.svg').resize(32,32).png().toBuffer()
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico[6]=32;ico[7]=32;ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(favicon.length,14);ico.writeUInt32LE(22,18)
await fs.writeFile('site/public/favicon.ico',Buffer.concat([ico,favicon]))
await sharp('site/public/brand/favicon.svg').resize(180,180).png().toFile('site/public/brand/apple-touch-icon.png')
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
const svg=(s,w=1280,h=720)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="bg"><stop stop-color="#112e40"/><stop offset="1" stop-color="#195b69"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#bg)"/><g font-family="PingFang SC,Microsoft YaHei,Arial,sans-serif">${s}</g></svg>`)
const text=(x,y,t,size=28,color='#fff',weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${esc(t)}</text>`
const title=(k,t,sub)=>text(70,60,'RivoMesh  /  PRODUCT TOUR',15,'#82c7cb',600)+text(70,134,k+'  '+t,40,'#fff',650)+text(70,180,sub,20,'#add0d9')
const footer=text(70,677,'0.1.0-SNAPSHOT · 发布前产品导览 · 截图来自本地开发预览',14,'#8fb8c5')
const stages=[
 {title:'认识 RivoMesh',subtitle:'数据库全量同步与 CDC 增量同步',voice:'欢迎认识 RivoMesh。它是一个基于 Java 的数据同步项目，从 MySQL 出发，将已有数据和后续变化送到数据库、分析系统或消息系统。下面用五个步骤，了解怎样开始使用。',type:'flow'},
 {title:'准备连接与配置',subtitle:'准备测试源、独立空目标，并核对数据库日志与权限。',voice:'首先，准备 MySQL 测试源和一个独立的空目标。启动控制台后，通过任务向导填写源地址、数据库、目标映射和日志。源库需要满足 GTID 和完整行镜像要求，具体权限请由数据库管理员核对。',image:'task-wizard'},
 {title:'创建任务，观察进度',subtitle:'先检查，再启动；关注全量、积压与各目标确认状态。',voice:'保存配置后，先执行检查，再启动任务。控制台展示同步阶段、积压和目标状态。请在测试库验证新增、修改、删除与重启续传。这里展示的是真实开发预览，停止状态和数字不是运行效果的承诺。',image:'console-overview'},
 {title:'校验数据，按计划恢复',subtitle:'先核对差异，管理员审阅修复计划，再显式恢复。',voice:'遇到目标错误，先修复原因，再重试原事务。受支持的 MySQL 和 PostgreSQL 目标，还可以在共同校验点比较数据，由管理员审阅修复计划后执行。修复不会自动恢复同步，也不表示业务切换已经完成。',type:'repair'},
 {title:'从一个小试点开始',subtitle:'阅读兼容性手册，验证自己的环境，再扩大使用范围。',voice:'当前是发布前版本。建议先跑通一条小链路，记录配置和验证结果。网站提供中英文文档、连接器状态和 SDD 路线图。PostgreSQL 和 Oracle 源仍在规划，未来能力以实际实现和验收为准。',type:'next'}
]
const tmp='/tmp/rivomesh-tour-build';await fs.mkdir(tmp,{recursive:true})
let cursor=0;const chapters=[];let vtt='WEBVTT\n\n';const ts=n=>`${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${(n%60).toFixed(3).padStart(6,'0')}`
for(let i=0;i<stages.length;i++){
 const s=stages[i];let body=title(`0${i+1}`,s.title,s.subtitle)+footer
 if(s.type==='flow'){
  const cards=[['MySQL','业务数据源',80],['RivoMesh','全量 + 增量 + 持久日志',480],['目标系统','数据库 / 分析 / 消息',880]]
  for(const [name,sub,x] of cards){body+=`<rect x="${x}" y="295" width="320" height="190" rx="16" fill="#ffffff0c" stroke="#568995"/>`+text(x+30,370,name,38,'#d3f7f0',650)+text(x+30,420,sub,18,'#9fc6d2')}
  body+=text(424,400,'→',35,'#75d5cb')+text(824,400,'→',35,'#75d5cb')+text(80,555,'先理解数据流，再连接真实环境。',23,'#c7e2e8')
 }else if(s.image){
  const img=await sharp(`${out}/${s.image}.png`).resize(1090,420,{fit:'contain',background:'#f3f6f8'}).png().toBuffer();body+=`<rect x="68" y="220" width="1094" height="424" rx="10" fill="#f3f6f8"/><image x="70" y="222" width="1090" height="420" href="data:image/png;base64,${img.toString('base64')}"/>`
 }else if(s.type==='repair'){
  const labels=[['01','完成校验','受支持 SQL 目标 / 共同校验点'],['02','审阅计划','核对范围、差异与权限'],['03','执行与复核','检查结果后显式恢复']]
  for(let j=0;j<3;j++){const x=75+j*400;body+=`<rect x="${x}" y="265" width="365" height="270" rx="14" fill="#ffffff08" stroke="#54828d"/>`+text(x+25,320,labels[j][0],24,'#83d6cd')+text(x+25,382,labels[j][1],30,'#fff',600)+text(x+25,435,labels[j][2],17,'#a7cbd6')}
  body+=text(80,585,'默认恢复重试原事务；人工跳过仍属 SDD 规划。',22,'#c7e2e8')
 }else{
  const lines=['01   快速开始：启动控制台，跑通第一条链路','02   连接器目录：核对产品、版本与能力边界','03   SDD 路线图：查看需求、任务与验收计划']
  lines.forEach((l,j)=>{body+=`<rect x="75" y="${250+j*100}" width="1115" height="75" rx="8" fill="#ffffff09"/>`+text(100,298+j*100,l,25,'#d5e9ed')})
 }
 await sharp(svg(body)).png().toFile(`${tmp}/slide-${i}.png`)
 if(i===0){await fs.copyFile(`${tmp}/slide-${i}.png`,`${out}/tour-poster.png`);await sharp(svg(body)).resize(1200,675).png().toFile('site/public/brand/social-card.png')}
 await fs.writeFile(`${tmp}/voice-${i}.txt`,s.voice)
 execFileSync('say',['-v','Tingting','-r','205','-f',`${tmp}/voice-${i}.txt`,'-o',`${tmp}/voice-${i}.aiff`])
 const voiceDuration=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',`${tmp}/voice-${i}.aiff`],{encoding:'utf8'}))
 const duration=Math.ceil(voiceDuration+1.2);chapters.push({title:s.title,time:cursor,duration})
 // Short readable caption cues, synchronized to each narration block.
 const sentences=s.voice.match(/[^。！？]+[。！？]?/g)||[s.voice]
 const total=sentences.reduce((a,t)=>a+t.length,0);let local=cursor
 for(const sentence of sentences){const len=voiceDuration*sentence.length/total;vtt+=`${ts(local)} --> ${ts(local+len)}\n${sentence}\n\n`;local+=len}
 cursor+=duration
 execFileSync('ffmpeg',['-y','-loglevel','error','-loop','1','-framerate','24','-i',`${tmp}/slide-${i}.png`,'-i',`${tmp}/voice-${i}.aiff`,'-t',String(duration),'-vf',`fade=t=in:st=0:d=0.35,fade=t=out:st=${duration-.4}:d=0.4,format=yuv420p`,'-af','apad','-c:v','libx264','-preset','veryfast','-crf','24','-c:a','aac','-b:a','96k','-movflags','+faststart',`${tmp}/part-${i}.mp4`])
 console.log(`Rendered chapter ${i+1}: ${duration}s`)
}
await fs.writeFile(`${tmp}/concat.txt`,stages.map((_,i)=>`file '${tmp}/part-${i}.mp4'`).join('\n'))
execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',`${tmp}/concat.txt`,'-c','copy','-movflags','+faststart',`${out}/rivomesh-tour.mp4`])
await fs.writeFile(`${out}/tour.zh-CN.vtt`,vtt)
await fs.writeFile('site/.vitepress/data/tour-chapters.json',JSON.stringify(chapters,null,2)+'\n')
await fs.writeFile('site/public/media/tour-transcript.txt',stages.map((s,i)=>`${i+1}. ${s.title}\n${s.voice}`).join('\n\n')+'\n')
console.log(`Created narrated tour: ${cursor}s, H.264/AAC, Chinese captions.`)
