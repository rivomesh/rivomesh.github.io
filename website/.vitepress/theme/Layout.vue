<script setup>
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue'
import {useData,useRoute} from 'vitepress'
import navigation from '../data/navigation.json'
import pages from '../data/pages.json'
import {flatten} from './sidebar-state.mjs'
import DocSidebar from './components/DocSidebar.vue'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import SearchDialog from './components/SearchDialog.vue'
import {pairedRoute,homePath,sitePath} from '../site-routes.mjs'
const {frontmatter,page}=useData(),route=useRoute()
const isDoc=computed(()=>frontmatter.value.kind==='docs')
const locale=computed(()=>frontmatter.value.locale==='en'?'en':'zh')
const active=computed(()=>'/'+(page.value.relativePath||'index.md').replace(/\.md$/,'.html'))
const groups=computed(()=>navigation[locale.value])
const flat=computed(()=>flatten(groups.value))
const current=computed(()=>flat.value.find(x=>x.route===active.value))
const position=computed(()=>flat.value.findIndex(x=>x.route===active.value))
const previous=computed(()=>position.value>0?flat.value[position.value-1]:null)
const following=computed(()=>position.value>=0?flat.value[position.value+1]:null)
const outline=computed(()=>page.value.headers||[])
const search=ref(false),directory=ref(false),toc=ref(false),mobile=ref(false)
let mediaQuery
function updateMobile(){mobile.value=mediaQuery?.matches||false}
onMounted(()=>{mediaQuery=window.matchMedia('(max-width:960px)');updateMobile();mediaQuery.addEventListener?.('change',updateMobile)})
onBeforeUnmount(()=>mediaQuery?.removeEventListener?.('change',updateMobile))
const switchRoute=computed(()=>{const other=locale.value==='zh'?'en':'zh';return pairedRoute(route.path,other,pages.map(p=>p.route))||`/docs/${other}/start/index.html`})
watch(()=>route.path,()=>{directory.value=false;toc.value=false;search.value=false})
function keys(event){if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();search.value=!search.value}if(event.key==='Escape'){directory.value=false;toc.value=false}}
async function copyCode(event){const button=event.target.closest?.('button.copy');if(!button)return;const code=button.parentElement.querySelector('pre code');if(!code)return;try{await navigator.clipboard.writeText(code.textContent);button.classList.add('copied');setTimeout(()=>button.classList.remove('copied'),1600)}catch{button.setAttribute('aria-label','Copy failed')}}
onMounted(()=>document.addEventListener('keydown',keys));onBeforeUnmount(()=>document.removeEventListener('keydown',keys))
</script>
<template><div class="site-root"><a href="#main-content" class="skip-link">跳到正文 / Skip to content</a><SiteHeader :locale="locale" :active="route.path" :is-doc="isDoc" :switch-route="switchRoute" @search="search=true" @directory="directory=!directory"/><template v-if="isDoc"><div v-if="directory" class="sidebar-backdrop" @click="directory=false"></div><aside class="doc-sidebar" :class="{visible:directory}" :inert="mobile&&!directory" :aria-hidden="mobile&&!directory?'true':undefined"><DocSidebar :groups="groups" :active="active" :locale="locale" @navigate="directory=false" @close="directory=false"/></aside><div class="doc-main-area"><main id="main-content" class="doc-article" :lang="locale==='en'?'en':'zh-CN'" @click="copyCode"><div class="doc-breadcrumb"><a :href="`/docs/${locale}/start/index.html`">{{locale==='zh'?'文档':'Docs'}}</a><span>/</span><span>{{current?.group}}</span></div><button v-if="outline.length" class="mobile-outline" @click="toc=!toc">{{locale==='zh'?'本页内容':'On this page'}} ⌄</button><nav v-if="toc" class="inline-outline"><a v-for="head in outline" :key="head.link" :href="head.link" @click="toc=false">{{head.title}}</a></nav><Content class="prose"/><div v-if="frontmatter.sourcePath" class="source-reference"><span>{{locale==='zh'?'详细参考文档':'Reference documentation'}}</span><a :href="'https://github.com/rivomesh/rivomesh/blob/main/'+frontmatter.sourcePath" target="_blank" rel="noreferrer">{{frontmatter.sourcePath}} ↗</a></div><div class="doc-feedback"><span>{{locale==='zh'?'发现文档问题？':'Found an issue?'}}</span><a href="https://github.com/rivomesh/rivomesh.github.io/issues" target="_blank" rel="noreferrer">{{locale==='zh'?'反馈与改进':'Help improve the docs'}} ↗</a></div><nav class="doc-pager" :aria-label="locale==='zh'?'相邻文档':'Adjacent documentation'"><a v-if="previous" :href="previous.route"><small>← {{locale==='zh'?'上一篇':'Previous'}}</small><strong>{{previous.title}}</strong></a><span v-else></span><a v-if="following" :href="following.route"><small>{{locale==='zh'?'下一篇':'Next'}} →</small><strong>{{following.title}}</strong></a></nav><div class="doc-copyright">© 2026 RivoMesh contributors · <a href="/source-snapshot.json">{{locale==='zh'?'文档版本':'Documentation version'}}</a></div></main><aside class="page-outline" :aria-label="locale==='zh'?'本页目录':'On this page'"><div class="outline-inner"><strong>{{locale==='zh'?'本页内容':'On this page'}}</strong><a v-for="head in outline" :key="head.link" :href="head.link">{{head.title}}</a><a class="outline-top" href="#main-content">↑ {{locale==='zh'?'回到顶部':'Back to top'}}</a></div></aside></div></template><template v-else><main id="main-content" @click="copyCode" :lang="locale==='en'?'en':'zh-CN'" :class="frontmatter.kind==='home'?'home-main':'landing-main'"><Content v-if="!page.isNotFound" :class="frontmatter.kind==='home'?'':'prose landing-content'"/><div v-else class="not-found"><span>404</span><h1>{{locale==='en'?'Page not found':'页面未找到'}}</h1><p>{{locale==='en'?'Continue from the documentation or use search.':'可以从文档首页继续查找，或使用顶部搜索。'}}</p><a class="button primary" :href="`/docs/${locale}/start/index.html`">{{locale==='en'?'Documentation':'进入文档'}}</a></div></main><SiteFooter/></template><SearchDialog :open="search" :locale="locale" @close="search=false"/></div></template>
