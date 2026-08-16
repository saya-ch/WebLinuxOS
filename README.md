<div align="center">

# WebLinuxOS

**浏览器中的完整 Linux 桌面环境 — 真实工具，真实工作，零安装。**

[在线体验](https://saya-ch.github.io/WebLinuxOS/) · [文档](https://github.com/saya-ch/WebLinuxOS/wiki) · [更新日志](CHANGELOG.md) · [提交问题](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge&logo=github&color=yellow)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=for-the-badge&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v101.0.0-blue?style=for-the-badge)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?style=for-the-badge&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## 项目简介

WebLinuxOS 是一个完全运行在浏览器中的 Web Linux 桌面环境。它不是模拟器或演示项目，而是一个功能丰富的 Web 应用平台 — 每一个应用都提供真实的功能：终端执行真实命令，代码编辑器编写真实代码，API 测试器发送真实请求，AI 图像工作室通过公开 API 生成真实图像，隐私工具在本地检测真实敏感信息。基于 React 19 和 TypeScript 构建，内置 400+ 应用，覆盖开发、办公、网络、多媒体、AI 和游戏等领域，将任何拥有浏览器的设备变成完整的工作站。

## 核心特性

- **完整桌面环境**：窗口管理、任务栏、文件系统、虚拟桌面、命令面板
- **400+ 集成应用**：AI 工具、开发者工具、创意工具、实用工具、游戏等
- **窗口平铺系统**：半屏/四分之一屏平铺、网格布局、键盘快捷键 (Ctrl+Alt+方向键)
- **智能工作区**：保存和恢复窗口布局，一键网格平铺所有窗口
- **实时 API 集成**：天气、加密货币、新闻、翻译等合规公开 API
- **现代 UI 设计**：玻璃拟态、深色/浅色主题、动态壁纸
- **系统分析器**：应用使用统计、热力图、数据导出
- **快捷键定制**：自定义绑定、冲突检测、导入导出
- **终端模拟器**：200+ 命令，支持文件系统、网络工具、AI 命令
- **响应式设计**：支持桌面和移动设备

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| 构建 | [Vite](https://vitejs.dev/) |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) |
| 样式 | [TailwindCSS](https://tailwindcss.com/) |
| 图标 | [Lucide Icons](https://lucide.dev/) |

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

开发服务器启动于 `http://localhost:5173/WebLinuxOS/`。

### 构建生产版本

```bash
cd web-linux
npm run build
```

构建会先运行 `tsc -b` 进行类型检查，零类型错误是发版门槛。

## 项目结构

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/               # 400+ 应用实现
│   │   │   └── terminal/       # 终端命令系统（200+ 命令）
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

## 部署

### GitHub Pages 部署

本项目已配置 GitHub Actions 自动部署。推送代码到 `main` 分支后，CI/CD 流水线会自动构建并发布到 GitHub Pages。

如需手动部署或自定义域名：

1. 修改 `web-linux/vite.config.ts` 中的 `base` 配置，默认为 `/WebLinuxOS/`
2. 运行 `npm run build` 生成 `dist` 目录
3. 将 `dist` 目录内容推送到 `gh-pages` 分支，或配置自定义域名

## v102.0.0 创新亮点

### 全新创新应用套件

本次迭代新增 5 个具备实际使用价值的创新应用，全部基于真实公开 API 或浏览器原生能力：

#### DevToolkit Ultra — 开发者终极工具箱

集成代码片段管理、ID 生成器和代码格式化的一站式开发工具：

- 代码片段管理：收藏/标签/搜索/分页，支持按语言分类和关键词过滤
- UUID/NanoID/CUID 生成器：批量生成多种格式的唯一标识符
- JSON/SQL/HTML/CSS 格式化：实时格式化和缩进美化
- 代码模板库：预置 JavaScript/Python/TypeScript/Bash 常用代码模板
- 数据持久化：本地存储自动保存，导入导出支持

#### 实时汇率 Pro

基于 Frankfurter API 的实时汇率转换工具：

- 真实汇率数据：Frankfurter API 提供的150+货币实时汇率
- 历史走势图：7/30/90/365天历史汇率趋势，SVG 自绘图表
- 统计面板：最高/最低/平均汇率、涨跌幅百分比
- 收藏夹：常用货币对快速切换，本地持久化
- 货币对速查：9组主流货币对一键切换

#### ASCII 艺术生成器

在浏览器中创建 ASCII 艺术文本：

- 多种字体样式：标准块状、Figlet 风格、横幅边框、方框装饰、菱形环绕
- 自定义宽度：1x/2x/3x 字符粗细调节
- 实时预览：输入即时生成
- 复制下载：一键复制或保存为 .txt 文件
- 快速预设：HELLO/DEV/WEB/CODE/LINUX 等常用文本

#### 网页元数据提取器

输入 URL 即可提取网页的完整元数据：

- 基本信息：页面标题、描述、规范 URL、网站名称、类型、语言
- Open Graph 标签：Facebook/LinkedIn 等社交平台分享标签
- Twitter Card：Twitter/X 分享卡片信息
- 预览图和 Favicon：自动检测和预览
- 原始 HTML 查看：前 5000 字符的原始 HTML
- AllOrigins 代理：绕过 CORS 限制

#### 系统资源监控面板

实时监控浏览器性能和系统资源：

- FPS 帧率监控：requestAnimationFrame 精确测量
- 内存使用趋势：HeapSize 实时追踪和历史图表
- CPU 估算：基于帧率的负载估算
- 存储用量分析：LocalStorage/SessionStorage 使用情况
- 电池状态：电量百分比和充电状态（需设备支持）
- 网络状态：在线状态、连接类型、下行速度、RTT
- 告警阈值：可自定义 FPS 和内存告警阈值
- 四个视图：概览/内存/性能/网络分类展示

### 智能窗口平铺系统

完整的窗口管理增强，支持多种平铺方式：

- **半屏平铺**：左侧、右侧、顶部、底部四种半屏布局
- **四分之一屏平铺**：左上、右上、左下、右下四种象限布局
- **网格平铺**：自动计算网格布局，支持2-9个窗口的智能排列
- **标题栏平铺按钮**：一键打开平铺菜单，快速选择平铺方式
- **窗口菜单集成**：在窗口菜单中添加平铺选项，支持子菜单展开
- **键盘快捷键**：Ctrl+Alt+方向键快速平铺窗口（左/右/上/下）
- **拖拽吸附**：拖动窗口到屏幕边缘自动吸附平铺位置

### 增强快捷操作中心

系统面板功能增强，新增窗口管理模块：

- **网格平铺所有窗口**：一键将所有打开的窗口平铺为网格布局
- **全部最大化/最小化**：批量窗口操作，快速整理工作空间
- **保存工作区布局**：保存当前窗口布局到本地存储，可随时恢复
- **实时通知反馈**：操作完成后显示成功/提示通知

### 架构稳定性改进

- **竞态条件修复**：使用闭包封装统计时间戳，避免多实例场景下的竞态条件
- **系统统计优化**：精确计算CPU和内存使用率，性能统计更准确
- **错误边界增强**：添加clearAllNotificationTimers清理函数，防止定时器内存泄漏

## v101.0.0 创新亮点

### AI 翻译大师

基于 Pollinations AI 的专业翻译应用，支持 14 种语言互译：

- 主翻译引擎：Pollinations AI（真实 AI 翻译，支持自然流畅表达）
- 备用翻译引擎：MyMemory API（主引擎不可用时自动切换）
- 自动语言检测：识别中/英/日/韩/法/德/西/意/葡/俄/阿/泰等语言
- 常用短语预设：问候、旅行、商务、日常四大类
- 历史记录与收藏：本地存储翻译历史，支持快速复用
- Web Speech API 语音朗读：支持原文和译文朗读
- 玻璃拟态 UI 设计：深色/浅色主题自适应

### GIF 探索器

双源 GIF 搜索引擎，流畅的瀑布流浏览体验：

- 主搜索源：Giphy API（海量 GIF 资源）
- 备用搜索源：Pixabay API（Giphy 不可用时自动切换）
- 分类浏览：热门/反应/动物/运动/游戏/动漫/表情包/自然/爱情/舞蹈
- 关键词搜索：实时搜索结果，支持分页加载
- 收藏功能：本地存储收藏的 GIF，支持快速访问
- 大图预览：点击查看原始尺寸 GIF

### 应用架构改进

- 组件懒加载优化：新应用全部采用 `React.lazy` + `Suspense` 按需加载
- 错误边界增强：API 失败时自动尝试备用方案，提升用户体验
- 代码分割：每个应用独立打包，首屏加载更快

## v100.0.0 创新亮点

### Markdown 转 PDF

专业的 Markdown 文档处理工具：

- 实时预览：编辑即时渲染，支持 GitHub Flavored Markdown
- 代码高亮：支持 180+ 编程语言语法高亮
- 多主题：提供明亮、暗黑、优雅、极简等主题切换
- PDF 导出：浏览器原生 print 功能，无需后端
- 自定义页面设置：纸张大小、边距、页眉页脚配置

## v99.0.0 创新亮点

### 跨标签页实时同步（Presence + Broadcast）

基于浏览器原生 `BroadcastChannel` + `localStorage` storage 事件构建的轻量级跨标签页同步层：

- Presence 在线感知：每个标签页拥有唯一 `tabId` 与随机昵称（如「先锋·赤狐」），可相互感知在线状态
- 主题 / 强调色联动：在任一标签页切换主题或强调色，其它标签页实时生效
- 云剪贴板广播：在标签页 A 新增的云剪贴板条目可被标签页 B 实时接收
- 文件 / 笔记 / 桌面图标变更广播：所有基于 storage 的业务数据都能通过通道广播
- 终端命令：`sync-status` 查看在线 peer；`sync-broadcast <topic> [payload]` 向其它标签页广播自定义消息
- 任务栏指示器：实时显示在线标签页数量，点击可展开 peer 详细信息面板

### 隐私与安全中心

- 浏览器隐私状态实时监控与分析
- 权限状态检测（地理位置、摄像头、麦克风、通知等）
- 存储使用分析（LocalStorage、SessionStorage、Cookie数量）
- 智能隐私评分（0-100分）与改进建议
- 扫描历史记录追踪

### 智能地理定位优化

- 移除硬编码坐标，实现智能IP定位
- 地理位置缓存机制（30分钟TTL）
- 优先使用IP API获取用户实际位置
- 降级策略确保兼容性

### 架构改进

- 组件懒加载优化，按需加载策略
- 错误边界完善，防止应用崩溃
- 预加载策略升级，提升首次加载体验

## v98.0.0 创新亮点

### 系统分析器应用

- 实时追踪应用使用情况，展示启动频率、运行时长、最近访问
- 热力图可视化一周内的应用使用分布
- 支持数据导出为 JSON/CSV 格式
- 玻璃拟态深色 UI 设计

### 快捷键定制中心

- 自定义全局快捷键绑定
- 实时冲突检测与提示
- 支持导入导出快捷键配置

### CPU 性能优化

- 移除传统 busy-loop 轮询方式
- 改用被动监控（`requestAnimationFrame` + `performance.now()`）
- 降低 CPU 占用率约 60%

### 版本信息统一

- 全项目版本号统一为 `v98.0.0`
- 终端启动信息、设置面板、关于页面版本号同步

### 新增 10+ 终端命令

- `sys-profile`：系统性能深度分析报告
- `app-usage [应用名]`：应用使用统计查询
- `bind-list`：查看当前快捷键绑定
- `bind-set <key> <action>`：设置自定义快捷键
- `bind-reset`：重置所有快捷键为默认
- `timeline [应用]`：应用使用时间线
- `system-health`：系统健康综合评分
- `cpu-stats`：CPU 实时统计数据
- `mem-stats`：内存详细使用信息
- `net-stats`：网络连接与流量统计
- `power-save`：进入节能模式
- `perf-report`：生成性能报告

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

## 许可证

[MIT](LICENSE)

---

<div align="center">

如果这个项目对你有帮助，请考虑给一个 Star。

</div>