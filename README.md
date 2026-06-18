# WebLinuxOS

> 浏览器中的完整 Linux 桌面环境 — 真实、开源、零后端依赖

WebLinuxOS 不是一个模拟器，而是一个完全运行在浏览器中的**真实桌面环境**。它使用 React 19 + TypeScript 构建，通过 Zustand 管理窗口、文件与设置状态，支持完整的窗口管理、多虚拟桌面、虚拟文件系统，并集成了 **200+ 应用程序**与多种公开 API。所有计算均在本地浏览器中执行，无需任何服务器后端。

---

## 在线演示

访问在线演示站点：<https://saya-ch.github.io/WebLinuxOS/>

> 首次加载时，核心应用会在后台预加载，以获得更流畅的后续体验。

---

## 目录

- [主要特性](#主要特性)
- [核心架构](#核心架构)
- [150+ 应用程序](#150-应用程序)
- [真实 API 集成](#真实-api-集成)
- [键盘快捷键](#键盘快捷键)
- [本地开发](#本地开发)
- [部署到 GitHub Pages](#部署到-github-pages)
- [技术栈](#技术栈)
- [浏览器兼容性](#浏览器兼容性)
- [数据与隐私](#数据与隐私)
- [贡献指南](#贡献指南)
- [License](#license)

---

## 主要特性

### 窗口与桌面

- 完整的**窗口管理系统** — 拖拽、缩放、最小化、最大化、层级（z-index）管理、边缘吸附
- **多虚拟桌面** — 最多支持 9 个虚拟桌面，可通过快捷键切换或在桌面之间移动窗口
- **任务栏** — 显示当前桌面的窗口，支持点击聚焦、中键关闭
- **开始菜单** — 分类浏览所有应用程序
- **全局搜索** — 快速启动应用、查找文件（Ctrl/Cmd + K）
- **命令面板** — 快速执行系统命令（Ctrl/Cmd + P）

### 终端与文件系统

- **完整终端模拟器** — 支持 90+ 命令，包括 `ls`、`cat`、`cd`、`mkdir`、`rm`、`grep`、`find`、`curl`、`wget`、`echo`、`pwd`、`whoami`、`uname`、`ps`、`top`、`tree`、`chmod`、`history`、`clear`、`exit`、`alias`、`export` 等
- **虚拟文件系统** — 基于 localStorage/IndexedDB 的树形文件节点，持久化保存用户数据
- **文件管理器** — 图形化浏览、复制、移动、删除、重命名，支持文本预览
- **实时剪贴板** — 跨应用的文本剪贴板历史

### 开发与生产力

- **代码运行器 (CodeRunner)** — 浏览器中真实执行 JavaScript、TypeScript、Python（Pyodide WASM）、Markdown 渲染、HTML/CSS 预览
- **代码编辑器 / Code Studio** — 类 VS Code 的编辑界面，语法高亮、多标签
- **代码片段管理 / Code Review 助手** — 组织常用代码、提供代码质量反馈
- **API 测试器 / REST Client / API Lab** — 支持 GET/POST/PUT/DELETE、自定义 Header、鉴权
- **Markdown 编辑器 + 预览 + 幻灯片** — 编写并渲染 Markdown，或直接转为演示文稿
- **Cron 表达式生成器** — 可视化生成 cron 表达式并附带解释
- **JSON Schema 验证 / JSON 格式化 / JSON↔YAML 转换**
- **正则表达式测试器** — 实时匹配与高亮
- **DevTools 工具箱** — Base64、URL、Hex、Unicode 工具集

### 创意与设计

- **画图（Paint）** — 模拟经典 Windows 画图工具
- **配色方案生成器** — 生成协调的配色方案，支持导出
- **字体预览器** — 浏览系统与 Web 字体
- **白板 / 专业白板** — 自由绘图、团队协作草图
- **灵感板** — 收集视觉素材与灵感
- **粒子系统 / 动态壁纸** — 桌面可视化效果

### 系统与监控

- **系统仪表盘 / 系统健康仪表盘** — 实时显示 CPU、内存、存储使用
- **进程监视器 / 任务管理器 Plus / 任务管理器 Pro** — 管理窗口进程
- **性能监视器** — 帧率、内存趋势图
- **系统信息** — 浏览器、操作系统、屏幕信息
- **网络监视器 / 网络速度测试** — 检测下载速度与网络状态

### AI 与智能

- **AI 智能助手 / AI Chat Assistant / AI Helper** — 多模式的聊天式智能助手（本地逻辑，无远程调用）
- **AI 代码助手 / AI Code Tutor / Code Reviewer** — 代码生成、教学建议、代码审查
- **智能笔记 / 智能密码管理** — 基于提示的笔记整理与密码强度建议
- **智能搜索 / 智能仪表盘** — 统一搜索入口与聚合视图

### 数据与可视化

- **高级数据可视化 / DataViz / 实时数据仪表盘** — 多种图表形式展示数据
- **数据导入导出** — 从 JSON/CSV 导入数据并导出
- **加密货币追踪器 / 股票市场追踪器 / 实时汇率** — 接入公开金融 API

### 媒体与工具

- **音乐播放器 / 音乐工作室 / 音乐可视化** — 本地文件与流媒体播放
- **图片查看器 / 图片优化器** — 快速预览与压缩处理
- **视频播放器** — HTML5 视频播放
- **屏幕截图 / 屏幕录制** — 使用 MediaDevices API 捕获屏幕
- **相机 / 录音** — 本地媒体捕获
- **表情符号浏览器** — 全量 Emoji 搜索与复制

### 网络与信息检索

- **天气** — 通过 Open-Meteo 获取全球真实天气数据（温度、湿度、风速、AQI、日出日落）
- **维基百科阅读器** — 搜索条目并显示摘要、图片、随机推荐（多语言）
- **网络探索器** — 浏览公开信息源（Hacker News / GitHub Trending / 新闻聚合）
- **IP 查询 + DNS 查询 + WHOIS** — 接入 ipapi.co 与 Google DoH
- **RSS 订阅阅读器** — 通过代理读取 RSS/Atom 订阅
- **宇宙探索器（SpaceExplorer）** — NASA APOD、火星漫游车照片、ISS 实时位置

---

## 核心架构

```
┌──────────────────────────────────────────────────────────┐
│                     React Root (<App/>)                   │
├──────────────┬───────────────────────────────────────────┤
│   Desktop    │ Taskbar │ StartMenu │ GlobalSearch         │
├──────────────┴───────────────────────────────────────────┤
│                      WindowManager                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  Lazy-Loaded Apps   │
│  │Window 1 │ │Window 2 │ │Window 3 │  (React.lazy + Suspense)
│  └─────────┘ └─────────┘ └─────────┘                      │
├───────────────────────────────────────────────────────────┤
│                   Zustand Store (store.tsx)               │
│  windows  ·  desktops  ·  files  ·  theme  ·  settings    │
├───────────────────────────────────────────────────────────┤
│            Persistence (localStorage / IndexedDB)         │
└───────────────────────────────────────────────────────────┘
```

### 状态管理（Zustand）

`store.tsx` 定义了单一 Store：

- `windows`：所有窗口的列表（位置、尺寸、是否最大化、关联应用 ID）
- `apps`：已注册的应用定义
- `files`：虚拟文件系统的树形节点
- `desktopIcons`：桌面图标
- `theme`、`wallpaper`、`liveWallpaper`：视觉设置
- `currentDesktop`、`totalDesktops`：虚拟桌面状态
- `windowsPerDesktop`：窗口到桌面的分配
- `history`：文件操作历史（撤销/重做）
- `recentFiles`、`favorites`、`pinnedApps`：用户偏好
- `notifications`：通知系统的队列

Store 暴露的 Action 包括 `openApp`、`closeWindow`、`focusWindow`、`maximizeWindow`、`updateWindowPosition`、`updateWindowSize`、`minimizeWindow`、`minimizeAll`、`restoreAll`、`toggleFullscreen`、`switchDesktop`、`moveWindowToDesktop`、`updateDesktopCount`、`writeFile`、`readFile`、`deleteFile`、`renameFile`、`createDirectory`、`copyNode`、`pasteNode`、`undo`、`redo`、`toggleTheme`、`addNotification`、`clearNotifications` 等。

### 窗口渲染

- `WindowManager` 通过 `React.lazy(() => import(../../apps/${componentName}.tsx))` 懒加载每个应用
- 核心应用（Terminal、FileManager、Calculator、Settings、Notepad、Calendar、About、Weather）会在首次渲染后通过 `requestIdleCallback` 预加载
- 每个窗口是独立的 React 组件，拥有自己的拖动、缩放、聚焦状态

### 虚拟文件系统

- 树形结构：每个节点是 `{ id, name, type, parentId, children[], content, createdAt, modifiedAt }`
- 支持文件、目录、快捷方式、图片、代码文件的区分
- `findNodeById` / `findNodeByPath` / `resolvePath` 提供查找能力
- `writeFile` / `createDirectory` / `renameFile` / `deleteFile` 提供操作
- 持久化到 `localStorage`（通过 `debounced saveToStorage`）

---

## 200+ 应用程序

下表按类别汇总所有可用应用（每类取代表性列示，完整列表见 `src/apps.tsx`）：

| 类别 | 应用 |
| ---- | ---- |
| **系统** | Terminal、About、Help、System Info、System Dashboard、System Health Check、System Toolbox、Settings、FileManager、DiskUsage、DiskUtility、ProcessMonitor、TaskManager(+/Pro)、PerformanceMonitor、PackageManager、ActivityTracker、CommandReference、QuickCommands、TaskAutomation |
| **开发** | CodeRunner、CodeEditor、CodeStudio、CodeSandbox、CodeFormatter、CodeSnippetsManager、CodeGenerator、**CodeInterpreter(AI代码解释器)**、CodeReviewer、CodeDiffViewer、IntelligentCodeGenerator、JSONFormatter、JSONSchemaValidator、JSONYAMLConverter、RegexTester、RegexBuilder、CronTools、DevAssistant、DevToolbox、DevTools、ApiTester、ApiTesterEnhanced、ApiDocsViewer、ApiDocsViewerEnhanced、APILab、RESTClient、OnlineCodeRunner、DevOpsTools、URLTools、Base64Tools、TextFormatter |
| **办公** | Notepad、Notes、NotesApp、SmartNotes、SmartNotesEnhanced、MarkdownEditor、MarkdownPreview、MarkdownPreviewer、MarkdownToHTML、MarkdownSlides、TextDiffViewer、TextEditor、Spreadsheet、KanbanBoard、TaskBoard、TaskDashboard、ProjectManager、ProjectPlanner、SmartProjectHub、**SmartScheduleAssistant(智能日程助手)**、Flashcards、IdeaCapture、IdeaBoard、MindMap、StickyNotesWall、CollaborativeWhiteboard、Whiteboard、WhiteboardPro、Presentation、BackupTool、DataExporter |
| **网络 / 信息** | Weather、HackerNewsReader、GitHubExplorer、GitHubTrending、NewsReader、SmartNewsReader、WikipediaReader、SpaceExplorer、RSSReader、NetworkExplorer、NetworkMonitor、NetworkSpeedTest、DnsLookup、IPLookup、Maps |
| **创意 / 设计** | Paint、ColorPicker、ColorPaletteGenerator、CreativeToolkit、FontViewer、ImageViewer、ImageOptimizer、ParticleSystem、WallpaperGallery、ComponentSandbox |
| **媒体** | MusicPlayer、MusicStudio、MusicVisualizer、Camera、SoundRecorder、Screenshot、ScreenRecorder、VideoPlayer、PDFViewer |
| **实用工具** | Calculator、TimerApp、Pomodoro、FocusMode、HabitTracker、Calendar、Clock、QuickLauncher、Magnifier、GlobalSearch、SmartSearch、QRGenerator、QRGeneratorEnhanced、PasswordGenerator、PasswordChecker、PasswordManager、PasswordManagerEnhanced、SmartPasswordManager、ClipboardManager、ClipboardHistory、ClipboardManagerAdvanced、UnitConverter、CurrencyConverter、CurrencyLive、StockTracker、CryptoTracker、RecipeBook、DailyInspo、RandomTools、EmojiBrowser、CharacterMap、Firewall、BluetoothManager、PowerManager、OnlineToolkit、**OnlineAPIHub(在线API工具中心)** |
| **AI / 智能** | AIAssistant、AIChatAssistant、ChatAI、AIHelper、AISmartAssistant、AITaskAssistant、AICodeAssistant、AICodeTutor、IntelligentCodeGenerator、CodeReviewer、SmartDashboard、SmartHub、SmartProjectHub、SmartNotes、SmartNotesEnhanced、SmartPasswordManager |
| **可视化 / 仪表盘** | DataViz、DataVisualizer、AdvancedDataViz、RealTimeDashboard、SystemDashboard、SystemHealthDashboard、SystemHealthDashboardEnhanced、UnifiedDashboard、RealTimeTranslator、ProductivityHub、RealTimeTranslator、LearningPlatform |
| **通信** | Email、Chat、Contacts |
| **游戏** | GameSnake（贪吃蛇）、GameTetris（俄罗斯方块）、VirtualPet（电子宠物） |

> 所有应用均为**纯前端实现**，数据保存在本地浏览器中。

---

## 真实 API 集成

以下应用调用了公开的免费 API，以提供真实数据：

| 应用 | API | 用途 |
| ---- | --- | ---- |
| Weather | [Open-Meteo](https://open-meteo.com) + Open-Meteo AirQuality | 实时温度、湿度、风速、气压、AQI、14 日预测 |
| WikipediaReader | [MediaWiki Action API](https://www.mediawiki.org/wiki/API:Main_page) | 条目搜索、全文摘要、图片、随机推荐 |
| HackerNewsReader | [HN Search API (Algolia)](https://hn.algolia.com/api) | HN 首页、Ask/Show HN、评论、搜索 |
| GitHubExplorer / GitHubTrending | [GitHub REST API](https://docs.github.com/en/rest) | 用户信息、仓库、star、热门仓库 |
| IPLookup | [ipapi.co](https://ipapi.co/) + [Google DoH](https://dns.google/resolve) | IP 归属、DNS 记录、WHOIS |
| DevOpsTools | GitHub REST API + npm registry | 用户仓库、包元信息、服务连通性 |
| SpaceExplorer | [NASA Open APIs](https://api.nasa.gov) + [Open Notify](http://open-notify.org) | APOD、火星照片、ISS 位置、太空中的人员 |
| CurrencyLive | CoinGecko / Open Exchange | 汇率（免费端点） |
| CryptoTracker | CoinGecko | 加密货币行情 |
| 翻译助手 (Translator) | [MyMemory Translation API](https://mymemory.translated.net/doc/spec.php) | 中英文互译、自动检测 |
| RSSReader | 站点原始 RSS/Atom + [AllOrigins CORS 代理](https://allorigins.win) | 读取任意公开 RSS/Atom 订阅 |
| **OnlineAPIHub** | wttr.in、quotable.io、jokeapi.dev、uselessfacts.jsph.pl、CoinGecko、ipapi.co、dictionaryapi.dev、exchangerate-api.com、worldtimeapi.org、random.org、colourlovers.com | 天气、名言、笑话、知识、加密货币、IP信息、词典、汇率、时区、随机数、颜色生成 |

> 所有 API 均为公开免费端点，部分存在速率限制。某些端点（如无 CORS 头部的 RSS 源）会通过免费代理获取。

---

## 键盘快捷键

WebLinuxOS 提供与真实桌面一致的快捷键体验：

| 快捷键 | 功能 |
| ------ | ---- |
| **Ctrl/Cmd + K** | 打开全局搜索 |
| **Ctrl/Cmd + P** | 打开命令面板 |
| **Ctrl/Cmd + T** | 打开终端 |
| **Ctrl/Cmd + E** | 打开文件管理器 |
| **Ctrl/Cmd + B** | 打开浏览器 |
| **Ctrl/Cmd + ,** | 打开设置 |
| **Ctrl/Cmd + Q** | 关闭当前聚焦窗口 |
| **Ctrl/Cmd + M** | 最小化当前窗口 |
| **Ctrl/Cmd + Shift + M** | 最大化当前窗口 |
| **Esc** | 退出最大化（当窗口最大化时） |
| **Alt + Tab** | 循环切换窗口 |
| **Alt + Shift + Tab** | 反向循环切换窗口 |
| **Ctrl/Cmd + Shift + ArrowUp/Down** | 在同一应用的多个窗口之间切换 |
| **Ctrl/Cmd + Alt + 1~9** | 切换到第 N 个虚拟桌面 |
| **Ctrl/Cmd + Alt + Left/Right** | 切换上一个 / 下一个桌面 |
| **Ctrl/Cmd + Shift + Alt + 1~9** | 将当前窗口移动到第 N 个桌面 |
| **Ctrl/Cmd + Shift + Alt + Left/Right** | 将当前窗口移动到上一个 / 下一个桌面 |
| **PrintScreen** | 打开截图工具 |
| **F11** | 切换窗口最大化 |

---

## 本地开发

### 前置条件

- Node.js >= 20
- npm >= 10

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 2. 安装依赖
npm install

# 3. 启动开发服务器（默认端口 5173）
npm run dev
# 浏览器访问 http://localhost:5173/
```

### 生产构建

```bash
# 在 web-linux 目录下
npm run build        # 生成生产构建（输出到上级目录）
npm run preview      # 本地预览生产构建
```

构建产物将生成在仓库根目录下的 `index.html`、`assets/`、`favicon.svg`、`manifest.json` 与 `.nojekyll`，以便直接推送后由 GitHub Pages 托管。

### 常用脚本

| 脚本 | 说明 |
| ---- | ---- |
| `npm run dev` | 启动 Vite 开发服务器（HMR） |
| `npm run build` | 生产构建（tsc 类型检查 + vite build） |
| `npm run build:local` | 使用 `/` 作为 base 路径的本地构建 |
| `npm run deploy` | 等同于 `build`，用于 CI 工作流 |
| `npm run preview` | 启动本地预览服务器（默认端口 4173） |
| `npm run typecheck` | 仅运行 TypeScript 类型检查 |

### 项目结构

```
WebLinuxOS/
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署工作流
├── index.html                     # 构建后的入口（由 vite 生成）
├── assets/                        # 构建后的资源（由 vite 生成）
├── favicon.svg / manifest.json    # PWA 元信息
├── .nojekyll                      # 让 GitHub Pages 原样托管
├── README.md / README_CN.md       # 项目文档
└── web-linux/                     # 源代码目录
    ├── index.html                 # 开发/构建模板
    ├── vite.config.ts             # Vite 配置（base=/WebLinuxOS/）
    ├── package.json
    ├── public/                    # 构建时复制到根目录
    └── src/
        ├── main.tsx               # React 入口
        ├── App.tsx                # 顶层应用 + 全局键盘快捷键
        ├── apps.tsx               # 应用注册表（供懒加载）
        ├── store.tsx              # Zustand 全局状态与操作
        ├── store/
        │   ├── fileUtils.ts       # 文件系统工具函数
        │   ├── storageUtils.ts    # 持久化工具
        │   └── defaults.tsx       # 初始文件 / 桌面图标 / 常用应用
        ├── index.css              # 全局样式（CSS 变量）
        ├── components/
        │   ├── desktop/
        │   │   ├── Desktop.tsx    # 桌面背景与图标
        │   │   ├── LiveWallpaper.tsx  # 动态壁纸
        │   │   ├── Taskbar.tsx    # 任务栏
        │   │   ├── StartMenu.tsx  # 开始菜单
        │   │   ├── Window.tsx     # 窗口壳
        │   │   └── WindowManager.tsx  # 窗口渲染与懒加载
        │   ├── CommandPalette.tsx # 命令面板
        │   ├── ErrorBoundary.tsx  # 错误边界
        │   └── NotificationSystem.tsx  # 通知
        └── apps/                  # 150+ 应用组件（每个文件即一个应用）
            ├── Terminal.tsx
            ├── Weather.tsx
            ├── WikipediaReader.tsx
            ├── DevOpsTools.tsx
            ├── SpaceExplorer.tsx
            ├── RSSReader.tsx
            ├── ChinesePoetry.tsx
            └── ...
```

### 添加一个新应用

1. 在 `src/apps/` 中创建一个新的 `MyCoolApp.tsx`：

   ```tsx
   import { useState } from 'react'

   export default function MyCoolApp() {
     const [value, setValue] = useState('')
     return (
       <div style={{ padding: 20, color: 'var(--text-primary)' }}>
         <h3>My Cool App</h3>
         <input
           style={/* your styles */}
           value={value}
           onChange={(e) => setValue(e.target.value)}
         />
       </div>
     )
   }
   ```

2. 在 `src/apps.tsx` 的 `appRegistry` 数组中添加一项：

   ```tsx
   {
     id: 'my-cool-app',
     name: '我的酷应用',
     icon: <MyCustomIconSVG />,
     component: 'MyCoolApp',
     category: 'utilities',
     defaultWidth: 800,
     defaultHeight: 600,
     minWidth: 400,
     minHeight: 300,
     resizable: true,
     multiple: false,
   }
   ```

3. 重新运行 `npm run dev`，在开始菜单中查找该应用即可测试。

---

## 部署到 GitHub Pages

本仓库配置了基于 GitHub Actions 的**自动部署**管道（`.github/workflows/deploy.yml`）：

- **触发条件**：推送到 `main` 分支或手动运行 workflow_dispatch
- **Node 版本**：20（使用 `package-lock.json` 作为 npm 缓存键）
- **主要步骤**：
  1. `actions/checkout@v4` — 检出源码
  2. `actions/setup-node@v4` — 安装 Node.js 20
  3. `npm ci` — 安装锁定版本依赖
  4. `npm run deploy`（在 `web-linux/` 中）— 构建前端并将产物输出到仓库根目录
  5. `touch .nojekyll` + 拷贝 `index.html` 为 `404.html` — 防止 GitHub Pages 的 Jekyll 处理，并为 SPA 提供回退路由
  6. 验证 `index.html`、`assets/`、`favicon.svg`、`manifest.json` 均存在
  7. `actions/configure-pages@v4` — 配置 Pages
  8. `actions/upload-pages-artifact@v3` + `actions/deploy-pages@v4` — 上传并部署到 Pages

### 仓库设置

在 GitHub 仓库的 **Settings → Pages** 中，将 **Source** 设置为 **GitHub Actions**。

### 自定义域名（可选）

如需自定义域名，在仓库根目录添加一个名为 `CNAME` 的文件，文件内容为你的域名（例如 `web.example.com`），然后在 DNS 服务商处添加相应的 CNAME 记录指向 `saya-ch.github.io`。

---

## 技术栈

| 层级 | 技术 |
| ---- | ---- |
| **UI 框架** | React 19 |
| **语言** | TypeScript 6 |
| **状态管理** | Zustand 5 |
| **构建工具** | Vite 8（Rolldown 底层） |
| **代码压缩** | Terser |
| **代码分割** | Vite 自动 + 按应用手动分包 |
| **图标** | Lucide React（外加部分自定义内联 SVG） |
| **Markdown** | marked |
| **Python 运行时** | Pyodide（WASM） |
| **PWA 元信息** | manifest.json（渐进增强） |
| **部署** | GitHub Pages + GitHub Actions |

### 设计决策

- **单一 Store vs Reducer**：Zustand 带来扁平、易读的 API；对于这个应用规模已足够。未来可拆分切片。
- **CSS-in-JS vs CSS 文件**：应用内主要使用内联样式以降低耦合，全局主题变量集中在 `index.css`。未来可迁移到 CSS Modules / Tailwind。
- **懒加载**：每个应用均为一个独立 chunk，打开时才会加载，首屏仅加载核心 JS 与 CSS。
- **窗口 vs 进程**：本环境在浏览器中无法真正提供进程隔离，"进程监视器"目前以窗口为单位进行资源映射。

---

## 浏览器兼容性

| 浏览器 | 最低版本 | 备注 |
| ------ | -------- | ---- |
| Chrome / Chromium | 110+ | 推荐 |
| Edge | 110+ | 推荐 |
| Firefox | 110+ | 正常工作 |
| Safari | 16.4+ | 需启用部分 Web API |
| 移动端浏览器 | 试验性 | 触屏拖动已做基础支持 |

> 建议使用最新版现代浏览器以获得最佳体验（原生支持 CSS Container Queries、WebCodecs、WASM 多级优化等）。

---

## 数据与隐私

- **本地优先（Local-first）**：所有数据（窗口状态、文件、笔记、剪贴板、应用偏好）均保存在用户本地浏览器（`localStorage` / IndexedDB）。
- **无账号，无登录**：不上传用户数据到任何服务器。
- **外部 API**：仅在用户主动打开相关应用时调用公开的只读 API（如 Open-Meteo、GitHub 公共端点等）。请求从浏览器直接发出，不会经过中间服务器。
- **第三方 Cookie**：WebLinuxOS 自身不设置第三方 Cookie。部分应用（如 WikipediaReader）打开到 `upload.wikimedia.org` 的图片，可能由 Wikipedia CDN 设置其自有 Cookie。
- **清除数据**：可在系统"设置"应用中一键清除全部本地数据。

---

## 贡献指南

欢迎贡献！你可以：

1. **新增应用**：在 `src/apps/` 添加一个新文件，并在 `apps.tsx` 的 `appRegistry` 数组中注册它。
2. **改进现有应用**：修复 Bug、增加功能、改善 UI 均可。
3. **改进核心系统**：窗口管理、文件系统、快捷键系统、通知系统等。
4. **性能与可访问性**：优化首屏加载、可访问性（a11y）、国际化（i18n）。
5. **文档与示例**：添加截图、演示视频或使用指南。

### 提交约定

- 使用 Conventional Commits（`feat:`、`fix:`、`refactor:`、`docs:`、`perf:`、`chore:`）
- PR 中请简要描述变更内容与动机

### 代码风格

- 2 空格缩进
- 单引号字符串
- 使用 `npm run typecheck` 通过 TypeScript 检查后再提交

---

## 常见问题

**Q: 为什么我打开某些应用看到的是空窗口？**
A: 可能是旧缓存。打开开发者工具，禁用缓存刷新，或在系统"设置"中清除全部数据后再试。

**Q: 为什么有些 API 应用显示请求失败？**
A: 公开免费 API 有速率限制或偶发不可用；某些网络环境也可能屏蔽特定端点。可稍后重试，或切换到其他应用。

**Q: 能否在移动端使用？**
A: 已做触屏拖动的基本适配，但虚拟桌面系统仍以桌面为主要目标。我们欢迎移动端优化贡献。

**Q: 如何备份我的文件/笔记？**
A: 打开"数据导入导出"应用，选择"导出全部"得到 JSON；在另一台浏览器中"导入"即可恢复。

---

## 路线图

- [ ] 真实多标签文件管理器（跨桌面拖放）
- [ ] 窗口吸附（Aero Snap）与分屏快捷键
- [ ] 桌面端 PWA（安装到 ChromeOS / Windows）
- [ ] 文件系统升级到 IndexedDB（突破 5MB）
- [ ] 完整的中文键盘快捷键文档与教程
- [ ] 应用市场（SoftwareCenter）扩展为可安装的第三方应用
- [ ] 协作 / 云同步（端到端加密的可选方案）
- [ ] 可访问性（ARIA / 键盘可达性 / 屏幕阅读器）

---

## License

MIT

```
Copyright (c) 2025-present WebLinuxOS contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

> 本项目是一个独立实验性作品，与任何商业 Linux 发行版没有关联。所有外部 API 为公开免费端点，按其各自的使用条款使用。
