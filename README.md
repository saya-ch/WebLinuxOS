# WebLinuxOS

A fully functional web-based desktop operating system that runs entirely in the browser. No installation required.

![WebLinuxOS screenshot](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/public/screenshot.png)

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)** | **[Features](#features)** | **[Applications](#applications)** | **[Getting Started](#getting-started)**

---

## Overview

WebLinuxOS brings a complete Linux-like desktop experience to your browser. It includes window management, a virtual file system, taskbar, system tray, and over 250 applications—all running entirely client-side without any backend server.

The system is built with React 19, TypeScript, and Vite, delivering smooth animations, responsive design, and a feature set that rivals native desktop environments. Unlike many demo projects, WebLinuxOS features real functionality with live API integrations throughout.

## Features

### Desktop Environment

- **Window System**: Drag, resize, minimize, maximize, and close windows with smooth animations
- **Taskbar**: Application switching, system tray, real-time clock, and workspace management
- **Virtual Filesystem**: Complete file browsing, creation, editing, and organization
- **Multi-workspace**: Organize windows across multiple virtual desktops
- **Theme System**: Dark/light mode with custom accent colors
- **Keyboard Shortcuts**: Comprehensive hotkey support (Ctrl+Shift+? for reference)

### Terminal

- 80+ built-in commands covering file operations, system information, networking, and utilities
- Real API integrations for weather, news, crypto prices, and IP lookup
- Command history and auto-completion
- Syntax highlighting and colored output

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

- **Weather**: Open-Meteo API
- **Crypto Prices**: CoinGecko API
- **Currency Conversion**: Frankfurter API
- **Country Information**: REST Countries API
- **Astronomy**: NASA APOD API
- **News**: Hacker News Algolia API
- **Wikipedia**: MediaWiki API

## Applications

WebLinuxOS includes applications across seven categories:

| Category | Applications |
|----------|-------------|
| System | File Manager, Terminal, System Monitor, Task Manager, Settings, Software Center |
| Development | Code Editor, REST Client, Regex Tester, JSON Formatter, GitHub Explorer, Code Runner |
| Office | Text Editor, Markdown Editor, Spreadsheet, Presentation, Calendar, Notes |
| Utilities | Calculator, Weather, Password Manager, Screenshot, Character Map, Clock, Crypto Tracker |
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
│   ├── components/        # System components (Window, Taskbar, Desktop)
│   ├── store.tsx          # Global state management
│   ├── types.ts           # TypeScript definitions
│   └── index.css          # Global styles
├── public/                # Static assets
├── vite.config.ts         # Build configuration
└── package.json           # Dependencies
```

## Usage

### Basic Operations

- **Launch Apps**: Click desktop icons or use the start menu
- **Switch Windows**: Alt+Tab or click taskbar icons
- **Manage Files**: Use File Manager for all file operations
- **Search**: Ctrl+K for global search

### Keyboard Shortcuts

Press Ctrl+Shift+? to open the full shortcut reference panel.

### File Preview

Double-click files to preview:
- Images: JPG, PNG, GIF, SVG, WebP
- Text: TXT, Markdown, JSON, code files
- Audio: MP3, WAV, FLAC
- Video: MP4, WebM, OGG

## Performance

- Lazy loading for applications
- Code splitting for reduced bundle size
- Virtual scrolling for long lists
- CSS animations for smooth transitions
- Optimized re-renders with React memo

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Changelog

### v12.1.0

- Enhanced terminal with 80+ commands, fixing duplicate command definitions
- Improved weather application with city search and 7-day forecast
- Enhanced news reader with Hacker News API integration and filtering
- Improved translator with multi-language support and history
- Updated README with improved structure and documentation
- Performance optimizations for large application list rendering

### v12.0.0

- Added Country Info application with REST Countries API integration (250+ countries)
- Enhanced Astro Daily with NASA APOD API (random dates, favorites, download)
- Improved Code Editor with auto-completion, find/replace, multi-tab support
- Enhanced Crypto Tracker with portfolio management and coin converter
- Updated GitHub Explorer with real-time trending repos and search
- Added comprehensive API integration documentation

### v11.1.0

- Enhanced file preview with audio/video support
- Added global shortcut reference panel (Ctrl+Shift+?)
- Improved window snapping with alignment guides
- Enhanced System Monitor with real-time metrics
- Fixed file manager cut operation bug
- Added terminal Git commands

---

Built with modern web technologies for a seamless desktop experience.