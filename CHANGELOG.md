# Changelog

All notable changes to WebLinuxOS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **QuickCapture 捕手** — 一站式碎片信息收集工作台，支持 5 种内容类型
  （文本/代码/链接/待办/引用）、智能识别粘贴内容、标签筛选、置顶收藏、
  全文搜索（高亮匹配）、JSON 导入/导出、键盘快捷键（Ctrl+N/Ctrl+K/Ctrl+D）。
  数据完全存储在浏览器 localStorage。
- **QuickCapture 默认桌面图标** — 替换了原"知识探索"图标位置，把这个
  真正高频使用的应用放在用户视野里。

### Changed
- **版本号统一为 v44.0.1** — 修复了 `index.html` 启动提示仍显示 v43、
  `Terminal.tsx` 启动信息显示 v2.3 的版本不一致问题。`package.json`
  同步更新，所有用户可见的位置现在都展示 v44.0.1。
- **README.md 重写** — 从 27 KB 精简到 5 KB，删除冗余的 emoji 装饰与
  重复的应用介绍；按高 star 项目的标准重写为：定位 / 核心特性 / 快速开始
  / 技术栈 / 项目结构 / 贡献指南 / 路线图。结构更清晰、信息密度更高。
- **默认桌面图标调整** — 合并了重复定位的"生产力中心"与"知识探索"两个
  低辨识度图标，腾出位置给真正实用的 QuickCapture。18 个图标更聚焦
  用户日常会用到的核心工具。

### Fixed
- **`index.html` 启动提示** — 之前一直显示 v43 · 启动中 · 请稍候，
  现已更新为 v44 · 启动中 · 请稍候。
- **Terminal 启动横幅** — 启动时的"Web Linux 终端 v2.3"信息更新为 v44，
  与全局版本保持一致。
- **构建产物中 QuickCapture 模块** — 新增 Layers 图标导出，补齐
  `WindowManager.tsx` 的懒加载映射，应用现在可以正常打开。

## [Earlier releases]

Earlier changes are summarised in the git history. See
`git log --oneline` for the full timeline.
