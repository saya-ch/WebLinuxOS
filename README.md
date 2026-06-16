# WebLinuxOS

一个完全运行在浏览器中的 Linux 风格桌面环境。无后端依赖，纯客户端运行，支持真实 API 集成。

## 在线演示

访问在线演示: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## 概览

WebLinuxOS 将经典桌面环境的使用体验带入浏览器。它提供多窗口管理、虚拟桌面、文件系统、终端模拟器，以及 150+ 应用程序——全部直接运行在浏览器中，无需服务器。

相比纯模拟的桌面界面，WebLinuxOS 接入了真实的公开 API，使部分应用具有实际使用价值。本项目不仅是一个桌面模拟器，更是一个具有实际应用价值的在线工具平台。

## 主要特性

### 桌面环境

- 多窗口图形化桌面系统，支持拖拽、缩放、最小化、最大化
- 多个虚拟桌面，可自由切换
- 统一的启动菜单、系统托盘、全局搜索
- 命令面板（Command Palette）快速访问系统命令
- 右键菜单、窗口层叠、窗口动画
- 暗色 / 亮色主题切换

### 开发工具

- **在线代码运行器** - 支持 JavaScript 和 Python（通过 Pyodide）实时执行，包含多种代码模板
- **代码编辑器** - 多文件，基础语法高亮
- **代码格式化 / 代码片段管理器** - 保存与检索常用片段
- **终端模拟器** - 多命令支持：ls、cat、echo、cd、help 等
- **Python 运行时** - 通过 Pyodide 在浏览器中直接运行 Python
- **REST / API 测试工具** - 直接测试公开 API
- **GitHub 热门仓库** - 通过 GitHub 搜索 API 获取最近活跃的热门仓库
- **Web工具中心** - 集成16种实用开发工具：颜色选择器、渐变生成器、UUID生成、Hash生成、JWT解码、MIME类型参考、HTTP状态码查询等

### 系统工具

- **系统监控中心** - 实时显示CPU、内存使用率，进程管理，性能历史图表
- **文件管理器** - 虚拟文件系统，持久化到 IndexedDB
- **密码管理器** - 浏览器本地加密保存

### AI辅助工具

- **AI智能助手** - 智能对话界面，支持代码解释、翻译、概念解释等快捷操作（模拟演示版）

### 生产力工具

- **文本与 Markdown 编辑器** - 带实时预览
- **计算器** - 支持基础运算与常用数学函数
- **日历** - 简单的日历视图
- **待办清单** - 基础任务管理
- **智能笔记** - 带标签与归档
- **思维导图** - 基础节点化编辑
- **演示文稿** - 简易幻灯片
- **习惯追踪**
- **看板** - 拖拽式任务组织

### 信息与数据

- **天气** - 基于 Open-Meteo API 的实时天气与空气质量
- **汇率转换** - 基于 open.er-api.com 的实时汇率（参考/离线回退）
- **新闻阅读器** - 接入 Hacker News Algolia API 与 Spaceflight News API
- **单位转换**

### 多媒体与绘图

- **音乐播放器 / 视频播放器** - 使用浏览器原生媒体
- **Paint（绘图）** - 简易画布
- **图像查看器**
- **摄像头**（需浏览器权限）
- **屏幕截图工具**

### 游戏与娱乐

- **Snake** - 经典贪吃蛇
- **Tetris** - 方块游戏
- **虚拟宠物**

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建（输出到 ../）
npm run build

# 构建（用于 GitHub Pages）
npm run deploy
```

## 快捷键

| 快捷键 | 动作 |
|--------|------|
| Ctrl/⌘ + Shift + L | 打开启动器 |
| Ctrl/⌘ + K | 全局搜索 |
| Ctrl/⌘ + P | 命令面板 |
| Ctrl/⌘ + Q | 关闭当前窗口 |
| Ctrl/⌘ + T | 新终端 |
| Ctrl/⌘ + B | 新浏览器窗口 |
| Ctrl/⌘ + , | 系统设置 |
| Ctrl/⌘ + Shift + T | 新文本编辑器 |
| Alt + Tab | 切换窗口 |
| Ctrl + Alt + Arrow | 切换虚拟桌面 |
| Ctrl + Shift + 1-9 | 将窗口移动到指定桌面 |

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全的开发语言
- **Zustand** - 轻量级状态管理
- **Vite** - 快速构建工具
- **Pyodide** - 浏览器内的 Python 运行时
- **Lucide React** - 图标库
- **IndexedDB** - 虚拟文件系统持久化
- **Open-Meteo API** - 天气与空气质量（免费、无需密钥）
- **GitHub Public Search API** - 热门仓库数据
- **Hacker News Algolia API** - 新闻内容（免密钥）
- **Spaceflight News API** - 航天/科学新闻（免密钥）
- **open.er-api.com** - 汇率数据（免密钥）

## 架构

项目源代码组织如下：

```
web-linux/src/
  apps/                   # 应用程序 (120+)
    Weather.tsx          # 天气 - Open-Meteo API
    NewsReader.tsx       # 新闻阅读器 - Hacker News / Spaceflight News
    GitHubTrending.tsx   # GitHub 热门仓库
    CurrencyConverter.tsx # 汇率转换
    Terminal.tsx         # 终端模拟器
    CodeEditor.tsx       # 代码编辑器
    ...
  components/             # 共享 UI 组件
    desktop/             # 窗口管理器、任务栏、桌面、启动菜单
    CommandPalette.tsx
    Loading.tsx
    NotificationSystem.tsx
  store/                 # Zustand 状态管理 + 文件系统工具
  types.ts               # 类型定义
  icons.tsx              # 图标映射
  App.tsx                # 应用根组件
  main.tsx               # 入口
```

### 核心系统

1. **窗口管理器** - 多窗口，z-index 管理，拖拽与缩放，最小化/最大化
2. **虚拟文件系统** - 基于 IndexedDB 的树形文件节点
3. **终端模拟器** - 命令解析、执行、输出格式化
4. **状态管理** - Zustand 管理窗口、文件、设置、桌面状态
5. **API 整合** - 天气、GitHub 搜索、新闻、汇率等多个公开 API

## 性能

- **代码分割** - 每个应用程序按需加载
- **懒加载** - 应用程序在首次打开时加载
- **Memoization** - 使用 React.memo 优化渲染
- **GPU 加速** - 动画通过 transform 与 opacity 实现
- **本地缓存** - 天气、新闻、汇率、GitHub 搜索等结果本地缓存，减少 API 调用

## GitHub Pages 部署

仓库包含 `.github/workflows/deploy.yml`，每次推送到 main 分支会自动触发：

1. 安装依赖
2. 执行 `npm run deploy`（通过 `vite build --mode github-pages` 将 `base` 设为 `/WebLinuxOS/`，并输出到仓库根目录）
3. 上传产物并部署到 GitHub Pages

页面地址: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

部分特性（Python 运行时、剪贴板高级功能）需要较新的浏览器能力。

## 隐私与安全

- 所有数据保存在浏览器本地（localStorage / IndexedDB）
- 所有 API 调用直接从浏览器发起，不经过中间服务器
- 没有用户账户，没有遥测，没有追踪脚本

## 贡献

欢迎贡献代码、提交 Issue 或提出新功能想法：

1. Fork 这个仓库
2. 建立功能分支 (`git checkout -b feature-name`)
3. 提交你的更改
4. 推送到分支 (`git push origin feature-name`)
5. 创建 Pull Request

请在提交前执行 `npm run build` 以确认编译通过。

## 许可

MIT License - 可自由用于个人或商业用途。

---

**版本**: 5.6.0
**最后更新**: 2026-06-14
