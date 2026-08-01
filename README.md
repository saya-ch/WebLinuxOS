<div align="center">

# WebLinuxOS

**A full Linux desktop environment in the browser — real tools, real work, zero installation.**

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Documentation](https://github.com/saya-ch/WebLinuxOS/wiki) · [Changelog](CHANGELOG.md) · [Report Bug](https://github.com/saya-ch/WebLinuxOS/issues) · [Request Feature](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge&logo=github&color=yellow)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=for-the-badge&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v61.0.0-blue?style=for-the-badge)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?style=for-the-badge&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## Overview

WebLinuxOS is a full-featured Linux desktop environment that runs entirely in the browser. Every application delivers real functionality — the terminal executes actual commands, the code editor writes real code, the API tester makes genuine network requests, the AI image studio generates real images via public APIs, and privacy tools detect real sensitive information locally. No simulation, no demo — these tools actually work.

With **360+ built-in applications** across development, productivity, networking, media, system tools, AI, and games, WebLinuxOS turns any device with a browser into a complete workstation. Built with React 19 and TypeScript, featuring virtual desktops, multiple themes, GPU-accelerated animations, and browser-native APIs (Web Speech, getDisplayMedia, Web Crypto, Web Serial, File System Access).

## What's New in v61

A major innovation release with new AI-powered creative tools and real-time data applications:

- **AI Creation Studio (NEW)** — AI-powered one-stop creation platform integrating four modules: AI image generation via Pollinations.ai (8+ artistic styles, 5 Flux models, multiple aspect ratios), intelligent copywriting with 5+ template types and variable interpolation, color palette generation with preset schemes and random creation, and canvas drawing with brush/eraser tools and undo/redo support.
- **WeatherNow (NEW)** — Real-time weather forecast application built on the Open-Meteo public API. Features include city search with geocoding, 7-day forecast display, detailed weather metrics (humidity, wind speed, precipitation), favorite cities management, Celsius/Fahrenheit toggle, and dynamic background that changes between day/night modes.
- **New app integrations** — Added five new app entries to the registry: AI Creation Studio, Crypto Dashboard, Reddit Explorer, WCAG Contrast Checker, Keyboard Shortcut Tester, and Markdown Slides Pro, extending the total application count to 370+.
- **Code quality improvements** — Fixed TypeScript strict mode violations: removed unused imports and variables, fixed missing icon import references, and ensured all new components compile cleanly.

### Previous (v60)

A major innovation release with three new productivity-enhancing applications integrated with public APIs:

- **AIWikiSearch (NEW)** — Intelligent Wikipedia search tool with bilingual (English/Chinese) real-time search suggestions, article reading with table of contents navigation, AI-powered summary generation, favorites and browsing history, dark/light theme support with glass morphism design. Built on the official Wikipedia REST API and MediaWiki OpenSearch API.
- **CodeSnapShare (NEW)** — Code snippet sharing platform supporting 10 programming languages with lightweight syntax highlighting. Generate shareable links via Base64 encoding + hash routing, one-click copy/import, favorites and history management, emoji tagging, and theme switching. Zero backend required.
- **WebSummarizer (NEW)** — Web content extraction and intelligent summarization tool. Input any URL to extract metadata (title, description, OG tags), generate multi-level summaries (short/medium/detailed), extract keywords and tags, analyze reading difficulty, translate across 7 languages via MyMemory API, and export summaries as Markdown. Uses multiple CORS proxies for reliable fetching.
- **Code quality hardening** — Fixed TypeScript strict mode violations across all three new applications: proper null checking, type assertions for CSS properties, duplicate identifier resolution, and unused variable cleanup.

### Previous (v59)

A quality and productivity release: hardening critical bugs and adding a frictionless system-wide capture tool.

- **QuickNote Overlay (NEW)** — A global quick-capture scratchpad available everywhere via `Alt+N` or the taskbar tray note icon. Type a thought and it auto-saves to localStorage instantly; press `Ctrl+Enter` to save it as a real `.txt` file into the virtual `~/文档` directory, or send it straight to the text editor. Multi-note list, full-text search, live word/character count, and an editorial amber-on-glass aesthetic.
- **Terminal resilience fix** — `JSON.parse` of saved command history and aliases is now wrapped in `try/catch` with shape validation, so a corrupted `localStorage` entry can no longer crash the Terminal on open.
- **Duplicate app id resolved** — The launcher registry contained two entries both using `id: 'idea-board'`; the classic variant is now registered as `idea-board-classic`.

### Previous (v58)

A major stability and creativity release focused on reliability and AI-powered content creation:

- **AIImageStudio (NEW)** — Zero-config AI image generator built on the Pollinations.ai public API. 12 artistic style presets (Photorealistic, Anime, Cyberpunk, Oil Painting, Watercolor, Pixel Art, and more), 6 aspect ratios, 5 Flux-based models, generation history, and local favorites collection. No API keys required.
- **Launcher / Start Menu reliability overhaul** — Fixed memo-based stale-state rendering that prevented StartMenu from responding to launcher state changes. Taskbar launcher button now uses a robust state-update path with explicit 44×36 px hit target and gradient-encoded visual state (green→blue closed / purple→pink open).
- **Calculator & SystemSettings launch fixed** — Previously blocked by the same memo/render desync that affected the launcher; resolved by removing unnecessary memo wrappers from frequently-updating UI components.
- **Global `window.WebLinuxOS` API (NEW)** — Stable programmatic surface for browser automation and external integrations. Methods include `openApp(appId)`, `closeWindow(winId)`, `maximizeWindow(winId)`, `toggleLauncher()`, `getState()`, plus a `weblinux-ready` DOM event.
- **Improved keyboard shortcut handling** — Focus-guard bypass for critical shortcuts; `Ctrl+Shift+L` launcher toggle now works reliably without requiring manual document blur.
- **Start Menu visual polish** — Fixed-position overlay + panel with `backdrop-filter` blur, smooth spring-open animation, and click-outside dismiss behavior.
- **TypeScript build clean** — All TS6133 (unused vars) and TS2554 (wrong arity) errors eliminated; `tsc -b && vite build` passes with zero warnings.

### Previous (v57)

- **LocalFileExplorer** — Real local file browsing via the File System Access API (Chrome/Edge). Open directories, browse file trees, read file contents, search and sort, switch between grid and list view. No upload required — direct access to files on your machine.
- **WebAssemblyPlayground** — Browser-based WASM learning lab. Pre-built examples (add, factorial, fibonacci, square) with execution timing, memory inspection, and `.wasm` binary export. Write WAT, compile, and run — all in the browser.
- **RegexGolf** — Regex challenge game with 16 levels across 6 categories. Real-time matching visualization, shortest-regex scoring, and a progressive hint system. Learn regex by solving, not reading.

## Features

### Desktop & Window System

Multi-window environment with 4 virtual desktops, draggable/resizable windows, taskbar, redesigned launcher / start menu (`Ctrl+Shift+L`), command palette (`Ctrl+P`), global search (`Ctrl+K`), and Quick Action Center (`Ctrl+A`). GPU-accelerated animations with 4 built-in themes: Cyberpunk, Quantum, Glass Morphism, Classic Light.

### Terminal

90+ commands including file system browsing, text processing, network diagnostics, Cron/Git simulation, Unix pipes (`|`), output redirection (`>` / `>>`), multi-command (`;`), hash tools (sha256sum, md5sum), command aliasing, Pomodoro timer, weather CLI, scientific calculator, and more.

### Development Tools

- **CodeSnapShare** — Code snippet sharing with 10-language syntax highlighting, Base64 share links, favorites, emoji tagging
- **Monaco Editor** — Syntax highlighting, multi-language support, auto-completion
- **API Tester** — Real API calls, preset templates, request history, favorites
- **CodeReviewBot** — 25+ static analysis rules across security, performance, complexity, maintainability, and naming for JS/TS/Python
- **DevLab** — JSON formatter, Base64, hash generator, UUID, password generator, and more
- **DataViz Studio** — 8 chart types, CSV import, AI-powered insights with 20+ statistics
- **WebAssemblyPlayground** — WAT editing, compilation, execution, and `.wasm` export
- **Code Collaboration** — Real-time cursor tracking, JavaScript execution, 9 languages

### Productivity

- **WebSummarizer** — URL metadata extraction, multi-level summaries, keyword extraction, reading difficulty analysis, 7-language translation, Markdown export
- **Smart Workbench** — Unified hub with Pomodoro timer, system stats, 36+ curated apps
- **ResumeForge** — 4 templates, 10 color palettes, 7 editable modules, keyword highlighter, HTML/Markdown export
- **MarkdownPublisher** — 5 publication templates, split-pane editor, standalone HTML export
- **FlashMaster** — SM-2 spaced repetition flashcards with deck management and stats
- **NeuroGraph** — Local-first knowledge graph with `[[wiki]]` linking and force-directed layout
- **SnippetVault** — Code snippet manager with 15+ language highlighting and JSON import/export
- **JSONForge** — Format, compress, convert YAML/CSV, validate schema, diff
- **CronLab** — Visual Cron builder with next-execution predictions

### AI & Creativity

- **AIImageStudio** — AI image generation via Pollinations.ai. 12 style presets, 6 aspect ratios, 5 Flux-family models, prompt suggestions, generation history, favorites. Zero API key required.
- **IdeaBoard** — AI prompt generation, freehand drawing, draggable idea cards on an infinite canvas
- **ImageForge** — Zero-config AI image generation via Pollinations.ai, 8 style presets, 5 models
- **Studio Suite** — Palette generator, gradient editor, shadow builder, typography preview, WCAG contrast checker
- **AudioViz** — 5 visualization types, 5 themes, mic/file/demo sources
- **PromptForge** — Prompt engineering workspace with template library and copy-to-clipboard

### Network & APIs

- **AIWikiSearch** — Intelligent Wikipedia search with bilingual (EN/ZH) real-time suggestions, TOC navigation, AI summaries, favorites, and reading history
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
- **Password strength checker + generator** — Local generation with entropy estimation

All data stays in `localStorage`. Nothing is uploaded unless you explicitly enable online APIs or submit requests to public third-party endpoints (OpenAPI Hub, BookFinder, Pollinations.ai, etc.).

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
| Build | [Vite 8](https://vitejs.dev/) with code splitting, rollup chunks, terser minification |
| State | [Zustand](https://github.com/pmndrs/zustand) (action creators + shallow selectors) |
| Styling | CSS Variables + Theme System (4 themes) |
| Icons | [Lucide React](https://lucide.dev/) |
| Code Editor | [Monaco Editor](https://microsoft.github.io/monaco-editor/) |
| Markdown | [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify) |
| Python Runtime | [Pyodide](https://pyodide.org/) (optional) |
| AI Image | [Pollinations.ai](https://pollinations.ai/) Public API — no key required |
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

Development server starts at `http://localhost:5173/WebLinuxOS/` (the base path is intentional — it matches the GitHub Pages deployment).

**Production build:**

```bash
# Clean TypeScript build + Vite bundle
npm run build

# Serve the built dist directory locally to verify
npm run preview
```

The build verifies all TypeScript types (`tsc -b`) before bundling. Zero type errors is the release gate.

## Project Structure

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/               # 360+ application implementations
│   │   │   ├── AIImageStudio   # v58: AI image generation (Pollinations.ai)
│   │   │   └── terminal/       # Terminal command system (90+ commands)
│   │   ├── components/         # Core UI (Desktop, Window, Taskbar, StartMenu)
│   │   │   └── desktop/        # Taskbar launcher + StartMenu (v58 reliability fix)
│   │   ├── store/              # Zustand state management, file/storage utils
│   │   ├── styles/             # Theme system and global styles
│   │   ├── utils/              # Utility functions, perf monitor, logger
│   │   ├── services/           # API and service layer (AI, clipboard, cache)
│   │   ├── config/             # API endpoint configuration
│   │   └── types/              # TypeScript definitions
│   ├── public/                 # Static assets, PWA manifest, SW, 404.html
│   ├── screenshots/            # Gallery images for docs / README
│   └── vite.config.ts          # Base path, code splitting, rollup output
├── .github/workflows/          # CI/CD: build + deploy to Pages on main
├── CHANGELOG.md
├── CONTRIBUTING.md
└── LICENSE
```

## Keyboard Shortcuts

**Desktop & System**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Shift + L` | Open/close launcher (Start Menu) — v58 |
| `Ctrl/Cmd + Space` | Smart command center |
| `Ctrl/Cmd + P` | Command palette |
| `Ctrl/Cmd + K` | Global search |
| `Alt + N` | QuickNote overlay (system-wide capture) — v59 |
| `Ctrl/Cmd + A` | Quick action center |
| `Alt + Tab` | Switch windows (forward) |
| `Shift + Alt + Tab` | Switch windows (reverse) |
| `Ctrl + Alt + [1-9]` | Switch virtual desktops 1–9 |
| `PrintScreen` | Screenshot app |

**Applications**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + T` | Open terminal |
| `Ctrl/Cmd + E` | Open file manager |
| `Ctrl/Cmd + B` | Open browser |
| `Ctrl/Cmd + ,` | Open system settings |
| `Ctrl/Cmd + Shift + C` | Open calculator |

**Window Management**

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Q` | Close focused window |
| `Ctrl/Cmd + M` | Minimize focused window |
| `F11` | Maximize / restore focused window |

## Global API (Browser Integration)

v58 exposes a stable programmatic surface at `window.WebLinuxOS` after the app has mounted. External scripts, iframes, and browser-automation tools can use this to drive WebLinuxOS.

**Listen for readiness:**

```js
window.addEventListener('weblinux-ready', (e) => {
  console.log('WebLinuxOS version:', e.detail.version)
  e.detail.openApp('calculator') // Opens the calculator
})
```

**Available methods:**

```ts
window.WebLinuxOS.openApp(appId)              // Launch an app by registry id
window.WebLinuxOS.closeWindow(winId)          // Close a specific window
window.WebLinuxOS.minimizeWindow(winId)
window.WebLinuxOS.maximizeWindow(winId)
window.WebLinuxOS.focusWindow(winId)
window.WebLinuxOS.toggleLauncher()            // Show / hide the start menu
window.WebLinuxOS.closeAllWindows()
window.WebLinuxOS.getState()                  // Snapshot of full Zustand store
window.WebLinuxOS.version                     // e.g. "58.0.0"
window.WebLinuxOS.buildTime                   // ISO timestamp
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Before you commit, verify:**

```bash
cd web-linux
npm run build   # Must pass: tsc -b && vite build → 0 type errors
```

**To add a new application:**

1. Create the component in `web-linux/src/apps/YourAppName.tsx`
2. Register the app metadata in `apps.tsx` (icon, dimensions, category, description)
3. Add the lazy-loading entry in `components/desktop/WindowManager.tsx` (`componentMap`)
4. Test manually: launcher search, desktop icon, window close/maximize
5. Submit a PR with a screenshot and a one-paragraph description

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Deployment

Deployment is fully automatic via GitHub Actions (`.github/workflows/deploy.yml`):

1. Every push to `main` triggers the workflow
2. `npm ci` installs dependencies
3. `npm run build` runs the TypeScript + Vite build (required to pass)
4. The `dist/` output is published to the `gh-pages` branch
5. GitHub Pages serves from `gh-pages` → [Live Demo](https://saya-ch.github.io/WebLinuxOS/)

If you deploy to your own fork, verify `vite.config.ts` → `base` matches your repository name (default is `/WebLinuxOS/`).

## License

[MIT](LICENSE)

## Acknowledgements

- [Lucide](https://lucide.dev/) — Icon library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — Code editor powering VS Code
- [Pyodide](https://pyodide.org/) — Python runtime for the browser
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [Vite](https://vitejs.dev/) — Build tool
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/) — Free encyclopedia content
- [MediaWiki OpenSearch API](https://www.mediawiki.org/wiki/API:Opensearch) — Real-time search suggestions
- [MyMemory Translation API](https://mymemory.translated.net/) — Free multilingual translation
- [Frankfurter](https://www.frankfurter.app/) — Exchange rate data
- [Pollinations.ai](https://pollinations.ai/) — Free AI image generation
- [Open Library](https://openlibrary.org/developers/api) — Book catalog
- [Open-Meteo](https://open-meteo.com/) — Weather forecast API
- [REST Countries](https://restcountries.com/) — Country information API
- [Hacker News API](https://github.com/HackerNews/API) — HN Firebase API
- [Corsproxy.io](https://corsproxy.io/) — CORS proxy for web scraping

---

<div align="center">

If this project helps you, consider giving it a star.

</div>
