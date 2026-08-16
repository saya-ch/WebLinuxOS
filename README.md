<div align="center">

# WebLinuxOS

**A full Linux desktop environment in the browser. Real tools. Real work. Zero installation.**

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Changelog](CHANGELOG.md) · [Wiki](https://github.com/saya-ch/WebLinuxOS/wiki) · [Report Issue](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=for-the-badge&logo=github&color=yellow)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=for-the-badge&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v102.0.0-blue?style=for-the-badge)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-deployed-brightgreen?style=for-the-badge&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## What is WebLinuxOS

WebLinuxOS is a fully functional Linux desktop environment that runs entirely in your browser. It is not a demo or simulation — every application performs real work: the terminal executes actual commands, the code editor writes real code with syntax highlighting, the API tester sends real HTTP requests, and the AI image studio generates images through public APIs. Built on React 19 and TypeScript, it ships with 500+ integrated applications spanning development, office, networking, multimedia, AI, and gaming — turning any browser-equipped device into a complete workstation.

## Key Features

### Desktop Environment
- **Full window management** — drag, resize, minimize, maximize, snap, tile, and cascade windows
- **Multiple virtual desktops** — up to 9 workspaces with independent content and wallpaper
- **Taskbar & start menu** — application launcher, system tray, and window switcher
- **Command palette** — search and launch any app with a universal quick-open interface
- **Global keyboard shortcuts** — 30+ customizable shortcuts for power users

### 500+ Integrated Applications

| Category | Examples |
|----------|---------|
| **Development** | Code editor, terminal, JSON tools, regex tester, API client, Git visualizer, snippet manager |
| **Office** | Markdown editor, spreadsheet, PDF viewer, presentation, flashcards |
| **AI & Creative** | AI chat, image generation, background removal, code analyzer, translation, prompt engineering |
| **Internet & APIs** | Weather, crypto, news, Wikipedia, GitHub trends, exchange rates |
| **System & Utilities** | File manager, settings, system monitor, password vault, clipboard |
| **Multimedia** | Music player, visualizer, paint, screen recorder, camera |
| **Games** | Tetris, Snake, 2048, Breakout, dice roller |

### Real API Integrations
All data comes from legitimate, public APIs — no mock data, no empty shells:

- **Open-Meteo** — global weather forecasts
- **CoinGecko** — real-time cryptocurrency prices
- **Hacker News** — tech news aggregation
- **Wikipedia** — encyclopedia articles
- **ExchangeRate-API** — foreign exchange rates
- **ZenQuotes** — daily quotes and wisdom
- **Pollinations.ai** — AI chat and image generation
- **GitHub API** — repository exploration
- **Open Library** — book discovery
- **NASA APOD** — astronomy imagery
- **IP-API** — geolocation services

### Technical Highlights
- **Lazy loading** — every application loads on demand via `React.lazy` + `Suspense`
- **Cross-tab synchronization** — real-time theme, file, and presence sync across browser tabs
- **Content Security Policy** — comprehensive CSP headers for safe script execution
- **Service Worker** — offline caching with auto-update detection
- **Error boundaries** — graceful failure isolation per application
- **Keyboard-first design** — power-user workflows with 30+ global shortcuts

## Screenshots

<div align="center">

![Desktop](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/01-desktop.png)

**Clean desktop with widgets**

![Launcher](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/02-launcher.png)

**Application launcher with categories**

![Terminal](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/04-terminal.png)

**Fully functional terminal emulator**

![Code Editor](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/web-linux/screenshots/05-text-editor.png)

**Monaco-based code editor with syntax highlighting**

</div>

## Quick Start

### Online Demo

No installation required. Visit:

**[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)**

### Local Development

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

The dev server starts at `http://localhost:5173/WebLinuxOS/`.

### Production Build

```bash
cd web-linux
npm run build
```

The build runs `tsc -b` for type checking first — zero type errors are a release gate.

## Architecture

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/               # 500+ application implementations
│   │   │   └── terminal/       # Terminal command system (200+ commands)
│   │   ├── components/         # Core UI (Desktop, Window, Taskbar, StartMenu)
│   │   │   └── desktop/        # WindowManager with lazy-loaded components
│   │   ├── store/              # Zustand state, file system, storage utilities
│   │   ├── services/           # API service layer, AI service, sync service
│   │   ├── styles/             # Theme system and global styles
│   │   ├── config/             # API endpoint configuration
│   │   ├── apps.tsx            # Application registry (metadata + icons + dimensions)
│   │   └── icons.tsx           # Custom icon components
│   ├── public/                 # Static assets, PWA manifest, Service Worker
│   └── vite.config.ts          # Vite configuration (base path, code splitting)
├── .github/workflows/          # CI/CD: auto-build and deploy to GitHub Pages
└── README.md
```

### Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| State | Zustand |
| Editor | Monaco Editor |
| Icons | Lucide Icons |
| Runtime | Web APIs, Pyodide |

### Application Registration

Adding a new application requires three steps:

1. **Create the component** in `web-linux/src/apps/YourAppName.tsx`
2. **Register metadata** in `apps.tsx` — icon, category, dimensions, description
3. **Add lazy-load mapping** in `WindowManager.tsx` componentMap

```typescript
// apps.tsx
{ id: 'my-app', name: 'My App', component: 'MyApp', category: 'utilities', ... }

// WindowManager.tsx
MyApp: () => import('../../apps/MyApp'),
```

## Deployment

### GitHub Pages

This project is configured for automatic deployment via GitHub Actions. Push to `main` and the CI/CD pipeline builds and publishes to GitHub Pages automatically.

For manual deployment or custom domains:

1. Modify the `base` config in `web-linux/vite.config.ts` (default: `/WebLinuxOS/`)
2. Run `npm run build` to generate the `dist` directory
3. Push `dist` contents to the `gh-pages` branch, or configure a custom domain

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Smart Search | `Ctrl/Cmd + Shift + K` |
| Terminal | `Ctrl/Cmd + T` |
| File Manager | `Ctrl/Cmd + E` |
| Browser | `Ctrl/Cmd + B` |
| Command Palette | `Ctrl/Cmd + Shift + P` |
| Quick Note | `Alt + N` |
| Screenshot | `PrintScreen` |
| Switch Desktop | `Ctrl/Cmd + Alt + 1-9` |
| Close Window | `Ctrl/Cmd + Q` |
| New Terminal | `Ctrl/Cmd + Shift + N` |

## Version History

### v102.0.0
- AI background removal tool with Canvas-based processing
- Professional code snippet manager with syntax highlighting
- Three removal modes: auto-detect, color selection, edge detection
- Manual eraser tool with adjustable brush size
- Import/export JSON support for snippets
- Enhanced UI with compare mode and progress indicators
- Optimized component loading and caching

### v101.0.0
- CJK font rendering fix for terminal and code editor
- Noto Sans SC Mono integration for proper Chinese character display
- Enhanced global transitions and animations

### Recent Major Releases

- **v100.0.0** — Markdown to PDF, enhanced window tiling system
- **v99.0.0** — Cross-tab real-time sync, presence awareness, privacy center
- **v98.0.0** — System analyzer, shortcut customization, CPU performance optimization
- **v97.0.0** — AI translation master, GIF explorer, architecture improvements
- **v96.0.0** — DevToolkit Ultra, real-time exchange rates, ASCII art generator

See [CHANGELOG.md](CHANGELOG.md) for the full version history.

## Contributing

Contributions are welcome — bug fixes, new applications, and feature enhancements.

### Development Workflow

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Pre-submission Checklist

```bash
cd web-linux
npm run build   # Must pass: zero type errors
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with React, TypeScript, and Vite. Deployed on GitHub Pages.**

If this project helps you, consider giving it a star.

</div>
