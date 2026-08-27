<div align="center">

# WebLinuxOS

**A fully functional Linux desktop environment that runs entirely in your browser.**

**一个完全运行在浏览器中的功能级 Linux 桌面环境。**

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=flat&logo=github)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![GitHub Release](https://img.shields.io/github/v/release/saya-ch/WebLinuxOS?style=flat)](https://github.com/saya-ch/WebLinuxOS/releases)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=flat&color=blue)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/saya-ch/WebLinuxOS/deploy.yml?branch=main&style=flat&logo=github-actions)](https://github.com/saya-ch/WebLinuxOS/actions)

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)** | [Report Issue](https://github.com/saya-ch/WebLinuxOS/issues) | [Contributing](CONTRIBUTING.md) | [Changelog](CHANGELOG.md)

</div>

---

## Overview

Most "web desktop" projects are visual shells -- windows you can drag around, but nothing inside works. WebLinuxOS is different. Every application connects to real public APIs, executes real logic, and produces real output. No mock data. No placeholder UI.

大多数"Web 桌面"项目只是视觉壳——能拖拽窗口，但内部功能都是摆设。WebLinuxOS 不同。每个应用都连接真实的公共 API，执行真实逻辑，产生真实输出。没有模拟数据，没有占位界面。

## Features

- **640+ built-in applications** -- covering development, productivity, AI, internet, data analysis, utilities, and games
- **Full window management** -- drag, resize, minimize, maximize, snap-to-edge tiling, up to 9 virtual desktops
- **200+ terminal commands** -- complete terminal emulator with virtual filesystem, persistent storage, and operation history
- **Zero backend** -- all logic runs client-side; only calls public APIs, no server required
- **Real API integration** -- Open-Meteo weather, CoinGecko crypto, Hacker News, Wikipedia, and 20+ more data sources
- **Monaco code editor** -- same engine as VS Code, with syntax highlighting and IntelliSense
- **IndexedDB file storage** -- virtual filesystem backed by IndexedDB, breaking the 5MB localStorage limit
- **Cross-tab sync** -- real-time theme, file, and state synchronization via BroadcastChannel
- **PWA support** -- offline-capable, installable to desktop

## Quick Start

### Online

Visit **[saya-ch.github.io/WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/)** -- no installation needed.

### Local Development

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

The dev server starts at `http://localhost:5173/WebLinuxOS/`.

### Production Build

```bash
cd web-linux
npm run build
```

TypeScript type checking (`tsc -b`) runs automatically before build, requiring zero type errors.

## Architecture

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # 640+ application implementations
│   │   │   ├── terminal/      # Terminal command system (200+ commands)
│   │   │   ├── collab/        # Collaborative apps (whiteboard, doc editing)
│   │   │   ├── algorithms/    # Algorithm visualizations
│   │   │   └── *.tsx          # Individual application components
│   │   ├── components/        # Core UI components
│   │   │   ├── desktop/       # Desktop, window manager, taskbar, start menu, wallpapers
│   │   │   └── *.tsx          # Command palette, notifications, shortcuts panel
│   │   ├── store/             # Zustand state, file utilities, IndexedDB persistence
│   │   ├── services/          # AI service, API service, clipboard, sync
│   │   ├── config/            # API endpoint configuration (20+ data sources)
│   │   ├── apps.tsx           # Application registry
│   │   └── store.tsx          # Global state store
│   ├── public/                # Static assets, PWA manifest, Service Worker
│   └── vite.config.ts         # Build config with 50+ code-split chunks
├── .github/workflows/         # CI/CD: auto-deploy to GitHub Pages
└── README.md
```

**Tech Stack:** React 19 + TypeScript 6 + Vite 8 + Zustand 5 + Monaco Editor + Pyodide

**Key Architecture Decisions:**

| Decision | Description |
|----------|-------------|
| Lazy Loading | Each app is an independent Vite chunk, loaded on demand |
| IndexedDB Storage | File tree persisted to IndexedDB, breaking the 5MB localStorage limit |
| Virtual Filesystem | JSON tree with undo/redo, path resolution, search, and sorting |
| Cross-tab Sync | BroadcastChannel-based real-time sync across browser tabs |
| Offline-first | Service Worker with stale-while-revalidate caching strategy |
| Zero Backend | All logic runs client-side, only calls public APIs |

## Core Features

### Window Manager

Full desktop window management: drag to move, four-directional resize, double-click titlebar to maximize, edge-snap tiling (left/right/top/bottom/quadrant). Supports up to 9 virtual desktops, each with independent wallpaper settings. Taskbar shows all open windows with one-click switching.

### Virtual Filesystem

JSON tree-based hierarchical filesystem with full CRUD operations. All file changes are persisted to IndexedDB (with localStorage fallback), and operation history is recorded to support undo/redo. Built-in file type recognition, path resolution, node search, and sorting.

### 640+ Built-in Applications

| Category | Representative Apps |
|----------|-------------------|
| Development | Monaco code editor, terminal (200+ commands), JSON formatter, regex tester, API client, Git visualization |
| Productivity | Pomodoro timer, kanban board, Markdown previewer, spreadsheet, PDF viewer, resume generator |
| AI & Creative | AI chat (Pollinations.ai), AI image generation, AI writing studio, code analysis, prompt engineering lab |
| Internet | Web browser (DuckDuckGo), weather (Open-Meteo), crypto tracker (CoinGecko), news reader |
| Data Analysis | DataVerse Live multi-source dashboard, advanced data visualization, chart tools |
| System | File manager, system monitor, password manager, workspace manager, WebSSH |
| Multimedia | Music studio, audio visualizer, paint, screen recorder, camera |
| Games | Tetris, Snake, 2048, Breakout, dice |

### Terminal Emulator

200+ built-in commands covering file operations, system information, network diagnostics, AI conversations, API calls, encryption, and more. Built on the virtual filesystem with command history, tab completion, and pipeline support.

### Public API Integration

All data sources are real, public APIs -- no simulated data:

| API | Purpose |
|-----|---------|
| Open-Meteo | Global weather forecasts and air quality |
| Pollinations.ai | AI chat and image generation (free, no API key) |
| DuckDuckGo | Web search (free) |
| CoinGecko | Cryptocurrency prices and market cap |
| Hacker News | Tech news (Firebase API) |
| Wikipedia | Encyclopedia articles |
| GitHub API | Repository exploration and trending |
| NASA APOD | Astronomy picture of the day |
| Frankfurter | ECB exchange rates |
| TheMealDB | Recipe database |
| Cloudflare DoH | DNS over HTTPS queries |
| Free Dictionary API | Pronunciation, definitions, synonyms |
| Web Crypto API | SHA/HMAC/AES-GCM hashing and encryption (browser native) |
| crt.sh | SSL/TLS certificate transparency logs |

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Smart Search | `Ctrl/Cmd + Shift + K` |
| Terminal | `Ctrl/Cmd + T` |
| File Manager | `Ctrl/Cmd + E` |
| Browser | `Ctrl/Cmd + B` |
| Command Palette | `Ctrl/Cmd + Shift + P` |
| AI Command Center | `Ctrl/Cmd + Space` |
| Quick Note | `Alt + N` |
| Settings | `Ctrl/Cmd + ,` |
| Calculator | `Ctrl/Cmd + Shift + C` |
| Text Editor | `Ctrl/Cmd + Shift + E` |
| Close Window | `Ctrl/Cmd + Q` |
| Launcher | `Ctrl/Cmd + Shift + L` |
| Switch Desktop | `Ctrl/Cmd + Alt + 1-9` |
| Move Window to Desktop | `Ctrl/Cmd + Shift + Alt + 1-9` |
| Window Snap | `Ctrl/Cmd + Shift + Arrow` |
| Shortcut Help | `Ctrl/Cmd + Shift + ?` |

## Development Guide

### Adding a New Application

Create a new `.tsx` file in `src/apps/` and register it in `src/apps.tsx`:

```tsx
// src/apps/MyNewApp.tsx
import React from 'react'

const MyNewApp: React.FC = () => {
  return (
    <div style={{ padding: '16px' }}>
      <h2>My New App</h2>
      <p>Application content...</p>
    </div>
  )
}

export default MyNewApp
```

```tsx
// src/apps.tsx (add to registry)
{
  id: 'my-new-app',
  name: 'My New App',
  icon: 'Package',
  component: 'MyNewApp',
  category: 'development',
  description: 'My new application',
}
```

Also add the lazy import in `src/components/desktop/WindowManager.tsx`:

```tsx
// In the componentMap object
MyNewApp: () => import('../../apps/MyNewApp'),
```

Components are dynamically imported via `React.lazy`, and Vite automatically splits them into independent chunks for on-demand loading.

### Project Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 5173) |
| `npm run build` | Type check + production build |
| `npm run typecheck` | TypeScript type check only |
| `npm run lint` | ESLint code linting |
| `npm run format` | Prettier code formatting |

## Technical Highlights

- **Application lazy loading** -- 640+ apps as independent chunks; first paint loads only the core framework and a few high-frequency apps. Vite's `manualChunks` precisely splits vendor libraries and large applications
- **IndexedDB file storage** -- Virtual filesystem backed by IndexedDB, breaking the 5MB localStorage limit while maintaining backward compatibility through automatic data migration
- **Optimized system monitoring** -- CPU/memory/storage metrics derived from real browser Performance API data (`performance.memory`, `navigator.connection`, `performance.getEntriesByType`), with cached DOM node counting to avoid expensive full-tree traversals
- **Cross-tab synchronization** -- BroadcastChannel-based real-time sync for theme, file system, and window state across browser tabs
- **PWA and offline support** -- Service Worker with stale-while-revalidate caching for static resources, installable to desktop with offline capability
- **Zero backend deployment** -- Pure static site; all logic runs client-side, only calls public APIs, deployable to any static hosting platform
- **Security headers** -- Development and preview servers configured with COOP/COEP, X-Frame-Options, CSP, and other security response headers

## License

[MIT License](LICENSE) -- Copyright (c) Saya Ch

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Create a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) when writing commit messages.
