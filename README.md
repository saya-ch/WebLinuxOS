# WebLinuxOS

> 一个在浏览器中运行的完整 Linux 桌面环境 — 不是模拟器,是真正能完成工作的工具集。

[在线体验](https://saya-ch.github.io/WebLinuxOS/) · [更新日志](CHANGELOG.md) · [报告问题](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://saya-ch.github.io/WebLinuxOS/)
[![Version](https://img.shields.io/badge/version-v45.0.0-blue)](https://github.com/saya-ch/WebLinuxOS/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=social)](https://github.com/saya-ch/WebLinuxOS)

## 介绍

WebLinuxOS 是一个开箱即用的浏览器内 Linux 桌面环境,把 240+ 个原生级应用集成到一个 Web 应用里。与"OS 模拟器"不同,这里的每个应用都有真实使用价值 — 终端能跑命令、编辑器能写代码、API测试工具能真实调用API、隐私工具能识别敏感信息。

适合这些场景:

- 在 iPad / Chromebook / 任何只有浏览器的设备上工作
- 给学生一个无需安装 Linux 就能学习命令行的沙盒
- 快速给客户演示一个工具,而不需要配置本地环境
- 在 GitHub Pages 上托管的纯静态个人工作台

## 核心特性

### 桌面与窗口系统
- 多窗口、虚拟桌面（4 个工作区）、可拖拽、可调整大小、可最小化/最大化
- 任务栏、开始菜单、命令面板（Ctrl+P）、全局搜索（Ctrl+K）
- 多主题:赛博朋克 / 量子 / 玻璃拟态 / 经典浅色

### 240+ 内置应用
覆盖开发、办公、网络、媒体、系统、工具、游戏七大类。完整应用清单见 [APPS.md](web-linux/CHANGELOG_APPS.md) 或在系统内打开"应用商店"查看。

### 真实可用的功能（不只模拟）
- **终端**:70+ 命令实现,文件系统浏览 / 文本处理 / 网络诊断 / Cron / Git 模拟
- **API测试终结者**(v45新增):真实API调用工具,预设GitHub/NASA/汇率等公开API模板,支持请求历史、收藏管理、响应格式化
- **开发者快捷键大全**(v45新增):覆盖VS Code/Chrome/macOS/Terminal/Git/Vim快捷键速查,支持搜索、分类、一键复制、自定义添加
- **代码编辑器**:Monaco 内核、语法高亮、多语言、自动补全
- **Markdown 编辑器**:实时双向预览、表格 / 公式 / 代码块、导出 HTML
- **PrivacyGuard**:本地 PII 检测,识别 17 类敏感信息（邮箱/手机号/身份证/API Key/JWT 等）
- **JSONForge**:格式化 / 压缩 / YAML / CSV / Schema / Diff 五合一
- **CronLab**:可视化构建 Cron 表达式,预测未来 5 次触发时间
- **WorldPulse**:基于公开 API 的全球天气、汇率、地震、新闻聚合
- **WebSnapshot**:通过 microlink.io 抓取任意网页截图与元数据
- **QuickCapture**:碎片信息收集工作台
- **性能监控面板**:实时FPS/内存/CPU/存储分析,智能性能警告

### 隐私优先
所有本地数据存储在浏览器 localStorage,不上传任何服务器。除非用户主动启用在线 API（如 WorldPulse / WebSnapshot）,其他应用完全离线运行。

## 快速开始

无需安装,浏览器直接打开:
https://saya-ch.github.io/WebLinuxOS/

本地开发:

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev      # http://localhost:5173
```

构建生产版本:

```bash
npm run build
npm run preview
```

## 技术栈

- **框架**:React 19 + TypeScript
- **构建**:Vite 8
- **状态管理**:Zustand
- **样式**:CSS Variables（无 Tailwind）+ 主题系统
- **UI 图标**:Lucide React
- **代码编辑器**:Monaco Editor
- **Markdown**:marked + DOMPurify
- **Python runtime**:Pyodide（可选应用）
- **部署**:GitHub Pages（通过 GitHub Actions 自动构建）

## 项目结构

```
WebLinuxOS/
├── web-linux/                # 前端应用
│   ├── src/
│   │   ├── apps/             # 200+ 应用实现
│   │   ├── components/       # 桌面、窗口、任务栏等核心组件
│   │   ├── store/            # Zustand 状态管理 + 默认数据
│   │   ├── styles/           # 主题样式
│   │   └── types/            # TypeScript 类型定义
│   ├── public/               # 静态资源
│   └── vite.config.ts
├── .github/workflows/        # GitHub Actions 自动部署
├── dist/                     # 构建产物（由 Actions 生成）
└── CHANGELOG.md              # 详细更新日志
```

## 贡献

欢迎贡献代码、报告 Bug 或提出新功能建议。

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/awesome-thing`)
3. 提交改动 (`git commit -m 'feat: add awesome thing'`)
4. 推送到分支 (`git push origin feature/awesome-thing`)
5. 发起 Pull Request

新增应用的推荐做法：在 `web-linux/src/apps/` 添加组件，在 `apps.tsx` 的 `appRegistry` 中注册，再在 `WindowManager.tsx` 的 `componentMap` 中加入懒加载入口。

## 路线图

- [ ] PWA 支持（可离线安装为本地应用）
- [ ] 文件系统多设备同步（可选 WebDAV / GitHub Gist）
- [ ] 协作模式（CRDT 多人共享工作区）
- [ ] 移动端适配优化
- [ ] 插件系统（第三方应用热加载）

## 许可

本项目基于 MIT 协议开源。详见 [LICENSE](LICENSE) 文件。

## 致谢

- [Lucide](https://lucide.dev/) — 图标库
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — 代码编辑器
- [Pyodide](https://pyodide.org/) — 浏览器 Python 运行时
- [microlink.io](https://microlink.io/) — 网页元数据抓取
- 所有贡献者和用户

---

如果这个项目对你有帮助，请给个 Star 支持一下。
