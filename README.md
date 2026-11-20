# RivoMesh 官网与文档站

官网：**https://rivomesh.github.io/**

核心项目：[rivomesh/rivomesh](https://github.com/rivomesh/rivomesh)。官网仓库：[rivomesh/rivomesh.github.io](https://github.com/rivomesh/rivomesh.github.io)。

本站根据同级 RivoMesh 核心源码重新生成，采用全新页面、主题、文档路由、固定导航和品牌素材。VitePress 负责 Markdown 编译、客户端路由与静态输出；布局、侧栏、搜索、连接器目录和产品导览使用本仓库自有组件。

本轮产品对照、品牌设计与浏览器验收见 [V3.0 交付记录](quality/v3-brand-product-sync.md)。[此前的验证记录](quality/verification.md)继续保留。

## 本地运行

需要 Node.js 22 或以上。

```bash
npm ci
npm run dev
```

访问终端显示的本地地址，通常为 <http://127.0.0.1:5173/>。

```bash
npm run check
npm test
npm run build
npm run preview
```

构建输出为 `website/.vitepress/dist`。构建会检查站内链接、每篇文档的侧栏顺序与唯一当前页，并生成旧版 URL 的兼容跳转。日常运行和 CI 无需读取同级 Java 项目。

## 面向用户的内容与统一导航

- 中文主目录按安装、创建任务、查看状态、多节点部署、故障处理、数据核对、备份和权限组织。
- 首页与信创指南介绍国产数据库目标，标明 MySQL、实验性 PostgreSQL 与实验性 Oracle 的采集范围。
- 多节点指南说明节点观察、共享访问、跨节点持久命令、新任务自动分配与限定条件下的 Agent 移交。
- 使用指南提供双语架构图和采集原理，项目资料收录技术设计与验收记录，详细配置默认折叠。
- 所有文档使用 `/docs/zh/…` 或 `/docs/en/…` 路径。
- 每种语言只有一棵导航树，由源码导入清单生成，不按文章路径切换不同侧栏。
- `Layout.vue` 在文档路由之间保留同一个 `DocSidebar` 实例。
- 侧栏拥有独立滚动区；正文导航不调用侧栏滚动，也不根据文章重新展开分组。
- 折叠状态保存到本地存储，滚动位置保存到会话存储；刷新时恢复。
- 首次进入或点击“定位当前文档”时定位当前条目。
- 正文目录、分页、面包屑与语言切换由同一文档注册表派生。

`tests/navigation.spec.js` 会遍历全部中文文档和返回路径，检查面板 DOM 身份、滚动位置、分组顺序、折叠持久化及当前页；另验证本地搜索。静态发布检查对中英文每篇文档再次核对完整菜单。

## 目录结构

| 路径 | 用途 |
| --- | --- |
| `website/.vitepress/theme/` | 全新自有布局、侧栏、搜索、首页与组件 |
| `website/docs/zh/start/`、`website/docs/en/start/` | 面向使用者的原创入门说明 |
| `website/docs/*/reference/`、`evidence/` | 从核心源码导入的手册、规格与验收快照 |
| `website/.vitepress/data/` | 导航、文档和连接器注册数据 |
| `website/public/source-snapshot.json` | 文档原始 SHA-256、目录状态与捕获时间 |
| `website/public/search-index.json` | 按需加载的静态全文索引 |
| `website/public/files/` | 手册引用的配置和结构化附件 |
| `website/public/brand/`、`media/` | 新 Logo、favicon、分享图、截图与讲解视频 |
| `tooling/` | 源码导入、媒体生成、发布跳转与检查工具 |
| `tests/` | 导航与搜索回归验证 |

## 更新源码文档

```bash
npm run docs:sync -- ../rivomesh
npm run check
npm test
npm run build
```

导入器从同一 Git 提交读取核心项目的中英文公开手册、验收资料和 `AdapterCatalog.java`。默认使用源仓库的 `HEAD`，也可在源仓库路径后传入 Git 提交。导入保留 `start/` 原创文档。旧规格、计划和任务清单页面跳转到对应语言的实施状态。

快照清单保存原始文件的 SHA-256。导入时转换站内文档链接，并将源码外链固定到对应提交。`tooling/document-copy.mjs` 维护站点用语与手册中的过时状态。生成前检查路由唯一性。

中英文交互架构图的 Archify 源在 `tooling/architecture/`，生成的 HTML 放在 `website/public/architecture/`。两种语言的架构页都嵌入简版预览，并可打开完整交互图。

## 品牌与视频

品牌几何源文件为 `tooling/brand/identity.mjs`，水獭、翠鸟与燕子三套原创 SVG 及正式选型见中英文品牌与设计评审页。正式图标、轮廓化字标、SVG/ICO favicon、Apple Touch 图标与两种语言的 1200×630 分享图可独立重建：

```bash
npm run brand:generate
```

此命令通过 Node.js 与 Sharp 生成资产。渲染中文分享卡需系统有可用简体中文字形，例如 Noto Sans CJK SC。截图、字幕、旁白和视频有独立的生成命令。生成结果直接提交到仓库；`npm run check` 检查品牌文件格式与尺寸。

产品旁白使用 OpenAI Realtime API，默认 `gpt-realtime-2.1` / `marin`。离线工具读取项目根目录已忽略的 `.env.local` 中的 `OPENAI_API_KEY`，或同名环境变量；不要提交密钥。可选 `RIVOMESH_VOICE`、`RIVOMESH_VOICE_MODEL` 调整音色和模型，`HTTPS_PROXY` / `https_proxy` 支持本机代理。

```bash
npm run voice:plan       # 仅查看讲稿与生成计划，不调用 API
npm run voice:sample     # 生成第一章试听
npm run video:preview    # 生成全部旁白与视频预览，不替换站点文件
npm run video:generate   # 生成并应用中文视频、字幕、章节与来源记录
npm run video:preview:en # 独立英文配音与画面预览
npm run video:generate:en # 生成并应用独立英文视频
```

中英文视频各有独立的 MP4、封面、字幕、章节时间、缓存版本和来源记录，英文讲稿以 `website/.vitepress/data/tour-en-script.json` 为准。英文视频使用全英文流程示意，不嵌入中文控制台截图；中英文页面的截图区域分别使用真实中文与英文产品截图。默认字幕与页面语言一致，语言切换会停止旧视频并重置到对应封面。

语音缓存、原视频备份和预览保存在 `.rivomesh-voice.local/`（Git 忽略），相同讲稿、音色、模型和指令会复用音频。显式 `--force` 才重生成相同片段。片段失败不会自动产生重复的付费请求。工具从已有视频提取原始静态画面，保持讲稿与展示内容，按新语音长度安排章节，不加速压缩旁白；随后统一音量并输出 H.264/AAC MP4。

字幕对齐使用 OpenAI 的词级时间戳，保留原有中英文文字；目前该专门能力使用 `whisper-1`，该模型已公告将于 2027-02-26 关闭，需要在此之前更新离线对齐工具。语音生成使用当前 Realtime 流程，不依赖已弃用的 Speech API。每次应用前验证朗读文本、字幕顺序、时长与单一音轨；重制后仍应人工试听技术名称和查看字幕。

视频重制需要 FFmpeg / FFprobe 和可用的 OpenAI API 账户，无需 macOS `say`。历史系统语音脚本保留为 `tooling/make-media.mjs`，默认流程不调用它。`npm run media:optimize` 独立生成中英文截图 WebP，`node tooling/optimize-media.mjs --locale=en` 仅更新英文派生图片。`npm run media:generate` 是品牌、视频和截图的完整重建入口；普通网站构建与 CI 不调用媒体生成命令，不需要 API 凭据或 FFmpeg。

产品导览使用原生 HTML5 video；点击播放或章节后才挂载视频，提供中英文字幕、下载、文字稿和章节跳转。截图与视频保留开发预览性质，不能作为实时运行或生产性能证明。

## GitHub Pages 发布

`.github/workflows/deploy.yml` 在 `main` 推送后执行依赖安装、内容检查、导航测试、静态构建和 Pages 发布。仓库 Pages 发布源应为 **GitHub Actions**。

部署目标是组织根站点 `https://rivomesh.github.io/`。`base` 固定为 `/`；没有 CNAME 或个人域名继承配置。媒体、favicon、站内搜索和文档链接均使用根路径。

参照的信息结构：[ShardingSphere](https://shardingsphere.apache.org/index_zh.html) 与 [SeaTunnel](https://seatunnel.apache.org/zh-CN/)。具体产品定位、能力与计划来自 RivoMesh 源码，网站使用自有品牌。

## 2026-11 产品展示与国际化

沿用 VitePress、自有 Vue 主题、固定侧栏、静态搜索和 GitHub Pages 部署。中文首页位于 `/`，英文首页位于 `/en/`；下载、社区、项目资料、产品导览和品牌页面保留中文旧地址，并在 `/en/` 提供英文对应页。

- `theme/data/home-copy.mjs`：分别维护中文产品价值与英文 replication / CDC 文案。
- `theme/data/connectors.mjs`：共用源码导入的连接能力登记，按产品合并展示，源端和目标端状态单独保留。
- `site-routes.mjs`：统一非文档语言对应关系；导航、语言切换、canonical 和 hreflang 共用。没有翻译的原始验收档案不生成虚假的语言对应页。
- `ScreenshotPreview`、`ProductGallery`：按页面语言使用真实产品截图，支持原图弹窗、Escape 关闭与焦点恢复。校验报告与节点目录截图分别出现在操作手册中。
- `QuickStart`：源码 Java 与 Docker Compose 命令切换及复制；命令来自核心源码部署文件，不承诺公共镜像。
- `npm run media:optimize`：从原始 PNG 生成 900 / 1800 宽 WebP，不裁剪、不伪造产品内容。原图保留供下载/放大。
- `npm run build`：除原链接与导航检查外，校验主要双语页面及全部文档的唯一 SEO 标签、canonical、hreflang、HTML lang 和双语 sitemap。

本轮保留源码项目的实际许可证和发布状态：未提供独立 LICENSE、未提供正式 Release 时，不在网站补造协议或发行包。中英文视频分别制作，具有各自的旁白、画面、字幕与文字稿；更新视频时需要同步审阅对应字幕。工程与视觉验收范围见 [设计验收记录](quality/design-review-2026-11-17.md)。
