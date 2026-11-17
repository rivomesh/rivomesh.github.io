import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest'
import {flushPromises,mount} from '@vue/test-utils'
import {ref} from 'vue'
import ConnectorCatalog from '../website/.vitepress/theme/components/ConnectorCatalog.vue'
import ProductGallery from '../website/.vitepress/theme/components/ProductGallery.vue'
import ProductTour from '../website/.vitepress/theme/components/ProductTour.vue'
import ScreenshotPreview from '../website/.vitepress/theme/components/ScreenshotPreview.vue'
import QuickStart from '../website/.vitepress/theme/components/QuickStart.vue'
import SiteHeader from '../website/.vitepress/theme/components/SiteHeader.vue'
import Roadmap from '../website/.vitepress/theme/components/Roadmap.vue'
import requirements from '../website/.vitepress/data/requirements.json'
import media from '../website/.vitepress/data/tour-media.json'
import englishChapters from '../website/.vitepress/data/tour-en.json'
import englishMedia from '../website/.vitepress/data/tour-en-media.json'
import {pairedRoute,pageRoute} from '../website/.vitepress/site-routes.mjs'
let state,wrappers=[]
vi.mock('vitepress',()=>({useData:()=>state}))
function create(component,options={}){const wrapper=mount(component,{attachTo:document.body,...options});wrappers.push(wrapper);return wrapper}
beforeEach(()=>{state={frontmatter:ref({locale:'zh'}),isDark:ref(false)};document.body.innerHTML='';document.body.className='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:vi.fn().mockResolvedValue(undefined)}})})
afterEach(()=>{for(const wrapper of wrappers)wrapper.unmount();wrappers=[];document.body.innerHTML='';document.body.className='';vi.useRealTimers()})
describe('direction-specific connector profiles',()=>{
 it('keeps the homepage to six shared profiles without directory filters or planned source badges',()=>{
  const wrapper=create(ConnectorCatalog,{props:{compact:true}})
  expect(wrapper.findAll('.connector-product')).toHaveLength(6)
  expect(wrapper.findAll('select,input')).toHaveLength(0)
  const postgres=wrapper.findAll('.connector-product').find(row=>row.get('h3').text()==='PostgreSQL')
  expect(postgres.text()).toContain('同步目标');expect(postgres.text()).not.toContain('采集源')
  expect(wrapper.text()).toContain('请按采集源与同步目标分别核对支持范围')
 })
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
describe('product roadmap and engineering details',()=>{
 it('separates planned sources from available capabilities and keeps all requirement records collapsed',async()=>{
  const wrapper=create(Roadmap)
  expect(wrapper.get('.roadmap-current').text()).toContain('MySQL')
  expect(wrapper.get('.roadmap-current').text()).not.toMatch(/PostgreSQL|Oracle/)
  expect(wrapper.get('[data-phase="NEW"]').text()).toContain('PostgreSQL 与 Oracle')
  expect(wrapper.get('[data-phase="PARTIAL"]').text()).toContain('多节点任务管理')
  expect(wrapper.get('#engineering-details').attributes('open')).toBeUndefined()
  expect(wrapper.findAll('.requirement-item')).toHaveLength(requirements.requirements.length)
  wrapper.get('#engineering-details').element.open=true
  await wrapper.get('input').setValue('SO-06')
  expect(wrapper.findAll('.requirement-item')).toHaveLength(1)
  expect(wrapper.get('.requirement-item').text()).toContain('PostgreSQL 源适配器')
 })
 it('localizes the product overview and preserves English links and requirement filters',async()=>{
  state.frontmatter.value.locale='en';const wrapper=create(Roadmap)
  expect(wrapper.get('.roadmap-current').text()).toContain('Available today')
  expect(wrapper.get('[data-phase="NEW"]').text()).toContain('Additional source databases')
  expect(wrapper.findAll('.roadmap-capabilities a,.roadmap-directions a').every(link=>link.attributes('href').startsWith('/docs/en/'))).toBe(true)
  wrapper.get('#engineering-details').element.open=true
  await wrapper.findAll('select')[0].setValue('SOURCE')
  await wrapper.findAll('select')[1].setValue('NEW')
  const expected=requirements.requirements.filter(row=>row.epic==='SOURCE'&&row.status==='NEW')
  expect(wrapper.findAll('.requirement-item').map(row=>row.get('code').text())).toEqual(expected.map(row=>row.id))
  expect(wrapper.get('input').attributes('placeholder')).not.toMatch(/会话/)
 })
})
describe('product media and trial commands',()=>{
 it('uses English PNG and responsive images for every English gallery view',async()=>{
  state.frontmatter.value.locale='en'
  const wrapper=create(ProductGallery),names=['console-overview','task-wizard','connector-catalog']
  for(const [i,name]of names.entries()){
   await wrapper.findAll('.gallery-controls button')[i].trigger('click')
   expect(wrapper.get('picture img').attributes('src')).toBe(`/media/${name}-en.png`)
   expect(wrapper.get('picture source').attributes('srcset')).toBe(`/media/${name}-en-900.webp 900w, /media/${name}-en-1800.webp 1800w`)
   expect(wrapper.get('picture img').attributes('alt')).toContain('English-language')
  }
  expect(wrapper.text()).not.toContain('captured in Chinese')
 })
 it('loads video only after an action, selects English subtitles and seeks chapters',async()=>{
  state.frontmatter.value.locale='en'
  const load=vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{})
  const play=vi.spyOn(HTMLMediaElement.prototype,'play').mockResolvedValue(undefined)
  const wrapper=create(ProductTour)
  expect(wrapper.find('video').exists()).toBe(false)
  await wrapper.findAll('.video-chapters button')[2].trigger('click');await flushPromises()
  const video=wrapper.get('video')
  expect(load).toHaveBeenCalledOnce()
  expect(video.attributes('preload')).toBe('none');expect(video.attributes('autoplay')).toBeUndefined()
  expect(video.findAll('track')).toHaveLength(2)
  expect(video.get('track[srclang="en"]').attributes('default')).toBeDefined()
  const tracks=[{language:'en',mode:'disabled'},{language:'zh-CN',mode:'showing'}]
  Object.defineProperty(video.element,'textTracks',{value:tracks})
  await video.trigger('loadedmetadata');await flushPromises()
  expect(tracks.map(track=>track.mode)).toEqual(['showing','disabled'])
  expect(video.element.currentTime).toBe(englishChapters[2].time);expect(play).toHaveBeenCalledOnce()
  expect(video.get('source').attributes('src')).toBe(`/media/rivomesh-tour-en.mp4?v=${englishMedia.revision}`)
  expect(video.get('track[srclang="en"]').attributes('src')).toContain('/media/tour-en.en.vtt')
  expect(wrapper.get('a[download]').attributes('href')).toBe(`/media/rivomesh-tour-en.mp4?v=${englishMedia.revision}`)
 })
 it('stops the current language video and shows the independent poster on a locale switch',async()=>{
  vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{})
  const pause=vi.spyOn(HTMLMediaElement.prototype,'pause').mockImplementation(()=>{})
  const wrapper=create(ProductTour)
  expect(wrapper.get('.video-poster img').attributes('src')).toBe('/media/tour-poster.png')
  await wrapper.get('.video-poster').trigger('click');await flushPromises()
  expect(wrapper.get('video source').attributes('src')).toBe(`/media/rivomesh-tour.mp4?v=${media.revision}`)
  state.frontmatter.value.locale='en';await flushPromises()
  expect(pause).toHaveBeenCalledOnce();expect(wrapper.find('video').exists()).toBe(false)
  expect(wrapper.get('.video-poster img').attributes('src')).toBe('/media/tour-poster-en.png')
  expect(wrapper.get('.tour-heading').text()).toContain('English narration')
  expect(wrapper.get('.video-resources').text()).toContain('AI narration by OpenAI');expect(wrapper.text()).not.toContain('旁白由 OpenAI 合成')
 })
 it('keeps native controls available when browser playback is denied',async()=>{
  vi.spyOn(HTMLMediaElement.prototype,'load').mockImplementation(()=>{})
  vi.spyOn(HTMLMediaElement.prototype,'play').mockRejectedValue(new Error('blocked'))
  const wrapper=create(ProductTour)
  await wrapper.get('.video-poster').trigger('click');await flushPromises()
  await wrapper.get('video').trigger('loadedmetadata');await flushPromises()
  expect(wrapper.get('[role="status"]').text()).toContain('控制按钮')
  expect(wrapper.get('video').attributes('controls')).toBeDefined()
 })
 it('switches original screenshots with keyboard-usable buttons',async()=>{
  const wrapper=create(ProductGallery)
  const controls=wrapper.findAll('.gallery-controls button')
  await controls[1].trigger('click')
  expect(controls[1].attributes('aria-pressed')).toBe('true')
  expect(wrapper.get('picture img').attributes('src')).toBe('/media/task-wizard.png')
  expect(wrapper.get('picture img').attributes('width')).toBe('1800')
  expect(wrapper.get('picture img').attributes('height')).toBe('912')
 })
 it('opens a labeled native dialog, handles Escape cancel, and restores focus',async()=>{
  HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')}
  HTMLDialogElement.prototype.close=function(){this.removeAttribute('open')}
  const wrapper=create(ScreenshotPreview,{props:{name:'console-overview',alt:'Real workspace',locale:'en'}})
  const button=wrapper.get('button');button.element.focus();await button.trigger('click');await flushPromises()
  const dialog=document.querySelector('dialog')
  expect(dialog.getAttribute('aria-label')).toBe('Real workspace');expect(dialog.hasAttribute('open')).toBe(true)
  expect(dialog.querySelector('img').getAttribute('src')).toBe('/media/console-overview-en.png')
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
