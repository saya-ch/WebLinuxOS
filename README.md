# WebLinuxOS

一个完全运行在浏览器中的Web Linux桌面环境，提供真实的桌面体验和丰富的应用程序生态系统。

[在线体验](https://saya-ch.github.io/WebLinuxOS/) | [English](README.md) | [中文文档](README_CN.md)

## 项目概述

WebLinuxOS是一个基于React和TypeScript构建的完整Linux操作系统模拟器，在浏览器中提供真实的桌面体验。项目包含200+应用程序，完整的窗口管理系统，虚拟文件系统，终端仿真器，并支持Python运行时。

**核心特性**

- 完整的桌面环境（窗口管理、任务栏、启动菜单）
- 200+内置应用程序，覆盖开发、办公、多媒体等领域
- 实际可用的终端，支持50+命令
- 虚拟文件系统，支持文件创建、删除、复制、移动
- 代码编辑器支持Python/JavaScript运行
- 多主题支持和动态壁纸
- 多桌面工作区支持
- 本地存储持久化

## 快速开始

### 在线体验

直接访问 [GitHub Pages](https://saya-ch.github.io/WebLinuxOS/) 即可体验完整功能。

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git

# 进入项目目录
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 应用程序分类

### 系统工具
- **文件管理器**: 完整的文件树浏览、搜索、拖拽上传、批量操作
- **终端**: 支持50+命令，包括文件操作、系统信息、网络工具
- **系统监视器**: 实时CPU、内存、网络监控
- **系统资源优化器**: 智能资源优化和清理建议（新增）

### 开发工具
- **代码编辑器**: 语法高亮、Python/JS代码执行、多标签支持
- **AI代码分析器**: 代码质量分析、bug检测、改进建议（新增）
- **REST Client**: 完整的API测试工具
- **JSON/YAML格式化转换**
- **正则表达式测试和构建器**
- **Base64/URL编码解码**
- **JWT解码验证**
- **Hash生成器**
- **API探索器**: 浏览测试11个免费公开API

### 实用工具
- **计算器**: 科学计算、货币转换、进制转换
- **天气**: 实时天气数据（Open-Meteo API）、7天预报
- **番茄钟**: 专注工作计时器
- **密码生成和强度分析**
- **QR码生成器**
- **颜色选择器和配色生成**
- **单位转换器**
- **世界时钟**

### 办公工具
- **Markdown编辑预览器**
- **笔记应用**: 标签、搜索、星标功能
- **待办事项和任务看板**
- **日历**
- **思维导图**
- **白板绘图协作**

### 多媒体
- **图片查看器和优化器**
- **音乐播放器可视化**
- **视频播放器**
- **截图工具**
- **屏幕录制**

### 网络信息
- **网页浏览器**: 内置浏览功能
- **新闻阅读器**: RSS支持
- **GitHub趋势和资料查看**
- **Hacker News阅读**
- **翻译器**
- **维基百科阅读**
- **网络状态仪表盘**: 实时网络监控（新增）

### 游戏
- 贪吃蛇、俄罗斯方块、2048、记忆翻牌、弹球游戏

### AI功能
- AI聊天助手集成
- 智能代码生成器
- AI提示词库

## 技术亮点

**真实文件系统模拟**: 完整的文件树结构，支持创建、删除、复制、移动、重命名操作

**终端命令系统**: 50+命令，包括`ls`、`cd`、`cat`、`grep`、`mkdir`、`rm`、`curl`、`weather`、`news`等

**实时API集成**: 天气数据、汇率、新闻订阅

**Python代码执行**: 集成Pyodide在浏览器中运行Python

**本地存储持久化**: 应用状态、文件内容、用户设置自动保存

## 终端命令参考

### 文件操作
| 命令 | 描述 |
|------|------|
| `ls` | 列出目录内容 |
| `cd` | 切换目录 |
| `pwd` | 显示当前目录 |
| `cat` | 查看文件内容 |
| `mkdir` | 创建目录 |
| `touch` | 创建文件 |
| `rm` | 删除文件 |
| `cp` | 复制文件 |
| `mv` | 移动文件 |
| `tree` | 显示目录树 |

### 系统信息
| 命令 | 描述 |
|------|------|
| `whoami` | 显示用户名 |
| `hostname` | 显示主机名 |
| `date` | 显示日期时间 |
| `uptime` | 显示系统运行时间 |
| `neofetch` | 系统信息展示 |
| `ps` | 进程列表 |
| `top` | 系统监控 |

### 网络工具
| 命令 | 描述 |
|------|------|
| `weather [city]` | 获取天气信息 |
| `news` | 获取新闻头条 |
| `crypto` | 加密货币价格 |
| `ipinfo` | IP地址信息 |
| `translate <text>` | 翻译文本 |

### 实用工具
| 命令 | 描述 |
|------|------|
| `calc <expression>` | 计算器 |
| `base64 <text>` | Base64编码 |
| `hash <text>` | 生成哈希 |
| `uuid` | 生成UUID |
| `password` | 生成密码 |

### 娱乐命令
| 命令 | 描述 |
|------|------|
| `cowsay <text>` | ASCII艺术牛 |
| `fortune` | 随机名言 |
| `matrix` | 矩阵效果 |
| `joke` | 随机笑话 |

## 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl + Shift + L` | 切换应用启动器 |
| `Ctrl + Shift + S` | 打开设置 |
| `Ctrl + Shift + F` | 打开文件管理器 |
| `Ctrl + Shift + T` | 打开终端 |
| `Ctrl + N` | 新建终端窗口 |
| `Ctrl + W` | 关闭当前窗口 |
| `Ctrl + M` | 最小化窗口 |
| `F11` | 全屏切换 |

## 项目结构

```
WebLinuxOS/
├── web-linux/                 # 主应用目录
│   ├── src/
│   │   ├── apps/              # 应用组件 (200+)
│   │   ├── components/        # 桌面组件
│   │   │   ├── desktop/       # 桌面、窗口管理、任务栏
│   │   │   └── system/        # 系统组件
│   │   ├── store/             # Zustand状态管理
│   │   ├── types/             # TypeScript类型定义
│   │   ├── apps.tsx           # 应用注册表
│   │   ├── App.tsx            # 主应用入口
│   │   └── icons.tsx          # 图标组件
│   ├── public/                # 静态资源
│   └── package.json           # 项目配置
└── .github/workflows/         # GitHub Actions工作流
    └── deploy.yml             # GitHub Pages部署工作流
```

## 技术栈

- **前端框架**: React 19 + TypeScript
- **状态管理**: Zustand
- **样式**: CSS-in-JS (内联样式)
- **构建工具**: Vite 8
- **代码执行**: Pyodide (Python在浏览器)
- **API集成**: Open-Meteo (天气)、Open Exchange Rates (汇率)

## 开发路线

- [ ] 更多公开API集成
- [ ] 实时协作功能
- [ ] 更多游戏应用
- [ ] 增强AI功能
- [ ] 移动端适配优化

## 贡献指南

欢迎贡献代码。提交Issue和Pull Request前请确保：

1. 代码遵循项目风格规范
2. 新应用必须在`apps.tsx`中注册
3. 组件文件放置在`src/apps/`目录

## 许可证

MIT License

## 致谢

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Pyodide](https://pyodide.org/)
- [Open-Meteo](https://open-meteo.com/)
- [Lucide Icons](https://lucide.dev/)