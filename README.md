<div align="center">

# WebLinuxOS

**浏览器中的完整 Linux 桌面环境 — 真实工具，真实工作，零安装。**

[在线体验](https://saya-ch.github.io/WebLinuxOS/) · [文档](https://github.com/saya-ch/WebLinuxOS/wiki) · [更新日志](CHANGELOG.md) · [提交问题](https://github.com/saya-ch/WebLinuxOS/issues) · [功能建议](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge&logo=github&color=yellow)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=for-the-badge&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v64.0.0-blue?style=for-the-badge)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?style=for-the-badge&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 项目简介

WebLinuxOS 是一个完全运行在浏览器中的 Linux 桌面环境。它不是模拟器或演示项目——每一个应用都提供真实的功能：终端执行真实命令，代码编辑器编写真实代码，API 测试器发送真实请求，AI 图像工作室通过公开 API 生成真实图像，隐私工具在本地检测真实敏感信息。基于 React 19 和 TypeScript 构建，内置 385+ 应用，覆盖开发、办公、网络、多媒体、AI 和游戏等领域，将任何拥有浏览器的设备变成完整的工作站。

## v64.0.0 更新亮点

- **版本一致性修复**：统一全项目版本号显示，修复多处硬编码版本号不一致问题
- **桌面交互优化**：支持单击选中图标后再次单击直接打开，操作效率提升
- **字体降级方案**：新增字体加载检测机制，网络异常时自动切换系统字体，确保可用性
- **系统信息面板增强**：About 应用全面升级，展示实时运行时数据、硬件检测、性能监控
- **性能优化**：改进启动画面与应用加载性能，优化组件懒加载与缓存淘汰策略
- **错误处理改进**：增强组件加载错误处理与重试机制，提升应用稳定性

## 特性

### 桌面环境

- 多窗口管理：拖拽、缩放、最小化、最大化、关闭
- 4 个虚拟桌面，通过快捷键自由切换
- 任务栏、启动器（开始菜单）、命令面板、全局搜索、快速操作中心
- GPU 加速动画，4 套内置主题：赛博朋克、量子、玻璃拟态、经典亮色
- 全局 `window.WebLinuxOS` API，支持外部集成与浏览器自动化

### 窗口管理

- 自由拖拽与边缘吸附
- 窗口层级管理与焦点追踪
- 独立窗口尺寸约束（最小/默认宽高）
- 懒加载组件 + 超时重试 + 缓存淘汰机制
- 组件预加载策略：关键组件优先、次要组件空闲加载

### 应用生态

- 380+ 内置应用，涵盖开发、办公、互联网、多媒体、系统、AI、游戏等类别
- 每个应用都是真实可用的工具，不是占位或演示
- 统一的应用注册系统，支持扩展与动态发现

### 开发工具

- 在线代码运行器 Pro：JavaScript 实时执行、HTML/CSS/JS 实时预览
- Monaco 代码编辑器：语法高亮、多语言支持、自动补全
- API 测试器：真实 HTTP 请求、预设模板、请求历史
- AI 代码分析器 Pro：7 种语言的代码质量分析
- JSON 超级工具：格式化/压缩、JSONPath 查询、Schema 验证、Diff 对比
- CSS 工作室：渐变编辑、阴影生成、动画关键帧、Flexbox 布局预览
- WASM 实验场：WAT 编辑、编译、执行、字节导出
- 代码协作平台：9 种语言、实时光标追踪、代码执行

### 网络工具

- 开源项目导航：GitHub 仓库搜索、热门项目、语言筛选、星标排序
- AIWikiSearch：维基百科智能搜索、双语实时建议、AI 摘要
- OpenAPI Hub：50+ 端点、10 个分类、零配置
- GeoAtlas 地理图鉴：250+ 国家、对比、测验
- 实时天气：城市搜索、7 天预报、温湿度风速
- WorldPulse / LivePulse：多源实时信息聚合

### 创新功能

- AI 图像工作室：基于 Pollinations.ai 免费公开 API，12 种风格预设，零配置
- Markdown 演示文稿：Markdown 转幻灯片、全屏演示、导出 HTML、过渡动画
- 智能知识图谱：`[[链接]]` 语法、双向链接、力导向图谱可视化
- WebSpeech 语音合成：实时文字转语音、单词高亮
- Web Serial 终端：硬件调试
- File System Access 本地文件浏览：真实本地文件系统访问
- PrivacyGuard 隐私卫士：本地 PII 检测，17 类敏感信息
- SecureVault 密码保险库：Web Crypto API AES-GCM 本地加密、主密码解锁、密码 CRUD、强密码生成、分类管理
- CryptoPrice 实时行情：CoinGecko 公开 API、100+ 币种价格追踪、7 日走势图、市值排名、收藏列表
- SystemHealth 健康检查：浏览器内存/CPU/FPS/网络/存储实时监控、性能诊断与优化建议
- JSON Workbench 工作台：格式化/压缩/校验、JSONPath 查询、Diff 对比、Schema 生成、TypeScript 类型生成
- TimeTravel 时间旅行：Unix 时间戳互转、时区转换、日期差值计算、节假日倒数、自定义格式化
- ColorLab 色彩实验室：颜色选择器、HEX/RGB/HSL 互转、调色板生成、渐变编辑器、对比度检查、色盲模拟
- UnifiedCmd 统一命令中心：自然语言输入自动识别查询类型，集成天气/汇率/国家/维基/词典/名言/计算器 7 大公开 API，历史记录与本地收藏
- DevPulse 开发者脉搏：Hacker News + GitHub Trending + DEV.to + Product Hunt 多源新闻聚合，智能缓存、搜索过滤、排序收藏、一键跳转原文
- CryptoMarketHub 加密行情：CoinGecko 免费 API、80+ 币种、24h 涨跌幅、7 日 Sparkline 走势图、自选币种、持仓追踪（总价值/总盈亏/24h浮动盈亏）、自动刷新、本地缓存加速

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| 构建 | [Vite 8](https://vitejs.dev/) + 代码分割 + Terser 压缩 |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) |
| 样式 | CSS Variables + 主题系统（4 套主题） |
| 图标 | [Lucide React](https://lucide.dev/) |
| 代码编辑器 | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Markdown | [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify) |
| Python 运行时 | [Pyodide](https://pyodide.org/)（可选） |
| AI 图像生成 | [Pollinations.ai](https://pollinations.ai/) 公开 API（无需密钥） |
| 部署 | GitHub Pages + GitHub Actions |

## 快速开始

### 在线体验

无需安装，直接访问：

**[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)**

### 本地开发

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

开发服务器启动于 `http://localhost:5173/WebLinuxOS/`（base path 与 GitHub Pages 部署路径一致）。

### 构建与部署

```bash
# TypeScript 类型检查 + Vite 打包
npm run build

# 本地预览构建产物
npm run preview
```

构建会先运行 `tsc -b` 进行类型检查，零类型错误是发版门槛。

### 自定义部署

若部署到自己的 fork，需修改 `vite.config.ts` 中的 `base` 配置以匹配你的仓库名（默认为 `/WebLinuxOS/`）。

## 应用分类

### 开发工具

| 应用 | 说明 |
|------|------|
| 在线代码运行器 Pro | JavaScript 实时执行、HTML/CSS/JS 实时预览、代码分享 |
| API 测试器 | 真实 HTTP 请求、预设模板、请求历史 |
| JSON 超级工具 | 格式化/压缩、JSONPath 查询、Schema 验证、Diff 对比 |
| JSON Workbench | 高级 JSON 处理、Schema 生成、TypeScript 类型生成、树形可视化 |
| CSS 工作室 | 渐变编辑、阴影生成、动画关键帧、Flexbox 预览 |
| WASM 实验场 | WAT 编辑、编译、执行、字节导出 |
| AI 代码分析器 Pro | 7 种语言的代码质量分析、改进建议 |
| 代码协作平台 | 9 种语言、实时光标、代码执行 |
| SnippetVault | 代码片段管理、16 个内置模板 |
| DevLab | 12+ 开发工具集成 |
| CronLab | 可视化 Cron 构建器、下次执行预测 |
| ColorLab | 色彩工具箱、HEX/RGB/HSL 互转、调色板生成、色盲模拟 |
| DevPulse 开发者脉搏 | Hacker News + GitHub Trending + DEV.to + Product Hunt 多源新闻聚合、搜索过滤排序收藏 |

### 办公工具

| 应用 | 说明 |
|------|------|
| Markdown 演示文稿 | Markdown 转幻灯片、全屏演示、导出 HTML |
| 智能知识图谱 | 双向链接、知识图谱可视化、全文搜索 |
| ResumeForge | 4 套模板、10 种配色、7 个可编辑模块 |
| FlashMaster | SM-2 间隔重复闪卡 |
| KanbanBoard | 看板式任务管理 |
| MarkdownEditor Pro | Markdown 编辑器、实时预览 |

### 网络与信息

| 应用 | 说明 |
|------|------|
| 开源项目导航 | GitHub 仓库搜索、热门项目、语言筛选 |
| AIWikiSearch | 维基百科智能搜索、双语支持、AI 摘要 |
| OpenAPI Hub | 50+ 端点、10 个分类、零配置 |
| GeoAtlas | 250+ 国家、对比、测验 |
| 实时天气 | 城市搜索、7 天预报、温湿度风速 |
| LivePulse | 实时汇率、Hacker News、趣味问答 |
| UnifiedCmd 统一命令中心 | 自然语言输入、7 类查询自动识别、公开 API 聚合、历史记录收藏 |
| CryptoMarketHub 加密行情 | 80+ 币种、7 日走势图、持仓与盈亏追踪、自选币种、自动刷新 |

### 多媒体与 AI

| 应用 | 说明 |
|------|------|
| AI 图像工作室 | Pollinations.ai 图像生成、12 种风格、零配置 |
| Studio Suite | 调色板、渐变、阴影、字体、WCAG 对比度 |
| AudioViz | 5 种可视化类型、5 种主题 |
| Paint | 画板工具 |
| MusicPlayer | 音乐播放器 |

### 系统与安全

| 应用 | 说明 |
|------|------|
| 终端 | 100+ 命令、Unix 管道、输出重定向、API 集成（npm/天气/汇率/翻译/IP 查询） |
| 实时系统监控 | JS 堆内存、网络、FPS、性能计时 |
| PrivacyGuard | 本地 PII 检测、17 类敏感信息 |
| SecureVault | 本地加密密码管理器、Web Crypto API、AES-GCM 加密、密码生成器 |
| SystemHealth | 浏览器健康检查仪表盘、内存/CPU/网络/存储实时监控 |
| File Hash Calculator | SHA-1/256/384/512 |
| 剪贴板历史 | 搜索、过滤、收藏、持久化存储 |
| LocalFileExplorer | File System Access API 真实本地文件浏览 |

### 游戏

2048、贪吃蛇、俄罗斯方块、打砖块、记忆力游戏、虚拟宠物等。

## 键盘快捷键

### 桌面与系统

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Shift + L` | 打开/关闭启动器（开始菜单） |
| `Ctrl/Cmd + Space` | 智能命令中心 |
| `Ctrl/Cmd + P` | 命令面板 |
| `Ctrl/Cmd + K` | 全局搜索 |
| `Alt + N` | QuickNote 全局速记浮层 |
| `Ctrl/Cmd + A` | 快速操作中心 |
| `Alt + Tab` | 切换窗口（正向） |
| `Shift + Alt + Tab` | 切换窗口（反向） |
| `Ctrl + Alt + [1-9]` | 切换虚拟桌面 1-9 |
| `PrintScreen` | 截图工具 |

### 应用快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + T` | 打开终端 |
| `Ctrl/Cmd + E` | 打开文件管理器 |
| `Ctrl/Cmd + B` | 打开浏览器 |
| `Ctrl/Cmd + ,` | 打开系统设置 |
| `Ctrl/Cmd + Shift + C` | 打开计算器 |

### 窗口管理

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + Q` | 关闭当前窗口 |
| `Ctrl/Cmd + M` | 最小化当前窗口 |
| `F11` | 最大化/还原当前窗口 |

## 项目架构

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/               # 380+ 应用实现
│   │   │   └── terminal/       # 终端命令系统（90+ 命令）
│   │   ├── components/         # 核心 UI（Desktop, Window, Taskbar, StartMenu）
│   │   │   └── desktop/        # WindowManager + 窗口懒加载
│   │   ├── store/              # Zustand 状态管理、文件/存储工具
│   │   ├── styles/             # 主题系统与全局样式
│   │   ├── utils/              # 工具函数、性能监控、日志
│   │   ├── services/           # API 与服务层（AI、剪贴板、缓存）
│   │   ├── config/             # API 端点配置
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── apps.tsx            # 应用注册表（元数据 + 图标 + 尺寸）
│   │   └── icons.tsx           # 自定义图标组件
│   ├── public/                 # 静态资源、PWA manifest、Service Worker
│   └── vite.config.ts          # Vite 配置（base path、代码分割、rollup 输出）
├── .github/workflows/          # CI/CD：push 到 main 时自动构建 + 部署到 Pages
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

**核心设计决策：**

- **应用注册与加载分离**：`apps.tsx` 定义应用元数据，`WindowManager.tsx` 的 `componentMap` 负责懒加载映射，两者独立维护
- **组件懒加载**：所有应用通过 `React.lazy` + 动态 `import()` 按需加载，首屏仅加载关键组件
- **缓存与重试**：组件加载失败自动重试（最多 2 次），超时 30 秒，LRU 缓存淘汰（上限 100）
- **状态管理**：Zustand 单一 store，shallow selector 避免不必要渲染

## 贡献指南

欢迎贡献代码、报告问题或提出功能建议。

### 开发流程

1. Fork 本仓库
2. 创建功能分支（`git checkout -b feature/amazing-feature`）
3. 提交更改（`git commit -m 'feat: add amazing feature'`）
4. 推送分支（`git push origin feature/amazing-feature`）
5. 发起 Pull Request

### 添加新应用

1. 在 `web-linux/src/apps/YourAppName.tsx` 创建组件
2. 在 `apps.tsx` 的 `APP_REGISTRY_EXTRAS` 中注册应用元数据（图标、尺寸、类别、描述）
3. 在 `components/desktop/WindowManager.tsx` 的 `componentMap` 中添加懒加载映射
4. 手动测试：启动器搜索、桌面图标、窗口关闭/最大化
5. 提交 PR，附截图和简要说明

### 提交前检查

```bash
cd web-linux
npm run build   # 必须通过：tsc -b && vite build → 0 类型错误
```

详细指南请参阅 [CONTRIBUTING.md](CONTRIBUTING.md)。

## License

[MIT](LICENSE)

## 致谢

- [Lucide](https://lucide.dev/) — 图标库
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — VS Code 同款代码编辑器
- [Pyodide](https://pyodide.org/) — 浏览器 Python 运行时
- [Zustand](https://github.com/pmndrs/zustand) — 状态管理
- [Vite](https://vitejs.dev/) — 构建工具
- [Pollinations.ai](https://pollinations.ai/) — 免费 AI 图像生成 API
- [Open-Meteo](https://open-meteo.com/) — 天气预报 API
- [Open Library](https://openlibrary.org/developers/api) — 图书目录 API
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) — 百科内容
- [REST Countries](https://restcountries.com/) — 国家信息 API
- [Frankfurter](https://www.frankfurter.app/) — 汇率数据
- [CoinGecko](https://www.coingecko.com/en/api) — 加密货币行情（无需密钥的免费层）
- [Hacker News API](https://github.com/HackerNews/API) — 科技新闻
- [DEV.to API](https://developers.forem.com/api) — 开发者社区文章

---

<div align="center">

如果这个项目对你有帮助，请考虑给一个 Star。

</div>
