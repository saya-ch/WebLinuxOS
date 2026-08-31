<div align="center">

# WebLinuxOS

**A complete Linux desktop environment running entirely in the browser.**

No server. No backend. No dependencies. Just open and use.

[![Deploy Status](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/saya-ch/WebLinuxOS)](https://github.com/saya-ch/WebLinuxOS/network/members)
[![Version](https://img.shields.io/badge/version-146.0.0-green.svg)](https://github.com/saya-ch/WebLinuxOS/releases)

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)** | [Report a Bug](https://github.com/saya-ch/WebLinuxOS/issues) | [Request a Feature](https://github.com/saya-ch/WebLinuxOS/issues)

<br />

</div>

---

## Table of Contents

- [Why WebLinuxOS](#why-weblinuxos)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Applications](#applications)
- [API Integrations](#api-integrations)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## What's New in v146

- **Web Performance Insights**: real browser performance dashboard using Navigation Timing, Resource Timing, Core Web Vitals (LCP/CLS/FID), memory monitoring, long task detection, and a 0-100 performance score with 4 analysis views
- **Network Connectivity Checker**: tests 16+ popular services (CDN, API, DNS, Social) for reachability, latency, and HTTP status, with category filtering and batch/single checking
- **Security**: fixed 3 high-severity npm vulnerabilities (brace-expansion DoS, nanoid infinite loop, PostCSS path traversal)
- **Performance**: eliminated the 1.2MB apps-misc chunk by splitting 61 unclassified apps into 15 logical sub-chunks, reducing initial load time
- **Service Worker**: updated cache version to v146 for proper cache invalidation after updates

### Previous Highlights (v145)

- **JSON Query Tool**: jq-inspired JSON data query tool with JSONPath syntax support (`$.key`, `$[0]`, `$[*]`, filter expressions), preset query templates, split-pane editing with live results, and one-click copy
- **Security fix**: Terminal `calc` command replaced unsafe `new Function()` (eval equivalent) with a custom safe math expression parser that supports `+-*/%^` and parentheses
- **Bug fix**: Terminal `base64` command now properly encodes Chinese/Unicode text using `encodeURIComponent` + `btoa` instead of crashing with `InvalidCharacterError`
- **Bug fix**: Terminal command history (ArrowUp/ArrowDown) now properly cycles through all previous commands instead of always showing the last one
- **Bug fix**: FileManager file size calculation now uses `TextEncoder` for accurate UTF-8 byte estimation instead of the incorrect `length * 2` heuristic
- **Bug fix**: Recent files list now persists to localStorage when cleared, preventing stale data from reappearing after page refresh
- **UX improvement**: StartMenu now closes on Escape key in all cases (previously only worked when search returned no results)
- **UX improvement**: StartMenu keyboard navigation now highlights selected item with accent border and auto-scrolls to keep it visible
- **Notification fix**: Duration parameter `0` is now properly respected instead of being overridden to 5000ms

### Previous Highlights (v144)

- **Clipboard History Manager**: smart clipboard tracking with content type detection (text/URL/code/JSON), search, pin favorites, and one-click copy
- **Color Toolkit**: comprehensive color utility with palette generator, HEX/RGB/HSL converter, WCAG contrast checker, picker, CSS variable export, and gradient generator
- **Screen Ruler**: pixel-precise measurement tool with distance/angle measurement, grid overlay, magnifier, color picker, and guide lines
- **Bug fixes**: Service Worker update interval now properly cleaned up on page unload to prevent memory leaks
- **Performance**: keyboard shortcut handler optimized with ref-based store access to reduce unnecessary re-registrations
- **Code quality**: ErrorBoundary refactored for more reliable error recovery

### Previous Highlights (v143)

- **CORS Proxy Debugger**: new developer tool for testing cross-origin requests with proxy selection (AllOrigins, CorsProxy.io) and detailed CORS header analysis
- **Markdown Linter**: format checker with 9 detection rules (heading hierarchy, unclosed code blocks, inconsistent list markers, etc.) and one-click auto-fix
- **System Monitor upgrade**: disk space data now uses real `navigator.storage.estimate()` API instead of hardcoded values, with graceful fallback
- **Bug fixes**: Calculator y^x power function corrected, theme listener infinite loop resolved, Terminal command parsing refactored
- **Build optimization**: Vite chunk splitting patterns refined with word boundaries and negative lookaheads to eliminate 25+ overlap cases
- **Code quality**: eliminated 34 duplicate icon definitions, extracted shared constants, deduplicated file operation type labels

---

## Why WebLinuxOS

WebLinuxOS is not a mock. It is a functional Linux desktop environment that runs in any modern browser. Every application is real -- the terminal executes actual commands, the file system persists across sessions, the code editor runs Monaco (the same engine behind VS Code), and 25+ public APIs deliver live data.

The project demonstrates that a complete, usable desktop experience can be delivered through the web platform alone: no plugins, no WebAssembly runtimes to install, no server-side rendering. Just HTML, CSS, and JavaScript running in the browser you already have.

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
- Desktop widgets: clock, system pulse, weather, sticky notes, focus timer

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

### Built-in Developer Tools

- Monaco code editor (VS Code engine) with syntax highlighting for 40+ languages
- Developer Dashboard: system monitoring, quick launch, environment info, code snippets, API health checks
- **Web Performance Insights**: real-time performance analysis with Navigation Timing waterfall, Web Vitals, memory monitoring, and performance scoring
- **Network Connectivity Checker**: test reachability and latency of 16+ popular services (CDN, API, DNS, Social)
- JSON Diff tool: deep recursive comparison with tree/list views and color-coded highlighting
- JSON to TypeScript type generator with smart inference
- Interactive regex visualizer with real-time matching
- Cron expression parser with human-readable descriptions
- Web performance profiler with Core Web Vitals tracking
- Browser fingerprint detection and privacy analysis
- CORS Proxy Debugger: test cross-origin requests with proxy selection and CORS header analysis
- Markdown Linter: format checking with 9 rules and one-click auto-fix
- QR Code Generator: zero-dependency implementation of the full QR Code Model 2 specification (ISO/IEC 18004)

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
npm run build:local  # Build with root base path
npm run typecheck    # Type checking only
npm run lint         # ESLint analysis
npm run format       # Format code with Prettier
```

The production build outputs to `../dist/` with Vite-optimized chunks and PWA assets.

---

## Applications

WebLinuxOS ships with **700+ applications** across 10+ categories:

| Category | Count | Highlights |
|:---------|:------|:-----------|
| System | 20+ | File Manager, Terminal, Settings, System Monitor (with real browser API data), DevInfo Dashboard |
| Development | 80+ | Code Editor (Monaco), Developer Dashboard, CORS Proxy Debugger, Markdown Linter, JSON Diff, API Debugger, Regex Visualizer, QR Code Generator (zero-dependency ISO 18004) |
| AI | 40+ | AI Chat, AI Code Assistant, Prompt Engineering Lab, AI Writing Studio |
| Internet | 30+ | Weather (Open-Meteo API), News Reader, Wikipedia Explorer, GitHub Trending, RSS Aggregator |
| Productivity | 50+ | Pomodoro Timer, Calendar, Kanban Board, Clipboard Manager, Focus Timer |
| Data | 40+ | Spreadsheet, JSON Formatter, Hash Calculator, Base64 Toolkit, Unit Converter |
| Multimedia | 30+ | Paint, Music Studio, Video Player, Ambient Sound, Batch Image Processor |
| Games | 20+ | Snake, Tetris, 2048, Breakout, Memory Match |
| Network | 20+ | DNS Lookup, IP Info, Speed Test, Network Diagnostics, WebSocket Client, HTTP Toolkit |
| Office | 20+ | Markdown Cheat Sheet, Slide Forge, Book Finder, Daily Dashboard |

All apps use real public APIs for live data -- no mock or placeholder content.

---

## API Integrations

WebLinuxOS integrates with **25+ public APIs** for real-time data:

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
│   │   │   └── desktop/       # Desktop, WindowManager, Window, Taskbar
│   │   ├── store/             # Zustand state + IndexedDB + file utils
│   │   ├── services/          # Sync, clipboard, AI, API services
│   │   ├── styles/            # CSS themes (cyberpunk, quantum, etc.)
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

## Architecture

### Window Management

The `WindowManager` component handles 700+ applications through a component map with lazy loading. Components are loaded on demand with a 30-second timeout, automatic retry (2 attempts), and error fallback. An LRU cache (100 entries) prevents re-loading recently used components. Critical apps (Terminal, File Manager, Settings) are preloaded during idle time via `requestIdleCallback`.

### State Management

Zustand manages the entire application state in a single store: window positions, file system tree, theme preferences, notifications, and system statistics. State changes trigger targeted re-renders through selector-based subscriptions, keeping the UI responsive even with hundreds of registered apps.

### Storage Architecture

A three-tier storage system ensures data persistence:

1. **IndexedDB** -- primary storage for file trees, bypassing the 5MB localStorage limit
2. **localStorage** -- quick access for settings, theme, and small state
3. **Memory fallback** -- when both are unavailable (private browsing, quota exceeded)

A `beforeunload` handler flushes pending writes before the page closes. Automatic migration moves legacy localStorage data to IndexedDB on first load.

### Performance

- React.memo on all core components (Desktop, Taskbar, Window, WindowManager)
- useMemo/useCallback throughout to prevent unnecessary re-renders
- Vite manual chunk splitting: vendor libraries, terminal commands, large apps each get separate chunks; apps-misc reduced from 9.5MB to 1.2MB
- Particle animations rendered via Canvas 2D API, bypassing React reconciliation entirely
- CSS class-based window dragging instead of direct DOM style manipulation
- Prefix-indexed app search for O(1) lookup among 700+ apps
- Debounced storage writes (300ms) prevent I/O thrashing
- DOM node count cached for 60 seconds to avoid repeated tree traversal

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

## License

[MIT](LICENSE) -- Copyright (c) 2024 Saya Ch
