# WebLinuxOS

A fully functional Linux desktop environment that runs entirely in your browser. Featuring window management, a virtual file system, terminal emulator, 700+ applications, and real API integrations -- no backend required.

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)**

[![Deploy](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Highlights

- **Complete Desktop Environment** -- drag, resize, snap windows; up to 9 virtual desktops; deep/light themes with 8 accent colors and dynamic wallpapers
- **Terminal Emulator** -- 200+ commands with pipe, redirect, Tab completion, and alias support
- **Virtual File System** -- IndexedDB-backed, persists across sessions, supports file/folder CRUD operations
- **700+ Applications** -- developer tools, AI assistants, data dashboards, productivity apps, games, and more
- **Real API Integrations** -- all data comes from public APIs, not mock data
- **PWA Support** -- installable, works offline via Service Worker
- **Cross-Tab Sync** -- BroadcastChannel keeps theme, files, and settings in sync across browser tabs

## Features

### Desktop Environment

| Feature | Description |
|---------|-------------|
| Window Management | Drag, resize, minimize/maximize, edge snap, quadrant tiling |
| Virtual Desktops | Up to 9 independent workspaces, cross-desktop window migration |
| Themes | Dark/light mode, 8 accent colors, animated wallpapers (aurora, particles, waves, nebula) |
| Global Search | Ctrl+Shift+K launches any app instantly |
| Keyboard Shortcuts | 25+ shortcuts, fully customizable |
| Start Menu | Categorized app launcher with search |

### Terminal

| Feature | Description |
|---------|-------------|
| Command System | 200+ built-in commands across 10+ categories |
| Pipes & Redirects | `ls \| grep txt > output.txt` style pipelines |
| Tab Completion | Auto-complete commands, files, and arguments |
| Aliases | Custom command shortcuts with persistent storage |
| JS Execution | Run JavaScript expressions directly in the terminal |

### Built-in Applications

| Category | Apps |
|----------|------|
| System | File Manager, Terminal, System Settings, System Health Monitor, DevInfo Dashboard |
| Development | Code Editor (Monaco), Web IDE, API Debugger, Browser Fingerprint, Storage Inspector |
| AI | AI Chat, AI Image Generation, Code Review, Prompt Engineering Lab |
| Internet | Weather, News, Wikipedia, GitHub Trends, Global Intelligence Center |
| Productivity | Markdown Editor, Calendar, Kanban Board, Pomodoro Timer, Habit Tracker |
| Multimedia | Paint, Music Studio, Video Player, Ambient Sound Player |
| Data | Spreadsheet, JSON Tools, Encoding, Regex Visualizer, Hash Calculator |
| Games | Snake, Tetris, 2048, Breakout |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 |
| Language | TypeScript 6 |
| Build Tool | Vite 8 |
| State Management | Zustand 5 |
| Code Editor | Monaco Editor 4.7 |
| Python Runtime | Pyodide 0.26 |
| Persistent Storage | IndexedDB |
| PWA | Service Worker + Web App Manifest |

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

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # TypeScript check + production build
npm run typecheck    # Type checking only
npm run lint         # ESLint code analysis
npm run format       # Format code with Prettier
```

## API Integrations

All data comes from free public APIs:

| API | Purpose |
|-----|---------|
| Open-Meteo | Global weather forecasts |
| Pollinations.ai | AI chat and image generation |
| CoinGecko | Cryptocurrency prices |
| Hacker News | Tech news and trending topics |
| Wikipedia | Encyclopedia articles |
| GitHub API | Repository exploration |
| Frankfurter | ECB exchange rates |
| Free Dictionary | English dictionary definitions |
| MyMemory | Multi-language translation |
| NASA APOD | Daily astronomy pictures |
| Cloudflare DoH | DNS resolution |
| TheMealDB | Recipe search and details |
| Datamuse | Word relationships and synonyms |
| ZenQuotes | Motivational quotes |
| Web Crypto API | Hashing and encryption |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd+Shift+K | Global search |
| Ctrl/Cmd+T | Open terminal |
| Ctrl/Cmd+E | File manager |
| Ctrl/Cmd+B | Web browser |
| Ctrl/Cmd+Shift+P | Command palette |
| Ctrl/Cmd+Space | AI command center |
| Alt+N | Quick note |
| Ctrl/Cmd+Q | Close current window |
| Ctrl/Cmd+M | Minimize window |
| Ctrl/Cmd+/ | Keyboard shortcuts panel |
| Ctrl/Cmd+Alt+1-9 | Switch virtual desktop |
| Ctrl/Cmd+Shift+Arrow | Move window to another desktop |
| F11 | Maximize/restore window |

## Project Structure

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # Application components (700+)
│   │   │   ├── terminal/      # Terminal command system (20+ modules)
│   │   │   ├── collab/        # Collaboration applications
│   │   │   ├── algorithms/    # Algorithm visualizations
│   │   │   └── *.tsx          # Individual app components
│   │   ├── components/        # Core UI components
│   │   │   └── desktop/       # Desktop, window manager, taskbar
│   │   ├── store/             # Zustand state + IndexedDB storage
│   │   ├── services/          # API services and sync
│   │   ├── styles/            # CSS themes and styles
│   │   └── utils/             # Utility functions
│   ├── public/                # PWA resources (sw.js, manifest.json)
│   └── vite.config.ts         # Build configuration
├── .github/workflows/         # CI/CD (GitHub Actions)
├── dist/                      # Build output
└── README.md
```

## Browser Compatibility

| Browser | Minimum Version |
|---------|----------------|
| Chrome | 90+ |
| Firefox | 90+ |
| Safari | 15+ |
| Edge | 90+ |

## Contributing

Contributions are welcome. Please read the existing code structure before making changes.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run `npm run typecheck` and `npm run lint` to verify
5. Commit with a clear message following [Conventional Commits](https://www.conventionalcommits.org/)
6. Push and create a Pull Request

### Adding a New Application

1. Create a `.tsx` component in `src/apps/`
2. Register it in `src/apps.tsx` within the `APP_REGISTRY_EXTRAS` array
3. Add a lazy import in `src/components/desktop/WindowManager.tsx` component map

## License

[MIT](LICENSE) -- Copyright (c) 2024-2026 [saya-ch](https://github.com/saya-ch)
