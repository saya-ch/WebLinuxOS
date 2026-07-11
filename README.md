<div align="center">

# WebLinuxOS

**浏览器中的 Linux 风格桌面环境**

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-live-222222?style=flat-square&logo=githubpages)](https://saya-ch.github.io/WebLinuxOS/)

[在线演示](https://saya-ch.github.io/WebLinuxOS/) · [功能特性](#功能特性) · [快速开始](#快速开始) · [技术栈](#技术栈)

</div>

---

## 项目简介

WebLinuxOS 是一个在浏览器中运行的 Linux 风格桌面环境，使用 React 19 和 TypeScript 构建。它提供完整的窗口管理、虚拟文件系统、终端模拟器以及丰富的内置应用，所有数据默认保存在浏览器本地存储中。

**核心特点**

- **浏览器即桌面**：无需安装，打开网页即可获得完整的桌面操作体验
- **虚拟文件系统**：支持文件/目录的创建、编辑、删除、复制、移动，数据持久化到 localStorage
- **终端模拟器**：提供 150+ 命令，涵盖文件操作、网络查询、开发工具、系统信息、趣味命令等
- **窗口管理**：拖拽、缩放、最小化、最大化、多工作区、快捷键支持
- **实用工具集**：JSON 格式化、Base64/URL 编解码、哈希生成、正则测试、二维码生成、REST 客户端等
- **公开 API 集成**：天气、空气质量、加密货币、汇率、GitHub、Hacker News、ISS 位置等实时数据
- **主题与壁纸**：深色/浅色主题、动态壁纸、桌面小部件

## 功能特性

### 核心系统

| 模块 | 说明 |
|------|------|
| 窗口管理 | 多窗口、拖拽缩放、最小化/最大化、z-index 层级、工作区隔离 |
| 虚拟文件系统 | localStorage 持久化，支持常见文件操作 |
| 终端 | 150+ 命令，含历史记录、自动补全、别名、管道 |
| 多工作区 | 最多 9 个虚拟桌面，支持窗口跨桌面移动 |
| 全局搜索 | `Ctrl+K` 快速搜索应用、文件、命令 |
| 桌面小部件 | 时钟、天气、系统监控、便签、番茄钟等 |

### 主要应用

| 应用 | 功能 |
|------|------|
| 文件管理器 | 树形目录、文件预览、右键菜单、拖拽操作 |
| 终端 | 完整命令行环境，支持虚拟文件系统 |
| REST 客户端 | 发送 HTTP 请求、查看响应头与响应体、保存请求历史、CORS 代理 |
| DevForge / DevKit | JSON、Base64、哈希、UUID、时间戳、颜色、正则等开发工具 |
| WorldPulse | 实时数据仪表盘：加密货币、天气、空气质量、ISS、汇率、Hacker News |
| NexusAI | 本地模拟的 AI 助手界面，支持多模式对话 |
| 系统诊断分析 | 实时性能监控、系统健康评分、诊断建议 |
| AI工作流助手 | 智能分析工作习惯、提供生产力优化建议 |
| 代码片段库 | 管理代码片段、支持多语言分类和快速复制 |
| 笔记 / 便签 | Markdown 笔记、便签墙、待办事项 |
| 工作空间中心 | 应用快速访问、系统状态、实时天气、快捷便签、分类导航 |
| 游戏 | 贪吃蛇、俄罗斯方块、2048、记忆游戏、打砖块 |

### 网络与数据（公开 API）

| 应用/命令 | 数据来源 | 说明 |
|-----------|----------|------|
| 天气 | Open-Meteo | 全球城市实时天气与预报 |
| 空气质量 | Open-Meteo Air Quality | 主要城市 AQI 与污染物 |
| 加密货币 | CoinGecko | 行情与涨跌幅 |
| 汇率 | open.er-api.com | 主要货币汇率 |
| ISS 追踪 | wheretheiss.at | 国际空间站实时位置 |
| Hacker News | Firebase API | 热门技术文章 |
| GitHub | GitHub API | 仓库/用户信息、趋势 |
| 翻译 | MyMemory | 多语言翻译 |

公开 API 受网络与 CORS 策略影响，部分请求可能需要通过 CORS 代理访问。

## 在线演示

**直接访问：[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)**

### 快速上手指南

1. **打开应用**：点击桌面图标，或在开始菜单中查找
2. **全局搜索**：按 `Ctrl + K` 搜索应用、文件、命令
3. **打开终端**：按 `Ctrl + T`，输入 `help` 查看命令列表
4. **文件管理**：按 `Ctrl + E` 打开文件管理器
5. **切换工作区**：按 `Ctrl + Alt + 1-9`
6. **关闭/最小化窗口**：`Ctrl + Q` / `Ctrl + M`

## 快速开始

### 环境要求

- Node.js >= 20
- npm

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 浏览器打开 http://localhost:5173/WebLinuxOS/
```

### 构建生产版本

```bash
npm run build        # 构建到 ../dist
npm run preview      # 本地预览生产构建
```

## 终端命令速查

```bash
# 系统信息
whoami / hostname / uname / date / uptime

# 文件操作
ls / cd / pwd / cat / touch / mkdir / rm / cp / mv / tree / find / grep

# 网络与 API
weather [城市]        # 实时天气
crypto                # 加密货币行情
news [关键词]          # Hacker News
translate <lang> <text> # 翻译
github <repo>         # GitHub 仓库信息

# 开发工具
json / base64 / hash / uuid / regex / calc / timestamp / jwt / hex

# 系统操作
open <应用名> / launch [应用ID] / worldpulse / system-status

# 其他
help                  # 查看完整命令列表
```

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript 5 |
| 构建 | Vite 8 |
| 状态管理 | Zustand 5 |
| 图标 | Lucide React |
| Markdown | Marked |
| 样式 | CSS Variables + 全局样式 |

## 项目结构

```
web-linux/
├── src/
│   ├── apps/              # 应用组件
│   │   ├── terminal/      # 终端命令系统
│   │   ├── Terminal.tsx
│   │   ├── FileManager.tsx
│   │   └── ...
│   ├── components/
│   │   ├── desktop/       # 桌面核心组件
│   │   │   ├── Window.tsx
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Desktop.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── StartMenu.tsx
│   │   └── ...
│   ├── store.tsx          # Zustand 全局状态
│   ├── store/
│   │   ├── fileUtils.ts   # 文件系统工具
│   │   └── storageUtils.ts # 本地存储工具
│   ├── apps.tsx           # 应用注册表
│   ├── App.tsx            # 应用入口
│   └── utils/
│       └── apiCache.ts    # API 缓存
├── public/                # 静态资源
├── index.html
├── vite.config.ts
└── package.json
```

## 核心设计

- **组件懒加载**：`React.lazy` 按需加载应用，减少初始包体积
- **代码分割**：Vite 按应用、组件、依赖分包
- **状态持久化**：localStorage 保存文件、主题、设置、窗口布局等
- **API 缓存**：内置缓存层减少重复请求
- **主题系统**：CSS 变量驱动，支持深浅色切换

## 浏览器支持

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 110+ |
| Firefox | 115+ |
| Safari | 16+ |
| Edge | 110+ |

## 贡献指南

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/your-feature`
3. 提交更改：`git commit -m "描述你的改动"`
4. 推送到分支：`git push origin feature/your-feature`
5. 开启 Pull Request

提交前请确保：

```bash
npm run typecheck   # TypeScript 类型检查
npm run lint        # ESLint 检查
npm run build       # 生产构建
```

## 添加新应用

1. 在 `src/apps/` 中创建应用组件
2. 在 `src/apps.tsx` 中注册（确保 ID 唯一）
3. 在 `src/components/desktop/WindowManager.tsx` 中添加懒加载映射

## 添加终端命令

1. 在 `src/apps/terminal/` 中创建或修改命令文件
2. 使用 `registerCommand` 注册命令
3. 在 `src/apps/terminal/index.ts` 中导入

## 许可证

本项目基于 MIT 许可证开源，详见 [LICENSE](LICENSE) 文件。

## 致谢

感谢以下开源项目与免费 API 服务：

- [React](https://react.dev/) / [TypeScript](https://www.typescriptlang.org/) / [Vite](https://vitejs.dev/) / [Zustand](https://github.com/pmndrs/zustand)
- [Lucide Icons](https://lucide.dev/) / [Marked](https://marked.js.org/)
- [Open-Meteo](https://open-meteo.com/) / [CoinGecko](https://www.coingecko.com/) / [Hacker News](https://news.ycombinator.com/) / [GitHub API](https://docs.github.com/en/rest) / [wheretheiss.at](https://wheretheiss.at/) / [open.er-api.com](https://www.exchangerate-api.com/)

## 更新日志

### v32.1.0 (2026-07-12)

- 增强 Web 浏览器：新增页面缩放功能（50%-200%）、网站图标显示、扩展快速访问站点列表（新增 CodePen、CodeSandbox）
- 修复图标导入问题：统一 RocketIcon 图标管理，移除重复定义，确保应用注册正确
- 优化文件系统工具：改进路径解析和缓存机制，提升文件操作性能
- 改进终端命令系统：优化命令处理逻辑，支持更多实用工具命令
- 增强系统监控：改进进程管理和资源监控界面
- 优化代码质量：修复 TypeScript 类型错误，移除未使用的变量和导入
- 改进用户体验：优化窗口管理、任务栏和开始菜单交互

### v31.0.0 (2026-07-11)

- 新增智能开发者工作台：集成代码模板库、API Mock服务、知识图谱和智能代码分析的综合开发工具
  - 代码模板库：预置5个高质量TypeScript模板，支持搜索、分类过滤、一键复制
  - API Mock服务：可视化API模拟器，支持GET/POST/PUT/DELETE/PATCH方法，可配置状态码和延迟
  - 知识图谱：7个技术知识点互联展示，支持分类标签和连接关系可视化
  - 智能代码分析：自动评估代码质量，提供复杂度、可维护性、性能、安全性指标和改进建议
- 赛博朋克科技风格UI设计：采用霓虹色调和现代交互设计，提升视觉体验
- 响应式布局优化：支持多种屏幕尺寸，提供更好的用户体验

### v30.0.0 (2026-07-11)

- 新增实时协作文档编辑器：支持 Markdown 实时编辑、版本历史管理、多用户协作模拟、自动保存功能
- 优化图标系统：统一图标管理，修复 Lucide React 图标导入错误
- 增强终端网络命令：添加 ping、ifconfig、netstat、curl、dig、hostnamectl、nslookup 等命令
- 修复构建配置：确保 GitHub Pages 部署路径正确
- 代码质量改进：修复 TypeScript 类型错误，优化命令处理函数

### v29.0.0 (2026-06-15)

- 新增智能代码助手：集成 AI 辅助编程功能
- 增强工作空间中心：优化布局和交互体验
- 新增网络速度测试工具
- 改进系统监控仪表盘

### v28.0.0 (2026-05-25)

- 新增智能开发工作台：整合开发工具和资源
- 增强终端命令系统：扩展至 150+ 命令
- 新增全球空气质量监控
- 优化性能和加载速度
