# WebLinuxOS 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 在浏览器中构建完整的 Web Linux 系统，配备 56+ 开发工具

**架构：** React Monorepo 架构，包含共享 UI 组件库、核心系统（窗口管理、文件系统、Shell）、56 个独立应用

**技术栈：** React 18 + TypeScript + Vite + Zustand + Tailwind CSS + Monaco Editor + Xterm.js + Dexie.js

---

## 总体文件结构

```
weblinuxos/
├── package.json                          # 根 workspace 配置
├── tsconfig.json                        # TypeScript 基础配置
├── vite.config.ts                       # Vite 构建配置
├── tailwind.config.js                   # Tailwind CSS 配置
│
├── packages/
│   ├── ui/                              # 共享 UI 组件库
│   │   └── src/
│   │       ├── index.ts
│   │       ├── components/             # 20+ 基础组件
│   │       │   ├── Button/
│   │       │   ├── Input/
│   │       │   ├── Modal/
│   │       │   ├── Tabs/
│   │       │   ├── Tree/
│   │       │   ├── Dropdown/
│   │       │   ├── ContextMenu/
│   │       │   ├── Tooltip/
│   │       │   ├── Toast/
│   │       │   └── SplitPane/
│   │       └── styles/
│   │           └── globals.css
│   │
│   ├── core/                            # 核心系统
│   │   └── src/
│   │       ├── window-manager/          # 窗口管理系统
│   │       ├── taskbar/                # 任务栏
│   │       ├── filesystem/             # 虚拟文件系统
│   │       ├── shell/                  # Shell 模拟器
│   │       └── context/                # 全局状态管理
│   │
│   └── apps/                           # 应用（按类别组织）
│       ├── code-editor/                # 代码编辑器
│       ├── terminal/                   # 模拟终端
│       ├── file-manager/              # 文件管理器
│       ├── database-client/            # 数据库客户端
│       ├── api-tester/                 # API 测试工具
│       ├── git-visualizer/             # Git 可视化
│       ├── markdown-editor/            # Markdown 编辑器
│       ├── json-tools/                 # JSON/正则工具
│       ├── browser-preview/            # 浏览器预览
│       ├── utils/                      # 工具类应用 (10个)
│       ├── frontend/                   # 前端工具 (8个)
│       ├── api-tools/                  # API 工具 (8个)
│       ├── database/                   # 数据库工具 (5个)
│       ├── media/                       # 媒体工具 (5个)
│       ├── docs/                       # 文档工具 (4个)
│       ├── terminal-tools/             # 终端工具 (4个)
│       └── security/                   # 安全工具 (3个)
│
└── apps/
    └── web/                            # 主应用入口
        ├── src/
        │   ├── main.tsx
        │   ├── App.tsx
        │   └── styles/
        └── index.html
```

---

## 实施阶段总览

### Phase 0: 项目初始化 (基础)
- [ ] 0.1 创建 Monorepo 结构
- [ ] 0.2 配置 TypeScript、Vite、Tailwind
- [ ] 0.3 创建共享 UI 组件库
- [ ] 0.4 创建核心系统基础

### Phase 1: 核心系统 (MVP)
- [ ] 1.1 窗口管理系统
- [ ] 1.2 任务栏与开始菜单
- [ ] 1.3 虚拟文件系统
- [ ] 1.4 Shell 模拟器
- [ ] 1.5 全局状态管理

### Phase 2: 核心应用 (9个)
- [ ] 2.1 代码编辑器
- [ ] 2.2 模拟终端
- [ ] 2.3 文件管理器
- [ ] 2.4 数据库客户端
- [ ] 2.5 API 测试工具
- [ ] 2.6 Git 可视化
- [ ] 2.7 Markdown 编辑器
- [ ] 2.8 JSON/正则工具
- [ ] 2.9 浏览器预览

### Phase 3-6: 扩展应用 (47个)
- [ ] Phase 3: 开发效率工具 (10个)
- [ ] Phase 4: 前端开发工具 (8个)
- [ ] Phase 5: API/后端工具 (8个)
- [ ] Phase 6: 数据库工具 (5个)
- [ ] Phase 7: 资产/媒体工具 (5个)
- [ ] Phase 8: 文档/笔记工具 (4个)
- [ ] Phase 9: 终端/安全工具 (7个)

