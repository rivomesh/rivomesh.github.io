<script setup>
import {computed,ref} from 'vue'
import {useData} from 'vitepress'
import ScreenshotPreview from './ScreenshotPreview.vue'
const {frontmatter}=useData(),locale=computed(()=>frontmatter.value.locale==='en'?'en':'zh'),selected=ref(0)
const items=computed(()=>locale.value==='en'?[
 {name:'console-overview',title:'Task workspace',text:'Task list, phase, backlog and recovery controls in one workspace.',alt:'Real Chinese-language development preview of the RivoMesh task workspace.'},
 {name:'task-wizard',title:'Create a pipeline',text:'Configure the source, target mappings and persistent journal, then check before starting.',alt:'Real development preview of the RivoMesh pipeline configuration wizard.'},
 {name:'connector-catalog',title:'Inspect connector support',text:'Check the direction and verification profile before choosing a database or message system.',alt:'Real development preview of the RivoMesh connector capability catalog.'}
]:[
 {name:'console-overview',title:'任务工作台',text:'集中查看任务、阶段与积压，找到目标错误和恢复入口。',alt:'真实开发预览中的 RivoMesh 任务工作台与状态操作入口。'},
 {name:'task-wizard',title:'创建同步任务',text:'配置来源、目标映射和持久日志，保存后先检查，再启动。',alt:'真实开发预览中的 RivoMesh 新建同步任务向导。'},
 {name:'connector-catalog',title:'连接器能力目录',text:'选择数据库或消息目标前，先核对连接方向和验证范围。',alt:'真实开发预览中的 RivoMesh 连接器能力目录。'}
])
</script>
<template><div class="product-gallery"><div class="gallery-controls" role="group" :aria-label="locale==='en'?'Choose a product view':'选择产品界面'"><button v-for="(item,i) in items" :key="item.name" :aria-pressed="selected===i" :class="{selected:selected===i}" @click="selected=i">{{item.title}}</button></div><figure><ScreenshotPreview :key="items[selected].name" :name="items[selected].name" :alt="items[selected].alt" :locale="locale"/><figcaption><strong>{{items[selected].title}}</strong><span>{{items[selected].text}}</span></figcaption></figure><p class="gallery-source">{{locale==='en'?'Original development previews, captured in Chinese. Screenshots illustrate available controls, not live activity or performance. Validation and repair flows are documented below; no screenshot is provided for them.':'现有真实开发预览截图，用于说明操作入口，不代表实时运行或性能结果。数据校验与修复流程见下方文档，尚无对应截图。'}} <a :href="`/docs/${locale}/start/data-validation.html`">{{locale==='en'?'Validation workflow →':'数据校验流程 →'}}</a></p></div></template>
<style scoped>
.gallery-controls{display:flex;gap:8px;border-bottom:1px solid var(--line);margin-bottom:24px;overflow-x:auto}.gallery-controls button{padding:12px 20px;border-bottom:2px solid transparent;font-size:13px;color:var(--muted);white-space:nowrap}.gallery-controls .selected{color:var(--blue);border-color:var(--blue);font-weight:600}.product-gallery figure{margin:0}.product-gallery figcaption{display:flex;gap:24px;align-items:baseline;margin-top:16px;font-size:13px}.product-gallery figcaption strong{font-weight:550;white-space:nowrap}.product-gallery figcaption span,.gallery-source{color:var(--muted)}.gallery-source{font-size:11px;line-height:1.9;margin-top:15px!important}.gallery-source a{color:var(--blue)}@media(max-width:600px){.gallery-controls{margin-bottom:16px}.gallery-controls button{font-size:12px;padding:11px 12px}.product-gallery figcaption{display:block;font-size:12px}.product-gallery figcaption span{display:block;margin-top:5px}}
</style>
