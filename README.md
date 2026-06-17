# WebLinuxOS

> 浏览器中的完整 Linux 桌面环境 — 真实、开源、零后端依赖

WebLinuxOS 不是一个模拟器，而是一个完全运行在浏览器中的**真实桌面环境**。它使用 React 19 + TypeScript 构建，通过 Zustand 管理窗口、文件与设置状态，支持完整的窗口管理、多虚拟桌面、虚拟文件系统，并集成了 150+ 应用程序与多种公开 API。所有计算均在本地浏览器中执行，无需任何服务器后端。

---

## 在线演示

访问在线演示站点：<https://saya-ch.github.io/WebLinuxOS/>

> 首次加载时，核心应用会在后台预加载，以获得更流畅的后续体验。

---

## 主要特性

- 完整的**窗口管理系统** — 拖拽、缩放、最小化、最大化、层级（z-index）管理
- **多虚拟桌面** — 最多支持 9 个虚拟桌面，可通过快捷键切换或移动窗口
- **150+ 应用程序** — 从文件管理器、终端到 AI 助手、代码运行器，覆盖日常使用场景
- **真实 API 集成** — 接入 Open-Meteo、GitHub、Hacker News、CoinGecko 等公开 API
- **虚拟文件系统** — 基于 IndexedDB 的树形文件节点，持久化保存用户数据
- **完整终端模拟器** — 支持 90+ 命令，包括文件操作、系统查询与网络工具
- **代码运行器** — 在浏览器中真实执行 JavaScript、TypeScript、Python（Pyodide）、Markdown 等
- **全局搜索与命令面板** — 快速启动应用、查找文件、执行系统命令
- **动态主题** — 支持亮/暗主题切换，自定义壁纸与粒子动画
- **无后端依赖** — 纯客户端运行，所有数据与计算均在本地完成
- **代码分割与懒加载** — 按应用分包，仅在打开时加载，首屏性能可控
- **GitHub Pages 自动部署** — 推送至 `main` 分支即可自动构建并发布

---

## 应用生态系统

以下是 150+ 应用的代表性分类概览：

| 分类 | 代表应用 |
|------|----------|
| 系统工具 | 文件管理器、进程监视器、网络监视器、系统监控中心、磁盘使用分析器、系统设置、备份工具、密码管理器 |
| 开发工具 | 代码运行器、代码编辑器、API 测试器 Pro、REST 客户端、正则表达式测试器、GitHub 探索器、GitHub 热门仓库、代码片段管理器、代码协作中心、代码格式化工具 |
| 终端与 Shell | 终端模拟器（90+ 命令）、命令参考、命令面板、包管理器 |
| 生产力工具 | 专业笔记、待办事项、生产力中心、看板、思维导图、番茄工作法、习惯追踪器、日历、计算器、Markdown 编辑器、Markdown 幻灯片 |
| AI 辅助 | AI 智能对话助手、AI 代码助手、AI 编程导师、AI 任务助手、智能代码生成器 |
| 信息与数据 | 天气、汇率转换、新闻阅读器、加密货币追踪器、股票市场追踪器、单位转换器、IP & DNS 查询、字典、翻译 |
| 多媒体 | 音乐播放器、视频播放器、图片查看器、画图工具、摄像头、屏幕截图、屏幕录制、音乐可视化、音乐工作室 |
| 网络与安全 | API 实验室、网络速度测试、防火墙、WiFi 管理器、蓝牙管理器、CloudSync |
| 游戏与娱乐 | 贪吃蛇、俄罗斯方块、虚拟宠物 |

---

## 真实 API 集成

所有调用均直接从浏览器发起，不经过任何中间服务器。

