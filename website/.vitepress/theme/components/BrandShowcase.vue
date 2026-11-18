<script setup>
import {computed} from 'vue'
import {useData} from 'vitepress'
defineProps({review:Boolean})
const {frontmatter}=useData(),en=computed(()=>frontmatter.value.locale==='en')
const sizes=[16,24,32,48]
const concepts=[
 {id:'a',names:['水獭','River otter'],description:['圆耳、宽吻与向后收尖的尾部勾出游水姿态。以连续曲线呼应数据库复制的稳定推进。','A rounded ear, broad muzzle and tapered tail suggest an otter at the surface. Its continuous curve echoes the steady movement of replication.']},
 {id:'b',names:['翠鸟','Kingfisher'],description:['长喙与俯冲轮廓表达投递方向。锐角形成鲜明的技术气质。','The long bill and diving profile point in the direction of delivery. Sharp angles give the mark a precise character.']},
 {id:'c',names:['燕子','Swallow'],description:['展翼与分叉尾羽形成轻快剪影，呼应向多个目标分发。','Swept wings and a split tail form a light silhouette that echoes fan-out to multiple destinations.']}
]
const toneList=[{name:'Flow Blue',hex:'#2859a6'},{name:'Night Ink',hex:'#172a45'},{name:'Signal Teal',hex:'#247f7c'},{name:'Mist',hex:'#f7f9fc'}]
</script>
<template>
<div v-if="review" class="brand-showcase concept-review">
  <article v-for="concept in concepts" :key="concept.id" class="concept-card">
    <h2>{{concept.names[en?1:0]}}</h2>
    <p>{{concept.description[en?1:0]}}</p>
    <div class="identity-pair">
      <figure class="identity-surface light"><img :src="`/brand/concepts/${concept.id}-wordmark.svg`" alt="RivoMesh" width="304" height="64"><figcaption>{{en?'Light lockup':'浅色横版'}}</figcaption></figure>
      <figure class="identity-surface dark"><img :src="`/brand/concepts/${concept.id}-wordmark-light.svg`" alt="RivoMesh" width="304" height="64"><figcaption>{{en?'Dark lockup':'深色横版'}}</figcaption></figure>
    </div>
    <div class="identity-scale">
      <span>{{en?'Monochrome at actual size':'单色实际尺寸'}}</span>
      <figure v-for="size in sizes" :key="size"><img :src="`/brand/concepts/${concept.id}-mono.svg`" alt="" :width="size" :height="size"><figcaption>{{size}}px</figcaption></figure>
    </div>
    <p class="concept-links"><a :href="`/brand/concepts/${concept.id}.svg`" download>{{en?'Standard SVG':'标准 SVG'}}</a><a :href="`/brand/concepts/${concept.id}-light.svg`" download>{{en?'Dark surface SVG':'深底 SVG'}}</a><a :href="`/brand/concepts/${concept.id}-wordmark-monochrome.svg`" download>{{en?'Monochrome lockup':'单色横版'}}</a></p>
  </article>
