# WebLinuxOS - 现代化Web桌面操作系统

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![React](https://img.shields.io/badge/React-18.2.0-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178c6)
![Vite](https://img.shields.io/badge/Vite-5.0.0-646cff)

一个功能丰富的基于Web的Linux风格桌面操作系统环境，提供现代化的用户界面和丰富的应用程序生态系统。

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) | [英文文档](#weblinuxos)

## 核心特性

### 桌面环境
- **多桌面支持**：支持多个虚拟桌面，可自由切换
- **窗口管理**：支持拖拽、缩放、最小化、最大化、关闭等完整的窗口操作
- **实时壁纸**：支持动态壁纸效果，打造沉浸式视觉体验
- **启动器**：通过Super键快速访问所有应用程序
- **任务栏**：显示打开的窗口和运行中的应用程序
- **右键菜单**：桌面右键快捷菜单，提供常用操作

### 应用程序生态

#### 系统工具
- 文件管理器、终端、文本编辑器、代码编辑器
- 系统监视器、任务管理器、进程监视器
- 设置中心、用户管理、防火墙配置
- 磁盘使用分析器、软件包管理器

#### 办公工具
- 日历、时钟、计算器、便签
- Markdown编辑器、演示文稿、电子表格
- 思维导图、白板、任务看板
- 翻译器、字典、通讯录

#### 开发工具
- API测试器、代码片段管理
- JSON格式化、正则表达式测试
- GitHub趋势追踪、命令参考
- 代码差异查看器、代码运行器

#### 多媒体
- 音乐播放器、视频播放器、图片查看器
- 画图工具、摄像头、录音机
- 屏幕录制器、音乐可视化

#### 实用工具
- 天气应用、密码生成器、密码管理器
- 二维码生成器、单位转换器、汇率转换
- 剪贴板管理器、快捷命令
- 专注模式、番茄工作法、待办事项

#### 趣味应用
- 贪吃蛇游戏、俄罗斯方块、虚拟宠物
- 粒子系统、壁纸画廊
- 便签墙、灵感速记

### 技术栈

- **前端框架**：React 18.2.0
- **语言**：TypeScript 5.3.3
- **构建工具**：Vite 5.0.0
- **状态管理**：Zustand
- **图标库**：Lucide React
- **样式**：CSS3（支持CSS变量和现代特性）

## 快速开始

### 安装依赖

```bash
cd web-linux
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

### 部署到 GitHub Pages

```bash
npm run deploy
```

## 项目结构

```
web-linux/
├── public/
│   └── fonts/              # 字体文件
├── src/
│   ├── apps/               # 应用程序组件
│   ├── components/         # 通用组件
│   ├── utils/              # 工具函数
│   ├── types/              # TypeScript类型定义
│   ├── App.tsx             # 主应用组件
│   ├── main.tsx            # 入口文件
│   ├── store.tsx           # 状态管理
│   ├── apps.tsx            # 应用程序注册表
│   └── index.css           # 全局样式
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Super` | 打开启动器 |
| `Alt + Tab` | 切换窗口 |
| `Alt + F4` | 关闭窗口 |
| `Super + D` | 显示桌面 |
| `Ctrl + Alt + ←/→` | 切换虚拟桌面 |
| `Super + L` | 锁屏 |
| `F11` | 全屏模式 |
| `Super + T` | 打开终端 |
| `Super + E` | 打开文件管理器 |
| `Super + B` | 打开浏览器 |
| `Super + K` | 智能搜索 |

## API 集成

WebLinuxOS 集成以下公共 API：

- **Open-Meteo** - 天气数据
- **ipapi.co** - IP 地理位置
- **Cloudflare DNS** - DNS 查询
- **GitHub API** - GitHub 趋势仓库
- **NewsAPI** - 新闻数据

## 设计理念

WebLinuxOS 致力于提供：
- **现代化视觉设计**：采用玻璃拟态和渐变效果，打造精致的视觉体验
- **流畅动画**：精心设计的过渡动画，提升交互体验
- **响应式布局**：自适应不同屏幕尺寸
- **高性能**：使用 React 和 Zustand 确保流畅运行
- **可扩展性**：模块化的应用程序架构，易于扩展

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License - 请参阅 LICENSE 文件了解详情

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 致谢

- [Lucide Icons](https://lucide.dev/) - 优秀的图标库
- [Open-Meteo](https://open-meteo.com/) - 天气数据 API
- 所有开源库的贡献者

---

# WebLinuxOS

A complete Linux desktop environment running in the browser.

## Overview

WebLinuxOS is a feature-rich web-based Linux desktop environment that provides:

- Complete desktop experience with multi-window management and virtual desktops
- Virtual file system with persistent storage and file operations
- Feature-rich terminal with 80+ commands and Python 3 runtime support
- 80+ pre-installed applications covering development, office, entertainment, and utilities
- Real API integrations for practical network tools
- Activity tracking and productivity insights
- Dark/Light theme support

## Key Features

### Desktop Environment
- Multi Virtual Desktops (up to 4)
- Window Management (drag, resize, minimize, maximize, close)
- Right-click Context Menu
- Dynamic Wallpapers
- Dark/Light Theme
- Global Shortcuts
- Activity Tracking

### Terminal Emulator
- 80+ built-in commands
- Python 3 runtime (Pyodide)
- Command history and auto-completion
- Fun commands (cowsay, fortune, sl, matrix)
- Text processing tools
- System monitoring commands

### Applications (80+)

**System Tools**: File Manager, Terminal, System Monitor, Settings, Software Center, Disk Analyzer, Task Manager, Process Monitor, Network Monitor, Firewall, User Manager, Backup Tool, Archive Manager, System Dashboard, Performance Monitor, Log Viewer

**Development**: Code Editor, Code Playground, Code Studio, API Tester, JSON Formatter, Regex Tester, GitHub Trending, Code Snippets Manager, Data Visualization, Quick Commands, Command Reference, Task Automation

**Office**: Text Editor, Markdown Editor, Spreadsheet, Presentation, Calendar, Todo List, Notes, Mind Map, Sticky Notes Wall, Kanban Board, Project Manager, Task Dashboard, Activity Tracker, Dictionary, Translator, Character Map

**Network**: Browser, IP & DNS Lookup, Weather, News Reader, Cryptocurrency Tracker, Cloud Sync, Email Client, Chat, Learning Platform

**Multimedia**: Music Player, Video Player, Paint, Image Viewer, Music Visualizer, Camera, Sound Recorder, Screen Recorder, PDF Viewer, Whiteboard

**Utilities**: Calculator, Password Manager, Pomodoro Timer, Color Picker, QR Generator, Unit Converter, Currency Converter, Voice Transcriber, Magnifier, Font Viewer, System Toolbox

**Games**: Snake, Tetris, Virtual Pet, Particle System

## Technology Stack

- React 19 - UI component framework
- TypeScript 6 - Type-safe development
- Zustand 5 - State management
- Vite 8 - Build tool
- Pyodide 0.26 - In-browser Python runtime
- Lucide React - Icon library

## Changelog

### v3.6.0 (2026-05-26)
- System Health Check application - Comprehensive system health monitoring
- Enhanced weather app with better UI and detailed forecasts
- Health score visualization with animated conical progress indicator
- Fixed ActivityTracker pure function issue
- Code quality improvements

### v3.5.0 (2026-05-26)
- Activity Tracker application - Track application usage patterns
- Learning Platform application - Interactive learning resources
- Enhanced AI Helper with code generation
- System Dashboard with comprehensive metrics

### v3.4.0 (2026-05-26)
- System Dashboard application - Integrated monitoring and statistics
- IP & DNS Lookup tool - Real API integration
- Performance Monitor application - Real-time monitoring

### v3.3.0 (2026-05-26)
- System Monitor application - Real-time CPU, memory, disk, network monitoring
- Dynamic charts for CPU and memory trends

### v3.2.0 (2026-05-26)
- IP & DNS Lookup tool integration

### v3.1.0 (2026-05-26)
- Code Snippets Manager with 16 programming languages support
- Tag categorization and full-text search
- Import/export functionality
