import https from 'node:https'
import {HttpsProxyAgent} from 'https-proxy-agent'

export async function transcribe(audio,{key,proxy,model='whisper-1',timed=true}){
 const form=new FormData()
 form.set('model',model)
 if(timed){form.set('language','zh');form.set('response_format','verbose_json');form.set('timestamp_granularities[]','word')}
 form.set('prompt','简体中文。RivoMesh，Java，MySQL，PostgreSQL，GTID。全量、增量、持久日志、目标确认、共同校验点。')
 form.set('file',new Blob([audio],{type:'audio/wav'}),'chapter.wav')
 const request=new Request('https://api.openai.com/v1/audio/transcriptions',{method:'POST',body:form})
 const body=Buffer.from(await request.arrayBuffer())
 return new Promise((resolve,reject)=>{
  const req=https.request(request.url,{method:'POST',agent:proxy?new HttpsProxyAgent(proxy):undefined,headers:{Authorization:`Bearer ${key}`,'Content-Type':request.headers.get('content-type'),'Content-Length':body.length}},res=>{
   const chunks=[];res.on('data',chunk=>chunks.push(chunk));res.on('error',reject)
   res.on('end',()=>{try{const result=JSON.parse(Buffer.concat(chunks));if(res.statusCode!==200)throw new Error(`Transcription API HTTP ${res.statusCode}: ${result.error?.code||'request failed'}`);if(timed&&!result.words?.length)throw new Error('Timestamp API returned no words');if(!result.text)throw new Error('Transcription API returned no text');resolve(result)}catch(error){reject(error)}})
  })
  req.setTimeout(120000,()=>req.destroy(new Error('Word timestamp request timed out')))
  req.on('error',error=>reject(new Error(`Timestamp connection failed: ${error.code||'transport error'}`)))
  req.end(body)
 })
}
export const wordTimestamps=(audio,options)=>transcribe(audio,options)
