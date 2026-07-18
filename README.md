# WebLinuxOS

**A complete Linux desktop environment that runs entirely in your browser.** No installation, no backend, no API keys.

[![Live Demo](https://img.shields.io/badge/Live_Demo-saya--ch.github.io-7c3aed?style=flat-square)](https://saya-ch.github.io/WebLinuxOS/)
[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=flat-square)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19-61dafb?style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square)](https://www.typescriptlang.org)
[![Vite 8](https://img.shields.io/badge/Vite-8-646cff?style=flat-square)](https://vite.dev)

> WebLinuxOS is not a screen-recording demo or a mock. Every window, every command, every network call is real and runs locally in your browser. The application is shipped as a static bundle and can be self-hosted, forked, or extended.

---

## Why WebLinuxOS

There are plenty of "operating system in the browser" experiments on the web. Most of them stop at the splash screen or pretend to be a desktop by overlaying a video. WebLinuxOS ships the full stack:

- A **virtual file system** with folders, files, undo/redo, copy/move, persistence to `localStorage`.
- A **terminal emulator** with `200+` commands, pipes, redirects, history, tab completion, and a real **Python 3 runtime** via Pyodide.
- A **window manager** with drag, resize, snap, minimize, maximize, focus stacking, and per-window snapshots.
- **Multiple virtual desktops** with per-desktop window grouping and keyboard navigation.
- **Real public APIs** for weather, news, crypto, exchange rates, GitHub trending, Wikipedia, and more — no keys required.

The goal is to demonstrate that the modern web platform is good enough to host a productive desktop-class environment, while also being a useful tool in its own right.

---

## Highlights

### Desktop & Window Manager

- Nine virtual desktops with `Ctrl + Alt + ←/→` and `Ctrl + Alt + 1..9` shortcuts.
- Edge-snap resize, quarter-tiling, alignment guides, focus stacking with z-index ordering.
- Window snapshots (lightweight thumbnail previews) for the taskbar.
- Live wallpapers: particles, wave, nebula, aurora — performance-aware, throttled to 30 FPS on low-end hardware.
- Notification center with priority, duration, deduplication.
- Global search (`Ctrl/⌘ + K`), command palette (`Ctrl/⌘ + P`), smart command center (`Ctrl/⌘ + Space`).

### Terminal

A real POSIX-style terminal with 200+ built-in commands:

| Category | Examples |
|----------|----------|
| File | `ls`, `cd`, `cat`, `mkdir`, `rm`, `cp`, `mv`, `touch`, `pwd`, `tree`, `find`, `grep` |
| System | `top`, `ps`, `df`, `free`, `uptime`, `whoami`, `date`, `uname`, `hostname`, `env` |
| Network | `ping`, `curl`, `wget`, `netstat`, `dig`, `dns`, `ip` |
| Online | `weather`, `news`, `crypto`, `github`, `github-trending`, `stock`, `nasa`, `wikipedia` |
| Utilities | `base64`, `url-encode`, `hash`, `uuidgen`, `jwt-decode`, `qrcode`, `color`, `calc` |
| Languages | `python` (Pyodide 3.11 runtime with full stdlib) |
| Misc | Pipes, redirects, background processes, command history, tab completion |

### Apps

The launcher ships 200+ integrated apps across 8 categories. New in this release: **Snap Studio** — a real, browser-native image editor powered by the Canvas 2D API with pixel-accurate filters, presets, adjustments, multi-format export, and undo/redo.

Other curated highlights:

- **CodePen Lite** — HTML/CSS/JS playground with live preview.
- **GitHub Explorer** — real-time search across the GitHub REST API.
- **Live Data Hub** — aggregated widgets for weather, crypto, news, ISS position.
- **Knowledge Vine** — Zettelkasten-style note linking.
- **Pomodoro Studio** — focus sessions with statistics.
- **System Monitor** — real-time CPU/memory/network visualization (canvas-based, no external libs).

### Real-Time API Integrations

All endpoints are public and key-free:

| Service | Use |
|---------|-----|
| Open-Meteo | Weather & forecast |
| CoinGecko | Crypto prices & market cap |
| Hacker News | Tech news |
| GitHub | Repos, trending, user profiles |
| Wikipedia | Encyclopedia summaries |
| Frankfurter | Exchange rates |
| Quotable | Inspirational quotes |
| Advice Slip | Random advice |
| Bored API | Activity suggestions |
| Nationalize / Agify / Genderize | Name analysis |
| Spaceflight News | Space industry articles |
| RandomUser | Profile picture generator |
| Picsum | Sample images for Snap Studio |

---

## Quick Start

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

Open <http://localhost:5173/WebLinuxOS/>.

### Build for production

```bash
npm run build      # Outputs to /dist, suitable for any static host
npm run deploy     # Builds for GitHub Pages (base path /WebLinuxOS/)
```

### Verify the build

```bash
npm run typecheck  # tsc --noEmit
npm run lint
```

---

## Architecture

```
WebLinuxOS/
└── web-linux/
    ├── src/
    │   ├── App.tsx                    # Keyboard shortcuts, app lifecycle
    │   ├── apps.tsx                   # 200+ app registry
    │   ├── store.tsx                  # Zustand global state, file ops, undo/redo
    │   ├── types.ts                   # Strict TypeScript types
    │   ├── icons.tsx                  # Lucide icon mapping
    │   ├── components/
    │   │   ├── desktop/               # WindowManager, Desktop, Taskbar, StartMenu
    │   │   ├── CommandPalette.tsx     # Ctrl+P fuzzy launcher
    │   │   ├── NotificationSystem.tsx
    │   │   ├── SmartCommandCenter.tsx # Ctrl+Space
    │   │   └── GlobalSearch.tsx       # Ctrl+K
    │   ├── apps/                      # 200+ React app components
    │   │   ├── terminal/              # Terminal engine + 200+ commands
    │   │   ├── SnapStudio.tsx         # Canvas-based image editor
    │   │   ├── GitHubExplorer.tsx     # Real GitHub API integration
    │   │   └── ...
    │   ├── services/
    │   │   └── apiService.ts          # Typed API clients (strict types)
    │   ├── store/                     # Virtual FS, persistence utils
    │   ├── utils/                     # Logger, performance monitor
    │   └── styles/                    # Cyberpunk, quantum, worldpulse themes
    ├── public/                        # Static assets
    ├── index.html                     # Boot screen + root container
    └── vite.config.ts                 # Vite config, vendor chunking
```

### State management

A single Zustand store owns the desktop state, window list, virtual file system, notifications, and theme. Selectors are used per-field so unrelated state changes don't re-render subscribers. File operations are persisted via debounced `localStorage` writes to avoid thrashing.

### Bundle strategy

Vite is configured for explicit vendor chunking (`vendor-react`, `vendor-zustand`, `vendor-lucide`, etc.), so the initial payload stays small. Application components are dynamically imported through `WindowManager.componentMap` — most apps only load when first opened.

### Type safety

The project compiles with `strict: true`. Recent updates added full type interfaces to `apiService.ts` (`GitHubUser`, `GitHubRepo`, `ExchangeRates`, `IPInfo`, `JokeData`, `RandomUser`, `BoredActivity`, `NameAnalysis`, `SpaceArticle`) so the entire API surface is checked at compile time.

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + Space` | Smart command center |
| `Ctrl/⌘ + K` | Global search |
| `Ctrl/⌘ + P` | Command palette |
| `Ctrl/⌘ + ,` | Settings |
| `Ctrl/⌘ + T` | Terminal |
| `Ctrl/⌘ + E` | File manager |
| `Ctrl/⌘ + B` | Browser |
| `Ctrl + 1..9` | Switch to desktop N |
| `Ctrl + Alt + ←/→` | Previous / next desktop |
| `Ctrl + Alt + Tab` | Cycle windows |
| `F11` | Toggle fullscreen |
| `Ctrl + Q` | Close focused window |
| `Ctrl + M` | Minimize focused window |
| `Ctrl/⌘ + Z` / `Ctrl/⌘ + Y` | Undo / redo (file operations) |

Terminal: `Ctrl+L` clear · `Ctrl+C` interrupt · `Ctrl+R` reverse search · `Tab` autocomplete.

---

## Deployment

The included GitHub Actions workflow (`.github/workflows/deploy.yml`) builds on every push to `main` and publishes to GitHub Pages automatically. To self-host, run `npm run build` and serve the `web-linux/dist/` directory from any static host — Vercel, Netlify, Cloudflare Pages, S3, nginx, or GitHub Pages.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Make your changes; verify with `npm run typecheck && npm run build`.
4. Open a Pull Request with a clear description of the change.

### Adding a new app

1. Create `web-linux/src/apps/MyApp.tsx`.
2. Add a lazy import in `web-linux/src/components/desktop/WindowManager.tsx#componentMap`.
3. Register metadata in `web-linux/src/apps.tsx#appRegistry`.

All three steps are validated by a one-line comment block above `appRegistry` and the build pipeline will fail if any app is registered without an existing component.

---

## License

[MIT](LICENSE) — Free to use, modify, and distribute, including for commercial purposes.

## Acknowledgments

- The terminal engine and virtual file system are original implementations.
- The cyberpunk and quantum themes draw inspiration from design systems by Linear, Vercel, and the broader open-source community.
- Public APIs are credited inline in `apiService.ts`.
