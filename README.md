# WebLinuxOS

**A complete Linux desktop environment that runs entirely in your browser.** No installation, no backend, no API keys.

[![Live Demo](https://img.shields.io/badge/Live_Demo-saya--ch.github.io-7c3aed?style=flat-square)](https://saya-ch.github.io/WebLinuxOS/)
[![Version](https://img.shields.io/badge/Version-41.0-0ea5e9?style=flat-square)](https://github.com/saya-ch/WebLinuxOS/releases)
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
- **Real public APIs** for AI chat, image generation, weather, news, crypto, exchange rates, GitHub trending, Wikipedia, and more — no keys required.

The goal is to demonstrate that the modern web platform is good enough to host a productive desktop-class environment, while also being a useful tool in its own right.

---

## What's New in v41

This release ships two brand-new creative-workflow apps, fixes a class of bugs uncovered by a codebase-wide audit, and unifies version management so `lsb_release`, `neofetch`, `version`, and `about` all report the same number as `package.json`.

### PromptForge — Prompt Engineering Studio

A dedicated workspace for prompt engineers, content creators, and AI power users. Unlike Nexus AI (a general chat), PromptForge treats the prompt itself as the artifact you manage, iterate on, and optimize.

- **Curated template library** across 6 categories (writing, coding, analysis, creative, education, marketing) plus custom user templates.
- **Variable interpolation** with `{{var}}` syntax. Variables are auto-extracted from the template and rendered as fill-in fields.
- **Live testing** against any Pollinations.ai model with adjustable temperature and streaming output.
- **One-click optimize** — ask GPT-4o to critique and rewrite your prompt as a world-class prompt engineer would.
- **History** — every run (input, output, model, temperature, duration) is persisted for review.
- **Import / export** templates as JSON for sharing across teams.
- **Favorites, tags, and full-text search** for navigating large template libraries.

### WebSnapshot — Web Page Snapshot Analyzer

A real working tool for capturing and analyzing any web page, powered by the free [microlink.io](https://microlink.io) API.

- **One URL, full metadata**: title, description, favicon, OG image, author, publisher, language, publish date.
- **Three device viewports**: desktop (1440×900), tablet (768×1024), mobile (375×812).
- **Side-by-side compare mode** — pick any two snapshots and view them together.
- **Download screenshots** as PNG with a single click.
- **Local history** (up to 100 entries) with favorites, search, and JSON export.

### Code Quality & Stability

A full audit of the terminal command system and network layer produced the following fixes:

- **Resolved duplicate command registration**: `utilityCommands.ts` was overwriting full implementations from `systemCommands.ts` and `fileCommands.ts` with simplified stubs. The conflicting stubs (`date`, `uname`, `head`, `tail`, `wc`, `sort`, `uniq`) have been removed; `registerCommand` now warns on duplicates in dev mode.
- **Fixed CoinGecko currency code**: `vs_currencies=usd,cnc` (invalid) → `vs_currencies=usd,cny`.
- **Eliminated mixed-content violations**: `astronauts`, `iss`, `numbersApi` endpoints upgraded from `http://` to `https://` so they work on HTTPS-deployed Pages.
- **Stopped `ping` from fabricating data**: previously returned fake `192.168.x.x` IPs and random RTTs on DNS failure; now reports the real resolution error.
- **Replaced MD5 in `hash` command**: Web Crypto API doesn't support MD5; `hash --md5` now suggests SHA-384 and explains why.
- **Fixed operator-precedence bug in `joke` command** that returned "暂无笑话" even when data was present.
- **Bounded `fileOperationHistory`** to 100 entries to prevent unbounded memory growth in long sessions.
- **Cleaned up `windowSnapshots`** on `clearWindows` to release unused preview thumbnails.
- **De-duplicated lazy-import Promises** in `WindowManager.loadComponent` — the same dynamic import was being fired twice (once for `React.lazy`, once for the loading-state side effect).
- **Added CORS guidance** to the `stock` command since Yahoo Finance blocks browser requests.

### Version Injection

`__APP_VERSION__` is now defined once in `vite.config.ts` (read from `package.json`) and consumed everywhere through Vite's `define`. Previously the version string was hardcoded in `systemCommands.ts` (4 places) and would silently drift. `__BUILD_TIME__` is also injected for the `version` command.

---

## What's New in v40

This release transforms WebLinuxOS from a "Linux simulator" into a working productivity platform with real, networked capabilities.

### Nexus AI — Real Conversational AI

A full chat application powered by [Pollinations.ai](https://pollinations.ai), a free, key-less AI gateway. No accounts, no API keys, no rate limits to configure.

- **Multi-model**: GPT-4o, DeepSeek V3, Llama 3.3, Mistral Small, Qwen 2.5, and more.
- **Streaming responses** via Server-Sent Events with per-token rendering.
- **Image generation** through the `/image` command (FLUX.1 model, 1024×1024).
- **Multi-conversation** with persistent history stored locally.
- **Adjustable temperature** and per-message model switching.
- **Markdown rendering** with code blocks, tables, and inline images.

Open the launcher and search for **NexusAI** to start chatting. Try:

```
/image a cyberpunk cat wearing a VR headset, neon colors
Explain how WebAssembly works to a 5-year-old
Translate "你好世界" to English, Japanese, French, and German
```

### Cloud Clipboard — Cross-Device Snippet Sync

A clipboard manager that actually syncs across devices using [GitHub Gist](https://gist.github.com) as the backing store.

- **Local-first**: All snippets persist to `localStorage` even offline.
- **Gist sync**: Optional one-click push/pull to a private Gist for cross-device access.
- **Shareable URLs**: Generate self-contained share links that decode on load.
- **Syntax detection**: Automatically identifies JSON, HTML, CSS, JS, TS, Python, Bash, Markdown.
- **Tag filtering** and full-text search across all entries.
- **Token management**: GitHub PAT stored only in `localStorage`, with verify-and-revoke UI.

### AI Terminal Commands

Eight new commands bring the AI assistant into the terminal workflow:

| Command | Action |
|---------|--------|
| `ai "prompt"` | One-shot AI completion |
| `ai-chat` | Interactive multi-turn chat |
| `ai-image "prompt"` | Generate image, return URL |
| `ai-models` | List available Pollinations models |
| `ai-translate "text" --to en` | Translate text |
| `ai-explain "code or concept"` | Get an explanation |
| `ai-code "task description"` | Generate code |
| `clear-ai` | Clear terminal AI session history |

### Other Improvements

- Fixed Content Security Policy that was blocking Google Fonts on the deployed site.
- `APP_REGISTRY_EXTRAS` is now correctly spread into the main registry (previously extensions were defined but never registered).
- Type safety hardened across the new services.
- README rewritten to reflect the v40 surface area.

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
| AI | `ai`, `ai-chat`, `ai-image`, `ai-models`, `ai-translate`, `ai-explain`, `ai-code` |
| Utilities | `base64`, `url-encode`, `hash`, `uuidgen`, `jwt-decode`, `qrcode`, `color`, `calc` |
| Languages | `python` (Pyodide 3.11 runtime with full stdlib) |
| Misc | Pipes, redirects, background processes, command history, tab completion |

### Apps

The launcher ships 200+ integrated apps across 8 categories. Curated highlights:

- **PromptForge** — prompt engineering studio with template library, variable interpolation, live testing, and one-click AI optimization.
- **WebSnapshot** — capture any web page's screenshot and metadata across desktop / tablet / mobile viewports.
- **Nexus AI** — real multi-model AI chat with streaming and image generation.
- **Cloud Clipboard** — Gist-synced snippet manager with shareable URLs.
- **Snap Studio** — Canvas 2D image editor with filters, presets, multi-format export.
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
| Pollinations.ai | AI chat, image generation, vision models |
| microlink.io | Web page screenshots and metadata extraction |
| GitHub Gist | Cloud clipboard sync (optional, PAT required) |
| Open-Meteo | Weather & forecast |
| Open-Meteo Geocoding | City name → coordinates |
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
| wheretheiss.at | Real-time ISS satellite position |
| howmanypeopleareinspacerightnow.com | Astronaut headcount |
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
    │   ├── main.tsx                   # CSP, boot, Google Fonts
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
    │   │   ├── NexusAI.tsx            # Real AI chat (Pollinations.ai)
    │   │   ├── PromptForge.tsx        # Prompt engineering studio
    │   │   ├── WebSnapshot.tsx        # Web page snapshot analyzer (microlink.io)
    │   │   ├── CloudClipboard.tsx     # Gist-synced clipboard manager
    │   │   ├── SnapStudio.tsx         # Canvas-based image editor
    │   │   ├── GitHubExplorer.tsx     # Real GitHub API integration
    │   │   └── ...
    │   ├── services/
    │   │   ├── apiService.ts          # Typed API clients (strict types)
    │   │   ├── aiService.ts           # Pollinations.ai chat / image / stream
    │   │   └── clipboardService.ts    # Gist sync, share URLs, language detect
    │   ├── config/
    │   │   └── apiConfig.ts           # All endpoint URLs in one place
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

The project compiles with `strict: true`. The full API surface is checked at compile time, including AI messages (`AIMessage`), clipboard items (`ClipboardItem`), and all external API responses (`GitHubUser`, `GitHubRepo`, `ExchangeRates`, `IPInfo`, `JokeData`, `RandomUser`, `BoredActivity`, `NameAnalysis`, `SpaceArticle`).

### AI service design

`aiService.ts` wraps Pollinations.ai behind three primitives — `chat()`, `streamChat()`, `generateImage()` — so any future model swap is a one-file change. SSE parsing is done manually to avoid pulling in an event-source dependency. The terminal commands in `apps/terminal/aiCommands.ts` reuse the same service, ensuring consistent behavior between the chat app and the shell.

### Cloud clipboard design

`clipboardService.ts` is local-first: every mutation lands in `localStorage` immediately, then optionally propagates to GitHub Gist. Shareable URLs encode the snippet as a compressed query parameter, so recipients don't need a Gist or a token to read what was shared. Language detection is heuristic-based (regex + structural checks) to keep the bundle small.

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

The `VITE_BASE_PATH` for GitHub Pages is `/WebLinuxOS/` and is applied during the `build:github` script. CSP headers in `main.tsx` are scoped to allow only the legitimate external endpoints (Pollinations, GitHub, fonts, and the public APIs listed above).

---

## Privacy

WebLinuxOS runs entirely client-side. No analytics, no telemetry, no third-party trackers.

- Conversations with Nexus AI are sent directly from your browser to `pollinations.ai`. They are not stored on any WebLinuxOS server (there is no server).
- The Cloud Clipboard's GitHub token is stored only in your browser's `localStorage`. It is never sent anywhere except `api.github.com`.
- All other data (file system, window state, notes, settings) lives in `localStorage` and never leaves your device unless you explicitly invoke a sync feature.

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/my-feature`.
3. Make your changes; verify with `npm run typecheck && npm run build`.
4. Open a Pull Request with a clear description of the change.

### Adding a new app

1. Create `web-linux/src/apps/MyApp.tsx`.
2. Add a lazy import in `web-linux/src/components/desktop/WindowManager.tsx#componentMap`.
3. Register metadata in `web-linux/src/apps.tsx#appRegistry` (or append to `APP_REGISTRY_EXTRAS`).

The build pipeline will fail if any app is registered without an existing component.

### Adding a new terminal command

1. Create `web-linux/src/apps/terminal/myCommands.ts`.
2. Use `registerCommand('my-cmd', { handler, description, usage, examples })`.
3. Add `import './myCommands'` to `web-linux/src/apps/terminal/index.ts`.

Commands are automatically picked up by `help`, tab completion, and the command palette.

---

## Roadmap

- Voice input for Nexus AI via the Web Speech API.
- PWA install with offline shell.
- Collaborative whiteboard over WebRTC.
- File system persistence to IndexedDB for larger quotas.
- More AI providers (OpenAI-compatible, Anthropic, local via WebLLM).

---

## License

[MIT](LICENSE) — Free to use, modify, and distribute, including for commercial purposes.

## Acknowledgments

- The terminal engine and virtual file system are original implementations.
- AI capabilities are powered by [Pollinations.ai](https://pollinations.ai), a free and open AI gateway.
- Web page snapshots are powered by [microlink.io](https://microlink.io), a free API for extracting metadata and screenshots from any URL.
- Cloud sync uses the [GitHub Gist API](https://docs.github.com/en/rest/gists).
- The cyberpunk and quantum themes draw inspiration from design systems by Linear, Vercel, and the broader open-source community.
- All other public APIs are credited inline in `apiService.ts` and `apiConfig.ts`.
