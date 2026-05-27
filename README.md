# WebLinuxOS

A complete Linux desktop environment running entirely in the browser. Experience the power of a full operating system without any installation required.

![WebLinuxOS Screenshot](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/assets/screenshot.png)

## Overview

WebLinuxOS is a feature-rich web-based Linux desktop environment that brings the power of a full operating system experience directly to your browser. Built with modern web technologies, it provides a comprehensive desktop experience with window management, file system, terminal emulator, and over 90 applications.

## Features

### Desktop Environment

- **Multi Virtual Desktops** - Support for up to 9 virtual desktops with window management across desktops
- **Advanced Window Management** - Drag, resize, minimize, maximize, close with smooth animations
- **Dynamic Wallpapers** - Multiple live wallpaper effects including particles, interactive mode, and waves
- **Start Menu** - Quick access to all applications via Super key or click
- **Taskbar** - Window switching, desktop indicators, system tray with quick settings
- **Context Menus** - Right-click menus on desktop and windows
- **Global Keyboard Shortcuts** - Comprehensive shortcut support for power users

### Terminal Emulator

- **80+ Built-in Commands** - Comprehensive Linux command coverage
- **Python 3 Runtime** - Full Python support via Pyodide
- **Command History** - Persistent history with arrow key navigation
- **Auto-completion** - Smart tab completion for commands and files
- **Advanced Commands** - dig, nc, file, stat, chmod, chown, hostnamectl, timedatectl, ip, cheat sheets
- **Fun Commands** - cowsay, fortune, sl, matrix for entertainment

### Virtual File System

- **Persistent Storage** - Data saved to localStorage automatically
- **Complete File Operations** - Create, read, write, rename, copy, move, delete with full support
- **Undo/Redo** - Full operation history with Ctrl+Z and Ctrl+Y
- **File Search** - Global file search functionality
- **File Associations** - Open files with appropriate applications automatically

### Applications (90+)

**System Tools**: File Manager, Terminal, System Monitor, Settings, Software Center, Disk Analyzer, Task Manager, Process Monitor, Network Monitor, Firewall, User Manager, Backup Tool, Archive Manager, System Dashboard, Performance Monitor, Log Viewer, System Health Check

**Development**: Code Editor, Code Playground, Code Studio, API Tester, JSON Formatter, Regex Builder, GitHub Trending, Code Snippets Manager, Data Visualization, Quick Commands, Command Reference, Task Automation, Developer Toolkit

**Office**: Text Editor, Markdown Editor, Spreadsheet, Presentation, Calendar, Todo List, Notes, Mind Map, Sticky Notes Wall, Kanban Board, Project Manager, Task Dashboard, Activity Tracker, Dictionary, Translator, Character Map

**Network**: Browser, IP & DNS Lookup, Weather, News Reader, Cryptocurrency Tracker, Cloud Sync, Email Client, Chat, AI Helper, Learning Platform

**Multimedia**: Music Player, Video Player, Paint, Image Viewer, Music Visualizer, Camera, Sound Recorder, Screen Recorder, PDF Viewer, Whiteboard

**Utilities**: Calculator, Password Manager, Pomodoro Timer, Color Picker, QR Generator, Unit Converter, Currency Converter, Voice Transcriber, Magnifier, Font Viewer, System Toolbox, Focus Mode

**Games**: Snake, Tetris, Virtual Pet, Particle System

## Technology Stack

- **React 19** - UI component framework with latest features
- **TypeScript 6** - Type-safe development
- **Zustand 5** - State management
- **Vite 8** - Build tool for fast development
- **Pyodide 0.26** - In-browser Python runtime
- **Lucide React** - Beautiful icon library

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
| `Super` or `Ctrl+Shift+L` | Open launcher |
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

WebLinuxOS integrates several public APIs for enhanced functionality:

- **Open-Meteo** - Weather data and forecasts
- **ipapi.co** - IP geolocation services
- **Cloudflare DNS** - DNS query resolution
- **GitHub API** - GitHub trending repositories
- **ExchangeRate-API** - Currency exchange rates

## Browser Compatibility

- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## Project Structure

```
web-linux/
├── public/              # Static assets
├── src/
│   ├── apps/            # Application components (90+ apps)
│   ├── components/      # UI components
│   │   └── desktop/     # Desktop environment components
│   ├── icons/           # Custom icons
│   ├── types/           # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   ├── main.tsx         # Entry point
│   ├── store.tsx        # Zustand state management
│   ├── apps.tsx         # Application registry
│   └── index.css        # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Performance Optimization

WebLinuxOS includes several performance optimizations:

- GPU-accelerated animations and transitions
- Code splitting for faster initial load
- Lazy loading for application components
- Virtualized lists for improved rendering performance
- Optimized CSS with hardware acceleration

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Reduced motion preference respected
- Focus indicators for all interactive elements

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript type checking
npm run format           # Format code with Prettier

# Deployment
npm run deploy           # Build and deploy to GitHub Pages
```

### Building

The project uses Vite for building and includes special configuration for GitHub Pages deployment:

- Automatic code splitting by application
- Vendor chunking for React, Zustand, and Pyodide
- CSS minification and optimization
- Source maps disabled for production

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests. When contributing:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run lint and typecheck
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Acknowledgments

Special thanks to the following projects and communities:

- [Lucide Icons](https://lucide.dev/) - Beautiful open-source icons
- [Pyodide](https://pyodide.org/) - Python in the browser
- [Open-Meteo](https://open-meteo.com/) - Free weather API
- All open source contributors

## Live Demo

Visit the live demo at: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

---

**Status**: Production Ready | **Version**: 4.0.0 | **License**: MIT
