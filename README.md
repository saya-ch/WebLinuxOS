<div align="center">

# WebLinuxOS

**A fully functional Linux desktop environment that runs entirely in your browser.**

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) | [Report Issue](https://github.com/saya-ch/WebLinuxOS/issues) | [Contributing](CONTRIBUTING.md) | [Changelog](CHANGELOG.md)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=flat&logo=github)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=flat&color=blue)](LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/saya-ch/WebLinuxOS/deploy.yml?branch=main&style=flat&logo=github-actions)](https://github.com/saya-ch/WebLinuxOS/actions)

</div>

---

## Overview

Most "web desktop" projects are visual shells -- windows you can drag around, but nothing inside works. WebLinuxOS is different. Every application connects to real public APIs, executes real logic, and produces real output. No mock data. No placeholder UI.

- The **terminal** executes 200+ commands with a virtual filesystem
- The **code editor** uses Monaco (the same engine as VS Code)
- The **AI chat** connects to Pollinations.ai for real conversations
- The **weather app** pulls live forecasts from Open-Meteo
- The **browser** searches the web via DuckDuckGo
- The **system monitor** reads real Performance API data from your browser
- **600+ applications** across development, productivity, AI, internet, data, lifestyle, and more

## Features

### Desktop Environment

- Full window management -- drag, resize, minimize, maximize, snap, tile
- Up to 9 virtual desktops with independent wallpapers
- Taskbar, start menu, and command palette (`Ctrl/Cmd+Shift+P`)
- 30+ global keyboard shortcuts
- Animated aurora and particle wallpapers
- Cross-tab synchronization for themes and files
- PWA support with offline capabilities

### Application Highlights

| Category | Applications |
|----------|-------------|
| **Development** | Monaco code editor, terminal (200+ commands), JSON tools, regex tester, API client, Git visualizer, online code runner, code review bot, NebulaDev Pro (JWT/CORS/DNS/Web Crypto), AICommandPro (natural language to shell translation), ColorPaletteGen (color harmony generator with WCAG contrast checking) |
| **Productivity** | MindSync Pro (pomodoro/tasks/habits/reflection/stats), DevFlow Pro, PomodoroFocus (SomaFM radio streams), QuantumHabit OS (atomic habits framework), MotivationalDashboard |
| **AI & Creative** | AI chat (Pollinations.ai), AI image generation, AI writing studio, code analyzer, meme generator, prompt engineering lab |
| **Internet** | Web browser (DuckDuckGo), weather (Open-Meteo), crypto tracker (CoinGecko), news (Hacker News), Wikipedia, GitHub trending, DevRadar, DataVerse Live (multi-source live dashboard), DevOpsHealthCheck (site reliability auditor) |
| **Data & Analytics** | DataVerse Live (draggable card canvas with 9+ API sources), Advanced data visualization, charts |
| **Office** | Markdown editor, spreadsheet, PDF viewer, smart notes, LanguageLab Pro (dictionary/translation/flashcards), ResumeForge, SlideForge (Markdown-to-slides presentation tool) |
| **Lifestyle** | RecipeForge (TheMealDB + shopping list), EcoTrack Pro (carbon footprint), EcoFoodPrint (diet carbon calculator), SmartDailyHub |
| **System** | File manager, settings, system monitor (real data), password vault, workspace manager, WebSSH, HashCalculator (SHA-1/256/384/512 via Web Crypto API) |
| **Multimedia** | Music studio, audio visualizer, paint, screen recorder, camera, AI image studio |
| **Collaboration** | Real-time collaborative whiteboard, document editor |
| **Games** | Tetris, Snake, 2048, Breakout, dice roller |

### Real API Integrations

Every data source is a real, public API -- no fake data:

| API | Purpose |
|-----|---------|
| Open-Meteo | Global weather forecasts and air quality |
| Pollinations.ai | AI chat and image generation (free, no key) |
| DuckDuckGo | Web search (free, no key) |
| CoinGecko | Cryptocurrency market data and prices |
| Hacker News | Tech news via Firebase API |
| Wikipedia | Encyclopedia articles |
| GitHub API | Repository exploration |
| NASA APOD | Astronomy imagery |
| Frankfurter | ECB exchange rates |
| TheMealDB | Recipe database |
| Datamuse | Rhymes, synonyms, antonyms, homophones |
| Cloudflare DoH | DNS over HTTPS lookups |
| Free Dictionary API | Pronunciation, definitions, synonyms |
| ZenQuotes.io | Motivational quotes |
| SomaFM | Public internet radio streams |
| Web Crypto API | SHA/HMAC/AES-GCM hashing and encryption (browser-native, fully local) |
| crt.sh | SSL/TLS Certificate Transparency logs |
| RDAP/WHOIS | Domain registration data |
| IPCC/FAO | Food emission factors for carbon calculators |

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

Type checking (`tsc -b`) runs first -- zero type errors are required.

## Architecture

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/              # 600+ application implementations
│   │   │   └── terminal/      # Terminal command system (200+ commands)
│   │   ├── components/        # Core UI (Desktop, Window, Taskbar, StartMenu)
│   │   ├── store/             # Zustand state management, virtual filesystem
│   │   ├── services/          # AI, sync, clipboard, IndexedDB services
│   │   ├── config/            # API endpoint configuration (30+ sources)
│   │   ├── apps.tsx           # Application registry
│   │   └── store.tsx          # Global state store
│   ├── public/                # Static assets, PWA manifest, service worker
│   └── vite.config.ts         # Build config with 50+ code-split chunks
├── .github/workflows/         # CI/CD: auto-deploy to GitHub Pages
└── README.md
```

**Tech Stack:** React 19 + TypeScript 6 + Vite 8 + Zustand 5 + Monaco Editor + Pyodide

**Key architectural decisions:**

- **Lazy-loaded applications** -- each of the 600+ apps is a separate Vite chunk, loaded on demand
- **Virtual filesystem** -- hierarchical JSON tree in localStorage with undo/redo support
- **Cross-tab sync** -- BroadcastChannel-based real-time synchronization across browser tabs
- **Offline-first** -- Service Worker with stale-while-revalidate caching for static assets
- **Zero backend** -- all logic runs client-side; only public APIs are called

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
| Toggle Launcher | `Ctrl/Cmd + Shift + L` |
| Switch Desktop | `Ctrl/Cmd + Alt + 1-9` |
| Move Window to Desktop | `Ctrl/Cmd + Shift + Alt + 1-9` |
| Window Snap Left/Right | `Ctrl/Cmd + Shift + Arrow` |
| Help / Shortcuts | `Ctrl/Cmd + Shift + ?` |

## Deployment

The project is configured for GitHub Pages with automated CI/CD:

1. Push to `main` branch triggers the GitHub Actions workflow
2. The workflow runs `npm ci` + `npm run deploy` (TypeScript check + Vite build)
3. Build output is deployed to GitHub Pages

### Manual Deployment

```bash
cd web-linux
npm run deploy
```

This builds the project and outputs static files to the `dist/` directory, which can be served by any static hosting provider.

## Contributing

Contributions are welcome. Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

[MIT License](LICENSE) -- Copyright (c) Saya Ch
