# WebLinuxOS

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=flat-square" alt="Stars">
</p>

<p align="center">
  <strong>运行在浏览器中的完整 Linux 桌面环境</strong>
</p>

<p align="center">
  <a href="https://saya-ch.github.io/WebLinuxOS/">在线体验</a>
  ·
  <a href="https://github.com/saya-ch/WebLinuxOS/issues">问题反馈</a>
  ·
  <a href="https://github.com/saya-ch/WebLinuxOS">项目主页</a>
</p>

---

## 简介

WebLinuxOS 是一个功能完整的 Web 端 Linux 桌面环境，无需安装即可在浏览器中运行。它提供了真实的窗口管理、虚拟文件系统、终端模拟器以及丰富的应用程序生态。

**核心特性：**
- 完整的桌面体验，支持多窗口管理
- 虚拟文件系统，支持文件操作和持久化存储
- 功能丰富的终端，内置 60+ 命令和 Python 运行时
- 65+ 预装应用程序，覆盖开发、办公、娱乐等场景
- 集成真实 API，提供实用的网络工具

---

## 功能展示

### 桌面环境

- 多虚拟桌面支持（最多4个桌面）
- 窗口拖拽、调整大小、最小化/最大化
- 右键上下文菜单
- 动态壁纸和主题切换
- 全局快捷键支持

### 终端模拟器

- 60+ 内置命令（ls, cd, cat, mkdir, rm 等）
- Python 3 运行时支持（基于 Pyodide）
- 命令历史记录和自动补全
- 趣味命令（cowsay, fortune, sl 等）

### 应用程序

| 类别 | 应用 |
|------|------|
| 系统工具 | 文件管理器、终端、系统监视器、设置、软件中心 |
| 开发工具 | 代码编辑器、API 测试器、JSON 格式化、正则测试器、GitHub 热门 |
| 办公工具 | 文本编辑器、Markdown 编辑器、日历、待办事项、笔记 |
| 网络工具 | 浏览器、IP & DNS 查询、天气、新闻阅读器 |
| 多媒体 | 音乐播放器、视频播放器、画图、图片查看器 |
| 实用工具 | 计算器、密码管理器、番茄钟、取色器、QR 生成器 |

---

## 技术栈

- **React 19** - UI 组件框架
- **TypeScript** - 类型安全开发
- **Zustand** - 状态管理
- **Vite** - 构建工具
- **Pyodide** - 浏览器内 Python 运行时

---

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git

# 进入目录
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 构建

```bash
# 生产构建
npm run build

# 预览生产版本
npm run preview

# 部署到 GitHub Pages
npm run deploy
```

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Super + T` | 打开终端 |
| `Super + E` | 打开文件管理器 |
| `Super + B` | 打开浏览器 |
| `Super + ,` | 打开设置 |
| `Super + Shift + K` | 智慧搜索 |
| `Super + Shift + L` | 打开启动器 |
| `Alt + Tab` | 切换窗口 |
| `Ctrl + Alt + 1-4` | 切换虚拟桌面 |

---

## 项目结构

```
web-linux/
├── src/
│   ├── apps/              # 应用程序组件
│   ├── components/        # 核心UI组件
│   │   └── desktop/       # 桌面、窗口、任务栏
│   ├── store.tsx          # 全局状态管理
│   ├── apps.tsx           # 应用注册表
│   └── types.ts           # TypeScript类型定义
├── public/                # 静态资源
└── package.json
```

---

## 更新日志

### v3.2.0 (2026-05-26)

**新增功能**
- IP & DNS 查询工具 - 集成真实 API，支持 IP 地理位置查询和 DNS 记录查询

**代码质量改进**
- 修复 ESLint 错误和不必要的转义字符
- 修复 React 19 纯度警告，优化组件渲染性能
- 改进代码片段管理器中的代码格式

### v3.1.0 (2026-05-26)

- 新增代码片段管理器应用
- 支持 16 种编程语言
- 标签分类和全文搜索
- 导入/导出功能

---

## 贡献

欢迎提交 Issue 和 Pull Request。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

---

## 许可证

MIT License

---

<p align="center">
  Made with passion for the web
</p>
