# WebLinuxOS

A full Linux desktop environment running entirely in the browser. No installation required, no backend dependencies, zero API keys needed.

**[Try it online](https://saya-ch.github.io/WebLinuxOS/)** · [Report issues](https://github.com/saya-ch/WebLinuxOS/issues) · [Feature requests](https://github.com/saya-ch/WebLinuxOS/issues)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178c6.svg)](https://www.typescriptlang.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5-000000.svg)](https://zustand-demo.pmnd.rs)

---

## Overview

WebLinuxOS brings a complete Linux desktop experience to your browser. Built with modern web technologies, it runs 100% client-side, offering productivity tools, development utilities, and entertainment apps — all without leaving your browser.

![WebLinuxOS Desktop](web-linux/screenshots/01-desktop.png)

## Features

### Core Desktop

- **Window Management**: Drag, resize, minimize, maximize, and snap windows to edges
- **Virtual Desktops**: Up to 9 workspaces with keyboard shortcut navigation
- **Taskbar**: Real-time window management with thumbnail previews
- **File System**: Persistent virtual file system with undo/redo support
- **Dynamic Wallpapers**: Interactive particle, wave, nebula, and aurora effects
- **Notification System**: Priority-based alerts with dismissible notifications

### Terminal

A fully functional terminal with **200+ commands**:

- File operations: `ls`, `cd`, `cat`, `mkdir`, `rm`, `cp`, `mv`
- System tools: `top`, `ps`, `df`, `free`, `uptime`, `whoami`, `date`, `uname`
- Network utilities: `ping`, `curl`, `wget`, `netstat`, `dig`, `traceroute`
- Real-time APIs: `weather`, `news`, `crypto`, `github`, `stock`, `nasa`
- Python runtime: Execute Python 3 code directly via Pyodide
- Developer tools: `wikipedia`, `npm`, `pypi`, `github-user`, `uuidgen`, `jwt-decode`, `url-shortener`
- Utilities: `converter`, `date-diff`, `birthday`, `bmi`, `base64-encode`, `html-encode`, `color-convert`, `qrcode-generate`
- Advanced features: Pipes, redirects, background processes, tab completion, history

### Productivity Suite

- Code editors with syntax highlighting for 30+ languages
- Markdown editor with live preview and HTML export
- Spreadsheet with formulas and charts
- Calendar with event management and reminders
- Task management with kanban boards and project planning
- Pomodoro timer with focus sessions and statistics
- Habit tracker with streak counting

### Development Tools

- WebIDE Pro with code completion
- Online code runner supporting JavaScript, TypeScript, and Python
- API tester and REST client
- JSON formatter and schema validator
- JWT decoder
- Regex builder and tester
- Code formatter and diff viewer
- HTTP status code reference
- Developer Toolbox: All-in-one toolkit with JSON tools, regex tester, code formatter, hash calculator, and encoding utilities

### Real-Time API Integration

All integrations use free public endpoints, no API keys required:

| Category | Services |
|----------|----------|
| Weather | Global weather and forecasts (Open-Meteo) |
| News | Hacker News trending articles |
| Finance | Cryptocurrency prices and exchange rates |
| Development | GitHub repositories and trending |
| Knowledge | Wikipedia articles |
| Translation | Multi-language translation |
| Astronomy | ISS location, astronauts, SpaceX launches, NASA APOD |
| Entertainment | Pokemon information, random jokes and quotes |

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Running locally

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

Open your browser and navigate to `http://localhost:5173/WebLinuxOS/`.

### Building for production

```bash
npm run build
```

The build output is in `web-linux/dist/` and can be deployed to any static hosting service.

### Environment variables (optional)

Create a `.env` file in `web-linux/` for enhanced features:

```env
VITE_OPENWEATHERMAP_API_KEY=your_key
VITE_NEWSAPI_KEY=your_key
VITE_EXCHANGERATE_API_KEY=your_key
VITE_NASA_API_KEY=your_key
```

All core functionality works without API keys.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + Space` | Open smart command center |
| `Ctrl/⌘ + Shift + L` | Open app launcher |
| `Ctrl + Shift + T` | Open terminal |
| `Ctrl + E` | Open file manager |
| `Ctrl + ,` | Open settings |
| `Ctrl + K` | Global search |
| `Ctrl + P` | Command palette |
| `Ctrl + Q` | Close focused window |
| `Ctrl + M` | Minimize focused window |
| `Alt + Tab` | Switch windows |
| `Ctrl + 1-9` | Switch to desktop N |
| `F11` | Toggle fullscreen |

Terminal shortcuts: `Ctrl+L` clear · `Ctrl+C` interrupt · `Ctrl+R` reverse search · `Tab` autocomplete

## Technology Stack

| Layer | Technology |
|-------|------------|
| UI Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| State Management | Zustand 5 |
| Python Runtime | Pyodide 0.26 |
| Icons | Lucide React |
| Storage | localStorage |

## Project Structure

```
WebLinuxOS/
└── web-linux/
    ├── src/
    │   ├── App.tsx                 # Root component with keyboard shortcuts
    │   ├── apps.tsx                # Application registry (240+ apps)
    │   ├── store.tsx               # Zustand global state
    │   ├── types.ts                # TypeScript type definitions
    │   ├── icons.tsx               # Icon components
    │   ├── components/
    │   │   ├── desktop/            # Window manager, taskbar, desktop
    │   │   ├── CommandPalette.tsx
    │   │   ├── NotificationSystem.tsx
    │   │   └── ...
    │   ├── apps/                   # Application implementations
    │   │   ├── terminal/           # Terminal emulator and commands
    │   │   ├── CodeEditor.tsx
    │   │   ├── FileManager.tsx
    │   │   └── ...
    │   ├── services/               # API clients
    │   ├── store/                  # Virtual file system and persistence
    │   ├── utils/                  # Utility functions
    │   └── styles/                 # Theme stylesheets
    ├── screenshots/                # Project screenshots
    ├── index.html
    ├── vite.config.ts
    └── package.json
```

## Deployment

### GitHub Pages (Automatic)

Push to the `main` branch — GitHub Actions will automatically build and deploy.

### Static Hosting

Upload `web-linux/dist/` to any static hosting service: Vercel, Netlify, Cloudflare Pages, S3, nginx, or similar.

## Contributing

Contributions are welcome. Follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Verify: `npm run typecheck && npm run build`
5. Submit a Pull Request

### Adding a new application

1. Create a component in `web-linux/src/apps/`
2. Register it in `web-linux/src/apps.tsx`
3. Add lazy loading import in `web-linux/src/components/desktop/WindowManager.tsx`

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| Edge | 90+ |

## License

[MIT](LICENSE) — Free to use, modify, and distribute, including for commercial purposes.

## Acknowledgments

- Window manager, terminal, and virtual file system are original implementations
- Inspired by [linux.js](https://github.com/hrtowii/linux.js) and [WebSH](https://github.com/nicedoc/web-sh)

---

**[Try it online](https://saya-ch.github.io/WebLinuxOS/)**