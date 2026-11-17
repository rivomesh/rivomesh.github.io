import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {flushPromises,mount} from '@vue/test-utils'
import {ref} from 'vue'
import ConnectorCatalog from '../website/.vitepress/theme/components/ConnectorCatalog.vue'
import ProductGallery from '../website/.vitepress/theme/components/ProductGallery.vue'
import ScreenshotPreview from '../website/.vitepress/theme/components/ScreenshotPreview.vue'
import QuickStart from '../website/.vitepress/theme/components/QuickStart.vue'
import SiteHeader from '../website/.vitepress/theme/components/SiteHeader.vue'
import {pairedRoute,pageRoute} from '../website/.vitepress/site-routes.mjs'
let state,wrappers=[]
vi.mock('vitepress',()=>({useData:()=>state}))
function create(component,options={}){const wrapper=mount(component,{attachTo:document.body,...options});wrappers.push(wrapper);return wrapper}
beforeEach(()=>{state={frontmatter:ref({locale:'zh'}),isDark:ref(false)};document.body.innerHTML='';document.body.className='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockResolvedValue(undefined)}})})
afterEach(()=>{for(const wrapper of wrappers)wrapper.unmount();wrappers=[];document.body.innerHTML='';document.body.className='';vi.useRealTimers()})
describe('direction-specific connector profiles',()=>{
 it('groups a product once and retains distinct source and sink support',()=>{
  const wrapper=create(ConnectorCatalog)
  const postgres=wrapper.findAll('.connector-product').find(row=>row.get('h2').text()==='PostgreSQL')
  expect(postgres.findAll('.connector-profile')).toHaveLength(2)
  expect(postgres.findAll('.connector-profile')[0].text()).toContain('已验证')
  const source=postgres.findAll('.connector-profile')[1]
  expect(source.text()).toContain('采集源');expect(source.text()).toContain('暂不支持')
  expect(source.get('a').attributes('href')).toBe('/docs/zh/start/roadmap.html')
 })
 it('filters runnable source-and-sink support without counting planned sources',async()=>{
  const wrapper=create(ConnectorCatalog)
  await wrapper.findAll('select')[0].setValue('BOTH')
  expect(wrapper.findAll('.connector-product')).toHaveLength(1)
  expect(wrapper.get('h2').text()).toBe('MySQL')
  await wrapper.findAll('select')[0].setValue('SOURCE')
  await wrapper.findAll('select')[1].setValue('PLANNED')
  expect(wrapper.findAll('h2').map(x=>x.text()).sort()).toEqual(['Oracle','PostgreSQL'])
  expect(wrapper.findAll('.connector-profile a').every(x=>x.attributes('href').endsWith('/start/roadmap.html'))).toBe(true)
 })
 it('combines category/search filters and provides an empty-state reset',async()=>{
  const wrapper=create(ConnectorCatalog)
  await wrapper.findAll('select')[2].setValue('DOMESTIC')
  await wrapper.get('input').setValue('金仓')
  expect(wrapper.findAll('.connector-product')).toHaveLength(1)
  await wrapper.findAll('select')[0].setValue('SOURCE')
  expect(wrapper.findAll('.connector-product')).toHaveLength(0)
  await wrapper.get('.directory-empty button').trigger('click')
  expect(wrapper.findAll('.connector-product').length).toBeGreaterThan(1)
 })
 it('renders English profiles and keeps links in English',()=>{
  state.frontmatter.value.locale='en';const wrapper=create(ConnectorCatalog)
  expect(wrapper.text()).not.toMatch(/达梦|金仓|采集源|规划中/)
  expect(wrapper.findAll('.connector-profile a').every(x=>x.attributes('href').startsWith('/docs/en/'))).toBe(true)
 })
})
describe('product media and trial commands',()=>{
 it('switches original screenshots with keyboard-usable buttons',async()=>{
  const wrapper=create(ProductGallery)
  const controls=wrapper.findAll('.gallery-controls button')
  await controls[1].trigger('click')
  expect(controls[1].attributes('aria-pressed')).toBe('true')
  expect(wrapper.get('img').attributes('src')).toBe('/media/task-wizard.png')
  expect(wrapper.get('img').attributes('width')).toBe('1800')
  expect(wrapper.get('img').attributes('height')).toBe('912')
 })
 it('opens a labeled native dialog, handles Escape cancel, and restores focus',async()=>{
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
  const wrapper=create(ScreenshotPreview,{props:{name:'console-overview',alt:'Real workspace',locale:'en'}})
  const button=wrapper.get('button');button.element.focus();await button.trigger('click');await flushPromises()
  const dialog=document.querySelector('dialog')
  expect(dialog.getAttribute('aria-label')).toBe('Real workspace');expect(dialog.hasAttribute('open')).toBe(true)
  dialog.dispatchEvent(new Event('cancel',{cancelable:true}));await flushPromises()
  expect(document.querySelector('dialog')).toBeNull();expect(document.activeElement).toBe(button.element);expect(document.body.classList.contains('media-open')).toBe(false)
 })
 it('copies the selected real deployment method and reports clipboard failures',async()=>{
  const wrapper=create(QuickStart)
  await wrapper.get('.copy-command').trigger('click');await flushPromises()
  expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(expect.stringContaining('docker compose -f deploy/docker-compose.yml up -d --build'))
  await wrapper.findAll('.command-toolbar>div button')[1].trigger('click')
  await wrapper.get('.copy-command').trigger('click');await flushPromises()
  const command=navigator.clipboard.writeText.mock.calls.at(-1)[0]
  expect(command).toContain('mvn -s build/settings.xml verify');expect(command).toContain('serve config/platform.yml');expect(command).not.toContain('docker compose')
  navigator.clipboard.writeText.mockRejectedValueOnce(new Error('denied'));await wrapper.get('.copy-command').trigger('click');await flushPromises()
  expect(wrapper.get('[aria-live]').text()).toContain('手动选择')
 })
})
describe('language-aware navigation',()=>{
 it('preserves landing/document counterparts and avoids invented translated evidence',()=>{
  expect(pairedRoute('/','en')).toBe('/en/')
  expect(pairedRoute('/en/download.html','zh')).toBe('/download.html')
  expect(pairedRoute('/tour.html','en')).toBe('/en/tour.html')
  expect(pairedRoute('/docs/zh/start/faq.html','en',['/docs/en/start/faq.html'])).toBe('/docs/en/start/faq.html')
  expect(pairedRoute('/docs/zh/evidence/original.html','en',[])).toBeNull()
  expect(pageRoute('en/index.md')).toBe('/en/')
 })
 it('uses English landing routes and closes the mobile menu on Escape',async()=>{
  state.frontmatter.value.locale='en'
  const wrapper=create(SiteHeader,{props:{locale:'en',active:'/en/',switchRoute:'/',isDoc:false}})
  expect(wrapper.get('.brand').attributes('href')).toBe('/en/')
  expect(wrapper.findAll('.main-nav a').find(x=>x.text()==='Download').attributes('href')).toBe('/en/download.html')
  const toggle=wrapper.get('.mobile-nav-toggle');await toggle.trigger('click');expect(toggle.attributes('aria-expanded')).toBe('true')
  await wrapper.get('header').trigger('keydown',{key:'Escape'});expect(toggle.attributes('aria-expanded')).toBe('false');expect(document.activeElement).toBe(toggle.element)
 })
})
