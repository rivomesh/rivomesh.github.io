# RivoMesh 官网与文档站

RivoMesh 发布前官网，源码仓库目标为 <https://github.com/rivomesh/rivomesh.github.io>。

首页以“RivoMesh · 数据库实时同步平台”说明产品定位，按核心功能、同步架构、应用场景、文档与获取、社区和路线图组织内容。核心源码与反馈入口为 <https://github.com/rivomesh/rivomesh>，官网与文档站的维护入口为本仓库。

基于 VitePress 1.6，包含原创首页、连接器目录、SDD 交互路线图、中英文文档、站内本地检索、真实控制台截图、Logo / favicon，以及 100 秒中文配音产品视频。结构参考 [ShardingSphere](https://shardingsphere.apache.org/index_zh.html) 与 [SeaTunnel](https://seatunnel.apache.org/zh-CN/)，文案依据本地 RivoMesh 源码与 SDD，未使用第三方品牌图形或虚构用户数据。

[初版首页截图（历史记录）](preview/homepage-desktop.png) · [网站验证记录](preview/verification.md)

## 本地运行

需要 Node.js 22 或以上。

```bash
npm ci
npm run dev
```

打开终端显示的地址，默认是 <http://127.0.0.1:5173/>。

```bash
npm run check
npm run build
npm run check:build
npm run preview
```

`check` 检查站内文档链接、SDD ID/依赖和关键素材，构建另外执行 VitePress 的死链检查。构建产物在 `site/.vitepress/dist`。正式网站为纯静态输出，不需要 Java 服务或外部检索服务。

## GitHub Pages

已提供 `.github/workflows/deploy.yml`，推送 `main` 后构建并通过 GitHub Actions 发布。网站 CI 使用已提交的文档与媒体快照，发布不依赖同级 Java 源码目录。

1. 将本目录提交到 `rivomesh/rivomesh.github.io` 的 `main`。
2. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 查看 `Deploy documentation to GitHub Pages` 工作流。

仓库已迁入 `rivomesh` 组织，作为组织站点发布到：

**https://rivomesh.github.io/**

默认 `base` 为 `/`，本地预览、站内链接、favicon、视频和构建链接检查均使用根路径。Pages 的发布源必须选择 **GitHub Actions**，不能直接用 Jekyll 发布 `main` 源码分支。

如果将来改用其他域名或项目子路径，分别通过 `SITE_ORIGIN=https://example.com` 和 `SITE_BASE=/docs/` 调整构建；构建和 `check:build` 应使用相同 `SITE_BASE`。

## 内容维护

- `site/index.md` 与 `.vitepress/theme/components/HomePage.vue`：首页。
- `site/guide/`：面向初次使用者的原创中文说明、快速开始、兼容性和 FAQ。
- `site/reference/`：从核心项目同步的文档快照，包括双语手册、SDD 与验证记录。
- `site/.vitepress/data/source-manifest.json`：源文档 SHA-256 及快照日期。
- `site/.vitepress/data/requirements.json`：原始 SDD 基线，路线图直接从此生成。
- `site/public/reference-files/`：手册引用的配置、源文件和部分验证附件；代码类附件用 `.txt` 防止误作页面执行。
- `site/ecosystem/`、`community/`、`download.md`、`tour.md`：连接器、贡献、获取和产品导览。

更新核心源码文档：

```bash
npm run docs:sync -- ../rivomesh
npm run check
npm run build
```

同步只发生在手动调用时。网站 CI 使用已提交的快照，不依赖同级源码目录或尚未公开的核心仓库。同步后需核对原创页面、连接器摘要与新源码是否一致；SDD 基线和新交付可能有不同日期，不能仅靠新增文档自动关闭需求。不要直接修改生成的 `site/reference/` 后再同步，应先改核心项目文档。发布前请审阅附件内容。

## 品牌与媒体

- `site/public/brand/`：原创 SVG 图标、字标、深色版本、分享图与 Apple Touch 图标。
- `site/public/favicon.ico`：包含 PNG 数据的 32px ICO。
- `site/public/media/`：真实开发预览截图、H.264/AAC MP4、WebVTT 字幕与完整文字稿。
- `scripts/generate-media.mjs`：可重建视频和派生素材；依赖 macOS `say`（Tingting）及 FFmpeg，日常构建不需要这些工具。

截图采自本地 `127.0.0.1:18088` 开发预览，已裁去浏览器标签栏与地址栏。截图不会伪装成实时监控；没有修改或启动同步任务。生成脚本读取 `/tmp/rivomesh-{console,wizard,catalog}-window.png`，已有截图时也能重新生成视频。更新真实截图后应检查画面中的任务、地址和凭据，避免发布敏感信息。

## 发布前核对

正式 Release 包、校验和、公共镜像与核心仓库公开入口准备完成后，再更新获取页面。许可证、NOTICE、SBOM 与贡献治理按 SDD 的实际交付补齐，不将规划写成现有认证或正式发布。本站没有添加行为分析脚本或远程字体。
