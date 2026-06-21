# WebLinuxOS

一个完全运行在浏览器中的 Linux 桌面环境，提供完整的窗口管理、虚拟文件系统、终端仿真器和 200+ 个实用应用程序。

## 在线体验

访问 [WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/) 即可在浏览器中体验完整的桌面环境，无需任何安装。

## 核心价值

WebLinuxOS 不仅仅是一个"操作系统模拟"，它致力于提供一个具有实际使用价值的浏览器内工作环境：

- **开发者随身工具箱** — 随时随地访问 Base64、JSON、正则、UUID、时间戳等工具
- **信息获取中心** — 天气、汇率、新闻、IP 等信息一站式查询
- **生产力工具集** — Markdown 编辑、番茄钟、笔记、任务管理
- **教学和演示平台** — 终端教学、代码运行、数据可视化

## 核心特性

### 桌面环境
- 现代化 Linux 风格界面，支持暗色/亮色主题
- 完整的多窗口管理系统（层级 z-index）
- 窗口分屏吸附功能（左/右/上/下半屏、四分之一屏、三分之一屏）
- 窗口动画效果（打开、关闭、最小化、最大化）
- 增强任务栏：应用固定、窗口切换、预览 tooltip
- 开始菜单：分类应用列表、搜索、系统快捷入口
- 全局搜索（Ctrl + K 或 Ctrl + Space）
- 多桌面工作区（Ctrl + Alt + 方向键切换）
- 通知中心系统

### 内置应用（200+）

**系统工具**
- 文件管理器 — 浏览、创建、编辑虚拟文件系统
- 终端模拟器 — 支持命令行，内置 Python 运行时（Pyodide）
- 系统监视器 Pro — 实时 CPU/FPS/内存/网络/存储指标
- 系统设置 — 主题、壁纸、多桌面、通知设置
- 任务管理器 — 查看和管理运行中的应用窗口

**开发工具**
- 代码实验室 — HTML/CSS/JS 实时预览、沙箱运行、模板库、导出独立 HTML
- 智能代码助手 — 6 种代码分析模式（解释/审查/优化/安全/文档/语言转换）
- AI 编程助手 Pro — 智能代码生成、解释、优化、代码片段库
- 开发者工具箱 Pro — Base64/URL/JSON/正则/UUID/时间戳/颜色（7 合 1）
- JWT 解码与验证 — Header/Payload/Signature 解析、时间校验、算法安全提醒
- 配色方案提取器 — 图片主色提取、WCAG 对比度检查、多格式导出
- JSON 格式化器 — 美化和压缩 JSON
- 正则表达式测试器 — 实时匹配高亮
- API 测试器 — HTTP 请求测试

**数据与信息**
- 实时数据仪表板 — 天气、汇率、加密货币、技术新闻聚合
- 天气应用 — 集成 Open-Meteo API，支持城市搜索、7 天预报、温度趋势图
- 汇率转换器 — 集成 Frankfurter.app 实时汇率，支持双向转换、历史趋势
- IP 地址查询 — 集成 ipapi.co，地理定位、ISP、时区、货币信息
- 新闻阅读器 — 集成 HN Algolia API，实时技术新闻、分类、搜索

**办公应用**
- Markdown 编辑器 Pro — 左右分栏、工具栏、导出 HTML/Markdown、字数统计
- 在线协作白板 — 多工具绘图、网格、撤销/重做、导出 PNG
- 电子表格 — 基础表格计算
- 演示文稿 — 简易幻灯片制作
- 日历 — 日程管理

**实用工具**
- 网络工具站 — IP 地理定位 / DNS over HTTPS 查询 / HTTP 状态码参考 / URL 状态检查 / 网络速度测试
- 密码生成器 — 可配置的强密码生成器
- 单位转换器 — 长度/重量/温度/体积等
- 番茄钟 Pro — 专注/休息模式、圆形进度动画、Web Audio 提示音

**多媒体**
- 音乐播放器 — 本地文件播放
- 视频播放器 — 本地视频播放
- 图片查看器 — 图片浏览
- 画图工具 — 画布绘图

**游戏**
- 贪吃蛇 — 经典小游戏
- 俄罗斯方块 — 经典小游戏

### 在线服务集成
- 实时天气数据（Open-Meteo API，免费、无需 API key）
- 实时汇率数据（Frankfurter.app，免费）
- IP 地理位置查询（ipapi.co，免费）
- DNS over HTTPS 解析（Cloudflare 1.1.1.1，免费）
- 新闻资讯（HN Algolia API，免费）
- 公开泄露密码库查询（Have I Been Pwned，k-anonymity 协议）

