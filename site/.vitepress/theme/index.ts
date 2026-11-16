import DefaultTheme from 'vitepress/theme'
import type { Theme } from 'vitepress'
import { h } from 'vue'
import HomePage from './components/HomePage.vue'
import ConnectorCatalog from './components/ConnectorCatalog.vue'
import Roadmap from './components/Roadmap.vue'
import DemoPlayer from './components/DemoPlayer.vue'
import SourceNotice from './components/SourceNotice.vue'
import './style.css'
export default {
  extends:DefaultTheme,
  Layout:()=>h(DefaultTheme.Layout,null,{'doc-before':()=>h(SourceNotice)}),
  enhanceApp({app}){app.component('HomePage',HomePage);app.component('ConnectorCatalog',ConnectorCatalog);app.component('Roadmap',Roadmap);app.component('DemoPlayer',DemoPlayer)}
} satisfies Theme
