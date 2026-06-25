# WebLinuxOS

一个基于 React + TypeScript 构建的完整 Web Linux 操作系统模拟器，提供真实的桌面体验和丰富的应用程序生态。

## 特性

### 桌面环境

- 完整的窗口管理系统：支持拖拽、缩放、最小化、最大化、关闭
- 任务栏：快速启动、窗口切换、系统托盘、时钟显示
- 开始菜单：应用分类、搜索功能、快捷访问
- 多主题支持：亮色/暗色主题，多种壁纸选择
- 键盘快捷键：全局快捷键支持

### 应用程序 (200+)

**系统工具**
- 文件管理器：完整的文件树浏览、搜索、拖拽上传、批量操作
- 终端：真实终端模拟，支持 50+ 命令，包括文件操作、系统信息、网络工具
- 系统监视器：实时 CPU、内存、网络监控
- 代码编辑器：语法高亮、Python/JS 代码执行、多标签支持

**开发工具**
- REST 客户端：完整的 API 测试工具
- JSON/YAML 格式化与转换
- 正则表达式测试器与构建器
- Base64/URL 编解码工具
- JWT 解码与验证
- Hash 生成器 (MD5, SHA-1, SHA-256, SHA-512)
- Cron 表达式生成器

**实用工具**
- 计算器：科学计算、汇率转换、进制转换
- 天气：实时天气数据 (Open-Meteo API)、7 天预报、温度趋势图
- 番茄钟：专注工作计时器
- 密码生成器与强度分析
- QR 码生成器
- 颜色选择器与配色方案生成
- 单位转换器
- 世界时钟

**办公应用**
- Markdown 编辑器与预览器
- 笔记应用：标签、搜索、星标功能
- 待办事项与任务看板
- 日历
- 思维导图
- 白板：绘图、协作

**多媒体**
- 图片查看器与优化器
- 音乐播放器与可视化
- 视频播放器
- 截图工具
- 屏幕录制器

**网络与信息**
- 浏览器：内置 Web 浏览
- 新闻阅读器：RSS 支持
- GitHub 热门与资料查看
- Hacker News 阅读
- 翻译器
- 维基百科阅读器

**游戏**
- 贪吃蛇
- 俄罗斯方块
- 2048
- 记忆翻牌
- 弹球游戏

**AI 功能**
- AI 聊天助手集成
- 智能代码生成器
- AI 提示词库

### 技术亮点

- 真实文件系统模拟：完整的文件树结构，支持创建、删除、复制、移动、重命名
- 终端命令系统：50+ 命令，包括 `ls`, `cd`, `cat`, `grep`, `mkdir`, `rm`, `curl`, `weather`, `news` 等
- 实时 API 集成：天气数据、汇率转换、新闻订阅
- Python 代码执行：集成 Pyodide，支持在浏览器中运行 Python
- 本地存储持久化：应用状态、文件内容、用户设置自动保存

## 快速开始

### 在线体验

访问 [GitHub Pages](https://saya-ch.github.io/WebLinuxOS/) 立即体验。

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

### 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
WebLinuxOS/
├── web-linux/                 # 主应用目录
│   ├── src/
│   │   ├── apps/              # 应用组件 (200+)
│   │   ├── components/        # 桌面组件
│   │   │   ├── desktop/       # 桌面、窗口管理、任务栏
│   │   │   └── system/        # 系统组件
│   │   ├── store/             # Zustand 状态管理
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── apps.tsx           # 应用注册表
│   │   ├── App.tsx            # 主应用入口
│   │   └── icons.tsx          # 图标组件
│   ├── public/                # 静态资源
│   └── package.json           # 项目配置
└──── README.md                # 项目文档
```

## 技术栈

- **前端框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **样式**: CSS-in-JS (内联样式)
- **构建工具**: Vite
- **代码执行**: Pyodide (Python in Browser)
- **API 集成**: Open-Meteo (天气), Open Exchange Rates (汇率)

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
| `weather [城市]` | 获取天气信息 |
| `news` | 获取新闻头条 |
| `crypto` | 加密货币价格 |
| `ipinfo` | IP 地址信息 |
| `translate <文本>` | 翻译文本 |

### 实用工具
| 命令 | 描述 |
|------|------|
| `calc <表达式>` | 计算器 |
| `base64 <文本>` | Base64 编码 |
| `hash <文本>` | 生成 Hash |
| `uuid` | 生成 UUID |
| `password` | 生成密码 |

### 趣味命令
| 命令 | 描述 |
|------|------|
| `cowsay <文本>` | 牛说笑话 |
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
| `F11` | 全屏/还原窗口 |

## 开发计划

- [ ] 更多公共 API 集成
- [ ] 实时协作功能
- [ ] 更多游戏应用
- [ ] AI 功能增强
- [ ] 移动端适配优化

## 贡献指南

欢迎提交 Issue 和 Pull Request。请确保：

1. 代码符合项目风格
2. 新应用需在 `apps.tsx` 中注册
3. 组件文件放置在 `src/apps/` 目录

## 许可证

MIT License

## 致谢

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Pyodide](https://pyodide.org/)
- [Open-Meteo](https://open-meteo.com/)
- [Lucide Icons](https://lucide.dev/)