</div>
<div v-else class="brand-showcase"><div class="identity-pair"><figure class="identity-surface light"><img src="/brand/wordmark.svg" alt="RivoMesh" width="304" height="64"><figcaption>{{en?'Light surface':'浅色背景'}}</figcaption></figure><figure class="identity-surface dark"><img src="/brand/wordmark-light.svg" alt="RivoMesh" width="304" height="64"><figcaption>{{en?'Dark surface':'深色背景'}}</figcaption></figure></div><div class="identity-scale"><span>{{en?'Actual CSS sizes':'实际显示尺寸'}}</span><figure v-for="size in sizes" :key="size"><img src="/brand/favicon.svg" alt="" :width="size" :height="size"><figcaption>{{size}}px</figcaption></figure><figure class="monochrome-example"><img src="/brand/logo-monochrome.svg" :alt="en?'Monochrome RivoMesh mark':'单色 RivoMesh 标识'" width="44" height="44"><figcaption>{{en?'One color':'单色'}}</figcaption></figure></div><h2>{{en?'Brand colors':'品牌配色'}}</h2><div class="brand-palette"><div v-for="tone in toneList" :key="tone.hex"><i :style="{background:tone.hex}" aria-hidden="true"></i><span>{{tone.name}}<code>{{tone.hex}}</code></span></div></div>
  <h2>{{en?'Clear space and misuse':'留白与错误用法'}}</h2>
  <div class="identity-examples">
    <figure><div class="clear-space"><img src="/brand/logo.svg" alt="" width="64" height="64"></div><figcaption>{{en?'Keep at least ⅛ mark height clear':'四周至少保留图形高度的 ⅛'}}</figcaption></figure>
    <figure><div><img class="stretched" src="/brand/logo.svg" alt="" width="64" height="64"></div><figcaption>{{en?'Stretched':'拉伸'}}</figcaption></figure>
    <figure><div><img class="tilted" src="/brand/logo.svg" alt="" width="64" height="64"></div><figcaption>{{en?'Rotated':'旋转'}}</figcaption></figure>
    <figure><div class="low-contrast"><img src="/brand/logo.svg" alt="" width="64" height="64"></div><figcaption>{{en?'Low contrast':'低对比度'}}</figcaption></figure>
  </div>
</div>
</template>
<style scoped>
.brand-showcase{margin:28px 0}.monochrome-example figcaption{color:#66758a}.brand-showcase figure{margin:0}.identity-pair{display:grid;grid-template-columns:1fr 1fr;gap:16px}.identity-surface{padding:32px 26px;border:1px solid var(--line);border-radius:var(--radius-panel);min-width:0}.identity-surface img{width:100%;max-width:304px;height:auto;display:block;margin:auto}.identity-surface.light{background:#fff;color:#66758a}.identity-surface.dark{background:#111c2d;color:#a3b4cd}.identity-surface figcaption{text-align:center;font-size:11px;margin-top:24px}.identity-scale{display:flex;align-items:center;gap:28px;flex-wrap:wrap;padding:24px;background:var(--surface);border-radius:var(--radius-panel);margin-top:16px}.identity-scale>span{font-size:12px;color:var(--muted)}.identity-scale figure{display:flex;flex-direction:column;align-items:center;gap:10px}.identity-scale img{display:block;max-width:none}.identity-scale figcaption{font-size:10px;color:var(--muted)}.monochrome-example{background:#fff;padding:10px;border-radius:6px}.brand-palette{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}.brand-palette>div{display:flex;gap:11px;align-items:center}.brand-palette i{width:30px;height:38px;border-radius:4px;border:1px solid var(--line);flex:none}.brand-palette span{font-size:11px}.brand-palette code{display:block;background:none!important;padding:0!important;font-size:10px!important;color:var(--muted)!important}@media(max-width:760px){.identity-pair{grid-template-columns:1fr}.brand-palette{grid-template-columns:1fr 1fr}.identity-scale{gap:20px;padding:20px}}
.concept-card+.concept-card{margin-top:36px}.concept-card .identity-scale{background:#f7f9fc;color:#172a45}.concept-card .identity-scale :is(span,figcaption){color:#334965}.concept-links{display:flex;gap:14px 20px;flex-wrap:wrap}.concept-links a{font-size:13px}.identity-examples{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.identity-examples figure{min-width:0;text-align:center}.identity-examples figure>div{display:grid;place-items:center;min-height:106px;background:#f7f9fc;border:1px solid var(--line);border-radius:8px;overflow:hidden}.identity-examples figcaption{color:var(--muted);font-size:11px;margin:8px 0}.identity-examples .clear-space img{outline:1px dashed #7e9abe;outline-offset:8px}.identity-examples .stretched{transform:scaleX(1.37) scaleY(.75)}.identity-examples .tilted{transform:rotate(-24deg)}.identity-examples .low-contrast{background:#3262a8}.brand-showcase .monochrome-example figcaption{color:#4b607c}@media(max-width:560px){.identity-examples{grid-template-columns:repeat(2,minmax(0,1fr))}}</style>
