# WebLinuxOS

A fully functional Linux desktop environment running entirely in the browser — 240+ applications, virtual filesystem, terminal with 160+ commands, and real-time API integrations, all without installation.

[![Live Demo](https://img.shields.io/badge/Live-Demo-4ade80?style=for-the-badge&logo=githubpages&logoColor=white)](https://saya-ch.github.io/WebLinuxOS/)
[![MIT License](https://img.shields.io/badge/License-MIT-22d3ee?style=for-the-badge)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

![WebLinuxOS Desktop](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/01-desktop.png)

## Overview

WebLinuxOS is not just a simulation — it's a fully functional web-based operating system that provides real productivity tools and development utilities. Unlike traditional desktop OS simulations, WebLinuxOS integrates with 20+ public APIs and includes practical tools for developers, students, and professionals.

## Key Features

### Real-World Functionality

- **Code Execution**: Run JavaScript, TypeScript, and Python (via Pyodide) directly in the browser
- **API Integration**: Access real-time data from weather, cryptocurrency, news, and GitHub APIs
- **File Management**: Full virtual filesystem with CRUD operations and multi-format preview
- **Development Tools**: Code formatters, JSON validators, API testers, and snippet generators

### Terminal Commands (160+)

Beyond standard Linux commands, WebLinuxOS includes practical utilities:

```
# Development Tools
snippet react MyComponent    # Generate React component
json format '{"data":123}'   # Format JSON
encode base64 "Hello World"  # Encode/decode utilities

# Productivity
password 16 5                 # Generate strong passwords
color #3498db                # Color conversion tool
timestamp 1609459200000      # Timestamp conversion

# Real-time Data
weather beijing              # Weather information
news                        # Latest Hacker News
crypto bitcoin ethereum      # Cryptocurrency prices
```

### API Integrations (20+)

| Category | APIs | Use Case |
|----------|------|----------|
| Weather | Open-Meteo | Current conditions and forecasts |
| Finance | CoinGecko, ExchangeRate-API | Crypto prices and currency conversion |
| News | Hacker News, Spaceflight News API | Tech and space news |
| Developer | GitHub API | User profiles, repo search |
| Fun | JokeAPI, Cat Fact, Dog CEO | Random content |
| Analysis | Nationalize, Agify, Genderize | Name analysis |

### Desktop Environment

## Table of Contents

- [Features](#features)
- [Live Demo](#live-demo)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Applications](#applications)
- [Terminal Commands](#terminal-commands)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [API Integrations](#api-integrations)
- [Contributing](#contributing)
- [License](#license)

## Features

### Desktop Environment

- Multi-workspace virtual desktops with drag-and-drop window management
- Resizable, minimizable, and maximizable windows with smooth animations
- Taskbar with window switching, system tray, and notification center
- Start menu with fuzzy search and categorized application listings
- Global search across applications, files, and commands
- Context menus for desktop and file operations
- Dark and light themes with glass-morphism effects

### Terminal Emulator

- 150+ commands covering filesystem operations, system monitoring, and networking
- Real-time API queries: weather, cryptocurrency prices, news, translation, and more
- Command history with up/down arrow navigation
- Tab completion for commands and file paths
- Syntax highlighting and color output support
- Built-in help system with detailed command documentation

### Virtual Filesystem

- Persisted to `localStorage` with automatic debounced saves
- Full CRUD operations: create, read, update, delete, copy, move, rename
- Multi-format file preview and editing
- File search across the entire filesystem
- Undo/redo support for file operations
- Directory tree visualization

### Development Tools

- **WebIDE Pro**: In-browser code execution for JavaScript, TypeScript, Python (via Pyodide), HTML, CSS, Markdown, SQL, JSON, and Bash
- **CodeForge**: Developer toolbox with JSON formatter, Base64/URL encoder, regex tester, JWT decoder, hash calculator, and cron parser
- **API Tester**: REST API client with configurable HTTP methods and headers
- **Code Diff Viewer**: Side-by-side diff comparison with syntax highlighting

### AI & Knowledge

- **AI Workbench**: Prompt-engineering workbench with 8 specialized tools, quality scoring, and auto-enhancement
- **Knowledge Vine**: Zettelkasten-style knowledge base with bidirectional `[[links]]`, tags, and force-directed graph visualization
- **AI Assistant**: Local AI provider for code analysis, generation, and explanation without external API calls

### Live Data Hub

- Real-time dashboard pulling data from multiple public APIs
- Weather forecasts from Open-Meteo
- Cryptocurrency prices from CoinGecko
- News from Hacker News
- Exchange rates from Frankfurter
- IP geolocation and Wikipedia summaries

## Live Demo

Open [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/) in any modern browser. No installation, no account registration, no telemetry.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2 |
| Language | TypeScript | 6.0 |
| State Management | Zustand | 5.0 |
| Build Tool | Vite | 8.0 |
| Iconography | Lucide React | Latest |
| Python Runtime | Pyodide | 0.26 |
| Markdown | Marked | Latest |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Run Locally

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

The development server starts at `http://localhost:5173`.

### Build for Production

```bash
npm run build        # Outputs to dist/
npm run preview      # Serve the production build locally
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
│   │   │   ├── FileManager.tsx       # Virtual filesystem browser
│   │   │   ├── Terminal.tsx          # Terminal emulator
│   │   │   ├── terminal/             # Terminal command implementations
│   │   │   │   ├── commands.ts       # Command registry and types
│   │   │   │   ├── fileCommands.ts   # File system commands
│   │   │   │   ├── systemCommands.ts # System commands
│   │   │   │   └── extendedCommands.ts # Extended commands
│   │   │   └── ...
│   │   ├── components/
│   │   │   └── desktop/              # Desktop components
│   │   │       ├── WindowManager.tsx # Window rendering and management
│   │   │       ├── Window.tsx        # Individual window component
│   │   │       ├── Taskbar.tsx       # Taskbar and system tray
│   │   │       └── Desktop.tsx       # Desktop background and icons
│   │   ├── store/                    # Zustand stores and utilities
│   │   │   ├── store.tsx             # Global state management
│   │   │   ├── fileUtils.ts          # File system utilities
│   │   │   ├── storageUtils.ts       # Local storage utilities
│   │   │   └── defaults.tsx          # Default data and configurations
│   │   ├── services/                 # API and utility services
│   │   │   ├── apiService.ts         # Real-time API integrations
│   │   │   └── aiService.ts          # AI service abstraction
│   │   ├── utils/                    # Shared utilities
│   │   │   └── logger.ts             # Unified logging system
│   │   ├── styles/                   # Theme and global styles
│   │   ├── apps.tsx                  # Application registry
│   │   ├── types.ts                  # TypeScript type definitions
│   │   ├── App.tsx                   # Root application component
│   │   └── main.tsx                  # Application entry point
│   ├── public/                       # Static assets
│   ├── screenshots/                  # Project screenshots
│   ├── vite.config.ts                # Vite configuration
│   └── package.json                  # Dependencies and scripts
├── .github/
│   └── workflows/deploy.yml          # GitHub Actions deployment
└── README.md
```

## Applications

### Development Tools

| Application | Description |
|-------------|-------------|
| WebIDE Pro | Multi-language code execution with Python support via Pyodide |
| Terminal | 150+ commands with live API integrations |
| CodeForge | JSON formatter, regex tester, JWT decoder, hash calculator, cron parser |
| API Tester | REST API client with full HTTP method support |
| Code Diff Viewer | Side-by-side diff comparison |

### Productivity

| Application | Description |
|-------------|-------------|
| FileManager | Full virtual filesystem with multi-format preview |
| Markdown Editor | Live-preview Markdown editing |
| Spreadsheet | Basic spreadsheet with formula support |
| Kanban Board | Drag-and-drop task organization |
| Todo List | Task management with completion tracking |
| Calendar | Date and event management |

### AI & Knowledge

| Application | Description |
|-------------|-------------|
| AI Workbench | Prompt engineering with 8 tools and quality scoring |
| Knowledge Vine | Zettelkasten with bidirectional links and graph visualization |
| AI Assistant | Local AI code analysis and generation |

### Internet & Data

| Application | Description |
|-------------|-------------|
| Live Data Hub | Real-time dashboard for weather, crypto, news, and exchange rates |
| Weather App | Current conditions and forecasts |
| GitHub Trending | Popular repositories with filters |
| Wikipedia Reader | Article search and summaries |
| Translator | Translation across 50+ languages |

### Multimedia & Utilities

| Application | Description |
|-------------|-------------|
| Music Player | Audio playback with playlist support |
| Paint | Drawing application with brush tools |
| Calculator | Scientific calculator with history |
| Password Manager | Encrypted password storage |
| QR Generator | QR code creation |

## Terminal Commands

### File System

```
ls      - List directory contents
cd      - Change working directory
pwd     - Print working directory
cat     - Display file contents
head    - Display first lines of a file
tail    - Display last lines of a file
mkdir   - Create directory
touch   - Create empty file or update timestamp
rm      - Remove file or directory
cp      - Copy file or directory
mv      - Move or rename file
tree    - Display directory tree
grep    - Search file contents
find    - Find files by name
```

### System Commands

```
whoami          - Display current user
hostname        - Display hostname
date            - Display date and time
cal             - Display calendar
uname           - Display system information
uptime          - Display system uptime
ps              - Display process list
top             - Display system monitor
kill            - Terminate process
sysinfo         - Display detailed system information
neofetch        - Display system information in ASCII art
```

### Online Tools

```
weather         - Get weather information for any city
news            - Get latest news from Hacker News
crypto          - Get cryptocurrency prices
stock           - Get stock prices from Yahoo Finance
quote           - Get random inspirational quote
joke            - Get a random joke
define          - Look up word definitions
translate       - Translate text between languages
currency        - Convert currency using real exchange rates
ip              - Get public IP address
curl            - Send HTTP request
```

### Help

```
help            - Display command help
help <command>  - Display detailed help for a specific command
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

## API Integrations

WebLinuxOS integrates with the following public APIs:

| API | Service | Usage |
|-----|---------|-------|
| OpenWeatherMap | Weather data | Current conditions worldwide |
| CoinGecko | Cryptocurrency | Real-time prices and market data |
| Yahoo Finance | Stock prices | Real-time stock quotes |
| NewsAPI | News | Latest headlines |
| LibreTranslate | Translation | Multi-language translation |
| Quotable | Quotes | Random inspirational quotes |
| JokeAPI | Humor | Random jokes in multiple languages |
| Free Dictionary | Dictionary | Word definitions and examples |
| ExchangeRate-API | Currency | Real-time exchange rates |
| IPify | Geolocation | Public IP address |

All APIs are free, open, and do not require authentication keys.

## Contributing

Contributions are welcome — bug reports, new applications, terminal commands, translations, or documentation improvements.

### How to Contribute

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes with a clear message
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

### Adding a New Application

1. Create `src/apps/MyApp.tsx` with a memoized component
2. Add a registry entry to `src/apps.tsx`
3. Add the lazy import to `src/components/desktop/WindowManager.tsx`

### Adding a Terminal Command

1. Add to the appropriate command file in `src/apps/terminal/`
2. Register with `registerCommand(name, definition)`
3. Include description, usage, and examples

## License

[MIT](LICENSE)

## Acknowledgements

- React team for the UI framework
- Vite team for the build tool
- Pyodide team for in-browser Python support
- Lucide team for the icon library
- All API providers for free access to their services