<div align="center">

# WebLinuxOS

**浏览器中的完整Linux桌面体验**

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-live-222222?style=flat-square&logo=githubpages)](https://saya-ch.github.io/WebLinuxOS/)

[在线演示](https://saya-ch.github.io/WebLinuxOS/) · [功能特性](#功能特性) · [快速开始](#快速开始) · [架构设计](#架构设计)

</div>

---

## 项目简介

WebLinuxOS 是一个**真正可用**的浏览器操作系统，使用 React 19 和 TypeScript 构建。它不只是一个简单的模拟，而是提供了完整的桌面环境体验——窗口管理、虚拟文件系统、终端模拟器、以及超过 200 个内置应用程序，所有数据都存储在本地浏览器中。

**核心特点：**
- **真正的实用性**：集成天气API、加密货币行情、新闻聚合、翻译服务等多个公开API
- **专业级桌面体验**：完整的多工作区支持、窗口拖拽缩放、层级管理
- **丰富的开发工具**：代码编辑器、API测试工具、正则测试器、JSON格式化
- **AI智能中心**：聊天助手、编程助手、创作助手、学习导师
- **150+ 终端命令**：包括文件操作、网络查询、开发工具、趣味命令

**适用场景：**
- 学习Linux命令行环境
- 快速原型开发和测试
- 在线工具集合和API调试
- 跨设备协作和文档管理
- 教育演示和交互学习

---

## 功能特性

### 核心系统

| 功能模块 | 详细描述 |
|---------|---------|
| **窗口管理** | 支持拖拽、缩放、最小化、最大化、层级管理、动画过渡 |
| **虚拟文件系统** | 完整的文件操作，localStorage持久化，支持创建/编辑/删除 |
| **终端模拟器** | 150+命令，历史记录、自动补全、语法高亮、管道支持 |
| **多工作区** | 最多9个虚拟桌面，支持窗口跨桌面移动和快捷切换 |
| **主题系统** | 深色/浅色主题，20+预设壁纸，动态粒子背景 |
| **全局搜索** | Ctrl+K快速搜索应用、文件、命令 |
| **桌面小部件** | 实时时钟、天气、系统监控、便签、番茄钟 |

### AI智能中心 (新功能)

**v16.0新增**：集成AI智能助手，提供多种专业模式：

- **智能助手**：日常对话和一般问答
- **编程助手**：代码编写和调试建议
- **创作助手**：写作和创意内容生成
- **学习导师**：知识讲解和技能指导

**功能特点：**
- 聊天历史持久化存储
- 支持消息复制和导出
- 专业化响应模板
- 快速模式切换

### 开发工具套件

**智能开发工作台 (SmartDevFlow)** - 一体化开发工具集：

- **AI代码助手**：智能代码生成和优化建议
- **API测试**：REST API快速测试和响应查看
- **正则测试器**：实时正则表达式匹配测试
- **代码片段库**：收藏和管理常用代码片段
- **调色实验室**：颜色选择和调色板生成
- **JSON工具**：格式化、验证、YAML转换
- **工作流追踪**：开发工作流进度管理

**其他开发工具：**
- 代码编辑器（多语言语法高亮）
- 代码运行器（在线执行JS/Python）
- REST客户端
- Base64/URL编解码
- 哈希生成器（MD5/SHA-1/256/512）
- UUID生成器（v1/v4/v5）
- JWT解码器

### 生产力工具

- **文档编辑**：Markdown编辑器、预览器、转换器
- **时间管理**：番茄钟、倒计时、日历
- **项目管理**：待办清单、甘特图、看板
- **笔记系统**：便签、笔记本、知识库
- **实用工具**：计算器、单位换算、密码管理器

### 网络与信息（真实API集成）

| 应用 | API来源 | 功能说明 |
|------|----------|----------|
| 天气查询 | Open-Meteo | 全球城市实时天气、7天预报、温度湿度风速 |
| 加密货币 | CoinGecko | 前100种加密货币实时行情、24h涨跌幅 |
| 新闻聚合 | Hacker News/Dev.to/Reddit | 多源技术新闻聚合、分类搜索收藏 |
| 翻译服务 | MyMemory | 8种语言互译（中英日韩法德西俄） |
| GitHub搜索 | GitHub API | 仓库和用户信息查询、热门趋势 |
| 维基百科 | Wikimedia | 百科内容浏览和搜索 |
| IP查询 | ipapi.co | IP地理位置查询 |
| DNS查询 | Google DNS | 域名解析查询 |

### 游戏与娱乐

- **经典游戏**：贪吃蛇、俄罗斯方块、2048、记忆游戏、打砖块
- **音乐播放**：音频播放器、音乐可视化
- **多媒体**：图片查看器、视频播放器、画板
- **桌面宠物**：虚拟宠物互动系统

---

## 在线演示

**立即体验：[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)**

### 快速上手指南

1. **打开应用**：点击桌面图标或使用快捷键
2. **全局搜索**：按 `Ctrl + K` 打开应用和文件搜索
3. **终端命令**：按 `Ctrl + T` 打开终端，输入 `help` 查看所有命令
4. **文件管理**：按 `Ctrl + E` 打开文件管理器
5. **多桌面**：按 `Ctrl + Alt + 1-9` 切换虚拟桌面
6. **窗口操作**：`Ctrl + Q` 关闭窗口、`Ctrl + M` 最小化

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

# 浏览器打开 http://localhost:5173/WebLinuxOS/
```

### 构建生产版本

```bash
# 构建优化版本
npm run build

# 预览生产构建
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
tree            # 目录树
```

### API命令（真实数据）
```bash
weather [城市]          # Open-Meteo实时天气
weather-forecast [城市] # 7天天气预报
crypto                  # CoinGecko加密货币行情
crypto-gainers          # 24h涨幅榜
news [关键词]           # Hacker News新闻搜索
news-tech               # 技术新闻
translate <lang> <text> # MyMemory翻译
github <repo>           # GitHub仓库信息
github-trending         # GitHub热门仓库
dict <单词>             # 英文词典
```

### 开发工具命令
```bash
json            # JSON格式化
base64          # Base64编解码
hash            # 哈希计算
uuid            # UUID生成
regex           # 正则测试
open <应用名>   # 启动应用 (别名: app / launch)
```

### 趣味命令
```bash
joke            # 随机笑话
quote           # 名言警句
funfact         # 趣味事实
catfact         # 猫咪冷知识
flip            # 抛硬币
rps             # 石头剪刀布
```

> 输入 `help` 查看完整命令列表（150+命令）

---

## 架构设计

### 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | React + TypeScript | 19 + 5 |
| 构建 | Vite | 8 |
| 状态管理 | Zustand | 5 |
| 图标 | Lucide React | 1.23+ |
| Markdown | Marked | 18+ |
| 样式 | CSS Modules + CSS Variables | - |

### 项目结构

```
web-linux/
├── src/
│   ├── apps/                  # 应用组件（200+）
│   │   ├── terminal/          # 终端命令系统
│   │   │   ├── commands.ts    # 命令框架
│   │   │   ├── apiCommands.ts # API集成命令
│   │   │   ├── networkCommands.ts # 网络命令
│   │   │   └── ...            # 其他命令模块
│   │   ├── Terminal.tsx       # 终端应用
│   │   ├── FileManager.tsx    # 文件管理器
│   │   ├── AIChatEnhanced.tsx # AI聊天增强（新增）
│   │   └── ...                # 其他应用
│   ├── components/
│   │   ├── desktop/           # 桌面核心组件
│   │   │   ├── Window.tsx     # 窗口组件
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Desktop.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── StartMenu.tsx
│   │   └── common/
│   ├── store.ts               # Zustand全局状态
│   ├── apps.tsx               # 应用注册表
│   ├── App.tsx                # 应用入口
│   └── utils/
│   │   └ apiCache.ts          # API缓存工具
├── public/                    # 静态资源
├── index.html
├── vite.config.ts
└── package.json
```

### 核心设计特点

- **组件懒加载**：应用级别的React.lazy动态导入，按需加载减少bundle大小
- **API缓存层**：内置缓存工具，减少重复请求，提升响应速度
- **主题系统**：CSS变量驱动的主题切换，易于扩展自定义主题
- **窗口管理**：Z-index层级管理、焦点追踪、工作区隔离
- **状态持久化**：localStorage持久化，支持跨会话数据保存

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

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启Pull Request

**提交前请确保：**
- `npm run lint` 通过
- `npm run typecheck` 通过
- `npm run build` 构建成功

### 添加新应用

1. 在 `src/apps/` 中创建应用组件
2. 在 `src/apps.tsx` 中注册（唯一ID、名称、图标、分类）
3. 在 `src/components/desktop/WindowManager.tsx` 中添加懒加载

### 添加终端命令

1. 在 `src/apps/terminal/` 中创建或修改命令文件
2. 使用 `registerCommand` 注册命令
3. 在 `src/apps/terminal/index.ts` 中导入

---

## 许可证

本项目基于MIT许可证开源 - 详见 [LICENSE](LICENSE)文件。

---

## 致谢

感谢以下开源项目和免费API服务：

**API服务：**
- [Open-Meteo](https://open-meteo.com/) - 免费天气API
- [CoinGecko](https://www.coingecko.com/) - 加密货币数据API
- [Hacker News](https://news.ycombinator.com/) - 技术新闻
- [Dev.to](https://dev.to/) - 开发者社区文章
- [MyMemory](https://mymemory.translated.net/) - 翻译API
- [GitHub](https://github.com/) - GitHub API
- [ipapi.co](https://ipapi.co/) - IP地理位置

**开源项目：**
- React、TypeScript、Vite、Zustand
- Lucide Icons、Marked

---

## 更新日志

### v16.0.0 (2026-07-07)
- 新增AI聊天增强应用，支持多种专业模式
- 改进应用注册系统，优化代码结构
- 完善README文档，突出实际使用价值
- 优化GitHub Pages部署配置

### v15.3.0
- 添加SmartDevFlow一体化开发工作台
- 增加200+应用程序
- 完善150+终端命令

---

<div align="center">

**如果这个项目对你有帮助，欢迎给个 Star ⭐**

Made with ❤️ by [saya-ch](https://github.com/saya-ch)

</div>