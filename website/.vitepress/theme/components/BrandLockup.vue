<script setup>
import {useData} from 'vitepress'
const {isDark}=useData()
</script>
<template><img class="brand-lockup" :src="isDark?'/brand/wordmark-light.svg':'/brand/wordmark.svg'" width="304" height="64" alt="RivoMesh" decoding="async"></template>
<style scoped>.brand-lockup{display:block;width:171px!important;height:36px!important;max-width:none;flex:none}@media(max-width:520px){.brand-lockup{width:143px!important;height:30px!important}}@media(max-width:350px){.brand-lockup{width:128px!important;height:27px!important}}</style>
