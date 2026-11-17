# 独立英文产品导览

日期：2026-11-17。英文视频独立制作，不再复用中文视频音轨或画面。

## 资源与行为

- 英文 MP4：`website/public/media/rivomesh-tour-en.mp4`。OpenAI `gpt-realtime-2.1` / `marin` 英文配音，107.021333 秒、1280×720 H.264 / AAC、2,300,546 字节。
- 全英文五幅流程图：`tooling/voice/slides.mjs`；已逐幅渲染查看。正式品牌标识、标题、流程与边界提示均为英文，每幅明确标注 workflow illustration，避免冒充真实英文控制台。现有中文控制台截图继续放在页面独立截图区，保留语言说明。
- 英文封面：`website/public/media/tour-poster-en.png`。
- 默认英文字幕：`website/public/media/tour-en.en.vtt`，不包含汉字；可选中文字幕：`tour-en.zh-CN.vtt`，两轨各 18 条，时间一致。
- 英文章节：`website/.vitepress/data/tour-en.json`，起点 00:00 / 00:20 / 00:40 / 01:03 / 01:25，独立于中文 116 秒时间轴。
- 英文脚本唯一维护位置：`website/.vitepress/data/tour-en-script.json`；生成英文文字稿 `website/public/media/transcript.en.txt`、字幕与配音。第三章明确讲解流程示意，不把英文示意画面描述为产品截图。
- 来源与媒体版本：`voice-report-en.json`、`tour-en-media.json`。中文版 MP4 和两份字幕与前一提交逐字节相同。

英文首页和 `/en/tour.html` 自动选用上述独立视频、封面、字幕、下载和章节。播放器在加载时选择页面对应字幕；切换语言会暂停并卸载旧视频，回到新语言封面，避免继续播放另一语言的音轨。英文默认字幕即使先前有中文显示状态也会切为英文，用户仍可随后自行切换字幕。

## 生成与验证

`npm run voice:sample:en`、`npm run video:preview:en`、`npm run video:generate:en` 分别提供英文试听、预览、应用。缓存位于 `.rivomesh-voice.local/marin-en/`，与中文缓存隔离。普通构建不调用 API 或 FFmpeg。

- 五章生成返回文本与英文脚本一致；Whisper 词级转写对齐相似度为 99.6%、100%、100%、100%、100%。第一、第三章另用 `gpt-transcribe` 独立转写，与英文稿规范化后完全一致。
- FFprobe 验证独立英文 MP4、时长及单一音轨。字幕检查确认英文主字幕没有中文字符；两语言各 18 条字幕时间单调、无重叠且不超出视频。
- Safari 原生 UI 实际验证英文封面、01:47 时长、带独立版本号的英文 MP4 和字幕链接；点击第三章后观察到 40 秒播放位置与英文字幕，随后可暂停。
- `npm run check` 覆盖中英文视频哈希、来源、各自的五章节及两组双语字幕，并校验英文脚本、文稿和默认字幕文字。
- `npm test`：25 项通过，新增独立英文媒体选择、英文章节定位、强制默认英文字幕和语言切换停止旧视频回归。
- VitePress 构建及导航、资源、SEO 检查通过。没有主观听感评分或真实手机/全视口重复验收声明。

词级时间戳服务的兼容性迁移期限与凭据保护方式沿用 [配音更新记录](narration-review.md) 和 README。
