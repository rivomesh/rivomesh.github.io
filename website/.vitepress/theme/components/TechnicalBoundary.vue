<script setup>
import {computed} from 'vue'
import {useData} from 'vitepress'
defineProps({summary:{type:String,required:true},href:String,linkLabel:String})
const {frontmatter}=useData(),en=computed(()=>frontmatter.value.locale==='en')
</script>
<template><details class="technical-boundary"><summary><span class="boundary-label">{{en?'Scope':'适用范围'}}</span><span>{{summary}}</span><svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg></summary><div class="boundary-content"><slot/><a v-if="href" :href="href">{{linkLabel||(en?'Requirements and limitations':'使用条件与详细边界')}} →</a></div></details></template>
<style scoped>
.technical-boundary{border-top:1px solid var(--line);margin-top:16px;font-size:11px;color:var(--muted)}.technical-boundary>summary{display:flex;align-items:baseline;gap:10px;list-style:none;cursor:pointer;padding:12px 0;min-height:44px;line-height:1.7}.technical-boundary>summary::-webkit-details-marker{display:none}.boundary-label{font-size:10px;color:var(--blue);white-space:nowrap}.technical-boundary summary>svg{flex:none;margin-left:auto;align-self:center;transition:transform var(--motion-fast) var(--ease-ui)}.technical-boundary[open] summary>svg{transform:rotate(180deg)}.boundary-content{padding:0 0 14px;line-height:1.85}.boundary-content a{display:inline-block;color:var(--blue);font-size:11px;padding-top:8px}.boundary-content :deep(p){font-size:11px;line-height:1.85;margin:0!important}.technical-boundary summary:focus-visible{outline:2px solid var(--blue);outline-offset:3px;border-radius:3px}
</style>
