# Changelog

All notable changes to WebLinuxOS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [118.0.0] - 2026-08-20

### Added — v118 创新应用：LexiconForge 词语锻造坊

- **LexiconForge** — 基于 Datamuse 公开语料 API（无需密钥、支持 CORS、受限网络回退到 corsproxy.io）的多面写作助手。(`apps/LexiconForge.tsx`)
  - 七种模式合一：完全押韵 `rel_rhy`、近似押韵 `rel_nry`、同义词 `rel_syn`、反义词 `rel_ant`、联想词 `rel_trg`、同音词 `rel_hmg`、拼写模式匹配 `sp=`（支持 `*` 和 `?` 通配符，填字游戏/Scrabble 利器）
  - 每个结果展示：词、音节数、词频 score、可展开的 Datamuse `md=fdp` 内联定义（无需第二次 API 调用）
  - 音节过滤芯片、词频排序、一键复制、200 词收藏词库、50 条搜索历史
  - 24 小时内存 + localStorage 双层缓存，重复查询即时返回，远低于 Datamuse 软速率限制
  - 编辑式"墨与羊皮纸"美学：单词用衬线展示字、元数据用等宽、暗色为深靛蓝配暖琥珀、亮色为奶油配墨棕；通过 `resolvedTheme` 正确处理 `auto` 主题
- 在 `APP_REGISTRY_EXTRAS` 与 `WindowManager` component map 中注册 `LexiconForge` 为懒加载 chunk。
- 版本号统一升级至 `118.0.0`（`package.json` 与 README badge）。

## [63.0.0] - 2026-08-14

### Added — v63 安全与创新套件

- **SecureVault 密码保险库** — 本地加密密码管理器，使用 Web Crypto API AES-GCM 加密，主密码解锁，支持密码 CRUD、自动生成强密码、强度指示器、分类管理、标签搜索、导入导出。(`apps/SecureVault.tsx`)
- **CryptoPrice 实时行情追踪** — 基于 CoinGecko 公开 API 的加密货币行情追踪，100+ 币种、7 日价格走势图、市值排名、收藏列表、24h 涨跌幅、成交量数据。(`apps/CryptoPriceTracker.tsx`)
- **SystemHealth 健康检查** — 浏览器系统健康检查仪表盘，实时监控 JS 堆内存、CPU 核心数、FPS 帧率、网络状态、存储分析、浏览器信息，提供优化建议。(`apps/SystemHealthCheck.tsx`)
- **JSON Workbench 工作台** — 高级 JSON 处理工作台：格式化/压缩/校验、JSONPath 查询、Diff 对比、Schema 生成、TypeScript 类型生成、树形可视化。(`apps/JsonWorkbench.tsx`)
- **TimeTravel 时间旅行** — 时间戳转换与日期计算工具：Unix 时间戳互转、时区转换、日期差值计算、节假日倒数、自定义格式化、批量转换。(`apps/TimeTravel.tsx`)
- **ColorLab 色彩实验室** — 色彩工具箱：颜色选择器、HEX/RGB/HSL 互转、调色板生成、渐变编辑器、对比度检查、色盲模拟。(`apps/ColorLab.tsx`)

### Added — 终端 API 集成命令

- 新增 `advancedApiCommands.ts`：npm 包搜索、货币汇率、天气查询（CLI版）、IP 地址查询、文本翻译、ASCII 艺术字生成命令。
- 新增 `vitalApiCommands.ts`：Hacker News 新闻、随机名言、笑话、冷知识、GitHub 搜索、趋势榜等终端命令。
- 终端命令总数突破 100+，集成多个合规公开 API。

### Fixed — 编译错误修复

- 修复 SystemHealthCheck.tsx JSX 结构错误（缺少包裹 div 导致编译失败）。
- 修复 CryptoPriceTracker.tsx 接口类型定义（添加 `sparkline_in_7d` 属性、移除未使用导入）。
- 修复 JsonWorkbench.tsx 类型错误（Schema properties 类型推断、移除未使用变量）。
- 修复 ColorLab.tsx 未使用参数警告。
- 修复 vitalApiCommands.ts 变量引用错误（`id` → `story.id`）。
- 修复 WindowManager.tsx 重复属性名（`SystemHealthCheck` 重复注册）。

### Changed — 版本与文档

- 版本号更新至 v63.0.0。
- README 更新：新增 v63 功能说明、更新应用数量、新增终端命令介绍。

## [59.0.0] - 2026-08-01

### Added — System-wide QuickNote overlay

- **QuickNote Overlay** — a frictionless quick-capture scratchpad reachable from
  anywhere via `Alt+N` or the new taskbar tray note icon. Multi-note list with
  full-text search, instant debounced auto-save to `localStorage`, live
  word/character count, and one-key (`Ctrl+Enter`) export of a note as a real
  `.txt` file into the virtual `~/文档` directory — or send it straight to the
  text editor. Editorial amber-on-glass aesthetic with serif body type.
  (`components/QuickNoteOverlay.tsx`, wired in `App.tsx`, `Taskbar.tsx`,
  `ShortcutPanel.tsx`)

