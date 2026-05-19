# WebLinuxOS

一个基于 Web 的类 Linux 操作系统，提供 56+ 个应用程序，使用 React + TypeScript + Vite 构建的 Monorepo 项目。

## 项目结构

```
/workspace
├── apps/
│   └── web/              # 主应用程序
├── packages/
│   ├── ui/               # UI 组件库
│   ├── core/             # 核心系统功能
│   └── apps/             # 应用程序模块
├── docs/                 # 文档
├── package.json          # 根包配置
└── README.md
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 技术栈

- React 18+
- TypeScript
- Vite
- Monorepo (npm workspaces)
