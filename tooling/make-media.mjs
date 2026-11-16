import fs from 'node:fs/promises'
import sharp from 'sharp'
import {execFileSync} from 'node:child_process'
const brand='website/public/brand',media='website/public/media'
await fs.mkdir(brand,{recursive:true});await fs.mkdir(media,{recursive:true});await fs.mkdir('website/.vitepress/data',{recursive:true})
const symbol='<path d="M14 36V13h11c13 0 13 16 0 16H14m11 0 11 10"/><path d="M9 20h9m-9 8h9"/>'
for(const [file,color,bg]of [['logo.svg','#2e60d6','none'],['logo-light.svg','#a8e8ff','none'],['favicon.svg','#fff','#1e46a4']])await fs.writeFile(`${brand}/${file}`,`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="11" fill="${bg}"/><g fill="none" stroke="${color}" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">${symbol}</g></svg>`)
await fs.writeFile(`${brand}/wordmark.svg`,`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="50" viewBox="0 0 240 50"><g transform="translate(0 1)" fill="none" stroke="#2e60d6" stroke-width="3.1" stroke-linecap="round" stroke-linejoin="round">${symbol}</g><text x="58" y="35" font-family="Arial,sans-serif" font-size="30" font-weight="700" fill="#173875">RivoMesh</text></svg>`)
const pngs=await Promise.all([16,32,48].map(n=>sharp(`${brand}/favicon.svg`).resize(n,n).png().toBuffer()))
const head=Buffer.alloc(6+16*pngs.length);head.writeUInt16LE(1,2);head.writeUInt16LE(pngs.length,4);let offset=head.length
pngs.forEach((buf,i)=>{const k=6+16*i,n=[16,32,48][i];head[k]=n;head[k+1]=n;head.writeUInt16LE(1,k+4);head.writeUInt16LE(32,k+6);head.writeUInt32LE(buf.length,k+8);head.writeUInt32LE(offset,k+12);offset+=buf.length})
await fs.writeFile('website/public/favicon.ico',Buffer.concat([head,...pngs]));await sharp(`${brand}/favicon.svg`).resize(180,180).png().toFile(`${brand}/apple-touch-icon.png`)
for(const [name,input]of [['console-overview','console'],['task-wizard','wizard'],['connector-catalog','catalog']]){
 const filename=`/tmp/rivomesh-${input}-window.png`
 const info=await sharp(filename).metadata()
 await sharp(filename).extract({left:0,top:242,width:info.width,height:info.height-242}).resize({width:1800}).png().toFile(`${media}/${name}.png`)
}
const esc=t=>t.replaceAll('&','&amp;').replaceAll('<','&lt;')
const text=(x,y,value,size=26,color='#ffffff',weight=400)=>`<text x="${x}" y="${y}" font-family="PingFang SC,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`
const svg=body=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#102754"/><stop offset="1" stop-color="#234c85"/></linearGradient></defs><rect width="1280" height="720" fill="url(#bg)"/><path d="M900-80 1400 420M820-80 1320 420M740-80 1240 420" stroke="#8dbaff" stroke-width="1" opacity=".1"/>${body}</svg>`)
let share=text(75,100,'RivoMesh',38,'#bbd6ff',650)+text(75,260,'数据库实时同步平台',66,'#fff',650)+text(75,340,'先同步已有数据，再持续同步新增、修改和删除。',27,'#c6d5ef')
for(const [i,label]of ['MySQL','全量 + CDC + 持久日志','数据库 / 分析 / 消息'].entries()){const x=75+i*395;share+=`<rect x="${x}" y="425" width="350" height="115" rx="12" fill="#ffffff0b" stroke="#5777a3"/>`+text(x+24,490,label,i===1?24:27,'#eaf3ff',550)}
share+=text(75,650,'rivomesh.github.io  /  0.1.0-SNAPSHOT',19,'#93b5df')
await sharp(svg(share)).resize(1200,675).png().toFile(`${brand}/social-card.png`)
const chapters=[
 {title:'数据库同步是什么',subtitle:'先同步已有数据，再持续同步新增、修改和删除。',voice:'RivoMesh 是一个基于 Java 的数据库实时同步平台。它读取 MySQL 已有的数据和后续变更，把数据送到数据库、分析系统或者消息队列。全量、增量、持久日志和目标确认，共同组成一条同步链路。',diagram:true},
 {title:'准备并创建任务',subtitle:'测试 MySQL → 独立空目标；先核对日志和权限。',voice:'第一次使用，请准备一个 MySQL 测试源和独立的空目标。从核心源码构建并启动控制台，通过向导填写连接、库映射和日志。数据库管理员需要核对 GTID、完整行镜像，以及复制和快照权限。',image:'task-wizard'},
 {title:'检查、启动与观察',subtitle:'关注同步阶段、积压与各目标确认位置。',voice:'保存配置之后，先检查，再启动。控制台提供任务、阶段、积压和目标错误入口。在测试库核对新增、修改、删除和重启恢复。这里使用真实开发预览截图说明界面，画面中的数字不是运行效果承诺。',image:'console-overview'},
 {title:'校验与按计划修复',subtitle:'核对差异 → 管理员审阅 → 执行与复核。',voice:'遇到目标错误，先修复原因，再重试原事务。指定 MySQL 和 PostgreSQL 目标可以在共同校验点进行数据比较，由管理员审阅计划后修复。修复后仍需核对结果并显式恢复，业务切换另有计划。',repair:true},
 {title:'跟着使用指南完成同步',subtitle:'安装启动 · 创建任务 · 日常运维与故障处理。',voice:'使用指南按实际操作组织。从安装和登录开始，跟着向导创建任务，再学习查看进度、处理故障和核对数据。中文搜索可以帮你找到具体步骤。连接不同数据库前，请先查看连接说明。建议先完成小规模测试，再逐步扩大使用范围。',docs:true}
]
const work='/tmp/rivomesh-website-v2-media';await fs.mkdir(work,{recursive:true});const times=[];let cursor=0,vtt='WEBVTT\n\n'
const time=n=>`${String(Math.floor(n/3600)).padStart(2,'0')}:${String(Math.floor(n/60)%60).padStart(2,'0')}:${(n%60).toFixed(3).padStart(6,'0')}`
for(let i=0;i<chapters.length;i++){
 const c=chapters[i];let body=text(65,55,'RIVOMESH  /  PRODUCT GUIDE',15,'#8eb9f2',600)+text(65,128,`0${i+1}  ${c.title}`,40,'#fff',650)+text(65,176,c.subtitle,21,'#bcd0eb')+text(65,685,'0.1.0-SNAPSHOT · 流程讲解 / 开发预览截图 · 具体功能以源码手册为准',14,'#87a8d1')
 if(c.diagram){for(const [j,label]of ['MySQL 数据源','RivoMesh','同步目标'].entries()){const x=65+j*400;body+=`<rect x="${x}" y="285" width="350" height="185" rx="14" fill="#ffffff0a" stroke="#6686b4"/>`+text(x+26,360,label,32,'#e5f0ff',600)+text(x+26,415,['已有数据 + binlog','全量 / CDC / 持久日志','数据库 / 分析 / 消息'][j],20,'#aac6eb');if(j<2)body+=text(x+365,390,'→',28,'#7ac9d4')}body+=text(65,555,'按目标协议确认进度，并从持久断点恢复。',25,'#d5e5f7')}
 if(c.image){const picture=await sharp(`${media}/${c.image}.png`).resize(1130,420,{fit:'contain',background:'#f4f7fb'}).png().toBuffer();body+=`<rect x="63" y="218" width="1134" height="424" rx="9" fill="#f4f7fb"/><image x="65" y="220" width="1130" height="420" href="data:image/png;base64,${picture.toString('base64')}"/>`}
 if(c.repair||c.docs){const labels=c.repair?[['完成校验','在共同校验点比较数据'],['审阅计划','核对目标、表与差异'],['执行与复核','检查结果后显式恢复']]:[['安装与任务','启动控制台并创建任务'],['日常使用','查看进度、核对数据'],['故障处理','排查原因、备份与恢复']];labels.forEach(([a,b],j)=>{const x=65+j*400;body+=`<rect x="${x}" y="270" width="350" height="270" rx="13" fill="#ffffff09" stroke="#6282ae"/>`+text(x+25,325,`0${j+1}`,24,'#83d5e5')+text(x+25,395,a,30,'#fff',600)+text(x+25,455,b,18,'#adc9e9')})}
 await sharp(svg(body)).png().toFile(`${work}/slide-${i}.png`);if(i===0)await fs.copyFile(`${work}/slide-${i}.png`,`${media}/tour-poster.png`)
 await fs.writeFile(`${work}/voice-${i}.txt`,c.voice);execFileSync('say',['-v','Tingting','-r','210','-f',`${work}/voice-${i}.txt`,'-o',`${work}/voice-${i}.aiff`])
 const audio=Number(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',`${work}/voice-${i}.aiff`],{encoding:'utf8'}));const duration=Math.ceil(audio+1.2);times.push({title:c.title,time:cursor,duration})
 const sentences=c.voice.match(/[^。！？]+[。！？]?/g)||[c.voice],size=sentences.reduce((a,s)=>a+s.length,0);let at=cursor
 for(const sentence of sentences){const d=audio*sentence.length/size;vtt+=`${time(at)} --> ${time(at+d)}\n${sentence}\n\n`;at+=d}
 cursor+=duration
 execFileSync('ffmpeg',['-y','-loglevel','error','-loop','1','-framerate','24','-i',`${work}/slide-${i}.png`,'-i',`${work}/voice-${i}.aiff`,'-t',String(duration),'-vf',`fade=t=in:st=0:d=0.3,fade=t=out:st=${duration-.3}:d=0.3,format=yuv420p`,'-af','apad','-c:v','libx264','-preset','veryfast','-crf','24','-c:a','aac','-b:a','96k',`${work}/part-${i}.mp4`]);console.log(`Rendered chapter ${i+1}: ${duration}s`)
}
await fs.writeFile(`${work}/concat.txt`,chapters.map((_,i)=>`file '${work}/part-${i}.mp4'`).join('\n'));execFileSync('ffmpeg',['-y','-loglevel','error','-f','concat','-safe','0','-i',`${work}/concat.txt`,'-c','copy','-movflags','+faststart',`${media}/rivomesh-tour.mp4`])
await fs.writeFile(`${media}/tour.zh-CN.vtt`,vtt.trimEnd()+'\n');await fs.writeFile(`${media}/transcript.txt`,chapters.map(c=>`${c.title}\n${c.voice}`).join('\n\n')+'\n');await fs.writeFile('website/.vitepress/data/tour.json',JSON.stringify(times,null,2)+'\n')
console.log(`Generated original brand assets, authentic product screenshots and a ${cursor}s narrated guide.`)
