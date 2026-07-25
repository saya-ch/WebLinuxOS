<div align="center">

# WebLinuxOS

### A complete Linux desktop environment running in the browser — real tools, real work, zero installation.

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Documentation](https://github.com/saya-ch/WebLinuxOS/wiki) · [Changelog](CHANGELOG.md) · [Report Bug](https://github.com/saya-ch/WebLinuxOS/issues) · [Request Feature](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge&logo=github&color=yellow)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=for-the-badge&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v53.0.0-blue?style=for-the-badge)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?style=for-the-badge&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)

---

</div>

## Overview

WebLinuxOS is a full-featured Linux desktop environment that runs entirely in your browser. Unlike OS simulators that only look the part, every application here delivers real functionality — the terminal executes actual commands, the code editor writes real code, the API testing tool makes genuine network requests, and privacy tools detect real sensitive information locally.

With **350+ built-in applications** spanning development, productivity, networking, media, system tools, and games, WebLinuxOS transforms any device with a browser into a complete workstation. Whether you're on an iPad, Chromebook, or a locked-down corporate machine, your entire workflow is just a URL away.

Built with React 19 and TypeScript, it features a polished windowing system with virtual desktops, multiple themes (Cyberpunk, Quantum, Glass Morphism, Classic Light), smooth GPU-accelerated animations, and a boot animation that makes every startup feel like an event. The terminal supports Unix-style pipes, output redirection, and multi-command execution. Browser-native APIs power real functionality: Web Speech for text-to-speech, getDisplayMedia for screen recording, Web Crypto for cryptographic hashing, and Web Serial for hardware debugging.

## Why WebLinuxOS?

- **Zero setup** — open the URL and start working instantly
- **Privacy first** — all data stays in your browser's localStorage
- **Works anywhere** — iPad, Chromebook, school computers, old laptops
- **Real functionality** — not a demo or simulator, these tools actually work
- **Always up to date** — no installations, no updates, just refresh the page

## Core Features

### ⚡ Innovation & Productivity (v53)

WebLinuxOS evolves beyond simulation into a real productivity platform:

- **InfoPulse 信息脉搏中心** — A revolutionary real-time information aggregation hub. Features a card-based layout with tech news, weather monitoring, system health scoring (with animated ring visualization), world clocks across 6 timezones, GitHub trending repositories, and cryptocurrency market data. Auto-refreshes every minute with manual refresh support. Glass morphism design with cyberpunk aesthetics. Type `infopulse` in the terminal for quick access.

### 🛡️ Reliability & Quality (v52)

A focused iteration on stability and correctness — every fix below addresses a real defect that affected daily use:

- **Code Runner apps now actually run code** — CSP `script-src` now includes `'unsafe-eval'`, unblocking Monaco Editor, CodeRunner, OnlineCompiler, WebIDE and 10+ other in-browser code execution apps that previously failed silently with `EvalError`.
- **No more "infinite recursion → browser tab crash"** — `WindowManager.loadComponent`'s retry path now reads the latest retry count from the module-level map on every recursion instead of capturing it in a stale closure, so a perpetually failing module no longer blows the stack.
- **No more listener leaks across StrictMode / remounts** — `preloadComponents` now returns a cleanup function and the `useEffect` honors it; the `visibilitychange` listener is properly removed on unmount. The same pattern was applied to all three `setTimeout(addEventListener)` call sites in `Taskbar.tsx`.
- **Storage truncation no longer writes a *larger* object** — `debouncedSaveToStorage` previously produced a "truncated" placeholder by spreading the original (huge) value, almost guaranteeing `QuotaExceededError`. It now writes a minimal `{_truncated, _originalSize, _truncatedAt}` placeholder, keeping state consistent when the user exceeds the localStorage budget.
- **Service Worker path is no longer hardcoded** — `registerServiceWorker` now uses `import.meta.env.BASE_URL + 'sw.js'`, so PWA still works when deploying to a custom path or root domain.
- **No more duplicate shortcut triggers** — `Ctrl+K`, `Ctrl+P`, `Ctrl+Space` were handled inline in `handleKeyDown` *and* re-listed in `systemShortcuts`, making the table pure dead code. The duplicate entries were removed; behavior is unchanged but maintainers can no longer desync the two paths.
- **App registration is now O(n) instead of O(n²)** — `registerApps(apps[])` performs a single `set()` with a `Set`-based diff. With 350+ apps in the registry this noticeably shortens first-paint blocking time.
- **Duplicate app names disambiguated** — "剪贴板历史" and "AI 聊天助手" each had two registry entries with identical display names. The legacy entries are now suffixed `（基础版）` so users can tell them apart in the launcher.
- **Boot animation is skippable** — clicking or pressing any key during boot immediately dismisses the animation, and the version label now reflects the real `package.json` version instead of a hardcoded `v2.0`.

### 🖥️ Desktop & Window System

Multi-window environment with 4 virtual desktops, draggable and resizable windows, minimize/maximize controls, taskbar, start menu, command palette (Ctrl+P), global search (Ctrl+K), and Quick Action Center (Ctrl+A) for system monitoring and quick settings access. Smooth GPU-accelerated animations and transitions with multiple built-in themes.

### 📊 System Monitoring & Quick Actions

Real-time system statistics displayed in the Quick Action Center (Ctrl+A):

- CPU, Memory, and Storage usage with visual progress bars
- Network status monitoring (online/offline detection)
- System uptime tracking
- One-click theme switching (dark/light)
- Live wallpaper toggle
- Quick access to Terminal, Settings, System Monitor
- System reset and lock screen options

### 🚀 Innovative Applications

Pushing the boundaries of what a web OS can do:

- **Smart Workbench 智能工作台 (v52)** — Unified productivity hub designed to be your daily starting point. Features 8 one-tap quick tools (Terminal, Files, Browser, Calculator, Text Editor, Code Editor, Weather, Settings), real-time system status monitoring (CPU/memory/network/storage), built-in Pomodoro focus timer with session tracking, 6 application categories with 36+ curated apps, and motivational quotes that rotate every 30 minutes. Glass morphism design with staggered entrance animations and smooth hover interactions. Type `workbench` in the terminal for a quick guide.
- **BookFinder 书海检索 (v50)** — A real book discovery tool powered by the Open Library public API (no API key required). Search millions of titles by name, author, or subject; browse cover thumbnails, ratings, ISBN, and page counts; open a detail drawer with full work metadata and subject tags; save favorites to localStorage with one click. Editorial/magazine aesthetic with Fraunces serif display type, paper-tone palette, and staggered card reveals. Graceful network-error handling and loading skeletons throughout.
- **Global Insights 全球洞察 (v49)** — One-stop global information aggregator that integrates 8 real public APIs: World News (NewsAPI), Countries Encyclopedia (REST Countries), Daily Quotes (Quotable), Jokes (Official Joke API), Random User Generator (RandomUser.me), NASA Astronomy Picture of the Day, Currency Exchange Rates (Open Exchange Rates), and GitHub Trending Repositories. All data is real, not simulated. Features include local cache (10 min TTL), source tab navigation, full-text search for news and countries, country detail modal with capital/population/languages/timezones/borders, real-time sync indicator, and graceful error handling.
- **Real-Time System Monitor (v48)** — Live system metrics using real browser APIs: JavaScript heap memory, network status (type/speed/latency), FPS measurement, page performance timing, local storage usage, and CPU core count. All data is real, not simulated.
- **Clipboard History Manager (v48)** — Persistent clipboard history with search, filtering, favorites, and local storage. Save up to 100 entries with automatic deduplication and timestamp tracking.
- **Real-Time Code Collaboration** — Multi-language collaborative coding platform with real-time cursor tracking, JavaScript execution, session sharing, and support for 9 programming languages (JavaScript, TypeScript, Python, Java, C++, Go, Rust, HTML, CSS)
- **AI Code Analyzer Pro** — Intelligent code quality analyzer with complexity assessment, duplicate code detection, magic number identification, long line warnings, and actionable improvement suggestions for 7 languages
- **DevPortal** — Unified developer toolbox with 7 categories: dashboard, code tools, text tools, color tools, time tools, network tools, and data visualization
- **FlowBoard** — Visual workflow builder with drag-and-drop nodes for conditions, API calls, data processing, delays, and notifications. Includes preset templates for common automation patterns
- **NeoTerminal** — Next-generation terminal with tabbed interface, AI commands, bookmarks, code snippets, and 4 themes (Dark, Light, Cyberpunk, Matrix)
- **KnowledgeVine** — Knowledge garden with tree/mindmap/list/card views. Notes grow through stages (Seed → Sprout → Growing → Mature) based on engagement
- **AudioViz** — Real-time audio visualizer with 5 visualization types (bars, wave, circle, particles, pulse), 5 themes, and support for microphone, file, demo, and system audio sources
- **PulseBoard** — Customizable real-time dashboard with system metrics, weather, news, cryptocurrency prices, world clock, and more
- **Voice Synth 语音合成阅读器 (v51)** — Text-to-speech reader powered by the Web Speech API. Select from all available browser voices, control speed/pitch/volume with sliders, and follow along with real-time word highlighting and progress tracking. Full Chinese and English support
- **Screen Capture 屏幕录制 (v51)** — Screen recording tool using getDisplayMedia + MediaRecorder. Choose recording format (WebM/WebM VP9), pause/resume recording, preview playback after completion, and auto-download. Live recording indicator with elapsed time counter
- **File Hash Calculator 文件哈希计算器 (v51)** — Cryptographic hash calculator powered by the Web Crypto API. Drag-and-drop files or paste text, compute SHA-1/SHA-256/SHA-384/SHA-512 simultaneously, one-click copy of results, and hash comparison mode to verify integrity
- **Web Serial Terminal (v51)** — Hardware debugging terminal using the Web Serial API. Configure baud rate (9600-921600), data bits, stop bits, and parity; switch between HEX and ASCII display modes; real-time TX/RX with timestamp and color coding. Requires Chrome/Edge with Experimental Web Platform Features enabled

### 💻 Development Tools

Professional-grade development environment in your browser:

- Terminal with **90+ commands** — file system browsing, text processing, network diagnostics, Cron simulation, Git simulation, Unix pipes (`|`), output redirection (`>` / `>>`), multi-command (`;`), hash tools (sha256sum, md5sum, sha512sum), command aliasing, and productivity tools (Pomodoro timer, weather CLI, scientific calculator, password generator, UUID generator, Base64, color info, system info)
- Code editor powered by Monaco Editor with syntax highlighting, multi-language support, and auto-completion
- Markdown editor with real-time bidirectional preview, tables, formulas, code blocks, and HTML export
- API Testing Tool with real API calls, preset templates, request history, and favorites
- DevLab — 12+ tools including JSON formatter, Base64 encoder/decoder, hash generator, UUID generator, password generator, and more

### 📊 Productivity & Organization

- **Smart Dashboard** — All-in-one dashboard with weather, system monitoring, quick tools, daily quotes, and todo list
- **JSONForge** — Format, compress, convert YAML/CSV, validate schema, and diff JSON
- **CronLab** — Visual Cron expression builder with next 5 execution predictions
- **PrivacyGuard** — Local PII detection for 17 categories of sensitive information
- **WorldPulse** — Global weather, exchange rates, earthquakes, and news aggregation

### 🌐 Network & Online Services

- **BookFinder** — Real-time book search via Open Library API: title/author/subject queries, cover thumbnails, ratings, ISBN, detail drawer, and local favorites
- **Network Toolkit Pro** — IP lookup, DNS lookup, URL encode/decode, network monitoring, HTTP status reference, port scanner
- Weather, news, cryptocurrency, exchange rates, IP info, translation, dictionary
- Wikipedia search, space news, NASA APOD, Pokemon database, Star Wars database
- DuckDuckGo search integration

### 🔒 Privacy First

All local data is stored in your browser's localStorage. Nothing is uploaded to any server unless you explicitly enable online APIs (like WorldPulse or WebSnapshot). All other applications run completely offline.

### 🎮 Games & Entertainment

Classic games including 2048, Snake, Tetris, Breakout, Memory, and more — all playable directly in the browser.

## Application Categories

| Category | Apps | Highlights |
|----------|------|------------|
| **Development** | 50+ | DevPortal, FlowBoard, NeoTerminal, Code Editor, API Tester, DevLab, Markdown Editor |
| **Productivity** | 40+ | PulseBoard, KnowledgeVine, Smart Dashboard, JSONForge, CronLab, Todo, Calendar |
| **System Tools** | 30+ | File Manager, System Monitor, Performance Dashboard, Settings, Terminal |
| **Network** | 25+ | BookFinder, Network Toolkit Pro, Web Browser, WorldPulse, Weather, News, IP Lookup |
| **Media & Creative** | 20+ | AudioViz, Music Player, Image Viewer, Paint, Whiteboard, Camera |
| **Utilities** | 40+ | **Smart Workbench**, PrivacyGuard, DevShortcuts, Password Generator, Hash Tools, Unit Converter, Real System Monitor, Clipboard History |
| **Games** | 10+ | 2048, Snake, Tetris, Breakout, Memory, Virtual Pet |
| **AI Tools** | 20+ | AI Assistant, Code Assistant, Prompt Library, AI Workbench, AI Learning |

Complete application list available in the [App Store](https://saya-ch.github.io/WebLinuxOS/) within the system.

## Technology Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: CSS Variables + Theme System (no Tailwind)
- **UI Icons**: [Lucide React](https://lucide.dev/)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Markdown**: [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify)
- **Python Runtime**: [Pyodide](https://pyodide.org/) (optional application)
- **Deployment**: GitHub Pages + GitHub Actions

## Quick Start

### Try Online

No installation required — open in your browser:

👉 **[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)**

### Local Development

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to the project
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:5173`.

### Build for Production

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
WebLinuxOS/
├── web-linux/                  # Main application source
│   ├── src/
│   │   ├── apps/               # 240+ application implementations
│   │   │   ├── SmartWorkbench.tsx # Unified productivity hub (Pomodoro + system stats + app navigation)
│   │   │   ├── DevPortal.tsx   # Unified developer toolbox
│   │   │   ├── FlowBoard.tsx   # Visual workflow builder
│   │   │   ├── NeoTerminal.tsx # Next-gen terminal
│   │   │   ├── KnowledgeVine.tsx # Knowledge garden
│   │   │   ├── AudioViz.tsx    # Audio visualizer
│   │   │   ├── PulseBoard.tsx  # Real-time dashboard
│   │   │   └── terminal/       # Terminal command system (90+ commands)
│   │   │       ├── index.ts    # Command registry
│   │   │       ├── workbenchCommands.ts # Workbench & utility commands
│   │   │       ├── powerCommands.ts
│   │   │       └── ...
│   │   ├── components/         # Core UI components
│   │   │   └── desktop/        # Desktop, windows, taskbar, start menu
│   │   ├── store/              # Zustand state management
│   │   ├── styles/             # Theme system and global styles
│   │   ├── utils/              # Utility functions
│   │   ├── services/           # API and service layer
│   │   ├── config/             # Configuration files
│   │   └── types/              # TypeScript type definitions
│   ├── public/                 # Static assets
│   └── vite.config.ts          # Vite configuration
├── .github/
│   └── workflows/              # GitHub Actions (auto-deployment)
├── docs/                       # Documentation
├── CHANGELOG.md                # Release notes
├── CONTRIBUTING.md             # Contributing guide
├── LICENSE                     # MIT License
└── README.md                   # This file
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + T` | Open terminal |
| `Ctrl/Cmd + E` | Open file manager |
| `Ctrl/Cmd + B` | Open browser |
| `Ctrl/Cmd + K` | Global search |
| `Ctrl/Cmd + P` | Command palette |
| `Ctrl/Cmd + Space` | Smart command center |
| `Ctrl/Cmd + Q` | Close window |
| `Ctrl/Cmd + M` | Minimize window |
| `Ctrl/Cmd + A` | Quick action center |
| `Alt + Tab` | Switch windows |
| `Ctrl + Alt + [1-9]` | Switch virtual desktops |
| `PrintScreen` | Take screenshot |

## Contributing

Contributions are welcome and appreciated! Whether it's bug fixes, new features, documentation improvements, or new applications — every contribution matters.

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Adding a New Application

1. Create your app component in `web-linux/src/apps/`
2. Register it in `apps.tsx`
3. Add the lazy loading entry in `WindowManager.tsx`
4. Test thoroughly and submit a PR

For more detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

- [x] **PWA Support** — Service Worker registration with auto-update and offline detection
- [x] **Browser-Native Tools** — Web Speech API, getDisplayMedia, Web Crypto, Web Serial integration
- [x] **Terminal Enhancements** — Pipes, redirection, multi-command, hash tools, aliasing
- [x] **Smart Workbench** — Unified productivity hub with Pomodoro timer, system stats, and curated app navigation
- [x] **BookFinder** — Real book search via Open Library public API with cover thumbnails and favorites
- [ ] **File Sync** — Cross-device file system sync via WebDAV / GitHub Gist
- [ ] **Collaboration Mode** — CRDT-based multi-user shared workspace
- [ ] **Mobile Optimization** — Touch-friendly interface for phones and tablets
- [ ] **Plugin System** — Third-party application hot-loading
- [ ] **More AI Integrations** — Enhanced AI-powered tools across the system

See the [open issues](https://github.com/saya-ch/WebLinuxOS/issues) for a full list of proposed features and known issues.

## License

This project is open source under the MIT License. See [LICENSE](LICENSE) for more information.

## Acknowledgements

Special thanks to these amazing open-source projects that make WebLinuxOS possible:

- [Lucide](https://lucide.dev/) — Beautiful, consistent icon library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — The code editor that powers VS Code
- [Pyodide](https://pyodide.org/) — Python runtime for the browser
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [Vite](https://vitejs.dev/) — Next-generation frontend build tool
- [microlink.io](https://microlink.io/) — Web page metadata scraping

And to every contributor and user — thank you for making this project better.

---

<div align="center">

If this project helps you, please consider giving it a ⭐ star. It means a lot!

Made with ❤️ by the WebLinuxOS community

</div>
