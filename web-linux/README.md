# WebLinuxOS

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen)](https://saya-ch.github.io/WebLinuxOS/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

一个功能完整的基于Web的Linux桌面环境，完全在浏览器中运行。无需后端支持，所有功能都在客户端运行。

**在线演示**: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## 项目简介

WebLinuxOS将Linux桌面体验带到您的浏览器中。它具有现代化的响应式界面，支持多窗口管理、虚拟桌面和120+应用程序。这个项目展示了现代Web技术的可能性，将传统桌面环境的熟悉感与Web应用的可访问性相结合。

## 核心特性

### 桌面环境

- **多虚拟桌面**：在多个工作区之间切换，支持自定义壁纸
- **高级窗口管理**：平滑的动画效果用于打开、关闭、最小化和最大化窗口
- **智能启动器**：模糊搜索和分类的应用列表
- **系统托盘**：网络、音量和电池指示器以及快速控制
- **全局搜索**：跨应用和文件搜索
- **命令面板**：快速访问系统命令
- **动态壁纸**：带有粒子和交互元素的动态壁纸效果
- **深色/浅色主题**：支持自定义主题切换

### 开发工具

- **代码编辑器**：支持多种语言的语法高亮
- **API测试器**：内置REST API客户端
- **JSON格式化器**：美化、验证和格式化JSON数据
- **正则表达式构建器**：交互式正则表达式测试
- **GitHub热门**：直接查看热门仓库
- **Python REPL**：通过Pyodide实现完整的Python 3运行时
- **90+终端命令**：文件操作、系统监控、网络工具
- **代码片段管理器**：保存和组织代码片段

### 办公与效率

- **文本/标记编辑器**：带有实时预览的富文本编辑
- **电子表格**：用于数据录入的基本电子表格功能
- **日历**：日历视图的日期和事件管理
- **待办事项**：带有完成跟踪的任务管理
- **看板**：支持拖放的视觉任务组织
- **智能笔记**：带有标签、颜色、归档和导入/导出功能
- **思维导图**：基于节点编辑的想法可视化
- **演示文稿创建器**：基于幻灯片的演示文稿

### 实用工具

- **计算器**：带有高级函数和历史记录的科学计算器
- **密码管理器**：带有加密的安全密码存储
- **番茄工作法**：带有可自定义工作阶段的效率计时器
- **取色器**：各种格式的颜色选择
- **实时翻译**：多语言翻译
- **剪贴板管理器**：高级剪贴板历史和管理
- **天气应用**：基于位置数据的当前天气和预报

### 多媒体与娱乐

- **音乐播放器**：支持播放列表的音频播放
- **画图**：带有工具的基本绘图应用
- **摄像头**：访问网络摄像头进行视频捕捉
- **游戏**：贪吃蛇、俄罗斯方块等经典游戏

## 终端命令

终端支持超过90个命令，包括：

### 文件操作
- `ls`, `cd`, `pwd`, `cat`, `mkdir`, `touch`, `rm`, `cp`, `mv`, `tree`, `wc`, `du`

### 系统信息
- `whoami`, `hostname`, `date`, `uname`, `uptime`, `cal`, `free`, `df`, `ps`, `top`, `sysinfo`

### 网络工具
- `ping`, `ifconfig`, `curl`, `host`, `nslookup`, `dig`, `traceroute`, `nmap`

### 系统监控
- `vmstat`, `iostat`, `netstat`, `ss`, `lsof`, `htop`, `btop`

### 实用程序
- `echo`, `find`, `grep`, `env`, `export`, `which`, `file`

### 效率工具
- `translate`, `news`, `worldtime`, `todo`

### 加密与安全
- `base64`, `hash`, `openssl`, `ssh-keygen`

### 数学工具
- `calc`, `bc`, `expr`, `seq`

### 有趣命令
- `cowsay`, `fortune`, `joke`, `advice`, `flip`, `rps`

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

# 部署到GitHub Pages
npm run deploy
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Shift+L | 打开启动器 |
| Ctrl+K | 全局搜索 |
| Ctrl+P | 命令面板 |
| Alt+Tab | 切换窗口 |
| Ctrl+Q | 关闭窗口 |
| Ctrl+C | 复制 |
| Ctrl+V | 粘贴 |
| Ctrl+Shift+C | 终端中断 |
| Ctrl+1-9 | 切换到桌面 |
| Ctrl+Alt+方向键 | 切换桌面 |
| Ctrl+Shift+1-9 | 将窗口移动到桌面 |

## 技术栈

- **React 19**：带有最新功能的UI框架
- **TypeScript 6**：类型安全的开发
- **Zustand 5**：轻量级状态管理
- **Vite 8**：优化的打包构建工具
- **Pyodide**：完全在浏览器中运行的Python运行时
- **Lucide React**：美观的图标库
- **Tailwind CSS**：实用优先的样式设计（用于部分组件）
- **IndexedDB**：持久化数据的本地存储

## 架构

WebLinuxOS遵循模块化架构：

```
src/
  apps/              # 各个应用程序
  components/
    desktop/         # 桌面环境组件
  store/             # 状态管理工具
  types.ts           # TypeScript类型定义
  icons.tsx          # 图标组件
  App.tsx            # 主应用程序组件
```

### 核心组件

- **Desktop**：带有图标和壁纸的主工作区
- **WindowManager**：处理窗口定位和z-index
- **Taskbar**：系统托盘和窗口列表
- **StartMenu**：带有分类的应用启动器
- **CommandPalette**：快速命令执行
- **GlobalSearch**：跨应用搜索

### 状态管理

应用程序使用Zustand进行状态管理，包括：
- 窗口状态跟踪
- 文件系统管理
- 桌面配置
- 主题和壁纸设置
- 用户偏好设置

## 性能优化

WebLinuxOS针对性能进行了优化：

- **代码分割**：每个应用程序按需加载
- **延迟加载**：应用程序仅在打开时加载
- **记忆化**：React组件使用memo进行优化
- **高效渲染**：虚拟列表和优化的更新
- **GPU加速**：使用transform和opacity进行动画
- **节流优化**：拖拽和调整大小使用RAF优化

## 设计系统

### 颜色系统
- 主色调：`#8b7cf0`（紫色渐变）
- 成功：`#00d084`
- 警告：`#ffb400`
- 错误：`#ff4757`
- 信息：`#3498db`

### 阴影层级
- Elevation 1：`0 2px 8px rgba(0, 0, 0, 0.15)`
- Elevation 2：`0 4px 16px rgba(0, 0, 0, 0.2)`
- Elevation 3：`0 8px 32px rgba(0, 0, 0, 0.25)`

### 动画系统
- 窗口打开/关闭：0.25s cubic-bezier
- 悬停效果：0.15s ease
- 弹跳动画：0.3s cubic-bezier
- 玻璃态模糊：20px blur

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

注意：某些功能可能需要现代浏览器功能支持。

## 贡献

欢迎贡献！请遵循以下步骤：

1. Fork仓库
2. 创建功能分支：`git checkout -b feature-name`
3. 进行更改
4. 运行测试：`npm run test`
5. 构建：`npm run build`
6. 提交pull request

### 开发指南

- 所有新代码使用TypeScript
- 遵循现有代码模式
- 为复杂逻辑添加适当的注释
- 提交前进行充分测试
- 根据需要更新文档

### 创建新应用程序

要添加新应用程序：

1. 在`src/apps/`中创建新文件（例如`MyApp.tsx`）
2. 导出默认React组件
3. 在`src/apps.tsx`中注册应用
4. 添加应用图标和元数据
5. 测试应用程序

示例：

```typescript
import { memo } from 'react'

export default memo(function MyApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>我的应用程序</h1>
      <p>欢迎使用我的新应用！</p>
    </div>
  )
})
```

## 许可证

MIT许可证 - 可免费用于个人或商业目的。

## 鸣谢

- 灵感来自各种基于Web的操作系统和桌面环境
- 使用现代Web技术和最佳实践构建
- 欢迎社区贡献和反馈
- 特别感谢所有贡献者

## 统计数据

- **150+应用程序**：丰富的内置应用程序
- **90+终端命令**：全面的命令行界面
- **180+源文件**：模块化和可维护的代码库
- **50+键盘快捷键**：高效的工作流程

## 使用场景

WebLinuxOS非常适合：

- **学习**：探索桌面环境概念
- **演示**：展示Web应用能力
- **开发**：测试Web技术
- **可访问性**：从任何设备访问您的文件
- **效率**：轻量级在线工作空间
- **教育**：教授编程和系统概念
- **原型制作**：快速原型桌面类应用

## 支持

如果您遇到问题或有建议：

- 在GitHub上提交issue
- 查看文档
- 查看现有的问题和解决方案

## 路线图

计划未来的改进：

- 增强移动端响应式设计
- 更多应用程序和功能
- 改进性能
- 额外的语言支持
- 云同步
- PWA安装支持
- 插件系统架构
- 实时协作功能

## 更新日志

### v5.6.0 (2026-06-17)

- 修复应用注册表中的重复条目，提升代码质量
- 更新统计数据以反映实际的应用数量
- 清理未使用的代码和组件
- 改进项目结构和维护性

### v5.3.0 (2026-06-15)

- 新增在线代码运行器：支持JavaScript、Python、TypeScript、HTML、Markdown、JSON、SQL、Bash等多种语言
- 改进README文档：添加徽章和更专业的格式
- 优化桌面视觉效果：增强动态壁纸和粒子效果
- UI/UX改进：更好的视觉层次和交互反馈
- 代码质量提升：优化组件结构和类型安全

### v5.2.0 (2026-05-31)

- 新增配色方案生成器：支持随机、类比、互补、三元、单色等多种生成模式
- 支持颜色锁定功能：可以锁定喜欢的颜色，只生成其他颜色
- 支持配色方案本地存储和管理：可以保存、加载和删除配色方案
- 一键复制颜色代码：点击即可复制颜色的 HEX 代码
- 对比度自动计算：确保在不同颜色背景上显示最佳的文本颜色

### v5.1.0 (2026-05-31)

- 设计系统优化：新增CSS变量、渐变和阴影层级系统
- 动画效果升级：添加slideDown、scaleIn、breathe、aurora等动画
- 视觉效果增强：玻璃态效果、渐变边框、霓虹文字等
- 性能优化：窗口拖拽和调整大小使用requestAnimationFrame优化
- 用户体验提升：更好的交互反馈和视觉层次
- 代码质量改进：优化React组件记忆化和类型安全

### v5.0.0 (2026-05-31)

- 增强的智能笔记，带有标签、颜色、归档和导入/导出功能
- 新的智能仪表盘，带有实时天气、加密货币和系统监控
- 改进的错误处理和用户反馈
- 更好的文档和开发者指南
- 性能优化
- 错误修复和UI改进

---

**版本**: 5.6.0
**最后更新**: 2026-06-17
