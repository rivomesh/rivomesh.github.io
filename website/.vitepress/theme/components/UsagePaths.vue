<script setup>
import Icon from './Icon.vue'
defineProps({compact:Boolean})
const paths=[
 {icon:'console',tone:'blue',step:'01',title:'安装并登录',text:'准备环境，启动控制台，获得自己的访问地址。',href:'/docs/zh/start/install.html'},
 {icon:'branch',tone:'teal',step:'02',title:'创建同步任务',text:'按向导连接 MySQL 和目标系统，检查后启动。',href:'/docs/zh/start/create-task.html'},
 {icon:'grid',tone:'purple',step:'03',title:'查看同步进度',text:'看懂全量、增量与积压，处理日常启停操作。',href:'/docs/zh/start/monitoring.html'},
 {icon:'recover',tone:'orange',step:'04',title:'排查与恢复',text:'找到错误原因，保留进度，恢复数据同步。',href:'/docs/zh/start/troubleshooting.html'}
]
</script>
<template><div class="usage-paths" :class="{compact}"><a v-for="p in paths" :key="p.step" :href="p.href" class="usage-card" :data-tone="p.tone"><div class="usage-card-top"><span class="usage-icon"><Icon :name="p.icon"/></span><span class="usage-step">{{p.step}}</span></div><h3>{{p.title}}</h3><p>{{p.text}}</p><span class="usage-arrow">查看操作指南 <Icon name="arrow"/></span></a></div></template>
