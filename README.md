# WebLinuxOS

一个完全运行在浏览器中的 Linux 风格桌面环境。无后端依赖，纯客户端运行，支持真实 API 集成。

## 在线演示

访问在线演示: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## 项目概述

WebLinuxOS 是一个基于 Web 技术构建的完整桌面环境模拟系统，将经典 Linux 桌面的使用体验带入浏览器。它不仅是一个桌面模拟器，更是一个具有实际应用价值的在线工具平台，集成了大量实用的在线工具和真实的公开 API。

项目采用 React 19 + TypeScript + Zustand 构建，通过 Vite 进行高效打包，支持代码分割和懒加载，确保流畅的用户体验。

## 核心特性

### 桌面环境

- **多窗口管理系统** - 支持窗口拖拽、缩放、最小化、最大化，完整的 z-index 层级管理
- **多虚拟桌面** - 支持 1-9 个虚拟桌面，可通过快捷键快速切换
- **启动菜单** - 分类展示所有应用，支持搜索和快速启动
- **任务栏** - 显示当前运行窗口、系统托盘、时钟
- **全局搜索** - 快速搜索应用和文件
- **命令面板** - 快速访问系统命令和功能
- **右键菜单** - 桌面和文件上下文菜单
- **动态壁纸** - 支持粒子动画和交互式壁纸
- **主题切换** - 暗色/亮色主题

### 开发工具 (40+)

- **在线代码运行器** - 支持 JavaScript、Python (Pyodide)、TypeScript、HTML、Markdown、JSON、SQL、Bash
- **代码编辑器** - 多文件支持，语法高亮
- **代码格式化工具** - JSON/YAML/HTML/CSS 格式化
- **代码片段管理器** - 保存和管理常用代码片段
- **代码协作中心** - 分享、发现和管理代码片段，支持多语言
- **API 测试器 Pro** - 完整的 REST API 测试工具，支持历史记录和请求保存
- **REST 客户端** - 发送 HTTP 请求并查看响应
- **正则表达式测试器** - 实时测试正则表达式
- **GitHub 热门仓库** - 通过 GitHub API 获取热门项目
- **GitHub 探索器** - 搜索和浏览 GitHub 仓库
- **终端模拟器** - 支持 90+ 命令的完整终端
- **Web 工具中心** - 16 种实用开发工具集成

### 系统工具 (30+)

- **增强版系统健康监控** - 实时监控浏览器性能、内存、网络、电池状态
- **系统监控中心** - CPU、内存使用率，进程管理
- **文件管理器** - 虚拟文件系统，支持 IndexedDB 持久化
- **磁盘使用分析器** - 分析虚拟磁盘空间使用
- **进程监视器** - 查看和管理运行进程
- **网络监视器** - 监控网络连接状态
- **密码管理器** - 浏览器本地加密保存密码
- **备份工具** - 数据备份和恢复
- **系统设置** - 主题、壁纸、桌面配置

### AI 辅助工具 (10+)

- **AI 智能对话助手** - 全功能对话界面，支持多轮对话
- **AI 代码助手** - 代码解释和生成
- **AI 编程导师** - 编程学习辅助
- **AI 任务助手** - 任务规划和建议

### 生产力工具 (50+)

- **生产力中心** - 任务、目标、便签、统计一体化，支持计时、分类、优先级、数据导出
- **专业笔记应用** - 多分类管理、标签系统、Markdown 支持
- **专业待办事项** - 优先级管理、分类筛选、截止日期
- **文本编辑器** - 基础文本编辑
- **Markdown 编辑器** - 带实时预览
- **Markdown 幻灯片** - 用 Markdown 创建演示文稿
- **思维导图** - 节点化编辑
- **看板** - 拖拽式任务组织
- **番茄工作法计时器** - 支持任务标记、专注时间统计与历史回看（v6.2 新增持久化）
- **习惯追踪器** - 跟踪日常习惯
- **日历** - 日期查看和事件管理
- **计算器** - 支持基础运算和数学函数

### 信息与数据工具 (20+)

- **天气** - 基于 Open-Meteo API 的实时天气和空气质量
- **汇率转换** - 基于 open.er-api.com 的实时汇率
- **新闻阅读器** - Hacker News 和 Spaceflight News API
- **加密货币追踪器** - 实时加密货币价格
- **股票市场追踪器** - 股票信息展示
- **单位转换器** - 多种单位转换
- **IP & DNS 查询** - 网络信息查询
- **字典** - 词汇查询

### 多媒体工具 (15+)

- **音乐播放器** - 浏览器原生媒体播放
- **视频播放器** - 支持多种视频格式
- **图片查看器** - 图片浏览和展示
- **画图工具** - 简易绘图应用
- **摄像头** - 需浏览器权限
- **屏幕截图工具** - 截取屏幕内容
- **音乐可视化** - 音频可视化效果
- **音乐工作室** - 音频编辑和创作

