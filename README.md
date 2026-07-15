# WebLinuxOS

A fully functional Linux desktop environment running entirely in the browser — 240+ applications, virtual filesystem, terminal with 150+ commands, and real-time API integrations, all without installation.

[![Live Demo](https://img.shields.io/badge/Live-Demo-4ade80?style=for-the-badge&logo=githubpages&logoColor=white)](https://saya-ch.github.io/WebLinuxOS/)
[![MIT License](https://img.shields.io/badge/License-MIT-22d3ee?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

![WebLinuxOS Desktop](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/01-desktop.png)

## Features

- **Desktop Environment** — Multi-workspace virtual desktops, draggable/resizable windows, taskbar, system tray, start menu with fuzzy search, context menus, and global search
- **Terminal Emulator** — 150+ commands across filesystem, system monitoring, networking, and live public APIs (weather, crypto, news, exchange rates, IP geolocation, Wikipedia, translation)
- **Virtual Filesystem** — Persisted to `localStorage` with full CRUD, multi-format preview, and integration across all applications
- **WebIDE Pro** — In-browser code execution for JavaScript, TypeScript, Python (via Pyodide), HTML, CSS, Markdown, SQL, JSON, and Bash
- **AI Workbench** — Prompt-engineering workbench with 8 specialized tools, quality scoring, auto-enhancement, and 100% local data storage
- **Knowledge Vine** — Zettelkasten-style knowledge base with bidirectional `[[links]]`, tags, and force-directed graph visualization
- **CodeForge** — Developer toolbox with JSON formatter, Base64/URL encoder, regex tester, JWT decoder, hash calculator, and cron parser
- **Live Data Hub** — Real-time dashboard pulling data from Open-Meteo, CoinGecko, Hacker News, Frankfurter, and more
- **Theme System** — Dark and light themes with CSS custom properties, window animations, and glass effects
- **Desktop Widgets** — Clock, system monitor, weather, focus timer, and sticky notes — draggable and persistent

## Live Demo

Open [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/) in any modern browser. No install, no account, no telemetry.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19.2 with concurrent rendering |
| Language | TypeScript 6 (strict mode) |
| State Management | Zustand 5 with debounced persistence |
| Build Tool | Vite 8 (Rolldown-powered) |
| Iconography | Lucide React |
| Python Runtime | Pyodide 0.26 (in-browser) |
| Markdown | Marked |

## Getting Started

### Run locally

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

### Build for production

```bash
npm run build        # outputs to dist/
npm run preview      # serve the production build locally
```

### Deploy to GitHub Pages

The repository includes a GitHub Actions workflow that auto-deploys on push to `main`. Enable it in **Settings > Pages > Source: GitHub Actions**.

Manual deploy:

```bash
npm run build
npx gh-pages -d dist
```

## Project Structure

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/                     # 240+ application components
│   │   │   ├── AIWorkbench.tsx       # Prompt engineering workbench
│   │   │   ├── KnowledgeVine.tsx     # Zettelkasten + knowledge graph
│   │   │   ├── CodeForge.tsx         # Developer toolbox
│   │   │   ├── LiveDataHub.tsx       # Real-time API dashboard
│   │   │   ├── OnlineProgrammingLab.tsx
│   │   │   ├── FileManager.tsx
│   │   │   ├── terminal/             # 150+ terminal commands
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── desktop/              # WindowManager, Taskbar, Desktop
│   │   ├── store/                    # Zustand stores + file utils
│   │   ├── styles/                   # Theme CSS files
│   │   ├── apps.tsx                  # App registry
│   │   ├── store.tsx                 # Global state
│   │   ├── types.ts                  # TypeScript types
│   │   └── App.tsx / main.tsx
│   ├── public/
│   ├── screenshots/
│   ├── vite.config.ts
│   └── package.json
├── .github/
│   └── workflows/deploy.yml
└── README.md
```

## Applications

### Development

| App | Description |
|-----|-------------|
| WebIDE Pro | Multi-language code execution (JS, TS, Python, HTML, CSS, SQL, Markdown, JSON, Bash) |
| Terminal | 150+ commands — filesystem, system monitoring, network tools, live API queries |
| CodeForge | 11 developer tools — JSON formatter, regex tester, JWT decoder, hash calculator, cron parser |
| API Tester | REST API client with configurable HTTP methods and headers |
| Code Diff Viewer | Side-by-side diff comparison with syntax highlighting |

### Productivity

| App | Description |
|-----|-------------|
| FileManager | Full virtual filesystem with CRUD, navigation, and multi-format preview |
| Markdown Editor | Live-preview Markdown editing with export |
| Spreadsheet | Basic spreadsheet with formula support |
| Kanban Board | Drag-and-drop task organization |
| Todo List | Task management with completion tracking |
| Calendar | Date and event management with calendar view |

### AI & Knowledge

| App | Description |
|-----|-------------|
| AI Workbench | Prompt engineering with 8 tools, quality scoring, and local-only storage |
| Knowledge Vine | Zettelkasten with bidirectional links, tags, and force-directed graph |
| AI Assistant | Local AI provider for code analysis, generation, and explanation |

### Internet & Data

| App | Description |
|-----|-------------|
| Live Data Hub | Real-time dashboard — weather, crypto, news, exchange rates, IP geolocation |
| Weather App | OpenWeatherMap integration with current conditions and forecasts |
| GitHub Trending | Discover popular repositories with language and time-period filters |
| Wikipedia Reader | Article search and summaries via Wikipedia API |
| Real-time Translator | Translation across 50+ languages |

### Multimedia & Utilities

| App | Description |
|-----|-------------|
| Music Player | Audio playback with playlist support |
| Paint | Drawing application with brush tools |
| Calculator | Scientific calculator with history |
| Password Manager | Encrypted password storage |
| QR Generator | QR code creation for text, URLs, and contacts |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+L` | Open launcher |
| `Ctrl+K` | Global search |
| `Ctrl+P` | Command palette |
| `Alt+Tab` | Switch windows |
| `Ctrl+Q` | Close window |
| `Ctrl+M` | Minimize window |
| `Ctrl+T` | Open terminal |
| `Ctrl+E` | Open file manager |
| `Ctrl+1-9` | Quick-launch app |
| `Ctrl+Alt+1-9` | Switch virtual desktop |
| `F11` | Fullscreen |

## Contributing

Contributions are welcome — bug reports, new applications, terminal commands, translations, or documentation improvements.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-app`)
3. Commit your changes (`git commit -m 'Add my app'`)
4. Push to the branch (`git push origin feature/my-app`)
5. Open a Pull Request

### Adding a new application

1. Create `src/apps/MyApp.tsx` exporting a memoized component
2. Create `src/apps/MyApp.css` with scoped styles using CSS variables
3. Add a registry entry to `src/apps.tsx`
4. Add the lazy import to `src/components/desktop/WindowManager.tsx`

### Adding a terminal command

1. Choose the appropriate file in `src/apps/terminal/`
2. Register the command with `registerCommand`
3. Add documentation to the `help` command

## License

[MIT](LICENSE)
