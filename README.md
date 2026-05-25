# WebLinuxOS 🐧

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge" alt="Stars">
</p>

> **一个完全运行在浏览器中的功能性 Linux 桌面环境** - 让Web体验如同本地应用

<p align="center">
  <a href="https://saya-ch.github.io/WebLinuxOS/">🚀 在线演示</a>
  <span> | </span>
  <a href="README_en.md">📖 English</a>
  <span> | </span>
  <a href="https://github.com/saya-ch/WebLinuxOS/issues">🐛 报告问题</a>
</p>

---

## ✨ 为什么选择 WebLinuxOS？

🤔 **想要一个轻量级的在线工作环境？**
- 无需安装，随时随地访问
- 跨平台兼容，手机、平板、电脑都能用
- 数据云端同步，换设备也能无缝工作

🎯 **适合人群：**
- 开发者：快速启动临时开发环境
- 学生：在线学习和笔记整理
- 设计师：创意草图和协作
- 普通用户：日常文档处理和浏览

---

## 🎯 核心亮点

### 🖥️ 完整的桌面体验

- **现代化窗口管理** - 拖拽、调整大小、最小化、最大化和焦点管理
- **虚拟文件系统** - 分层文件树，支持通过 CustomEvent 进行跨应用文件共享
- **高级启动器** - 快速搜索和启动应用程序，支持分类浏览
- **多桌面支持** - 最多4个虚拟桌面，轻松切换和管理工作空间
- **快速设置面板** - 一键访问 Wi-Fi、蓝牙、音量、亮度和主题设置
- **流畅动画** - 70+ CSS 动画效果，窗口打开/关闭/最小化动画流畅自然
- **玻璃态设计** - 半透明面板和精致的微交互效果

### 🛠️ 强大的终端模拟器

- **40+ 内置命令** - 完整的命令行工具集
- **趣味命令** - cowsay、fortune、sl 等有趣的 ASCII 艺术命令
- **Python 运行时** - 浏览器内实时执行 Python 代码（由 Pyodide 提供）
- **语法高亮** - 代码编辑器支持多语言语法高亮
- **实时执行** - JavaScript 和 Python 代码即时运行和调试

### 🎨 精美用户界面

- **玻璃态设计** - 半透明面板、流畅动画和精致微交互
- **明暗主题** - 一键切换的现代配色方案
- **流畅动画** - 60+ CSS 动画效果，打造沉浸式体验
- **响应式布局** - 适配各种屏幕尺寸

### 📱 64个预装应用程序

#### 系统工具 (20个)
| 应用 | 描述 |
|------|------|
| 📁 文件管理器 | 浏览和管理虚拟文件系统 |
| 💻 终端 | 40+命令 + Python运行时 |
| 📊 系统监视器 | 实时CPU、内存、网络监控图表 |
| ⚙️ 设置 | 主题、壁纸、系统配置 |
| 📦 软件中心 | 浏览和安装应用 |
| 🔄 软件包管理器 | 系统包和依赖管理 |
| 💾 磁盘使用分析器 | 可视化磁盘空间使用 |
| 🖥️ 进程监视器 | 查看和管理运行中的进程 |
| 🌐 网络监视器 | 监控网络流量和连接 |
| 🛡️ 防火墙 | 防火墙规则和安全策略配置 |

#### 办公工具 (11个)
| 应用 | 描述 |
|------|------|
| 📝 文本编辑器 | 全功能文本编辑，支持语法高亮 |
| 📋 记事本 | 轻量级纯文本编辑器 |
| 📅 日历 | 日期选择器和事件管理 |
| 📄 PDF 查看器 | PDF 文档查看 |
| 📊 电子表格 | 创建和编辑表格 |
| 🎭 演示文稿 | 创建和展示幻灯片 |
| 👥 通讯录 | 联系人信息管理 |
| 📓 笔记 | 富文本笔记 |
| ✅ 待办事项 | 任务跟踪和管理 |
| 📖 字典 | 词条定义和查询 |
| 🌐 翻译器 | 多语言文本翻译 |

#### 互联网应用 (4个)
| 应用 | 描述 |
|------|------|
| 🌐 浏览器 | 基于 iframe 的真实网页加载 |
| 📧 邮件客户端 | 邮件撰写和管理 |
| 💬 即时通讯 | 实时聊天界面 |
| 🗺️ 地图 | 交互式地图查看器 |

