<div align="center">

# WebLinuxOS

A Linux-style desktop environment in the browser

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-live-222222?style=flat-square&logo=githubpages)](https://saya-ch.github.io/WebLinuxOS/)

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Features](#features) · [Getting Started](#getting-started) · [Tech Stack](#tech-stack)

</div>

---

## About

WebLinuxOS is a Linux-style desktop environment that runs entirely in the browser, built with React 19 and TypeScript. It provides complete window management, a virtual file system, a terminal emulator with over 150 commands, and a rich suite of built-in applications. All data is persisted to browser localStorage by default.

**Core Features**

- **Browser as Desktop**: No installation required. Open the web page and get a complete desktop experience
- **Virtual File System**: Create, edit, delete, copy, and move files and directories with localStorage persistence
- **Terminal Emulator**: 150+ commands covering file operations, network queries, development tools, system information, and fun utilities
- **Window Management**: Drag, resize, minimize, maximize, multi-workspace support with keyboard shortcuts
- **Developer Toolkit**: JSON formatter, Base64/URL encoding, hash generation, regex testing, QR code generation, REST client, and more
- **Public API Integration**: Real-time data from weather, air quality, cryptocurrency, exchange rates, GitHub, Hacker News, and ISS tracking
- **Themes and Wallpapers**: Dark/light themes, live wallpapers, and desktop widgets

---

## Features

### Core System

| Module | Description |
|--------|-------------|
| Window Management | Multi-window, drag-and-resize, minimize/maximize, z-index layering, workspace isolation |
| Virtual File System | localStorage persistence with common file operations |
| Terminal | 150+ commands with history, auto-completion, aliases |
| Multi-workspace | Up to 9 virtual desktops with cross-workspace window movement |
| Global Search | Ctrl+K to search applications, files, and commands |
| Desktop Widgets | Clock, weather, system monitor, sticky notes, pomodoro timer |

### Applications

| Application | Functionality |
|-------------|---------------|
| File Manager | Tree directory view, file preview, context menu, drag operations |
| Terminal | Full command-line environment with virtual file system integration |
| REST Client | Send HTTP requests, view response headers and body, save request history |
| DevConsole | All-in-one developer console with 10 tools (JSON formatter, Base64/URL encoding, SHA hash, UUID generation, JWT decode, regex testing, color conversion, timestamp conversion, text diff) - all local computation, zero network requests |
| LiveDashboard | Real-time dashboard with cryptocurrency prices (CoinGecko), Hacker News top stories, weather (Open-Meteo), system metrics (FPS/CPU/memory), real-time clock |
| WorldPulse | Real-time data dashboard with cryptocurrency, weather, air quality, ISS, exchange rates, Hacker News |
| Code Snippet Library | Manage code snippets with multi-language categorization and quick copy |
| Notes / Sticky Notes | Markdown notes, sticky note wall, to-do list |
| Workspace Hub | Quick access to applications, system status, weather, quick notes, categorized navigation |
| Games | Snake, Tetris, 2048, Memory Game |

### Network and Data APIs

| Feature | Source | Description |
|---------|--------|-------------|
| Weather | Open-Meteo | Real-time weather and forecasts for cities worldwide |
| Air Quality | Open-Meteo Air Quality | AQI and pollutant data for major cities |
| Cryptocurrency | CoinGecko | Market prices and 24h changes |
| Exchange Rates | open.er-api.com | Major currency exchange rates |
| ISS Tracking | wheretheiss.at | Real-time ISS position |
| Hacker News | Firebase API | Top technology articles |
| GitHub | GitHub API | Repository and user information |
| Translation | MyMemory | Multi-language translation |

Public APIs may be affected by network conditions and CORS policies. Some requests may require a CORS proxy.

---

## Live Demo

**Visit**: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

### Quick Start Guide

1. **Open Applications**: Click desktop icons or find in the start menu
2. **Global Search**: Press Ctrl+K to search applications, files, and commands
3. **Open Terminal**: Press Ctrl+T, type `help` for command list
4. **File Manager**: Press Ctrl+E to open file manager
5. **Switch Workspace**: Press Ctrl+Alt+1-9
6. **Close/Minimize Window**: Ctrl+Q / Ctrl+M

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm

### Installation

```bash
# Clone repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev

# Open browser at http://localhost:5173/WebLinuxOS/
```

### Build for Production

```bash
npm run build        # Build to ../dist
npm run preview      # Preview production build locally
```

---

## Terminal Commands

```bash
# System Information
whoami / hostname / uname / date / uptime

# File Operations
ls / cd / pwd / cat / touch / mkdir / rm / cp / mv / tree / find / grep

# Network and APIs
weather [city]        # Real-time weather
crypto                # Cryptocurrency prices
news [keyword]        # Hacker News
translate <lang> <text> # Translation
github <repo>         # GitHub repository info

# Development Tools
json / base64 / hash / uuid / regex / calc / timestamp / jwt / hex

# System
open <app> / launch [app-id] / worldpulse / system-status

# Help
help                  # View complete command list
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 8 |
| State Management | Zustand 5 |
| Icons | Lucide React |
| Markdown | Marked |
| Styling | CSS Variables + Global Styles |

---

## Project Structure

```
web-linux/
├── src/
│   ├── apps/              # Application components
│   │   ├── terminal/      # Terminal command system
│   │   ├── Terminal.tsx
│   │   ├── FileManager.tsx
│   │   └── ...
│   ├── components/
│   │   ├── desktop/       # Core desktop components
│   │   │   ├── Window.tsx
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Desktop.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── StartMenu.tsx
│   │   └── ...
│   ├── store.tsx          # Zustand global state
│   ├── store/
│   │   ├── fileUtils.ts   # File system utilities
│   │   └── storageUtils.ts # Local storage utilities
│   ├── apps.tsx           # Application registry
│   ├── App.tsx            # Application entry
│   └── utils/
│       └── apiCache.ts    # API caching
├── public/                # Static assets
├── index.html
├── vite.config.ts
└── package.json
```

---

## Core Design

- **Component Lazy Loading**: React.lazy for on-demand loading, reducing initial bundle size
- **Code Splitting**: Vite-based splitting by application, component, and dependency
- **State Persistence**: localStorage stores files, themes, settings, window layouts
- **API Caching**: Built-in cache layer to reduce duplicate requests
- **Theme System**: CSS variable-driven, supporting dark/light mode switching

---

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 110+ |
| Firefox | 115+ |
| Safari | 16+ |
| Edge | 110+ |

---

## Contributing

1. Fork this repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Describe your changes"`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

Before submitting, ensure:

```bash
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint checking
npm run build       # Production build
```

---

## Adding Applications

1. Create application component in `src/apps/`
2. Register in `src/apps.tsx` (ensure unique ID)
3. Add lazy loading mapping in `src/components/desktop/WindowManager.tsx`

---

## Adding Terminal Commands

1. Create or modify command files in `src/apps/terminal/`
2. Register using `registerCommand`
3. Import in `src/apps/terminal/index.ts`

---

## License

This project is open source under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

Thanks to the following open source projects and free API services:

- React / TypeScript / Vite / Zustand
- Lucide Icons / Marked
- Open-Meteo / CoinGecko / Hacker News / GitHub API / wheretheiss.at / open.er-api.com

---

## Changelog

### v33.0.0 (2026-07-12)

- Added DevConsole developer tool console: Integrated 10 common development tools (JSON formatter, Base64 encoding/decoding, URL encoding/decoding, SHA hash generation, UUID generation, JWT decoding, regex testing, color format conversion, Unix timestamp conversion, text diff). All computation done locally in browser, zero network requests, ensuring data privacy
- Added Live Dashboard real-time data dashboard: Aggregates CoinGecko cryptocurrency prices, Hacker News top stories, Open-Meteo weather data, browser performance monitoring (FPS/CPU/memory), supports multi-city weather switching and automatic timed refresh
- Fixed markdown-editor-pro duplicate registration issue: Removed duplicate entries from appRegistry, eliminated duplicates in start menu
- Fixed ai-assistant-pro component mapping error: Corrected component from basic AIAssistant to AIAssistantPro, removed redundant ai-assistant-v2 entry
- Security improvement: Replaced direct eval calls in terminal bc command with Function constructor + input whitelist validation, eliminating code injection risk
- Memory management optimization: Auto-cleanup window snapshots when closing windows to prevent base64 snapshot data from accumulating indefinitely; added LRU eviction strategy with 20-item limit for setWindowSnapshot
- Build optimization: Eliminated eval security warnings in production build

### v32.1.0 (2026-07-12)

- Enhanced Web Browser: Added page zoom (50%-200%), favicon display, extended quick access site list (added CodePen, CodeSandbox)
- Fixed icon import issues: Unified RocketIcon management, removed duplicate definitions, ensured correct application registration
- Optimized file system utilities: Improved path parsing and caching mechanism, enhanced file operation performance
- Improved terminal command system: Optimized command processing logic, added more utility commands
- Enhanced system monitoring: Improved process management and resource monitoring interface
- Code quality improvements: Fixed TypeScript type errors, removed unused variables and imports
- Improved user experience: Optimized window management, taskbar and start menu interactions

### v31.0.0 (2026-07-11)

- Added intelligent developer workbench: Integrated code template library, API Mock service, knowledge graph, and intelligent code analysis
  - Code template library: 5 high-quality TypeScript templates, with search, category filtering, one-click copy
  - API Mock service: Visual API simulator supporting GET/POST/PUT/DELETE/PATCH methods, configurable status codes and delays
  - Knowledge graph: 7 interconnected technical knowledge points with category tags and connection visualization
  - Intelligent code analysis: Auto-evaluate code quality with complexity, maintainability, performance, security metrics and improvement suggestions
- Cyberpunk tech-style UI design: Neon color scheme and modern interaction design
- Responsive layout optimization: Support for multiple screen sizes

### v30.0.0 (2026-07-11)

- Added real-time collaborative document editor: Markdown real-time editing, version history, multi-user collaboration simulation, auto-save
- Optimized icon system: Unified icon management, fixed Lucide React icon import errors
- Enhanced terminal network commands: Added ping, ifconfig, netstat, curl, dig, hostnamectl, nslookup
- Fixed build configuration: Ensured correct GitHub Pages deployment path
- Code quality improvements: Fixed TypeScript type errors, optimized command handler functions

### v29.0.0 (2026-06-15)

- Added intelligent code assistant with AI-assisted programming
- Enhanced workspace hub with improved layout and interaction
- Added network speed test tool
- Improved system monitoring dashboard

### v28.0.0 (2026-05-25)

- Added intelligent development workbench
- Enhanced terminal command system to 150+ commands