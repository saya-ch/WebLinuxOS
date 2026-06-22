# WebLinuxOS

A fully functional Linux desktop environment running entirely in the browser, featuring complete window management, virtual file system, terminal emulator, and over 200 utility applications.

## Overview

WebLinuxOS is not just a "desktop simulation" - it's a practical in-browser workspace designed for real productivity. It provides developers with instant access to essential tools, information, and utilities without any installation or backend dependencies.

## Live Demo

Visit [WebLinuxOS](https://saya-ch.github.io/WebLinuxOS/) to experience the complete desktop environment in your browser.

## Key Differentiators

Unlike many similar projects that use iframes or link to external sites, WebLinuxOS takes a different approach:

- **Native browser implementation** - Terminal, file manager, code editor, paint, media players, and collaborative whiteboard are all built from scratch
- **Real functionality** - 200+ terminal commands, actual Python runtime via Pyodide, real API integrations
- **Engineering focus** - Complete window management, multi-desktop support, error boundaries, performance optimization, CSP security
- **Practical use cases** - Developer Swiss Army knife, temporary workspace, cross-device neutral environment

## Core Features

### Desktop Environment
- Modern Linux-style interface with dark/light theme support
- Complete multi-window management system (z-index layering)
- Window snap layouts (left/right/top/bottom half, quarter, thirds)
- Smooth window animations (open, close, minimize, maximize)
- Enhanced taskbar with app pinning, window switching, and preview tooltips
- Start menu with categorized app list, search, and system shortcuts
- Global search (Ctrl + K or Ctrl + Space)
- Multi-desktop workspaces (Ctrl + Alt + arrow keys)
- Notification center system
- Professional SVG icon system (Lucide Icons)

### Built-in Applications (200+)

**System Tools**
- File Manager - Browse, create, edit virtual file system
- Terminal Emulator - Command line with Python runtime (Pyodide), 200+ commands including timestamp utilities
- System Monitor Pro - Real-time CPU/FPS/memory/network/storage metrics
- System Settings - Theme, wallpaper, multi-desktop, notification settings
- Task Manager - View and manage running application windows

**Developer Tools**
- Code Lab - HTML/CSS/JS live preview, sandbox execution, template library, export to HTML
- Smart Code Assistant - 6 analysis modes (explain/review/optimize/security/document/translate)
- AI Programming Assistant Pro - Intelligent code generation, explanation, optimization, snippets library
- Developer Toolbox Pro - Base64/URL/JSON/Regex/UUID/timestamp/color utilities (7-in-1)
- JWT Decoder - Header/Payload/Signature parsing, time validation, algorithm security warnings
- **NEW: AI Smart Hub** - Unified AI assistant center with code, text, translation, math, knowledge, creativity, and learning capabilities
- **NEW: Utility Hub** - Comprehensive tool aggregation center with converters, generators, formatters, validators, and encoders
- Color Palette Extractor - Image color extraction, WCAG contrast check, multi-format export
- JSON Formatter - Prettify and minify JSON
- Regex Tester - Real-time match highlighting
- API Tester - HTTP request testing

**Data & Information**
- Real-time Dashboard - Weather, exchange rates, cryptocurrency, tech news aggregation
- Weather App - Open-Meteo API integration, city search, 7-day forecast, temperature charts
- Currency Converter - Frankfurter.app real-time rates, bidirectional conversion, historical trends
- IP Lookup - ipapi.co integration, geolocation, ISP, timezone, currency info
- News Reader - HN Algolia API, real-time tech news, categories, search

**Productivity**
- Markdown Editor Pro - Split view, toolbar, export HTML/Markdown, word count
- Knowledge Garden - Bidirectional link personal Wiki, `[[title]]` linking, tags, full-text search, Canvas force-directed graph visualization
- Web Clipper - CORS proxy web scraping, content extraction, 5-color highlight annotations, Markdown export
- Collaborative Whiteboard - Multi-tool drawing, grid, undo/redo, PNG export
- Spreadsheet - Basic table calculations
- Presentation - Simple slide creation
- Calendar - Schedule management

**Utilities**
- Network Toolkit - IP geolocation / DNS over HTTPS lookup / HTTP status codes / URL status check / speed test
- Password Generator - Configurable strong password generator
- Unit Converter - Length/weight/temperature/volume and more
- Pomodoro Pro - Focus/rest modes, circular progress animation, Web Audio notifications

**Multimedia**
- Music Player - Local file playback
- Video Player - Local video playback
- Image Viewer - Image browsing
- Paint Tool - Canvas drawing

**Games**
- Snake - Classic arcade game
- Tetris - Classic puzzle game

### Online Service Integrations
- Real-time weather data (Open-Meteo API - free, no API key required)
- Real-time exchange rates (Frankfurter.app - free)
- IP geolocation (ipapi.co - free)
- DNS over HTTPS resolution (Cloudflare 1.1.1.1 - free)
- News (HN Algolia API - free)
- Password breach lookup (Have I Been Pwned - k-anonymity protocol)

## Technical Stack

- **Frontend Framework**: React 19 (Hooks + Suspense + React.lazy)
- **Type System**: TypeScript 6.x (strict mode)
- **State Management**: Zustand (lightweight, minimal API)
- **Build Tool**: Vite 8.x (fast HMR, code splitting)
- **Icon System**: Lucide React
- **Markdown Rendering**: marked.js
- **Python Runtime**: Pyodide

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

Visit http://localhost:5173

### Production Build

```bash
npm run build
```

Build output goes to repository root directory.

### Preview Production

```bash
npm run preview
```

### Type Checking

```bash
npm run typecheck
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` / `Ctrl + Space` | Open global search |
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

## Project Structure

```
web-linux/
├── src/
│   ├── apps/              # 200+ application components
│   ├── components/
│   │   └── desktop/       # Desktop components (windows, taskbar, start menu)
│   ├── store/             # State management utilities
│   ├── icons.tsx          # Icon component collection
│   ├── apps.tsx           # Application registry
│   ├── store.tsx          # Global state management (Zustand)
│   ├── types.ts           # Type definitions
│   ├── index.css          # Global styles
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Entry point
├── public/                # Static assets
├── index.html             # HTML template
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Project configuration
```

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|-----------------|--------|
| Chrome / Chromium | 100+ | ✅ Fully supported |
| Firefox | 100+ | ✅ Fully supported |
| Safari | 15+ | ✅ Fully supported |
| Edge | 100+ | ✅ Fully supported |

## Deployment

### GitHub Pages

The project is configured for direct GitHub Pages deployment:

1. Build output goes to repository root
2. Root directory contains `.nojekyll` file
3. In repository Settings → Pages, select `Deploy from a branch`, branch `main`, directory `/ (root)`

### Custom Deployment

```bash
cd web-linux
npm run build:local  # Uses / as base path
# Deploy ../ directory to any static hosting service
```

## Performance Optimization

- **Code Splitting**: Each application bundled as separate chunk, lazy loaded on demand
- **React.lazy + Suspense**: On-demand app loading with loading skeletons
- **CSS Variables**: Theme switching without full app re-render
- **Zustand Selective Subscription**: Components only re-render when dependent state changes
- **Production Compression**: Terser minification + CSS compression
- **Critical Component Preloading**: High-frequency apps preloaded during idle time

## Security

- Global CSP (Content-Security-Policy) meta tag
- Global error handling (window.onerror + unhandledrejection)
- localStorage operations with try/catch fallback
- Error boundaries for component isolation
- XSS protection through React's built-in escaping

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

MIT License

## Acknowledgments

Special thanks to the following open source projects and services:

- [Open-Meteo API](https://open-meteo.com/) — Free weather data
- [Frankfurter.app](https://www.frankfurter.app/) — Free exchange rate data
- [ipapi.co](https://ipapi.co/) — IP geolocation
- [HN Algolia](https://hn.algolia.com/api) — Hacker News search API
- [Have I Been Pwned](https://haveibeenpwned.com/Passwords) — Password breach lookup
- [React](https://react.dev/) — Frontend framework
- [Vite](https://vitejs.dev/) — Build tool
- [Zustand](https://github.com/pmndrs/zustand) — State management
- [Pyodide](https://pyodide.org/) — In-browser Python runtime
- [marked](https://github.com/markedjs/marked) — Markdown rendering
- [Lucide Icons](https://lucide.dev/) — Icon library