## 技术栈

- **前端框架**: React 19（Hooks + Suspense + React.lazy）
- **类型系统**: TypeScript 6.x（严格模式）
- **状态管理**: Zustand（轻量、极简 API）
- **构建工具**: Vite 8.x（快速热更新、代码分割）
- **图标系统**: Lucide React
- **Markdown 渲染**: marked.js
- **Python 运行时**: Pyodide

## 快速开始

### 安装依赖

```bash
cd web-linux
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物输出到仓库根目录。

### 预览生产版本

```bash
npm run preview
```

### 类型检查

```bash
npm run typecheck
```

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + K` / `Ctrl + Space` | 打开全局搜索 |
| `Ctrl + P` | 打开命令面板 |
| `Ctrl + T` | 打开终端 |
| `Ctrl + E` | 打开文件管理器 |
| `Ctrl + B` | 打开浏览器 |
| `Ctrl + ,` | 打开设置 |
| `Ctrl + W` | 关闭当前窗口 |
| `Ctrl + M` | 最小化当前窗口 |
| `Alt + Tab` | 切换窗口 |
| `Ctrl + Alt + ←/→` | 切换桌面 |
| `Ctrl + Alt + 1-9` | 跳转到指定桌面 |
| `PrintScreen` | 截图 |

## 项目结构

```
web-linux/
├── src/
│   ├── apps/              # 200+ 应用组件
│   ├── components/
│   │   └── desktop/       # 桌面组件（窗口、任务栏、开始菜单等）
│   ├── store/             # 状态管理工具
│   ├── icons.tsx          # 图标组件集合
│   ├── apps.tsx           # 应用注册表
│   ├── store.tsx          # 全局状态管理（Zustand）
│   ├── types.ts           # 类型定义
│   ├── index.css          # 全局样式
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 入口文件
├── public/                # 静态资源
├── index.html             # HTML 模板
├── vite.config.ts         # Vite 配置
├── tsconfig.json          # TypeScript 配置
└── package.json           # 项目配置
```

## 浏览器兼容性

| 浏览器 | 版本要求 | 状态 |
|--------|---------|------|
| Chrome / Chromium | 100+ | ✅ 完全支持 |
| Firefox | 100+ | ✅ 完全支持 |
| Safari | 15+ | ✅ 完全支持 |
| Edge | 100+ | ✅ 完全支持 |

## 部署

### GitHub Pages

项目已配置为支持 GitHub Pages 直接部署：

1. 构建产物输出到仓库根目录
2. 根目录已包含 `.nojekyll` 文件
3. 在仓库 Settings → Pages 中选择 `Deploy from a branch`，分支选择 `main`，目录选择 `/ (root)`

### 自定义部署

```bash
cd web-linux
npm run build:local  # 使用 / 作为 base path
# 将 ../ 目录部署到任意静态托管服务
```

## 性能优化

- **代码分割**: 每个应用独立打包为单独 chunk，按需懒加载
- **React.lazy + Suspense**: 应用按需加载，提供加载骨架
- **CSS 变量**: 主题切换无需重新渲染整个应用
- **Zustand 选择性订阅**: 只有依赖的状态变更时才触发组件重渲染
- **生产构建压缩**: Terser 压缩 + CSS 压缩

## 安全

- 全局 CSP（Content-Security-Policy）meta 标签
- 全局错误处理（window.onerror + unhandledrejection）
- localStorage 操作带 try/catch 降级处理

## 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建功能分支（`git checkout -b feature/AmazingFeature`）
3. 提交更改（`git commit -m 'Add some AmazingFeature'`）
4. 推送到分支（`git push origin feature/AmazingFeature`）
5. 开启 Pull Request

## 许可证

MIT License

## 致谢

感谢以下开源项目和服务：

- [Open-Meteo API](https://open-meteo.com/) — 免费天气数据
- [Frankfurter.app](https://www.frankfurter.app/) — 免费汇率数据
- [ipapi.co](https://ipapi.co/) — IP 地理信息
- [HN Algolia](https://hn.algolia.com/api) — Hacker News 搜索 API
- [Have I Been Pwned](https://haveibeenpwned.com/Passwords) — 密码泄露查询
- [React](https://react.dev/) — 前端框架
- [Vite](https://vitejs.dev/) — 构建工具
- [Zustand](https://github.com/pmndrs/zustand) — 状态管理
- [Pyodide](https://pyodide.org/) — 浏览器内 Python 运行时
- [marked](https://github.com/markedjs/marked) — Markdown 渲染
- [Lucide Icons](https://lucide.dev/) — 图标库