#### 多媒体工具 (8个)
| 应用 | 描述 |
|------|------|
| 🖼️ 图片查看器 | 图片浏览和管理 |
| 🎵 音乐播放器 | Web Audio API 音频播放 |
| 🎨 音乐可视化器 | 实时音频可视化 |
| 🎬 视频播放器 | 视频文件播放 |
| 🎨 画图 | 绘图和图像编辑画布 |
| 📷 摄像头 | 实时摄像头访问，支持滤镜 |
| 🎥 屏幕录制器 | 通过 getDisplayMedia API 捕获屏幕 |
| 🎙️ 录音机 | MediaRecorder API 音频录制 |

#### 开发工具 (6个)
| 应用 | 描述 |
|------|------|
| 💻 代码编辑器 | 语法高亮 + Python 执行 |
| 🎮 代码运行器 | 浏览器内运行 HTML/CSS/JavaScript |
| 📚 命令参考 | 可搜索的命令文档 |
| 🔍 正则表达式测试 | 正则表达式测试和调试工具 |
| 📋 JSON 格式化 | JSON格式化、验证和树状查看 |
| 📷 QR码生成器 | 二维码生成和管理工具 |

#### 趣味应用 (16个)
| 应用 | 描述 |
|------|------|
| 🧠 思维导图 | 可视化思维整理工具 |
| 📌 便签墙 | 便利贴式笔记墙 |
| ⏱️ 番茄工作法 | 时间管理和专注工具 |
| 🔐 密码管理器 | 安全凭证存储 |
| 🎨 取色器 | 颜色选择和转换 |
| 🔍 放大镜 | 屏幕放大工具 |
| 📦 归档管理器 | 压缩和解压文件 |
| 📋 剪贴板管理 | 智能剪贴板历史 |
| ⚡ 快捷命令 | 常用命令快捷方式 |
| 🔎 智慧搜索 | 全局智能搜索 |
| 🤖 AI 助手 | 智能对话助手 |
| 📋 任务看板 | 看板式任务管理 |
| 🐍 贪吃蛇 | 经典贪吃蛇游戏 |
| 🧱 俄罗斯方块 | 经典俄罗斯方块游戏 |
| 🐾 虚拟宠物 | 互动电子宠物 |
| ☁️ 云同步 | 数据备份与恢复 |

---

## 💡 实用功能

### 📤 数据备份与恢复
使用**云同步**应用，您可以：
- 一键导出所有系统数据到本地文件
- 选择性备份：文件系统、设置、壁纸等
- 跨设备恢复数据
- JSON格式，便于查看和验证

### 🔧 终端高级功能
- **40+ 内置命令** - 完整的命令行工具集
- **系统信息查看** - `sysinfo` 命令
- **数据同步** - `sync --export/import` 命令
- **缓存清理** - `clear-cache` 命令
- **Python执行** - `python3 -c "code"` 直接运行Python代码
- **趣味命令** - cowsay、fortune、sl 等 ASCII 艺术

---

## 🚀 快速开始

### 环境要求

- Node.js 18+ 和 npm 9+

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

然后在浏览器中打开终端显示的本地开发服务器地址（通常是 `http://localhost:5173`）。

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### 部署到 GitHub Pages

```bash
# 自动构建并部署
npm run deploy
```

---

## 🏗️ 架构设计

WebLinuxOS 采用现代化的组件驱动架构：

```
web-linux/
├── src/
│   ├── apps/              # 60个应用程序组件
│   ├── components/        # 核心UI组件
│   │   └── desktop/       # 桌面、窗口、任务栏、开始菜单
│   ├── store.tsx          # Zustand 全局状态管理
│   ├── apps.tsx           # 应用程序注册表
│   ├── icons.tsx          # SVG 图标组件
│   ├── types.ts           # TypeScript 类型定义
│   ├── index.css          # 全局样式
│   ├── App.tsx            # 根组件
│   └── main.tsx           # 入口点
└── package.json
```

### 核心组件层

