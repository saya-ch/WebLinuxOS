# WebLinuxOS 🐧

> 完全运行在浏览器中的功能完整的 Linux 桌面操作系统模拟器

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React 19](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev/)
[![TypeScript 6](https://img.shields.io/badge/TypeScript-6-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite 8](https://img.shields.io/badge/Vite-8-646CFF.svg?logo=vite)](https://vite.dev/)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-222222.svg?logo=github)](https://pages.github.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen.svg)](CONTRIBUTING.md)

**[🚀 在线体验](https://saya-ch.github.io/WebLinuxOS/)**

---

## ✨ 核心特性

### 🖥️ 完整的桌面体验
- **多窗口管理** - 支持拖拽、调整大小、最小化、最大化、焦点管理及 z-index 堆叠
- **虚拟文件系统** - 分层文件树，通过 CustomEvent 实现跨应用文件共享
- **高级终端模拟器** - 60+ 内置命令，支持 Python 运行时（Pyodide）
- **多桌面支持** - 最多 9 个虚拟桌面，轻松切换
- **玻璃态 UI** - 半透明面板、流畅动画和精致微交互

### 🎨 丰富的应用程序生态
- **56 个预装应用** 涵盖系统工具、办公软件、互联网工具、多媒体编辑、开发工具和游戏
- **代码编辑器** - 语法高亮 + 浏览器内 Python 执行
- **Web 浏览器** - 基于 iframe 的真实网页加载
- **音乐播放器** - Web Audio API 音频播放
- **实时系统监控** - CPU、内存、网络实时图表

### 🔧 技术亮点
- **零后端** - 完全客户端运行，无需服务器
- **响应式设计** - 适配各种屏幕尺寸
- **无障碍支持** - 完整的 ARIA 标签和键盘导航
- **深色/浅色主题** - 随时切换
- **60+ 终端命令** - 包括趣味 ASCII 艺术工具

## 🚀 快速开始

### 环境要求

- Node.js 18+ 和 npm 9+

### 安装

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
```

### 开发模式

```bash
npm run dev
```

在浏览器中打开显示的本地开发服务器 URL。

### 生产构建

```bash
npm run build
npm run preview
```

### 部署到 GitHub Pages

```bash
npm run deploy
```

## 🎮 应用程序概览

WebLinuxOS 包含 **56 个应用程序**，分为 7 个类别。

### 🖥️ 系统工具 (20个)

| 应用程序 | 描述 |
|---|---|
| 文件管理器 | 浏览和管理虚拟文件系统 |
| 终端 | 命令行界面，支持 60+ 命令和 Python 运行时 |
| 系统监视器 | 实时 CPU、内存和网络监控图表 |
| 系统设置 | 桌面主题、壁纸和系统配置 |
| 软件中心 | 浏览和安装可用应用程序 |
| 软件包管理器 | 管理系统包和依赖 |
| 磁盘使用分析器 | 可视化目录磁盘空间使用情况 |
| 磁盘工具 | 管理虚拟磁盘分区和存储 |
| 进程监视器 | 查看和管理运行中的进程 |
| 网络监视器 | 监控网络流量和连接 |
| 防火墙 | 配置防火墙规则和安全策略 |
| 用户管理 | 管理用户账户和权限 |
| 电源管理 | 监控电源状态和电池设置 |
| 蓝牙管理器 | 管理蓝牙设备和连接 |
| Wi-Fi 管理器 | 配置无线网络连接 |
| 日志查看器 | 浏览和搜索系统日志 |
| 备份工具 | 创建和恢复系统备份 |
| 任务管理器 | 管理运行中的任务和应用程序 |
| 关于系统 | 系统信息和版本详情 |
| 帮助 | 用户指南和文档 |

### 📝 办公工具 (11个)

| 应用程序 | 描述 |
|---|---|
| 文本编辑器 | 功能完整的文本编辑，支持语法高亮 |
| 记事本 | 轻量级纯文本编辑器 |
| 日历 | 日期选择器和事件管理 |
| PDF 查看器 | 查看 PDF 文档 |
| 电子表格 | 创建和编辑电子表格 |
| 演示文稿 | 创建和展示幻灯片 |
| 通讯录 | 管理联系人信息 |
| 笔记 | 富文本笔记 |
| 待办事项 | 任务跟踪和管理 |
| 字典 | 单词释义和查询 |
| 翻译器 | 文本语言间翻译 |

### 🌐 互联网工具 (4个)

| 应用程序 | 描述 |
|---|---|
| Web 浏览器 | 基于 iframe 的网页浏览 |
| 邮件客户端 | 编写和管理电子邮件 |
| 即时通讯 | 实时聊天界面 |
| 地图 | 交互式地图查看器 |

### 🎨 多媒体工具 (7个)

| 应用程序 | 描述 |
|---|---|
| 图片查看器 | 查看和浏览图片文件 |
| 音乐播放器 | Web Audio API 音频播放 |
| 视频播放器 | 播放视频文件 |
| 画图 | 绘图和图像编辑画布 |
| 摄像头 | 摄像头访问和实时滤镜 |
| 屏幕录制器 | 通过 getDisplayMedia 录制屏幕 |
| 录音机 | 通过 MediaRecorder API 录制音频 |

### 🛠️ 实用工具 (10个)

| 应用程序 | 描述 |
|---|---|
| 计算器 | 标准计算和科学计算 |
| 时钟 | 世界时钟、计时器和秒表 |
| 天气 | 当前天气状况和预报显示 |
| 密码管理器 | 安全存储和管理凭据 |
| 截图工具 | 捕获屏幕区域 |
| 取色器 | 选择和转换颜色值 |
| 字符映射表 | 浏览和插入 Unicode 字符 |
| 字体查看器 | 预览已安装字体 |
| 放大镜 | 屏幕放大工具 |
| 归档管理器 | 创建和解压归档文件 |

### 💻 开发工具 (2个)

| 应用程序 | 描述 |
|---|---|
| 代码编辑器 | 语法高亮，通过 Pyodide 执行 Python |
| 命令参考 | 可搜索的终端命令文档 |

### 🎮 游戏 (2个)

| 应用程序 | 描述 |
|---|---|
| 贪吃蛇 | 经典贪吃蛇街机游戏 |
| 俄罗斯方块 | 经典俄罗斯方块益智游戏 |

## 🎹 键盘快捷键

### 全局快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl+Shift+L` | 打开启动器 |
| `Ctrl+Shift+K` | 打开智慧搜索 |
| `Ctrl+Shift+S` | 打开设置 |
| `Ctrl+Shift+F` | 打开文件管理器 |
| `Ctrl+Shift+T` | 打开终端 |
| `Ctrl+Shift+M` | 打开音乐播放器 |
| `Ctrl+Shift+W` | 打开天气 |
| `Ctrl+Shift+O` | 打开笔记 |
| `F11` | 全屏/还原窗口 |
| `PrintScreen` | 打开截图工具 |

### 窗口管理

| 快捷键 | 功能 |
|---|---|
| `Ctrl+M` | 最小化窗口 |
| `Ctrl+Shift+M` | 最大化/还原窗口 |
| `Ctrl+W` | 关闭窗口 |
| `Ctrl+Q` | 关闭窗口 |
| `Alt+Tab` | 切换窗口 |
| `Ctrl+Alt+Tab` | 切换窗口（反向） |

### 终端快捷键

| 快捷键 | 功能 |
|---|---|
| `Ctrl+L` | 清空终端 |
| `Ctrl+C` | 中断命令 |
| `Ctrl+D` | 退出终端 |
| `↑/↓` | 浏览命令历史 |
| `Tab` | 自动补全 |
| `Ctrl+F` | 搜索命令历史 |

## 🏗️ 系统架构

WebLinuxOS 采用基于 React 19 的组件驱动架构，通过 Zustand 进行集中式状态管理。桌面环境由四个核心 UI 层组成：

- **Desktop（桌面）** - 渲染壁纸、桌面图标，处理右键上下文菜单
- **Window Manager（窗口管理器）** - 管理窗口生命周期、z-index 堆叠和焦点顺序
- **Window（窗口）** - 独立窗口外壳，带有拖拽、调整大小、最小化、最大化和关闭控件
- **Taskbar（任务栏）** - 应用程序启动器、运行中的应用程序指示器和系统托盘

应用程序通过共享虚拟文件系统和基于 CustomEvent 的跨应用程序消息传递进行通信。每个应用程序都在中央应用注册表中注册，定义了其元数据、默认尺寸、调整大小行为以及是否允许多个实例。

## 🛠️ 技术栈

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

## 📁 项目结构

```
web-linux/
  src/
    apps/           # 56 个应用程序组件
    components/      # Desktop、Window、Taskbar、StartMenu
    store.tsx       # Zustand 全局状态
    apps.tsx        # 应用程序注册表
    icons.tsx       # SVG 图标组件
    types.ts        # TypeScript 类型定义
    index.css       # 全局样式
    App.tsx         # 根组件
    main.tsx        # 入口点
```

## 🤝 贡献指南

欢迎贡献！开始之前：

1. Fork 仓库
2. 创建功能分支 (`git checkout -b feature/your-feature`)
3. 提交更改 (`git commit -m "Add your feature"`)
4. 推送到分支 (`git push origin feature/your-feature`)
5. 打开 Pull Request

请确保在提交之前，您的代码通过 linting（`npm run lint`）并且成功构建（`npm run build`）。

## 📄 许可证

[MIT](https://opensource.org/licenses/MIT)

---

**制作 with ❤️ 和 React**
