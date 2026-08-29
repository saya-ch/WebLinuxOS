<div align="center">

# WebLinuxOS

**A complete Linux desktop environment running entirely in the browser.**

No server. No backend. No dependencies.

[![Deploy Status](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/saya-ch/WebLinuxOS)](https://github.com/saya-ch/WebLinuxOS/network/members)
[![Version](https://img.shields.io/badge/version-139.0.0-green.svg)](https://github.com/saya-ch/WebLinuxOS/releases)

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)** &nbsp;|&nbsp; [Report a Bug](https://github.com/saya-ch/WebLinuxOS/issues) &nbsp;|&nbsp; [Request a Feature](https://github.com/saya-ch/WebLinuxOS/issues)

<br />

</div>

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Applications](#applications)
- [API Integrations](#api-integrations)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

WebLinuxOS replicates a full Linux desktop experience in the browser. It features window management, a virtual file system backed by IndexedDB, a terminal emulator with 200+ commands, 700+ applications, and integrations with 25+ public APIs. Everything runs client-side -- no data leaves your browser unless an app explicitly calls a public API.

---

## Screenshots

<div align="center">

| Desktop | Application Launcher |
|:-------:|:--------------------:|
| ![Desktop](web-linux/screenshots/01-desktop.png) | ![Launcher](web-linux/screenshots/02-launcher.png) |

| File Manager | Terminal |
|:------------:|:--------:|
| ![File Manager](web-linux/screenshots/03-file-manager.png) | ![Terminal](web-linux/screenshots/04-terminal.png) |

| Text Editor | Final Desktop |
|:-----------:|:-------------:|
| ![Text Editor](web-linux/screenshots/05-text-editor.png) | ![Final Desktop](web-linux/screenshots/06-final-desktop.png) |

</div>

---

## Features

### Desktop Environment

- Window management with drag, resize, minimize/maximize, edge snap, and quadrant tiling
- Up to 9 virtual desktops with cross-desktop window migration
- Dark and light themes with 8 accent color presets
- Dynamic wallpapers: aurora, particles, waves, nebula, and 32 gradient options
- Global search (`Ctrl+Shift+K`) to launch any app instantly
- 25+ keyboard shortcuts for power users
- Start menu with categorized app launcher and search history

### Terminal Emulator

- 200+ built-in commands across 10+ categories
- Pipe and redirect support (`ls | grep txt > output.txt`)
- Tab completion for commands, files, and arguments
- Custom aliases with persistent storage
- Inline JavaScript execution
- Network diagnostic, creative, and AI-powered commands

### Virtual File System

- IndexedDB-backed storage that persists across sessions
- Full CRUD operations: create, read, update, delete, rename, copy, move
- Undo/redo support (up to 100 operations)
- Automatic migration from localStorage to IndexedDB

### PWA & Cross-Tab Sync

- Installable as a standalone app with offline support via Service Worker
- Theme, accent color, and file changes sync across browser tabs via BroadcastChannel
- Presence awareness: see which tabs are open with human-readable names
- Clipboard sharing between tabs

---

## Tech Stack

| Layer | Technology | Purpose |
|:------|:-----------|:--------|
| UI Framework | React 19 | Component-based UI rendering |
| Language | TypeScript 6 | Type-safe development |
| Build Tool | Vite 8 | Fast bundling and HMR |
| State Management | Zustand 5 | Lightweight global state |
| Code Editor | Monaco Editor 4.7 | VS Code-powered editor |
| Python Runtime | Pyodide 0.26 | Browser-based Python execution |
| Markdown | marked 18 | Markdown parsing and rendering |
| Icons | lucide-react | Consistent icon library |
| Storage | IndexedDB + localStorage | Persistent file system and settings |
| PWA | Service Worker | Offline support and caching |

---

## Getting Started

### Online

Visit **[saya-ch.github.io/WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/)** -- no installation required.

### Local Development

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173/WebLinuxOS/` in your browser.

### Build & Deploy

```bash
npm run build        # TypeScript check + production build
npm run typecheck    # Type checking only
npm run lint         # ESLint analysis
npm run format       # Format code with Prettier
```

The production build outputs to `../dist/` with Vite-optimized chunks and PWA assets.

---

## Applications

WebLinuxOS ships with **700+ applications** across 10+ categories:

| Category | Examples |
|:---------|:---------|
| System | File Manager, Terminal, Settings, System Monitor, DevInfo Dashboard |
| Development | Code Editor (Monaco), Markdown Live Preview, API Debugger, Web IDE, Git Assistant |
| AI | AI Chat, AI Code Assistant, Pollinations Image Gen, Prompt Engineering Lab |
| Internet | Weather, News Reader, Wikipedia Explorer, GitHub Trending, RSS Aggregator |
| Productivity | Pomodoro Timer, Countdown Timer, Calendar, Kanban Board, Clipboard Manager |
| Data | Spreadsheet, JSON Formatter, Regex Visualizer, Base64 Tools, Hash Calculator |
| Multimedia | Paint, Music Studio, Video Player, Ambient Sound, Sound Recorder |
| Games | Snake, Tetris, 2048, Breakout, Memory Match |
| Network | DNS Lookup, IP Info, Speed Test, WebSocket Client, Network Toolkit Pro |

All apps use real public APIs for live data -- no mock or placeholder content.

---

## API Integrations

WebLinuxOS integrates with **25+ public APIs**:

| API | Data | Used By |
|:----|:-----|:--------|
| Open-Meteo | Weather forecasts | Weather, Weather Dashboard |
| CoinGecko | Cryptocurrency prices | Crypto Tracker, Finance Dashboard |
| Hacker News | Tech news | HackerNewsReader, NewsHub |
| Wikipedia | Encyclopedia articles | WikiExplorer, WikipediaReader |
| GitHub API | Repository data | GitHubExplorer, GitHubTrending |
| Pollinations.ai | AI chat and images | AIChat, PollinationsStudio |
| NASA APOD | Astronomy pictures | AstroDaily, AstroViewer |
| Frankfurter | Exchange rates | CurrencyConverter, ExchangeRate |
| Free Dictionary | Word definitions | Dictionary, LexiconForge |
| MyMemory | Translation | Translator, SmartTranslator |
| TheMealDB | Recipes | RecipeBook, RecipeForge |
| Cloudflare DoH | DNS resolution | DNSLookup, DnsDiagnostics |
| ZenQuotes | Motivational quotes | DailyQuote, QuickQuote |
| Datamuse | Word relationships | KnowledgeExplorer |

---

## Keyboard Shortcuts

| Shortcut | Action |
|:---------|:-------|
| `Ctrl/Cmd+Shift+K` | Global search |
| `Ctrl/Cmd+T` | Open terminal |
| `Ctrl/Cmd+E` | File manager |
| `Ctrl/Cmd+B` | Web browser |
| `Ctrl/Cmd+P` | Command palette |
| `Ctrl/Cmd+Space` | Smart command center |
| `Alt+N` | Quick note |
| `Ctrl/Cmd+Q` | Close window |
| `Ctrl/Cmd+M` | Minimize window |
| `Ctrl/Cmd+/` | Shortcut reference |
| `Ctrl/Cmd+Alt+1-9` | Switch desktop |
| `Ctrl/Cmd+Shift+Arrow` | Move window to desktop |
| `F11` | Toggle fullscreen |

---

## Project Structure

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # 700+ application components
│   │   │   ├── terminal/      # Terminal command modules (20+)
│   │   │   ├── collab/        # Collaboration tools
│   │   │   ├── algorithms/    # Algorithm visualizations
│   │   │   └── *.tsx          # Individual apps
│   │   ├── components/        # Core UI (desktop, windows, taskbar)
│   │   ├── store/             # Zustand state management + IndexedDB
│   │   ├── services/          # Sync, clipboard, API services
│   │   ├── styles/            # CSS themes
│   │   └── utils/             # Utility functions
│   ├── public/                # PWA assets (sw.js, manifest.json)
│   ├── screenshots/           # Project screenshots
│   ├── package.json
│   └── vite.config.ts         # Build config with chunk splitting
├── .github/workflows/         # GitHub Actions CI/CD
├── CONTRIBUTING.md
├── LICENSE
└── README.md
```

---

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Verify: `npm run typecheck && npm run lint`
5. Commit with a [Conventional Commits](https://www.conventionalcommits.org/) message
6. Push and open a Pull Request

### Adding a New Application

1. Create a component in `src/apps/YourApp.tsx`
2. Export it as `export default function YourApp() { ... }`
3. Register it in `src/apps.tsx` within `APP_REGISTRY_EXTRAS`
4. Add a lazy import in `src/components/desktop/WindowManager.tsx`

### Browser Support

| Browser | Minimum Version |
|:--------|:----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

---

## Roadmap

- [ ] i18n multi-language support
- [ ] Plugin system for third-party extensions
- [ ] WebRTC screen sharing
- [ ] File System Access API integration
- [ ] Playwright end-to-end testing in CI

---

## License

[MIT](LICENSE) &copy; 2024-2026 [saya-ch](https://github.com/saya-ch)