- **桌面 (Desktop)** - 渲染壁纸、桌面图标，处理右键上下文菜单
- **窗口管理器 (WindowManager)** - 管理窗口生命周期、z-index 堆叠和焦点顺序
- **窗口 (Window)** - 独立的窗口框架，包含拖拽、调整大小、最小化、最大化和关闭控制
- **任务栏 (Taskbar)** - 应用程序启动器、运行中的应用程序指示器和系统托盘
- **开始菜单 (StartMenu)** - 分类应用启动器

### 状态管理

使用 Zustand 进行集中式状态管理，支持：
- 窗口状态管理
- 文件系统操作
- 主题和壁纸设置
- 多桌面管理
- 通知系统
- 文件操作历史（撤销/重做）

---

## 🎯 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| ⚛️ React | 19 | UI 组件框架 |
| 📘 TypeScript | 6 | 类型安全开发 |
| 🐻 Zustand | 5 | 全局状态管理 |
| ⚡ Vite | 8 | 构建工具和开发服务器 |
| 🐍 Pyodide | 0.24 | 浏览器内 Python 运行时 |
| 🎵 Web Audio API | - | 音频播放和处理 |
| 🎙️ MediaRecorder API | - | 音频录制 |
| 🖥️ getDisplayMedia API | - | 屏幕捕获 |
| 🎨 Canvas API | - | 实时图表渲染 |
| 🔮 CSS Animations | - | 流畅动画效果 |

---

## ⌨️ 快捷键

### 全局快捷键

| 快捷键 | 功能 |
|--------|------|
| `Super + Shift + K` | 打开智慧搜索 |
| `Super + Shift + L` | 打开启动器 |
| `Super + P` | 打开命令面板 |
| `Alt + Tab` | 切换到下一个窗口 |
| `Alt + Shift + Tab` | 切换到上一个窗口 |
| `Super + Q` | 关闭当前窗口 |
| `Super + M` | 最小化当前窗口 |
| `Super + Shift + M` | 最大化/还原当前窗口 |
| `F11` | 全屏切换 |
| `PrintScreen` | 截图 |

### 应用快捷键

| 快捷键 | 应用 |
|--------|------|
| `Super + 1-8` | 快速启动应用（1:终端, 2:文件, 3:浏览器, 4:设置, 5:计算器, 6:编辑器, 7:音乐, 8:系统监视器） |
| `Super + T` | 终端 |
| `Super + E` | 文件管理器 |
| `Super + B` | 浏览器 |
| `Super + ,` | 设置 |
| `Super + A` | 计算器 |
| `Super + Shift + T` | 文本编辑器 |
| `Super + P` | 画图 |
| `Super + I` | 图片查看器 |
| `Super + H` | 帮助 |
| `Super + Shift + M` | 音乐播放器 |
| `Super + Shift + C` | 日历 |
| `Super + K` | 代码编辑器 |
| `Super + D` | 系统监视器 |
| `Super + Shift + N` | 笔记 |

### 虚拟桌面快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Alt + 1-9` | 切换到指定桌面 |
| `Ctrl + Alt + ←/→` | 切换到上/下一个桌面 |
| `Ctrl + Shift + Alt + 1-9` | 移动窗口到指定桌面 |
| `Ctrl + Shift + Alt + ←/→` | 移动窗口并跟随切换 |

---

## 🎨 自定义

### 主题

支持深色和浅色主题，通过设置应用或快速设置面板一键切换。

### 壁纸

内置 20+ 渐变壁纸，也支持自定义图片壁纸。

### 窗口效果

支持玻璃态、极光、霓虹脉冲等多种视觉效果。

### 快速设置面板

点击任务栏的 ⚡ 图标可以快速访问：
- Wi-Fi 和蓝牙开关
- 夜间模式切换
- 音量调节滑块
- 电池状态显示
- 快速跳转到系统设置

---

## 🔧 最近的改进

### v2.3.0 (2026-05-25)
- 🚀 **性能优化**
  - 优化动态壁纸粒子动画性能，使用更高效的批量更新机制
  - 改进CSS渲染性能，添加GPU加速和硬件加速属性
  - 优化窗口管理器性能，使用CSS contain属性隔离布局和渲染
  - 改进字体渲染性能，添加抗锯齿优化
- 🎨 **UI/UX 增强**
  - 添加新的性能优化CSS类（gpu-accelerated, no-select, no-drag）
  - 优化窗口打开/关闭动画流畅度
  - 改进文本渲染清晰度
