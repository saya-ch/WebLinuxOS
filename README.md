# WebLinuxOS

一个运行在浏览器中的完整 Linux 桌面环境

[在线体验](https://saya-ch.github.io/WebLinuxOS/) | [中文文档](README_CN.md) | [贡献指南](CONTRIBUTING.md)

---

## 简介

WebLinuxOS 是一个生产级的 Web 操作系统，提供完整的桌面体验和真实功能。不同于普通的操作系统模拟器，WebLinuxOS 集成了实时 API、真实硬件数据和实用工具，使其成为真正可用于日常工作的平台。

无需安装任何软件，只需打开浏览器即可访问一个功能完整的 Linux 桌面环境。

---

## 核心功能

### 真实数据集成

- **实时天气**: 通过 Open-Meteo API 获取全球城市天气数据
- **网络信息**: 使用 ipapi.co 获取真实 IP 地理位置和 ISP 信息
- **加密货币**: CoinGecko API 提供实时加密货币行情
- **科技新闻**: Hacker News API 获取最新技术资讯
- **GitHub 数据**: 仓库浏览和统计数据
- **Python 执行**: Pyodide 运行时实现在浏览器中执行 Python 代码

### 完整桌面环境

- **窗口管理**: 支持拖拽、调整大小、最小化、最大化
- **多桌面**: 9个虚拟桌面支持，键盘快捷键切换
- **任务栏**: 带应用预览和系统托盘
- **应用启动器**: 支持分类过滤和搜索
- **虚拟文件系统**: 支持增删改查操作，localStorage 持久化
- **右键菜单**: 完整的上下文菜单系统

### 终端模拟器

终端提供超过 60 个功能命令：

```bash
# 文件操作
ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, tree, grep, find

# 网络命令
curl <url>           # 获取网页内容
fetch <api-url>      # 获取 JSON 数据
ip                   # 公网 IP 和位置
weather [city]       # 实时天气
ping <host>          # 网络延迟测试
news                 # 科技新闻

# 系统信息
cpu-info             # CPU 核心和用量
memory-info          # 内存统计
system-info          # 浏览器性能指标

# 工具命令
calc <expr>          # 数学计算器
base64 <text>        # Base64 编码
hash <text>          # SHA-256 哈希
uuid                 # 生成 UUID
password [len]       # 安全密码生成
translate <text>     # 文本翻译
qrcode <text>        # 生成二维码
convert <val> <from> <to>  # 单位转换
```

### 200+ 内置应用

| 类别 | 应用示例 |
|------|----------|
| 开发工具 | Python 代码编辑器、REST 客户端、API 探索器、JSON/YAML 工具、正则测试器、代码格式化 |
| 实用工具 | 实时仪表盘、天气追踪器、计算器、密码生成器、二维码创建、颜色选择器、单位转换 |
| 办公套件 | Markdown 编辑器、笔记、任务管理、日历、看板、思维导图、白板、演示文稿 |
| 网络应用 | Web 浏览器、新闻阅读器、GitHub 热门、维基百科查看器、翻译工具、加密货币追踪 |
| 多媒体 | 图片查看器、音乐播放器、视频播放器、屏幕录制、摄像头、画图工具 |
| 游戏 | 贪吃蛇、俄罗斯方块、2048、记忆翻牌、打砖块 |
| 系统工具 | 终端、文件管理器、系统监视器、进程查看器、磁盘分析 |

---

## 技术栈

- **框架**: React 19 + TypeScript
- **状态管理**: Zustand
- **构建工具**: Vite 8
- **Python 运行时**: Pyodide
- **图标**: Lucide React
- **样式**: CSS-in-JS

---

## 快速开始

### 在线体验

访问 [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/) 即可立即使用。

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git

# 进入项目目录
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 生产构建
npm run build

# 预览构建结果
npm run preview
```

### 构建配置

```bash
# 本地构建 (base path = /)
npm run build:local

# GitHub Pages 构建
npm run build:github
```

---

## 键盘快捷键

### 全局快捷键

| 快捷键 | 操作 |
|--------|------|
| Ctrl+Shift+L | 应用启动器 |
| Ctrl+Shift+K | 全局搜索 |
| Ctrl+Shift+P | 命令面板 |
| Ctrl+Alt+1-9 | 切换桌面 |
| Ctrl+Alt+←/→ | 切换上一个/下一个桌面 |
| Alt+Tab | 窗口循环切换 |
| Ctrl+W | 关闭窗口 |
| Ctrl+M | 最小化窗口 |
| F11 | 全屏切换 |

### 应用快速启动

| 快捷键 | 应用 |
|--------|------|
| Ctrl+T | 终端 |
| Ctrl+E | 文件管理器 |
| Ctrl+B | Web 浏览器 |
| Ctrl+, | 系统设置 |
| Ctrl+G | 代码编辑器 |
| Ctrl+D | 系统监视器 |

---

## API 集成

WebLinuxOS 集成多个公共 API：

| API | 用途 | 应用 |
|-----|------|------|
| Open-Meteo | 天气数据 | 天气应用、终端命令 |
| ipapi.co | IP 地理位置 | 终端 ip 命令 |
| CoinGecko | 加密货币行情 | 加密货币追踪器 |
| Hacker News | 科技新闻 | 新闻阅读器 |
| GitHub API | 仓库数据 | GitHub 探索器 |
| Wikipedia | 文章内容 | 维基百科阅读器 |

---

## 性能优化

- **GPU 加速**: 使用 will-change 和 translateZ(0) 优化动画
- **代码分割**: 按应用和依赖进行打包分割
- **惰性加载**: 应用组件按需加载
- **缓存策略**: localStorage 存储文件系统数据
- **性能监控**: 实时 FPS 和资源使用统计

---

## 部署

### GitHub Pages

项目已配置 GitHub Actions 自动部署：

1. 构建输出到根目录
2. `.nojekyll` 文件禁用 Jekyll 处理
3. 自定义 404.html 处理 SPA 路由
4. Base path 配置为 `/WebLinuxOS/`

### 手动部署

```bash
# 清理构建
npm run clean

# 构建生产版本
npm run deploy

# 提交到 GitHub
git add .
git commit -m "deploy: update build"
git push origin main
```

---

## 浏览器兼容性

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

要求：
- JavaScript 启用
- localStorage 可用
- WebGL 支持

---

## 贡献

欢迎贡献！请先阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

贡献方向：
- 新应用开发
- API 集成
- UI/UX 改进
- 性能优化
- Bug 修复
- 文档完善

---

## 许可证

MIT License

---

## 致谢

感谢以下开源项目：

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Pyodide](https://pyodide.org/)
- [Lucide Icons](https://lucide.dev/)
- [Open-Meteo](https://open-meteo.com/)
- [CoinGecko](https://www.coingecko.com/)

---

**WebLinuxOS 展示了 Web 技术的强大潜力，将完整的操作系统体验带入浏览器。**