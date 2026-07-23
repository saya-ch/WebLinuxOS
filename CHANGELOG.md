# Changelog

All notable changes to WebLinuxOS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **BookFinder 书海检索 (v50)** — 基于 Open Library 公开 API 的真实图书发现
  应用，无需 API Key、CORS 友好：
  - 按书名/作者/主题检索数百万册图书，展示前 24 条结果。
  - 卡片网格：封面缩略图（`covers.openlibrary.org`）、标题、作者、首版年份、
    评分（5 星制）、收藏标记。
  - 详情抽屉：拉取 `https://openlibrary.org{key}.json` 展示简介、主题标签、
    ISBN、页数、评分，提供 Open Library 原文链接。
  - 主题快捷筛选（fiction/science/history 等 10 个）+ 最近搜索记录
    （localStorage，最多 8 条）。
  - 收藏夹：本地保存最多 80 本，按收藏时间倒序，支持一键移除。
  - 编辑/杂志风格 UI：Fraunces 衬线显示字体 + Sora 正文 + 纸张色调，
    卡片错峰入场动画、骨架屏、空状态、网络错误优雅提示。
  - 独立 chunk 分包（`app-bookfinder`），按需懒加载。
- **Global Insights 全球洞察 (v49)** — 一站式全球信息聚合应用，集成
  8 个真实公开 API，无需任何后端即可使用：
  - **世界新闻**：NewsAPI 公共代理 (`saurav.tech/NewsAPI`)，展示 20 条
    头条新闻（含图片、来源、时间相对值），支持标题/来源/描述全文搜索。
  - **国家百科**：REST Countries 真实数据，覆盖 250+ 国家/地区，按人口
    排序，60 条卡片。点击打开详情弹窗，展示国名/官方名/首都/人口/面积/
    坐标/语言/货币/时区/邻国。
  - **每日箴言**：Quotable 随机名言语录，可一键复制，支持标签筛选。
  - **趣味冷知识**：Official Joke API 编程/常识笑话。
  - **虚拟用户**：RandomUser.me 随机生成测试用户数据，含头像/邮箱/电话。
  - **今日太空**：NASA APOD 每日天文图与科学解释。
  - **汇率换算**：Open Exchange Rates 主流货币实时汇率。
  - **GitHub 趋势**：GitterApp 热门仓库列表。
  - 智能 10 分钟本地缓存（localStorage），减少重复请求；实时同步指示器
    动画；优雅的错误处理与重试；统一渐变卡片 + 活动指示器 + 微动画。

### Changed
- **版本号统一至 v50** — `package.json` 升至 50.0.0；`index.html` 启动提示
  与日志（原 v44）、`public/sw.js` 缓存名（原 v41）同步至 v50，避免用户
  认知错乱与潜在旧缓存问题。
- **启动日志应用数量文案** — `index.html` 启动日志由 "200+" 统一为 "350+"，
  与 meta description 对齐。
- **README.md** — 更新版本号至 v50，应用总数 245 → 350+，并在创新应用
  章节新增 BookFinder 详细介绍。

### Fixed
- **`apps.tsx` 重复应用 id 注册** — 移除 4 处重复条目：
  `workspace-manager`（行 1247，与 APP_REGISTRY_EXTRAS 冲突）、
  `smart-dashboard`（行 1289）、`knowledge-vine`（行 1553）、
  `api-health`（行 1562，与 `api-health-monitor` 指向同一组件）。
  此前重复 id 导致启动器出现重复图标且 `apps.find()` 总返回首项，
  使 EXTRAS 中带 `isNew`/`description` 的更好元数据被遮蔽。同时清理
  因删除而未使用的 `WorkspaceManagerIcon` 组件定义（`noUnusedLocals`）。
- **`vite.config.ts` manualChunks 规则失效** — `src/apps/Browser` 规则
  无法匹配实际文件 `src/apps/WebBrowser.tsx`（前者非后者子串），导致
  WebBrowser 无法独立分块。补充 `src/apps/WebBrowser` 匹配，并为新增
  BookFinder 添加 `app-bookfinder` 分包规则。
- **`apps.tsx` 中 `GlobeIcon` 引用未定义错误** — 添加了本地 `GlobeInsightsIcon`
  SVG 组件（与已有 `WorkflowIcon` 风格保持一致），保证 `GlobalInsights`
  应用图标正确渲染。
- **`GlobalInsights.tsx` 未使用导入清理** — 移除了 `Wifi / Bitcoin / Cloud /
  Languages / CheckCircle2 / Zap / BookOpen / Calendar / Sun / Activity`
  共 10 个未使用的 lucide-react 导入；`countryDetail` 状态已实现
  为完整模态详情弹窗，消除了"声明但未使用"警告。

### Changed
- **版本号统一为 v44.0.1** — 修复了 `index.html` 启动提示仍显示 v43、
  `Terminal.tsx` 启动信息显示 v2.3 的版本不一致问题。`package.json`
  同步更新，所有用户可见的位置现在都展示 v44.0.1。
- **README.md 重写** — 从 27 KB 精简到 5 KB，删除冗余的 emoji 装饰与
  重复的应用介绍；按高 star 项目的标准重写为：定位 / 核心特性 / 快速开始
  / 技术栈 / 项目结构 / 贡献指南 / 路线图。结构更清晰、信息密度更高。
- **默认桌面图标调整** — 合并了重复定位的"生产力中心"与"知识探索"两个
  低辨识度图标，腾出位置给真正实用的 QuickCapture。18 个图标更聚焦
  用户日常会用到的核心工具。

### Fixed
- **`index.html` 启动提示** — 之前一直显示 v43 · 启动中 · 请稍候，
  现已更新为 v44 · 启动中 · 请稍候。
- **Terminal 启动横幅** — 启动时的"Web Linux 终端 v2.3"信息更新为 v44，
  与全局版本保持一致。
- **构建产物中 QuickCapture 模块** — 新增 Layers 图标导出，补齐
  `WindowManager.tsx` 的懒加载映射，应用现在可以正常打开。

## [Earlier releases]

Earlier changes are summarised in the git history. See
`git log --oneline` for the full timeline.
