# WebLinuxOS v6.2.0 迭代报告

## 概述

本次迭代专注于**修复关键部署问题**与**提升应用的真实使用价值**。项目已升级到 v6.2.0，修复了影响 GitHub Pages 部署的 .nojekyll 缺失问题，新增了"生产力中心"这一整合性工具，并完善了多个现有应用。

## 关键改进

### 1. 修复关键部署 Bug：.nojekyll 缺失

**问题**：原仓库的 `.nojekyll` 文件位于 `web-linux/` 根目录，并未放在 Vite 的 `public/` 文件夹中。Vite 只会从 `public/` 复制静态资源到构建输出，导致最终部署到 GitHub Pages 的根目录没有 `.nojekyll` 文件。`package.json` 的 `clean` 脚本会主动删除根目录的 `.nojekyll`，但构建流程中没有任何步骤会重新创建它，因此 GitHub Pages 会以 Jekyll 处理项目，可能对下划线开头的目录和文件产生意外行为。

**修复**：将 `.nojekyll` 移动到 `web-linux/public/.nojekyll`，Vite 构建时会自动复制到输出根目录，确保 GitHub Pages 正确跳过 Jekyll 处理。

### 2. 新增应用：生产力中心 (ProductivityHub)

一个真正可投入日常使用的整合型应用，集成四类功能：

- **任务管理** - 支持自定义分类、优先级（高/中/低）、状态（待办/进行中/已完成）、任务计时、搜索与过滤。所有数据持久化到 localStorage。
- **目标追踪** - 每日目标可设置任意度量单位（次、分钟、页等），+1/+5 按钮快速累加，进度条可视化，历史目标可回看。
- **彩色便签** - 6 种主题色、支持置顶、随时编辑、按更新时间排序。
- **统计仪表盘** - 任务总数、今日/本周完成数、总专注时间、状态分布、优先级分布、分类分布。
- **数据导出** - 一键导出全部数据为 JSON 文件，便于备份和迁移。

### 3. 番茄工作法：新增本地持久化与历史回看

- 专注总时长、完成循环数自动保存到 localStorage
- 每个番茄会话可标记"专注任务"，完成后自动归档为历史记录
- 历史记录按时间倒序展示，包含日期、时长、任务名
- 所有数据在重新打开应用后仍能保留

### 4. 浏览器增强：多搜索引擎与历史持久化

- 集成 6 种搜索引擎：Google、DuckDuckGo、Bing、Brave、Wikipedia、GitHub
- 默认搜索引擎可由用户选择并持久化
- 书签与历史记录持久化到 localStorage
- 主页嵌入新 UI：可选择不同搜索引擎、显示 8 个常用快捷链接
- 改进搜索建议的生成逻辑，对带空格的查询直接提示搜索意图

## 验证

- TypeScript 类型检查通过
- 生产构建（GitHub Pages 模式）通过，`.nojekyll` 正确出现在输出根目录
- 所有改动均通过 `tsc --noEmit` 校验

## 兼容性

- 浏览器：Chrome 90+、Firefox 88+、Safari 14+、Edge 90+
- 所有持久化数据使用 localStorage，遵循同源策略
- 公开 API 调用全部在前端完成，无中间服务器

## 文件变更摘要

- 新增：`web-linux/src/apps/ProductivityHub.tsx`
- 修改：`web-linux/src/apps/Pomodoro.tsx`（持久化与历史）
- 修改：`web-linux/src/apps/WebBrowser.tsx`（多搜索引擎 + 持久化）
- 修改：`web-linux/src/apps.tsx`（注册新应用）
- 修改：`web-linux/package.json`（版本号更新）
- 修改：`README.md`（功能列表更新）
- 新增：`web-linux/public/.nojekyll`（修复部署 bug）
