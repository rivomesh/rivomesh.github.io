<script setup>
import {computed,nextTick,onBeforeUnmount,onMounted,ref,watch} from 'vue'
import {currentGroup,readState,saveState,safeStorage} from '../sidebar-state.mjs'
const props=defineProps({groups:{type:Array,required:true},active:{type:String,required:true},locale:{type:String,default:'zh'}})
const emit=defineEmits(['navigate','close'])
const panel=ref(null),closed=ref(props.groups.filter(g=>g.defaultClosed).map(g=>g.id)),ready=ref(false),projectOpen=ref(false)
let scheduled=0
const key=computed(()=>`rivomesh.docs.v2.${props.locale}`)
const activeTitle=computed(()=>props.groups.flatMap(g=>g.items).find(i=>i.route===props.active)?.title||'')
function persist(){if(panel.value)saveState(safeStorage('sessionStorage'),key.value+'.scroll',panel.value.scrollTop)}
function onScroll(){if(scheduled)return;scheduled=requestAnimationFrame(()=>{scheduled=0;persist()})}
function toggleProject(){projectOpen.value=!projectOpen.value;saveState(safeStorage('localStorage'),key.value+'.project',projectOpen.value)}
function toggle(id){closed.value=closed.value.includes(id)?closed.value.filter(x=>x!==id):[...closed.value,id];saveState(safeStorage('localStorage'),key.value+'.closed',closed.value)}
async function locate(){const id=currentGroup(props.groups,props.active);if(props.groups.find(g=>g.id===id)?.audience==='project'){projectOpen.value=true;saveState(safeStorage('localStorage'),key.value+'.project',true)}closed.value=closed.value.filter(x=>x!==id);saveState(safeStorage('localStorage'),key.value+'.closed',closed.value);await nextTick();const active=panel.value?.querySelector('[aria-current="page"]');if(active&&panel.value){const box=panel.value.getBoundingClientRect(),item=active.getBoundingClientRect();panel.value.scrollTop+=item.top-box.top-65;persist()}}
async function restore(){ready.value=false;projectOpen.value=readState(safeStorage('localStorage'),key.value+'.project',false);closed.value=readState(safeStorage('localStorage'),key.value+'.closed',props.groups.filter(g=>g.defaultClosed).map(g=>g.id));await nextTick();const position=readState(safeStorage('sessionStorage'),key.value+'.scroll',null);if(position!==null&&panel.value)panel.value.scrollTop=position;else await locate();ready.value=true}
onMounted(restore)
// Only a language change restores another tree. Article changes never rebuild or scroll this panel.
watch(()=>props.locale,restore)
onBeforeUnmount(()=>{if(scheduled)cancelAnimationFrame(scheduled);persist()})
</script>
<template>
  <div class="sidebar-frame" data-doc-sidebar>
    <div class="sidebar-heading"><span>{{locale==='zh'?'使用文档':'Documentation'}}</span><span class="version-label">0.1.0-SNAPSHOT</span><button class="sidebar-close" @click="emit('close')" :aria-label="locale==='zh'?'关闭目录':'Close navigation'">×</button></div>
    <button class="locate-document" @click="locate" :title="activeTitle"><span>◎</span>{{locale==='zh'?'定位当前文档':'Locate current page'}}</button>
    <nav ref="panel" class="sidebar-scroll" data-sidebar-scroll :aria-label="locale==='zh'?'完整文档目录':'Complete documentation navigation'" @scroll.passive="onScroll">
      <template v-for="(group,g) in groups" :key="group.id">
      <div v-if="group.audience==='project'&&groups[g-1]?.audience!=='project'" class="project-nav-divider"><button @click="toggleProject" :aria-expanded="projectOpen">{{locale==='zh'?'项目资料':'Project resources'}} <span>{{projectOpen?'−':'+'}}</span></button><a :href="locale==='en'?'/en/project.html':'/project.html'">{{locale==='zh'?'路线图、架构与贡献资料 ↗':'Roadmap, architecture & contribution ↗'}}</a></div>
      <section v-show="group.audience!=='project'||projectOpen" class="sidebar-group" :data-group="group.id">
        <button class="sidebar-group-heading" :aria-expanded="!closed.includes(group.id)" :aria-controls="'nav-'+group.id" @click="toggle(group.id)"><span>{{group.title}}</span><span class="chevron" :class="{folded:closed.includes(group.id)}">⌄</span></button>
        <ul v-show="!closed.includes(group.id)" :id="'nav-'+group.id"><li v-for="item in group.items" :key="item.route"><a :href="item.route" :aria-current="active===item.route?'page':undefined" :class="{active:active===item.route}" @click="emit('navigate',item.route)">{{item.title}}</a></li></ul>
      </section>
      </template>
    </nav>
    <div class="sidebar-bottom"><a href="https://github.com/rivomesh/rivomesh" target="_blank" rel="noreferrer">GitHub <span>↗</span></a><a :href="locale==='en'?'/en/project.html':'/project.html'">{{locale==='zh'?'项目资料':'Project'}} <span>→</span></a></div>
  </div>
</template>
