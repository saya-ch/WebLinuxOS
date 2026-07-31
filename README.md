<div align="center">

# WebLinuxOS

**A full Linux desktop environment in the browser — real tools, real work, zero installation.**

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Documentation](https://github.com/saya-ch/WebLinuxOS/wiki) · [Changelog](CHANGELOG.md) · [Report Bug](https://github.com/saya-ch/WebLinuxOS/issues) · [Request Feature](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge&logo=github&color=yellow)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=for-the-badge&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v57.0.0-blue?style=for-the-badge)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?style=for-the-badge&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)

</div>

---

## Overview

WebLinuxOS is a full-featured Linux desktop environment that runs entirely in the browser. Every application delivers real functionality — the terminal executes actual commands, the code editor writes real code, the API tester makes genuine network requests, and privacy tools detect real sensitive information locally. No simulation, no demo — these tools actually work.

With **360+ built-in applications** across development, productivity, networking, media, system tools, and games, WebLinuxOS turns any device with a browser into a complete workstation. Built with React 19 and TypeScript, featuring virtual desktops, multiple themes, GPU-accelerated animations, and browser-native APIs (Web Speech, getDisplayMedia, Web Crypto, Web Serial).

## What's New in v57

Three new applications that expand WebLinuxOS into local file access, WebAssembly education, and regex mastery:

- **LocalFileExplorer** — Real local file browsing via the File System Access API (Chrome/Edge). Open directories, browse file trees, read file contents, search and sort, switch between grid and list view. No upload required — direct access to files on your machine.
- **WebAssemblyPlayground** — Browser-based WASM learning lab. Pre-built examples (add, factorial, fibonacci, square) with execution timing, memory inspection, and `.wasm` binary export. Write WAT, compile, and run — all in the browser.
- **RegexGolf** — Regex challenge game with 16 levels across 6 categories. Real-time matching visualization, shortest-regex scoring, and a progressive hint system. Learn regex by solving, not reading.

## Features

### Desktop & Window System

Multi-window environment with 4 virtual desktops, draggable/resizable windows, taskbar, start menu, command palette (`Ctrl+P`), global search (`Ctrl+K`), and Quick Action Center (`Ctrl+A`). GPU-accelerated animations with 4 built-in themes: Cyberpunk, Quantum, Glass Morphism, Classic Light.

### Terminal

90+ commands including file system browsing, text processing, network diagnostics, Cron/Git simulation, Unix pipes (`|`), output redirection (`>` / `>>`), multi-command (`;`), hash tools (sha256sum, md5sum), command aliasing, Pomodoro timer, weather CLI, scientific calculator, and more.

### Development Tools

- **Monaco Editor** — Syntax highlighting, multi-language support, auto-completion
- **API Tester** — Real API calls, preset templates, request history, favorites
- **CodeReviewBot** — 25+ static analysis rules across security, performance, complexity, maintainability, and naming for JS/TS/Python
- **DevLab** — JSON formatter, Base64, hash generator, UUID, password generator, and more
- **DataViz Studio** — 8 chart types, CSV import, AI-powered insights with 20+ statistics
- **WebAssemblyPlayground** — WAT editing, compilation, execution, and `.wasm` export
- **Code Collaboration** — Real-time cursor tracking, JavaScript execution, 9 languages

### Productivity

- **Smart Workbench** — Unified hub with Pomodoro timer, system stats, 36+ curated apps
- **ResumeForge** — 4 templates, 10 color palettes, 7 editable modules, keyword highlighter, HTML/Markdown export
- **MarkdownPublisher** — 5 publication templates, split-pane editor, standalone HTML export
- **FlashMaster** — SM-2 spaced repetition flashcards with deck management and stats
- **NeuroGraph** — Local-first knowledge graph with `[[wiki]]` linking and force-directed layout
- **SnippetVault** — Code snippet manager with 15+ language highlighting and JSON import/export
- **JSONForge** — Format, compress, convert YAML/CSV, validate schema, diff
- **CronLab** — Visual Cron builder with next-execution predictions

### Network & APIs

- **OpenAPI Hub** — 50+ endpoints across 10 categories, zero configuration, live JSON viewer
- **NexusHub** — 8 public APIs, favorites collection, no keys required
- **BookFinder** — Open Library API search with covers, ratings, and favorites
- **WikiExplorer** — Wikipedia browser with bilingual support and reading history
- **GeoAtlas** — 250+ countries, side-by-side comparison, geography quiz
- **RecipeLab** — Search by name/ingredient, meal planning, shopping lists
- **WorldPulse** — Weather, exchange rates, earthquakes, and news aggregation
- **LivePulse** — Real-time rates, Hacker News, jokes, trivia — all from public APIs

### Privacy & Security

- **PrivacyGuard** — Local PII detection for 17 sensitive categories
- **File Hash Calculator** — SHA-1/256/384/512 via Web Crypto API
- **Web Serial Terminal** — Hardware debugging via Web Serial API
- **Screen Capture** — Screen recording via getDisplayMedia + MediaRecorder

All data stays in `localStorage`. Nothing is uploaded unless you explicitly enable online APIs.

### Creativity

- **IdeaBoard** — AI prompt generation, freehand drawing, draggable idea cards on an infinite canvas
- **ImageForge** — Zero-config AI image generation via Pollinations.ai, 8 style presets, 5 models
- **Studio Suite** — Palette generator, gradient editor, shadow builder, typography preview, WCAG contrast checker
- **AudioViz** — 5 visualization types, 5 themes, mic/file/demo sources

### System & Utilities

- **Real System Monitor** — JS heap memory, network, FPS, performance timing, storage usage
- **Clipboard History** — Search, filter, favorites, persistent storage
- **EcoTrack** — Carbon footprint tracker with IPCC emission factors
- **TimeCapsule** — Milestones, habits, tasks, reflections, unified timeline
- **Voice Synth** — Text-to-speech with real-time word highlighting
- **LocalFileExplorer** — File System Access API for real local file browsing
- **RegexGolf** — 16 regex challenges across 6 categories with scoring and hints

### Games

2048, Snake, Tetris, Breakout, Memory, Virtual Pet, and more — all playable in the browser.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite 8](https://vitejs.dev/) |
| State | [Zustand](https://github.com/pmndrs/zustand) |
| Styling | CSS Variables + Theme System |
| Icons | [Lucide React](https://lucide.dev/) |
| Code Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Markdown | [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify) |
| Python Runtime | [Pyodide](https://pyodide.org/) (optional) |
| Deployment | GitHub Pages + GitHub Actions |

## Quick Start

**Online** — No installation required:

**[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)**

**Local development:**

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

Development server starts at `http://localhost:5173`.

**Production build:**

```bash
npm run build
npm run preview
```

## Project Structure

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/               # 360+ application implementations
│   │   │   └── terminal/       # Terminal command system (90+ commands)
│   │   ├── components/         # Core UI (Desktop, Window, Taskbar, StartMenu)
│   │   ├── store/              # Zustand state management
│   │   ├── styles/             # Theme system and global styles
│   │   ├── utils/              # Utility functions
│   │   ├── services/           # API and service layer
│   │   ├── config/             # Configuration
│   │   └── types/              # TypeScript definitions
│   ├── public/                 # Static assets
│   └── vite.config.ts
├── .github/workflows/          # CI/CD (auto-deployment)
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
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
| `PrintScreen` | Screenshot |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

To add a new application: create the component in `web-linux/src/apps/`, register it in `apps.tsx`, add the lazy loading entry in `WindowManager.tsx`, test, and submit a PR.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

[MIT](LICENSE)

## Acknowledgements

- [Lucide](https://lucide.dev/) — Icon library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — Code editor powering VS Code
- [Pyodide](https://pyodide.org/) — Python runtime for the browser
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [Vite](https://vitejs.dev/) — Build tool
- [Frankfurter](https://www.frankfurter.app/) — Exchange rate data
- [Pollinations.ai](https://pollinations.ai/) — Free AI image generation
- [Open Library](https://openlibrary.org/developers/api) — Book catalog
- [Open-Meteo](https://open-meteo.com/) — Weather forecast API
- [REST Countries](https://restcountries.com/) — Country information API
- [Hacker News API](https://github.com/HackerNews/API) — HN Firebase API

---

<div align="center">

If this project helps you, consider giving it a star.

</div>