| API 提供商 | 用途 | 终端/应用示例 |
|-----------|------|----------------|
| [Open-Meteo](https://open-meteo.com/) | 实时天气、天气预报、空气质量 | 天气应用 / `weather <城市>` |
| [GitHub Search API](https://docs.github.com/en/rest/search) | 热门仓库、用户与仓库搜索 | GitHub 热门 / GitHub 探索器 / `github <关键词>` |
| [Hacker News Algolia](https://hn.algolia.com/api) | 科技新闻内容聚合 | 新闻阅读器 / `hn` |
| [Spaceflight News API](https://api.spaceflightnewsapi.net/) | 航天相关新闻 | 新闻阅读器 |
| [open.er-api.com](https://www.exchangerate-api.com/) | 实时汇率数据 | 汇率转换 / `currency` |
| [CoinGecko](https://www.coingecko.com/zh/api) | 加密货币实时行情 | 加密货币追踪器 / `crypto` |
| [ipapi.co](https://ipapi.co/) | IP 地址地理信息查询 | IP 查询 / `ifconfig` |
| [JSONPlaceholder](https://jsonplaceholder.typicode.com/) | REST 测试示例数据 | API 测试器 / `curl` |

> 部分 API 可能受到浏览器 CORS 策略限制，项目已选择支持跨域访问的公开服务。

---

## 技术栈

| 层级 | 技术 |
|------|------|
| UI 框架 | **React 19** |
| 语言 | **TypeScript 6** |
| 状态管理 | **Zustand 5** |
| 构建工具 | **Vite 8 + Rolldown** |
| 类型校验 | **tsc** |
| 代码质量 | **ESLint + Prettier** |
| Python 运行时 | **Pyodide**（浏览器内 WebAssembly） |
| 图标库 | **Lucide React** |
| Markdown 渲染 | **marked** |
| 持久化 | **IndexedDB + localStorage** |
| 部署 | **GitHub Pages + GitHub Actions** |

---

## 截图

以下展示了 WebLinuxOS 的典型使用场景：

- 桌面概览 — 多窗口、任务栏、启动菜单
- 启动器 — 分类应用列表与搜索
- 文件管理器 — 虚拟文件系统浏览
- 终端模拟器 — 命令执行与网络查询
- 文本编辑器 — 多文件编辑与语法高亮

> 详细截图请访问 [在线演示](https://saya-ch.github.io/WebLinuxOS/) 实际体验。

---

## 快速开始

### 环境要求

- Node.js **20+**
- npm（项目使用 `only-allow npm` 约束包管理器）

### 安装与运行

```bash
# 1. 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 2. 安装依赖
npm install

# 3. 启动本地开发服务器
npm run dev
# 默认地址: http://localhost:5173

# 4. 生产构建（本地调试用，路径前缀为 /）
npm run build:local

# 5. 构建并准备部署到 GitHub Pages
npm run deploy
# 产物将输出到项目根目录 ../ 用于自动部署
```

### 其他有用命令

```bash
# 类型检查
npm run typecheck

# ESLint 代码检查
npm run lint

# 预览生产构建
npm run preview
```

---

## 终端命令精选

WebLinuxOS 内置终端支持 90+ 命令。以下是一些最有趣的精选：

### 文件操作
```bash
ls -la /home/user          # 列出文件（支持 -la -h 等参数）
cd Documents                # 切换目录
cat readme.txt              # 查看文件内容
mkdir projects && cd projects
touch note.md
rm -rf temp/
cp src.txt dst.txt
mv old.txt new.txt
tree /                      # 树形展示目录结构
wc -l script.js             # 统计行数
du -sh                      # 磁盘使用摘要
```

### 系统信息
```bash
neofetch                    # 系统信息展示（带 ASCII 标识）
whoami                      # 当前用户
uname -a                    # 系统版本
uptime                      # 运行时间
date                        # 当前日期时间
cal                         # 日历
free                        # 内存使用
df                          # 磁盘空间
ps aux                      # 进程列表
top                         # 实时进程监视
```

### 网络工具（真实执行）
```bash
ping github.com             # 模拟网络连通性检查
ifconfig                    # 显示网络接口信息
host example.com            # DNS 查询
nslookup google.com         # DNS 解析
dig github.com              # 详细 DNS 查询
fetch https://api.github.com/users/saya-ch
curl https://httpbin.org/get
```

### 实用工具
```bash
weather beijing             # 查询实时天气（支持 15+ 城市）
crypto btc                  # 加密货币价格
github "react hooks"        # GitHub 仓库搜索
hn                          # Hacker News 热门
uuid                        # 生成 UUID
qrcode "hello world"        # 生成二维码
base64 <<< "secret"         # Base64 编码
hash sha256 password        # 哈希计算
color #ff6347               # 颜色转换
units 100 km m              # 单位转换
calc 2*(3+4)/7              # 数学计算
```

### 趣味命令
```bash
cowsay "Hello WebLinuxOS"
fortune                     # 随机格言
matrix                      # 矩阵数字雨
starwars                    # 星球大战 ASCII
asciiart "WebLinuxOS"
joke                        # 随机笑话
advice                      # 生活建议
```

---

## 项目架构

### 目录结构

```
WebLinuxOS/
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
├── web-linux/                     # 源码与构建目录
│   ├── src/
│   │   ├── apps/                  # 150+ 应用程序
│   │   │   ├── Terminal.tsx       # 终端模拟器
│   │   │   ├── FileManager.tsx    # 文件管理器
│   │   │   ├── CodeRunner.tsx     # 代码运行器
│   │   │   ├── Weather.tsx        # 天气应用
│   │   │   └── ...                # 150+ 其他应用
│   │   ├── components/            # 共享 UI 组件
│   │   │   ├── desktop/           # 窗口管理器、任务栏、桌面
│   │   │   ├── CommandPalette.tsx
│   │   │   └── NotificationSystem.tsx
│   │   ├── store/                 # Zustand 状态管理
│   │   │   ├── fileUtils.ts       # 文件系统工具
│   │   │   ├── storageUtils.ts    # 存储工具
│   │   │   └── defaults.tsx       # 默认配置
│   │   ├── types.ts               # 类型定义
│   │   ├── icons.tsx              # SVG 图标
│   │   ├── App.tsx                # 根组件
│   │   └── main.tsx               # 入口文件
│   └── package.json
└── index.html                     # 构建产物（部署用）
```

### 核心系统组件

1. **窗口管理器** — 负责窗口生命周期、z-index 层级、拖拽/缩放/最小化/最大化
2. **虚拟文件系统** — 基于 IndexedDB 的树形文件节点存储，支持文件读写与持久化
3. **终端模拟器** — 命令解析与执行引擎，支持 90+ 命令，包含文件操作、系统信息与网络工具
4. **状态管理层（Zustand）** — 统一管理窗口、文件、设置、桌面与虚拟桌面状态
5. **懒加载系统** — 每个应用通过 `React.lazy` 按需加载，首屏仅加载核心 UI
6. **应用注册表** — 集中定义所有应用的元信息，供启动菜单、全局搜索与窗口系统使用

---

## 性能优化

WebLinuxOS 运行 150+ 应用却能保持良好的首屏体验，关键优化包括：

- **代码分割（Code Splitting）** — 每个应用程序独立打包为独立的 chunk，按需加载
- **懒加载（Lazy Loading）** — 使用 `React.lazy` 动态导入应用，仅在打开时加载
- **Memoization** — 使用 `React.memo`、`useMemo`、`useCallback` 减少不必要的重新渲染
- **GPU 加速的动画** — 窗口拖拽、缩放与粒子动画均通过 `transform` / `opacity` 属性触发 GPU 合成
- **IndexedDB 本地持久化** — 虚拟文件系统、设置与用户数据异步写入，不阻塞主线程
- **API 响应缓存** — 天气、汇率、GitHub 等 API 响应在会话内缓存，减少重复请求
- **空闲预加载** — 核心应用在浏览器空闲时段通过 `requestIdleCallback` 预加载
- **Vite + Rolldown 生产构建** — 产物自动分块、压缩与 Tree Shaking

---

## GitHub Pages 部署

项目配置了自动化部署流程（`.github/workflows/deploy.yml`）：

1. **触发条件** — 推送到 `main` 分支，或手动通过 `workflow_dispatch` 触发
2. **构建环境** — Ubuntu latest + Node.js 20 + npm ci
3. **构建命令** — 在 `web-linux/` 目录执行 `npm run deploy`（`tsc -b && vite build`）
4. **产物验证** — 检查根目录下 `index.html` 与 `assets/` 是否生成
5. **部署** — 通过 `actions/deploy-pages@v4` 部署到 GitHub Pages

```yaml
# 核心步骤摘要
- checkout 源码
- setup Node.js 20（缓存 npm）
- npm ci 安装依赖
- npm run deploy 构建
- 验证 index.html 与 assets/
- configure-pages + upload-pages-artifact
- deploy-pages
```

部署后页面地址：<https://saya-ch.github.io/WebLinuxOS/>

### 手动部署

```bash
cd web-linux
npm run deploy
# 构建产物将写入 ../ 目录
```

---

## 隐私与安全

- **纯客户端运行** — 所有计算均在本地浏览器中完成，无任何后端服务器
- **本地存储** — 用户数据保存在浏览器的 `localStorage` 与 `IndexedDB` 中，不上传
- **直连公开 API** — API 调用直接从浏览器发起，不经过中间服务器代理
- **无账户系统** — 无需注册、不收集任何用户身份信息
- **无遥测与追踪** — 不包含任何分析脚本、遥测上报或第三方追踪
- **本地加密密码管理** — 密码管理器在浏览器本地加密保存，数据永不上传
- **建议** — 敏感操作（如真实密码保存、私钥操作）请使用专用工具，本项目的虚拟环境仅供学习与演示

---

## 贡献指南

欢迎贡献代码、提交 Issue 或提出新功能建议！

### 贡献流程

1. **Fork** 本仓库
2. 创建功能分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`（推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 风格）
4. 推送到分支：`git push origin feature/amazing-feature`
5. 创建 **Pull Request**

### 提交前检查

```bash
cd web-linux
npm run typecheck   # 类型检查
npm run lint        # ESLint
npm run build:local # 生产构建，确保通过
```

### 新增应用

在 `src/apps/` 下创建新的 React 组件，遵循现有应用的导出约定，然后在应用注册表中注册，即可自动出现在启动菜单与全局搜索中。

---

## 路线图

以下为可选的未来功能想法（非承诺）：

- 多用户账户与文件隔离（浏览器内多 profile）
- 可安装的 PWA（Progressive Web App），支持离线使用
- 应用市场 / 插件系统，允许从社区加载第三方应用
- 虚拟网络环境（在浏览器内模拟局域网，应用间可互通）
- 增强终端 — Bash 脚本解析、管道与重定向
- 更多真实 API 集成（新闻、地图、AI 模型调用）
- SQLite（sql.js）作为本地关系数据库
- WebRTC 点对点多用户协作（白板、共享文档）
- 主题与壁纸自定义商店
- 更多经典 Linux 命令实现（sed、awk、grep 增强）

欢迎在 Issue 中提出你的想法！

---

## 许可证

**MIT License** — 可自由用于个人或商业用途。详细信息见 LICENSE 文件。

---

## 致谢

WebLinuxOS 的实现离不开以下优秀的开源项目与服务：

- [React](https://react.dev/) — UI 框架
- [TypeScript](https://www.typescriptlang.org/) — 类型系统
- [Zustand](https://github.com/pmndrs/zustand) — 轻量状态管理
- [Vite](https://vitejs.dev/) — 极速构建工具
- [Pyodide](https://pyodide.org/) — 浏览器中的 Python
- [Lucide](https://lucide.dev/) — 精美图标库
- [Open-Meteo](https://open-meteo.com/) — 免费天气 API
- [GitHub Search API](https://docs.github.com/en/rest/search) — 仓库搜索
- [Hacker News Algolia](https://hn.algolia.com/api) — 新闻数据
- [CoinGecko](https://www.coingecko.com/) — 加密货币行情
- [Spaceflight News API](https://api.spaceflightnewsapi.net/) — 航天新闻
- [ipapi.co](https://ipapi.co/) — IP 地理信息
- [open.er-api.com](https://www.exchangerate-api.com/) — 汇率数据
- [JSONPlaceholder](https://jsonplaceholder.typicode.com/) — 测试数据

---

**版本**: 6.3.0 &nbsp;|&nbsp; **最后更新**: 2026-06-18 &nbsp;|&nbsp; **作者**: saya-ch
