# RivoMesh V2.1 品牌与体验验收

日期：2026-11-17。范围仅为官网；沿用 VitePress 1.6.4、Vue、自有主题、静态目录和 GitHub Pages 工作流。未修改核心项目、业务逻辑、连接器支持事实、原始验收文档或既有讲解视频。

## 品牌决策

原标识通过细描边 R、两条输入线和延伸路径表达流转；缩小时交点偏密，字标依赖字体回退。保留 R 和输入/分支的方向关系，比较三个原创矢量方案：

| 方案 | 取舍 |
| --- | --- |
| A / Flow R | 最接近原有描边语言，小尺寸交点仍偏紧 |
| B / Continuity R（采用） | 实形轮廓、单一输入通道、开放字腔与输出分支；16–32px、单色与深浅背景更清楚 |
| C / Mesh R | 折线路由强调 Mesh，但尖角和转折较繁杂 |

字标为原创几何 SVG 路径，没有商业字体或外部字体依赖。选择依据是设计判断与实际尺寸预览，不是商标唯一性认证。

资产根目录：`website/public/brand/`。

| 用途 | 文件 |
| --- | --- |
| 标准透明底、浅色与深色背景 | `logo.svg`、`logo-on-light.svg`、`logo-light.svg` |
| 方形与头像 | `logo-square.svg`、`avatar-512.png` |
| 单色 | `logo-monochrome.svg`、`logo-monochrome-light.svg` |
| 横版字标 | `wordmark.svg`、`wordmark-light.svg`、`wordmark-monochrome.svg` |
| 浏览器与移动图标 | `favicon.svg`、`../favicon.ico`（16/32/48px）、`apple-touch-icon.png`（180px） |
| 中英文分享图 | `social-card.png`、`social-card-en.png`（均为 1200×630）；对应 `social-card-zh.svg`、`social-card-en.svg` |
| 方案与对比 | `concepts/a.svg`、`b.svg`、`c.svg`、`previous.svg`、`identity-review.png` |

中英文品牌页 `/brand.html`、`/en/brand.html` 提供方案、实际尺寸、配色、下载和使用说明。导航、页脚、流程图、截图外框和 SEO 使用相同资产体系。历史产品截图内部的原有品牌保留。

源文件：`tooling/brand/identity.mjs`；生成：`npm run brand:generate`。相同环境下重复生成的 22 个文件哈希完全一致，15 个既有媒体文件与 HEAD 字节相同。品牌生成只依赖 Node.js 和 Sharp；视频生成独立为 `npm run video:generate`，本轮未执行。

## 页面与体验

- Hero 保留核心定位，调整字重、行距、留白、CTA、真实预览比例；平板 900px 以下单栏，窄屏导航单独适配。
- 数据流沿用真实采集、持久日志、规范化与各目标确认语义。SVG 连线轻量响应，减少动画时静态呈现。
- 三个核心能力统一图示、排版与文档入口；技术边界采用原生 details，保留简短范围提示和完整限制。MySQL 采集源、消息至少一次、多节点不自动跨 Agent 接管等部署相关限制仍能直接看到。
- 首页精选 MySQL、PostgreSQL、openGauss/GaussDB、DM、KingbaseES、ClickHouse 六种产品，读取完整目录的同一注册数据。Source/Sink 与状态保留，完整目录继续提供搜索、方向、状态、类型和版本说明。
- 信创模块保留指定版本/模式、实验性适配与并行验证边界；英文使用 migration / compatibility validation 等技术表达。
- 真实截图统一窗口外框，保留图片切换、原生大图对话框、焦点恢复与中文开发预览说明；未伪造英文控制台。
- 首页与导览页使用同一原生 HTML5 video 组件。点击播放或章节才创建 video；controls、playsinline、preload=none；原有中英字幕、章节、下载及文字稿均保留。英文默认英文字幕，中文旁白明确标注。
- 统一色彩、圆角、边框、焦点和动效变量。清理过期首页和视频全局样式，保留文档侧栏的独立滚动、定位与折叠持久化实现。
- 中英文分享图独立配置，canonical/hreflang 和文档语言切换继续沿用同一路由模型。

## 自动检查

| 检查 | 结果 |
| --- | --- |
| `npm run check` | 152 篇文档、1049 个 Markdown 本地链接、固定导航、48 个 SDD 条目和媒体通过；新增 13 个 SVG、PNG 尺寸和 ICO 帧检查通过 |
| `npm test` | 18 项通过；含侧栏 DOM/滚动/折叠持久化、语言路由、目录筛选、六个精选条目、图片对话框、视频按需加载、字幕、39 秒章节定位及播放拒绝回退 |
| `npm run build` | VitePress 静态构建通过；293 个 HTML（含 128 个兼容跳转）、17526 个导航/资源 URL 检查通过；164 页 metadata/canonical/hreflang/lang 与 sitemap 检查通过 |
| `git diff --check` | 通过 |

仓库没有独立 TypeScript 或 Lint 脚本，未虚构执行结果。

## 实际浏览器检查

使用 macOS Safari 26.6.2、原生 UI 自动化和本地生产构建预览。以下是实际查看的视口与重点，非全部页面 × 全部视口 × 两种主题的穷举测试：

| CSS 宽度 | 实际查看 |
| --- | --- |
| 320 | 中文导航/Hero/CTA、深色数据流、精选连接器、英文导览封面与两列章节、完整连接器目录、文档侧栏展开及当前项定位 |
| 375 | 中文浅色 Hero、CTA、真实工作台预览 |
| 390 | 中文深色 Hero、品牌切换与截图外框 |
| 768 | 英文深色 Hero；发现双栏拥挤后调整为单栏并在浅色预览复核；英文视频实际播放、章节定位、字幕、暂停和进入全屏 |
| 1024 | 英文深色导航、双栏 Hero、CTA 和真实截图 |
| 1440 | 英文深色完整导航、首屏与下一模块入口 |
| 1920 | 英文深色内容最大宽度、Hero 与预览比例 |

所查看的区域没有明显水平溢出、按钮重叠或重要文字截断。品牌页另外检查了桌面深浅主题、三方案与 16/24/32/48px 标识；Logo 接触表已渲染检查。英文原生视频从 00:39 章节开始后，观察到播放进度 43 秒、英文字幕及 1:42 总时长，暂停控件变为播放。

限制：Safari 响应式模式进入视频全屏成功，退出全屏后自动化失去窗口连接，重新选择 Safari 可继续检查；因此退出全屏稳定性未完成验收，未将其归因为网站代码。未完成真实 iOS/Android、其他浏览器和全部页面的视觉回归；未运行 Lighthouse，未报告虚构的 CWV 或性能分数。

## 性能与后续

没有新增依赖、字体下载或大型播放器。全局 CSS 源文件由 44206 降至 26810 字节（gzip 9524 → 6509）；标准 Logo 251 字节；路径化字标 961 字节；中文分享 PNG 93379 → 49684 字节。图片沿用 WebP、显式宽高和延迟加载；视频在用户动作前没有 video/source 节点。以上是静态体积/实现核查，不等同真实网络性能指标。

建议后续在真实移动设备和 Chrome/Firefox 复核播放器全屏进出、字幕菜单与网络加载，并采集线上 Lighthouse/CWV。真实英文产品截图可在产品界面具备可复现采集环境时补充。
