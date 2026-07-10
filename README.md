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

WebLinuxOS 是一个**真正可用**的浏览器操作系统，使用 React 19 和 TypeScript 构建。它不只是一个简单的模拟，而是提供了完整的桌面环境体验——窗口管理、虚拟文件系统、终端模拟器、以及超过 **250 个内置应用程序**，所有数据都存储在本地浏览器中。

**核心特点：**
- **真正的实用性**：集成天气API、加密货币行情、新闻聚合、翻译服务、空气质量等多个公开API，提供真实数据
- **Spotlight 全局智能搜索**：v25 旗舰升级，将搜索、计算、颜色解析、时间戳转换、网页快捷搜索、快捷操作整合到统一的命令面板
- **IdeaStream 灵感流**：v25 新增应用，极简的"意识流"美学，快速捕捉想法、自动解析标签、按颜色分级、一键导出 Markdown
- **WorldPulse 全球脉搏**：v24 旗舰应用全面升级，"任务控制中心"风格的实时全球情报仪表盘
  - 4大分类标签页：全部/金融/环境/科技，信息浏览更高效
  - 12+数据卡片：加密货币、全球天气、空气质量、ISS位置、汇率、GitHub趋势、Hacker News、世界时钟等
  - 接入7个真实公开API，每个卡片独立刷新周期
  - 空气质量监测：4个主要城市实时AQI，6级污染分级
  - GitHub热门仓库：实时展示全球热门开源项目
- **DevKit 开发者工具箱**：v24 新增9合1专业开发工具集
  - JSON/Base64/URL编解码、哈希生成、UUID生成
  - 正则表达式测试器、颜色转换器、Markdown预览
  - 时间戳转换工具，现代简洁的侧边栏导航设计
- **智能综合仪表盘**：一站式信息中心，集成实时天气、加密货币行情、每日名言、冷知识、时间管理等功能模块
- **生产力中心**：番茄钟、待办事项、习惯追踪、统计数据等一体化效率工具，提升工作效率
- **知识探索中心**：国家数据查询、冷知识、名言警句、百科等知识宝库，探索世界增长见识
- **AI智能中心**：AI Code Companion 提供代码生成、解释、调试、优化、测试一体化解决方案
- **NexusAI 智能中枢**：多模式AI助手，支持智能问答、代码助手、翻译专家、写作助手、创意激发、概念解释六大模式
- **DevForge 开发者锻造台**：8合1专业开发工具集，JSON格式化、Base64编解码、哈希生成、时间戳转换、颜色工具、二维码生成、正则测试、UUID生成
- **太空探索专业版**：集成NASA APOD、ISS实时追踪、近地天体监测、太空百科等功能
- **专业级桌面体验**：完整的多工作区支持、窗口拖拽缩放、层级管理、快捷键系统
- **丰富的开发工具**：代码编辑器、API测试工具、正则测试器、JSON格式化、性能分析器
- **150+ 终端命令**：包括文件操作、网络查询、开发工具、趣味命令，支持管道操作；新增 `worldpulse` 启动器和 `launch` 全局应用启动器
- **10种桌面小部件**：实时时钟、天气、空气质量、系统监控、便签、番茄钟、每日诗词等

**适用场景：**
- **在线开发环境**：无需安装即可进行代码开发、测试和调试
- **学习Linux命令行**：完整的终端环境，包含真实命令执行
- **API开发测试**：集成API测试工具，支持REST API快速测试
- **在线工具集合**：超过250个实用工具，满足各种开发需求
- **教育演示平台**：交互式学习环境，适合教学和演示
- **跨设备协作**：浏览器中运行，随时随地访问工作环境

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
| **桌面小部件** | 实时时钟、天气、空气质量、系统监控、便签、番茄钟、每日诗词、快捷启动、音乐播放器 |

### AI智能中心 (新功能)

**NexusAI 智能中枢 (新增)** - 多模式一体化AI助手：

