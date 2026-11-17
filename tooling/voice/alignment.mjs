export const normalize=text=>text.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'')
export const seconds=text=>text.split(':').reduce((n,part)=>n*60+Number(part),0)
export function timestamp(n){const ms=Math.round(n*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')}.${String(ms%1000).padStart(3,'0')}`}
export function parseVtt(text){return text.trim().split(/\r?\n\s*\r?\n/).filter(block=>block.includes(' --> ')).map(block=>{const [timing,...lines]=block.split(/\r?\n/);const [start,end]=timing.split(' --> ');return {start:seconds(start),end:seconds(end),text:lines.join('\n')}})}
export function formatVtt(cues){return 'WEBVTT\n\n'+cues.map(cue=>`${timestamp(cue.start)} --> ${timestamp(cue.end)}\n${cue.text}`).join('\n\n')+'\n'}

// Align authoritative copy to observed word timestamps, allowing ASR spelling/punctuation differences.
export function alignSentences(sentences,words){
 const source=Array.from(sentences.map(normalize).join('')),observed=[]
 for(const word of words){const chars=Array.from(normalize(word.word));chars.forEach((char,i)=>observed.push({char,start:word.start+(word.end-word.start)*i/chars.length,end:word.start+(word.end-word.start)*(i+1)/chars.length}))}
 if(!source.length||!observed.length)throw new Error('Cannot align empty text or word timestamps')
 const width=observed.length+1,rows=source.length+1,dist=new Uint16Array(width*rows)
 for(let i=0;i<rows;i++)dist[i*width]=i
 for(let j=0;j<width;j++)dist[j]=j
 for(let i=1;i<rows;i++)for(let j=1;j<width;j++)dist[i*width+j]=Math.min(dist[(i-1)*width+j]+1,dist[i*width+j-1]+1,dist[(i-1)*width+j-1]+(source[i-1]===observed[j-1].char?0:1))
 const similarity=1-dist.at(-1)/Math.max(source.length,observed.length)
 if(similarity<.8)throw new Error(`Spoken copy needs review: timestamp transcript similarity ${(similarity*100).toFixed(1)}%`)
 const mapping=new Map();let i=source.length,j=observed.length
 while(i||j){
  if(i&&j&&dist[i*width+j]===dist[(i-1)*width+j-1]+(source[i-1]===observed[j-1].char?0:1)){mapping.set(i-1,j-1);i--;j--}
  else if(i&&dist[i*width+j]===dist[(i-1)*width+j]+1)i--
  else j--
 }
 let offset=0,last=0
 const cues=sentences.map(text=>{const length=Array.from(normalize(text)).length,indices=Array.from({length},(_,n)=>mapping.get(offset+n)).filter(n=>n!==undefined);offset+=length;if(!indices.length)throw new Error('A subtitle sentence has no aligned speech');const start=Math.max(last,observed[indices[0]].start),end=observed[indices.at(-1)].end;if(end<=start)throw new Error('Subtitle timing is not monotonic');last=end;return {start,end,text}})
 return {similarity,cues}
}
