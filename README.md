# WebLinuxOS

A complete Linux desktop environment running in the browser.

## Overview

WebLinuxOS is a feature-rich web-based Linux desktop environment that runs entirely in your browser without requiring any installation. It provides a realistic window management system, virtual file system, terminal emulator, and a rich ecosystem of applications.

**Key Features:**
- Complete desktop experience with multi-window management and virtual desktops
- Virtual file system with file operations and persistent storage
- Feature-rich terminal with 80+ commands and Python runtime support
- 80+ pre-installed applications covering development, office, entertainment, and utilities
- Real API integrations providing practical network tools
- Activity tracking and productivity insights
- Dark/Light theme support

## Live Demo

Try WebLinuxOS directly in your browser:

[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Desktop Environment

- **Multi Virtual Desktops**: Support for up to 4 desktops with window management
- **Window Management**: Drag, resize, minimize, maximize, and close windows
- **Right-click Context Menu**: Quick access to common actions
- **Dynamic Wallpaper**: Support for static and animated wallpapers
- **Dark/Light Theme**: Theme switching support
- **Global Shortcuts**: Comprehensive keyboard shortcuts
- **Activity Tracking**: Monitor application usage patterns

## Terminal Emulator

- 80+ built-in commands (ls, cd, cat, mkdir, rm, neofetch, etc.)
- Python 3 runtime support (based on Pyodide)
- Command history and auto-completion
- Fun commands (cowsay, fortune, sl, matrix, figlet)
- Text processing tools (base64, hash, calc, prime)
- System monitoring commands (top, ps, df, free)

## Applications

### System Tools
- File Manager, Terminal, System Monitor, Settings, Software Center
- Disk Analyzer, Task Manager, Process Monitor, Network Monitor
- Firewall, User Manager, Backup Tool, Archive Manager
- System Dashboard, Performance Monitor, Log Viewer

### Development Tools
- Code Editor, Code Playground, API Tester, JSON Formatter
- Regex Tester, GitHub Trending, Code Snippets Manager, Code Studio
- Data Visualization, Quick Commands, Command Reference

### Office Tools
- Text Editor, Markdown Editor, Spreadsheet, Presentation
- Calendar, Todo List, Notes, Mind Map, Sticky Notes Wall
- Kanban Board, Project Manager, Task Dashboard, Activity Tracker

### Network Tools
- Browser, IP & DNS Lookup, Weather, News Reader
- Cryptocurrency Tracker, Cloud Sync, Email, Chat

### Multimedia
- Music Player, Video Player, Paint, Image Viewer
- Music Visualizer, Camera, Sound Recorder, Screen Recorder

### Utilities
- Calculator, Password Manager, Pomodoro Timer, Color Picker
- QR Generator, Unit Converter, Currency Converter, Voice Transcriber
- Dictionary, Translator, Character Map, Font Viewer, Magnifier

### Games
- Snake, Tetris, Virtual Pet, Particle System

## Technology Stack

- React 19 - UI component framework
- TypeScript - Type-safe development
- Zustand 5 - State management
- Vite 8 - Build tool
- Pyodide 0.26 - In-browser Python runtime
- Lucide React - Icon library

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

```bash
# Clone repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to directory
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Super + T` | Open Terminal |
| `Super + E` | Open File Manager |
| `Super + B` | Open Browser |
| `Super + ,` | Open Settings |
| `Super + K` | Smart Search |
| `Super + Shift + L` | Open Launcher |
| `Alt + Tab` | Switch Windows |
| `Ctrl + Alt + 1-4` | Switch Virtual Desktop |
| `Ctrl + W` | Close Window |
| `Ctrl + M` | Minimize Window |
| `Ctrl + Shift + M` | Maximize Window |
| `F11` | Fullscreen Toggle |
| `PrintScreen` | Screenshot Tool |

## Project Structure

```
web-linux/
├── src/
│   ├── apps/              # Application components (80+ apps)
│   ├── components/        # Core UI components
│   │   └── desktop/       # Desktop, Windows, Taskbar, Launcher
│   ├── store.tsx          # Zustand global state management
│   ├── apps.tsx           # Application registry
│   ├── types.ts           # TypeScript type definitions
│   ├── icons.tsx          # Custom icon components
│   └── index.css          # Global styles and theme variables
├── public/                # Static assets
└── package.json           # Project configuration
```

## API Integrations

WebLinuxOS integrates the following public APIs:

- **Open-Meteo** - Weather data
- **ipapi.co** - IP geolocation
- **Cloudflare DNS** - DNS lookup
- **GitHub Trending** - GitHub trending repositories
- **NewsAPI** - News data

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome. Please submit issues and pull requests.

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

## License

MIT License

## Changelog

### v3.6.0 (2026-05-26)

**New Features**
- System Health Check application - Comprehensive system health monitoring with real-time metrics and automated diagnostics
- Enhanced weather app improvements with better UI and more detailed forecasts
- Comprehensive health score visualization with animated conical progress indicator

**Code Quality Improvements**
- Fixed ActivityTracker component pure function issue (no more unnecessary re-renders
- Added forceUpdate hook implementation
- Added new system health application with monitoring tool

### v3.5.0 (2026-05-26)

**New Features**
- Activity Tracker application - Tracks application usage patterns and provides productivity insights
- Learning Platform application - Interactive learning resources and tutorials
- Enhanced AI Helper with code generation and execution capabilities
- System Dashboard with comprehensive system metrics visualization

**Code Quality Improvements**
- Fixed ActivityTracker useEffect setState cascade rendering issue
- Optimized component rendering performance across the application
- Improved TypeScript type definitions
- Enhanced error handling mechanisms

### v3.4.0 (2026-05-26)

**New Features**
- System Dashboard application - Integrates system monitoring, process management, and resource usage statistics
- IP & DNS Lookup tool - Supports IP geolocation and DNS record lookup
- Performance Monitor application - Real-time monitoring of CPU, memory, and network activity

**Code Quality Improvements**
- Fixed TypeScript type definition issues
- Optimized component rendering performance
- Improved build configuration
- Enhanced error handling mechanisms

### v3.3.0 (2026-05-26)

**New Features**
- System Monitor application - Real-time monitoring of CPU, memory, disk, and network activity
- Integrated system dashboard displaying system information and process list
- Dynamic charts showing CPU and memory usage trends

**Code Quality Improvements**
- Fixed Date.now() impure function call in AIHelper component
- Removed unused variables and functions in SystemMonitor component

### v3.2.0 (2026-05-26)

**New Features**
- IP & DNS Lookup tool - Integrates real APIs for IP geolocation and DNS record lookup

**Code Quality Improvements**
- Fixed ESLint errors and unnecessary escape characters
- Fixed React 19 purity warnings

### v3.1.0 (2026-05-26)

- Added Code Snippets Manager application
- Support for 16 programming languages
- Tag categorization and full-text search
- Import/export functionality