# WebLinuxOS

A fully functional web-based Linux desktop environment that runs entirely in the browser. No backend required - everything runs client-side.

## Live Demo

Visit the live demo at: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Overview

WebLinuxOS brings the power of a Linux desktop experience to your browser. It features a modern, responsive interface with multi-window management, virtual desktops, and over 120 applications - all running entirely client-side with no backend dependencies.

This project demonstrates what's possible with modern web technologies, combining the familiarity of a traditional desktop environment with the accessibility of web applications.

## Features

### Desktop Environment

- **Multi Virtual Desktops**: Switch between multiple workspaces with customizable wallpapers
- **Advanced Window Management**: Smooth animations for opening, closing, minimizing, and maximizing windows
- **Smart Launcher**: Fuzzy search and categorized application listing
- **System Tray**: Network, volume, and battery indicators with quick controls
- **Global Search**: Search across all applications and files
- **Command Palette**: Quick access to system commands
- **Context Menus**: Right-click menus for files and desktop
- **Live Wallpapers**: Dynamic wallpaper effects
- **Boot Splash**: Elegant startup animation

### Development Tools

- **Code Editor**: Syntax highlighting for multiple languages
- **API Tester**: Test REST APIs with built-in client
- **JSON Formatter**: Pretty-print and validate JSON
- **Regex Builder**: Interactive regex testing
- **GitHub Trending**: View trending repositories
- **Python REPL**: Full Python 3 runtime via Pyodide
- **Terminal**: 90+ shell commands including file operations, system monitoring, and utilities

### Office & Productivity

- **Text/Markdown Editors**: Rich text editing with preview
- **Spreadsheet**: Basic spreadsheet functionality
- **Calendar**: Date and event management
- **Todo List**: Task management with completion tracking
- **Kanban Board**: Visual task organization
- **Project Planner**: Timeline and milestone tracking
- **Notes**: Sticky notes for quick reminders
- **Mind Map**: Idea visualization
- **Presentation Creator**: Slide-based presentations
- **Flashcards**: Study and memorization tool

### Utilities

- **Calculator**: Scientific calculator with advanced functions
- **Password Manager**: Secure password storage
- **Pomodoro Timer**: Productivity timer
- **Color Picker**: Color selection with various formats
- **QR Generator**: Create QR codes
- **Unit Converter**: Convert between units
- **Real-time Translator**: Multi-language translation
- **Online Toolkit**: JSON parsing, Base64 encoding, URL encoding

### Multimedia

- **Music Player**: Audio playback with controls
- **Video Player**: Video playback support
- **Paint**: Basic drawing application
- **Image Viewer**: View and zoom images
- **Camera**: Access webcam
- **Screen Recorder**: Record screen activity
- **Sound Recorder**: Audio recording

### Entertainment

- **Weather App**: Current weather and forecasts
- **World Clock**: Multiple time zones
- **News Reader**: Latest news updates
- **Games**: Snake, Tetris, and other classic games
- **Virtual Pet**: Interactive pet simulation
- **Particle System**: Visual effects

## Terminal Commands

The terminal supports over 90 commands, including:

- **File Operations**: ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, tree, wc, du
- **System Info**: whoami, hostname, date, uname, uptime, cal, free, df, ps, top, sysinfo
- **Network Tools**: ping, ifconfig, curl, host, nslookup, dig, traceroute, nmap
- **System Monitoring**: vmstat, iostat, netstat, ss, lsof, htop, btop
- **Utilities**: echo, find, grep, env, export, which, file
- **Productivity**: translate, news, worldtime, todo
- **Encryption**: base64, hash, openssl, ssh-keygen
- **Math Tools**: calc, bc, expr, seq
- **Fun Commands**: cowsay, fortune, joke, advice, flip, rps

## Quick Start

```bash
# Clone repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
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
| Alt+Tab | Cycle windows |
| Ctrl+Q | Close window |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+Shift+C | Terminal interrupt |

## Technology Stack

- **React 19**: UI framework
- **TypeScript 6**: Type-safe development
- **Zustand 5**: Lightweight state management
- **Vite 8**: Fast build tool
- **Pyodide**: Python runtime in browser
- **Lucide React**: Icon library
- **Tailwind CSS**: Styling
- **IndexedDB**: Local storage

## Architecture

WebLinuxOS follows a modular architecture:

- **Components**: Reusable UI components (Window, Taskbar, StartMenu, etc.)
- **Apps**: Individual applications (Terminal, CodeEditor, Calculator, etc.)
- **Store**: Global state management with Zustand
- **Utils**: Helper functions and utilities
- **Types**: TypeScript type definitions

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm run test`
5. Build: `npm run build`
6. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Inspired by various web-based operating systems
- Built with modern web technologies
- Community contributions welcome