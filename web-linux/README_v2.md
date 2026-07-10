# WebLinuxOS

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/saya-ch/WebLinuxOS/pulls)

**一个功能完整的Web版Linux操作系统，基于React 19和TypeScript构建**

在线体验: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

---

## 核心特性

### 系统功能
- **完整的桌面环境** - 包含窗口管理、任务栏、应用启动器、桌面图标
- **240+应用程序** - 涵盖开发工具、办公应用、实用工具、娱乐应用等
- **100+终端命令** - 完整的Linux命令行体验，支持文件操作、网络工具、系统管理等
- **文件系统** - 虚拟文件系统，支持文件创建、编辑、删除、权限管理
- **多窗口管理** - 支持窗口拖拽、缩放、最小化、最大化、层叠排列

### 创新特性 (v28.0)
- **智能代码助手** - AI驱动的代码生成、分析和优化工具
- **实时系统监控** - CPU、内存、网络状态实时监控面板
- **快速访问工具栏** - 一键访问常用应用
- **全局搜索** - Ctrl+K快速搜索应用、文件和命令
- **智能布局** - 网格、列表、紧凑三种桌面布局模式
- **增强终端命令** - ai-analyze、gen、perf、netcheck、stats等实用命令

### 技术亮点
- **React 19** - 使用最新的React特性和并发渲染
- **TypeScript 5.0** - 完整类型支持，提高代码质量
- **虚拟文件系统** - 基于IndexedDB的持久化存储
- **响应式设计** - 适配不同屏幕尺寸和设备
- **性能优化** - 懒加载组件、虚拟滚动、状态管理优化

---

## 应用分类

### 开发工具 (40+)
- 代码编辑器 (支持语法高亮)
- 智能代码助手
- Git客户端
- API测试工具
- Docker管理界面
- 数据库管理工具
- 性能分析器

### 系统工具 (35+)
- 文件管理器
- 终端模拟器 (100+命令)
- 系统监视器
- 进程管理器
- 网络配置工具
- 用户管理界面
- 服务管理工具

### 办公应用 (30+)
- 文本编辑器
- Markdown编辑器
- PDF阅读器
- 计算器
- 日历
- 待办事项
- 笔记应用

### 实用工具 (50+)
- 图片查看器
- 音乐播放器
- 视频播放器
- 天气预报
- 时钟和定时器
- 单位转换器
- 颜色选择器

---

## 快速开始

### 本地运行

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

### Docker部署

```bash
# 使用Docker运行
docker build -t weblinuxos .
docker run -p 3000:80 weblinuxos
```

---

## 终端命令示例

### 文件操作
```bash
ls -la          # 列出所有文件详细信息
cd /home        # 切换目录
mkdir project   # 创建目录
touch file.txt  # 创建文件
cat file.txt    # 查看文件内容
rm -rf dir      # 删除目录及内容
```

### 系统命令
```bash
uname -a        # 显示系统信息
ps aux          # 显示所有进程
top             # 实时系统监控
df -h           # 磁盘使用情况
free -m         # 内存使用情况
whoami          # 当前用户
```

### 网络工具
```bash
ping google.com       # 测试网络连接
curl https://api.github.com  # HTTP请求
netstat -tuln         # 网络端口状态
ifconfig              # 网络接口配置
wget https://example.com/file.zip  # 下载文件
```

### 创新命令 (v28.0)
```bash
ai-analyze function add(a, b) { return a + b; }  # AI代码分析
gen component UserProfile                       # 快速生成React组件
perf start                                       # 启动性能监控
netcheck                                         # 检查网络和API可用性
stats                                            # 显示系统统计信息
note add 这是一个重要的想法                      # 快速笔记
timeconv 60 s min                                # 时间单位转换
color #FF5733                                    # 颜色格式转换
```

---

## 技术架构

### 前端框架
- **React 19.0** - 组件化UI框架
- **TypeScript 5.0** - 类型安全的JavaScript
- **Vite** - 快速的构建工具

### 状态管理
- **React Context** - 全局状态管理
- **Custom Hooks** - 可复用的状态逻辑
- **IndexedDB** - 持久化数据存储

### UI组件
- **Lucide React** - 现代化图标库
- **CSS-in-JS** - 内联样式系统
- **响应式布局** - 自适应设计

---

## 项目结构

```
web-linux/
├── src/
│   ├── apps/              # 240+应用程序
│   │   ├── terminal/      # 终端应用及100+命令
│   │   ├── IntelligentCodeAssistant.tsx  # 智能代码助手 (v28.0)
│   │   └── ...            # 其他应用
│   ├── components/        # 系统组件
│   │   ├── desktop/       # 桌面环境
│   │   │   ├── DesktopEnhancements.tsx  # 桌面增强组件 (v28.0)
│   │   │   ├── Window.tsx # 窗口组件
│   │   │   └── Taskbar.tsx# 任务栏
│   │   └── ui/            # UI组件库
│   ├── store.tsx          # 状态管理
│   ├── apps.tsx           # 应用注册表
│   └── App.tsx            # 主应用
├── public/                # 静态资源
├── package.json           # 项目配置
└── vite.config.ts         # Vite配置
```

---

## 贡献指南

我们欢迎所有形式的贡献！

### 如何贡献
1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

### 开发规范
- 使用TypeScript编写代码
- 遵循现有代码风格
- 添加必要的注释和文档
- 确保所有测试通过

---

## 技术支持

### 文档
- [快速开始指南](https://github.com/saya-ch/WebLinuxOS/wiki/Quick-Start)
- [应用开发指南](https://github.com/saya-ch/WebLinuxOS/wiki/App-Development)
- [终端命令参考](https://github.com/saya-ch/WebLinuxOS/wiki/Terminal-Commands)

### 问题反馈
- [Issues](https://github.com/saya-ch/WebLinuxOS/issues)
- [Discussions](https://github.com/saya-ch/WebLinuxOS/discussions)

---

## 版本历史

### v28.0 (2026-07-11)
- 新增智能代码助手应用
- 新增桌面增强组件（系统监控、快速访问工具栏、全局搜索）
- 新增10+创新终端命令
- 优化桌面UI和用户体验
- 改进性能和代码质量

### v27.0
- 新增CyberHub控制中心
- 新增100+实用工具
- 优化文件系统性能

### v26.0
- 新增DevKit开发者工具箱
- 新增AI Code Companion
- 改进窗口管理系统

---

## 许可证

本项目基于 [MIT License](LICENSE) 开源。

---

## 致谢

感谢所有贡献者和用户的支持！

特别感谢:
- React团队提供的优秀框架
- TypeScript团队提供的类型系统
- Vite团队提供的构建工具
- Lucide团队提供的图标库

---

**由社区驱动，为开发者构建**

*如果这个项目对你有帮助，请给一个Star支持我们！*