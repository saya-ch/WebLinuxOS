<div align="center">

# WebLinuxOS

**运行在浏览器中的功能级 Linux 桌面环境 — 642+ 应用，零后端，真实 API**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Deploy](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions)

**[在线演示](https://saya-ch.github.io/WebLinuxOS/)** · [问题反馈](https://github.com/saya-ch/WebLinuxOS/issues) · [贡献指南](CONTRIBUTING.md)

</div>

---

## 截图

<div align="center">

![桌面环境](web-linux/screenshots/01-desktop.png)

</div>

## 核心特性

- **642+ 内置应用** — 涵盖开发、生产力、AI、数据分析、工具和游戏
- **200+ 终端命令** — 完整终端模拟器，虚拟文件系统、持久化存储、操作历史
- **20+ 公共 API 集成** — Open-Meteo、CoinGecko、Hacker News、Wikipedia 等真实数据源
- **零后端架构** — 所有逻辑在客户端运行，仅调用公共 API，可部署到任何静态托管
- **完整窗口管理** — 拖拽、缩放、边缘吸附平铺，最多 9 个虚拟桌面
- **PWA 离线支持** — Service Worker 缓存策略，可安装到桌面，支持离线使用
- **跨标签页同步** — BroadcastChannel 实时同步主题、文件系统和窗口状态
- **应用懒加载** — React.lazy + Vite 代码分割，640+ 应用按需加载

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

### 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（端口 5173） |
| `npm run build` | TypeScript 类型检查 + 生产构建 |
| `npm run typecheck` | 仅 TypeScript 类型检查 |
| `npm run lint` | ESLint 代码检查 |
| `npm run format` | Prettier 代码格式化 |

## 项目架构

### 技术栈

| 层 | 选型 |
|----|------|
| 前端框架 | React 19 + TypeScript 6 |
| 构建工具 | Vite 8 |
| 状态管理 | Zustand 5 |
| 代码编辑器 | Monaco Editor（VS Code 同款引擎） |
| Python 运行时 | Pyodide（WebAssembly） |
| 图标库 | Lucide React |
| Markdown 渲染 | Marked |

### 目录结构

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/            # 642+ 应用实现
│   │   │   ├── terminal/    # 终端命令系统（200+ 命令）
│   │   │   ├── collab/      # 协作应用（白板、文档编辑）
│   │   │   ├── algorithms/  # 算法可视化
│   │   │   └── *.tsx        # 各应用组件
│   │   ├── components/      # 核心 UI 组件
│   │   │   └── desktop/     # 桌面、窗口管理器、任务栏
│   │   ├── store/           # Zustand 状态管理、IndexedDB 持久化
│   │   ├── services/        # AI 服务、API 服务、跨标签同步
│   │   ├── config/          # API 端点配置（20+ 数据源）
│   │   ├── utils/           # 共享工具函数
│   │   ├── apps.tsx         # 应用注册表
│   │   └── store.tsx        # 全局状态存储
│   ├── public/              # PWA manifest、Service Worker
│   └── vite.config.ts       # 构建配置（50+ 代码分割块）
└── .github/workflows/       # CI/CD：自动部署到 GitHub Pages
```

## 内置应用分类

| 分类 | 代表应用 |
|------|----------|
| 开发工具 | Monaco 代码编辑器、终端模拟器、JSON 格式化器、正则可视化调试器、Git 可视化 |
| 生产力 | MarkdownNotebook 笔记本、番茄钟、看板板、电子表格、简历生成器、日历 |
| AI 与创意 | AI 聊天、AI 图像生成、AI 写作工作室、代码分析、提示词工程实验室 |
| 互联网 | Web 浏览器、天气预报、加密货币追踪、新闻阅读器、维基百科、GitHub 趋势 |
| 数据分析 | DataVerse Live 多源仪表板、高级数据可视化、实时数据监控 |
| 系统工具 | 文件管理器、系统监控器、密码管理器、网络诊断、WebSSH 终端 |
| 多媒体 | 环境音播放器、音乐工作室、画板、屏幕录制、视频播放器 |
| 游戏 | 俄罗斯方块、贪吃蛇、2048、打砖块 |

## 终端命令系统

终端基于虚拟文件系统构建，支持命令历史、Tab 补全和管道操作。主要命令类别：

| 类别 | 命令示例 |
|------|----------|
| 文件操作 | `ls`, `cd`, `cat`, `mkdir`, `rm`, `cp`, `mv`, `touch` |
| 系统信息 | `uname`, `uptime`, `top`, `df`, `free`, `whoami` |
| 文本处理 | `grep`, `sort`, `uniq`, `wc`, `head`, `tail`, `sed` |
| 网络诊断 | `ping`, `curl`, `nslookup`, `whois`, `speedtest` |
| 数据格式 | `json`, `yaml`, `base64`, `uuid`, `checksum` |
| AI 交互 | `ai`, `chat`, `translate`, `explain` |
| 系统管理 | `theme`, `wallpaper`, `history`, `alias`, `cron` |

完整命令列表请在终端中输入 `help` 查看。

## API 集成一览

所有数据源均为真实公共 API，无模拟数据：

| API | 用途 |
|-----|------|
| Open-Meteo | 全球天气预报和空气质量 |
| Pollinations.ai | AI 聊天和图像生成（免费，无需密钥） |
| DuckDuckGo | Web 搜索 |
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
| crt.sh | SSL/TLS 证书透明度日志 |
| MyMemory | 多语言实时翻译 |

## 快捷键速查表

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Shift + K` | 智能搜索 |
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
| `Ctrl/Cmd + Shift + Arrow` | 窗口边缘吸附 |

## 自定义配置

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

## 贡献指南

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解详细流程。

```bash
# 基本流程
git checkout -b feature/my-feature
git commit -m 'feat: add my feature'
git push origin feature/my-feature
```

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范编写提交信息。

## License

[MIT](LICENSE) — Copyright (c) 2024-2026 [saya-ch](https://github.com/saya-ch) and contributors