- 🛠️ **终端命令增强**
  - 新增 `welcome` 命令 - 提供详细的新手指南和快速入门
  - 新增 `search` 命令 - 在文件系统中快速搜索文件和目录
  - 新增 `translate` 命令 - 多语言翻译工具（支持中、日、韩、英）
  - 新增 `qrcode` 命令 - 快速生成QR码标识
  - 新增 `timer` 命令 - 终端计时器工具
  - 新增 `stopwatch` 命令 - 秒表工具
  - 升级终端版本至 v2.3，添加更多实用功能
- 🔧 **代码质量**
  - 优化Desktop组件中的动画逻辑，提高性能
  - 改进Window组件的CSS性能，添加will-change和contain属性
  - 优化粒子系统的状态更新方式

### v2.6.0 (2026-05-25)
- 🚀 **性能优化**
  - 实现了localStorage防抖机制，减少频繁的磁盘写入操作
  - 优化粒子动画系统，引入帧率限制（30fps）以降低CPU使用率
  - 改进动画性能，使用deltaTime确保流畅的动画效果
- 🎨 **UI/UX 增强**
  - 添加增强的滚动条样式，支持暗色和亮色主题
  - 新增精致的focus-visible样式，提升键盘导航体验
  - 添加loading状态动画（skeleton loading、pulse glow）
  - 改进拖拽和拖放交互的视觉反馈
  - 添加响应式设计优化，支持移动设备和平板
- 🛠️ **终端命令增强**
  - 新增 `sysinfo` 命令 - 显示详细的系统信息（CPU、内存、磁盘使用率）
  - 增强 `sync` 命令 - 支持 `--export`、`--import`、`--status` 选项
  - 新增 `clear-cache` 命令 - 一键清理缓存数据
  - 改进命令执行的错误处理和用户反馈
- 🔧 **代码质量**
  - 改进Zustand store中的文件操作性能
  - 优化撤销/重做操作的性能
  - 增强TypeScript类型安全性
  - 改进CSS动画和过渡效果

### v2.5.0 (2026-05-24)
- ✨ **新增正则表达式测试器** - 强大的正则表达式开发和调试工具
  - 支持实时匹配高亮
  - 分组捕获和查看
  - 快速替换功能
  - 常用正则表达式模板
- ✨ **新增 JSON 格式化工具** - 现代化的 JSON 处理工具
  - 格式化和压缩
  - 语法验证和错误提示
  - 树状视图查看
  - 缩进大小调整
- ✨ **新增 QR 码生成器** - 便捷的二维码生成工具
  - 支持多种内容类型（URL、文本、电话、邮件）
  - 自定义颜色和大小
  - 容错级别调整
  - 快捷模板选择
- 📝 更新应用列表和文档

### v2.4.0 (2026-05-24)
- ✨ **新增代码运行器应用 (Code Playground)** - 浏览器内运行 HTML、CSS、JavaScript
  - 支持 JavaScript、HTML、CSS 三种语言
  - 代码片段保存和管理
  - 实时运行和预览
- 📋 **增强文件管理器功能**
  - 新增文件下载功能
  - 可以将虚拟文件系统中的文件下载到本地
- 📝 更新应用列表和文档

### v2.3.0 (2026-05-24)
- ✨ **新增云同步应用** - 支持数据备份和恢复
  - 一键导出系统数据到JSON文件
  - 选择性备份功能
  - 跨设备数据迁移
- 🔧 **增强终端功能**
  - 新增 `sync` 命令 - 数据同步工具
  - 新增 `sysinfo` 命令 - 详细系统信息
  - 新增 `clear-cache` 命令 - 缓存清理
  - 增强 Python 支持 - `python3 -c "code"` 直接执行
- 🐛 修复终端命令解析问题
- 📝 更新 README 文档

### v2.2.0 (2026-05-24)
- 终端模拟器新增趣味命令：`cowsay`、`fortune`、`sl`
- 优化窗口动画效果，关闭和最小化动画更加流畅
- 系统监视器增加更多进程信息
- 更新系统信息显示，版本号更新至2.1.0

### 性能优化
- 使用 `requestAnimationFrame` 优化窗口拖拽和调整大小性能
- 改进窗口动画，使用 CSS cubic-bezier 缓动函数
- 添加窗口打开/关闭/最小化的流畅过渡动画
- 优化任务栏按钮悬停效果的CSS性能

