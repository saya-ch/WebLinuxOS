# WebLinuxOS

一款完全运行于浏览器中的 Linux 桌面环境模拟器。基于 React 19、TypeScript、Zustand 与 Vite 构建，内置 360+ 应用程序、虚拟文件系统、终端模拟器及 Python 运行时，全部在客户端执行，无需后端服务。

**在线体验**: <https://saya-ch.github.io/WebLinuxOS/>

[![GitHub Actions Workflow Status](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-121.0.0-7c3aed.svg)](./package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](../../CONTRIBUTING.md)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs)](https://nodejs.org/)

---

## 目录

- [项目简介](#项目简介)
- [核心特性](#核心特性)
- [应用概览](#应用概览)
- [截图展示](#截图展示)
- [快速开始](#快速开始)
- [部署说明](#部署说明)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [快捷键参考](#快捷键参考)
- [终端命令示例](#终端命令示例)
- [开发指南](#开发指南)
- [贡献指南](#贡献指南)
- [浏览器兼容性](#浏览器兼容性)
- [许可证](#许可证)

---

## 项目简介

大多数"Web 桌面"项目仅停留在视觉外壳层面，缺乏真正的实用价值。WebLinuxOS 的目标不同——它提供了一个完整的操作环境，包含真正可用的终端（100+ 命令）、由 localStorage 驱动的虚拟文件系统、通过 Pyodide 实现的 Python 运行时，以及 350+ 个解决实际问题的应用程序，涵盖从 Cron 表达式生成到 PII 脱敏等场景。

一切皆在浏览器中运行。无需后端，无需账号，无数据收集。

---

## 核心特性

### 桌面环境

- 多窗口管理器：支持拖拽、缩放、对齐、最小化、最大化及多虚拟桌面
- 智能启动器：模糊搜索与键盘导航
- 系统托盘：实时显示网络、音量与电量状态
- 全局搜索（`Ctrl+K`）：跨应用、文件与命令的统一检索
- 命令面板（`Ctrl+P`）：系统操作快捷入口
- 深色 / 浅色主题：平滑过渡，支持即时切换
- 动态壁纸：粒子效果与星云背景，支持鼠标交互
- 通知中心：持久化提醒
- 桌面小部件：时钟、系统监控、天气、便利贴与专注计时器

### 开发者工具

- **代码编辑器**：支持 20+ 语言的语法高亮
- **WebIDE Pro**：完整的在线开发环境
- **在线代码运行器**：支持 JavaScript、TypeScript、SQL、Bash、HTML、Markdown
- **Python REPL**：通过 Pyodide 实现，支持包管理
- **CodeSnap Pro**：代码快照生成器，10 种语言语法高亮、8 种精美主题、行号显示、自定义外观、PNG 导出，将代码一键转换为分享级图片
- **GlobalPulse**：全球脉动仪表盘，实时天气(Open-Meteo 8城市)、全球汇率(Frankfurter 11货币)、加密货币行情(CoinGecko 5大币种)、科技头条(Hacker News Top 20)、世界时钟(6时区)，多 API 集成+智能缓存+自动刷新
- **终端**：100+ 命令，涵盖：
  - 文件操作：`ls`、`cd`、`cat`、`mkdir`、`rm`、`cp`、`mv`、`grep`、`find`、`diff`、`chmod`、`history`
  - 系统管理：`top`、`ps`、`neofetch`、`free`、`df`、`uptime`、`clear`、`which`
  - 网络工具：`ping`、`curl`（支持 `-i`、`-X`、`-H`、`-d` 选项）、`fetch`、`ipinfo`、`iplookup`、`weather`、`news`、`crypto`、`currency`、`translate`、`wiki`、`space`
  - 开发工具：`calc`、`hash`、`hash-verify`、`base64`、`uuid`、`regex`、`jwt-decode`
- **REST API 测试器**：请求构建器与 JSON 预览
- **JSON 工具箱**：格式化、验证、YAML 转换、Diff 对比、Schema 生成
- **正则构建器 / 测试器**：内置模式库
- **GitHub 趋势与仓库浏览器**
- **代码片段管理器**：支持导入 / 导出
- **进制转换器**：支持 2/8/10/16/32/64 进制互转，浮点数与大数处理

### 生产力应用

- Markdown 编辑器：实时预览与 HTML 导出
- 智能笔记：标签、搜索与 Markdown 渲染
- 电子表格：公式与图表
- 日历与提醒；看板（Kanban）支持拖拽排序
- 思维导图、演示文稿创建器、甘特图项目规划器
- 番茄钟工作室：可自定义会话
- 习惯追踪器：连续打卡可视化

### 互联网与数据

- 天气（实时，基于 Open-Meteo）
- 加密货币追踪（基于 CoinGecko）
- Hacker News 阅读器
- Wikipedia 浏览器
- NASA 每日天文图
- GitHub 热门仓库
- RSS 阅读器
- 实时翻译器（100+ 语言）
- 每日一言：集成真实名言 API，支持收藏、分类浏览与中文翻译

### 实用工具

- 随机工具集：密码生成器、随机数、UUID、Luhn 校验、骰子、随机选择与打乱

### 多媒体与游戏

- 音乐播放器：播放列表与可视化效果
- 绘图应用：图层与滤镜支持
- 摄像头捕捉、屏幕录制、录音
- 经典游戏：贪吃蛇、俄罗斯方块、2048、记忆翻牌、打砖块
- 虚拟宠物

### AI 集成

- Pollinations AI 免费 API：AI 对话、图像生成、代码生成、翻译与文本摘要
- AI 研究助手：arXiv + Semantic Scholar 双源论文搜索
- AI 代码分析器：代码质量评估与改进建议
- AI 提示词优化器：提示词工程评分与模板

### PWA 与持久化

- 完整 PWA 支持：可安装、离线可用
- Service Worker：资源缓存与离线回退
- 持久化状态：桌面图标、文件系统、窗口布局、主题偏好均通过 localStorage 持久保存
- 多端无缝体验：刷新后恢复完整工作状态

---

## 应用概览

WebLinuxOS 内置 360+ 应用程序，按以下分类组织：

| 分类 | 说明 | 典型应用 |
| --- | --- | --- |
| **系统** | 系统管理与配置 | 终端、文件管理器、设置、系统监控、壁纸、启动器 |
| **办公** | 办公与生产力 | Markdown 编辑器、笔记、日历、演示文稿、思维导图、电子表格 |
| **互联网** | 网络与信息服务 | 浏览器、天气、新闻、GitHub 趋势、Wikipedia、加密货币 |
| **多媒体** | 音视频与图形 | 绘图、图像查看器、音乐播放器、视频播放器、摄像头 |
| **开发工具** | 开发者工具链 | 代码编辑器、REST 测试器、JSON 工具箱、正则实验室、Cron 实验室、进制转换器 |
| **实用工具** | 通用工具 | 计算器、单位换算、密码生成、哈希生成、二维码生成、每日一言、随机工具集 |
| **游戏** | 娱乐与休闲 | 贪吃蛇、俄罗斯方块、2048、记忆翻牌、打砖块 |
| **图形** | 图形与设计 | 色彩转换器、色彩提取器、字体查看器、调色板生成 |

---

## 截图展示

<div align="center">
  <img src="./screenshots/01-desktop.png" alt="桌面主界面" width="48%" />
  <img src="./screenshots/02-launcher.png" alt="应用启动器" width="48%" />
</div>

<div align="center">
  <img src="./screenshots/03-file-manager.png" alt="文件管理器" width="48%" />
  <img src="./screenshots/04-terminal.png" alt="终端模拟器" width="48%" />
</div>

<div align="center">
  <img src="./screenshots/05-text-editor.png" alt="文本编辑器" width="48%" />
  <img src="./screenshots/06-final-desktop.png" alt="桌面最终效果" width="48%" />
</div>

---

## 快速开始

### 环境要求

- Node.js 20+
- npm 10+
- 现代浏览器（Chrome / Firefox / Safari / Edge 最新两个版本）

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git

# 进入项目目录
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 访问 http://localhost:5173/WebLinuxOS/
```

### 生产构建

```bash
# 类型检查并构建
npm run build

# 本地预览生产构建
npm run preview
```

### 其他命令

```bash
# 代码检查
npm run lint

# 类型检查
npm run typecheck

# 代码格式化
npm run format
```

---

## 部署说明

### GitHub Pages 自动部署

项目已配置 GitHub Actions 工作流（`.github/workflows/deploy.yml`），推送到 `main` 分支时将自动构建并部署到 GitHub Pages。

工作流步骤：
1. 使用 `actions/checkout@v4` 获取完整源码
2. 使用 `actions/setup-node@v4` 配置 Node.js 20 环境
3. 执行 `npm ci` 安装依赖
4. 执行 `npm run deploy` 构建生产版本（base path 自动设置为 `/WebLinuxOS/`）
5. 使用 `actions/configure-pages@v4` 配置 Pages
6. 使用 `actions/upload-pages-artifact@v3` 上传构建产物
7. 使用 `actions/deploy-pages@v4` 发布到 GitHub Pages

### 手动部署

```bash
cd WebLinuxOS/web-linux

# 本地构建（GitHub Pages 模式）
npm run deploy

# 将 dist/ 目录内容推送到 GitHub Pages 分支即可
```

### 本地部署

```bash
# 通用本地构建（base path 为 "/"）
npm run build:local

# 预览
npm run preview
```

---

## 项目结构

```
web-linux/
├── public/                          # 静态资源
│   ├── manifest.json                # PWA 清单
│   ├── sw.js                        # Service Worker
│   ├── favicon.svg                  # 图标
│   └── .nojekyll                    # GitHub Pages 标识
├── screenshots/                     # README 截图资源
├── scripts/                         # 辅助脚本
├── src/
│   ├── apps/                        # 240+ 应用组件
│   │   └── terminal/                # 终端命令模块
│   │       ├── commands.ts          # 命令注册与调度核心
│   │       ├── fileCommands.ts      # 文件系统命令（ls/cd/cat/mkdir 等）
│   │       ├── systemCommands.ts    # 系统命令（whoami/hostname/neofetch 等）
│   │       ├── toolCommands.ts     # 工具命令（echo/base64/hash/uuid 等）
│   │       ├── networkCommands.ts  # 网络命令（ping/curl/ifconfig 等）
│   │       ├── creativeCommands.ts  # 创意命令（nasa/wikipedia/github-trending）
│   │       ├── aiCommands.ts        # AI 命令
│   │       ├── storageCommands.ts  # 存储命令
│   │       └── ...                  # 更多命令模块
│   ├── components/
│   │   └── desktop/                 # 桌面核心组件
│   │       ├── Desktop.tsx          # 桌面主组件
│   │       ├── Window.tsx           # 窗口组件
│   │       ├── WindowManager.tsx    # 窗口管理器
│   │       ├── Taskbar.tsx          # 任务栏
│   │       ├── StartMenu.tsx        # 开始菜单
│   │       └── DesktopWidgets.tsx  # 桌面小部件
│   ├── config/
│   │   └── apiConfig.ts             # 公开 API 端点配置
│   ├── services/                    # 服务层
│   │   ├── aiService.ts             # AI 服务
│   │   ├── apiService.ts            # API 服务
│   │   └── clipboardService.ts      # 剪贴板服务
│   ├── store/                       # Zustand 状态管理
│   │   ├── defaults.tsx             # 默认数据
│   │   ├── fileUtils.ts             # 文件系统操作工具
│   │   └── storageUtils.ts          # 本地存储工具
│   ├── styles/                      # 主题样式
│   │   ├── cyberpunk-theme.css      # 赛博朋克主题
│   │   ├── quantum-theme.css        # 量子主题
│   │   └── ...
│   ├── utils/                       # 通用工具
│   │   ├── apiCache.ts              # API 缓存
│   │   ├── fileSystemAPI.ts         # 文件系统 API
│   │   ├── logger.ts                # 日志工具
│   │   └── performanceMonitor.ts    # 性能监控
│   ├── apps.tsx                     # 应用注册表（声明式元数据）
│   ├── App.tsx                      # 根组件 + 全局快捷键
│   ├── main.tsx                     # React 入口
│   ├── store.tsx                    # Zustand Store 定义
│   └── types.ts                     # 类型定义
├── index.html                       # 启动屏与主题预加载
├── vite.config.ts                   # Vite 构建配置
├── tsconfig.json                    # TypeScript 配置
└── package.json                     # 项目配置
```

### 应用注册表

应用以纯数据形式声明在 `src/apps.tsx` 中，每个条目包含 ID、名称、图标、组件名、默认窗口尺寸与分类。组件通过 `src/components/desktop/WindowManager.tsx` 中的 `componentMap` 实现懒加载，打开应用时按需获取对应的代码块。

### 终端命令系统

终端命令通过 `registerCommand(name, definition)` 自注册在 `src/apps/terminal/commands.ts` 中。重复注册会被检测并跳过（在开发模式下会输出警告），确保 `systemCommands.ts`、`toolCommands.ts`、`creativeCommands.ts` 中的"权威实现"始终优先。如需强制覆盖：

```ts
registerCommand('my-cmd', definition, { force: true, source: 'myModule' })
```

---

## 技术栈

| 层级 | 技术 | 选用原因 |
| --- | --- | --- |
| UI 框架 | React 19 | 并发渲染、Suspense、Hooks |
| 编程语言 | TypeScript 6 | 端到端类型安全 |
| 状态管理 | Zustand 5 | 轻量、无样板代码 |
| 构建工具 | Vite 8 | 快速 HMR、ES2022 目标、智能代码分割 |
| Python 运行时 | Pyodide 0.26 | 真正的 CPython 编译为 WASM |
| 图标 | Lucide React | 可树形摇抖、设计风格一致 |
| 存储 | localStorage + IndexedDB | 持久化虚拟文件系统 |
| PWA | manifest.json + Service Worker | 可安装、离线可用 |
| Markdown 渲染 | Marked | 高性能 Markdown 解析 |
| 代码编辑器 | Monaco Editor | VS Code 同款编辑器内核 |
| 代码规范 | ESLint + Prettier | 统一代码风格 |

### API 集成

所有集成均使用公开免费端点，部署应用无需密钥即可正常工作：

| 服务 | 用途 |
| --- | --- |
| Open-Meteo | 天气预报与实况 |
| CoinGecko | 加密货币行情 |
| ipapi.co | IP 地址地理定位 |
| GitHub API | 仓库与用户查询 |
| Hacker News (Algolia) | 新闻文章 |
| LibreTranslate / MyMemory | 翻译服务 |
| Wikipedia REST API | 百科知识 |
| NASA APOD | 每日天文图 |
| Pollinations.ai | 免费 AI 对话与图像生成 |
| microlink.io | 网页元数据与截图 |
| Frankfurter | 汇率查询 |
| RestCountries | 国家信息查询 |
| Open Library | 图书检索 |
| arXiv / Semantic Scholar | 学术论文搜索 |

---

## 快捷键参考

### 系统快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl + Shift + L` | 打开应用启动器 |
| `Ctrl + K` | 全局搜索 |
| `Ctrl + P` | 命令面板 |
| `Ctrl + Shift + P` | 命令面板（替代） |
| `Ctrl + Space` | 智能命令中心 |
| `Ctrl + /` | 快捷键面板 |
| `Alt + N` | 快速笔记覆盖层 |
| `Ctrl + Alt + 1~9` | 切换虚拟桌面 |
| `Ctrl + Alt + ← / →` | 切换上一个 / 下一个桌面 |
| `Ctrl + Shift + Alt + 1~9` | 将当前窗口移动到指定桌面 |
| `Ctrl + Shift + Alt + ← / →` | 将窗口移动到相邻桌面 |
| `Ctrl + Alt + Tab` | 切换窗口（反向） |
| `Alt + Tab` | 切换窗口 |
| `Ctrl + Q` | 关闭当前聚焦窗口 |
| `Ctrl + M` | 最小化当前窗口 |
| `F11` | 全屏切换 |
| `PrintScreen` | 截图 |
| `Ctrl + A` | 快捷操作中心 |
| `Ctrl + N` | 通知中心 |

### 应用快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Ctrl + T` | 打开终端 |
| `Ctrl + E` | 打开文件管理器 |
| `Ctrl + B` | 打开浏览器 |
| `Ctrl + ,` | 打开设置 |
| `Ctrl + I` | 打开图像查看器 |
| `Ctrl + H` | 打开帮助 |
| `Ctrl + G` | 打开代码编辑器 |
| `Ctrl + S` | 打开系统监控 |
| `Ctrl + Shift + C` | 打开计算器 |
| `Ctrl + Shift + E` | 打开文本编辑器 |
| `Ctrl + Shift + P` | 打开画图 |
| `Ctrl + Shift + W` | 打开天气 |
| `Ctrl + Shift + M` | 打开音乐播放器 |
| `Ctrl + Alt + N` | 打开笔记 |
| `Ctrl + Shift + D` | 打开日历 |
| `Ctrl + Shift + U` | 打开 Studio Suite |

---

## 终端命令示例

### 文件操作

```bash
ls -la /home/user/documents    # 列出详细文件列表
cd /home/user/projects        # 切换目录
cat readme.md                    # 查看文件内容
mkdir -p projects/new-app       # 递归创建目录
rm -rf temp/*                    # 递归删除（危险！）
cp -r source/ destination/       # 复制目录
mv old_name new_name             # 重命名 / 移动
grep -r "TODO" src/              # 递归搜索字符串
find / -name "*.ts"              # 按名称查找文件
diff file1.js file2.js           # 比较两个文件
```

### 系统信息

```bash
whoami                           # 当前用户
hostname                         # 主机名
neofetch                         # 系统信息展示（带 ASCII Logo）
uptime                           # 运行时长
free                             # 内存使用
df -h                            # 磁盘空间
top                              # 进程列表
system                           # 详细系统信息（CPU/内存/网络/浏览器）
banner                           # 显示欢迎横幅
```

### 网络与 API

```bash
curl https://api.github.com/repos/saya-ch/WebLinuxOS   # HTTP 请求
weather Beijing                  # 查看天气（wttr.in API）
news                             # 科技新闻
crypto BTC                       # 加密货币行情
translate "你好"                 # 翻译文本
ipinfo                           # IP 地址信息
github-trending                  # GitHub 热门仓库
```

### 开发者工具

```bash
hash "hello world"               # 计算哈希值
uuid                             # 生成 UUID
base64 encode "hello"            # Base64 编码
base64 decode "aGVsbG8="         # Base64 解码
calc "(10 + 5) * 3"              # 计算器
js Math.PI * 2                   # 执行 JavaScript
regex "^[a-z]+$" hello           # 正则测试
cowsay "Hello World"             # 卡通牛说
fortune                          # 随机名言
```

---

## 开发指南

### 添加新应用

1. **创建组件**：在 `src/apps/` 下创建 `MyApp.tsx`，导出一个默认 React 组件

2. **注册应用**：在 `src/apps.tsx` 的 `APP_REGISTRY_EXTRAS` 数组中添加条目：

```tsx
{
  id: 'my-app',
  name: '我的应用',
  icon: <MyIcon />,  // 使用 src/icons.tsx 中的图标
  component: 'MyApp',
  category: 'utilities',
  defaultWidth: 800,
  defaultHeight: 600,
  minWidth: 600,
  minHeight: 400,
  resizable: true,
  multiple: false,
  isNew: true,
  description: '应用简介'
}
```

3. **添加懒加载**：在 `src/components/desktop/WindowManager.tsx` 的 `componentMap` 中添加映射：

```tsx
const MyApp = lazy(() => import('../../apps/MyApp'))
// ...
const componentMap: Record<string, React.ComponentType> = {
  // ...
  MyApp
}
```

4. **可选 - 添加快捷键**：在 `src/App.tsx` 的 `appShortcuts` 中注册

5. **可选 - 更新构建配置**：在 `vite.config.ts` 的 `manualChunks` 中为新应用添加代码分割规则

### 添加终端命令

1. **选择命令文件**：确定合适的命令文件（如 `toolCommands.ts` 用于工具类命令）

2. **注册命令**：调用 `registerCommand` 函数：

```ts
registerCommand('my-command', {
  handler: (context: CommandContext) => {
    const { args } = context
    return { output: `参数: ${args.join(', ')}` }
  },
  description: '命令描述',
  usage: 'my-command [参数]',
  examples: ['my-command', 'my-command arg1 arg2']
})
```

3. **自动注册**：新命令会自动被 `help` 命令和 Tab 补全识别

4. **新建命令文件**：如果创建了新的命令文件，需在 `src/apps/terminal/index.ts` 中按正确顺序添加 `import './myCommands'`

### 新增 API 集成

1. 在 `src/config/apiConfig.ts` 中添加端点配置
2. 在 `src/services/apiService.ts` 中添加 API 调用方法
3. 确保所有端点均为公开免费，无需 API Key

---

## 贡献指南

欢迎贡献代码！工作流程如下：

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 遵循现有代码风格进行修改（Prettier + ESLint）
4. 本地验证：`npm run lint && npm run build`
5. 提交 Pull Request，附带清晰的功能说明

详细贡献规范请参阅 `CONTRIBUTING.md`。

### 代码规范

- TypeScript 严格模式
- ESLint + Prettier 强制执行
- 组件使用函数式组件与 Hooks
- 文件命名：PascalCase（组件）、camelCase（工具）
- 遵循现有目录结构与模式

---

## 浏览器兼容性

已在以下浏览器的最新两个版本中进行测试：

- Chrome / Edge（推荐，完全支持 File System Access API 与 Pyodide）
- Firefox（完全支持，部分高级 API 有优雅降级）
- Safari（完全支持，部分高级 API 有优雅降级）

File System Access API 与 Pyodide 需要现代浏览器；项目已实现优雅降级处理。

---

## 许可证

本项目基于 [MIT License](../../LICENSE) 开源。

---

## 使用场景

- 在沙箱环境中学习 Linux 概念
- 展示现代 Web 能力
- 跨平台获取开发工具，无需安装
- 轻量级在线开发工作区
- 使用 JavaScript、TypeScript 与 Python 进行编程教学
- API 测试与原型开发
- 快速 JSON / Cron / PII 脱敏操作，无需上传数据

---

## 作者

由 **Saya Ch** 维护 · <https://github.com/saya-ch>