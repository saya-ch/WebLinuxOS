# WebLinuxOS

> 一个完全运行在浏览器中的功能性 Linux 桌面环境

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite)](https://vite.dev/)

**[在线演示](https://saya-ch.github.io/WebLinuxOS/)** | **[English](README_en.md)**

---

## 概述

WebLinuxOS 是一个完整的 Linux 桌面环境模拟器，完全运行在浏览器中，无需后端依赖。它具有完整的窗口管理系统、虚拟文件系统、带40+内置命令的终端模拟器，以及**59个预装应用程序**，涵盖系统工具、办公工具、互联网客户端、多媒体编辑器、开发工具和游戏。

每个组件都使用现代 Web 技术从零开始构建。整个桌面体验在单个页面中加载，无需服务器、安装或设置。

## 功能特点

- **窗口管理** -- 支持拖拽、调整大小、最小化、最大化和焦点管理
- **虚拟文件系统** -- 分层文件树，支持通过 CustomEvent 进行跨应用文件共享
- **终端模拟器** -- 40+ 内置命令，支持 Python 运行时（由 Pyodide 提供）
- **代码编辑器** -- 语法高亮和浏览器内实时 Python 执行
- **网页浏览器** -- 通过 iframe 加载真实网页，带导航控制
- **音乐播放器** -- 使用 Web Audio API 播放音频
- **相机** -- 实时摄像头访问，支持滤镜
- **录音机** -- 通过 MediaRecorder API 录制音频
- **屏幕录制** -- 通过 getDisplayMedia API 捕获屏幕
- **系统监控** -- 使用 Canvas 渲染实时 CPU、内存和网络图表
- **玻璃态 UI** -- 半透明面板、流畅动画和微交互
- **零后端** -- 全部在客户端运行，无需服务器

## 截图

查看 `web-linux/screenshots/` 目录获取完整的界面截图，展示桌面环境、文件管理器、终端、文本编辑器等核心功能。

## 快速开始

### 环境要求

- Node.js 18+ 和 npm 9+

### 安装

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
```

### 开发

```bash
npm run dev
```

在浏览器中打开终端显示的本地开发服务器地址。

### 生产构建

```bash
npm run build
npm run preview
```

## 应用程序

WebLinuxOS 包含 **59个应用程序**，分为七个类别。

### 系统应用 (20)

| Application | Description |
|---|---|
| File Manager | Browse and manage the virtual file system |
| Terminal | Command-line interface with 40+ commands and Python runtime |
| System Monitor | Real-time CPU, memory, and network monitoring with charts |
| System Settings | Desktop theme, wallpaper, and system configuration |
| Software Center | Browse and install available applications |
| Package Manager | Manage system packages and dependencies |
| Disk Usage Analyzer | Visualize disk space usage across directories |
| Disk Utility | Manage virtual disk partitions and storage |
| Process Monitor | View and manage running processes |
| Network Monitor | Monitor network traffic and connections |
| Firewall | Configure firewall rules and security policies |
| User Manager | Manage user accounts and permissions |
| Power Manager | Monitor power status and battery settings |
| Bluetooth Manager | Manage Bluetooth devices and connections |
| Wi-Fi Manager | Configure wireless network connections |
| Log Viewer | Browse and search system logs |
| Backup Tool | Create and restore system backups |
| Task Manager | Manage running tasks and applications |
| About | 系统信息和版本详情 |
| Help | 用户指南和文档 |

### 办公应用 (11)

| Application | Description |
|---|---|
| Text Editor | Full-featured text editing with syntax support |
| Notepad | Lightweight plain text editor |
| Calendar | Date picker and event management |
| PDF Viewer | View PDF documents |
| Spreadsheet | Create and edit spreadsheets |
| Presentation | Create and present slides |
| Contacts | Manage contact information |
| Notes | Rich-text note-taking |
| Todo List | Task tracking and management |
| Dictionary | Word definitions and lookup |
| Translator | 在不同语言之间翻译文本 |

### 互联网应用 (4)

| Application | Description |
|---|---|
| Web Browser | Browse the web with iframe-based page loading |
| Email Client | Compose and manage email messages |
| Instant Messenger | Real-time chat interface |
| Maps | 交互式地图查看器 |

### 多媒体应用 (7)

| Application | Description |
|---|---|
| Image Viewer | View and browse image files |
| Music Player | Audio playback with Web Audio API |
| Video Player | Play video files |
| Paint | Drawing and image editing canvas |
| Camera | Webcam access with live filters |
| Screen Recorder | Record screen via getDisplayMedia |
| Sound Recorder | 通过 MediaRecorder API 录制音频 |

### 工具应用 (13)

| Application | Description |
|---|---|
| Calculator | Standard and scientific calculations |
| Clock | World clock, timer, and stopwatch |
| Weather | Current conditions and forecast display |
| Password Manager | Store and manage credentials securely |
| Screenshot Tool | Capture screen regions |
| Color Picker | Select and convert color values |
| Character Map | Browse and insert Unicode characters |
| Font Viewer | Preview installed fonts |
| Magnifier | Screen magnification tool |
| Archive Manager | 创建和解压归档文件 |
| Clipboard Manager | 智能剪贴板历史记录管理 |
| Quick Commands | 常用终端命令快捷方式管理 |
| Smart Search | 全局智慧搜索，支持跨应用、文件、命令和设置搜索 |

### 开发工具 (2)

| Application | Description |
|---|---|
| Code Editor | Syntax highlighting with Python execution via Pyodide |
| Command Reference | 可搜索的终端命令文档 |

### 游戏 (2)

| Application | Description |
|---|---|
| Snake | Classic snake arcade game |
| Tetris | 经典俄罗斯方块益智游戏 |

## 架构

WebLinuxOS 采用组件驱动的架构，基于 React 19，使用 Zustand 进行集中式状态管理。桌面环境由四个核心 UI 层组成：

- **桌面** -- 渲染壁纸、桌面图标，处理右键上下文菜单
- **窗口管理器** -- 管理窗口生命周期、z-index 堆叠和焦点顺序
- **窗口** -- 独立的窗口框架，包含拖拽、调整大小、最小化、最大化和关闭控制
- **任务栏** -- 应用程序启动器、运行中的应用程序指示器和系统托盘

应用程序通过共享虚拟文件系统和通过 CustomEvent 的跨应用程序消息传递进行通信。每个应用程序都注册在中央应用程序注册表中，该注册表定义了其元数据、默认尺寸、调整大小行为以及是否允许多个实例。

## 技术栈

| 技术 | 版本 | 用途 |
|---|---|---|
| React | 19 | UI 组件框架 |
| TypeScript | 6 | 类型安全开发 |
| Zustand | 5 | 全局状态管理 |
| Vite | 8 | 构建工具和开发服务器 |
| Pyodide | - | 浏览器内 Python 运行时 |
| Web Audio API | - | 音频播放和处理 |
| MediaRecorder API | - | 音频录制 |
| getDisplayMedia API | - | 屏幕捕获 |
| Canvas API | - | 实时图表渲染 |

## 项目结构

```
web-linux/
  src/
    apps/           # 59 个应用程序组件
    components/     # 桌面、窗口、任务栏、开始菜单
    store.tsx       # Zustand 全局状态
    apps.tsx        # 应用程序注册表
    icons.tsx       # SVG 图标组件
    types.ts        # TypeScript 类型定义
    index.css       # 全局样式
    App.tsx         # 根组件
    main.tsx        # 入口点
```

## 贡献

欢迎贡献代码。开始之前请：

1. Fork 这个仓库
2. 创建一个功能分支 (`git checkout -b feature/your-feature`)
3. 提交您的更改 (`git commit -m "Add your feature"`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 打开 Pull Request

请确保您的代码通过代码检查 (`npm run lint`) 并成功构建 (`npm run build`) 后再提交。

## 许可证

[MIT](https://opensource.org/licenses/MIT)
