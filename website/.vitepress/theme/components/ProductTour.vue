<script setup>
import {computed,ref} from 'vue'
import {useData} from 'vitepress'
import chapters from '../../data/tour.json'
const {frontmatter}=useData(),en=computed(()=>frontmatter.value.locale==='en'),player=ref(null)
const titles=['What database replication does','Prepare and create a task','Check, start and observe','Validate and review repairs','Follow the user guide']
function seek(time){if(player.value){player.value.currentTime=time;player.value.play().catch(()=>{})}}
const stamp=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`
</script>
<template><video ref="player" class="product-video" controls playsinline preload="metadata" width="1280" height="720" poster="/media/tour-poster.png" :aria-label="en?'RivoMesh walkthrough: Chinese narration with English subtitles':'RivoMesh 中文产品讲解，中英文字幕'"><source src="/media/rivomesh-tour.mp4" type="video/mp4"><track kind="subtitles" src="/media/tour.en.vtt" label="English" srclang="en" :default="en"><track kind="captions" src="/media/tour.zh-CN.vtt" label="简体中文" srclang="zh-CN" :default="!en">{{en?'Download the video or read its transcript.':'请下载视频或阅读文字稿。'}}</video><div class="video-chapters" :aria-label="en?'Video chapters':'讲解章节'"><button v-for="(c,i) in chapters" :key="c.title" @click="seek(c.time)"><span>{{stamp(c.time)}}</span>{{en?titles[i]:c.title}}</button></div></template>
