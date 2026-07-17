<div align="center">

# WebLinuxOS

A complete Linux desktop environment that runs entirely in your browser. No installation. No backend. No configuration.

[**Live Demo**](https://saya-ch.github.io/WebLinuxOS/) · [Report Bug](https://github.com/saya-ch/WebLinuxOS/issues) · [Request Feature](https://github.com/saya-ch/WebLinuxOS/issues)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6.svg)](https://www.typescriptlang.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5-000000.svg)](https://zustand-demo.pmnd.rs)

</div>

<p align="center">
  <img src="web-linux/screenshots/01-desktop.png" alt="WebLinuxOS Desktop" width="800" />
</p>

<p align="center">
  <img src="web-linux/screenshots/04-terminal.png" alt="Terminal" width="395" />
  <img src="web-linux/screenshots/03-file-manager.png" alt="File Manager" width="395" />
</p>

## Why WebLinuxOS?

WebLinuxOS delivers a full-featured Linux desktop experience inside a single browser tab. Everything runs 100% client-side:

- **240+ built-in applications** — from productivity tools to creative suites
- **150+ terminal commands** — file operations, networking, system monitoring, real-time APIs
- **Virtual filesystem** — persistent storage with undo/redo support
- **Real-time API integrations** — weather, news, cryptocurrency, GitHub, translation, and more
- **Python runtime** — run Python 3 directly in the terminal via Pyodide
- **No installation** — works instantly in any modern browser
- **No backend** — zero server costs, fully self-contained
- **No API keys required** — all core features work out-of-the-box

---

## Features

### Window Management

- Drag, resize, minimize, maximize, and snap windows with alignment guides
- Multi-monitor-style tiling and window stacking
- Up to 9 virtual desktops with keyboard shortcuts to switch
- Taskbar, dock, and system tray with live indicators
- Window grouping and keyboard navigation (`Alt+Tab`)
- Custom window animations and smooth transitions

### Virtual Filesystem

- Create, delete, rename, copy, and move files and folders
- Undo/redo support for all file operations
- Persisted in localStorage with hierarchical JSON structure
- Full path resolution, permissions, and directory navigation
- File search and quick access to recent files
- File type detection and icon association

### Terminal Emulator

- **150+ built-in commands** across file operations, networking, system monitoring, and utilities
- **Pipe (`|`)**, redirect (`>` `>>` `<`), and chain (`;` `&&` `||`) operators
- **Background processes** (`&`), `jobs`, `kill`
- **Tab completion**, command history, reverse search (`Ctrl+R`)
- **Python runtime** via Pyodide — run Python 3 directly in the terminal
- **Real-time commands**: `weather`, `news`, `crypto`, `github`, `calendar`, `battery`, `cpu`, `neofetch`
- **Network commands**: `ping`, `traceroute`, `dig`, `curl`, `wget`, `netstat`
- **System commands**: `top`, `ps`, `df`, `free`, `uptime`, `whoami`, `date`

### Real-Time API Integrations

All integrations work out-of-the-box using free public endpoints. No API keys required.

| Category | Services | API |
|----------|----------|-----|
| Weather | Global weather, forecasts | Open-Meteo |
| News | Hacker News top stories | Hacker News API |
| Finance | Cryptocurrency, exchange rates | CoinGecko, Frankfurter |
| Development | GitHub repositories | GitHub REST API |
| Geography | IP geolocation, country info | ipapi, REST Countries |
| Translation | Multi-language translation | MyMemory |
| Knowledge | Wikipedia articles | Wikipedia REST API |
| Utilities | Random quotes, jokes, advice | Quotable, JokeAPI, Advice Slip |

### Desktop Enhancements

- **Dynamic wallpaper system** — particle, network, wave, nebula effects
- **Desktop widgets** — clock, system pulse, weather, pomodoro, sticky notes
- **Notification system** — with priority levels and dismissible alerts
- **Command palette** — quick access to all applications and commands
- **Global search** — search files, apps, and settings
- **Light/dark theme** — with customizable accent colors
- **Startup splash screen** — with loading animation

### Web Browser (Enhanced)

- Built-in Wikipedia search (Chinese + English)
- Hacker News reader with 5 categories
- GitHub repository explorer
- Smart URL routing (`wiki:`, `hn:`, `gh:` prefixes)
- Tab system with bookmarks and history
- Built-in search engine

### Development Tools

- **Web IDE Pro** — full-featured online programming environment with code completion
- **Code Editor** — syntax highlighting for 30+ languages
- **Online Code Runner** — multi-language execution via Pyodide
- **Code Playground**, **CodeSandbox**, and **CodeStudio**
- **Code Formatter**, **Diff Viewer**, and **Code Reviewer**
- **CodeShare** — code snippet sharing with syntax highlighting, diff viewer, template library, and Markdown export
- **API Tester** and **REST Client** — test and debug APIs
- **Regex Builder**, **JSON Formatter**, and **JSON Schema Validator**
- **JWT Decoder** — decode and inspect JWT tokens
- **HTTP Status Explorer** — lookup HTTP status codes

### Productivity Suite

- **Markdown Editor** — live preview, slides, and HTML export
- **Spreadsheet** — formulas, charts, and data analysis
- **Calendar** — event management with reminders
- **World Clock** — multiple time zones
- **Task Manager** — Kanban Board, Project Planner, Gantt Chart
- **Pomodoro Timer** — focus sessions with statistics
- **Habit Tracker** — track daily habits and streaks
- **Smart Notes** — tags, colors, and import/export
- **Mind Map** — visual brainstorming
- **Presentation Creator** — slides with transitions

### Creative & Media

- **Paint** — basic drawing tools
- **DrawPad** — full drawing application with layers, shapes, text, export to PNG
- **Music Player** — audio playback with equalizer
- **Music Studio** — compose and edit music
- **Music Visualizer** — real-time audio visualization
- **Video Player** — HTML5 video playback
- **Image Viewer** — support for multiple formats
- **Screen Recorder** — record browser screen
- **Screenshot Tool** — capture and annotate screenshots

### System & Utilities

- **File Manager** — dual-pane navigation, search, and batch operations
- **System Monitor** — CPU, memory, and network usage
- **Process Manager** — view and manage running processes
- **Network Monitor** — real-time bandwidth usage
- **Speed Test** — measure internet speed
- **DNS Lookup** — domain name resolution
- **Calculator** — basic and scientific calculations
- **Password Manager** — secure password storage
- **QR Generator** — create QR codes for URLs and text
- **Color Picker** — hex, RGB, HSL values
- **Unit Converter** — currency, length, weight, temperature
- **Clipboard Manager** — clipboard history

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| State Management | Zustand 5 |
| Python Runtime | Pyodide 0.26 |
| Icons | Lucide React |
| Code Editor | Monaco Editor (via Pyodide) |
| Storage | localStorage |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

Output is in `web-linux/dist/`, deployable to any static host.

### Optional API Keys

Create a `.env` file in `web-linux/` for enhanced features:

```env
VITE_OPENWEATHERMAP_API_KEY=your_key
VITE_NEWSAPI_KEY=your_key
VITE_EXCHANGERATE_API_KEY=your_key
VITE_NASA_API_KEY=your_key
```

All core features work without API keys.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + Shift + L` | Open application launcher |
| `Ctrl + Shift + T` | Open terminal |
| `Ctrl + E` | Open file manager |
| `Ctrl + ,` | Open settings |
| `Ctrl + K` | Global search |
| `Ctrl + Shift + C` | Open calculator |
| `Ctrl + Q` | Close focused window |
| `Ctrl + M` | Minimize focused window |
| `Alt + Tab` | Cycle windows |
| `Ctrl + 1-9` | Switch to desktop N |
| `Ctrl + Shift + 1-9` | Move window to desktop N |
| `F11` | Toggle fullscreen |

**Terminal**: `Ctrl+L` clear · `Ctrl+C` interrupt · `Ctrl+R` reverse search · `Tab` autocomplete

---

## Project Structure

```
WebLinuxOS/
└── web-linux/
    ├── src/
    │   ├── App.tsx                 # Root component, keyboard shortcuts
    │   ├── apps.tsx                # Application registry (240+ apps)
    │   ├── store.tsx               # Zustand global store
    │   ├── types.ts                # TypeScript type definitions
    │   ├── icons.tsx               # Icon components
    │   ├── components/
    │   │   ├── desktop/            # Window manager, Taskbar, Dock, Desktop
    │   │   ├── CommandPalette.tsx
    │   │   ├── NotificationSystem.tsx
    │   │   └── ...
    │   ├── apps/                   # Application implementations
    │   │   ├── terminal/           # Terminal emulator and commands
    │   │   ├── CodeEditor.tsx
    │   │   ├── FileManager.tsx
    │   │   └── ...
    │   ├── services/               # API clients (aiService, apiService)
    │   ├── store/                  # Virtual filesystem, persistence utils
    │   ├── utils/                  # Helper functions
    │   └── styles/                 # Theme stylesheets
    ├── screenshots/                # Project screenshots
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

---

## Deployment

### GitHub Pages (Automated)

Push to `main` — GitHub Actions builds and deploys automatically.

### Static Hosting

Upload `web-linux/dist/` to any static host (Vercel, Netlify, Cloudflare Pages, S3, nginx).

---

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Verify: `npm run typecheck && npm run build`
5. Submit a pull request

**Adding a new application:**

1. Create component in `web-linux/src/apps/`
2. Register in `web-linux/src/apps.tsx`
3. Add lazy import in `web-linux/src/components/desktop/WindowManager.tsx`

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

---

## License

[MIT](LICENSE) — Free to use, modify, and distribute, including for commercial purposes.

## Acknowledgments

- Window manager, terminal, and virtual filesystem are original work
- Inspired by [linux.js](https://github.com/hrtowii/linux.js), [WebSH](https://github.com/nicedoc/web-sh)
- Wallpapers from Unsplash and Pexels (CC0)
