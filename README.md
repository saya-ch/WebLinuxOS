<div align="center">

# WebLinuxOS

### A complete Linux desktop environment running in the browser — real tools, real work, zero installation.

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Documentation](https://github.com/saya-ch/WebLinuxOS/wiki) · [Changelog](CHANGELOG.md) · [Report Bug](https://github.com/saya-ch/WebLinuxOS/issues) · [Request Feature](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge&logo=github&color=yellow)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=for-the-badge&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v47.0.0-blue?style=for-the-badge)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?style=for-the-badge&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)

---

</div>

## Overview

WebLinuxOS is a full-featured Linux desktop environment that runs entirely in your browser. Unlike OS simulators that only look the part, every application here delivers real functionality — the terminal executes actual commands, the code editor writes real code, the API testing tool makes genuine network requests, and privacy tools detect real sensitive information locally.

With **240+ built-in applications** spanning development, productivity, networking, media, system tools, and games, WebLinuxOS transforms any device with a browser into a complete workstation. Whether you're on an iPad, Chromebook, or a locked-down corporate machine, your entire workflow is just a URL away.

Built with React 19 and TypeScript, it features a polished windowing system with virtual desktops, multiple themes (Cyberpunk, Quantum, Glass Morphism, Classic Light), smooth GPU-accelerated animations, and a boot animation that makes every startup feel like an event.

## Why WebLinuxOS?

- **Zero setup** — open the URL and start working instantly
- **Privacy first** — all data stays in your browser's localStorage
- **Works anywhere** — iPad, Chromebook, school computers, old laptops
- **Real functionality** — not a demo or simulator, these tools actually work
- **Always up to date** — no installations, no updates, just refresh the page

## Core Features

### 🖥️ Desktop & Window System

Multi-window environment with 4 virtual desktops, draggable and resizable windows, minimize/maximize controls, taskbar, start menu, command palette (Ctrl+P), and global search (Ctrl+K). Smooth GPU-accelerated animations and transitions with multiple built-in themes.

### 🚀 Innovative Applications

Pushing the boundaries of what a web OS can do:

- **Real-Time Code Collaboration** — Multi-language collaborative coding platform with real-time cursor tracking, JavaScript execution, session sharing, and support for 9 programming languages (JavaScript, TypeScript, Python, Java, C++, Go, Rust, HTML, CSS)
- **AI Code Analyzer Pro** — Intelligent code quality analyzer with complexity assessment, duplicate code detection, magic number identification, long line warnings, and actionable improvement suggestions for 7 languages
- **DevPortal** — Unified developer toolbox with 7 categories: dashboard, code tools, text tools, color tools, time tools, network tools, and data visualization
- **FlowBoard** — Visual workflow builder with drag-and-drop nodes for conditions, API calls, data processing, delays, and notifications. Includes preset templates for common automation patterns
- **NeoTerminal** — Next-generation terminal with tabbed interface, AI commands, bookmarks, code snippets, and 4 themes (Dark, Light, Cyberpunk, Matrix)
- **KnowledgeVine** — Knowledge garden with tree/mindmap/list/card views. Notes grow through stages (Seed → Sprout → Growing → Mature) based on engagement
- **AudioViz** — Real-time audio visualizer with 5 visualization types (bars, wave, circle, particles, pulse), 5 themes, and support for microphone, file, demo, and system audio sources
- **PulseBoard** — Customizable real-time dashboard with system metrics, weather, news, cryptocurrency prices, world clock, and more

### 💻 Development Tools

Professional-grade development environment in your browser:

- Terminal with **70+ commands** — file system browsing, text processing, network diagnostics, Cron simulation, Git simulation
- Code editor powered by Monaco Editor with syntax highlighting, multi-language support, and auto-completion
- Markdown editor with real-time bidirectional preview, tables, formulas, code blocks, and HTML export
- API Testing Tool with real API calls, preset templates, request history, and favorites
- DevLab — 12+ tools including JSON formatter, Base64 encoder/decoder, hash generator, UUID generator, password generator, and more

### 📊 Productivity & Organization

- **Smart Dashboard** — All-in-one dashboard with weather, system monitoring, quick tools, daily quotes, and todo list
- **JSONForge** — Format, compress, convert YAML/CSV, validate schema, and diff JSON
- **CronLab** — Visual Cron expression builder with next 5 execution predictions
- **PrivacyGuard** — Local PII detection for 17 categories of sensitive information
- **WorldPulse** — Global weather, exchange rates, earthquakes, and news aggregation

### 🌐 Network & Online Services

- **Network Toolkit Pro** — IP lookup, DNS lookup, URL encode/decode, network monitoring, HTTP status reference, port scanner
- Weather, news, cryptocurrency, exchange rates, IP info, translation, dictionary
- Wikipedia search, space news, NASA APOD, Pokemon database, Star Wars database
- DuckDuckGo search integration

### 🔒 Privacy First

All local data is stored in your browser's localStorage. Nothing is uploaded to any server unless you explicitly enable online APIs (like WorldPulse or WebSnapshot). All other applications run completely offline.

### 🎮 Games & Entertainment

Classic games including 2048, Snake, Tetris, Breakout, Memory, and more — all playable directly in the browser.

## Application Categories

| Category | Apps | Highlights |
|----------|------|------------|
| **Development** | 50+ | DevPortal, FlowBoard, NeoTerminal, Code Editor, API Tester, DevLab, Markdown Editor |
| **Productivity** | 40+ | PulseBoard, KnowledgeVine, Smart Dashboard, JSONForge, CronLab, Todo, Calendar |
| **System Tools** | 30+ | File Manager, System Monitor, Performance Dashboard, Settings, Terminal |
| **Network** | 25+ | Network Toolkit Pro, Web Browser, WorldPulse, Weather, News, IP Lookup |
| **Media & Creative** | 20+ | AudioViz, Music Player, Image Viewer, Paint, Whiteboard, Camera |
| **Utilities** | 35+ | PrivacyGuard, DevShortcuts, Password Generator, Hash Tools, Unit Converter |
| **Games** | 10+ | 2048, Snake, Tetris, Breakout, Memory, Virtual Pet |
| **AI Tools** | 20+ | AI Assistant, Code Assistant, Prompt Library, AI Workbench, AI Learning |

Complete application list available in the [App Store](https://saya-ch.github.io/WebLinuxOS/) within the system.

## Technology Stack

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Styling**: CSS Variables + Theme System (no Tailwind)
- **UI Icons**: [Lucide React](https://lucide.dev/)
- **Code Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Markdown**: [marked](https://github.com/markedjs/marked) + [DOMPurify](https://github.com/cure53/DOMPurify)
- **Python Runtime**: [Pyodide](https://pyodide.org/) (optional application)
- **Deployment**: GitHub Pages + GitHub Actions

## Quick Start

### Try Online

No installation required — open in your browser:

👉 **[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)**

### Local Development

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to the project
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev
```

The development server will start at `http://localhost:5173`.

### Build for Production

```bash
# Build for production
npm run build

# Preview the production build
npm run preview
```

## Project Structure

```
WebLinuxOS/
├── web-linux/                  # Main application source
│   ├── src/
│   │   ├── apps/               # 240+ application implementations
│   │   │   ├── DevPortal.tsx   # Unified developer toolbox
│   │   │   ├── FlowBoard.tsx   # Visual workflow builder
│   │   │   ├── NeoTerminal.tsx # Next-gen terminal
│   │   │   ├── KnowledgeVine.tsx # Knowledge garden
│   │   │   ├── AudioViz.tsx    # Audio visualizer
│   │   │   ├── PulseBoard.tsx  # Real-time dashboard
│   │   │   └── terminal/       # Terminal command system
│   │   ├── components/         # Core UI components
│   │   │   └── desktop/        # Desktop, windows, taskbar, start menu
│   │   ├── store/              # Zustand state management
│   │   ├── styles/             # Theme system and global styles
│   │   ├── utils/              # Utility functions
│   │   ├── services/           # API and service layer
│   │   ├── config/             # Configuration files
│   │   └── types/              # TypeScript type definitions
│   ├── public/                 # Static assets
│   └── vite.config.ts          # Vite configuration
├── .github/
│   └── workflows/              # GitHub Actions (auto-deployment)
├── docs/                       # Documentation
├── CHANGELOG.md                # Release notes
├── CONTRIBUTING.md             # Contributing guide
├── LICENSE                     # MIT License
└── README.md                   # This file
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
| `Alt + Tab` | Switch windows |
| `Ctrl + Alt + [1-9]` | Switch virtual desktops |
| `PrintScreen` | Take screenshot |

## Contributing

Contributions are welcome and appreciated! Whether it's bug fixes, new features, documentation improvements, or new applications — every contribution matters.

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Adding a New Application

1. Create your app component in `web-linux/src/apps/`
2. Register it in `apps.tsx`
3. Add the lazy loading entry in `WindowManager.tsx`
4. Test thoroughly and submit a PR

For more detailed guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Roadmap

- [ ] **PWA Support** — Install as a local desktop application
- [ ] **File Sync** — Cross-device file system sync via WebDAV / GitHub Gist
- [ ] **Collaboration Mode** — CRDT-based multi-user shared workspace
- [ ] **Mobile Optimization** — Touch-friendly interface for phones and tablets
- [ ] **Plugin System** — Third-party application hot-loading
- [ ] **More AI Integrations** — Enhanced AI-powered tools across the system

See the [open issues](https://github.com/saya-ch/WebLinuxOS/issues) for a full list of proposed features and known issues.

## License

This project is open source under the MIT License. See [LICENSE](LICENSE) for more information.

## Acknowledgements

Special thanks to these amazing open-source projects that make WebLinuxOS possible:

- [Lucide](https://lucide.dev/) — Beautiful, consistent icon library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — The code editor that powers VS Code
- [Pyodide](https://pyodide.org/) — Python runtime for the browser
- [Zustand](https://github.com/pmndrs/zustand) — Lightweight state management
- [Vite](https://vitejs.dev/) — Next-generation frontend build tool
- [microlink.io](https://microlink.io/) — Web page metadata scraping

And to every contributor and user — thank you for making this project better.

---

<div align="center">

If this project helps you, please consider giving it a ⭐ star. It means a lot!

Made with ❤️ by the WebLinuxOS community

</div>