- **六大专业模式**：智能问答、代码助手、翻译专家、写作助手、创意激发、概念解释
- **智能问答**：通用问答、知识查询、创意建议，覆盖各领域问题
- **代码助手**：代码生成、解释、调试、优化，支持多种编程语言
- **翻译专家**：多语言互译，支持中英日韩法德西俄等主流语言
- **写作助手**：文章润色、文案创作、邮件撰写，提升写作效率
- **创意激发**：头脑风暴、灵感发散、创意构思，打破思维局限
- **概念解释**：复杂概念通俗化讲解，深入浅出易于理解
- **Markdown 渲染**：支持 Markdown 格式输出，代码高亮、列表、标题等
- **对话历史**：完整对话记录，支持上下文理解
- **一键复制**：快速复制AI回复内容

**v17.0新增**：AI Code Companion - 一体化智能编程助手

- **代码生成**：描述功能需求，自动生成完整代码
- **代码解释**：详细解释代码逻辑，帮助理解复杂代码
- **代码调试**：识别bug并提供修复方案
- **性能优化**：分析性能瓶颈，提供优化建议
- **测试生成**：自动生成单元测试，覆盖边界条件

### WorldPulse 全球脉搏 (v24 旗舰应用)

**v24.0 全面升级**：实时全球情报仪表盘 —— 让 WebLinuxOS 拥有实际信息中心价值，而非仅是一个桌面模拟。

采用"任务控制中心/Bloomberg 终端"美学，以网格化布局聚合 12+ 个数据卡片，每个卡片接入真实公开 API 并按数据特性设置独立刷新周期。支持 4 大分类标签页（全部/金融/环境/科技），信息浏览更高效。

| 卡片 | 数据源 | 刷新周期 | 功能 |
|------|--------|----------|------|
| 加密货币市场 | CoinGecko | 60s | BTC/ETH/SOL/BNB/XRP/ADA 前6名实时行情、24h涨跌幅、市值 |
| 全球天气 | Open-Meteo | 5min | 上海/北京/东京/纽约/伦敦/巴黎/悉尼 7城市实时温度、天气码、风速 |
| 空气质量监测 | Open-Meteo Air Quality | 10min | 北京/上海/东京/伦敦 4城市实时AQI、PM2.5/PM10/O3/NO2，6级分级 |
| ISS 实时位置 | wheretheiss.at | 5s | 国际空间站经纬度、海拔、速度，叠加在等距圆柱投影世界地图上 |
| 全球汇率 | open.er-api.com | 30min | USD 兑 CNY/EUR/JPY/GBP/HKD/AUD 6大货币实时汇率 |
| Hacker News 热榜 | Firebase API | 10min | 前6名热门文章标题、评分、评论数，一键跳转 |
| GitHub 热门仓库 | GitHub API | 30min | 全球热门开源项目，语言、Star、Fork数，一键跳转 |
| 世界时钟 | 系统时区 | 1s | 8大时区实时时间，工作日/休市状态提示，周几显示 |
| 每日开发者语录 | 内置精选 | 启动随机 | 15+ 编程大师名言随机展示 |
| 冷知识 | 内置精选 | 启动随机 | 10+ 趣味冷知识 |
| 数据源健康状态 | 综合判定 | 30s | 7个API在线状态、最近更新时间、错误率监控 |

**工程亮点：**
- `fetchWithTimeout` 统一超时与错误处理，单卡片故障不影响其他卡片
- 骨架屏 shimmer 动画、脉冲环标记 ISS 位置、闪烁高亮数据更新
- 响应式 12 列网格，自动适配窗口缩放
- 终端输入 `worldpulse` 一键启动，已运行时自动聚焦到前台
- 分类标签页系统，按主题筛选信息卡片

