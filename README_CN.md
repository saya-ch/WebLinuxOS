<div align="center">

# WebLinuxOS

一个完全运行在浏览器中的 Linux 桌面环境

[在线体验](https://saya-ch.github.io/WebLinuxOS/) · [报告问题](https://github.com/saya-ch/WebLinuxOS/issues) · [功能建议](https://github.com/saya-ch/WebLinuxOS/issues)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6.svg)](https://www.typescriptlang.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev)

English | [中文](README_CN.md)

</div>

<p align="center">
  <img src="web-linux/screenshots/01-desktop.png" alt="WebLinuxOS 桌面" width="800" />
</p>

## 为什么选择 WebLinuxOS？

无需安装，无需后端，无需配置。WebLinuxOS 在一个浏览器标签页中提供完整的 Linux 桌面体验 — 240+ 内置应用、支持 150+ 命令的终端、虚拟文件系统、实时 API 集成，全部 100% 在客户端运行。

---

## 功能特性

### 窗口管理

- 拖拽、缩放、最小化、最大化，支持对齐辅助线
- 多显示器风格的平铺和窗口堆叠
- 最多 9 个虚拟桌面，支持快捷键切换
- 任务栏、Dock 栏和带实时指示器的系统托盘

### 虚拟文件系统

- 创建、删除、重命名、复制和移动文件与文件夹
- 所有文件操作支持撤销/重做
- 基于 localStorage 持久化的层级 JSON 结构
- 完整路径解析、权限和目录导航

### 终端模拟器

- 150+ 内置命令，覆盖文件操作、网络、系统监控和实用工具
- 管道 (`|`)、重定向 (`>` `>>` `<`)、链式 (`;` `&&` `||`) 操作符
- 后台进程 (`&`)、`jobs`、`kill`
- Tab 补全、命令历史、反向搜索 (`Ctrl+R`)
- 通过 Pyodide 提供 Python 运行时 — 在终端中直接运行 Python 3

### 实时 API 集成

| 服务 | API | 是否需要密钥 |
|------|-----|:----------:|
| 天气 | Open-Meteo / OpenWeatherMap | 否 / 可选 |
| 新闻 | Hacker News / NewsAPI | 否 / 可选 |
| 加密货币 | CoinGecko | 否 |
| GitHub | GitHub REST API | 否 |
| 汇率 | Frankfurter | 否 |
| 维基百科 | Wikipedia REST API | 否 |
| 翻译 | LibreTranslate | 否 |
| IP 地理定位 | ipapi | 否 |
| 天文每日一图 | NASA APOD | 可选 |
| 国家信息 | REST Countries | 否 |

所有集成使用免费公共端点，开箱即用。可选 API 密钥可解锁更高的请求频率和额外数据。

### 开发工具

- Web IDE Pro — 功能完整的在线编程环境
- 代码编辑器，支持语法高亮
- 在线代码运行器（通过 Pyodide 支持多语言）
- 代码游乐场、沙盒和工作室
- 代码格式化器、Diff 查看器和审查工具
- API 测试器和 REST 客户端
- 正则表达式构建器和 JSON 格式化器

### 办公与效率

- Markdown 编辑器（实时预览和幻灯片）
- 电子表格、日历和世界时钟
- 任务管理器、看板和项目规划器
- 番茄钟计时器和习惯追踪器
- 智能笔记（标签、颜色、导入/导出）
- 思维导图和演示文稿制作器

### 创意与多媒体

- 画板和绘图工具
- 音乐播放器、音乐工作室和可视化器
- 视频播放器和图片查看器
- 屏幕录制和截图工具

### 系统与实用工具

- 文件管理器、系统监控和进程管理器
- 网络监控、速度测试和 DNS 查询
- 计算器、密码管理器和二维码生成器
- 取色器、单位转换器和剪贴板管理器

### 桌面增强

- 动态壁纸系统（粒子、网络、波浪、星云效果）
- 桌面小组件（时钟、系统脉搏、天气、番茄钟、便签）
- 带优先级的通知系统
- 命令面板和全局搜索
- 亮/暗主题，支持自定义强调色

---

## 技术栈

| 层级 | 技术 |
|------|------|
| UI 框架 | React 19 |
| 语言 | TypeScript 6 |
| 构建工具 | Vite 8 |
| 状态管理 | Zustand 5 |
| Python 运行时 | Pyodide 0.26 |
| 图标 | Lucide React |
| 代码编辑器 | Monaco Editor（通过 Pyodide） |
| 存储 | localStorage |

---

## 快速开始

### 环境要求

- Node.js 18+
- npm

### 安装与运行

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

在浏览器中打开 `http://localhost:5173`。

### 生产构建

```bash
npm run build
```

输出在 `web-linux/dist/`，可部署到任何静态托管服务。

### 可选 API 密钥

在 `web-linux/` 目录下创建 `.env` 文件以启用增强功能：

```env
VITE_OPENWEATHERMAP_API_KEY=your_key
VITE_NEWSAPI_KEY=your_key
VITE_EXCHANGERATE_API_KEY=your_key
VITE_NASA_API_KEY=your_key
```

所有核心功能无需 API 密钥即可使用。

---

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/⌘ + Shift + L` | 打开应用启动器 |
| `Ctrl + Shift + T` | 打开终端 |
| `Ctrl + E` | 打开文件管理器 |
| `Ctrl + ,` | 打开设置 |
| `Ctrl + K` | 全局搜索 |
| `Ctrl + Shift + C` | 打开计算器 |
| `Ctrl + Q` | 关闭当前窗口 |
| `Ctrl + M` | 最小化当前窗口 |
| `Alt + Tab` | 切换窗口 |
| `Ctrl + 1-9` | 切换到第 N 个桌面 |
| `Ctrl + Shift + 1-9` | 将窗口移动到第 N 个桌面 |
| `F11` | 全屏切换 |

**终端快捷键**：`Ctrl+L` 清屏 · `Ctrl+C` 中断 · `Ctrl+R` 反向搜索 · `Tab` 自动补全

---

## 项目结构

```
WebLinuxOS/
└── web-linux/
    ├── src/
    │   ├── App.tsx                 # 根组件，键盘快捷键
    │   ├── apps.tsx                # 应用注册表（240+ 应用）
    │   ├── store.tsx               # Zustand 全局状态
    │   ├── types.ts                # TypeScript 类型定义
    │   ├── icons.tsx               # 图标组件
    │   ├── components/
    │   │   ├── desktop/            # 窗口管理器、任务栏、Dock、桌面
    │   │   ├── CommandPalette.tsx
    │   │   ├── NotificationSystem.tsx
    │   │   └── ...
    │   ├── apps/                   # 应用实现
    │   │   ├── terminal/           # 终端模拟器和命令
    │   │   ├── CodeEditor.tsx
    │   │   ├── FileManager.tsx
    │   │   └── ...
    │   ├── services/               # API 客户端（aiService、apiService）
    │   ├── store/                  # 虚拟文件系统、持久化工具
    │   ├── utils/                  # 辅助函数
    │   └── styles/                 # 主题样式表
    ├── screenshots/                # 项目截图
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## 部署

### GitHub Pages（自动部署）

推送到 `main` 分支 — GitHub Actions 会自动构建并部署。

### 静态托管

将 `web-linux/dist/` 上传到任意静态托管服务（Vercel、Netlify、Cloudflare Pages、S3、nginx 等）。

---

## 贡献指南

欢迎贡献代码。

1. Fork 本仓库
2. 创建功能分支：`git checkout -b feature/my-feature`
3. 进行修改
4. 验证：`npm run typecheck && npm run build`
5. 提交 Pull Request

**添加新应用：**

1. 在 `web-linux/src/apps/` 中创建组件
2. 在 `web-linux/src/apps.tsx` 中注册
3. 在 `web-linux/src/components/desktop/WindowManager.tsx` 中添加懒加载导入

---

## 浏览器支持

| 浏览器 | 版本 |
|--------|------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## 许可证

[MIT](LICENSE) — 可自由使用、修改和分发，包括商业用途。

## 致谢

- 窗口管理器、终端和虚拟文件系统为原创实现
- 灵感来源：[linux.js](https://github.com/hrtowii/linux.js)、[WebSH](https://github.com/nicedoc/web-sh)
- 壁纸来自 Unsplash 和 Pexels（CC0）
