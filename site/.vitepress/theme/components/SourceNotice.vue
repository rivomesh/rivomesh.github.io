<script setup>
import { useData, withBase } from 'vitepress'
const {frontmatter} = useData()
</script>
<template><aside v-if="frontmatter.sourcePath" class="source-notice">源码文档快照 · 0.1.0-SNAPSHOT · <a :href="withBase('/guide/compatibility.html')">能力与版本边界</a>。早期章节中的后续计划以最新 SDD 和实施状态为准。</aside></template>
