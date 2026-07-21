# WebLinuxOS

> A production-grade Linux desktop environment running entirely in the browser.
> Built with React 19, TypeScript, Zustand, and Vite. 240+ applications, virtual file system, terminal emulator, and Python runtime — all client-side.

**Live Demo**: <https://saya-ch.github.io/WebLinuxOS/>

[![Deploy to GitHub Pages](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml/badge.svg)](https://github.com/saya-ch/WebLinuxOS/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-43.0.0-7c3aed.svg)](./web-linux/package.json)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

---

## Why WebLinuxOS?

Most "web desktop" projects are visual shells with limited utility. WebLinuxOS is
different: it ships a complete operating environment with a real terminal (100+
commands), a working file system backed by IndexedDB, a Python runtime via
Pyodide, and 240+ applications that solve real problems — from cron scheduling
to PII redaction.

Everything runs in the browser. No backend, no account, no telemetry.

## Highlights

### Three new tools in v43

| Tool | What it does |
| --- | --- |
| **PrivacyGuard** | Detects 17 classes of personally identifiable information (email, phone, ID, cards, IP, API keys, JWT, PEM keys, BTC addresses, …) and sanitizes them via four modes: highlight, partial mask, hash, full redact. 100% local. |
| **JSONForge** | All-in-one JSON workbench: format / minify, JSON ⇌ YAML, JSON ⇌ CSV, deep JSON diff, and automatic JSON Schema generation with type inference. |
| **CronLab** | Visual cron expression builder with human-readable explanation, next-N-run preview, and 12 presets. Supports aliases (`mon`, `jan`, `L`, `W`, `#`). |

### Desktop environment

- Multi-window manager with drag, resize, snap, minimize, maximize, multi-desktop
- Smart app launcher with fuzzy search and keyboard navigation
- System tray with live network, volume, and battery indicators
- Global search (`Ctrl+K`) across apps, files, and commands
- Command palette (`Ctrl+P`) for system operations
- Dark/light theme with smooth transitions
- Dynamic particle/nebula wallpaper with mouse interaction
- Notification center with persistent alerts
- Desktop widgets: clock, system monitor, weather, sticky notes, focus timer

### Developer tools

- **Code editor** with syntax highlighting for 20+ languages
- **WebIDE Pro** — full online development environment
- **Online code runner** for JavaScript, TypeScript, SQL, Bash, HTML, Markdown
- **Python REPL** via Pyodide with package support
- **Terminal** with 100+ commands including:
  - File ops: `ls`, `cd`, `cat`, `mkdir`, `rm`, `cp`, `mv`, `grep`, `find`, `diff`, `chmod`, `history`
  - System: `top`, `ps`, `neofetch`, `free`, `df`, `uptime`, `clear`, `which`
  - Network: `ping`, `curl`, `weather`, `news`, `crypto`, `translate`, `ipinfo`, `wiki`, `space`
  - Dev: `calc`, `hash`, `base64`, `uuid`, `regex`, `jwt-decode`
- **REST API tester** with request builder and JSON preview
- **JSON tools** — formatter, validator, YAML converter, diff, schema
- **Regex builder/tester** with pattern library
- **GitHub trending** and profile explorer
- **Code snippet manager** with import/export

### Productivity

- Markdown editor with live preview and HTML export
- Smart notes with tags, search, and Markdown rendering
- Spreadsheet with formulas and charts
- Calendar with reminders; Kanban board with drag-and-drop
- Mind map, presentation creator, project planner with Gantt charts
- Pomodoro studio with customizable sessions
- Habit tracker with streak visualization

### Internet & data

- Weather (real-time, Open-Meteo)
- Cryptocurrency tracker (CoinGecko)
- Hacker News reader
- Wikipedia explorer
- NASA astronomy picture of the day
- GitHub trending repositories
- RSS reader
- Real-time translator (100+ languages)

### Multimedia & games

- Music player with playlist and visualizer
- Drawing app with layers and filters
- Camera capture, screen recorder, sound recorder
- Classic games: Snake, Tetris, 2048, Memory, Breakout
- Virtual pet with interactive features

## Quick start

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev          # start dev server at http://localhost:5173/WebLinuxOS/
```

Build for production:

```bash
npm run build       # type-check + bundle to ../dist
npm run preview     # serve the production build locally
```

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds and
publishes to GitHub Pages on every push to `main`.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Shift+L` | Open app launcher |
| `Ctrl+K` | Global search |
| `Ctrl+P` | Command palette |
| `Ctrl+Space` | Smart command center |
| `Alt+Tab` | Cycle windows |
| `Ctrl+Q` | Close focused window |
| `Ctrl+M` | Minimize focused window |
| `Ctrl+1..9` | Quick app launch |
| `Ctrl+Shift+T` | Open terminal |
| `Ctrl+Shift+E` | Open text editor |
| `Ctrl+Shift+C` | Open calculator |
| `Ctrl+Shift+W` | Open weather |
| `Ctrl+Alt+1..9` | Switch virtual desktop |
| `Ctrl+Shift+Alt+←/→` | Move window across desktops |
| `F11` | Toggle fullscreen |
| `PrintScreen` | Screenshot |

## Architecture

```
web-linux/
├── public/                 # Static assets served as-is
├── screenshots/            # Used by README and OG image
├── src/
│   ├── apps/               # 240+ application components
│   │   └── terminal/       # Terminal command modules
│   │       ├── commands.ts # Register / dispatch core
│   │       ├── fileCommands.ts
│   │       ├── systemCommands.ts
│   │       ├── toolCommands.ts
│   │       ├── networkCommands.ts
│   │       ├── creativeCommands.ts   # nasa / wikipedia / github-trending
│   │       └── …
│   ├── components/
│   │   └── desktop/        # Desktop, Window, Taskbar, StartMenu, Wallpaper
│   ├── config/apiConfig.ts # Public API endpoints (key-free)
│   ├── services/           # AI service, API service, clipboard service
│   ├── store/              # Zustand store + storage utils
│   ├── styles/             # Theme CSS (cyberpunk, quantum)
│   ├── utils/              # apiCache, fileSystemAPI, logger, perf monitor
│   ├── apps.tsx            # App registry (declarative metadata)
│   ├── App.tsx             # Root component + global shortcuts
│   └── main.tsx            # React entry
├── index.html              # Boot screen + theme preload
├── vite.config.ts          # GitHub Pages base path + manual chunks
└── package.json
```

### Application registry

Apps are declared as plain data in [`src/apps.tsx`](./web-linux/src/apps.tsx).
Each entry includes id, name, icon, component name, default window size, and
category. Components are lazy-loaded through `componentMap` in
[`src/components/desktop/WindowManager.tsx`](./web-linux/src/components/desktop/WindowManager.tsx),
so opening an app only fetches its chunk on demand.

### Terminal commands

Terminal commands self-register via `registerCommand(name, definition)` in
[`src/apps/terminal/commands.ts`](./web-linux/src/apps/terminal/commands.ts).
Duplicate registrations are detected and skipped (with a dev-mode warning) so
that "canonical" implementations in `systemCommands.ts`, `toolCommands.ts`,
and `creativeCommands.ts` always take precedence. To override on purpose:

```ts
registerCommand('my-cmd', def, { force: true, source: 'myModule' })
```

## Technology stack

| Layer | Choice | Why |
| --- | --- | --- |
| UI framework | React 19 | Concurrent rendering, Suspense, hooks |
| Language | TypeScript 6 | End-to-end type safety |
| State | Zustand 5 | Lightweight, no boilerplate |
| Build | Vite 8 | Fast HMR, ES2022 target, code splitting |
| Python runtime | Pyodide 0.26 | Real CPython compiled to WASM |
| Icons | Lucide React | Tree-shakeable, consistent design |
| Storage | IndexedDB + localStorage | Persistent virtual file system |
| PWA | manifest.json + service worker | Installable, offline-capable |

## API integrations

All integrations use public, key-free endpoints so the deployed app works
without secrets:

| Service | Used for |
| --- | --- |
| Open-Meteo | Weather forecasts and current conditions |
| CoinGecko | Cryptocurrency prices |
| ipapi.co | IP address geolocation |
| GitHub API | Repository and user lookups |
| Hacker News (Algolia) | News articles |
| LibreTranslate / MyMemory | Translation |
| Wikipedia REST API | Knowledge base |
| NASA APOD | Astronomy picture of the day |
| Cat Fact Ninja | Fun facts |
| Quotable.io | Inspirational quotes |
| Open Trivia Database | Quiz questions |
| Pollinations.ai | Free text-to-text AI (no key required) |
| microlink.io | Webpage metadata and screenshots |
| Frankfurter | Exchange rates |

## Performance

- Code splitting per app via `React.lazy` + dynamic `import()`
- Manual chunks for heavy vendors (React, Zustand, Lucide, marked, Pyodide)
- Memoized selectors with `useMemo` / `useCallback`
- GPU-accelerated animations (`transform`, `will-change`)
- IndexedDB persistence with throttled writes
- API response caching with configurable TTL and retry logic
- `content-visibility` for off-screen windows

## Recent releases

### v43.0 — Privacy & developer tooling

- New: **PrivacyGuard** — 17-class PII detection and four sanitization modes
- New: **JSONForge** — JSON ⇌ YAML / CSV, deep diff, and schema generation
- New: **CronLab** — visual cron builder with next-run preview
- Fixed: terminal commands registered multiple times were silently
  overwriting each other (35 affected). Now the first registration wins,
  with optional `{ force: true }` override.
- Fixed: `localStorage` theme parsing broke when value was stored as a
  plain string instead of JSON. Boot screen and storage utils now accept both.
- Updated: boot screen version label synced with `package.json` (v43).
- Updated: HTML meta description refreshed to mention the new tools.

### v42.0 — Advanced code runner and system diagnostics

- New: `CodeRunnerAdvanced` — JavaScript live execution with console capture
- New: `SystemDiagnosticsPro` — CPU / memory / network / WebGL analysis

### v41.0 — Prompt engineering and web snapshots

- New: **PromptForge** — prompt template library, variable interpolation,
  live testing, AI optimization suggestions
- New: **WebSnapshot** — URL → screenshot + metadata, multi-viewport compare

### v40.0 — Real AI and cloud clipboard

- Integrated Pollinations.ai for key-free AI completions
- Cloud clipboard backed by GitHub Gist for cross-device sync

Older releases are documented in [`CHANGELOG.md`](./CHANGELOG.md).

## Browser support

Tested on the latest two versions of Chrome, Firefox, Safari, and Edge.
The File System Access API and Pyodide require modern browsers; graceful
fallbacks are in place.

## Use cases

- Learning Linux concepts in a sandboxed environment
- Demonstrating modern web capabilities
- Cross-platform access to developer tools without installation
- Lightweight online workspace for developers
- Teaching programming with JavaScript, TypeScript, and Python
- API testing and prototyping
- Quick JSON / cron / PII sanitization without uploading data anywhere

## Contributing

Contributions are welcome. The workflow:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes following the existing code style (Prettier + ESLint)
4. Verify locally: `npm run lint && npm run build`
5. Open a pull request with a clear description

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for details.

### Adding a new app

1. Create `src/apps/MyApp.tsx` exporting a default React component
2. Register it in `src/apps.tsx` (the `APP_REGISTRY_EXTRAS` array keeps new
   entries grouped together)
3. Add the lazy import to `componentMap` in
   `src/components/desktop/WindowManager.tsx`
4. Optionally wire a keyboard shortcut in `src/App.tsx`

### Adding a terminal command

1. Pick the right command file (e.g. `toolCommands.ts` for utilities)
2. Call `registerCommand('name', { handler, description, usage, examples })`
3. The new command is automatically picked up by `help` and tab completion
4. If your command file is new, add an `import './myCommands'` line at the
   correct position in `src/apps/terminal/index.ts` (canonical implementations
   should come before override-capable ones)

## License

MIT — see [`LICENSE`](./LICENSE).

---

Maintained by **Saya Ch** · <https://github.com/saya-ch>
