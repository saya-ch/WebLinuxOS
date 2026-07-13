# WebLinuxOS

一个在浏览器中运行的完整Linux桌面环境，提供240+应用程序、虚拟文件系统、终端模拟器和实时API集成。

**在线演示**: https://saya-ch.github.io/WebLinuxOS/

---

## 项目亮点

### 浏览器中的操作系统
WebLinuxOS 将完整的Linux桌面体验带到浏览器中。无需安装，打开网页即可使用。支持拖拽窗口、虚拟桌面、全局搜索、主题切换等现代化操作系统功能。

### 核心创新

#### 实时数据中心
集成多个真实公开API的一站式数据仪表盘，让WebLinuxOS从操作系统模拟升级为具有实际使用价值的工具平台：
- **实时天气**: 基于Open-Meteo API，支持多城市切换、24小时预报、7天预报、紫外线指数等
- **加密货币行情**: CoinGecko API实时价格、24小时涨跌幅、市值、交易量
- **科技新闻**: Hacker News热榜实时更新
- **汇率换算**: Frankfurter API支持12种主要货币实时换算
- **网络状态**: 实时网络连接状态、带宽、延迟检测

#### 在线编程实验室
- 支持9种编程语言（JavaScript, TypeScript, Python, HTML, CSS, Markdown, SQL, JSON, Bash）
- 实时代码执行和输出预览
- 多文件编辑和管理
- 键盘快捷键支持（Ctrl+Enter运行，Ctrl+S保存）

#### 240+内置应用
涵盖开发工具、生产力套件、多媒体应用、系统工具和网络工具：
- **开发工具**: 代码编辑器、终端、API测试器、代码格式化、Git工具
- **生产力**: 文件管理器、笔记、日历、任务管理、Markdown编辑器
- **多媒体**: 音乐播放器、视频播放器、图片查看器、画板
- **系统工具**: 系统监控、进程管理、网络工具、磁盘分析
- **实用工具**: 密码管理器、QR生成器、单位转换、货币换算

#### 虚拟文件系统
- 完整的文件系统实现，支持CRUD操作
- localStorage持久化存储
- 文件预览和编辑功能
- 支持多种文件类型的识别

#### 终端模拟器
- 150+命令集合
- 支持文件操作、系统监控、网络工具
- API集成命令（天气、加密货币、新闻、翻译）
- ANSI颜色支持和历史记录

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.2 | UI框架 |
| TypeScript | 6.0 | 类型安全 |
| Zustand | 5.0 | 状态管理 |
| Vite | 8.0 | 构建工具 |
| Lucide React | - | 图标库 |
| Marked | - | Markdown解析 |
| Pyodide | 0.26 | Python运行时 |

## 快速开始

### 在线使用
访问在线演示页面即可直接使用，无需任何安装。

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 部署到GitHub Pages
```bash
# 构建并部署
npm run deploy
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Shift+L | 打开启动器 |
| Ctrl+K | 全局搜索 |
| Ctrl+P | 命令面板 |
| Alt+Tab | 切换窗口 |
| Ctrl+Q | 关闭窗口 |
| Ctrl+M | 最小化窗口 |
| Ctrl+T | 打开终端 |
| Ctrl+E | 打开文件管理器 |
| Ctrl+1-9 | 快速启动应用 |
| Ctrl+Alt+1-9 | 切换虚拟桌面 |
| F11 | 全屏模式 |

## 终端命令示例

```bash
# 系统命令
whoami              # 显示当前用户
hostname            # 显示主机名
uname -a            # 显示系统信息
date                # 显示日期时间
uptime              # 显示运行时间

# 文件操作
ls                  # 列出文件
cd <path>           # 切换目录
pwd                 # 显示当前路径
cat <file>          # 查看文件内容
mkdir <dir>         # 创建目录
rm <path>           # 删除文件/目录

# API命令
weather [city]      # 天气查询
crypto              # 加密货币价格
news                # 科技新闻
translate <text>    # 文本翻译
github <repo>       # GitHub仓库信息

