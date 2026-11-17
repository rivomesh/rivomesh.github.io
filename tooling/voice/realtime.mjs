import WebSocket from 'ws'
import {HttpsProxyAgent} from 'https-proxy-agent'

export const delivery=`你是 RivoMesh 官网产品导览的中文配音员。只朗读用户提供的正文，不回答、不介绍自己、不增加或删减内容。用清晰自然的普通话，像熟悉产品的工程师向同事讲解，平实、亲切、专业，不要广告腔、播音腔或夸张情绪。语速适中，句子内部连贯，逗号轻停顿，句号自然换气，步骤和因果关系稍作强调，句尾不要每次都用相同的下降调。英语技术名称自然读出：RivoMesh 读作英文 Rivo Mesh，Java 按英文名称读，MySQL 读作 My S Q L，PostgreSQL 读作 Postgres Q L，GTID 按英文字母逐个读。不要把标点或这些配音要求读出来。`

export function wav(pcm){
 const header=Buffer.alloc(44)
 header.write('RIFF',0);header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8)
 header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22)
 header.writeUInt32LE(24000,24);header.writeUInt32LE(48000,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34)
 header.write('data',36);header.writeUInt32LE(pcm.length,40)
 return Buffer.concat([header,pcm])
}

export function narrate({text,key,model='gpt-realtime-2.1',voice='marin',proxy,instructions=delivery}){
 if(!key)throw new Error('Missing OPENAI_API_KEY. Configure .env.local; never put the key in source code.')
 return new Promise((resolve,reject)=>{
  const ws=new WebSocket(`wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,{
   headers:{Authorization:`Bearer ${key}`},agent:proxy?new HttpsProxyAgent(proxy):undefined,handshakeTimeout:20000
  })
  const chunks=[];let transcript='',finished=false,requested=false
  const send=event=>ws.send(JSON.stringify(event))
  const finish=(error,result)=>{if(finished)return;finished=true;clearTimeout(timer);ws.terminate();error?reject(error):resolve(result)}
  const timer=setTimeout(()=>finish(new Error('Voice generation timed out; no automatic billable retry was made.')),120000)
  ws.on('unexpected-response',(_request,response)=>{response.resume();finish(new Error(`OpenAI WebSocket HTTP ${response.statusCode}`))})
  ws.on('error',error=>finish(new Error(`OpenAI voice connection failed: ${error.code||'transport error'}`)))
  ws.on('close',()=>{if(!finished)finish(new Error('Voice connection closed before response.done.'))})
  ws.on('message',message=>{
   try{
    const event=JSON.parse(message.toString())
    if(event.type==='error')return finish(new Error(`OpenAI voice error: ${event.error?.code||event.error?.type||'unknown'}`))
    if(event.type==='session.created')send({type:'session.update',session:{type:'realtime',output_modalities:['audio'],instructions,audio:{input:{turn_detection:null},output:{format:{type:'audio/pcm',rate:24000},voice}}}})
    if(event.type==='session.updated'&&!requested){
     requested=true
     send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:`请逐字朗读以下正文：\n${text}`}]}})
     send({type:'response.create',response:{output_modalities:['audio']}})
    }
    if(event.type==='response.output_audio.delta')chunks.push(Buffer.from(event.delta,'base64'))
    if(event.type==='response.output_audio_transcript.done')transcript=event.transcript
    if(event.type==='response.done'){
     if(event.response?.status!=='completed'||!chunks.length)return finish(new Error(`Voice response incomplete: ${event.response?.status||'empty audio'}`))
     const pcm=Buffer.concat(chunks)
     finish(null,{audio:wav(pcm),duration:pcm.length/48000,transcript,usage:event.response.usage})
    }
   }catch(error){finish(error)}
  })
 })
}
