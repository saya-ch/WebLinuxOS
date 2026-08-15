<div align="center">

# WebLinuxOS

**浏览器中的完整 Linux 桌面环境 — 真实工具，真实工作，零安装。**

[在线体验](https://saya-ch.github.io/WebLinuxOS/) · [文档](https://github.com/saya-ch/WebLinuxOS/wiki) · [更新日志](CHANGELOG.md) · [提交问题](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge&logo=github&color=yellow)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=for-the-badge&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v99.0.0-blue?style=for-the-badge)](https://github.com/saya-ch/WebLinuxOS/releases)
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

## v99.0.0 创新亮点

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