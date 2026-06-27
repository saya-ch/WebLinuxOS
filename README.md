# WebLinuxOS

WebLinuxOS是一个完全运行在浏览器中的现代化Linux桌面环境，提供真实的桌面体验和丰富的应用程序生态系统。

[在线体验](https://saya-ch.github.io/WebLinuxOS/) | [中文文档](README_CN.md)

## 概述

WebLinuxOS是一个基于React和TypeScript构建的完整Linux操作系统模拟器，在浏览器中提供真实的桌面体验。项目包含200+应用程序，完整的窗口管理系统，虚拟文件系统，终端仿真器，并支持Python运行时。

### 核心能力

- **完整桌面环境**：窗口管理、任务栏、启动菜单、多桌面支持、动态壁纸、粒子动画效果
- **200+内置应用**：覆盖开发、办公、多媒体、互联网、游戏等领域
- **实用终端**：支持60+命令，包含文件操作、系统信息、网络工具、远程API调用
- **真实数据集成**：
  - 网络命令接入真实API（ipapi.co、Open-Meteo等）获取公网IP、地理位置、实时天气
  - 系统监控使用真实硬件数据（navigator.hardwareConcurrency、deviceMemory、Performance API）
  - 代码编辑器支持Python运行时（Pyodide）
- **虚拟文件系统**：支持文件创建、删除、复制、移动、搜索、内容编辑
- **代码编辑器**：支持Python/JavaScript代码执行，语法高亮
- **多主题支持**：深色/浅色模式，动态壁纸，自定义主题
- **本地存储持久化**：应用状态、文件内容、用户设置自动保存到localStorage

## 快速开始

### 在线体验

直接访问 [GitHub Pages](https://saya-ch.github.io/WebLinuxOS/) 即可体验完整功能。

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
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 应用分类

### 系统工具

| 应用 | 描述 |
|------|------|
| 文件管理器 | 完整的文件树浏览、搜索、拖拽上传、批量操作 |
| 终端 | 支持50+命令，包括文件操作、系统信息、网络工具 |
| 系统监视器 | 实时CPU、内存、网络监控 |
| 系统资源优化器 | 智能资源优化和清理建议 |
| 进程监视器 | 查看和管理运行中的进程 |
| 磁盘使用情况 | 可视化展示磁盘空间使用情况 |

### 开发工具

| 应用 | 描述 |
|------|------|
| 代码编辑器 | 语法高亮、Python/JS代码执行、多标签支持 |
| AI代码分析器 | 代码质量分析、bug检测、改进建议 |
| REST Client | 完整的API测试工具 |
| API探索器 | 浏览测试11个免费公开API |
| JSON/YAML格式化转换 | JSON和YAML格式互转 |
| 正则表达式测试器 | 正则表达式构建和测试 |
| Base64/URL编码解码 | 常用编码工具 |
| JWT解码验证器 | JWT token解析和验证 |
| Hash生成器 | 多种哈希算法支持 |
| GitHub探索器 | 浏览GitHub仓库和用户 |

### 实用工具

| 应用 | 描述 |
|------|------|
| 计算器 | 科学计算、货币转换、进制转换 |
| 天气 | 实时天气数据（Open-Meteo API）、7天预报 |
| 番茄钟 | 专注工作计时器 |
| 密码生成器 | 安全密码生成和强度分析 |
| QR码生成器 | 二维码创建 |
| 颜色选择器 | 配色生成和管理 |
| 单位转换器 | 长度、重量、温度等单位转换 |
| 世界时钟 | 多时区时间显示 |

### 办公应用

| 应用 | 描述 |
|------|------|
| Markdown编辑器 | 所见即所得编辑和预览 |
| 笔记应用 | 标签、搜索、星标功能 |
| 待办事项 | 任务管理和清单 |
| 日历 | 日程管理和事件提醒 |
| 思维导图 | 创意脑图工具 |
| 白板 | 绘图和协作 |

### 多媒体

| 应用 | 描述 |
|------|------|
| 图片查看器 | 图片浏览和基本编辑 |
| 音乐播放器 | 音频播放和可视化 |
| 视频播放器 | 视频播放支持 |
| 截图工具 | 屏幕截图 |
| 屏幕录制 | 录屏功能 |

### 互联网

| 应用 | 描述 |
|------|------|
| 网页浏览器 | 内置浏览功能 |
| 新闻阅读器 | RSS订阅支持 |
| GitHub趋势 | 热门仓库和开发者 |
| 翻译器 | 多语言翻译 |
| 维基百科阅读 | 百科知识查询 |
| 网络状态仪表盘 | 实时网络监控 |

### 游戏

- 贪吃蛇
- 俄罗斯方块
- 2048
- 记忆翻牌
- 弹球游戏

## 技术架构

### 技术栈

- React 19 + TypeScript
- Zustand (状态管理)
- Vite 8 (构建工具)
- Pyodide (Python在浏览器运行)
- Lucide React (图标库)
- CSS-in-JS (内联样式)

### 核心模块

- **窗口管理系统**: 支持窗口拖拽、缩放、最大化、最小化、多桌面切换
- **应用注册表**: 统一管理200+应用的定义、图标、分类和组件懒加载
- **虚拟文件系统**: 树形结构文件系统，支持缓存优化和路径解析
- **终端仿真器**: 支持60+命令，包含文件操作、系统监控、网络工具、API调用
- **组件懒加载**: 按需加载应用组件，支持预加载策略和加载状态管理

### 项目结构

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # 应用组件 (200+)
│   │   │   ├── terminal/      # 终端命令模块
│   │   │   └── ...            # 各类应用组件
│   │   ├── components/        # 桌面组件
│   │   │   ├── desktop/       # 桌面、窗口管理、任务栏
│   │   │   └── system/        # 系统组件
│   │   ├── store/             # Zustand状态管理
│   │   │   └── fileUtils.ts   # 文件系统工具函数
│   │   ├── types/             # TypeScript类型定义
│   │   ├── apps.tsx           # 应用注册表
│   │   ├── App.tsx            # 主应用入口
│   │   └── icons.tsx          # 图标组件
│   ├── public/                # 静态资源
│   └── package.json           # 项目配置
└── .github/workflows/         # GitHub Actions工作流
    └── deploy.yml             # GitHub Pages部署工作流
```

## 键盘快捷键

### 全局快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Shift+L | 切换应用启动器 |
| Ctrl+Shift+K | 全局搜索 |
| Ctrl+Shift+P | 命令面板 |
| Ctrl+Alt+1-9 | 切换桌面 |
| Ctrl+Alt+←/→ | 上/下一个桌面 |
| Alt+Tab | 切换窗口 |
| Ctrl+W | 关闭当前窗口 |
| Ctrl+M | 最小化窗口 |
| F11 | 全屏切换 |

### 应用快捷键

| 快捷键 | 应用 |
|--------|------|
| Ctrl+T | 终端 |
| Ctrl+E | 文件管理器 |
| Ctrl+B | 浏览器 |
| Ctrl+, | 设置 |
| Ctrl+G | 代码编辑器 |
| Ctrl+D | 系统监视器 |

## 终端命令参考

### 文件操作

| 命令 | 描述 |
|------|------|
| ls | 列出目录内容 |
| cd | 切换目录 |
| pwd | 显示当前目录 |
| cat | 查看文件内容 |
| mkdir | 创建目录 |
| touch | 创建文件 |
| rm | 删除文件 |
| cp | 复制文件 |
| mv | 移动文件 |
| tree | 显示目录树 |
| write | 写入文件内容 |
| append | 追加文件内容 |
| grep | 搜索文本 |
| find | 查找文件 |

### 系统信息

| 命令 | 描述 |
|------|------|
| whoami | 显示用户名 |
| hostname | 显示主机名 |
| date | 显示日期时间 |
| uptime | 显示系统运行时间 |
| neofetch | 系统信息展示 |
| ps | 进程列表 |
| top | 系统监控 |
| uname | 显示系统内核信息 |
| version | 显示版本信息 |
| about | 显示关于信息 |

### 网络工具（真实API集成）

| 命令 | 描述 |
|------|------|
| curl | 获取URL内容 |
| fetch | 获取JSON API响应 |
| ping | 测试网络延迟（真实网络测试） |
| ip | 显示真实公网IP和位置信息（ipapi.co API） |
| weather [城市] | 获取实时天气数据（Open-Meteo API） |
| news | 获取新闻头条 |
| crypto | 加密货币价格 |
| ipinfo | IP地址地理位置信息 |
| translate <文本> | 翻译文本 |

### 系统监控（真实硬件数据）

| 命令 | 描述 |
|------|------|
| cpu-info | 显示真实CPU核心数和使用率（navigator.hardwareConcurrency） |
| memory-info | 显示真实内存使用（navigator.deviceMemory + JS Heap） |
| system-info | 综合系统信息（浏览器性能API数据） |
| netstat | 网络连接信息（真实连接类型检测） |

### 实用工具

| 命令 | 描述 |
|------|------|
| help | 显示帮助信息 |
| echo | 输出文本 |
| env | 显示环境变量 |
| history | 显示命令历史 |
| clear | 清空终端 |
| alias | 设置命令别名 |
| calc <表达式> | 计算器 |
| base64 <文本> | Base64编码 |
| hash <文本> | 生成哈希 |
| uuid | 生成UUID |
| password | 生成密码 |

## 致谢

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Pyodide](https://pyodide.org/)
- [Open-Meteo](https://open-meteo.com/)
- [Lucide Icons](https://lucide.dev/)

## 许可证

MIT License
