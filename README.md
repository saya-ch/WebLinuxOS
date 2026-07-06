<div align="center">

# WebLinuxOS

### 一个运行在浏览器中的完整 Linux 桌面环境

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-live-222222?style=flat-square&logo=githubpages)](https://saya-ch.github.io/WebLinuxOS/)

**[在线演示](https://saya-ch.github.io/WebLinuxOS/) · [功能特性](#功能特性) · [快速开始](#快速开始) · [架构设计](#架构设计)**

</div>

---

## 项目简介

WebLinuxOS 是一个完全运行在浏览器中的 Web 操作系统，使用 React 19 和 TypeScript 构建。它提供了完整的桌面环境体验——窗口管理、虚拟文件系统、终端模拟器、以及超过 200 个内置应用程序。

无需安装，打开即用。所有数据都存储在本地浏览器中，隐私安全由你掌控。

> 200+ 应用 · 150+ 终端命令 · 多工作区 · 主题定制 · 实时 API 集成

---

## 功能特性

### 核心系统

| 功能 | 描述 |
|------|------|
| **窗口管理** | 拖拽、缩放、最小化、最大化、关闭，流畅的动画过渡 |
| **虚拟文件系统** | 完整的文件操作，localStorage 持久化存储 |
| **终端模拟器** | 150+ 命令，历史记录、自动补全、语法高亮 |
| **桌面环境** | 桌面图标、应用启动器、任务栏、系统托盘 |
| **多工作区** | 最多 9 个虚拟桌面，高效多任务处理 |
| **主题系统** | 深色/浅色主题，可自定义强调色 |
| **动态壁纸** | 粒子效果、渐变、动态背景 |
| **全局搜索** | 命令面板快速访问应用和文件 |
| **桌面小部件** | 时钟、天气、系统监控、便签、番茄钟 |

### 开发工具

- **代码编辑器** - 多语言语法高亮
- **终端** - 完整的命令行环境
- **JSON 格式化/验证** - 美化、压缩、Schema 校验
- **Base64 / URL 编解码** - 多种编码格式转换
- **哈希生成器** - MD5 / SHA-1 / SHA-256 / SHA-512
- **UUID 生成器** - v1 / v4 / v5
- **正则测试器** - 实时匹配测试
- **REST 客户端** - API 调试工具
- **代码沙盒** - 在线运行 JS/TS
- **Git 客户端** - 版本控制操作

### 生产力工具

- 文本编辑器 / Markdown 预览
- 计算器（基础/科学/编程模式）
- 日历与事件管理
- 待办清单与项目管理
- 番茄钟与倒计时
- 笔记管理
- 单位换算（长度/重量/面积/体积/温度）
- 密码管理器与生成器
- 剪贴板历史

### 多媒体

- 图片查看器（缩放/旋转）
- 音频播放器（播放列表）
- 视频播放器
- 画板应用
- 壁纸库
- Emoji 浏览器
- 音乐可视化

### 网络与信息

集成了多个免费公开 API，提供真实数据：

| 应用 | API 来源 | 说明 |
|------|----------|------|
| 天气 | Open-Meteo | 实时天气与预报，无需 API Key |
| 新闻 | Hacker News (Algolia) | 技术新闻聚合 |
| 加密货币 | CoinGecko | 实时行情与市场数据 |
| 股票 | Alpha Vantage | 股票行情查询 |
| IP 查询 | ipapi.co | IP 地理位置 |
| DNS 查询 | Google DNS | 域名解析查询 |
| 翻译 | MyMemory | 多语言互译 |
| 词典 | Dictionary API | 英文单词释义 |
| GitHub | GitHub API | 仓库与用户信息 |
| 维基百科 | Wikimedia | 百科内容浏览 |
| 趣味事实 | Cat Fact Ninja / FreeAPI | 随机冷知识 |
| 名言 | Quotable.io | 每日名言警句 |

### 系统工具

- 文件管理器
- 系统监视器（CPU/内存/磁盘/网络/FPS）
- 系统设置
- 磁盘使用分析
- 进程管理
- 剪贴板管理器

---

## 在线演示

立即体验：**[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)**

快速上手：
- 按 `Ctrl + K` 打开全局搜索
- 按 `Ctrl + T` 打开终端
- 按 `Ctrl + E` 打开文件管理器
- 右键点击桌面查看小部件选项
- 查看 [终端命令速查](#终端命令速查)

---

## 快速开始

### 环境要求

- Node.js >= 20
- npm / yarn / pnpm

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

浏览器打开 `http://localhost:5173/WebLinuxOS/` 即可访问。

### 构建生产版本

```bash
npm run build
```

构建产物输出到 `dist/` 目录。

### 预览生产构建

```bash
npm run preview
```

---

## 终端命令速查

### 系统命令

```bash
whoami          # 当前用户
hostname        # 主机名
date / datetime # 日期时间
uname           # 系统信息
top / ps        # 进程监控
history         # 命令历史
uptime          # 运行时间
```

### 文件命令

```bash
ls, cd, pwd     # 目录导航
cat, head, tail # 查看文件
touch, mkdir    # 创建文件/目录
rm, rmdir       # 删除
cp, mv          # 复制/移动
grep, find      # 搜索
du, df          # 磁盘使用
tree            # 目录树
```

### 网络命令

```bash
weather [城市]          # 实时天气
weather-forecast [城市] # 7天天气预报
weather-alerts [城市]   # 天气预警与健康建议
weather-uv [城市]       # 紫外线指数与防护建议
news [关键词]           # Hacker News 新闻
news-top                # Hacker News 头条
news-tech               # 技术新闻
news-ai                 # AI 相关新闻
crypto                  # 加密货币行情
crypto-alerts           # 加密货币价格预警
crypto-gainers          # 24小时涨幅榜
crypto-losers           # 24小时跌幅榜
ip / ipinfo             # IP 信息查询
dns <域名>              # DNS 查询
github <repo>           # GitHub 仓库信息
ghuser <用户>           # GitHub 用户信息
github-trending         # GitHub 热门仓库
github-stars <用户>     # GitHub 用户星标统计
translate <lang> <text> # 翻译
dict <单词>             # 英文词典
stock <代码>              # 股票行情
stock-alerts            # 主要股票行情预警
shorten <URL>           # 短链接生成
whois <域名>            # WHOIS 查询
```

### 开发工具

```bash
json            # JSON 格式化
base64          # Base64 编解码
hash            # 哈希计算
uuid            # UUID 生成
regex           # 正则测试
urlencode       # URL 编码
```

### 趣味命令

```bash
joke            # 随机笑话
quote           # 名言警句
funfact         # 趣味事实
catfact         # 猫咪冷知识
trivia          # 知识问答
flip            # 抛硬币
rps             # 石头剪刀布
random          # 随机数
```

> 输入 `help` 查看完整命令列表

---

## 架构设计

### 项目结构

```
web-linux/
├── src/
│   ├── apps/                  # 应用组件（200+）
│   │   ├── terminal/          # 终端命令系统
│   │   │   ├── commands.ts    # 命令框架
│   │   │   ├── fileCommands.ts
│   │   │   ├── systemCommands.ts
│   │   │   ├── apiCommands.ts # API 集成命令
│   │   │   └── ...
│   │   ├── Terminal.tsx
│   │   ├── FileManager.tsx
│   │   ├── Weather.tsx
│   │   └── ...
│   ├── components/
│   │   ├── desktop/           # 桌面核心组件
│   │   │   ├── Window.tsx     # 窗口组件
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Desktop.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── StartMenu.tsx
│   │   └── common/
│   ├── store.ts               # Zustand 全局状态
│   ├── apps.tsx               # 应用注册表
│   ├── App.tsx                # 应用入口
│   ├── utils/
│   │   └── apiCache.ts        # API 缓存工具
│   ├── hooks/                 # 自定义 Hooks
│   └── index.css              # 全局样式与 CSS 变量
├── public/                    # 静态资源
├── index.html
├── vite.config.ts
└── package.json
```

### 核心设计

- **状态管理**：Zustand 轻量级状态管理，支持持久化
- **代码分割**：应用级别的 React.lazy 动态导入，按需加载
- **API 缓存**：内置缓存层，减少重复请求，提升响应速度
- **主题系统**：CSS 变量驱动的主题切换
- **窗口管理**：Z-index 层级管理、焦点追踪、工作区隔离

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 状态 | Zustand 5 |
| 图标 | Lucide React |
| 样式 | CSS Modules + CSS Variables |
| Markdown | Marked |
| 部署 | GitHub Pages + Actions |

---

## 浏览器支持

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 110+ |
| Firefox | 115+ |
| Safari | 16+ |
| Edge | 110+ |

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

提交前请确保：
- `npm run lint` 通过
- `npm run typecheck` 通过
- `npm run build` 构建成功

### 添加新应用

1. 在 `src/apps/` 中创建应用组件
2. 在 `src/apps.tsx` 中注册（唯一 ID、名称、图标、分类）
3. 在 `src/components/desktop/WindowManager.tsx` 中添加懒加载

### 添加终端命令

1. 在 `src/apps/terminal/` 中创建或修改命令文件
2. 使用 `registerCommand` 注册命令
3. 在 `src/apps/terminal/index.ts` 中导入

---

## 许可证

本项目基于 MIT 许可证开源 - 详见 [LICENSE](LICENSE) 文件。

---

## 致谢

感谢以下开源项目和免费 API 服务：

- [Open-Meteo](https://open-meteo.com/) - 免费天气 API
- [CoinGecko](https://www.coingecko.com/) - 加密货币数据 API
- [Hacker News](https://news.ycombinator.com/) - 技术新闻
- [ipapi.co](https://ipapi.co/) - IP 地理位置
- [MyMemory](https://mymemory.translated.net/) - 翻译 API
- [Dictionary API](https://dictionaryapi.dev/) - 英文词典
- [Quotable](https://quotable.io/) - 名言警句
- [Cat Fact Ninja](https://catfact.ninja/) - 猫咪冷知识
- [shrtcode](https://shrtco.de/) - 短链接服务
- [Google DNS](https://dns.google/) - DNS 查询 API

---

<div align="center">

如果这个项目对你有帮助，欢迎给个 Star ⭐

Made with ❤️ by [saya-ch](https://github.com/saya-ch)

</div>
