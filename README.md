# WebLinuxOS

> **An open-source, browser-based desktop environment that runs in a single tab.**
> 100% client-side. Zero installation. 200+ ready-to-use mini apps.

[![Live Demo](https://img.shields.io/badge/Live-saya--ch.github.io-blueviolet)](https://saya-ch.github.io/WebLinuxOS/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646cff)](https://vite.dev)

WebLinuxOS is a fully interactive Linux-like desktop environment that lives entirely
inside your browser. It ships with a window manager, a virtual filesystem, a real
shell with 160+ commands, and 200+ application launchers covering developer tools,
media, productivity, learning, and creative work.

All state is persisted in `localStorage`. No backend. No tracking. No build step
required to use it — just open the URL.

---

## Highlights

- **Real window manager** — drag, resize, minimize, maximize, multi-monitor-style tiling
- **Real terminal** — pipe, redirect, scripting, history, autocomplete, color escape codes
- **200+ applications** — file manager, code editor (Monaco), IDE, image viewer, video player, music studio, drawing app, 3D viewer
- **Live public API integrations** — GitHub trending, Hacker News, Open-Meteo, CoinGecko, NASA APOD, Wikipedia, IP geolocation, and more
- **Customizable desktop** — wallpapers, themes, grid layouts, app dock, lock screen
- **Keyboard-first** — every action has a shortcut, terminal shortcuts follow `readline` conventions
- **Internationalization ready** — UI strings are centralized for future i18n

---

## Live Demo

- **Production:** https://saya-ch.github.io/WebLinuxOS/
- **Local dev:** `cd web-linux && npm install && npm run dev`

---

## Quick Start

### Run locally

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev          # opens http://localhost:5173
```

### Production build

```bash
npm run build        # outputs to ../dist (configured for GitHub Pages)
npm run preview      # preview the production build
```

### Type check

```bash
npm run typecheck
```

---

## Architecture

```
WebLinuxOS/
├── web-linux/                  # Main application package
│   ├── src/
│   │   ├── App.tsx             # Top-level shell, lockscreen, boot sequence
│   │   ├── apps.tsx            # Application registry (200+ entries)
│   │   ├── icons.tsx           # SVG icon set
│   │   ├── store.tsx           # State management (window, fs, user, theme)
│   │   ├── components/         # Reusable UI primitives
│   │   │   ├── desktop/        # Window, WindowManager, Taskbar, Dock
│   │   │   ├── terminal/       # Terminal UI, command parser
│   │   │   └── ...
│   │   ├── apps/               # Application implementations (240+ files)
│   │   ├── services/           # External API clients
│   │   ├── store/              # Virtual filesystem, persistence
│   │   ├── config/             # API keys, feature flags
│   │   ├── utils/              # Helpers (format, parse, etc.)
│   │   └── styles/             # Global CSS
│   ├── public/                 # Static assets, wallpapers, fonts
│   ├── index.html
│   └── vite.config.ts
├── docs/                       # Additional documentation
└── README.md
```

### State Model

- `store.tsx` is the single source of truth for window z-order, focus, geometry,
  user theme, lock state, and app preferences.
- The virtual filesystem (`store/fileUtils.ts`) is a hierarchical JSON tree
  backed by `localStorage`, with a permission system that gates `sudo` and
  ownership checks.
- Each window is rendered lazily through `React.lazy` to keep the initial
  bundle small — opening a heavy app (e.g. the IDE) does not block startup.

### Terminal

The terminal is a real shell interpreter (not a string matcher). It supports:

- 160+ built-in commands (`ls`, `cd`, `cat`, `grep`, `awk`, `sed`, `curl`, `git`, `node`, `python`, `npm`, `docker`, …)
- Pipes (`|`), redirects (`>`, `>>`, `<`), chaining (`;`, `&&`, `||`)
- Background processes (`&`), `jobs`, `kill`
- Tab completion, history (`↑`/`↓`), reverse search (`Ctrl+R`)
- Variable expansion (`$HOME`, `$PATH`)
- Aliases, `export`, `source`, function definitions
- Sandboxed `node` / `python` runners using web workers (subset of stdlib)

---

## Featured Applications

| Category | Examples |
| --- | --- |
| Development | Web IDE Pro (Monaco), CodePen Lite, Code Assistant Pro, Regex Visualizer, HTTP Status Explorer, Git Cheatsheet, CSS Gradient Studio, JSON Formatter, API Health Monitor |
| Productivity | Pomodoro Studio, Markdown Editor, Kanban Board, Habit Tracker, Reading List, Activity Heatmap |
| Media | Music Studio (Web Audio), Video Player, Image Editor, Drawing Pad, 3D Viewer, Screen Recorder |
| Knowledge | Wikipedia, Hacker News Reader, GitHub Trending, Astro Daily (NASA APOD), Dictionary, Translation |
| Finance | Crypto Tracker, Stock Portfolio, Currency Converter, Loan Calculator |
| Creative | Pixel Art, Music Synthesizer, Color Palette Generator, ASCII Art Studio |
| System | File Manager, Terminal, Settings, Theme Editor, Process Manager, Network Monitor, System Monitor Dashboard |
| Games | 2048, Minesweeper, Snake, Sudoku, Chess, Solitaire, Tetris |

…and many more. Browse the dock or `ls /apps` in the terminal to discover them all.

---

## Keyboard Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl/⌘ + Space` | Open application launcher |
| `Alt + Tab` | Cycle focused window |
| `Alt + F4` | Close focused window |
| `Super + D` | Show desktop |
| `Super + L` | Lock screen |
| `Ctrl + Alt + T` | Open terminal |
| `F11` | Toggle fullscreen |
| `Esc` | Exit fullscreen / cancel dialog |

Inside the terminal:

| Shortcut | Action |
| --- | --- |
| `Ctrl + L` | Clear screen |
| `Ctrl + C` | Cancel current process |
| `Ctrl + R` | Reverse search history |
| `Tab` | Autocomplete command / path |
| `↑` / `↓` | Navigate history |

---

## Public API Integrations

All API integrations use key-less public endpoints wherever possible, so the
project runs on GitHub Pages without any environment configuration. Services
that require keys (OpenWeatherMap, NewsAPI, ExchangeRate) read from
`VITE_*` environment variables and fall back to a `demo_key` placeholder.

| Service | Used For | Auth |
| --- | --- | --- |
| [Open-Meteo](https://open-meteo.com) | Weather forecast | None |
| [CoinGecko](https://coingecko.com) | Crypto prices | None |
| [Hacker News](https://github.com/HackerNews/API) | News reader | None |
| [GitHub REST](https://docs.github.com/en/rest) | Trending repos | None |
| [Wikipedia REST](https://en.wikipedia.org/api/rest_v1/) | Knowledge | None |
| [NASA APOD](https://github.com/nasa/apod-api) | Astronomy | `DEMO_KEY` (free) |
| [ExchangeRate-API](https://www.exchangerate-api.com) | Currency | Optional |
| [ipapi](https://ipapi.co) | IP geolocation | None |
| [OpenWeatherMap](https://openweathermap.org/api) | Weather | Optional |
| [NewsAPI](https://newsapi.org) | News | Optional |
| [Advice Slip](https://api.adviceslip.com) | Daily advice | None |
| [Quotable](https://github.com/lukePeavey/quotable) | Quotes | None |
| [JokeAPI](https://v2.jokeapi.dev) | Jokes | None |
| [MyMemory](https://mymemory.translated.net) | Translation | None |
| [Cat Facts](https://catfact.ninja) | Cat facts | None |
| [Dog CEO](https://dog.ceo/dog-api) | Dog images | None |
| [Random User](https://randomuser.me) | User data | None |
| [Nationalize / Agify / Genderize](https://genderize.io) | Name analysis | None |
| [Spaceflight News](https://spaceflightnewsapi.net) | Space news | None |

> No user data is sent to any of these services beyond the request required to
> fetch the resource. There is no analytics, telemetry, or third-party tracking.

---

## Deployment

WebLinuxOS is a pure SPA. The build outputs to `web-linux/dist/`.

### GitHub Pages (automated)

1. Ensure your default branch is `main` and GitHub Pages is configured to serve
   from the `gh-pages` branch (or the `/` root of `main`).
2. The project includes a workflow at `.github/workflows/deploy.yml` that
   builds and deploys on every push to `main`.
3. Visit `https://<username>.github.io/WebLinuxOS/`.

### Static hosting

Upload the contents of `web-linux/dist/` to any static host (Netlify, Vercel,
Cloudflare Pages, S3, nginx). No server-side configuration is required.

### Environment Variables (optional)

Create `web-linux/.env` to override API keys:

```ini
VITE_OPENWEATHERMAP_API_KEY=your_key
VITE_NEWSAPI_KEY=your_key
VITE_EXCHANGERATE_API_KEY=your_key
VITE_NASA_API_KEY=your_key
```

---

## Contributing

Contributions are welcome. Please open an issue first to discuss substantial
changes — for typo fixes and small improvements, feel free to send a PR directly.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run `npm run typecheck && npm run build` to verify
5. Open a pull request

When adding a new app:

- Add a new file under `web-linux/src/apps/`
- Register it in `web-linux/src/apps.tsx` with a stable `id`, an icon, a category
  (`system`, `development`, `utilities`, `office`, `creative`, `media`, `fun`,
  `knowledge`, `finance`, `security`)
- Register the lazy import in `web-linux/src/components/desktop/WindowManager.tsx`
- Keep the component self-contained; do not import global CSS variables from
  outside the theme tokens

When adding a new terminal command:

- Add the implementation under `web-linux/src/apps/terminal/`
- Register the command in the command dispatcher
- Update the help output in `commands/help.ts`

---

## Roadmap

- [ ] PWA manifest + offline support via service worker
- [ ] Multi-language UI (i18n)
- [ ] End-to-end test suite with Playwright
- [ ] Plugin system: load third-party apps at runtime from a manifest URL
- [ ] WebRTC peer-to-peer screen sharing
- [ ] Real file I/O via the File System Access API (Chromium)

---

## License

MIT — see [LICENSE](LICENSE).

You are free to use, modify, and redistribute, including for commercial
purposes, as long as you preserve the copyright notice.

---

## Acknowledgments

- The window manager, terminal, and virtual filesystem are original work.
- The project draws inspiration from [linux.js](https://github.com/hrtowii/linux.js),
  [WebSH](https://github.com/nicedoc/web-sh), and the broader community of
  browser-based desktop experiments.
- Wallpapers included in `public/wallpapers/` are royalty-free CC0 from Unsplash
  and Pexels, unless otherwise noted.
- All trademarks and registered trademarks remain the property of their
  respective owners.

## Star History

If WebLinuxOS is useful to you, consider giving it a star — it helps the
project reach more people.

---

Made with care by [saya-ch](https://github.com/saya-ch) and contributors.
