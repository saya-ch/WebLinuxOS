<div align="center">

# WebLinuxOS

A complete Linux desktop environment that runs entirely in your browser.

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Report Bug](https://github.com/saya-ch/WebLinuxOS/issues) · [Request Feature](https://github.com/saya-ch/WebLinuxOS/issues)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6.svg)](https://www.typescriptlang.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev)

</div>

<p align="center">
  <img src="web-linux/screenshots/01-desktop.png" alt="WebLinuxOS Desktop" width="800" />
</p>

## Why WebLinuxOS?

No installation. No backend. No configuration. WebLinuxOS delivers a full-featured Linux desktop experience inside a single browser tab — 240+ built-in applications, a working terminal with 150+ commands, a virtual filesystem, and real-time API integrations, all running 100% client-side.

---

## Features

### Window Management

- Drag, resize, minimize, maximize, and snap windows with alignment guides
- Multi-monitor-style tiling and window stacking
- Up to 9 virtual desktops with keyboard shortcuts to switch
- Taskbar, dock, and system tray with live indicators

### Virtual Filesystem

- Create, delete, rename, copy, and move files and folders
- Undo/redo support for all file operations
- Persisted in localStorage with hierarchical JSON structure
- Full path resolution, permissions, and directory navigation

### Terminal Emulator

- 150+ built-in commands across file operations, networking, system monitoring, and utilities
- Pipe (`|`), redirect (`>` `>>` `<`), and chain (`;` `&&` `||`) operators
- Background processes (`&`), `jobs`, `kill`
- Tab completion, command history, reverse search (`Ctrl+R`)
- Python runtime via Pyodide — run Python 3 directly in the terminal

### Real-Time API Integrations

| Service | API | Key Required |
|---------|-----|:------------:|
| Weather | Open-Meteo / OpenWeatherMap | No / Optional |
| News | Hacker News / NewsAPI | No / Optional |
| Cryptocurrency | CoinGecko | No |
| GitHub | GitHub REST API | No |
| Exchange Rates | Frankfurter | No |
| Wikipedia | Wikipedia REST API | No |
| Translation | LibreTranslate | No |
| IP Geolocation | ipapi | No |
| Astronomy | NASA APOD | Optional |
| Countries | REST Countries | No |

All integrations work out-of-the-box using free public endpoints. Optional API keys unlock enhanced rate limits and additional data.

### Web Browser (Enhanced)

- Built-in Wikipedia search (Chinese + English)
- Hacker News reader with 5 categories
- GitHub repository explorer
- Smart URL routing (`wiki:`, `hn:`, `gh:` prefixes)
- Tab system with bookmarks and history

### Development Tools

- Web IDE Pro — full-featured online programming environment
- Code Editor with syntax highlighting
- Online Code Runner (multi-language via Pyodide)
- Code Playground, Sandbox, and Studio
- Code Formatter, Diff Viewer, and Reviewer
- **CodeShare** — code snippet sharing with syntax highlighting, diff viewer, template library, and Markdown export
- API Tester and REST Client
- Regex Builder and JSON Formatter

### Productivity

- Markdown Editor with live preview and slides
- Spreadsheet, Calendar, and World Clock
- Task Manager, Kanban Board, and Project Planner
- Pomodoro Timer and Habit Tracker
- Smart Notes with tags, colors, and import/export
- Mind Map and Presentation Creator

### Creative & Media

- Paint and **DrawPad** — full drawing application with layers, shapes, text, export to PNG
- Music Player, Music Studio, and Visualizer
- Video Player and Image Viewer
- Screen Recorder and Screenshot Tool

### System & Utilities

- File Manager, System Monitor, and Process Manager
- Network Monitor, Speed Test, and DNS Lookup
- Calculator, Password Manager, and QR Generator
- Color Picker, Unit Converter, and Clipboard Manager

### Desktop Enhancements

- Dynamic wallpaper system (particle, network, wave, nebula effects)
- Desktop widgets (clock, system pulse, weather, pomodoro, sticky notes)
- Notification system with priority levels
- Command palette and global search
- Light/dark theme with customizable accent colors

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