### Fixed — Reliability hardening

- **Terminal no longer crashes on corrupted `localStorage`** — `JSON.parse` of
  saved command history and aliases is now wrapped in `try/catch` with shape
  validation, so a malformed entry can no longer throw at component init and
  blank the Terminal. (`apps/Terminal.tsx`)
- **Terminal clipboard handlers no longer leak unhandled rejections** —
  `handleCopy` / `handlePaste` now `try/catch` the async Clipboard API calls,
  which previously rejected when clipboard permission was denied.
  (`apps/Terminal.tsx`)
- **Terminal mount `setTimeout` is now cleared on unmount** — closing the
  Terminal quickly no longer leaves a pending focus timer. (`apps/Terminal.tsx`)
- **Duplicate `idea-board` app id resolved** — the registry contained two
  entries both keyed `idea-board` (one → `IdeaBoardInfinite`, one → classic
  `IdeaBoard`), causing the launcher to render duplicates or silently overwrite
  one. The classic variant is now registered as `idea-board-classic`.
  (`apps.tsx`)
- **RecipeLab no longer leaks an unhandled rejection** — the "add all planned
  meals to shopping list" action now catches each individual lookup so a single
  failed request no longer rejects the whole `Promise.all`. (`apps/RecipeLab.tsx`)

## [52.0.0] - 2026-07-25

### Fixed — Reliability & Quality pass

A focused iteration on stability and correctness. Every fix below addresses a
real defect that affected daily use; the app now boots, runs code, and recovers
from errors more predictably.

- **CSP no longer blocks `eval`** — added `'unsafe-eval'` to the `script-src`
  directive. Code Runner, OnlineCompiler, WebIDE, CodeSandbox, CodePen Lite,
  CodePlayground, CodeInterpreter and ~10 other in-browser code execution apps
  previously failed silently with `EvalError`. (`main.tsx`)
- **WindowManager `loadComponent` no longer recurses infinitely** — the retry
  path captured `retryCount` in a closure and never re-read the latest value,
  so a perpetually failing module would recurse until `RangeError: Maximum call
  stack size exceeded` and crash the tab. The closure is now re-read on every
  recursion. (`components/desktop/WindowManager.tsx`)
- **No more `visibilitychange` listener leaks** — `preloadComponents()` now
  returns a cleanup function and the `useEffect` honors it, so StrictMode /
  remounts no longer accumulate listeners. (`WindowManager.tsx`)
- **No more `setTimeout(addEventListener)` leaks in Taskbar** — all three
  context-menu call sites now `clearTimeout` the pending timer in cleanup,
  closing the race where a 0 ms `setTimeout` could `addEventListener` after the
  component had already unmounted and removed its listener. (`Taskbar.tsx`)
- **Storage truncation no longer writes a *larger* object** — when the
  serialized value exceeded the localStorage budget, the previous code spread the
  original (huge) value into a `{...value, _truncated: true}` placeholder,
  almost guaranteeing `QuotaExceededError`. It now writes a minimal
  `{_truncated, _originalSize, _truncatedAt}` placeholder. (`store/storageUtils.ts`)
- **Service Worker URL is no longer hardcoded** — `registerServiceWorker` now
  builds the URL from `import.meta.env.BASE_URL`, so PWA still works when
  deploying to a custom path or root domain. (`main.tsx`)

### Changed

- **Removed duplicate system-shortcut entries** — `Ctrl+K`, `Ctrl+P`,
  `Ctrl+Space` were already handled inline in `handleKeyDown` and the duplicate
  entries in `systemShortcuts` were unreachable dead code; removed to prevent
  future maintainers from desyncing the two paths. (`App.tsx`)
- **App registration is now O(n) instead of O(n²)** — added `registerApps(apps[])`
  which performs a single `set()` with a `Set`-based diff. With 350+ apps in the
  registry this noticeably shortens first-paint blocking time. (`store.tsx`,
  `App.tsx`)
- **Disambiguated duplicate app display names** — "剪贴板历史" and "AI 聊天助手"
  each had two registry entries with identical display names. The legacy entries
  are now suffixed `（基础版）` so users can tell them apart in the launcher.
  (`apps.tsx`)
- **Boot animation is skippable** — clicking anywhere or pressing any key
  during boot immediately dismisses the animation. The version label now
  reflects the real `package.json` version instead of a hardcoded `v2.0`.
  (`BootAnimation.tsx`)

### Verified

- Production build succeeds (`npm run build`) with no new TypeScript errors.
- Playwright smoke test (load page → skip boot → open terminal → run
  `echo hello-from-weblinux` → open global search → close windows) passes
  with zero critical console errors. See `test-output/` for screenshots.

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