# 开发工具
json                # JSON格式化
base64              # Base64编解码
hash                # 哈希生成
uuid                # UUID生成
calc <expr>         # 计算器

# 帮助
help                # 查看所有命令
man <command>       # 命令手册
```

## 项目结构

```
web-linux/
├── src/
│   ├── apps/              # 240+应用组件
│   │   ├── terminal/      # 终端命令系统
│   │   ├── OnlineProgrammingLab.tsx  # 在线编程实验室
│   │   ├── FileManager.tsx           # 文件管理器
│   │   └── ...             # 其他应用
│   ├── components/
│   │   ├── desktop/       # 桌面核心组件
│   │   │   ├── Desktop.tsx
│   │   │   ├── Window.tsx
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── StartMenu.tsx
│   │   └── ...
│   ├── store/             # Zustand状态管理
│   ├── utils/             # 工具函数
│   ├── styles/            # 样式文件
│   ├── App.tsx            # 应用入口
│   ├── apps.tsx           # 应用注册表
│   └── store.tsx          # 全局状态
├── public/                # 静态资源
├── screenshots/           # 截图
└── vite.config.ts         # Vite配置
```

## API集成

WebLinuxOS集成了多个公共API：

| API | 用途 |
|-----|------|
| Open-Meteo | 天气数据（实时、预报、紫外线） |
| CoinGecko | 加密货币价格和市场数据 |
| Frankfurter | 汇率换算（12+主要货币） |
| GitHub API | 仓库信息查询 |
| Hacker News | 科技新闻热榜 |
| Wikipedia | 知识库查询 |
| ipapi.co | IP地址信息 |
| MyMemory | 翻译服务 |

## 性能优化

- **代码分割**: 每个应用独立打包，按需加载
- **懒加载**: 使用React.lazy和Suspense延迟加载组件
- **缓存策略**: API响应缓存，减少网络请求
- **GPU加速**: 使用CSS transform优化动画性能
- **虚拟滚动**: 大数据列表使用虚拟滚动

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 贡献指南

我们欢迎所有形式的贡献！

### 添加新应用
1. 在 `src/apps/` 创建组件文件
2. 在 `src/apps.tsx` 注册应用
3. 在 `WindowManager.tsx` 添加懒加载映射
4. 添加相应的图标和快捷键

### 添加终端命令
1. 在 `src/apps/terminal/` 选择合适的命令文件
2. 使用 `registerCommand` 注册命令
3. 在 `help` 命令中添加文档
4. 测试各种输入情况

### 开发流程
```bash
# 创建功能分支
git checkout -b feature/your-feature

# 安装依赖
npm install

# 开发模式
npm run dev

# 类型检查
npm run typecheck

# 代码检查
npm run lint

# 构建
npm run build
```

## 更新日志

### v36.0.0 (2026-07)
- 新增实时数据中心应用，集成5个真实公开API
  - 实时天气（Open-Meteo）：多城市、24小时预报、7天预报、紫外线指数
  - 加密货币行情（CoinGecko）：实时价格、涨跌幅、市值、交易量
  - 科技新闻（Hacker News）：热榜实时更新
  - 汇率换算（Frankfurter）：12种主要货币实时换算
  - 网络状态：连接状态、带宽、延迟检测
- 应用级缓存机制，减少API请求
- 自动刷新数据，保持信息实时
- 优化README文档，新增核心创新介绍

### v35.0.0 (2026-07)
- 新增在线编程实验室，支持9种编程语言
- 改进README文档结构
- 优化应用加载性能
- 增强错误处理机制

### v34.0.0 (2026-07)
- 增强系统监控功能
- 改进终端ANSI颜色支持
- 优化窗口动画效果
- 新增日期计算器

[查看完整更新日志](CHANGELOG.md)

## 许可证

本项目采用MIT许可证开源。

## 致谢

感谢以下开源项目和服务的支持：
- React, TypeScript, Vite, Zustand
- Lucide Icons
- Open-Meteo, CoinGecko, GitHub API等公共服务

---

**版本**: 36.0.0 | **最后更新**: 2026年7月 | **维护者**: Saya Ch