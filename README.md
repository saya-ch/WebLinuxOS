<div align="center">

# WebLinuxOS

**A fully functional Linux desktop environment that runs entirely in your browser.**

**一个完全运行在浏览器中的功能级 Linux 桌面环境。**

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=flat&logo=github)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![GitHub Release](https://img.shields.io/github/v/release/saya-ch/WebLinuxOS?style=flat)](https://github.com/saya-ch/WebLinuxOS/releases)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=flat&color=blue)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/saya-ch/WebLinuxOS/deploy.yml?branch=main&style=flat&logo=github-actions)](https://github.com/saya-ch/WebLinuxOS/actions)

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)** | [Report Issue](https://github.com/saya-ch/WebLinuxOS/issues) | [Contributing](CONTRIBUTING.md) | [Changelog](CHANGELOG.md)

</div>

---

## Overview / 项目概述

Most "web desktop" projects are visual shells -- windows you can drag around, but nothing inside works. WebLinuxOS is different. Every application connects to real public APIs, executes real logic, and produces real output. No mock data. No placeholder UI.

大多数"Web 桌面"项目只是视觉壳——能拖拽窗口，但内部功能都是摆设。WebLinuxOS 不同。每个应用都连接真实的公共 API，执行真实逻辑，产生真实输出。没有模拟数据，没有占位界面。

## Features / 功能亮点

- **640+ 内置应用** — 覆盖开发、生产力、AI、互联网、数据分析、生活工具、游戏等场景
- **完整窗口管理** — 拖拽、缩放、最小化、最大化、吸附分屏，最多 9 个虚拟桌面
- **200+ 终端命令** — 基于虚拟文件系统的完整终端模拟器，支持持久化存储和操作历史
- **零后端架构** — 全部逻辑在客户端运行，仅调用公共 API，无需服务器
- **真实 API 集成** — Open-Meteo 天气、CoinGecko 加密货币、Hacker News、Wikipedia 等 20+ 数据源
- **Monaco 代码编辑器** — 与 VS Code 同源引擎，支持语法高亮和智能补全
- **跨标签页同步** — 通过 BroadcastChannel 实现主题、文件、状态的实时同步
- **PWA 支持** — 离线可用，可安装到桌面

## Quick Start / 快速开始

### 在线体验

直接访问 **[saya-ch.github.io/WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/)** —— 无需安装。

### 本地开发

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

开发服务器启动后访问 `http://localhost:5173/WebLinuxOS/`。

### 生产构建

```bash
cd web-linux
npm run build
```

构建前会自动执行 TypeScript 类型检查（`tsc -b`），要求零类型错误。

## Architecture / 项目架构

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # 640+ 应用实现
│   │   │   ├── terminal/      # 终端命令系统（200+ 命令）
│   │   │   ├── collab/        # 协作应用（白板、文档编辑）
│   │   │   ├── algorithms/    # 算法可视化
│   │   │   └── *.tsx          # 各独立应用组件
│   │   ├── components/        # 核心 UI 组件
│   │   │   ├── desktop/       # 桌面、窗口管理器、任务栏、开始菜单、壁纸
│   │   │   └── *.tsx          # 命令面板、通知系统、快捷键面板等
│   │   ├── store/             # Zustand 状态管理、文件工具、持久化
│   │   ├── services/          # AI 服务、API 服务、剪贴板、IndexedDB、同步
│   │   ├── config/            # API 端点配置（20+ 数据源）
│   │   ├── apps.tsx           # 应用注册表
│   │   └── store.tsx          # 全局状态 Store
│   ├── public/                # 静态资源、PWA manifest、Service Worker
│   └── vite.config.ts         # 构建配置，50+ 代码分割 chunks
├── .github/workflows/         # CI/CD：自动部署到 GitHub Pages
└── README.md
```

**技术栈 Tech Stack：** React 19 + TypeScript 6 + Vite 8 + Zustand 5 + Monaco Editor + Pyodide

**关键架构决策：**

| 决策 | 说明 |
|------|------|
| Lazy Loading | 每个应用是独立的 Vite chunk，按需加载 |
| Virtual Filesystem | 基于 JSON 的分层文件树，存储在 localStorage，支持 undo/redo |
| Cross-tab Sync | 基于 BroadcastChannel 的跨标签页实时同步 |
| Offline-first | Service Worker + stale-while-revalidate 缓存策略 |
| Zero Backend | 全部逻辑客户端运行，仅调用公共 API |

## Core Features / 核心功能详解

### 窗口管理器

完整的桌面窗口管理体验：拖拽移动、四向缩放、双击标题栏最大化、边缘吸附分屏（左/右/上/下）。支持最多 9 个虚拟桌面，每个桌面可独立设置壁纸。任务栏显示所有打开的窗口，支持一键切换。

### 虚拟文件系统

基于 JSON 树的层级文件系统，支持完整的 CRUD 操作。所有文件变更持久化到 localStorage，并记录操作历史以支持 undo/redo。内置文件类型识别、路径解析、节点搜索和排序功能。

### 640+ 内置应用

| 分类 | 代表应用 |
|------|---------|
| 开发工具 | Monaco 代码编辑器、终端（200+ 命令）、JSON 工具、正则测试器、API 客户端、Git 可视化 |
| 生产力 | 番茄钟（多种变体）、看板、Markdown 编辑器、电子表格、PDF 查看器、简历生成器 |
| AI 与创意 | AI 对话（Pollinations.ai）、AI 图像生成、AI 写作工作室、代码分析、Prompt 工程实验室 |
| 互联网 | Web 浏览器（DuckDuckGo）、天气（Open-Meteo）、加密货币追踪（CoinGecko）、新闻阅读 |
| 数据分析 | DataVerse Live 多源实时仪表板、高级数据可视化、图表工具 |
| 系统工具 | 文件管理器、系统监控（真实数据）、密码管理器、工作区管理器、WebSSH |
| 多媒体 | 音乐工作室、音频可视化、画板、屏幕录制、摄像头 |
| 游戏 | 俄罗斯方块、贪吃蛇、2048、打砖块、骰子 |

### 终端模拟器

内置 200+ 命令的终端，覆盖文件操作、系统信息、网络诊断、AI 对话、API 调用、加密计算等场景。基于虚拟文件系统，支持命令历史、Tab 补全和管道操作。

### 公共 API 集成

所有数据源均为真实、公开的 API，无模拟数据：

| API | 用途 |
|-----|------|
| Open-Meteo | 全球天气预报与空气质量 |
| Pollinations.ai | AI 对话与图像生成（免费，无需 API Key） |
| DuckDuckGo | 网页搜索（免费） |
| CoinGecko | 加密货币行情与市值 |
| Hacker News | 技术新闻（Firebase API） |
| Wikipedia | 百科全书文章 |
| GitHub API | 仓库探索与 Trending |
| NASA APOD | 每日天文图片 |
| Frankfurter | 欧洲央行汇率 |
| TheMealDB | 菜谱数据库 |
| Cloudflare DoH | DNS over HTTPS 查询 |
| Free Dictionary API | 发音、释义、同义词 |
| Web Crypto API | SHA/HMAC/AES-GSM 哈希与加密（浏览器原生） |
| crt.sh | SSL/TLS 证书透明度日志 |
| SomaFM | 公共互联网广播 |

## Keyboard Shortcuts / 键盘快捷键

| 操作 | 快捷键 |
|------|--------|
| 智能搜索 | `Ctrl/Cmd + Shift + K` |
| 终端 | `Ctrl/Cmd + T` |
| 文件管理器 | `Ctrl/Cmd + E` |
| 浏览器 | `Ctrl/Cmd + B` |
| 命令面板 | `Ctrl/Cmd + Shift + P` |
| AI 命令中心 | `Ctrl/Cmd + Space` |
| 快速笔记 | `Alt + N` |
| 设置 | `Ctrl/Cmd + ,` |
| 计算器 | `Ctrl/Cmd + Shift + C` |
| 文本编辑器 | `Ctrl/Cmd + Shift + E` |
| 关闭窗口 | `Ctrl/Cmd + Q` |
| 启动器 | `Ctrl/Cmd + Shift + L` |
| 切换桌面 | `Ctrl/Cmd + Alt + 1-9` |
| 移动窗口到桌面 | `Ctrl/Cmd + Shift + Alt + 1-9` |
| 窗口吸附 | `Ctrl/Cmd + Shift + Arrow` |
| 快捷键帮助 | `Ctrl/Cmd + Shift + ?` |

## Development Guide / 开发指南

### 添加新应用

在 `src/apps/` 下创建新的 `.tsx` 文件，实现应用组件并在 `src/apps.tsx` 中注册：

```tsx
// src/apps/MyNewApp.tsx
import React from 'react';

const MyNewApp: React.FC = () => {
  return (
    <div style={{ padding: '16px' }}>
      <h2>My New App</h2>
      <p>应用内容...</p>
    </div>
  );
};

export default MyNewApp;
```

```tsx
// src/apps.tsx（在注册表中添加）
{
  id: 'my-new-app',
  name: 'My New App',
  icon: 'Package',
  component: () => import('./apps/MyNewApp'),
  category: 'development',
  description: '我的新应用',
}
```

组件通过 `React.lazy` 动态导入，Vite 会自动将其拆分为独立 chunk，实现按需加载。

### 项目命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 5173） |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run typecheck` | 仅 TypeScript 类型检查 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 代码格式化 |

## Technical Highlights / 技术亮点

- **应用懒加载** — 640+ 应用均为独立 chunk，首屏仅加载核心框架和少量高频应用，Vite 的 `manualChunks` 将 vendor 库和大型应用精确拆分
- **虚拟文件系统** — JSON 树结构存储在 localStorage，支持层级 CRUD、路径解析、搜索排序，每次变更记录历史以支持 undo/redo
- **跨标签页同步** — 通过 BroadcastChannel API 实现多标签页间的主题、文件系统、窗口状态实时同步
- **PWA 与离线支持** — Service Worker 采用 stale-while-revalidate 策略缓存静态资源，支持安装到桌面并离线使用
- **零后端部署** — 纯静态站点，所有逻辑客户端运行，仅调用公共 API，可部署到任何静态托管平台
- **安全头部** — 开发和预览服务器配置了 COOP/COEP、X-Frame-Options、CSP 等安全响应头

## License / 许可证

[MIT License](LICENSE) -- Copyright (c) Saya Ch

## Contributing / 贡献指南

欢迎贡献代码。请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细规范。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 提交变更：`git commit -m 'feat: add my feature'`
4. 推送到分支：`git push origin feature/my-feature`
5. 创建 Pull Request

建议遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范编写提交信息。
