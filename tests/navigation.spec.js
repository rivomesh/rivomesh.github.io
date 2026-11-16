import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {flushPromises,mount} from '@vue/test-utils'
import {nextTick,reactive,ref} from 'vue'
import navigation from '../website/.vitepress/data/navigation.json'
import pages from '../website/.vitepress/data/pages.json'
import DocSidebar from '../website/.vitepress/theme/components/DocSidebar.vue'
import Layout from '../website/.vitepress/theme/Layout.vue'
import SearchDialog from '../website/.vitepress/theme/components/SearchDialog.vue'
import searchIndex from '../website/public/search-index.json'
let state,routeState,wrappers=[]
vi.mock('vitepress',()=>({useData:()=>state,useRoute:()=>routeState}))
const zh=pages.filter(p=>p.locale==='zh')
function create(component,options){const wrapper=mount(component,{attachTo:document.body,...options});wrappers.push(wrapper);return wrapper}
beforeEach(()=>{localStorage.clear();sessionStorage.clear();document.body.innerHTML='';state={frontmatter:ref({kind:'docs',locale:'zh'}),page:ref({relativePath:zh[0].route.slice(1).replace(/\.html$/,'.md'),headers:[]}),isDark:ref(false)};routeState=reactive({path:zh[0].route});window.matchMedia=vi.fn(()=>({matches:false,addEventListener:vi.fn(),removeEventListener:vi.fn()}));window.fetch=vi.fn(async()=>({ok:true,json:async()=>searchIndex}))})
afterEach(()=>{for(const wrapper of wrappers)wrapper.unmount();wrappers=[];document.body.innerHTML='';document.body.classList.remove('dialog-open')})
describe('persistent documentation navigation',()=>{
 it('uses one complete and unique tree for every document in each language',()=>{for(const locale of ['zh','en']){const routes=navigation[locale].flatMap(g=>g.items.map(i=>i.route));expect(new Set(routes).size).toBe(routes.length);expect([...routes].sort()).toEqual(pages.filter(p=>p.locale===locale).map(p=>p.route).sort())}})
 it('keeps project resources and detailed references closed on first user-guide visit',async()=>{
  const wrapper=create(DocSidebar,{props:{groups:navigation.zh,active:'/docs/zh/start/index.html',locale:'zh'}});await flushPromises()
  expect(wrapper.get('[data-group="reference"] .sidebar-group-heading').attributes('aria-expanded')).toBe('false')
  expect(wrapper.get('[data-group="sdd"]').isVisible()).toBe(false)
  await wrapper.setProps({active:'/docs/zh/start/create-task.html'})
  expect(wrapper.get('[data-group="sdd"]').isVisible()).toBe(false)
  await wrapper.get('.project-nav-divider>button').trigger('click')
  expect(wrapper.get('[data-group="sdd"]').isVisible()).toBe(true)
 })
 it('keeps the same sidebar DOM, order and scroll position across all Chinese pages and back navigation',async()=>{
  const wrapper=create(Layout,{global:{stubs:{Content:{template:'<div class="test-content">Current article</div>'}}}})
  await flushPromises();await nextTick()
  const panel=wrapper.get('[data-sidebar-scroll]').element,frame=wrapper.get('[data-doc-sidebar]').element
  const groups=wrapper.findAll('[data-group]').map(g=>g.attributes('data-group'))
  panel.scrollTop=640
  for(const item of [...zh,...zh.slice(0,5).reverse()]){state.page.value={relativePath:item.route.slice(1).replace(/\.html$/,'.md'),headers:[]};state.frontmatter.value={kind:'docs',locale:'zh',sourcePath:item.sourcePath};routeState.path=item.route;await nextTick();expect(wrapper.get('[data-doc-sidebar]').element).toBe(frame);expect(wrapper.get('[data-sidebar-scroll]').element).toBe(panel);expect(panel.scrollTop).toBe(640);expect(wrapper.findAll('[data-group]').map(g=>g.attributes('data-group'))).toEqual(groups);expect(wrapper.get('[data-doc-sidebar] [aria-current="page"]').attributes('href')).toBe(item.route)}
 })
 it('preserves user-collapsed groups when changing articles and restores scroll after a reload',async()=>{
  const props={groups:navigation.zh,active:'/docs/zh/start/index.html',locale:'zh'}
  let wrapper=create(DocSidebar,{props});await flushPromises();await nextTick()
  await wrapper.get('[data-group="operations"] .sidebar-group-heading').trigger('click')
  const panel=wrapper.get('[data-sidebar-scroll]').element;panel.scrollTop=377
  await wrapper.setProps({active:'/docs/zh/reference/pipeline-v3.html'});await nextTick()
  expect(wrapper.get('[data-group="operations"] .sidebar-group-heading').attributes('aria-expanded')).toBe('false');expect(panel.scrollTop).toBe(377)
  wrapper.unmount();wrappers=wrappers.filter(w=>w!==wrapper)
  wrapper=create(DocSidebar,{props:{...props,active:'/docs/zh/sdd/plan.html'}});await flushPromises();await nextTick()
  expect(wrapper.get('[data-sidebar-scroll]').element.scrollTop).toBe(377)
  expect(wrapper.get('[data-group="operations"] .sidebar-group-heading').attributes('aria-expanded')).toBe('false')
 })
 it('opens the current group only when the user explicitly locates a document',async()=>{
  const target='/docs/zh/start/data-validation.html'
  const wrapper=create(DocSidebar,{props:{groups:navigation.zh,active:'/docs/zh/start/index.html',locale:'zh'}});await flushPromises()
  await wrapper.get('[data-group="operations"] .sidebar-group-heading').trigger('click');await wrapper.setProps({active:target})
  expect(wrapper.get('[data-group="operations"] .sidebar-group-heading').attributes('aria-expanded')).toBe('false')
  await wrapper.get('.locate-document').trigger('click');await flushPromises()
  expect(wrapper.get('[data-group="operations"] .sidebar-group-heading').attributes('aria-expanded')).toBe('true')
 })
})
describe('local document search',()=>{
 it('loads only the selected language and closes with Escape',async()=>{
  const wrapper=create(SearchDialog,{props:{open:false,locale:'zh'}});await wrapper.setProps({open:true});await flushPromises()
  const input=document.querySelector('[data-search-dialog] input');expect(document.activeElement).toBe(input)
  input.value='数据校验';input.dispatchEvent(new Event('input',{bubbles:true}));await nextTick()
  const results=[...document.querySelectorAll('[data-search-result]')];expect(results.length).toBeGreaterThan(0);expect(results.every(a=>!a.getAttribute('href').includes('/sdd/'))).toBe(true);expect(results.every(a=>a.getAttribute('href').startsWith('/docs/zh/'))).toBe(true)
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));expect(wrapper.emitted('close')).toHaveLength(1)
  await wrapper.setProps({open:false});expect(document.querySelector('[data-search-dialog]')).toBeNull()
 })
})
