# Changelog

All notable changes to WebLinuxOS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
- **Global Insights UI 视觉升级** — 加入径向渐变背景、激活 Tab 渐变
  + 底部高亮条、源 Tab 颜色编码、卡片悬停浮起 + 阴影增强、新闻
  缩略图暗化渐变蒙层、模态详情弹窗（淡入 + 滑入动画）。统一 CSS 变量
  接入主题，浅色/深色模式自动适配。
- **README.md** — 更新版本号至 v49，应用总数 242 → 245，并在创新
  应用章节新增 Global Insights 详细介绍。

### Fixed
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
