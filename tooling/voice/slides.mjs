import sharp from 'sharp'
import {wordmark,palette} from '../brand/identity.mjs'

const esc=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
const text=(x,y,value,size=24,color='#edf3fc',weight=400)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(value)}</text>`
const line=(x,y,width)=>`<path d="M${x} ${y}h${width}" stroke="#35465f"/>`
const box=(x,y,w,h,accent=false)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${accent?'#203658':'#18273d'}" stroke="${accent?palette.light:'#35465f'}"/>`
const arrow=(x,y)=>`<path d="M${x} ${y}h40m-10-9 10 9-10 9" fill="none" stroke="${palette.light}" stroke-width="2"/>`
function steps(labels,descriptions,y=270){return labels.map((label,i)=>{const x=65+i*400;return box(x,y,350,240)+text(x+26,y+45,`0${i+1}`,18,palette.light)+text(x+26,y+105,label,27,'#edf3fc',600)+descriptions[i].map((value,j)=>text(x+26,y+153+j*30,value,20,'#acbdd4')).join('')+(i<2?arrow(x+355,y+120):'')}).join('')}
export async function englishSlide(index,title,destination){
 let body=`<rect width="1280" height="720" fill="${palette.night}"/>${line(65,94,1150)}`
 body+=wordmark({dark:true}).replace('<svg ','<svg x="62" y="30" width="220" height="46" ')
 body+=text(930,61,'PRODUCT WALKTHROUGH',15,'#a4b6ce')+text(65,155,`0${index+1} / WORKFLOW EXPLAINER`,16,palette.light)+text(65,211,title,43,'#edf3fc',600)
 if(index===0){
  body+=steps(['MySQL source','RivoMesh','Destinations'],[['Existing data','Binlog changes'],['Durable journal','Independent acknowledgements'],['Databases and analytics','Message brokers']])
  body+=text(65,575,'Snapshot + CDC',23,palette.light,600)+text(390,575,'Durable checkpoints',23,palette.light,600)+text(800,575,'Independent recovery',23,palette.light,600)
  body+=text(65,620,'PostgreSQL and Oracle capture sources are planned.',20,'#acbdd4')
 }
 if(index===1){
  body+=steps(['Prepare','Configure','Check'],[['MySQL test source','Independent empty target'],['Connections and mappings','Durable journal'],['GTID and full row images','Replication / snapshot access']])
  body+=text(65,580,'Build and start the console, then follow the pipeline wizard.',25,'#acbdd4')
  body+=text(65,625,'Start with a small, isolated evaluation.',21,palette.light)
 }
 if(index===2){
  body+=steps(['Check and start','Observe','Exercise recovery'],[['Validate the configuration','Start the pipeline'],['Phase and backlog','Per-target errors'],['Insert, update and delete','Restart and verify']])
  body+=text(65,580,'Each target keeps its own delivery progress.',26,palette.light,600)
  body+=text(65,625,'Follow actual task state. Illustrations do not show live measurements.',20,'#acbdd4')
 }
 if(index===3){
  body+=steps(['Compare','Review','Apply and verify'],[['A common checkpoint','Inspect data differences'],['Administrator-reviewed','Repair plan'],['Check repair results','Explicitly resume the task']])
  body+=text(65,580,'Fix the target error, then retry the original transaction.',25,palette.light)
  body+=text(65,625,'Validation: supported MySQL / PostgreSQL targets. Plan business cutover separately.',19,'#acbdd4')
 }
 if(index===4){
  body+=steps(['Install and sign in','Create and observe','Validate and recover'],[['Start your own console','Follow the task wizard'],['Inspect progress','Use documentation search'],['Review connector profiles','Evaluate before expanding']])
  body+=text(65,580,'Start with the English user guide',28,palette.light,600)
  body+=text(65,628,'rivomesh.github.io/docs/en/start/',24,'#acbdd4')
 }
 body+=line(65,662,1150)+text(65,695,'Workflow illustration · development preview · not a live console recording',15,'#a4b6ce')+text(1050,695,'RivoMesh',15,'#a4b6ce')
 await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${body}</svg>`)).png().toFile(destination)
}
