<script setup>
import {ref} from 'vue'
import chapters from '../../data/tour.json'
const player=ref(null)
function seek(time){if(player.value){player.value.currentTime=time;player.value.play().catch(()=>{})}}
const stamp=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`
</script>
<template><video ref="player" class="product-video" controls playsinline preload="metadata" poster="/media/tour-poster.png" aria-label="RivoMesh 中文产品讲解"><source src="/media/rivomesh-tour.mp4" type="video/mp4"><track kind="captions" src="/media/tour.zh-CN.vtt" label="简体中文" srclang="zh-CN" default>请下载视频或阅读文字稿。</video><div class="video-chapters" aria-label="讲解章节"><button v-for="c in chapters" :key="c.title" @click="seek(c.time)"><span>{{stamp(c.time)}}</span>{{c.title}}</button></div></template>
