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

WebLinuxOS 是一个在浏览器中运行的 Linux 风格桌面环境，使用 React 19 和 TypeScript 构建。它提供窗口管理、虚拟文件系统、终端模拟器以及大量内置应用，所有数据默认保存在浏览器本地存储中。

核心特点：

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

> 公开 API 受网络与 CORS 策略影响，部分请求可能需要通过 CORS 代理访问。

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

### v29.0.0 (2026-07-11)

- 新增核心工具箱应用：集成 12+ 种开发者工具（JSON 格式化、Base64 编解码、URL 编解码、哈希生成器、UUID 生成器、颜色转换、时间戳转换、正则测试、二维码生成、JSON/YAML 转换、密码生成器、文本对比）
- 新增实时信息中心应用：整合天气（Open-Meteo API）、Hacker News、加密货币（CoinGecko API）、系统状态等实时数据卡片
- 新增 Markdown 编辑器 Pro：支持实时预览、分栏编辑、工具栏快捷操作、HTML 导出、文档管理、本地存储
- 修复 WindowManager 中重复的组件注册
- 清理未使用的导入与变量，确保 TypeScript 编译通过

### v28.0.0 (2026-07-10)

- 新增工作空间中心应用：集成应用快速访问、系统状态监控、实时天气（Open-Meteo API）、快捷便签、分类导航五大功能
- 优化工作空间中心 UI：渐变配色、毛玻璃效果、流畅动画、响应式布局
- 快捷便签支持本地持久化存储，多色彩便签卡片
- 修复 TypeScript 编译错误：清理未使用的导入与变量
- 新增系统标签页，快速访问系统工具
- 增强系统状态卡片，支持点击跳转至系统监视器

### v27.0.0 (2026-07-10)

- 重构 REST 客户端：新增请求历史、收藏请求、响应头展示、CORS 代理、示例请求与导出功能
- 优化 GitHub Pages 部署工作流：仅上传构建产物，减少 artifact 体积
- 修复桌面小部件中 Math.random 在渲染期间调用导致的 React 纯度警告
- 修复系统监控组件中的无用赋值 ESLint 报错
- 简化 README，提升信息密度与准确性

### v26.0.0 (2026-07-10)

- 新增 NexusAI 智能中枢与 DevForge 开发者锻造台
- 优化 Spotlight 全局搜索

### v25.0.0 (2026-07-10)

- Spotlight 全局搜索升级
- 新增 IdeaStream 灵感流应用