### 用户体验增强
- 添加快速设置面板，一键访问常用设置
- 改进了桌面图标的缩放动画效果
- 添加了窗口最大化时的圆角动画
- 增强了任务栏图标的交互反馈
- 改进了系统托盘的视觉层次

### 代码质量
- 整理并优化了快捷键配置，移除冲突快捷键
- 添加了 PWA 支持（manifest.json）
- 修复了文件系统中未定义函数的问题
- 改进了 TypeScript 类型安全

---

## 🚀 代码质量改进

### v2.9.0 (2026-05-25)

#### 🔧 代码质量提升
- **修复TypeScript类型问题** - 将所有`any`类型替换为具体类型，提高类型安全性
- **修复case声明错误** - 修复Terminal中重复的`case 'cowsay':`和`case 'clear-cache':`标签问题
- **修复变量声明顺序** - 调整函数声明顺序，避免变量在声明前访问
- **优化构建配置** - 修复ESLint配置问题，确保构建过程顺利进行

#### 🐛 Bug修复
- 修复Terminal.tsx中的重复代码块（移除了重复的cowsay和clear-cache命令定义）
- 修复RegexTester中的未使用变量赋值问题
- 修复TaskAutomation中的变量引用错误
- 修复SystemDashboard中的函数调用顺序问题
- 修复QRGenerator中的类型安全问题
- 修复JSONFormatter中的对象类型处理
- 修复CodePlayground中的类型定义
- 修复MusicVisualizer中的WebkitAudioContext类型

#### 📈 性能优化
- 优化React组件渲染性能
- 改进状态管理效率
- 优化动画性能
- 优化终端命令执行效率

#### ✨ 新功能增强
- **增强终端命令集** - 60+内置命令，包括系统工具、趣味命令、实用工具等
- **增强AI助手** - 支持更多话题和代码生成
- **增强代码运行器** - 支持JavaScript、HTML、CSS、Markdown实时预览
- **增强文件系统** - 完整的虚拟文件系统，支持撤销/重做操作

### v2.7.0 (2026-05-25)

#### 🔧 代码质量提升
- **修复TypeScript类型问题** - 将所有`any`类型替换为具体类型，提高类型安全性
- **修复case声明错误** - 修复Terminal中20+个case语句的变量声明问题
- **修复变量声明顺序** - 调整函数声明顺序，避免变量在声明前访问
- **优化构建配置** - 修复ESLint配置问题，确保构建过程顺利进行

#### 🐛 Bug修复
- 修复RegexTester中的未使用变量赋值问题
- 修复TaskAutomation中的变量引用错误
- 修复SystemDashboard中的函数调用顺序问题
- 修复QRGenerator中的类型安全问题
- 修复JSONFormatter中的对象类型处理
- 修复CodePlayground中的类型定义
- 修复MusicVisualizer中的WebkitAudioContext类型
- 修复Terminal中的重复case标签问题

#### 📈 性能优化
- 优化React组件渲染性能
- 改进状态管理效率
- 优化动画性能

---

## 🤝 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 这个仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 开发规范

- 确保代码通过 ESLint 检查：`npm run lint`
- 确保 TypeScript 类型检查通过：`npm run typecheck`
- 确保构建成功：`npm run build`

---

## 📄 许可证

本项目基于 [MIT 许可证](https://opensource.org/licenses/MIT) 发布。

---

## 🙏 致谢

- [React](https://react.dev/) - UI 框架
- [Vite](https://vitejs.dev/) - 构建工具
- [Zustand](https://github.com/pmndrs/zustand) - 状态管理
- [Pyodide](https://pyodide.org/) - Python 运行时

---

<p align="center">
  <strong>Made with ❤️ and ☕</strong>
  <br>
  <sub>© 2024-2026 WebLinuxOS. All rights reserved.</sub>
</p>

[![Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=social)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![Forks](https://img.shields.io/github/forks/saya-ch/WebLinuxOS?style=social)](https://github.com/saya-ch/WebLinuxOS/network/members)
[![Watchers](https://img.shields.io/github/watchers/saya-ch/WebLinuxOS?style=social)](https://github.com/saya-ch/WebLinuxOS/watchers)
