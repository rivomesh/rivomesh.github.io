<script setup>
import { ref } from 'vue'
import { withBase } from 'vitepress'
import chapterData from '../../data/tour-chapters.json'
const player=ref(null)
const chapters=chapterData.map(c=>[c.title,c.time])
function seek(t){if(player.value){player.value.currentTime=t;player.value.play().catch(()=>{})}}
</script>
<template><div><video ref="player" class="tour-video" controls playsinline preload="metadata" :poster="withBase('/media/tour-poster.png')" aria-label="RivoMesh 中文配音产品导览"><source :src="withBase('/media/rivomesh-tour.mp4')" type="video/mp4"><track kind="captions" label="简体中文" srclang="zh-CN" :src="withBase('/media/tour.zh-CN.vtt')" default>浏览器不支持视频，请下载视频或阅读下面的文字讲解。</video><div class="tour-chapters" role="group" aria-label="视频章节"><button v-for="[label,t] in chapters" :key="label" @click="seek(t)">{{String(Math.floor(t/60)).padStart(2,'0')}}:{{String(t%60).padStart(2,'0')}} {{label}}</button></div></div></template>
