# WebLinuxOS

**一个运行在浏览器中的完整 Linux 桌面环境**

[在线体验](https://saya-ch.github.io/WebLinuxOS/) | [中文文档](README_CN.md) | [贡献指南](CONTRIBUTING.md)

---

## 项目简介

WebLinuxOS 是一个生产级的 Web 操作系统，提供完整的桌面体验和真实功能。不同于普通的操作系统模拟器，WebLinuxOS 集成了实时 API、真实硬件数据和实用工具，使其成为真正可用于日常工作的平台。

### 核心特性

**真实功能，而非模拟**

- 通过 Open-Meteo API 获取实时天气数据
- 使用 Performance API 进行实际网络性能测量  
- GitHub API 集成用于仓库浏览和统计数据
- Hacker News API 获取科技新闻追踪
- CoinGecko API 提供加密货币价格
- Pyodide 运行时实现 Python 代码执行

**完整桌面环境**

- 支持拖拽、调整大小、最小化、最大化的窗口管理系统
- 多桌面支持与键盘快捷键 (Ctrl+Alt+1-9)
- 带应用预览和系统托盘的任务栏
- 支持分类过滤的应用启动器
- 支持增删改查的虚拟文件系统
- 右键菜单和键盘快捷键

**200+ 内置应用**

| 类别 | 应用 |
|------|------|
| 开发工具 | Python 执行代码编辑器、REST 客户端、API 探索器、JSON/YAML 工具、正则测试器、Git 工具、代码格式化 |
| 工具类 | 实时数据仪表盘、天气追踪器、计算器、密码生成器、二维码创建、颜色选择器、单位转换、剪贴板管理 |
| 办公套件 | Markdown 编辑器、带标签笔记、任务管理、日历、看板、思维导图、白板、演示文稿创建 |
| 网络应用 | Web 浏览器、新闻阅读器、GitHub 热门、维基百科查看器、翻译工具、加密货币追踪 |
| 多媒体 | 图片查看器、音乐播放器带可视化、视频播放器、屏幕录制、摄像头、画图工具 |
| 游戏 | 贪吃蛇、俄罗斯方块、2048、记忆翻牌、打砖块 |
| 系统工具 | 终端(60+命令)、文件管理器、系统监视器、进程查看器、磁盘使用分析 |

**终端模拟器**

终端不仅是装饰性的，它是完全功能性的：

```bash
# 文件操作（虚拟文件系统）
ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, tree, grep, find

# 真实网络命令
curl <url>           # 获取实际网页内容
fetch <api-url>      # 从真实API获取JSON
ip                   # 您的实际公网IP和位置 (ipapi.co)
weather [city]       # 实时天气数据 (Open-Meteo)
ping                 # 真实网络延迟测试
news                 # 来自Hacker News的科技头条

# 真实系统数据
cpu-info             # 实际CPU核心和用量 (navigator.hardwareConcurrency)
memory-info          # 真实内存统计 (Performance API)
system-info          # 浏览器性能指标
netstat              # 连接类型检测

# 工具
calc <expr>          # 数学计算器
base64 <text>        # Base64编码
hash <text>          # 哈希生成
uuid                 # UUID创建
password             # 安全密码生成
```

---

## 技术架构

### 技术栈

- **框架**: React 19 + TypeScript
- **状态管理**: Zustand
- **构建工具**: Vite 8 + 优化打包分割
- **Python 运行时**: Pyodide 用于浏览器内 Python 执行
- **图标**: Lucide React 图标库
- **样式**: CSS-in-JS + 完善主题系统

### 架构亮点

**窗口管理系统**

- GPU 加速渲染 (will-change 优化)
- 键盘快捷键窗口吸附
- 多桌面架构与窗口移动
- 聚焦窗口发光效果和动画
- 惰性组件加载与预加载策略

**应用注册表**

- 集中式应用定义系统
- 分类组织
- 图标和元数据管理
- 动态组件加载
- ID 验证防止重复

**虚拟文件系统**

- 树状文件结构
- 路径解析和规范化
- 增删改查操作与验证
- localStorage 内容存储
- 搜索和导航功能

**性能优化**

- GPU 加速动画 (translateZ(0))
- 内容遏制 (contain: layout/paint)
- 惰性加载与动态导入
- 打包分割加速初始加载
- Performance API 集成获取真实指标

---

## 快速开始

### 在线使用

访问 [GitHub Pages 部署](https://saya-ch.github.io/WebLinuxOS/) 即可立即使用，无需安装。

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git

# 进入项目
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建
npm run preview
```

### 构建配置

```bash
# 本地构建 (base path = /)
npm run build:local

# GitHub Pages 构建 (已配置部署)
npm run build:github
```

---

## 键盘快捷键

### 全局系统快捷键

| 快捷键 | 操作 |
|--------|------|
| Ctrl+Shift+L | 切换应用启动器 |
| Ctrl+Shift+K | 全局搜索 |
| Ctrl+Shift+P | 命令面板 |
| Ctrl+Alt+1-9 | 切换到桌面 1-9 |
| Ctrl+Alt+ArrowLeft/Right | 上一个/下一个桌面 |
| Ctrl+Shift+Alt+1-9 | 移动窗口到桌面 |
| Alt+Tab | 窗口循环 |
| Ctrl+W | 关闭聚焦窗口 |
| Ctrl+M | 最小化窗口 |
| F11 | 切换全屏 |

### 应用快速启动

| 快捷键 | 应用 |
|--------|------|
| Ctrl+T | 终端 |
| Ctrl+E | 文件管理器 |
| Ctrl+B | Web 浏览器 |
| Ctrl+, | 系统设置 |
| Ctrl+G | 代码编辑器 |
| Ctrl+D | 系统监视器 |
| Ctrl+Shift+C | 计算器 |
| Ctrl+Shift+N | 笔记 |
| Ctrl+Shift+W | 天气 |
| Ctrl+Shift+M | 音乐播放器 |

---

## API 集成

WebLinuxOS 集成多个公共 API 提供真实功能：

| API | 用途 | 应用 |
|-----|------|------|
| Open-Meteo | 天气数据 | 天气应用、终端、仪表盘 |
| ipapi.co | IP 地理位置 | 终端 ip 命令 |
| CoinGecko | 加密货币 | 加密货币追踪器、仪表盘 |
| Hacker News | 科技新闻 | 新闻阅读器、仪表盘 |
| GitHub | 仓库数据 | GitHub 探索器、仪表盘 |
| Wikipedia | 文章 | 维基百科阅读器 |

---

## 性能指标

从浏览器 API 获取的真实性能数据：

- **CPU 信息**: `navigator.hardwareConcurrency` 获取实际核心数
- **内存信息**: `navigator.deviceMemory` 和 JS Heap 统计
- **网络信息**: `navigator.connection` 提供带宽和延迟
- **Performance API**: 导航计时和 FPS 监控

---

## 部署

### GitHub Pages

项目已配置 GitHub Pages 部署：

1. 构建输出到根目录（非 `/dist`）
2. `.nojekyll` 文件阻止 Jekyll 处理
3. 自定义 404.html 处理 SPA 路由
4. Base path 配置为仓库 URL

### 构建流程

```bash
# 清理之前构建
npm run clean

# 构建 GitHub Pages
npm run deploy

# 输出结构：
# /workspace/WebLinuxOS/
#   index.html
#   favicon.svg
#   assets/ (JS/CSS bundles)
#   manifest.json
```

---

## 浏览器兼容性

WebLinuxOS 支持所有现代浏览器：

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

要求：
- JavaScript 启用
- localStorage 可用
- WebGL 支持（用于粒子）
- Web APIs 访问

---

## 贡献指南

欢迎贡献！改进领域：

- 带真实功能的新应用
- 更多 API 集成
- UI/UX 增强
- 性能优化
- Bug 修复和错误处理
- 文档改进

提交 PR 前请阅读现有代码结构。项目使用：
- React 函数组件 + Hooks
- Zustand 状态管理
- CSS-in-JS 样式
- TypeScript 类型安全

---

## 路线图

### v9.1.0 (当前)

- 新增实时协作白板应用
- 支持多用户协作绘图
- 画笔、橡皮擦、形状工具
- 颜色选择和大小调整
- 撤销/重做操作
- 导出和分享功能

### 未来计划

- 实时文档协作编辑器
- WebRTC 视频会议集成
- 云存储同步功能
- 更多公共 API 集成
- 移动端适配优化

---

## 许可证

MIT License - 开源免费使用

---

## 致谢

基于优秀的开源工具构建：

- [React](https://react.dev/) - UI 框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [Pyodide](https://pyodide.org/) - Python 运行时
- [Lucide Icons](https://lucide.dev/) - 图标库
- [Open-Meteo](https://open-meteo.com/) - 天气 API

---

**WebLinuxOS 展示了 Web 应用可以超越简单工具，提供完整、功能性的环境用于实际工作。**