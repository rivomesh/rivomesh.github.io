import type {Theme} from 'vitepress'
import Layout from './Layout.vue'
import Home from './components/Home.vue'
import ConnectorCatalog from './components/ConnectorCatalog.vue'
import Roadmap from './components/Roadmap.vue'
import ProductTour from './components/ProductTour.vue'
import UsagePaths from './components/UsagePaths.vue'
import './style.css'
export default {Layout,enhanceApp({app}){app.component('UsagePaths',UsagePaths);app.component('ProjectHome',Home);app.component('ConnectorCatalog',ConnectorCatalog);app.component('Roadmap',Roadmap);app.component('ProductTour',ProductTour)}} satisfies Theme
