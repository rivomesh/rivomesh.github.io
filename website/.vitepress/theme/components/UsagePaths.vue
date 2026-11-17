<script setup>
defineProps({compact:Boolean})
const paths=[
 {step:'01',title:'安装并登录',text:'准备环境并启动控制台。',href:'/docs/zh/start/install.html'},
 {step:'02',title:'创建同步任务',text:'连接测试源与目标，检查后启动。',href:'/docs/zh/start/create-task.html'},
 {step:'03',title:'查看同步进度',text:'查看全量、增量与积压。',href:'/docs/zh/start/monitoring.html'},
 {step:'04',title:'排查与恢复',text:'处理错误，从持久进度继续。',href:'/docs/zh/start/troubleshooting.html'}
]
</script>
<template><div class="usage-paths" :class="{compact}"><a v-for="p in paths" :key="p.step" :href="p.href" class="usage-card"><span class="usage-step">{{p.step}}</span><div><h3>{{p.title}} <span aria-hidden="true">→</span></h3><p>{{p.text}}</p></div></a></div></template>