**核心功能：**
- 支持10种主流编程语言（JavaScript、TypeScript、Python、Java、C++、Go、Rust、PHP、Ruby、Swift）
- 性能分析：时间复杂度、空间复杂度、瓶颈识别
- 改进建议：最佳实践、代码优化、安全增强
- 历史记录：保存最近查询，快速重用
- 一键复制：快速复制生成的代码

**其他AI应用：**
- AI聊天助手：日常对话和一般问答
- AI编程助手：代码编写和调试建议
- AI创作助手：写作和创意内容生成
- AI学习导师：知识讲解和技能指导

### 开发工具套件

**DevForge 开发者锻造台 (新增)** - 8合1专业开发工具集，现代简洁的侧边栏导航设计：

- **JSON 格式化**：格式化、压缩、验证，实时错误提示，一键复制
- **Base64 编解码**：支持中英文等 Unicode 字符，编码解码双向转换
- **哈希生成器**：MD5、SHA-1、SHA-256、SHA-512 等多种哈希算法
- **时间戳转换**：Unix 时间戳与日期互转，实时显示当前时间戳
- **颜色工具**：HEX/RGB/HSL 互转，可视化颜色选择器，HSL滑块调节
- **二维码生成**：自定义内容生成二维码，支持一键下载
- **正则表达式测试器**：实时高亮匹配，显示匹配位置和数量
- **UUID 生成器**：批量生成 UUID v4，支持自定义数量（1-100）

**DevKit 开发者工具箱 (v24 新增)** - 9合1专业开发工具集：

- **JSON 工具**：格式化、压缩、验证，实时错误提示
- **Base64 编解码**：支持中英文等 Unicode 字符
- **URL 编解码**：快速 URL 编码与解码
- **哈希生成器**：MD5、SHA-1、SHA-256、CRC32 等多种哈希
- **UUID 生成器**：批量生成 UUID v4，支持自定义数量（1-100）
- **正则表达式测试器**：实时高亮匹配，显示匹配位置和数量
- **颜色转换器**：HEX/RGB/HSL 互转，可视化颜色选择器
- **Markdown 预览**：实时渲染，支持标题、列表、代码块、引用等
- **时间戳转换**：Unix 时间戳与日期互转，实时显示当前时间戳
- **一键复制**：所有结果支持一键复制到剪贴板

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
- AI代码解释器（静态分析+动态执行，支持Pyodide Python运行时）
- REST客户端
- Base64/URL编解码
- 哈希生成器（MD5/SHA-1/256/512）
- UUID生成器（v1/v4/v5）
- JWT解码器
- 开发者工具箱Pro（11合1：Base64/URL/JSON/正则/UUID/时间戳/颜色/哈希/JWT/HTML实体/Lorem Ipsum）

### 生产力工具

- **生产力中心**：一站式效率工具集，包含番茄钟、待办事项、习惯追踪、统计数据四大模块
- **文档编辑**：Markdown编辑器、预览器、转换器
- **时间管理**：番茄钟、倒计时、日历
- **项目管理**：待办清单、甘特图、看板
- **笔记系统**：便签、笔记本、知识库
- **实用工具**：计算器、单位换算、密码管理器

### 网络与信息（真实API集成）

