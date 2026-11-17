# RivoMesh 官网与文档站

官网：**https://rivomesh.github.io/**

核心项目：[rivomesh/rivomesh](https://github.com/rivomesh/rivomesh)。官网仓库：[rivomesh/rivomesh.github.io](https://github.com/rivomesh/rivomesh.github.io)。

本站根据同级 RivoMesh 核心源码重新生成，采用全新页面、主题、文档路由、固定导航和品牌素材。VitePress 负责 Markdown 编译、客户端路由与静态输出；布局、侧栏、搜索、连接器目录和 SDD 展示使用本仓库自有组件。

验证记录与页面截图见 [quality/verification.md](quality/verification.md)。

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
- 首页与信创指南优先介绍国产数据库目标，明确当前 MySQL 源及 PostgreSQL / Oracle 等源端扩展计划。
- 多节点指南分别说明节点观察、共享访问与同步主备恢复；跨节点任务控制按实际接入状态展示。
- 架构、SDD 与验收资料放在独立项目入口，搜索默认聚焦使用文档；详细配置默认折叠。
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
| `website/docs/*/reference/`、`sdd/`、`evidence/` | 从核心源码导入的手册、规格与验收快照 |
| `website/.vitepress/data/` | 导航、文档、连接器与 SDD 注册数据 |
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

导入器读取核心项目的 Markdown、SDD `requirements.json` 与 `AdapterCatalog.java`，为全部手册建立唯一文档路由和两棵语言导航树。它只重建生成目录，保留 `start/` 原创文档；旧地址规范化到 `rivomesh` 组织，源码外链统一指向核心仓库。

SDD 状态取自实际清单，DONE、PARTIAL、NEW 分开计算。不要把新增操作手册自动当作全部需求已经完成。快照清单的原始哈希对应源文件，站内链接与纯文本占位符会在导入时转换。`tooling/document-copy.mjs` 维护网站用语及已被新手册取代的旧状态说明，不修改命令、配置字段或证据原文；配置格式编号只在必要的技术说明中保留。嵌套验收目录生成独立路由，导入前拒绝重复路由，避免覆盖正式验收记录。

## 品牌与视频

品牌图标、横版字标、SVG/ICO favicon、Apple Touch 图标与分享图均由新的素材工具生成。产品导览包含中文合成语音、字幕、完整文字稿和章节跳转。

```bash
npm run media:generate
```

媒体重建需要 macOS `say` 的 Tingting 语音与 FFmpeg。原始截图输入为 `/tmp/rivomesh-{console,wizard,catalog}-window.png`；工具会裁去浏览器栏后生成产品素材。截图来自本地开发预览，仅展示部分界面，不能作为实时运行或生产性能证明。网页构建不需要上述媒体生成环境。

## GitHub Pages 发布

`.github/workflows/deploy.yml` 在 `main` 推送后执行依赖安装、内容检查、导航测试、静态构建和 Pages 发布。仓库 Pages 发布源应为 **GitHub Actions**。

部署目标是组织根站点 `https://rivomesh.github.io/`。`base` 固定为 `/`；没有 CNAME 或个人域名继承配置。媒体、favicon、站内搜索和文档链接均使用根路径。

参照的信息结构：[ShardingSphere](https://shardingsphere.apache.org/index_zh.html) 与 [SeaTunnel](https://seatunnel.apache.org/zh-CN/)。具体产品定位、能力与计划来自 RivoMesh 源码，网站使用自有品牌。
