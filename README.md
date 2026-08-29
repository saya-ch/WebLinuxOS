# WebLinuxOS

A complete Linux desktop environment running entirely in the browser -- no server, no backend, no dependencies. Built with React, TypeScript, and Vite.

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)**

[![Deploy](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS)](https://github.com/saya-ch/WebLinuxOS/stargazers)

---

## What is this?

WebLinuxOS is a browser-based desktop environment that replicates a full Linux experience. It includes window management, a virtual file system backed by IndexedDB, a terminal emulator with 200+ commands, 700+ applications, and integrations with 25+ public APIs. Everything runs client-side -- no data leaves your browser unless an app explicitly calls a public API.

## Core Features

### Desktop Environment

- Window management with drag, resize, minimize/maximize, edge snap, and quadrant tiling
- Up to 9 virtual desktops with cross-desktop window migration
- Dark and light themes with 8 accent color presets
- Dynamic wallpapers: aurora, particles, waves, nebula, and 32 gradient options
- Global search (Ctrl+Shift+K) to launch any app instantly
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

### PWA Support

- Installable as a standalone app
- Works offline via Service Worker with smart caching
- Automatic update detection

### Cross-Tab Synchronization

- Theme, accent color, and file changes sync across browser tabs via BroadcastChannel
- Presence awareness: see which tabs are open with human-readable names
- Clipboard sharing between tabs

## Applications (700+)

| Category | Examples |
|----------|----------|
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

## API Integrations

| API | Data |
|-----|------|
| Open-Meteo | Weather forecasts |
| CoinGecko | Cryptocurrency prices |
| Hacker News | Tech news |
| Wikipedia | Encyclopedia articles |
| GitHub API | Repository data |
| Pollinations.ai | AI chat and images |
| NASA APOD | Astronomy pictures |
| Frankfurter | Exchange rates |
| Free Dictionary | Word definitions |
| MyMemory | Translation |
| TheMealDB | Recipes |
| Cloudflare DoH | DNS resolution |
| ZenQuotes | Motivational quotes |
| Datamuse | Word relationships |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI | React 19 |
| Language | TypeScript 6 |
| Build | Vite 8 |
| State | Zustand 5 |
| Editor | Monaco Editor 4.7 |
| Python | Pyodide 0.26 |
| Markdown | marked 18 |
| Icons | lucide-react |
| Storage | IndexedDB + localStorage |
| PWA | Service Worker |

## Getting Started

### Online

Visit **[saya-ch.github.io/WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/)** -- no installation required.

### Local Development

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

Open `http://localhost:5173/WebLinuxOS/` in your browser.

### Build & Deploy

```bash
npm run build        # TypeScript check + production build
npm run typecheck    # Type checking only
npm run lint         # ESLint analysis
```

The production build outputs to `../dist/` with Vite-optimized chunks and PWA assets.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+Shift+K | Global search |
| Ctrl/Cmd+T | Open terminal |
| Ctrl/Cmd+E | File manager |
| Ctrl/Cmd+B | Web browser |
| Ctrl/Cmd+P | Command palette |
| Ctrl/Cmd+Space | Smart command center |
| Alt+N | Quick note |
| Ctrl/Cmd+Q | Close window |
| Ctrl/Cmd+M | Minimize window |
| Ctrl/Cmd+/ | Shortcut reference |
| Ctrl/Cmd+Alt+1-9 | Switch desktop |
| Ctrl/Cmd+Shift+Arrow | Move window to desktop |
| F11 | Toggle fullscreen |

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
│   │   ├── store/             # Zustand state + IndexedDB
│   │   ├── services/          # Sync, clipboard, API services
│   │   ├── styles/            # CSS themes
│   │   └── utils/             # Utility functions
│   ├── public/                # PWA assets (sw.js, manifest.json)
│   └── vite.config.ts         # Build config with chunk splitting
├── .github/workflows/         # GitHub Actions CI/CD
└── README.md
```

## Browser Support

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

## Contributing

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

## License

[MIT](LICENSE) -- Copyright (c) 2024-2026 [saya-ch](https://github.com/saya-ch)
