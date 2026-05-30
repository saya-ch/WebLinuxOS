# WebLinuxOS

一个功能完整的 Web Linux 桌面环境，完全运行在浏览器中。基于 React、TypeScript 和现代 Web 技术构建，无需安装即可提供完整的桌面体验。

## 在线演示

访问在线演示：[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## 核心特性

### 桌面环境

- **多虚拟桌面**：创建和切换多个工作区，支持自定义壁纸
- **高级窗口管理**：支持拖拽、调整大小、最小化、最大化和平滑动画关闭窗口
- **智能启动器**：支持模糊搜索和分类应用列表
- **系统托盘**：快速访问网络、音量、电池和通知指示器
- **全局搜索**：基于模糊匹配的应用启动器和文件搜索
- **命令面板**：键盘驱动的命令执行，适合高级用户
- **上下文菜单**：右键菜单，支持文件操作和快捷操作
- **动态壁纸**：交互式粒子效果和动态背景
- **启动画面**：优雅的动画加载屏幕

### 应用生态

系统包含 120+ 预装应用，涵盖多个类别：

**系统工具**
- 文件管理器（树形导航和文件操作）
- 终端仿真器（90+ 内置命令）
- 系统监视器（实时资源使用情况）
- 任务管理器和进程监视器
- 网络监视器和磁盘分析器
- 备份工具和归档管理器
- 系统设置（主题定制）

**开发工具**
- 代码编辑器（语法高亮）
- API 测试工具（请求构建器）
- JSON 格式化和验证器
- 正则表达式构建器（实时测试）
- GitHub 热门仓库查看器
- 命令参考文档
- 任务自动化工作流构建器
- 通过 Pyodide 支持 Python REPL

**办公与效率**
- 文本编辑器（格式化选项）
- Markdown 编辑器（实时预览）
- 电子表格应用
- 日历（事件管理）
- 待办事项和看板
- 项目规划器（时间线视图）
- 笔记和思维导图工具
- 演示文稿创建器
- 闪卡学习工具

**实用工具**
- 计算器（科学计算功能）
- 密码管理器（加密存储）
- 番茄钟计时器
- 颜色选择器（调色板生成）
- 二维码生成器
- 单位和货币转换器
- 在线工具包（JSON、Base64、URL 编码/解码、哈希计算）
- 实时翻译器

**多媒体**
- 音乐播放器（播放列表支持）
- 视频播放器（控制选项）
- 绘画应用（绘图工具）
- 图片查看器（缩放功能）
- 摄像头和屏幕录制
- 录音机
- 图片优化器

**娱乐**
- 天气应用（天气预报）
- 世界时钟（多时区）
- 经典游戏（贪吃蛇、俄罗斯方块）
- 虚拟宠物伴侣
- 粒子系统可视化

### 终端特性

内置终端仿真器提供：

- 90+ 内置 shell 命令
- 通过 Pyodide 运行 Python 3
- 命令历史和自动补全
- 文件系统导航和操作
- 系统信息命令
- 计算器和实用函数
- 趣味命令（cowsay、fortune、ASCII 艺术）

**常用命令：**
```bash
# 导航
ls, cd, pwd, tree

# 文件操作
cat, echo, mkdir, touch, rm, cp, mv, find

# 系统信息
neofetch, uptime, df, free, ps, top

# 开发
git, npm, node, python, python3

# 实用工具
calc, weather, translate, qrcode, password

# 趣味
fortune, sl, banner, cowsay
```

### Web 服务集成

- Open-Meteo 实时天气数据
- ipapi.co IP 地理位置
- CoinGecko 加密货币价格
- 货币转换汇率
- 空气质量指数数据

## 快速开始

```bash
# 克隆仓库
git clone https://github.com/saya-ch/WebLinuxOS.git

# 进入项目目录
cd WebLinuxOS/web-linux

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 部署到 GitHub Pages
npm run deploy
```

## 键盘快捷键

### 系统快捷键
| 快捷键 | 操作 |
|--------|------|
| Ctrl+Shift+L | 打开启动器 |
| Ctrl+K | 全局搜索 |
| Ctrl+P | 命令面板 |
| Alt+Tab | 切换窗口 |
| F11 | 全屏切换 |
| PrintScreen | 截图 |
| Ctrl+Q |关闭窗口 |
| Ctrl+M | 最小化窗口 |

### 应用启动
| 快捷键 | 应用 |
|--------|------|
| Super+T | 终端 |
| Super+E | 文件管理器 |
| Super+, | 设置 |
| Super+B | 浏览器 |
| Super+A | 计算器 |
| Super+G | 代码编辑器 |
| Super+H | 帮助 |
| Super+D | 系统监视器 |

### 虚拟桌面
| 快捷键 | 操作 |
|--------|------|
| Ctrl+Alt+[1-9] | 切换到桌面 |
| Ctrl+Alt+方向键 | 切换工作区 |
| Ctrl+Shift+Alt+[1-9] | 移动窗口到桌面 |

## 技术栈

- **React 19** - UI 组件框架
- **TypeScript 6** - 类型安全开发
- **Zustand 5** - 轻量级状态管理
- **Vite 8** - 快速构建工具
- **Pyodide** - 浏览器中的 Python 运行时
- **Lucide React** - 图标库
- **Marked** - Markdown 解析

## 项目结构

```
web-linux/
├── src/
│   ├── apps/           # 应用组件（120+ 应用）
│   ├── components/     # 桌面 UI 组件
│   │   └── desktop/    # 桌面、任务栏、窗口管理
│   ├── store.tsx       # Zustand 状态管理
│   ├── apps.tsx        # 应用注册表
│   ├── icons.tsx       # 图标定义
│   └── types.ts        # TypeScript 类型定义
├── public/             # 静态资源
├── index.html          # 入口 HTML
├── vite.config.ts      # Vite 配置
├── tsconfig.json       # TypeScript 配置
└── package.json        # 依赖和脚本
```

## 性能优化

WebLinuxOS 包含多项性能优化：

- **代码分割**：应用被分割成独立的代码块
- **懒加载**：组件按需加载
- **GPU 加速**：CSS 动画利用硬件加速
- **记忆化**：React memo 防止不必要的重新渲染
- **内容可见性**：优化长列表渲染
- **摇树优化**：构建时消除未使用代码
- **防抖存储**：优化 localStorage 操作

## 浏览器兼容性

- Chrome 90+（推荐）
- Firefox 88+
- Safari 14+
- Edge 90+

## 安全性

- 所有用户输入的输入清理
- 终端计算器的安全表达式求值
- 敏感数据的本地存储加密
- 客户端代码中不暴露外部 API 密钥
- XSS 保护的 Content Security Policy 头

## 架构亮点

### 窗口管理
窗口管理系统支持：
- 基于 Z-index 的窗口分层
- 窗口最小化/最大化/还原
- 窗口拖拽和调整大小
- 多显示器感知
- 窗口状态持久化

### 文件系统
虚拟文件系统具有：
- 分层文件夹结构
- 文件操作（创建、删除、重命名、移动）
- 撤销/重做支持
- LocalStorage 持久化
- 文件类型图标

### 状态管理
Zustand 驱动的状态管理：
- 集中式应用注册表
- 窗口状态跟踪
- 桌面图标管理
- 主题和壁纸设置
- 用户偏好设置

## 贡献

欢迎贡献！请随时提交 issues 和 pull requests。

## 许可证

MIT 许可证 - 详见 LICENSE 文件。

## 致谢

- Pyodide 实现浏览器中的 Python
- Lucide 提供精美的图标
- React 团队提供组件框架
- Vite 团队提供构建工具
- 本项目使用的所有开源库
