<script setup>
import {computed,nextTick,onBeforeUnmount,ref} from 'vue'
import {useData} from 'vitepress'
const {isDark}=useData()
const props=defineProps({name:{type:String,required:true},alt:{type:String,required:true},locale:{type:String,default:'zh'},eager:Boolean})
const assetName=computed(()=>props.name+(props.locale==='en'?'-en':''))
const dialog=ref(null),opener=ref(null),opened=ref(false)
async function show(){opened.value=true;await nextTick();dialog.value?.showModal();document.body.classList.add('media-open')}
function close(){dialog.value?.close();opened.value=false;document.body.classList.remove('media-open');opener.value?.focus()}
onBeforeUnmount(()=>document.body.classList.remove('media-open'))
</script>
<template>
  <div class="screenshot-preview">
    <button ref="opener" type="button" class="screenshot-button" @click="show" :aria-label="(locale==='en'?'Enlarge screenshot: ':'放大截图：')+alt">
      <span class="screenshot-chrome"><span><img :src="isDark?'/brand/logo-light.svg':'/brand/logo.svg'" alt="" width="17" height="17">RivoMesh <span class="capture-label">{{locale==='en'?' / Development preview':' / 开发预览'}}</span></span><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" aria-hidden="true"><path d="M6 2H2v4m8-4h4v4M2 10v4h4m8-4v4h-4"/></svg></span>
      <picture><source type="image/webp" :srcset="`/media/${assetName}-900.webp 900w, /media/${assetName}-1800.webp 1800w`" sizes="(max-width:760px) 90vw, 650px"><img :src="`/media/${assetName}.png`" :alt="alt" width="1800" height="912" :loading="eager?'eager':'lazy'" :fetchpriority="eager?'high':undefined" decoding="async"></picture>
      <span class="enlarge-label">{{locale==='en'?'View full size ↗':'查看大图 ↗'}}</span>
    </button>
    <Teleport to="body"><dialog v-if="opened" ref="dialog" class="screenshot-dialog" :aria-label="alt" @cancel.prevent="close" @click="event=>{if(event.target===dialog)close()}"><div class="screenshot-dialog-bar"><span>{{locale==='en'?'Development preview · original screenshot':'开发预览 · 原始截图'}}</span><button @click="close" :aria-label="locale==='en'?'Close enlarged image':'关闭大图'">{{locale==='en'?'Close':'关闭'}} ×</button></div><img :src="`/media/${assetName}.png`" :alt="alt" width="1800" height="912"><p>{{alt}}</p></dialog></Teleport>
  </div>
</template>
<style>
.media-open{overflow:hidden}.screenshot-dialog{width:min(1400px,94vw);max-width:94vw;max-height:92dvh;padding:0;border:1px solid var(--line);border-radius:8px;background:var(--canvas);color:var(--ink);box-shadow:0 25px 100px #0004;overflow:auto}.screenshot-dialog::backdrop{background:#0c1828b8}.screenshot-dialog-bar{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:13px 18px;border-bottom:1px solid var(--line);font-size:12px}.screenshot-dialog-bar span{color:var(--muted)}.screenshot-dialog-bar button{padding:5px 10px;border:1px solid var(--line);border-radius:4px}.screenshot-dialog>img{display:block;width:100%;height:auto}.screenshot-dialog>p{padding:13px 18px;font-size:12px;color:var(--muted)}
</style>
<style scoped>
.screenshot-button{display:block;padding:0;position:relative;width:100%;border:1px solid var(--line);border-radius:var(--radius-control);overflow:hidden;background:var(--surface);text-align:left}.screenshot-button picture,.screenshot-button picture img{display:block;width:100%;height:auto}.screenshot-chrome{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:10px 13px;border-bottom:1px solid var(--line);font-size:10px;background:var(--surface);color:var(--ink)}.screenshot-chrome>span{display:flex;align-items:center;gap:8px;min-width:0}.screenshot-chrome img{display:block;width:17px;height:17px;flex:none}.screenshot-chrome>svg{color:var(--muted);flex:none}.capture-label{color:var(--muted)}.enlarge-label{position:absolute;right:12px;bottom:12px;background:var(--canvas);border:1px solid var(--line);border-radius:4px;padding:5px 10px;font-size:10px;opacity:0;transition:opacity .16s;color:var(--ink)}.screenshot-button:hover .enlarge-label,.screenshot-button:focus-visible .enlarge-label{opacity:1}@media(max-width:400px){.screenshot-chrome{padding:9px 10px;font-size:9px}.screenshot-chrome>span{gap:6px}.capture-label{font-size:8px}}@media(hover:none){.enlarge-label{opacity:1}}
</style>