### 游戏与娱乐 (5+)

- **贪吃蛇** - 经典贪吃蛇游戏
- **俄罗斯方块** - 方块游戏
- **虚拟宠物** - 电子宠物养成

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 开发服务器
npm run dev

# 生产构建
npm run build

# GitHub Pages 构建
npm run deploy
```

## 快捷键

| 快捷键 | 动作 |
|--------|------|
| Ctrl/Cmd + Shift + L | 打开启动器 |
| Ctrl/Cmd + K | 全局搜索 |
| Ctrl/Cmd + P | 命令面板 |
| Ctrl/Cmd + Q | 关闭当前窗口 |
| Ctrl/Cmd + T | 新终端 |
| Ctrl/Cmd + E | 文件管理器 |
| Ctrl/Cmd + B | 浏览器 |
| Ctrl/Cmd + , | 系统设置 |
| Ctrl/Cmd + A | 计算器 |
| Alt + Tab | 切换窗口 |
| Ctrl + Alt + 1-9 | 切换虚拟桌面 |
| Ctrl + Shift + Alt + 1-9 | 将窗口移动到指定桌面 |

## 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全的开发语言
- **Zustand** - 轻量级状态管理
- **Vite** - 快速构建工具，支持代码分割
- **Pyodide** - 浏览器内的 Python 运行时
- **Lucide React** - 图标库
- **IndexedDB** - 虚拟文件系统持久化

## API 集成

项目集成了多个免费公开 API，使应用具有实际使用价值：

- **Open-Meteo API** - 天气与空气质量数据
- **GitHub Public Search API** - 仓库和用户信息
- **Hacker News Algolia API** - 科技新闻内容
- **Spaceflight News API** - 航天新闻
- **open.er-api.com** - 汇率数据
- **ipapi.co** - IP 地址信息
- **JSONPlaceholder** - 测试 API

## 项目架构

```
web-linux/src/
  apps/                   # 应用程序 (150+)
    Weather.tsx          # 天气应用
    NewsReader.tsx       # 新闻阅读器
    GitHubTrending.tsx   # GitHub 热门
    Terminal.tsx         # 终端模拟器
    CodeRunner.tsx       # 代码运行器
    ...
  components/             # 共享 UI 组件
    desktop/             # 窗口管理器、任务栏、桌面
    CommandPalette.tsx   # 命令面板
    NotificationSystem.tsx # 通知系统
  store/                 # Zustand 状态管理
    fileUtils.ts         # 文件系统工具函数
    storageUtils.ts      # 存储工具函数
    defaults.tsx         # 默认配置
  types.ts               # TypeScript 类型定义
  icons.tsx              # SVG 图标组件
  App.tsx                # 应用根组件
  main.tsx               # 入口文件
```

### 核心系统

1. **窗口管理器** - 多窗口生命周期管理，z-index 层级，拖拽与缩放
2. **虚拟文件系统** - 基于 IndexedDB 的树形文件节点存储
3. **终端模拟器** - 命令解析、执行、输出格式化，支持 90+ 命令
4. **状态管理** - Zustand 管理窗口、文件、设置、桌面状态
5. **懒加载系统** - 应用按需加载，优化初始加载性能

## 性能优化

- **代码分割** - 每个应用程序独立打包，按需加载
- **懒加载** - 应用首次打开时才加载组件
- **Memoization** - React.memo 和 useMemo 优化渲染
- **GPU 加速** - 动画使用 transform 和 opacity
- **本地缓存** - API 结果缓存，减少重复请求
- **预加载** - 关键应用在空闲时预加载

## GitHub Pages 部署

仓库配置了自动部署流程 `.github/workflows/deploy.yml`：

1. 推送到 main 分支触发构建
2. 执行 `npm run deploy` 构建
3. 输出到仓库根目录
4. 自动部署到 GitHub Pages

页面地址: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

部分功能（Python 运行时、电池 API、网络信息 API）需要较新的浏览器版本。

## 隐私与安全

- 所有数据保存在浏览器本地（localStorage / IndexedDB）
- API 调用直接从浏览器发起，不经过中间服务器
- 无用户账户系统，无遥测，无追踪脚本
- 密码管理器使用浏览器本地加密存储

## 贡献指南

欢迎贡献代码、提交 Issue 或提出新功能建议：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature-name`)
3. 提交更改 (`git commit -m 'Add feature'`)
4. 推送到分支 (`git push origin feature-name`)
5. 创建 Pull Request

提交前请确保 `npm run build` 编译通过。

## 许可证

MIT License - 可自由用于个人或商业用途。

---

**版本**: 6.2.0  
**最后更新**: 2026-06-17  
**作者**: saya-ch