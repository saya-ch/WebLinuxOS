# WebLinuxOS

一个功能完整的基于Web的Linux桌面环境，完全在浏览器中运行。无需后端支持 - 所有功能均在客户端运行，支持持久化存储。

**在线演示**: https://saya-ch.github.io/WebLinuxOS/

---

## 简介

WebLinuxOS 将完整的 Linux 桌面体验带到您的浏览器中。与传统操作系统不同，一切都在您的浏览器标签页中运行 - 无需安装，无需设置，即可即时访问一个功能丰富的桌面环境，包含超过 150 个应用程序和 90+ 终端命令。

## 核心特性

### 桌面环境
- 多窗口管理，支持最小化、最大化和关闭控制
- 虚拟桌面，支持自定义壁纸
- 智能应用启动器，支持模糊搜索
- 系统托盘，显示网络、音量和电池指示器
- 全局搜索，跨所有应用和文件
- 命令面板，用于快速系统操作
- 深色/浅色主题切换
- 动态粒子壁纸效果

### 开发工具
- 代码编辑器，支持 20+ 语言语法高亮
- REST API 测试器，带请求构建器
- JSON 格式化和验证器
- 交互式正则表达式构建器和测试器
- GitHub 热门仓库查看器
- Python REPL（通过 Pyodide）
- 功能全面的终端，支持 90+ 命令
- 代码片段管理器，支持导入/导出
- CSS 工具箱，含渐变、阴影和布局生成器

### 生产力套件
- Markdown 编辑器，带实时预览
- 电子表格，支持公式
- 日历和事件管理器
- 待办事项列表，带完成跟踪
- 看板，支持拖放
- 思维导图工具
- 演示文稿创建器
- 智能日程助手

### 实用工具
- 科学计算器，带高级功能
- 密码管理器，带加密
- Pomodoro 计时器
- 颜色选择器，支持多种格式
- 实时翻译
- 剪贴板管理器，带历史记录
- 天气应用
- 在线 API 中心（NASA、新闻、加密货币）

### 多媒体与娱乐
- 音乐播放器，支持播放列表
- 画图应用
- 摄像头访问，用于视频捕获
- 经典游戏（贪吃蛇、俄罗斯方块、2048、记忆游戏）

## 终端命令

**文件操作**: ls, cd, pwd, cat, head, tail, mkdir, touch, rm, cp, mv, tree, wc, du, write, tee, append  
**系统信息**: whoami, hostname, date, uname, uptime, cal, free, df, ps, neofetch, version, time, worldtime  
**系统监控**: top, cpu-info, memory-info, disk-usage, network-stats, process-list  
**网络工具**: ping, curl, host, nslookup, ipinfo, weather, news, crypto, translate  
**实用工具**: echo, find, grep, env, export, which, calc, prime, factor, roman, base64, unbase64, hash, rev, json, urlencode, urldecode, uuid, password, search  
**趣味命令**: quote, joke, fortune, cowsay, cowthink, dog, sl, banner, lolcat, starwars, matrix, asciiart, advice, flip, rps  

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

# 部署到 GitHub Pages
npm run deploy
```

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+Shift+L | 打开启动器 |
| Ctrl+K | 全局搜索 |
| Ctrl+P | 命令面板 |
| Alt+Tab | 窗口切换 |
| Ctrl+Q | 关闭窗口 |
| Ctrl+C | 复制 |
| Ctrl+V | 粘贴 |
| Ctrl+1-9 | 切换桌面 |
| Ctrl+Alt+Arrow | 切换桌面 |

## 技术栈

- **React 19** - UI 框架，使用 Hooks 和 Suspense
- **TypeScript 6** - 类型安全开发
- **Zustand 5** - 轻量级状态管理
- **Vite 8** - 优化的构建工具
- **Pyodide** - 浏览器中的 Python 运行时
- **Lucide React** - 图标库
- **IndexedDB** - 持久化本地存储

## 架构

WebLinuxOS 采用模块化架构，关注点分离：

```
src/
  apps/              # 各个应用（150+）
  components/
    desktop/         # 桌面环境组件
    common/          # 共享 UI 组件
  store/             # Zustand 状态管理
  utils/             # 工具函数
  types.ts           # TypeScript 定义
  icons.tsx          # 图标导出
```

## 性能优化

- 代码分割，使用动态导入
- 应用懒加载
- 昂贵计算的记忆化
- GPU 加速动画
- 高效的拖拽和调整大小处理

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 贡献指南

欢迎贡献代码。请遵循以下步骤：

1. Fork 仓库
2. 创建功能分支：`git checkout -b feature-name`
3. 进行更改
4. 构建测试：`npm run build`
5. 提交 Pull Request

## 创建新应用

要添加新应用：
1. 在 `src/apps/` 中创建文件（如 `MyApp.tsx`）
2. 导出默认 React 组件
3. 在 `src/apps.tsx` 中注册
4. 添加图标和元数据
5. 彻底测试

## 许可证

MIT 许可证 - 个人或商业使用免费。

## 统计数据

- 150+ 应用程序
- 90+ 终端命令
- 180+ 源文件
- 50+ 键盘快捷键

## 使用场景

- 学习编程概念
- 演示 Web 能力
- 跨平台访问工具
- 轻量级在线工作空间
- 教学系统管理
- 快速原型开发

## 路线图

- 增强移动响应式设计
- PWA 安装支持
- 云同步
- 插件系统架构
- 实时协作

## 更新日志

### v7.0.0
- 增强终端，新增命令（weather、quote、timer、motd、ipinfo、time、worldtime）
- 改进图标一致性
- 代码质量改进
- 性能优化
- 新增 IP 信息查询功能
- 新增世界时间查询功能

### v6.2.0
- 修复重复应用 ID
- 解决 CSS 动画冲突
- 增强构建配置

### v6.0.0
- 重大版本发布，包含显著改进
- 新增应用和工具
- 性能优化

---

版本: 7.0.0 | 最后更新: 2026