# WebLinuxOS

A fully functional web-based Linux desktop environment running entirely in the browser. No backend required - all features run client-side.

## Live Demo

Visit the live demo: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Overview

WebLinuxOS brings the Linux desktop experience to your browser. It features a modern responsive interface with multi-window management, virtual desktops, and 120+ applications - all running entirely client-side without backend dependencies.

This project demonstrates the possibilities of modern web technologies, combining the familiarity of traditional desktop environments with the accessibility of web applications.

## What Makes It Different

Unlike a typical desktop simulator, WebLinuxOS integrates real public APIs and practical tools that provide genuine utility:

- **Live Weather Data**: Real weather and air quality from Open-Meteo API
- **GitHub Trending**: Live repository trends from public GitHub API
- **Python Runtime**: Full Python 3 in-browser via Pyodide
- **Persistent Storage**: Virtual filesystem backed by IndexedDB
- **Developer Toolkit**: 90+ terminal commands, code editor, API tester, regex builder

## Table of Contents

- [Key Features](#key-features)
- [Quick Start](#quick-start)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Performance](#performance)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

## Key Features

### Desktop Environment
- **Multiple Virtual Desktops**: Switch between workspaces with customizable wallpapers
- **Advanced Window Management**: Smooth animations for opening, closing, minimizing, and maximizing windows
- **Smart Launcher**: Fuzzy search and categorized app list
- **System Tray**: Network, volume, and battery indicators with quick controls
- **Global Search**: Cross-app and file search
- **Command Palette**: Quick access to system commands
- **Context Menus**: Right-click menus for files and desktop
- **Dark/Light Theme**: Customizable theme switching

### Development Tools
- **Code Editor**: Syntax highlighting and code editing for multiple languages
- **API Tester**: Built-in REST API client supporting various HTTP methods
- **JSON Formatter**: Beautify, validate, and format JSON data
- **Regex Builder**: Interactive regex testing and building tools
- **GitHub Trending**: View trending repositories directly in the OS
- **Python REPL**: Full Python 3 runtime via Pyodide - run Python code in the browser
- **90+ Terminal Commands**: File operations, system monitoring, network tools, and utilities
- **Code Snippet Manager**: Save and organize code snippets for quick access

### Office & Productivity
- **Text/Markdown Editor**: Rich text editing with live preview
- **Spreadsheet**: Basic spreadsheet functionality for data entry
- **Calendar**: Date and event management with calendar view
- **Todo List**: Task management with completion tracking
- **Kanban Board**: Visual task organization with drag-and-drop
- **Smart Notes**: Smart notes with tags, colors, archiving, and import/export
- **Mind Map**: Idea visualization with node-based editing
- **Presentation Creator**: Slide-based presentations
- **Flashcards**: Learning and memorization tool
- **Habit Tracker**: Track daily habits and progress
- **Smart Dashboard**: Real-time data dashboard with weather and system stats
- **Unified Dashboard**: Consolidated intelligence dashboard combining weather data, cryptocurrency prices, GitHub trending projects, and live system metrics in a single unified view

### Utilities
- **Calculator**: Scientific calculator with advanced functions and history
- **Password Manager**: Secure password storage with encryption
- **Pomodoro**: Productivity timer with customizable work sessions
- **Color Picker**: Color selection in various formats with clipboard copy
- **QR Code Generator**: Create QR codes for text, URLs, and contacts
- **Unit Converter**: Conversion between measurement units
- **Online Toolkit**: JSON parsing, Base64 encoding, URL encoding
- **Clipboard Manager**: Advanced clipboard history and management
- **Screenshot Tool**: Desktop screenshots

### Multimedia
- **Music Player**: Audio playback with playlist support
- **Video Player**: Video playback with controls
- **Paint**: Basic drawing application with tools
- **Image Viewer**: View and zoom images
- **Camera**: Webcam access for video capture
- **Sound Recorder**: Audio recording with playback

### Entertainment & Information
- **Weather App**: Current weather and forecast via Open-Meteo API with air quality data
- **World Clock**: Multiple timezone display
- **GitHub Trending**: Live trending repositories from GitHub public API
- **News Reader**: Latest news updates
- **Games**: Snake, Tetris, and other classic games
- **Virtual Pet**: Interactive pet simulation

## Quick Start

```bash
# Clone repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Development server
npm run dev

# Production build (outputs to ../)
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+K | Global search |
| Ctrl+P | Command palette |
| Alt+Tab | Switch windows |
| Ctrl+Q | Close window |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+Shift+C | Terminal interrupt |
| Ctrl+1-9 | Switch to desktop |
| Ctrl+Alt+Arrow | Switch desktop |
| Ctrl+Shift+1-9 | Move window to desktop |

## Tech Stack

- **React 19**: UI framework with latest features
- **TypeScript 6**: Type-safe development
- **Zustand 5**: Lightweight state management
- **Vite 8**: Optimized build tool
- **Pyodide**: Python runtime running entirely in the browser
- **Lucide React**: Icon library
- **IndexedDB**: Local storage for persistent data
- **Open-Meteo API**: Free weather and air quality data
- **GitHub Public API**: Repository and trending data

## Architecture

WebLinuxOS follows a modular architecture:

```
web-linux/src/
  apps/              # Individual applications (120+)
  components/        # Shared UI components (window manager, desktop, etc.)
    desktop/         # Desktop environment components
  store/             # State management and file system utilities
  types.ts           # TypeScript type definitions
  icons.tsx          # Icon components
  App.tsx            # Main application component
```

### Core Systems

1. **Window Manager** - Multi-window system with z-index management, drag/resize, minimize/maximize
2. **Virtual File System** - Tree-based filesystem with nodes, persisted to IndexedDB
3. **Terminal Emulator** - Command parsing, execution, and output formatting
4. **State Management** - Zustand stores for windows, files, settings, and desktop state
5. **API Integration Layer** - Public API clients for weather, GitHub, and more

## Performance

WebLinuxOS is optimized for performance:

- **Code Splitting**: Each application loads on demand via manualChunks configuration
- **Lazy Loading**: Applications only load when opened
- **Memoization**: React components optimized with memo
- **Efficient Rendering**: Minimal re-renders through careful state management
- **GPU Acceleration**: Animations using transform and opacity
- **Throttle Optimization**: Drag and resize using requestAnimationFrame

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Note: Some features (Python runtime, clipboard manager) may require modern browser capabilities.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature-name`
3. Make your changes
4. Build and verify: `npm run build`
5. Submit a pull request

## License

MIT License - Free for personal or commercial use.

---

**Version**: 5.5.0
**Last Updated**: 2026-06-11

---

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
