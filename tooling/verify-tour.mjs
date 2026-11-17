import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {parseVtt,normalize} from './voice/alignment.mjs'
import {mediaNames,englishScript} from './voice/content.mjs'

const read=async file=>JSON.parse(await fs.readFile(file,'utf8'))
for(const locale of ['zh','en']){
const names=mediaNames(locale)
const timeline=await read(`website/.vitepress/data/${names.timeline}`),media=await read(`website/.vitepress/data/${names.manifest}`),report=await read(`website/public/media/${names.report}`)
const revision=createHash('sha256').update(await fs.readFile(`website/public/media/${names.video}`)).digest('hex').slice(0,16)
assert.equal(media.revision,revision,'player cache version matches the video');assert.equal(report.revision,revision,'provenance matches the video')
assert.equal(report.provider,'OpenAI');assert.equal(report.synthetic,true)
assert.equal(report.chapters.length,timeline.length)
let end=0
for(const [i,chapter]of timeline.entries()){
 assert.equal(chapter.time,end,'contiguous chapters');assert.ok(chapter.duration>0)
 assert.equal(report.chapters[i].title,chapter.title);assert.equal(report.chapters[i].duration,chapter.duration)
 assert.ok(report.chapters[i].audioDuration>0&&report.chapters[i].audioDuration<=chapter.duration,'speech fits the chapter')
 end+=chapter.duration
}
assert.equal(end,report.duration)
const tracks=await Promise.all([names.zh,names.en].map(async file=>parseVtt(await fs.readFile(`website/public/media/${file}`,'utf8'))))
assert.ok(tracks[0].length>0);assert.equal(tracks[0].length,tracks[1].length)
for(const cues of tracks){let last=0;for(const cue of cues){assert.ok(cue.start>=last&&cue.end>cue.start&&cue.end<=end,'ordered captions within the video');assert.ok(cue.text.trim());last=cue.end}}
assert.deepEqual(tracks[0].map(({start,end})=>[start,end]),tracks[1].map(({start,end})=>[start,end]),'translated captions share speech timestamps')
if(locale==='en'){
 assert.equal(report.locale,'en','English narration provenance');assert.ok(timeline.every(chapter=>!/[\p{Script=Han}]/u.test(chapter.title)),'English chapter titles')
 const script=await englishScript();assert.deepEqual(tracks[1].map(cue=>cue.text),script.flatMap(chapter=>chapter.cues.map(cue=>cue.en)));assert.ok(tracks[1].every(cue=>!/[\p{Script=Han}]/u.test(cue.text)),'English default captions')
 const words=await fs.readFile('website/public/media/transcript.en.txt','utf8');assert.ok(script.every(chapter=>normalize(words).includes(normalize(chapter.cues.map(cue=>cue.en).join(' ')))),'English spoken transcript')
}
console.log(`Tour ${locale} check: ${timeline.length} chapters, ${end}s, ${tracks[0].length} synchronized bilingual cues, matching video revision and AI provenance. No FFmpeg or API required.`)

}
