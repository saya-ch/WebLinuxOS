<div align="center">

# WebLinuxOS

**一个完全运行在浏览器中的功能级 Linux 桌面环境**

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=flat&logo=github)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![GitHub Release](https://img.shields.io/github/v/release/saya-ch/WebLinuxOS?style=flat)](https://github.com/saya-ch/WebLinuxOS/releases)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=flat&color=blue)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/saya-ch/WebLinuxOS/deploy.yml?branch=main&style=flat&logo=github-actions)](https://github.com/saya-ch/WebLinuxOS/actions)

**[在线演示](https://saya-ch.github.io/WebLinuxOS/)** | [问题反馈](https://github.com/saya-ch/WebLinuxOS/issues) | [贡献指南](CONTRIBUTING.md) | [更新日志](CHANGELOG.md)

</div>

---

## 项目简介

大多数 Web 桌面项目只是视觉壳——能拖拽窗口，但内部功能都是摆设。WebLinuxOS 不同。每个应用都连接真实的公共 API，执行真实逻辑，产生真实输出。没有模拟数据，没有占位界面。

## 核心特点

- **640+ 内置应用** — 涵盖开发、生产力、AI、互联网、数据分析、工具和游戏
- **完整窗口管理** — 拖拽、缩放、最小化、最大化、边缘吸附平铺、最多 9 个虚拟桌面
- **200+ 终端命令** — 完整终端模拟器，支持虚拟文件系统、持久化存储和操作历史
- **零后端架构** — 所有逻辑在客户端运行，仅调用公共 API，无需服务器
- **真实 API 集成** — Open-Meteo 天气、CoinGecko 加密货币、Hacker News、Wikipedia 等 20+ 数据源

### v128 新增亮点

- **正则可视化调试器** — 实时匹配高亮、正则语法分解解释、10 个常用模板
- **JSON 树形查看器** — 可折叠/展开的交互式 JSON 浏览器，支持路径复制和搜索
- **专注番茄钟** — SVG 环形进度、Web Audio 提示音、桌面通知、任务标签
- **统一壁纸系统** — 32 款精选壁纸，壁纸画廊支持搜索过滤
- **共享工具函数库** — 浏览器信息解析、性能监控等工具函数抽离复用

## 技术栈

- **前端框架**: React 19 + TypeScript 6
- **构建工具**: Vite 8
- **状态管理**: Zustand 5
- **代码编辑器**: Monaco Editor (VS Code 同款引擎)
- **Python 运行时**: Pyodide (WebAssembly)
- **图标库**: Lucide React
- **Markdown 渲染**: Marked

## 功能概览

### 开发工具

- Monaco 代码编辑器（语法高亮、IntelliSense）
- 终端模拟器（200+ 命令）
- JSON 格式化器、正则测试器、API 客户端
- 正则可视化调试器、JSON 树形查看器
- Git 可视化、代码审查工具

### 生产力应用

- 专注番茄钟、看板板、Markdown 预览器
- 电子表格、PDF 查看器、简历生成器
- 日历、待办事项、知识管理

### AI 与创意

- AI 聊天（Pollinations.ai）、AI 图像生成
- AI 写作工作室、代码分析、提示词工程实验室
- AI 代码助手、AI 文档生成

### 互联网工具

- Web 浏览器（DuckDuckGo 搜索）
- 天气预报（Open-Meteo）、加密货币追踪（CoinGecko）
- 新闻阅读器、维基百科、GitHub 趋势

### 数据分析

- DataVerse Live 多源仪表板
- 高级数据可视化、图表工具
- 实时数据监控面板

### 系统工具

- 文件管理器、系统监控器、密码管理器
- 工作区管理器、WebSSH 终端
- 安全中心、网络诊断

### 多媒体

- 音乐工作室、音频可视化、画板
- 屏幕录制、相机、视频播放器

### 游戏

- 俄罗斯方块、贪吃蛇、2048、打砖块

## 快速开始

### 在线使用

直接访问 **[saya-ch.github.io/WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/)**，无需安装。

### 本地开发

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

开发服务器启动在 `http://localhost:5173/WebLinuxOS/`。

### 生产构建

```bash
cd web-linux
npm run build
```

构建前会自动运行 TypeScript 类型检查（`tsc -b`），要求零类型错误。

## 项目结构

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # 640+ 应用实现
│   │   │   ├── terminal/      # 终端命令系统（200+ 命令）
│   │   │   ├── collab/        # 协作应用（白板、文档编辑）
│   │   │   ├── algorithms/    # 算法可视化
│   │   │   └── *.tsx          # 各应用组件
│   │   ├── components/        # 核心 UI 组件
│   │   │   ├── desktop/       # 桌面、窗口管理器、任务栏、开始菜单、壁纸
│   │   │   └── *.tsx          # 命令面板、通知、快捷键面板
│   │   ├── store/             # Zustand 状态管理、文件工具、IndexedDB 持久化
│   │   ├── services/          # AI 服务、API 服务、剪贴板、同步
│   │   ├── config/            # API 端点配置（20+ 数据源）
│   │   ├── utils/             # 共享工具函数（浏览器信息、壁纸数据等）
│   │   ├── apps.tsx           # 应用注册表
│   │   └── store.tsx          # 全局状态存储
│   ├── public/                # 静态资源、PWA manifest、Service Worker
│   └── vite.config.ts         # 构建配置（50+ 代码分割块）
├── .github/workflows/         # CI/CD：自动部署到 GitHub Pages
└── README.md
```

## 核心功能详解

### 窗口管理器

完整的桌面窗口管理：拖拽移动、四方向缩放、双击标题栏最大化、边缘吸附平铺（左/右/上/下/四象限）。支持最多 9 个虚拟桌面，每个桌面独立壁纸设置。任务栏显示所有打开窗口，一键切换。

### 虚拟文件系统

基于 JSON 树的层级文件系统，支持完整 CRUD 操作。所有文件变更持久化到 IndexedDB（带 localStorage 降级），操作历史支持撤销/重做。内置文件类型识别、路径解析、节点搜索和排序。

### 终端模拟器

200+ 内置命令，涵盖文件操作、系统信息、网络诊断、AI 对话、API 调用、加密等。基于虚拟文件系统构建，支持命令历史、Tab 补全和管道操作。

## API 集成列表

所有数据源均为真实的公共 API，无模拟数据：

- **Open-Meteo** — 全球天气预报和空气质量
- **Pollinations.ai** — AI 聊天和图像生成（免费，无需 API 密钥）
- **DuckDuckGo** — Web 搜索（免费）
- **CoinGecko** — 加密货币价格和市值
- **Hacker News** — 科技新闻（Firebase API）
- **Wikipedia** — 百科全书文章
- **GitHub API** — 仓库探索和趋势
- **NASA APOD** — 每日天文图片
- **Frankfurter** — 欧洲央行汇率
- **TheMealDB** — 食谱数据库
- **Cloudflare DoH** — DNS over HTTPS 查询
- **Free Dictionary API** — 发音、定义、同义词
- **Web Crypto API** — SHA/HMAC/AES-GCM 哈希和加密（浏览器原生）
- **crt.sh** — SSL/TLS 证书透明度日志

## 键盘快捷键

- `Ctrl/Cmd + Shift + K` — 智能搜索
- `Ctrl/Cmd + T` — 终端
- `Ctrl/Cmd + E` — 文件管理器
- `Ctrl/Cmd + B` — 浏览器
- `Ctrl/Cmd + Shift + P` — 命令面板
- `Ctrl/Cmd + Space` — AI 命令中心
- `Alt + N` — 快速笔记
- `Ctrl/Cmd + ,` — 设置
- `Ctrl/Cmd + Q` — 关闭窗口
- `Ctrl/Cmd + Alt + 1-9` — 切换桌面
- `Ctrl/Cmd + Shift + Alt + 1-9` — 移动窗口到桌面
- `Ctrl/Cmd + Shift + Arrow` — 窗口吸附

## 开发指南

### 添加新应用

在 `src/apps/` 创建新的 `.tsx` 文件，并在 `src/apps.tsx` 中注册：

```tsx
// src/apps/MyNewApp.tsx
import React from 'react'

const MyNewApp: React.FC = () => {
  return (
    <div style={{ padding: '16px' }}>
      <h2>My New App</h2>
      <p>应用内容...</p>
    </div>
  )
}

export default MyNewApp
```

```tsx
// src/apps.tsx（添加到注册表）
{
  id: 'my-new-app',
  name: 'My New App',
  icon: 'Package',
  component: 'MyNewApp',
  category: 'development',
  description: '我的新应用',
}
```

同时在 `src/components/desktop/WindowManager.tsx` 添加懒加载导入：

```tsx
// 在 componentMap 对象中
MyNewApp: () => import('../../apps/MyNewApp'),
```

组件通过 `React.lazy` 动态导入，Vite 自动分割为独立 chunk 实现按需加载。

### 项目命令

- `npm run dev` — 启动开发服务器（端口 5173）
- `npm run build` — 类型检查 + 生产构建
- `npm run typecheck` — 仅 TypeScript 类型检查
- `npm run lint` — ESLint 代码检查
- `npm run format` — Prettier 代码格式化

## 技术亮点

- **应用懒加载** — 640+ 应用作为独立 chunk；首次加载仅加载核心框架和少量高频应用。Vite 的 `manualChunks` 精确分割 vendor 库和大型应用
- **IndexedDB 文件存储** — 虚拟文件系统基于 IndexedDB，突破 5MB localStorage 限制，同时通过自动数据迁移保持向后兼容
- **优化的系统监控** — CPU/内存/存储指标来源于真实浏览器 Performance API（`performance.memory`、`navigator.connection`、`performance.getEntriesByType`），使用缓存的 DOM 节点计数避免昂贵的全树遍历
- **跨标签页同步** — 基于 BroadcastChannel 的实时同步，支持主题、文件系统和窗口状态跨浏览器标签页同步
- **PWA 和离线支持** — Service Worker 使用 stale-while-revalidate 缓存策略，可安装到桌面，支持离线使用
- **零后端部署** — 纯静态站点；所有逻辑在客户端运行，仅调用公共 API，可部署到任何静态托管平台
- **安全头配置** — 开发和预览服务器配置了 COOP/COEP、X-Frame-Options、CSP 等安全响应头
- **共享工具函数库** — 浏览器信息解析、壁纸数据等共用逻辑抽离到 `src/utils/`，消除跨组件重复代码

## 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细指南。

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/my-feature`
3. 提交更改：`git commit -m 'feat: add my feature'`
4. 推送到分支：`git push origin feature/my-feature`
5. 创建 Pull Request

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范编写提交信息。

## 许可证

[MIT License](LICENSE) — Copyright (c) 2024-2026 saya-ch and contributors

## 致谢

感谢所有贡献者和开源社区的支持。本项目使用了以下优秀的开源库：

- [React](https://react.dev/) — 用户界面构建库
- [Vite](https://vitejs.dev/) — 下一代前端构建工具
- [Zustand](https://zustand-demo.pmnd.rs/) — 轻量级状态管理
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — 代码编辑器
- [Pyodide](https://pyodide.org/) — Python WebAssembly 运行时
- [Lucide](https://lucide.dev/) — 图标库

---

<div align="center">

**[在线体验 WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/)**

</div>
