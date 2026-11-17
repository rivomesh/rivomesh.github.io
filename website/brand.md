---
kind: page
locale: zh
title: 品牌与媒体素材
description: RivoMesh Continuity R 品牌系统、三种原创 SVG 方案、深浅与单色标识、小尺寸图标及可下载生产素材。
---

# RivoMesh 品牌与媒体素材

<p class="landing-lead">以清晰的输入、连续的路径和独立分支，表达数据连接、复制与恢复。</p>

<BrandShowcase />

## 为什么选择 Continuity R

最终方案 B 保留原有 R 字母与输入连接的连续性，把两条细线收敛为一个通道，以实形轮廓、开放字腔和斜向分支建立识别。它在单色、浅色和深色背景下使用相同结构，不依赖渐变或微小节点。

三个方案的选择依据是几何简洁性、小尺寸辨识和现有品牌连续性，并非商标唯一性或法律认证。横版字标采用原创几何路径，完整 SVG 不依赖字体回退，不包含字体文件或第三方品牌图形。

## 正式素材下载

| 用途 | 素材 |
| --- | --- |
| 标准方形 / 头像 | [方形 SVG](/brand/logo-square.svg) · [512px PNG](/brand/avatar-512.png) |
| 透明底标识 | [标准 SVG](/brand/logo.svg) · [浅色背景](/brand/logo-on-light.svg) · [深色背景](/brand/logo-light.svg) |
| 单色 | [深色墨稿](/brand/logo-monochrome.svg) · [白色反稿](/brand/logo-monochrome-light.svg) |
| 横版 Logo + Wordmark | [浅色背景](/brand/wordmark.svg) · [深色背景](/brand/wordmark-light.svg) · [单色](/brand/wordmark-monochrome.svg) |
| 浏览器图标 | [SVG favicon](/brand/favicon.svg) · <a href="/favicon.ico" download>ICO（16 / 32 / 48px）</a> |
| 移动与应用图标 | [Apple Touch Icon 180px](/brand/apple-touch-icon.png) · [头像 / 应用图标 512px](/brand/avatar-512.png) |
| 社交分享 | [中文版 PNG](/brand/social-card.png) · [英文版 PNG](/brand/social-card-en.png) · [中文 SVG](/brand/social-card-zh.svg) · [英文 SVG](/brand/social-card-en.svg) |
| 方案与检查 | [方案 A](/brand/concepts/a.svg) · [方案 B](/brand/concepts/b.svg) · [方案 C](/brand/concepts/c.svg) · [静态检查图](/brand/identity-review.png) |

## 使用规范

- 标识四周至少保留标识高度八分之一的留白；不拉伸、不旋转，不把字腔填满。
- 小于 24px 优先使用 favicon；标准标识建议 24px 起，横版组合建议不小于 128px 宽。
- 背景明亮时用品牌蓝或单色墨稿；深色背景使用浅蓝或白色反稿，保证轮廓对比。
- 品牌蓝 `#2859a6` 是主色，信号青 `#247f7c` 用于少量状态强调。功能状态仍保留文字，不只依赖颜色。

## 生成方式与产品素材

`npm run brand:generate` 独立生成全部品牌素材，仅依赖 Node 与 sharp，不调用 FFmpeg、macOS say 或视频脚本。普通网站构建直接使用已提交素材。

[产品导览](/tour.html)提供独立制作的中文与英文讲解视频，各自配有对应语言的旁白、字幕和文字稿。英文视频使用英文流程示意；现有真实产品截图保留原始界面语言，不以改图方式伪造英文控制台。
