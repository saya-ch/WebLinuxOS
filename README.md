# WebLinuxOS

A complete Linux desktop environment running entirely in the browser.

![WebLinuxOS Screenshot](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/assets/screenshot.png)

## Overview

WebLinuxOS is a feature-rich web-based Linux desktop environment that brings the power of a full operating system experience directly to your browser. No installation required - simply visit the live demo and start using it immediately.

## Features

### Desktop Environment
- **Multi Virtual Desktops** - Support for up to 9 virtual desktops with window management across desktops
- **Advanced Window Management** - Drag, resize, minimize, maximize, close with smooth animations
- **Dynamic Wallpapers** - Multiple live wallpaper effects including particles and aurora
- **Start Menu** - Quick access to all applications via Super key or click
- **Taskbar** - Window switching, desktop indicators, system tray with quick settings
- **Context Menus** - Right-click menus on desktop and windows
- **Global Keyboard Shortcuts** - Comprehensive shortcut support

### Terminal Emulator
- **80+ Built-in Commands** - Comprehensive Linux command coverage
- **Python 3 Runtime** - Full Python support via Pyodide
- **Command History** - Persistent history with arrow key navigation
- **Auto-completion** - Smart tab completion
- **Advanced Commands** - dig, nc, file, stat, chmod, chown, hostnamectl, timedatectl, ip, cheat sheets
- **Fun Commands** - cowsay, fortune, sl, matrix

### Virtual File System
- **Persistent Storage** - Data saved to localStorage
- **Complete File Operations** - Create, read, write, rename, copy, move, delete
- **Undo/Redo** - Full operation history
- **File Search** - Global file search functionality
- **File Associations** - Open files with appropriate applications

### Applications (90+)

**System Tools**: File Manager, Terminal, System Monitor, Settings, Software Center, Disk Analyzer, Task Manager, Process Monitor, Network Monitor, Firewall, User Manager, Backup Tool, Archive Manager, System Dashboard, Performance Monitor, Log Viewer, System Health Check

**Development**: Code Editor, Code Playground, Code Studio, API Tester, JSON Formatter, Regex Builder, GitHub Trending, Code Snippets Manager, Data Visualization, Quick Commands, Command Reference, Task Automation, Developer Toolkit

**Office**: Text Editor, Markdown Editor, Spreadsheet, Presentation, Calendar, Todo List, Notes, Mind Map, Sticky Notes Wall, Kanban Board, Project Manager, Task Dashboard, Activity Tracker, Dictionary, Translator, Character Map

**Network**: Browser, IP & DNS Lookup, Weather, News Reader, Cryptocurrency Tracker, Cloud Sync, Email Client, Chat, AI Helper, Learning Platform

**Multimedia**: Music Player, Video Player, Paint, Image Viewer, Music Visualizer, Camera, Sound Recorder, Screen Recorder, PDF Viewer, Whiteboard

**Utilities**: Calculator, Password Manager, Pomodoro Timer, Color Picker, QR Generator, Unit Converter, Currency Converter, Voice Transcriber, Magnifier, Font Viewer, System Toolbox, Focus Mode

**Games**: Snake, Tetris, Virtual Pet, Particle System

## Technology Stack

- **React 19** - UI component framework
- **TypeScript 6** - Type-safe development
- **Zustand 5** - State management
- **Vite 8** - Build tool
- **Pyodide 0.26** - In-browser Python runtime
- **Lucide React** - Icon library

## Quick Start

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to project directory
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super` | Open launcher |
| `Super + T` | Open terminal |
| `Super + E` | Open file manager |
| `Super + B` | Open browser |
| `Super + K` | Global search |
| `Super + P` | Command palette |
| `Alt + Tab` | Window switcher |
| `Ctrl + Alt + Arrow` | Switch desktop |
| `Ctrl + Alt + [1-9]` | Go to desktop |
| `Ctrl + Shift + Alt + [1-9]` | Move window to desktop |
| `Super + Q` | Close window |
| `Super + M` | Minimize window |
| `F11` | Toggle fullscreen |
| `PrintScreen` | Screenshot |

## API Integrations

WebLinuxOS integrates several public APIs:

- **Open-Meteo** - Weather data
- **ipapi.co** - IP geolocation
- **Cloudflare DNS** - DNS queries
- **GitHub API** - GitHub trending repositories
- **ExchangeRate-API** - Currency exchange rates

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Project Structure

```
web-linux/
├── public/              # Static assets
├── src/
│   ├── apps/            # Application components
│   ├── components/      # UI components
│   ├── icons/           # Custom icons
│   ├── types/           # TypeScript types
│   ├── App.tsx          # Main application
│   ├── main.tsx         # Entry point
│   ├── store.tsx        # Zustand store
│   ├── apps.tsx         # Application registry
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## License

MIT License - See LICENSE file for details

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Acknowledgments

- [Lucide Icons](https://lucide.dev/)
- [Pyodide](https://pyodide.org/)
- [Open-Meteo](https://open-meteo.com/)
- All open source contributors

---

**Live Demo**: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)