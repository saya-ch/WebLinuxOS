# WebLinuxOS

一个基于 React + TypeScript 构建的 Web 模拟 Linux 操作系统，提供完整的桌面体验和丰富的实用应用程序。

## 功能特性

### 桌面环境
- 窗口管理系统：支持拖拽、缩放、最小化、最大化、关闭
- 任务栏：显示时间、系统托盘、运行中的应用
- 开始菜单：分类应用列表、快速搜索
- 桌面图标：双击打开应用
- 多主题支持：深色/浅色主题切换

### 内置应用

#### 系统工具
- **文件管理器** - 模拟文件浏览和管理
- **终端** - 模拟 Linux 命令行界面
- **系统设置** - 主题、壁纸、显示设置
- **系统监视器** - CPU、内存、网络监控
- **任务管理器** - 进程管理

#### 实用工具
- **天气** - 实时天气查询（Open-Meteo API）
- **汇率转换器** - 实时汇率转换（Frankfurter API）
- **IP查询** - IP地理位置查询（ipapi.co）
- **新闻阅读器** - Hacker News 技术新闻
- **开发者工具箱** - Base64、JSON、URL、UUID、时间戳等编码工具
- **计算器** - 科学计算器
- **日历** - 日历和日期管理
- **时钟** - 世界时钟
- **取色器** - 颏色选择工具

#### 媒体与娱乐
- **音乐播放器** - 模拟音乐播放
- **视频播放器** - 模拟视频播放
- **图片查看器** - 图片浏览
- **贪吃蛇** - 经典贪吃蛇游戏
- **俄罗斯方块** - 经典俄罗斯方块游戏

#### 办公工具
- **文本编辑器** - 代码/文本编辑
- **笔记** - 快速笔记记录
- **待办事项** - 任务管理

#### 网络
- **浏览器** - 内嵌网页浏览
- **邮件** - 模拟邮件客户端

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **状态管理**: Zustand
- **样式**: CSS Variables + 响应式设计
- **API集成**:
  - Open-Meteo (天气数据)
  - Frankfurter (汇率数据)
  - ipapi.co (IP地理位置)
  - Hacker News API (技术新闻)

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 项目结构

```
WebLinuxOS/
├── src/
│   ├── apps/              # 应用组件
│   │   ├── Weather.tsx    # 天气应用
│   │   ├── CurrencyConverter.tsx
│   │   ├── IPLookup.tsx
│   │   ├── NewsReader.tsx
│   │   ├── DevToolbox.tsx
│   │   └── ...
│   ├── components/        # UI组件
│   │   ├── desktop/       # 桌面组件
│   │   └── ui/            # 通用UI组件
│   ├── store.tsx          # Zustand状态管理
│   ├── types.ts           # TypeScript类型定义
│   ├── apps.tsx           # 应用注册配置
│   ├── icons.tsx          # SVG图标组件
│   ├── App.tsx            # 主应用组件
│   └── index.css          # 全局样式
├── public/                # 静态资源
├── index.html             # HTML入口
└── vite.config.ts         # Vite配置
```

## 在线演示

访问 [GitHub Pages](https://saya-ch.github.io/WebLinuxOS/) 查看在线演示。

## API 数据来源

本项目集成了多个公开API提供真实数据：

| 功能 | API | 说明 |
|------|-----|------|
| 天气 | Open-Meteo | 免费、无需认证的天气API |
| 汇率 | Frankfurter | 欧洲央行汇率数据 |
| IP查询 | ipapi.co | IP地理位置信息 |
| 新闻 | Hacker News | Y Combinator技术新闻 |

## 开发计划

- [ ] 更多实用应用（翻译、二维码生成等）
- [ ] 本地存储持久化
- [ ] 多语言支持
- [ ] 更多主题选项
- [ ] 键盘快捷键支持
- [ ] 文件系统模拟增强

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目。

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

MIT License

## 致谢

- 所有公开API提供商
- React 和 Vite 团队
- 开源社区