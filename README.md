# WebLinuxOS

**浏览器端 Linux 桌面环境 | Web-based Linux Desktop Environment**

[![Deploy](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS)](https://github.com/saya-ch/WebLinuxOS/stargazers)

一个完全运行在浏览器中的 Linux 桌面环境，提供完整的窗口管理、虚拟文件系统、终端模拟器和 700+ 应用程序。无需安装，打开浏览器即可使用。

A fully functional Linux desktop environment running entirely in the browser, featuring complete window management, a virtual file system, terminal emulator, and 700+ applications. No installation required.

**[在线体验 / Live Demo](https://saya-ch.github.io/WebLinuxOS/)**

![Desktop Environment](web-linux/screenshots/01-desktop.png)

---

## 功能特性 / Features

### 桌面环境

- 完整窗口管理: 拖拽、缩放、最大化/最小化、边缘吸附、四象限平铺
- 虚拟桌面: 最多 9 个独立桌面空间，支持窗口跨桌面移动
- 多主题: 深色/浅色主题切换，玻璃拟态 UI
- 全局搜索: Ctrl+Shift+K 快速启动任意应用
- 键盘快捷键: 25+ 快捷键，支持自定义
- PWA 离线支持: Service Worker 缓存，可安装到桌面
- 跨标签页同步: BroadcastChannel 实时同步状态

### 终端模拟器

- 200+ 命令，支持管道、重定向、Tab 补全
- IndexedDB 虚拟文件系统，数据持久化
- 真实 API 集成: 天气查询、翻译、汇率、加密货币行情
- JavaScript 表达式执行引擎
- 哈希计算、编解码、JSON 处理

### 内置应用

| 类别 | 代表应用 | 说明 |
|------|----------|------|
| 系统工具 | 文件管理器、终端、系统设置 | 完整的文件系统操作和系统配置 |
| 开发工具 | 代码编辑器(Monaco)、WebIDE、API 调试器 | 浏览器内的开发环境 |
| AI 工具 | AI 聊天、AI 图像生成、代码审查 | 基于 Pollinations.ai 免费 API |
| 互联网 | 天气、新闻、维基百科、GitHub 趋势 | 真实数据，非模拟 |
| 办公效率 | Markdown 编辑器、日历、任务看板、番茄钟 | 生产力工具集 |
| 多媒体 | 画图、音乐工作室、视频播放器 | Web Audio/Canvas 实现 |
| 数据工具 | 电子表格、JSON 处理、编码转换 | 数据处理和转换 |
| 游戏 | 贪吃蛇、俄罗斯方块、2048、弹球 | 休闲小游戏 |

---

## 架构 / Architecture

```
┌─────────────────────────────────────────────────┐
│                  浏览器 (Browser)                 │
├─────────────────────────────────────────────────┤
│  React 19 + TypeScript + Vite 8                 │
├──────────┬──────────┬──────────┬────────────────┤
│ Desktop  │ Window   │ Taskbar  │ Start Menu     │
│ Manager  │ Manager  │          │ & Search       │
├──────────┴──────────┴──────────┴────────────────┤
│              Zustand 状态管理                      │
├──────────┬──────────┬───────────────────────────┤
│ Virtual  │ App      │ Service Worker            │
│ File Sys │ Registry │ (PWA Cache)               │
│ (IndexedDB)│ (700+)  │                          │
├──────────┴──────────┴───────────────────────────┤
│  20+ Public APIs | Web Crypto | Web Audio       │
└─────────────────────────────────────────────────┘
```

### 技术栈

| 层 | 技术 | 版本 |
|----|------|------|
| UI 框架 | React | 19.x |
| 编程语言 | TypeScript | 6.x |
| 构建工具 | Vite | 8.x |
| 状态管理 | Zustand | 5.x |
| 代码编辑器 | Monaco Editor | 4.7.x |
| Python 运行时 | Pyodide | 0.26.x |
| 持久化存储 | IndexedDB | - |
| PWA | Service Worker | - |

---

## 快速开始 / Quick Start

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

### 常用命令

```bash
npm run dev           # 开发服务器
npm run build         # TypeScript 检查 + 生产构建
npm run typecheck     # 仅类型检查
npm run lint          # ESLint 代码检查
```

---

## API 集成 / API Integration

所有数据源均为真实公共 API，无模拟数据：

| API | 用途 |
|-----|------|
| Open-Meteo | 全球天气预报 |
| Pollinations.ai | AI 聊天和图像生成 |
| CoinGecko | 加密货币价格 |
| Hacker News | 科技新闻 |
| Wikipedia | 百科全书 |
| GitHub API | 仓库探索 |
| Frankfurter | 欧洲央行汇率 |
| Free Dictionary | 英文词典 |
| MyMemory | 多语言翻译 |
| NASA APOD | 每日天文图片 |
| Cloudflare DoH | DNS 查询 |
| Web Crypto API | 哈希和加密 |

---

## 快捷键 / Keyboard Shortcuts

| 快捷键 | 功能 |
|--------|------|
| Ctrl/Cmd+Shift+K | 全局搜索 |
| Ctrl/Cmd+T | 打开终端 |
| Ctrl/Cmd+E | 文件管理器 |
| Ctrl/Cmd+B | 浏览器 |
| Ctrl/Cmd+Shift+P | 命令面板 |
| Ctrl/Cmd+Space | AI 命令中心 |
| Alt+N | 快速笔记 |
| Ctrl/Cmd+Q | 关闭当前窗口 |
| Ctrl/Cmd+Alt+1-9 | 切换虚拟桌面 |

---

## 项目结构 / Project Structure

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # 应用组件
│   │   │   ├── terminal/      # 终端命令系统
│   │   │   ├── collab/        # 协作应用
│   │   │   ├── algorithms/    # 算法可视化
│   │   │   └── *.tsx          # 应用组件
│   │   ├── components/        # 核心 UI 组件
│   │   │   └── desktop/       # 桌面、窗口管理器
│   │   ├── store/             # Zustand + IndexedDB
│   │   ├── services/          # API 服务
│   │   ├── config/            # API 配置
│   │   └── utils/             # 工具函数
│   ├── public/                # PWA 资源
│   └── vite.config.ts         # 构建配置
└── .github/workflows/         # CI/CD 部署
```

---

## 贡献 / Contributing

欢迎贡献代码、报告问题或提出建议。

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/my-feature`
3. 提交更改: `git commit -m 'feat: add my feature'`
4. 推送分支: `git push origin feature/my-feature`
5. 创建 Pull Request

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范。

### 添加新应用

1. 在 `src/apps/` 创建 `.tsx` 组件
2. 在 `src/apps.tsx` 注册应用信息
3. 在 `src/components/desktop/WindowManager.tsx` 的 `componentMap` 中添加懒加载映射

---

## 浏览器兼容性 / Browser Compatibility

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

---

## License

[MIT](LICENSE) - Copyright (c) 2024-2026 [saya-ch](https://github.com/saya-ch)