| 应用 | API来源 | 功能说明 |
|------|----------|----------|
| **WorldPulse 全球脉搏** | CoinGecko + Open-Meteo + wheretheiss.at + open.er-api.com + Hacker News Firebase | v19 旗舰仪表盘，8卡片聚合实时全球情报 |
| **智能综合仪表盘** | Open-Meteo + CoinGecko | 一站式信息中心，天气、加密货币、每日名言、冷知识等多模块聚合 |
| **知识探索中心** | REST Countries + Wikimedia | 国家数据查询、冷知识、名言警句、百科搜索等知识宝库 |
| 天气查询 | Open-Meteo | 全球城市实时天气、7天预报、温度湿度风速 |
| 空气质量 | Open-Meteo Air Quality | AQI指数、PM2.5/PM10、6大主要城市实时监测 |
| 加密货币 | CoinGecko | 前100种加密货币实时行情、24h涨跌幅 |
| 新闻聚合 | Hacker News/Dev.to/Reddit | 多源技术新闻聚合、分类搜索收藏 |
| 翻译服务 | MyMemory | 8种语言互译（中英日韩法德西俄） |
| GitHub搜索 | GitHub API | 仓库和用户信息查询、热门趋势 |
| 维基百科 | Wikimedia | 百科内容浏览和搜索 |
| IP查询 | ipapi.co | IP地理位置查询 |
| DNS查询 | Google DNS | 域名解析查询 |
| 太空探索 | NASA/Open Notify | 每日天文图、ISS实时位置、近地天体监测 |
| ISS 实时追踪 | wheretheiss.at | 国际空间站实时经纬度、海拔、速度 |
| 全球汇率 | open.er-api.com | USD 兑全球主要货币实时汇率 |

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
json            # JSON格式化/压缩/验证
base64          # Base64编解码
hash            # 哈希计算 (MD5/SHA-1/SHA-256/SHA-512)
uuid            # UUID生成
password        # 密码生成器，支持强度评估
regex           # 正则测试
calc            # 计算器
timestamp       # 时间戳转换
jwt             # JWT解码
hex             # 进制转换 (2/8/10/16进制)
lorem           # Lorem Ipsum占位文本生成
open <应用名>   # 启动应用 (别名: app)
launch [应用ID] # 全局应用启动器，无参数时列出所有可用应用
worldpulse      # 一键启动 WorldPulse 全球脉搏仪表盘
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

### 智能工具命令
```bash
system-status   # 系统状态和资源使用信息
timer <秒数>    # 启动倒计时器
pomodoro [工作分钟] [休息分钟] # Pomodoro番茄钟
search-files <模式> # 搜索文件系统
world-clock     # 全球主要城市时间
crypto-summary  # 加密货币实时行情概览
news-summary    # Hacker News热门新闻摘要
translate <语言> <文本> # 翻译文本
url-shorten <URL> # 缩短长URL
```

