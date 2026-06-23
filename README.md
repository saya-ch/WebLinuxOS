# WebLinuxOS

A fully functional Linux desktop environment running entirely in the browser, featuring complete window management, virtual file system, terminal emulator, and over 200 utility applications.

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) | [Features](#core-features) | [Quick Start](#quick-start) | [Technical Stack](#technical-stack)

---

## Overview

WebLinuxOS is a practical in-browser workspace designed for real productivity. It provides developers with instant access to essential tools, information, and utilities without any installation or backend dependencies.

**Key Advantages:**
- Zero installation - runs entirely in browser
- Cross-platform - works on any device with a modern browser
- Privacy-first - no data collection, all processing happens locally
- Developer-focused - built by developers, for developers
- Extensible - modular architecture allows easy addition of new apps

## What Makes WebLinuxOS Different

Unlike many similar projects that use iframes or link to external sites, WebLinuxOS takes a different approach:

- **Native browser implementation** - Terminal, file manager, code editor, paint, media players, and collaborative whiteboard are all built from scratch
- **Real functionality** - 200+ terminal commands, actual Python runtime via Pyodide, real API integrations
- **Engineering focus** - Complete window management, multi-desktop support, error boundaries, performance optimization, CSP security
- **Practical use cases** - Developer Swiss Army knife, temporary workspace, cross-device neutral environment
- **New in v3.0** - Network speed test, stock market tracker, multi-language code runner with live preview

---

## Core Features

### Desktop Environment
- Modern Linux-style interface with dark/light theme support
- Complete multi-window management system with z-index layering
- Window snap layouts (left/right/top/bottom half, quarter, thirds)
- Smooth window animations (open, close, minimize, maximize)
- Enhanced taskbar with app pinning, window switching, and preview tooltips
- Start menu with categorized app list, search, and system shortcuts
- Global search (Ctrl + K or Ctrl + Space)
- Multi-desktop workspaces (Ctrl + Alt + arrow keys)
- Notification center system
- Professional SVG icon system (Lucide Icons)
- Live animated wallpapers (particles, nebula, interactive)

### Built-in Applications (200+)

**System Tools**
- File Manager - Browse, create, edit virtual file system
- Terminal Emulator - Command line with Python runtime (Pyodide), 200+ commands
- System Monitor Pro - Real-time CPU/FPS/memory/network/storage metrics
- System Settings - Theme, wallpaper, multi-desktop, notification settings
- Task Manager - View and manage running application windows

**Developer Tools**
- Code Lab - HTML/CSS/JS live preview, sandbox execution, template library
- Smart Code Assistant - 6 analysis modes (explain/review/optimize/security/document/translate)
- AI Programming Assistant Pro - Intelligent code generation, explanation, optimization
- Developer Toolbox Pro - Base64/URL/JSON/Regex/UUID/timestamp/color utilities
- JWT Decoder - Header/Payload/Signature parsing, time validation
- AI Smart Hub - Unified AI assistant center
- Utility Hub - Comprehensive tool aggregation center
- Developer Hub - Integrated dev tools (JSON, Base64, Hash, UUID, Timestamp, Regex, Diff)
- Public API Explorer - Explore and test 10+ free public APIs directly

**Data & Information**
- Real-time Dashboard - Weather, exchange rates, cryptocurrency, tech news
- Weather App - Open-Meteo API integration, 7-day forecast, temperature charts
- Currency Converter - Frankfurter.app real-time rates
- IP Lookup - ipapi.co integration, geolocation, ISP info
- News Reader - HN Algolia API, real-time tech news
- World Clock - Global time zones, 15 major cities
- API Explorer - Free public APIs catalog

**Productivity**
- Markdown Editor Pro - Split view, toolbar, export HTML/Markdown
- Knowledge Garden - Bidirectional link personal Wiki
- Web Clipper - Web scraping, content extraction, Markdown export
- Collaborative Whiteboard - Multi-tool drawing, PNG export
- Spreadsheet - Basic table calculations
- Presentation - Slide creation
- Calendar - Schedule management
- AI Assistant Enhanced - Multi-mode AI assistant (chat, code, translate, summarize, math, creative, learn)

**Utilities**
- Network Toolkit - IP geolocation, DNS lookup, speed test
- Speed Test - Network bandwidth testing, latency/jitter measurement
- Stock Tracker - Real-time stock monitoring, watchlist management
- Online Code Runner - Multi-language code execution (JS/TS/Python/HTML/CSS/JSON/Markdown)
- Password Generator - Configurable strong password generator
- Unit Converter - Length/weight/temperature/volume
- Pomodoro Pro - Focus/rest modes, Web Audio notifications

**Multimedia**
- Music Player - Local file playback
- Video Player - Local video playback
- Image Viewer - Image browsing
- Paint Tool - Canvas drawing

**Games**
- Snake - Classic arcade game
- Tetris - Classic puzzle game
- 2048 - Number puzzle
- Memory Match - Card matching game
- Breakout - Ball bouncing game

### Online Service Integrations
- Real-time weather data (Open-Meteo API - free, no API key)
- Real-time exchange rates (Frankfurter.app - free)
- IP geolocation (ipapi.co - free)
- DNS over HTTPS resolution (Cloudflare 1.1.1.1 - free)
- News (HN Algolia API - free)
- Password breach lookup (Have I Been Pwned - k-anonymity)
- Random user data (randomuser.me - free)
- Programming jokes (JokeAPI - free)
- Cat facts (catfact.ninja - free)
- Dog images (dog.ceo - free)
- Activity suggestions (boredapi.com - free)

---

## Technical Stack

- **Frontend Framework**: React 19 (Hooks + Suspense + React.lazy)
- **Type System**: TypeScript 6.x (strict mode)
- **State Management**: Zustand (lightweight, minimal API)
- **Build Tool**: Vite 8.x (fast HMR, code splitting)
- **Icon System**: Lucide React
- **Markdown Rendering**: marked.js
- **Python Runtime**: Pyodide

---

## Quick Start

### Installation

```bash
cd web-linux
npm install
```

### Development

```bash
npm run dev
```

Visit http://localhost:5173/WebLinuxOS/

### Production Build

```bash
npm run build
```

Build output goes to `../dist` directory.

### Preview Production

```bash
npm run preview
```

### Type Checking

```bash
npm run typecheck
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open global search |
| `Ctrl + P` | Open command palette |
| `Ctrl + T` | Open terminal |
| `Ctrl + E` | Open file manager |
| `Ctrl + B` | Open browser |
| `Ctrl + ,` | Open settings |
| `Ctrl + W` | Close current window |
| `Ctrl + M` | Minimize current window |
| `Alt + Tab` | Switch windows |
| `Ctrl + Alt + ←/→` | Switch desktop |
| `Ctrl + Alt + 1-9` | Go to specific desktop |
| `PrintScreen` | Screenshot |

---

## Project Structure

```
web-linux/
├── src/
│   ├── apps/              # 200+ application components
│   ├── components/
│   │   └── desktop/       # Desktop components (Window, Taskbar, StartMenu)
│   ├── store/             # State management utilities
│   ├── icons.tsx          # Icon component collection
│   ├── apps.tsx           # Application registry
│   ├── store.tsx          # Global state (Zustand)
│   ├── types.ts           # Type definitions
│   ├── App.tsx            # Main application
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
└── package.json           # Project configuration
```

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome / Chromium | 100+ | Fully supported |
| Firefox | 100+ | Fully supported |
| Safari | 15+ | Fully supported |
| Edge | 100+ | Fully supported |

## Deployment

### GitHub Pages

The project is configured for direct GitHub Pages deployment:

1. Build output goes to repository root
2. Root directory contains `.nojekyll` file
3. In Settings → Pages, select `Deploy from a branch`, branch `main`, directory `/ (root)`

### Custom Deployment

```bash
cd web-linux
npm run build:local
# Deploy ../ directory to any static hosting
```

## Performance Optimization

- **Code Splitting**: Each app bundled as separate chunk, lazy loaded
- **React.lazy + Suspense**: On-demand loading with loading skeletons
- **CSS Variables**: Theme switching without full re-render
- **Zustand Selective Subscription**: Optimized state updates
- **Production Compression**: Terser minification + CSS compression
- **Critical Component Preloading**: High-frequency apps preloaded

## Security

- Global CSP (Content-Security-Policy) meta tag
- Global error handling (window.onerror + unhandledrejection)
- localStorage operations with try/catch fallback
- Error boundaries for component isolation
- XSS protection through React's built-in escaping

## Contributing

Contributions welcome:

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

## Acknowledgments

- [Open-Meteo API](https://open-meteo.com/) - Free weather data
- [Frankfurter.app](https://www.frankfurter.app/) - Free exchange rates
- [ipapi.co](https://ipapi.co/) - IP geolocation
- [HN Algolia](https://hn.algolia.com/api) - Hacker News API
- [Have I Been Pwned](https://haveibeenpwned.com/Passwords) - Password breach lookup
- [React](https://react.dev/) - Frontend framework
- [Vite](https://vitejs.dev/) - Build tool
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Pyodide](https://pyodide.org/) - In-browser Python runtime
- [marked](https://github.com/markedjs/marked) - Markdown rendering
- [Lucide Icons](https://lucide.dev/) - Icon library