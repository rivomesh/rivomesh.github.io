<script setup>
defineProps({name:String})
const paths={database:'M4 5c0-4 16-4 16 0v14c0 4-16 4-16 0V5Zm0 0c0 4 16 4 16 0M4 12c0 4 16 4 16 0',stream:'M3 6h12m-4-4 4 4-4 4M3 18h18m-4-4 4 4-4 4',branch:'M6 3v18m0-12h8a4 4 0 0 0 4-4V3M6 15h8a4 4 0 0 1 4 4v2',recover:'M4 9a8 8 0 1 1 0 8M4 3v6h6m2-2v6l4 2',console:'M3 4h18v16H3V4Zm0 5h18M6 6.5h.1m3 0h.1M7 12l3 2-3 2m6 0h4',shield:'M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6L12 2Zm-5 10 3 3 7-7',check:'m4 12 5 5L20 6',message:'M3 4h18v13H9l-6 4V4Zm4 4h10M7 12h6',grid:'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7',arrow:'M4 12h16m-6-6 6 6-6 6'}
</script>
<template><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name]||paths.grid"/></svg></template>
