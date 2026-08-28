# WebLinuxOS

> 一个功能丰富的基于 Web 的 Linux 桌面操作系统环境

[![Deploy Status](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS)](https://github.com/saya-ch/WebLinuxOS)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

WebLinuxOS 不是又一个"看起来像操作系统"的网页 demo。它是一个功能完整的浏览器端桌面环境，包含约 250 个真正可用的应用程序、支持 200+ 条命令的终端模拟器、由 IndexedDB 驱动的虚拟文件系统，以及通过 Pyodide 实现的 Python 运行时。所有逻辑在客户端执行，无需后端服务。

---

## Demo

**[在线体验](https://saya-ch.github.io/WebLinuxOS/)** -- 无需安装，直接打开浏览器即可使用。

![桌面环境](web-linux/screenshots/01-desktop.png)

---

## Features

### 核心桌面环境

- 完整窗口管理 — 拖拽、缩放、最大化、最小化、边缘吸附平铺
- 虚拟桌面 — 最多 9 个桌面空间，窗口可跨桌面移动
- 全局搜索 — `Ctrl/Cmd + Shift + K` 快速启动任意应用
- 多主题支持 — 深色/浅色主题切换，玻璃拟态 UI 设计
- 快捷键系统 — 丰富的键盘快捷键，支持自定义绑定
- PWA 离线支持 — Service Worker 缓存策略，可安装到桌面
- 跨标签页同步 — BroadcastChannel 实时同步主题、文件系统和窗口状态

### 应用系统

- 约 250 个内置应用 — 涵盖开发、生产力、AI、数据、系统、多媒体和游戏
- 应用懒加载 — React.lazy + Vite 代码分割，按需加载
- 窗口持久化 — 应用状态在刷新后保持

### 终端模拟器

- 200+ 命令 — 完整终端模拟器，支持管道、重定向、Tab 补全
- 虚拟文件系统 — IndexedDB 驱动的持久化存储
- 命令历史 — 支持上下箭头浏览历史命令

### 数据集成

- 20+ 公共 API — 真实数据源，无模拟数据
- 智能缓存 — 请求缓存策略，减少 API 调用
- 错误回退 — API 不可用时的优雅降级

---

## Built-in Applications

### 系统工具

| 应用 | 说明 |
|------|------|
| 文件管理器 | IndexedDB 虚拟文件系统，支持文件操作 |
| 终端 | 200+ 命令，虚拟 Linux Shell |
| 系统设置 | 主题、壁纸、快捷键配置 |
| 系统监控 | 实时 CPU/内存/网络监控 |
| 磁盘使用分析器 | 存储空间可视化 |
| 备份工具 | 系统状态导出/导入 |
| WebSSH 终端 | 远程 SSH 模拟环境 |

### 开发工具

| 应用 | 说明 |
|------|------|
| 代码编辑器 | Monaco Editor (VS Code 同款引擎) |
| 在线代码运行器 | JavaScript 实时执行 |
| WebIDE Pro | 浏览器内全栈开发环境 |
| 代码沙盒 | iframe 沙盒隔离执行 |
| JSON 格式化 | 格式化/压缩/Schema 验证 |
| 正则测试器 | 实时匹配高亮 |
| API 调试器 | HTTP 请求测试工具 |
| Git 可视化 | 提交历史可视化 |
| 算法可视化 | 排序/搜索/图遍历动画 |
| Linux 命令实验室 | 交互式命令模拟环境 |
| 代码片段管理器 | 多语言代码片段管理 |

### AI 与创意

| 应用 | 说明 |
|------|------|
| AI 聊天 | Pollinations.ai 免费 API |
| AI 图像生成 | 多种艺术风格预设 |
| AI 写作工作室 | 文章/改写/摘要/翻译 |
| AI 代码审查 | 代码质量分析与重构建议 |
| 提示词工程实验室 | AI 提示词模板库 |
| 智能翻译器 | 20+ 语言实时翻译 |

### 互联网

| 应用 | 说明 |
|------|------|
| Web 浏览器 | 内嵌网页浏览 |
| 天气预报 | Open-Meteo API 全球天气 |
| 加密货币追踪 | CoinGecko 实时行情 |
| 新闻阅读器 | Hacker News 科技头条 |
| 维基百科 | Wikipedia 文章搜索 |
| GitHub 趋势 | 开源项目探索 |
| RSS 阅读器 | 多源订阅管理 |
| 全球汇率 | Frankfurter 实时汇率 |

### 办公与生产力

| 应用 | 说明 |
|------|------|
| Markdown 编辑器 | 分屏实时预览 |
| 番茄钟 | 专注计时器 |
| 任务看板 | Kanban 任务管理 |
| 日历 | 日程规划 |
| 电子表格 | 数据表格处理 |
| 简历生成器 | 专业简历制作 |
| 知识花园 | 双向链接笔记系统 |

### 多媒体

| 应用 | 说明 |
|------|------|
| 环境音播放器 | Web Audio API 实时合成 |
| 音乐工作室 | 多轨步进编辑器 |
| 画图 | Canvas 绘图工具 |
| 视频播放器 | 本地视频播放 |
| GIF 探索器 | Giphy API 搜索 |
| 屏幕录制 | getDisplayMedia 录制 |

### 工具

| 应用 | 说明 |
|------|------|
| 计算器 | 科学计算器 |
| 密码生成器 | 强密码生成 |
| 二维码生成器 | 纯 JS 生成 |
| 单位换算 | 50+ 单位转换 |
| 时间戳转换 | Unix 时间戳互转 |
| Base64 工具 | 编解码工具 |
| 颜色选择器 | HEX/RGB/HSL 转换 |

### 游戏

| 应用 | 说明 |
|------|------|
| 贪吃蛇 | 经典贪吃蛇游戏 |
| 俄罗斯方块 | 俄罗斯方块游戏 |
| 2048 | 数字合并游戏 |
| 记忆翻牌 | 记忆配对游戏 |
| 弹球游戏 | 打砖块游戏 |
| 虚拟宠物 | 电子宠物养成 |

---

## Getting Started

### 在线使用

直接访问 **[saya-ch.github.io/WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/)**，无需安装。

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

开发服务器启动在 `http://localhost:5173/WebLinuxOS/`。

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 5173） |
| `npm run build` | TypeScript 类型检查 + 生产构建 |
| `npm run build:local` | 本地构建（不带子路径） |
| `npm run typecheck` | 仅 TypeScript 类型检查 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 代码格式化 |

### 构建部署

```bash
# 生产构建
npm run build

# 预览构建结果
npm run preview
```

---

## Tech Stack

| 层 | 选型 | 版本 |
|----|------|------|
| 前端框架 | React | 19.x |
| 编程语言 | TypeScript | 6.x |
| 构建工具 | Vite | 8.x |
| 状态管理 | Zustand | 5.x |
| 代码编辑器 | Monaco Editor | 4.7.x |
| Python 运行时 | Pyodide | 0.26.x |
| 图标库 | Lucide React | 1.23.x |
| Markdown 渲染 | Marked | 18.x |

---

## Keyboard Shortcuts

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Shift + K` | 全局搜索 |
| `Ctrl/Cmd + T` | 打开终端 |
| `Ctrl/Cmd + E` | 文件管理器 |
| `Ctrl/Cmd + B` | 浏览器 |
| `Ctrl/Cmd + Shift + P` | 命令面板 |
| `Ctrl/Cmd + Space` | AI 命令中心 |
| `Alt + N` | 快速笔记 |
| `Ctrl/Cmd + ,` | 设置 |
| `Ctrl/Cmd + Q` | 关闭当前窗口 |
| `Ctrl/Cmd + Alt + 1-9` | 切换虚拟桌面 |
| `Ctrl/Cmd + Shift + Alt + 1-9` | 移动窗口到指定桌面 |

---

## Project Structure

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # 约 250 个应用实现
│   │   │   ├── terminal/      # 终端命令系统（200+ 命令）
│   │   │   ├── collab/        # 协作应用（白板、文档编辑）
│   │   │   ├── algorithms/    # 算法可视化
│   │   │   └── *.tsx          # 各应用组件
│   │   ├── components/        # 核心 UI 组件
│   │   │   └── desktop/       # 桌面、窗口管理器、任务栏
│   │   ├── store/             # Zustand 状态管理、IndexedDB 持久化
│   │   ├── services/          # AI 服务、API 服务、跨标签同步
│   │   ├── config/            # API 端点配置（20+ 数据源）
│   │   ├── utils/             # 共享工具函数
│   │   ├── apps.tsx           # 应用注册表
│   │   └── store.tsx          # 全局状态存储
│   ├── public/                # PWA manifest、Service Worker
│   └── vite.config.ts         # 构建配置（50+ 代码分割块）
└── .github/workflows/         # CI/CD：自动部署到 GitHub Pages
```

---

## API Integration

所有数据源均为真实公共 API，无模拟数据：

| API | 用途 |
|-----|------|
| Open-Meteo | 全球天气预报和空气质量 |
| Pollinations.ai | AI 聊天和图像生成（免费，无需密钥） |
| CoinGecko | 加密货币价格和市值 |
| Hacker News | 科技新闻（Firebase API） |
| Wikipedia | 百科全书文章 |
| GitHub API | 仓库探索和趋势 |
| NASA APOD | 每日天文图片 |
| Frankfurter | 欧洲央行汇率 |
| TheMealDB | 食谱数据库 |
| Cloudflare DoH | DNS over HTTPS 查询 |
| Free Dictionary | 发音、定义、同义词 |
| Web Crypto API | SHA/HMAC/AES-GCM 哈希和加密（浏览器原生） |
| MyMemory | 多语言实时翻译 |
| ZenQuotes | 每日励志名言 |

---

## Contributing

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细流程。

### 快速开始

```bash
# Fork 并克隆仓库
git clone https://github.com/your-username/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 创建特性分支
git checkout -b feature/my-feature

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 添加新应用

1. 在 `src/apps/` 创建新的 `.tsx` 文件
2. 在 `src/apps.tsx` 注册应用信息
3. 在 `src/components/desktop/WindowManager.tsx` 的 `componentMap` 中添加懒加载导入

```tsx
// src/apps/MyNewApp.tsx
const MyNewApp: React.FC = () => {
  return <div style={{ padding: '16px' }}>应用内容...</div>
}
export default MyNewApp
```

```tsx
// src/apps.tsx 注册
{
  id: 'my-new-app',
  name: 'My New App',
  icon: 'Package',
  component: 'MyNewApp',
  category: 'development',
  description: '应用描述',
}
```

组件通过 `React.lazy` 动态导入，Vite 自动分割为独立 chunk。

### 添加新终端命令

在 `src/apps/terminal/` 对应的命令文件中添加命令定义，命令会自动注册到终端系统。

### 提交规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范编写提交信息：

```bash
git commit -m 'feat: add my feature'
git commit -m 'fix: resolve issue'
git commit -m 'docs: update readme'
```

---

## Browser Compatibility

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

Web Audio API 和 IndexedDB 要求现代浏览器支持。建议使用最新版 Chrome 以获得最佳体验。

---

## License

[MIT](LICENSE) -- Copyright (c) 2024-2026 [saya-ch](https://github.com/saya-ch) and contributors
