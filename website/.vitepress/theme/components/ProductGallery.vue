<script setup>
import {computed,ref} from 'vue'
import {useData} from 'vitepress'
import ScreenshotPreview from './ScreenshotPreview.vue'
const props=defineProps({initial:{type:Number,default:1},full:Boolean})
const {frontmatter}=useData(),locale=computed(()=>frontmatter.value.locale==='en'?'en':'zh'),selected=ref(props.initial)
const items=computed(()=>locale.value==='en'?[
 {name:'console-overview',title:'Task workspace',text:'Task list, phase, backlog and recovery controls in one workspace.',alt:'Real English-language development preview of the RivoMesh task workspace.'},
 {name:'task-wizard',title:'Create a pipeline',text:'Configure the source, target mappings and persistent journal, then check before starting.',alt:'Real English-language development preview of the RivoMesh pipeline configuration wizard.'},
 {name:'connector-catalog',title:'Inspect connector support',text:'Check the direction and verification profile before choosing a database or message system.',alt:'Real English-language development preview of the RivoMesh connector capability catalog.'},
 {name:'target-recovery',title:'Recover a destination',text:'Inspect a PostgreSQL constraint failure and the action to resume that destination after repair.',alt:'Real English-language console showing a PostgreSQL SQL failure and its target recovery action.'}
]:[
 {name:'console-overview',title:'任务工作台',text:'集中查看任务、阶段与积压，找到目标错误和恢复入口。',alt:'真实开发预览中的 RivoMesh 任务工作台与状态操作入口。'},
 {name:'task-wizard',title:'创建同步任务',text:'配置来源、目标映射和持久日志，保存后先检查，再启动。',alt:'真实开发预览中的 RivoMesh 新建同步任务向导。'},
 {name:'connector-catalog',title:'连接器能力目录',text:'选择数据库或消息目标前，先核对连接方向和验证范围。',alt:'真实开发预览中的 RivoMesh 连接器能力目录。'},
 {name:'target-recovery',title:'定位错误与恢复投递',text:'查看 PostgreSQL 约束冲突，并在修复后单独恢复该目标。',alt:'真实中文控制台中的 PostgreSQL SQL 错误与目标恢复操作。'}
])
const views=computed(()=>items.value.map((item,index)=>({...item,index})).filter(item=>props.full||item.index!==0))
</script>
<template><div class="product-gallery"><div class="gallery-controls" role="group" :aria-label="locale==='en'?'Choose a product view':'选择产品界面'"><button v-for="item in views" :key="item.name" :aria-pressed="selected===item.index" :class="{selected:selected===item.index}" @click="selected=item.index">{{item.title}}</button></div><figure><ScreenshotPreview :key="items[selected].name" :name="items[selected].name" :alt="items[selected].alt" :locale="locale"/><figcaption><strong>{{items[selected].title}}</strong><span>{{items[selected].text}}</span></figcaption></figure><details v-if="selected===1" class="gallery-terms"><summary>{{locale==='en'?'What does V3 mean in the wizard?':'向导中的 V3 是什么意思？'}}</summary><p>{{locale==='en'?'V3 identifies the task configuration format for multi-database, multi-target pipelines. Keep the default for new tasks.':'V3 表示多库、多目标任务使用的配置格式，新建任务保留默认值即可。'}} <a :href="`/docs/${locale}/reference/pipeline-v3.html`">{{locale==='en'?'Configuration reference →':'查看配置说明 →'}}</a></p></details><p class="gallery-source">{{locale==='en'?'Console 0.1.0-SNAPSHOT · 5c54522 · isolated test environment.':'控制台 0.1.0-SNAPSHOT · 5c54522 · 隔离测试环境实拍。'}} <a :href="`/docs/${locale}/start/${selected===3?'troubleshooting':'data-validation'}.html`">{{selected===3?(locale==='en'?'Recovery workflow →':'故障恢复流程 →'):(locale==='en'?'Validation workflow →':'数据校验流程 →')}}</a></p></div></template>
<style scoped>
.gallery-terms{font-size:12px;margin-top:16px;color:var(--muted)}.gallery-terms summary{cursor:pointer;padding:8px 0;min-height:44px}.gallery-terms p{font-size:12px;margin:0 0 10px!important}.gallery-terms a{color:var(--blue)}.gallery-controls{display:flex;gap:8px;border-bottom:1px solid var(--line);margin-bottom:24px;overflow-x:auto}.gallery-controls button{padding:12px 20px;border-bottom:2px solid transparent;font-size:13px;color:var(--muted);white-space:nowrap}.gallery-controls .selected{color:var(--blue);border-color:var(--blue);font-weight:600}.product-gallery figure{margin:0}.product-gallery figcaption{display:flex;gap:24px;align-items:baseline;margin-top:16px;font-size:13px}.product-gallery figcaption strong{font-weight:550;white-space:nowrap}.product-gallery figcaption span,.gallery-source{color:var(--muted)}.gallery-source{font-size:11px;line-height:1.9;margin-top:15px!important}.gallery-source a{color:var(--blue)}@media(max-width:600px){.gallery-controls{margin-bottom:16px}.gallery-controls button{font-size:12px;padding:11px 12px}.product-gallery figcaption{display:block;font-size:12px}.product-gallery figcaption span{display:block;margin-top:5px}}
</style>
