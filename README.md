# WebLinuxOS

A fully functional web-based desktop operating system that runs entirely in the browser. No installation required.

![WebLinuxOS screenshot](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/public/screenshot.png)

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)** | **[Features](#features)** | **[Applications](#applications)** | **[Getting Started](#getting-started)**

---

## Overview

WebLinuxOS brings a complete Linux-like desktop experience to your browser. It includes window management, a virtual file system, taskbar, system tray, and over 250 applications--all running entirely client-side without any backend server.

The system is built with React 19, TypeScript, and Vite, delivering smooth animations, responsive design, and a feature set that rivals native desktop environments. Unlike many demo projects, WebLinuxOS features real functionality with live API integrations throughout.

## Features

### Desktop Environment

- **Window System**: Drag, resize, minimize, maximize, and close windows with smooth animations
- **Taskbar**: Application switching, system tray, real-time clock, and workspace management
- **Virtual Filesystem**: Complete file browsing, creation, editing, and organization
- **Multi-workspace**: Organize windows across multiple virtual desktops (up to 9)
- **Theme System**: Dark/light mode with custom accent colors
- **Keyboard Shortcuts**: Comprehensive hotkey support (Ctrl+Shift+? for reference)

### Terminal

- 80+ built-in commands covering file operations, system information, networking, and utilities
- Real API integrations for weather, news, crypto prices, and IP lookup
- Command history and auto-completion with Tab
- Syntax highlighting and colored output (ANSI escape codes)
- Alias support (persisted to localStorage)

### Development Tools

- **Code Editor**: Syntax highlighting for JavaScript, TypeScript, Python, HTML, CSS with auto-completion
- **Code Runner**: Execute JavaScript and Python in real-time
- **REST Client**: API testing with request/response inspection
- **Regex Tester**: Pattern validation and debugging
- **JSON Formatter**: Pretty-print and validation
- **GitHub Explorer**: Browse repositories and trending projects
- **Code Diff Viewer**: Compare code changes side-by-side

### Productivity

- **Markdown Editor**: Live preview with formatting support
- **Spreadsheet**: Data entry and calculations
- **Presentation**: Slide creation tools
- **Calendar**: Date management with reminders
- **Notes**: Quick note-taking with categorization

### Live API Integrations

All network-enabled applications use real, free public APIs:

| Service | API | Purpose |
|---------|-----|---------|
| Weather | Open-Meteo | Current conditions and forecasts |
| Crypto | CoinGecko | Real-time cryptocurrency prices |
| Currency | Frankfurter | Currency conversion rates |
| Countries | REST Countries | Country information (250+ countries) |
| Astronomy | NASA APOD | Daily space imagery |
| News | Hacker News | Tech news via Algolia API |
| Wikipedia | MediaWiki | Article search and summaries |

## Applications

WebLinuxOS includes applications across seven categories:

| Category | Applications |
|----------|-------------|
| System | File Manager, Terminal, System Monitor, Task Manager, Settings, Software Center |
| Development | Code Editor, REST Client, Regex Tester, JSON Formatter, GitHub Explorer, Code Runner |
| Office | Text Editor, Markdown Editor, Spreadsheet, Presentation, Calendar, Notes |
| Utilities | Calculator, Weather, Password Manager, Screenshot, Character Map, Clock, Crypto Tracker, Real-Time Translator, QR Code Generator |
| Multimedia | Music Player, Video Player, Image Viewer, Drawing Tool, Camera |
| Internet | Browser, Email Client, Chat, Hacker News Reader, Wikipedia Explorer |
| Games | Snake, Tetris, 2048, Memory Card |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173/WebLinuxOS/` in your browser.

### Build for Production

```bash
npm run build
```

Build artifacts are output to the `dist/` directory.

## Deployment

### GitHub Pages

The project uses GitHub Actions for automatic deployment:

1. Push changes to the main branch
2. GitHub Actions automatically builds and deploys to GitHub Pages
3. Access at `https://saya-ch.github.io/WebLinuxOS/`

### Manual Deployment

```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

## Technical Details

### Tech Stack

- React 19 with Concurrent Features
- TypeScript 5
- Vite 8
- Zustand (state management)
- Lucide React (icons)

### Project Structure

```
web-linux/
├── src/
│   ├── apps/              # Application components
│   │   ├── terminal/      # Terminal command system
│   │   └── *.tsx         # Individual applications
│   ├── components/        # System components (Window, Taskbar, Desktop)
│   ├── store/             # State management utilities
│   │   ├── fileUtils.ts   # File system operations
│   │   ├── storageUtils.ts # localStorage persistence
│   │   └── defaults.ts    # Default state values
│   ├── store.tsx          # Global state management (Zustand)
│   ├── types.ts           # TypeScript definitions
│   ├── apps.tsx           # Application registry
│   └── index.css          # Global styles
├── public/                # Static assets
├── vite.config.ts         # Build configuration
└── package.json           # Dependencies
```

## Usage

### Basic Operations

- **Launch Apps**: Click desktop icons or use the start menu (click the penguin icon)
- **Switch Windows**: Alt+Tab or click taskbar icons
- **Manage Files**: Use File Manager for all file operations
- **Search**: Ctrl+K for global search
- **Multiple Desktops**: Switch with taskbar buttons or Ctrl+Arrow keys

### Terminal Commands

The terminal supports 80+ commands. Type `help` in the terminal for the full list. Key categories:

**File Operations**: `ls`, `cd`, `pwd`, `cat`, `mkdir`, `touch`, `rm`, `cp`, `mv`, `grep`, `find`, `tree`

**System Info**: `whoami`, `hostname`, `date`, `uname`, `uptime`, `neofetch`, `ps`, `top`

**Network**: `ping`, `curl`, `fetch`, `weather`, `news`, `crypto`, `translate`, `ipinfo`

**Utilities**: `calc`, `password`, `uuid`, `hash`, `base64`, `json`, `urlencode`

**Fun**: `cowsay`, `fortune`, `starwars`, `matrix`, `joke`, `advice`

### File Preview

Double-click files to preview:
- Images: JPG, PNG, GIF, SVG, WebP
- Text: TXT, Markdown, JSON, code files
- Audio: MP3, WAV, FLAC
- Video: MP4, WebM, OGG

## Keyboard Shortcuts

Press Ctrl+Shift+? to open the full shortcut reference panel.

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+Shift+S | Open settings |
| Ctrl+Shift+F | Open file manager |
| Ctrl+Shift+T | Open terminal |
| Ctrl+N | New terminal window |
| Ctrl+W | Close current window |
| Ctrl+M | Minimize current window |
| F11 | Toggle fullscreen/maximize |
| Alt+Tab | Switch windows |
| Ctrl+K | Global search |
| Ctrl+, | Open settings |
| Ctrl+Arrow | Switch desktop |

## Performance

- Lazy loading for applications via dynamic imports
- Code splitting for reduced bundle size (vendor chunks + per-app chunks)
- Virtual scrolling for long lists
- CSS animations for smooth 60fps transitions
- GPU-accelerated transforms for window dragging
- Content-visibility for off-screen content

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Recent Improvements

### v14.0.0 (Current Iteration)

**New Applications:**
- **Real-Time Translator Enhanced**: Professional translation tool with MyMemory API integration, supporting 15+ languages, automatic translation, history tracking, and text-to-speech functionality
- **QR Code Generator Pro**: Advanced QR code generator with goQR.me API integration, custom colors, size control, error correction levels, and batch history

**Key Improvements:**
- Converted simulation applications to production-grade tools with real API integrations
- Extended dynamic application registration system (APP_REGISTRY_EXTRAS)
- Unified modern UI design across all new applications
- Enhanced error handling and user notification systems
- Added localStorage persistence for user history and preferences

**API Integrations:**
- MyMemory Translation API (free, no key required) - supports 15+ languages
- goQR.me QR Code API (free, no key required) - custom styling and error correction
- Web Speech API - text-to-speech for translation results

### v13.0.0

**New Applications:**
- **Code Collaboration Platform**: Real-time collaborative coding environment with session sharing, multi-language support, and live code execution
- Enhanced developer tools with practical real-world functionality

**Key Improvements:**
- Strengthened application functionality from simulation shells to practical tools
- Optimized UI/UX with refined interactions and visual feedback
- Enhanced code quality and error handling across core components
- Improved GitHub Pages deployment configuration
- Added comprehensive keyboard shortcuts documentation

### v12.0.0

- Added CountryInfo application with REST Countries API integration (250+ countries)
- Enhanced Astro Daily with NASA APOD API (random dates, favorites, download)
- Improved Code Editor with auto-completion, find/replace, multi-tab support
- Enhanced Crypto Tracker with portfolio management and coin converter
- Updated GitHub Explorer with real-time trending repos and search

### v11.1.0

- Enhanced file preview with audio/video support
- Added global shortcut reference panel (Ctrl+Shift+?)
- Improved window snapping with alignment guides
- Enhanced System Monitor with real-time metrics
- Fixed file manager cut operation bug
- Added terminal Git commands

### v10.0.0

- Major UI/UX overhaul with new theme system
- Added live wallpaper support (particles, aurora, nebula)
- Enhanced window management with snap hints
- Improved performance with GPU acceleration

---

## Future Roadmap

- Integration with more public APIs for enhanced functionality
- Real-time collaborative features across multiple applications
- Enhanced AI-powered tools and assistants
- Mobile-responsive optimizations
- Offline capability with localStorage persistence
- Plugin system for third-party extensions

---

Built with modern web technologies for a seamless desktop experience.
