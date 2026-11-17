import {EventEmitter} from 'node:events'
import {beforeEach,describe,expect,it,vi} from 'vitest'
import {alignSentences,parseVtt,formatVtt,timestamp} from '../tooling/voice/alignment.mjs'
import {wav,narrate} from '../tooling/voice/realtime.mjs'

const sockets=vi.hoisted(()=>({mode:'success',last:null}))
vi.mock('ws',()=>({default:class extends EventEmitter{
 constructor(url,options){super();this.url=url;this.options=options;this.sent=[];sockets.last=this;queueMicrotask(()=>this.receive({type:'session.created'}))}
 receive(event){this.emit('message',Buffer.from(JSON.stringify(event)))}
 send(message){const event=JSON.parse(message);this.sent.push(event);if(event.type==='session.update')queueMicrotask(()=>this.receive({type:'session.updated'}));if(event.type==='response.create')queueMicrotask(()=>{
  if(sockets.mode==='error')return this.receive({type:'error',error:{code:'rate_limit_exceeded'}})
  if(sockets.mode==='success'){this.receive({type:'response.output_audio.delta',delta:Buffer.alloc(4800).toString('base64')});this.receive({type:'response.output_audio_transcript.done',transcript:'测试。'})}
  this.receive({type:'response.done',response:{status:'completed',usage:{total_tokens:5}}})
 })}
 terminate(){this.closed=true}
}}))
beforeEach(()=>{sockets.mode='success';sockets.last=null})
describe('offline narration protocol',()=>{
 it('waits for configuration, requests one exact reading, and saves PCM16 WAV',async()=>{
  const result=await narrate({text:'测试。',key:'test-only-key'})
  expect(sockets.last.sent.map(event=>event.type)).toEqual(['session.update','conversation.item.create','response.create'])
  expect(sockets.last.sent[1].item.content[0].text).toContain('测试。')
  expect(result.transcript).toBe('测试。');expect(result.duration).toBe(.1)
  expect(result.audio.toString('ascii',0,4)).toBe('RIFF');expect(result.audio.readUInt32LE(24)).toBe(24000)
  expect(result.audio.readUInt16LE(22)).toBe(1);expect(result.audio.readUInt32LE(40)).toBe(4800)
  expect(sockets.last.closed).toBe(true)
 })
 it('rejects provider errors and empty audio without retrying',async()=>{
  sockets.mode='error';await expect(narrate({text:'测试。',key:'test-only-key'})).rejects.toThrow('rate_limit_exceeded')
  expect(sockets.last.closed).toBe(true)
  sockets.mode='empty';await expect(narrate({text:'测试。',key:'test-only-key'})).rejects.toThrow('incomplete')
 })
 it('requires credentials before starting a connection and writes valid empty WAV headers',()=>{
  expect(()=>narrate({text:'测试。'})).toThrow('Missing OPENAI_API_KEY')
  expect(wav(Buffer.alloc(0)).length).toBe(44)
 })
})
describe('subtitle alignment',()=>{
 it('carries millisecond rounding across minute boundaries',()=>{expect(timestamp(59.9999)).toBe('00:01:00.000');expect(timestamp(3600.125)).toBe('01:00:00.125')})
 it('keeps authoritative bilingual cue boundaries aligned to observed speech and pauses',()=>{
  const result=alignSentences(['这是 MySQL。','请检查数据。'],[{word:'这',start:.2,end:.4},{word:'是',start:.4,end:.6},{word:'MySQL',start:.6,end:1.2},{word:'请',start:1.8,end:2},{word:'检查',start:2,end:2.4},{word:'数据',start:2.4,end:2.8}])
  expect(result.similarity).toBe(1);expect(result.cues[0]).toMatchObject({start:.2,end:1.2});expect(result.cues[1]).toMatchObject({start:1.8,end:2.8})
  expect(parseVtt(formatVtt(result.cues))).toEqual(result.cues)
 })
 it('tolerates spelling differences but rejects missing or unrelated speech',()=>{
  const result=alignSentences(['目标数据库检查'],[{word:'目标数据路检查',start:0,end:2}])
  expect(result.similarity).toBeGreaterThan(.8);expect(result.cues[0].text).toBe('目标数据库检查')
  expect(()=>alignSentences(['完整的产品讲解内容'],[{word:'没有关系',start:0,end:1}])).toThrow('needs review')
  expect(()=>alignSentences(['测试'],[])).toThrow('empty')
 })
})