> 输入 `help` 查看完整命令列表（160+命令）

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
- [Open-Meteo](https://open-meteo.com/) - 免费天气API和空气质量API
- [NASA Open API](https://api.nasa.gov/) - 每日天文图等太空数据
- [Open Notify](http://open-notify.org/) - ISS位置和航天员数据
- [CoinGecko](https://www.coingecko.com/) - 加密货币数据API
- [Hacker News](https://news.ycombinator.com/) - 技术新闻
- [Dev.to](https://dev.to/) - 开发者社区文章
- [MyMemory](https://mymemory.translated.net/) - 翻译API
- [GitHub](https://github.com/) - GitHub API
- [ipapi.co](https://ipapi.co/) - IP地理位置
- [wheretheiss.at](https://wheretheiss.at/) - 国际空间站实时位置API（WorldPulse）
- [open.er-api.com](https://www.exchangerate-api.com/) - 免费汇率API（WorldPulse）

**开源项目：**
- React、TypeScript、Vite、Zustand
- Lucide Icons、Marked

---

## 更新日志

### v26.0.0 (2026-07-10) - NexusAI 智能中枢与 DevForge 开发者锻造台

**新增 NexusAI 智能中枢应用：**
- **六大专业AI模式**：智能问答、代码助手、翻译专家、写作助手、创意激发、概念解释
- **现代化UI设计**：玻璃拟态风格、渐变色彩、流畅动画过渡
- **侧边栏模式切换**：左侧导航快速切换AI模式，当前模式高亮显示
- **Markdown 渲染支持**：AI回复支持 Markdown 格式，包括代码高亮、标题、列表、加粗等
- **快捷问题按钮**：预设常用问题，一键快速提问
- **对话历史管理**：完整对话记录，支持上下文理解
- **一键复制功能**：快速复制AI回复内容，复制后显示确认状态
- **清空对话功能**：一键清空当前对话，开始新会话
- **响应式布局**：自适应窗口大小，支持窗口拖拽缩放
- **懒加载优化**：应用按需加载，不影响初始启动速度

**新增 DevForge 开发者锻造台应用：**
- **8合1专业开发工具集**，现代简洁的侧边栏导航设计
- **JSON 格式化**：格式化、压缩、验证，实时错误提示，一键复制
- **Base64 编解码**：支持中英文等 Unicode 字符，编码解码双向转换
- **哈希生成器**：MD5、SHA-1、SHA-256、SHA-512 等多种哈希算法
- **时间戳转换**：Unix 时间戳与日期互转，实时显示当前时间戳
- **颜色工具**：HEX/RGB/HSL 互转，可视化颜色选择器，HSL滑块调节
- **二维码生成**：自定义内容生成二维码，支持一键下载
- **正则表达式测试器**：实时高亮匹配，显示匹配位置和数量
- **UUID 生成器**：批量生成 UUID v4，支持自定义数量（1-100）
- **统一的视觉风格**：每个工具独立配色，侧边栏图标+文字导航
- **响应式设计**：支持窗口缩放，自适应布局

**工程优化：**
- 两个新应用均采用 React.lazy 懒加载，按需加载减少初始bundle大小
- TypeScript 严格类型检查，所有新增代码类型安全
- 构建验证通过，新增应用独立打包

### v25.0.0 (2026-07-10) - Spotlight 旗舰升级与灵感流应用

**Spotlight 全局智能搜索重大升级：**
- **修复关键 Bug**：修复原版 `GlobalSearch` 中 `useMemo` 在 early return 之后调用的 React Hooks 规则违反问题，该 bug 在某些状态下可能导致组件崩溃
- **五大结果类别**：最近 / 工具 / 网页 / 操作 / 应用 / 文件，分组展示信息密度更高
- **网页搜索快捷词**：支持 10 种主流服务的快捷搜索
  - `g <词>` Google · `baidu <词>` 百度 · `bing <词>` Bing
  - `gh <词>` GitHub · `w <词>` 维基百科 · `y <词>` YouTube
  - `so <词>` Stack Overflow · `mdn <词>` MDN 文档
  - `dict <词>` 英文词典 · `zhihu <词>` 知乎
- **内联工具集**（输入即解析）：
  - 算式计算：`2 + 3 * 4` → 14，支持百分号、括号、`×` `÷`
  - 颜色解析：`#7c6cf0` → HEX/RGB/HSL 三种格式 + 可视化色块，一键复制
  - 时间戳转换：10/13 位 Unix 时间戳自动识别为本地时间
- **最近使用记录**：持久化最近 8 条使用记录（应用/网页/操作），空查询时优先展示
- **快捷操作**：关键词触发系统操作（`lock`/`theme`/`screenshot`/`launcher`/`clear`/`terminal`/`files`）
- **模糊匹配算法**：连续字符匹配奖励 + 评分排序，输入 "wlp" 即可找到 WorldPulse
- **键盘增强**：`Tab` 自动补全网页快捷词、`↑↓` 导航、`Enter` 执行、`Esc` 关闭
- **视觉重塑**：玻璃拟态遮罩、紫色渐变选中态、弹出动效、空状态展示快捷词速查表
- **亮色主题适配**：完整的 light 主题样式覆盖

**新增 IdeaStream 灵感流应用：**
- **快速捕捉**：输入即记录，`Ctrl+Enter` 保存，不打断思路
- **自动标签解析**：行内 `#标签` 自动识别并归类，支持中英文
- **颜色分级**：6 种语义颜色（紫/青/琥珀/玫红/翠绿/蓝）循环分配，左侧色条标识
- **时间线流式视图**：倒序展示，相对时间显示（刚刚 / N 分钟前 / N 小时前 / N 天前）
- **全文搜索 + 标签筛选**：实时搜索想法内容，点击标签快速筛选同类
- **星标收藏**：重要想法一键星标，支持"只看星标"过滤
- **Markdown 导出**：按标签分组导出为 `.md` 文件，便于备份与迁移
- **灵感提示**：空状态时随机展示精选灵感提示语（15 条），激发创意
- **持久化存储**：所有想法自动保存到 localStorage，最多保留 500 条
- **意识流美学**：渐变光晕空状态、卡片入场动画、悬停位移、流光色条

**工程与版本管理：**
- **版本号同步**：修复 `package.json` 版本号（17.1.0）与 README 更新日志（v24）长期不一致的问题，统一为 v25.0.0
- **TypeScript 严格模式**：所有新增代码通过 `tsc -b` 严格类型检查
- **Playwright 自动化测试**：新增端到端测试脚本，验证 Spotlight 与 IdeaStream 的核心交互流程，0 控制台错误
- **构建验证**：`npm run build` 通过，新增应用按需懒加载，IdeaStream 单独打包

### v24.0.0 (2026-07-09) - 旗舰应用增强与开发者工具箱

**WorldPulse 全球脉搏重大升级：**
- **新增分类标签页**：全部/金融/环境/科技四大分类，信息浏览更高效
- **新增空气质量监测**：接入 Open-Meteo Air Quality API，4个主要城市实时AQI指数
  - 支持优/良/轻度污染/中度污染/重度污染/严重污染6级分级
  - 实时显示PM2.5、PM10、O3、NO2等污染物数据
- **新增GitHub热门仓库**：接入GitHub API，实时展示全球热门开源项目
  - 显示仓库名称、描述、编程语言、Star数、Fork数
  - 一键跳转至GitHub仓库页面
- **加密货币扩展**：从4种增加到6种（新增Ripple、Cardano）
  - 显示市值数据，更全面的市场信息
- **天气城市扩展**：从6个增加到7个（新增北京）
- **世界时钟扩展**：从5个增加到8个（新增巴黎、悉尼、迪拜）
- **汇率货币扩展**：从5种增加到6种（新增AUD澳元）
- **冷知识卡片**：新增趣味冷知识模块，每次加载随机展示
- **开发者语录扩展**：从12条增加到15条编程大师名言
- **数据源健康监控升级**：从5个增加到7个API源状态监控
- **状态指示器优化**：显示在线数据源数量/总数，更直观的系统状态

**新增 DevKit 开发者工具箱：**
- **9合1专业开发工具集**，现代简洁的侧边栏导航设计
- **JSON 工具**：格式化、压缩、验证，实时错误提示
- **Base64 编解码**：支持中英文等Unicode字符
- **URL 编解码**：快速URL编码与解码
- **哈希生成器**：MD5、SHA-1、SHA-256、CRC32等多种哈希
- **UUID 生成器**：批量生成UUID v4，支持自定义数量（1-100）
- **正则表达式测试器**：实时高亮匹配，显示匹配位置和数量
- **颜色转换器**：HEX/RGB/HSL互转，可视化颜色选择器
- **Markdown 预览**：实时渲染，支持标题、列表、代码块、引用等
- **时间戳转换**：Unix时间戳与日期互转，实时显示当前时间戳
- **一键复制**：所有结果支持一键复制到剪贴板
- **响应式设计**：支持窗口缩放，自适应布局

### v23.0.0 (2026-07-09) - 实用功能增强与真实API集成
- **新增智能笔记专业版**：功能完整的笔记管理系统
  - 支持创建、编辑、删除笔记，自动保存到本地
  - 分类管理：工作、个人、创意、学习、待办
  - 标签系统：自由添加标签，快速检索
  - 星标收藏：重要笔记快速访问
  - 导出功能：一键导出Markdown格式
  - 预览模式：实时查看编辑效果
  - 搜索功能：全文搜索笔记内容
- **新增实时数据终端命令**：接入真实公开API
  - `crypto [币种]`：加密货币实时价格（CoinGecko API）
  - `weather-live <城市>`：全球城市实时天气（Open-Meteo API）
  - `exchange [from] [to] [amount]`：实时汇率查询和转换
  - `github-user <用户名>`：GitHub用户信息查询
  - `uuid-gen [数量]`：批量生成UUID（v4）
  - `http <状态码>`：HTTP状态码快速查询
  - `timestamp [时间戳|日期]`：Unix时间戳转换工具
  - `json-format <JSON>`：快速JSON格式化
- **API缓存机制**：避免频繁请求同一API，提升响应速度
- **代码质量优化**：统一的错误处理，完善的类型定义
- **用户体验改进**：更友好的命令提示和错误反馈

### v20.0.0 (2026-07-09) - 代码执行能力与开发工具增强
- **增强 AI 代码解释器**：从静态分析升级为动态执行
  - 集成 Pyodide Python 运行时，支持真正的 Python 代码执行
  - 支持 JavaScript 代码执行，捕获 console.log 输出
  - 新增"执行结果"标签页，实时显示代码运行输出
  - 自动检测代码语言，智能选择执行引擎
  - 保留原有的静态分析功能（概览/建议/安全/性能）
- **增强开发者工具箱Pro**：从7合1扩展为11合1
  - 新增**哈希生成器**：MD5 / SHA-1 / SHA-256 / SHA-512 四种算法
  - 新增**JWT解码器**：解析Header/Payload/Signature，自动检测过期时间
  - 新增**HTML实体编解码**：支持特殊字符的双向转换
  - 新增**Lorem Ipsum生成器**：单词/句子/段落三种模式，数量可调
- **增强终端命令**：新增8个实用开发工具命令
  - `uuid`：生成UUID，支持批量生成（最多100个）
  - `password`：密码生成器，支持自定义长度和字符类型，强度评估
  - `timestamp`：时间戳转换，支持时间戳转日期、日期转时间戳
  - `json`：JSON工具，支持format/minify/validate三种操作
  - `calc`：计算器，支持加减乘除、取模、幂运算和括号
  - `jwt`：JWT解码，解析Header和Payload，显示签发/过期时间
  - `lorem`：Lorem Ipsum占位文本生成，支持单词/句子/段落
  - `hex`：进制转换，支持文本转十六进制及2/8/10/16进制互转
- **代码质量优化**：统一Pyodide加载机制，模块级单例复用
- **性能优化**：DevToolboxPro新增工具均采用useMemo/useEffect优化渲染

### v17.1.0 (2026-07-08) - 开发工具增强与代码质量优化
- **新增开发工具命令**：4个实用终端命令
  - `regex`：正则表达式测试工具，支持实时匹配和结果展示
  - `diff`：文本比较工具，逐字符比较两个文本的差异
  - `count`：字符统计工具，统计字符数、单词数、行数、中英文等
  - `url`：URL编码/解码工具
- **代码质量优化**：修复文件命令中的竞态条件问题（cp/mv命令）
- **性能优化**：改进文件操作后的状态同步机制，提升可靠性
- **功能增强**：完善终端命令的错误处理和用户反馈

### v19.1.0 (2026-07-08) - 智能工具与生产力增强
- **新增智能工具命令**：9个实用终端命令，提升工作效率
  - `system-status`：系统状态和资源使用信息（内存、CPU、网络、屏幕分辨率等）
  - `timer <秒数>`：启动倒计时器，支持浏览器通知提醒
  - `pomodoro [工作分钟] [休息分钟]`：Pomodoro番茄钟，支持工作/休息循环
  - `search-files <模式>`：搜索虚拟文件系统中的文件和文件夹
  - `world-clock`：显示全球8个主要城市时间，含工作状态提示
  - `crypto-summary`：加密货币实时行情概览（BTC/ETH/SOL等）
  - `news-summary`：Hacker News热门新闻摘要（前5条）
  - `translate <语言> <文本>`：多语言翻译（基于MyMemory API）
  - `url-shorten <URL>`：URL缩短服务（Bitly + TinyURL双备份）
- **修复bug**：修复apiCommands.ts中重复注册的shorten命令
- **增强稳定性**：优化命令系统的错误处理和API请求缓存机制
- **性能优化**：改进终端命令加载机制，减少初始加载时间

### v19.0.0 (2026-07-08) - WorldPulse 全球脉搏仪表盘
- **新增 WorldPulse 旗舰应用**：实时全球情报仪表盘，让 WebLinuxOS 拥有实际信息中心价值
  - 8 个数据卡片：加密货币市场、全球天气、ISS 实时位置、全球汇率、Hacker News 热榜、世界时钟、开发者语录、数据源健康状态
  - 接入 5 个真实免费公开 API：CoinGecko、Open-Meteo、wheretheiss.at、open.er-api.com、Hacker News Firebase
  - "任务控制中心"美学：细密网格背景、闪烁高亮、骨架屏 shimmer、ISS 脉冲环标记
  - 等距圆柱投影世界地图，实时显示国际空间站位置
  - 独立刷新周期（ISS 5s / 加密货币 60s / 天气 5min / 汇率 30min / HN 10min）
  - `fetchWithTimeout` 统一超时与错误处理，单卡片故障不影响整体
- **新增终端命令**：
  - `worldpulse`：一键启动 WorldPulse，已运行时自动聚焦到前台
  - `launch [应用ID]`：全局应用启动器，无参数时分类列出全部 250+ 应用
- **桌面集成**：WorldPulse 桌面图标固定在安全区域，并加入任务栏默认固定应用
- **README 全面更新**：补充 WorldPulse 专题、API 集成表、终端命令速查

### v18.0.0 (2026-07-07) - 太空探索与桌面增强
- **新增太空探索专业版**：集成多个公开API，提供丰富太空探索功能
  - 每日天文图（NASA APOD）：每天一张精选宇宙影像及详细解说
  - ISS实时追踪：国际空间站当前位置、在轨人员、轨道参数
  - 近地天体监测：潜在危险小行星、近距离飞掠、今日发现
  - 太空百科：行星、恒星、星系、航天任务等科普知识
  - 火星天气：火星最新气象数据
- **增强桌面小部件系统**：新增2种实用小部件
  - 空气质量小部件：实时AQI指数、PM2.5监测、6城市切换
  - 每日诗词小部件：10首经典唐诗、优雅排版、一键切换
- **中文字体优化**：新增Noto Sans SC和Noto Serif SC字体，完美支持中文显示
- **性能优化**：API缓存机制、组件懒加载、响应式优化

### v17.1.0 (2026-07-07) - 功能增强
- **新增创新工具命令**：10+新终端命令，包括
  - `code-highlight`：代码语法高亮显示，支持多语言
  - `leetcode`：获取LeetCode编程题目，按难度和主题筛选
  - `color`：颜色转换和信息查询（RGB/HEX/HSL）
  - `http-status`：HTTP状态码查询和分类
  - `regex-gen`：常用正则表达式生成器
  - `ascii-table`：ASCII表格模板生成
  - `progress`：进度条生成器
  - `base-convert`：进制转换器（2-36进制）
  - `url-parse`：URL解析器
  - `encode-url`：URL编码解码工具
- **增强实用工具**：新增20+终端命令，包括时间戳转换、UUID生成、密码强度检测、JSON格式化、正则测试、单位转换等
- **修复bug**：修复单位转换器命令的转换逻辑错误
- **优化命令分类**：在help命令中新增"创新工具"分类，方便用户查找

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