---

## 子模块详细计划

### Plan 1: UI 组件库
**文件路径：** `/workspace/docs/superpowers/plans/2026-05-19-weblinuxos-ui-components.md`

### Plan 2: 核心系统
**文件路径：** `/workspace/docs/superpowers/plans/2026-05-19-weblinuxos-core-system.md`

### Plan 3: 核心应用 (Phase 1)
**文件路径：** `/workspace/docs/superpowers/plans/2026-05-19-weblinuxos-core-apps.md`

### Plan 4: 扩展应用 (Phase 2-9)
**文件路径：** `/workspace/docs/superpowers/plans/2026-05-19-weblinuxos-extended-apps.md`

---

## 实施顺序

### 阶段 0：基础设置
1. 创建项目目录结构
2. 配置 Monorepo (package.json workspaces)
3. 配置 TypeScript (tsconfig.json)
4. 配置 Vite (vite.config.ts)
5. 配置 Tailwind CSS (tailwind.config.js)

### 阶段 1：UI 组件库
1. 创建 Button 组件
2. 创建 Input/Textarea 组件
3. 创建 Modal 组件
4. 创建 Tabs 组件
5. 创建 Tree 组件（用于文件树）
6. 创建 Dropdown 组件
7. 创建 ContextMenu 组件
8. 创建 Tooltip 组件
9. 创建 Toast 组件
10. 创建 SplitPane 组件
11. 创建全局样式（CSS 变量）

### 阶段 2：核心系统
1. 创建 Zustand Store（全局状态）
2. 创建 WindowManager 组件
3. 创建 Window 组件（可拖拽调整大小）
4. 创建 TitleBar 组件
5. 创建 Taskbar 组件
6. 创建 StartMenu 组件
7. 创建 FileSystem 服务（IndexedDB）
8. 创建 FileNode 数据结构
9. 创建 Shell 解析器
10. 创建基础命令（ls, cd, pwd, mkdir, rm, cat）

### 阶段 3：核心应用
1. 代码编辑器 (Monaco)
2. 模拟终端 (Xterm.js)
3. 文件管理器
4. 数据库客户端
5. API 测试工具
6. Git 可视化
7. Markdown 编辑器
8. JSON/正则工具
9. 浏览器预览

### 阶段 4-9：扩展应用
按类别逐步实现所有 47 个应用

---

## Sub Agent 并行开发策略

### 方案 A：按技术栈分配（推荐）

**Agent 1: UI 组件库与核心系统**
- 创建 packages/ui 组件库
- 创建 packages/core 核心系统
- 创建全局样式和主题系统

**Agent 2: 编辑器类应用**
- 代码编辑器
- Markdown 编辑器
- SQL 编辑器
- Shell 脚本编辑器
- CSS 编辑器
- SVG 编辑器

**Agent 3: 工具类应用**
- JSON/正则工具
- 进制转换
- UUID/哈希生成器
- Base64 编解码
- URL 编解码
- 颜色选择器
- 时间戳转换器
- 差异对比工具
- 表格生成器

**Agent 4: API 类应用**
- API 测试工具
- cURL 生成器
- JWT 解码器
- WebSocket 测试器
- GraphQL 客户端
- OAuth 调试工具
- Webhook 测试器

**Agent 5: 数据库/资产类应用**
- 数据库客户端
- SQL 编辑器
- MongoDB 客户端
- Redis 客户端
- ER 图绘制器
- 图片压缩工具
- Favicon 生成器
- 图片转 Base64

### 实施顺序

1. **Agent 1** 先完成基础设置（阶段 0-2）
2. **Agent 1** 完成后，**Agent 2-5** 可以并行开始
3. **Agent 2** 创建基础应用框架
4. **Agent 3-5** 在 Agent 2 的基础上创建具体应用

---

## 成功标准

- [ ] 所有 56 个应用可正常打开
- [ ] 窗口可拖拽、调整大小、最小化、最大化
- [ ] 文件可在虚拟文件系统中创建、编辑、删除
- [ ] Shell 可执行基础命令
- [ ] 数据持久化到 IndexedDB
- [ ] 首屏加载时间 < 3秒
- [ ] 所有应用 UI 风格一致

---

**文档状态：** ✅ 实施计划完成
