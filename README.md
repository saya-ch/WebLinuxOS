# WebLinuxOS

> A complete Linux desktop environment running entirely in your browser — 240+ applications, virtual filesystem, terminal emulator, real-time API integrations, and a set of production-grade productivity tools, all without installation.

[![Live Demo](https://img.shields.io/badge/Live-Demo-4ade80?style=for-the-badge&logo=githubpages&logoColor=white)](https://saya-ch.github.io/WebLinuxOS/)
[![MIT License](https://img.shields.io/badge/License-MIT-22d3ee?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-fbbf24?style=for-the-badge)](CONTRIBUTING.md)

![WebLinuxOS Desktop](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/01-desktop.png)

## Why WebLinuxOS

Most web "OS" demos are toy interfaces with one or two hardcoded windows. WebLinuxOS is a serious attempt at building a working desktop environment in the browser — and layering on top of it a set of real, useful applications that you can actually use day-to-day:

- **A real desktop environment** with multiple virtual desktops, draggable resizable windows, taskbar, system tray, start menu, global search, command palette, and theme switching.
- **A real terminal** with 150+ commands including filesystem operations, system monitoring, and direct calls to live public APIs (weather, crypto, news, exchange rates, IP geolocation, Wikipedia, translation).
- **A real virtual filesystem** persisted to `localStorage` with full CRUD, multi-format preview, and integration with every app.
- **A real coding lab** that executes JavaScript, TypeScript, Python (via Pyodide), HTML, CSS, Markdown, SQL, JSON and Bash in the browser.
- **Three new productivity-grade apps** shipping in this release — see below.

## What's New in v37.0

This release focuses on core system enhancements and real-world utility:

- **Real File System Access**: Integration with File System Access API for true local file operations
- **Enhanced AI Assistant**: Local AI provider for code analysis, generation, and explanation without external dependencies
- **Performance Optimizations**: Improved lazy loading, memory management, and caching strategies
- **Better Developer Tools**: Enhanced terminal commands and debugging capabilities

This release also adds two new integrated API applications:

### WeatherApp

A comprehensive weather application that integrates with OpenWeatherMap API to provide real-time weather data for any city worldwide. Features current temperature, feels-like temperature, humidity, wind speed, cloud coverage, sunrise/sunset times, and coordinates display.

### GitHubTrendingApp

Discover the most popular open-source projects on GitHub with language filtering and time period selection (daily, weekly, monthly). View repository details including stars, forks, programming language, and trending metrics.

For v36.0 features, see [Previous Releases](#previous-releases).

### Previous Releases (v36.0)

This release added three new flagship applications that move WebLinuxOS beyond a simulation and into the territory of an actually useful tool.

### WebIDE Pro

A comprehensive online programming environment that runs entirely in the browser. Supports 8 programming languages including JavaScript, TypeScript, Python (via Pyodide), HTML, CSS, SQL, Markdown, and JSON. Features real-time code execution, file management, AI-assisted coding suggestions, and HTML preview.

Features:
- 8 programming languages with syntax templates
- Real-time code execution with performance metrics
- Multi-file project management
- AI programming assistant integration
- HTML/CSS live preview
- Code download and export

### AI Workbench

A prompt-engineering workbench designed for working with large language models. Built-in templates for code review, technical design documents, blog posts, localization, meeting minutes, data analysis, bug diagnosis, and product ideation. Includes a prompt-quality scorer, automatic enhancement of underspecified prompts, multi-tab workspace, full history with star/favorite, and local persistence.

![AI Workbench](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/ai-workbench.png)

Features:
- 8 specialized tools: prompt engineer, optimizer, code assistant, translator, summarizer, analyzer, polisher, brainstormer
- 8 production-grade templates covering engineering, writing and analysis tasks
- Token estimation, output history with search, copy/download, multi-tab workflow
- 100% local — no data sent to any server

### Knowledge Vine

A Zettelkasten-style second brain with bidirectional links, tags, categories, and a force-directed knowledge graph. Use `[[note title]]` to link notes automatically, `#tag` to categorize, and switch to graph view to see your knowledge as an actual network.

![Knowledge Vine](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/knowledge-vine.png)

Features:
- 5 categories (concept, project, resource, insight, question) with counts
- Bidirectional `[[link]]` auto-detection, back-references panel, mention resolution
- Force-directed knowledge graph with drag, hover highlight, and click-to-open
- Full-text search across title, content, and tags
- JSON export for backup, local-first storage

### CodeForge

A developer toolbox that runs entirely in the browser. Eleven focused tools covering the things you actually need when writing code: JSON formatting, Base64/URL encoding, regex testing with live highlight, color conversion, timestamp conversion, cron expression parser, JWT decoder, hash calculator, string utilities, and URL parameter parser.

![CodeForge](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/codeforge.png)

Features:
- 11 tools with syntax highlighting, error feedback, copy/download
- Regex tester with real-time match highlighting and capture group display
- Cron expression parser with natural-language description
- JWT decoder with expiration warning
- Color picker with HEX/RGB/HSL conversion and 100-1000 shade palette
- Hash calculator (SHA-256, SHA-1, MD5)
- 100% client-side, zero data transmission

## Live Data Hub

Beyond the new apps, the **Live Data Hub** remains one of WebLinuxOS's most useful features — a single dashboard that pulls real data from public APIs:

| Data Source | Provider | Refresh |
|-------------|----------|---------|
| Weather (current, hourly, daily, UV index) | Open-Meteo | 5 min |
| Cryptocurrency prices, market cap, 24h change | CoinGecko | 1 min |
| Tech news top stories | Hacker News | 2 min |
| Exchange rates for 30+ currencies | Frankfurter | 10 min |
| Network status, latency, IP geolocation | ipapi.co | on demand |
| Wikipedia article summaries | Wikipedia API | on demand |
| Text translation between 50+ languages | MyMemory | on demand |

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Desktop Shell (WindowManager, Taskbar, StartMenu)           │
├──────────────────────────────────────────────────────────────┤
│  Application Registry (apps.tsx, 240+ definitions)           │
│  ├─ Productivity (FileManager, Notes, Calendar, ...)         │
│  ├─ Development (CodeEditor, Terminal, CodeForge, ...)       │
│  ├─ AI & Knowledge (AIWorkbench, KnowledgeVine, ...)         │
│  ├─ Internet (Browser, LiveDataHub, ...)                     │
│  ├─ Multimedia (Music, Video, Image, ...)                   │
│  └─ System (Settings, Monitor, ...)                          │
├──────────────────────────────────────────────────────────────┤
│  Global State (Zustand) + Virtual File System                │
├──────────────────────────────────────────────────────────────┤
│  React 19.2 + TypeScript 6 + Vite 8 (Rolldown)               │
└──────────────────────────────────────────────────────────────┘
```

### Tech Stack

- **React 19.2** with concurrent rendering and `memo`/`useMemo` performance primitives
- **TypeScript 6** in strict mode for type safety
- **Zustand 5** for global state, with debounced persistence
- **Vite 8** powered by **Rolldown** for fast builds and code splitting
- **Lucide React** for iconography
- **Pyodide 0.26** for in-browser Python execution
- **Marked** for Markdown rendering
- **Force-directed graph** drawn on Canvas for the knowledge graph

## Getting Started

### Use it online

Open [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/) in any modern browser. No install, no account, no telemetry.

### Run locally

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

The dev server will start on `http://localhost:5173`.

### Build and preview

```bash
npm run build        # production build to dist/
npm run preview      # serve the production build locally
```

### Deploy to GitHub Pages

The repository includes a GitHub Actions workflow that automatically builds and deploys on every push to `main`. To enable it for your fork, go to **Settings → Pages** and set the source to **GitHub Actions**.

Manual deploy:

```bash
npm run build
npx gh-pages -d dist
```

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

## Terminal

The terminal supports 150+ commands across system, file, network, dev and API categories:

```bash
whoami                 # current user
hostname               # system hostname
uname -a               # kernel info
uptime                 # system uptime
ls / pwd / cd / cat    # filesystem
weather [city]         # current weather
crypto                 # crypto prices
news                   # hacker news
fx 100 USD to EUR      # currency conversion
translate "hello" zh   # translation
wiki "Linux"           # wikipedia lookup
json                   # JSON formatter
base64                 # base64 encoder
hash                   # hash generator
help                   # full command list
```

### Creative Commands

In addition to practical utilities, WebLinuxOS includes a suite of creative commands that turn the terminal into a productivity and creativity tool:

```bash
brainstorm "AI应用"     # 头脑风暴生成创意
story "科幻"            # 生成创意故事
poem "代码"             # 生成诗歌
quote-gen life          # 名言警句 (programming/life/creativity)
joke-gen               # 编程笑话生成器
idea "AI"              # 创新项目创意生成
password-check "pwd"   # 密码强度检测
wordle apple           # Wordle猜词游戏
hangman a              # 猜单词游戏
help-creative          # 查看创意命令列表
```

## Project Structure

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/                     # 240+ application components
│   │   │   ├── AIWorkbench.tsx       # NEW: Prompt engineering workbench
│   │   │   ├── KnowledgeVine.tsx     # NEW: Zettelkasten + graph
│   │   │   ├── CodeForge.tsx         # NEW: Developer toolbox
│   │   │   ├── LiveDataHub.tsx       # Real-time API dashboard
│   │   │   ├── OnlineProgrammingLab.tsx
│   │   │   ├── FileManager.tsx
│   │   │   ├── terminal/             # 150+ terminal commands
│   │   │   └── ... (240+ total)
│   │   ├── components/
│   │   │   └── desktop/              # WindowManager, Taskbar, Desktop
│   │   ├── store/                    # Zustand + file utils + storage
│   │   ├── styles/                   # Theme CSS files
│   │   ├── apps.tsx                  # App registry
│   │   ├── store.tsx                 # Global state
│   │   ├── types.ts                  # TypeScript types
│   │   └── App.tsx / main.tsx
│   ├── public/                       # Static assets
│   ├── screenshots/                  # Documentation screenshots
│   ├── vite.config.ts
│   └── package.json
├── .github/
│   └── workflows/deploy.yml          # Auto-deploy to GitHub Pages
└── README.md
```

## Browser Support

WebLinuxOS targets evergreen browsers:

- Chrome / Edge 90+
- Firefox 88+
- Safari 14+

## Privacy

Everything runs in your browser. No data is sent to any server except the public API calls explicitly triggered by the user (weather, crypto, news, etc.). The virtual filesystem, notes, knowledge graph, and AI Workbench history are all stored in `localStorage` on your device.

## Contributing

Contributions of any size are welcome — bug reports, new apps, new terminal commands, translations, documentation improvements.

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

[MIT](LICENSE) — use it, fork it, learn from it.

## Acknowledgments

- React, TypeScript, Vite, Zustand, and the broader open-source ecosystem
- Lucide for the icon set
- Open-Meteo, CoinGecko, Frankfurter, Hacker News, Wikipedia, and MyMemory for providing free public APIs
- The Niklas Luhmann estate and the broader Zettelkasten community for the note-taking methodology that inspired Knowledge Vine
