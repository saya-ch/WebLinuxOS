# WebLinuxOS

一个基于Web的Linux系统模拟平台，提供完整的桌面环境体验，运行在浏览器中。

## 功能特性

### 桌面环境
- 现代化的Linux风格桌面界面
- 支持多窗口管理系统
- 窗口分屏吸附功能（左/右/上/下半屏、四分之一屏）
- 窗口动画效果和拖拽操作
- 任务栏和系统托盘
- 全局搜索功能

### 内置应用
超过200个内置应用，涵盖多个类别：

**系统工具**
- 文件管理器
- 终端模拟器
- 系统监视器
- 系统设置
- 任务管理器

**开发工具**
- 代码编辑器
- JSON格式化器
- 正则表达式测试器
- API测试器
- 代码片段管理器

**办公应用**
- 文本编辑器
- Markdown编辑器
- 电子表格
- 演示文稿
- 日历

**实用工具**
- 天气应用（集成Open-Meteo API）
- 汇率转换器（实时汇率）
- IP地址查询
- 密码生成器
- 单位转换器

**多媒体**
- 音乐播放器
- 视频播放器
- 图片查看器
- 画图工具

**游戏**
- 贪吃蛇
- 俄罗斯方块

### 在线服务集成
- 实时天气数据
- 实时汇率数据
- IP地理位置查询
- 新闻资讯（支持多种分类）

## 技术栈

- **前端框架**: React 19
- **类型系统**: TypeScript
- **状态管理**: Zustand
- **构建工具**: Vite
- **图标库**: Lucide React
- **Python运行时**: Pyodide

## 快速开始

### 安装依赖

```bash
cd web-linux
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
web-linux/
├── src/
│   ├── apps/              # 应用组件目录
│   ├── components/        # 通用组件
│   ├── icons/             # 图标组件
│   ├── lib/               # 工具函数
│   ├── store/             # 状态管理
│   ├── styles/            # 样式文件
│   ├── types/             # 类型定义
│   ├── App.tsx            # 主应用组件
│   ├── main.tsx           # 入口文件
│   └── index.css          # 全局样式
├── public/                # 静态资源
├── index.html             # HTML模板
├── vite.config.ts         # Vite配置
├── tsconfig.json          # TypeScript配置
└── package.json           # 项目配置
```

## 使用说明

### 快捷键

- `Ctrl + Alt + T`: 打开终端
- `Ctrl + Alt + F`: 打开文件管理器
- `Ctrl + Space`: 打开全局搜索
- `Ctrl + W`: 关闭当前窗口
- `Alt + Tab`: 切换窗口

### 窗口操作

- 点击窗口标题栏拖动窗口
- 双击标题栏最大化/还原窗口
- 拖动窗口到屏幕边缘触发分屏吸附

## 浏览器兼容性

- Chrome (推荐)
- Firefox
- Safari
- Edge

## 部署

### GitHub Pages

项目已配置支持GitHub Pages部署。启用GitHub Actions自动部署：

1. 在仓库设置中启用GitHub Pages
2. 配置GitHub Actions工作流
3. 推送代码后自动部署

### 自定义部署

```bash
npm run build
# 将dist目录部署到任意静态托管服务
```

## 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork项目
2. 创建功能分支
3. 提交代码
4. 创建Pull Request

## 许可证

MIT License

## 致谢

感谢以下开源项目和服务：

- Open-Meteo API - 天气数据
- ExchangeRate-API - 汇率数据
- IP-API - IP地理信息

---

运行在浏览器中的完整Linux桌面体验 🐧