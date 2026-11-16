import {defineConfig} from 'vitest/config'
import vue from '@vitejs/plugin-vue'
export default defineConfig({publicDir:'website/public',plugins:[vue({template:{transformAssetUrls:false}})],test:{include:['tests/**/*.spec.js'],environment:'jsdom',environmentOptions:{jsdom:{url:'https://rivomesh.github.io',pretendToBeVisual:true}},restoreMocks:true}})
