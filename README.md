# WebLinuxOS

A fully functional web-based Linux desktop environment that runs entirely in the browser. Built with React, TypeScript, and modern web technologies, it provides a complete desktop experience without any installation required.

## Live Demo

Visit the live demo at: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Overview

WebLinuxOS brings the power of a Linux desktop to your browser. It features a modern, responsive interface with multi-window management, virtual desktops, and over 120 applications - all running client-side with no backend dependencies.

## Features

### Desktop Environment

- **Multi Virtual Desktops**: Create and switch between multiple workspaces with customizable wallpapers
- **Advanced Window Management**: Drag, resize, minimize, maximize, and close windows with smooth animations
- **Smart Launcher**: Application launcher with fuzzy search and categorized app listing
- **System Tray**: Quick access to network, volume, battery, and notification indicators
- **Global Search**: Fast app launcher and file search powered by fuzzy matching
- **Command Palette**: Keyboard-driven command execution for power users
- **Context Menus**: Right-click menus with file operations and quick actions
- **Live Wallpapers**: Interactive particle effects and dynamic backgrounds
- **Boot Splash**: Elegant animated loading screen

### Applications

The system includes 120+ pre-installed applications across multiple categories:

**System Tools**
- File Manager with tree navigation and file operations
- Terminal emulator with 90+ built-in commands
- System Monitor displaying resource usage in real-time
- Task Manager and Process Monitor
- Network Monitor and Disk Analyzer
- Backup Tool and Archive Manager
- System Settings with theme customization

**Development Tools**
- Code Editor with syntax highlighting
- API Tester with request builder
- JSON Formatter and Validator
- Regex Builder with real-time testing
- GitHub Trending repository viewer
- Command Reference documentation
- Task Automation workflow builder
- Python REPL via Pyodide

**Office & Productivity**
- Text Editor with formatting options
- Markdown Editor with live preview
- Spreadsheet application
- Calendar with event management
- Todo List and Kanban Board
- Project Planner with timeline views
- Notes and Mind Map tools
- Presentation creator
- Flashcards for learning

**Utilities**
- Calculator with scientific functions
- Password Manager with encryption
- Pomodoro Timer for productivity
- Color Picker with palette generation
- QR Code Generator
- Unit and Currency Converter
- Online Toolkit (JSON, Base64, URL encoding/decoding, hash calculation)
- Real-time Translator

**Multimedia**
- Music Player with playlist support
- Video Player with controls
- Paint application with drawing tools
- Image Viewer with zoom
- Camera and Screen Recorder
- Sound Recorder
- Image Optimizer

**Entertainment**
- Weather application with forecasts
- World Clock with multiple time zones
- Classic games (Snake, Tetris)
- Virtual Pet companion
- Particle System visualizer

### Terminal Features

The built-in terminal emulator provides:

- 90+ built-in shell commands
- Python 3 runtime via Pyodide
- Command history and auto-completion
- File system navigation and operations
- System information commands
- Calculator and utility functions
- Fun commands (cowsay, fortune, ASCII art)

**Common Commands:**
```bash
# Navigation
ls, cd, pwd, tree

# File Operations
cat, echo, mkdir, touch, rm, cp, mv, find

# System Info
neofetch, uptime, df, free, ps, top

# Development
git, npm, node, python, python3

# Utilities
calc, weather, translate, qrcode, password

# Fun
fortune, sl, banner, cowsay
```

### Web Services Integration

- Real-time weather data from Open-Meteo
- IP geolocation from ipapi.co
- Cryptocurrency prices from CoinGecko
- Currency conversion rates
- Air quality index data

## Quick Start

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to the project directory
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

### System
| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+K | Open global search |
| Ctrl+P | Command palette |
| Alt+Tab | Cycle windows |
| F11 | Toggle fullscreen |
| PrintScreen | Screenshot |
| Ctrl+Q | Close window |
| Ctrl+M | Minimize window |

### Application Launch
| Shortcut | Application |
|----------|-------------|
| Super+T | Terminal |
| Super+E | File Manager |
| Super+, | Settings |
| Super+B | Browser |
| Super+A | Calculator |
| Super+G | Code Editor |
| Super+H | Help |
| Super+D | System Monitor |

### Virtual Desktops
| Shortcut | Action |
|----------|--------|
| Ctrl+Alt+[1-9] | Switch to desktop |
| Ctrl+Alt+Arrow Left/Right | Switch workspace |
| Ctrl+Shift+Alt+[1-9] | Move window to desktop |

## Technology Stack

- **React 19** - UI component framework
- **TypeScript 6** - Type-safe development
- **Zustand 5** - Lightweight state management
- **Vite 8** - Fast build tool
- **Pyodide** - Python runtime in browser
- **Lucide React** - Icon library
- **Marked** - Markdown parsing

## Project Structure

```
web-linux/
├── src/
│   ├── apps/           # Application components (120+ apps)
│   ├── components/     # Desktop UI components
│   │   └── desktop/    # Desktop, Taskbar, Window management
│   ├── store.tsx       # Zustand state management
│   ├── apps.tsx        # Application registry
│   ├── icons.tsx       # Icon definitions
│   └── types.ts        # TypeScript type definitions
├── public/             # Static assets
├── index.html          # Entry HTML
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Performance Optimizations

WebLinuxOS includes several performance optimizations:

- **Code Splitting**: Applications are split into separate chunks
- **Lazy Loading**: Components load on demand
- **GPU Acceleration**: CSS animations leverage hardware acceleration
- **Memoization**: React memo prevents unnecessary re-renders
- **Content Visibility**: Optimized rendering for long lists
- **Tree Shaking**: Unused code is eliminated during build
- **Debounced Storage**: LocalStorage operations are optimized

## Browser Compatibility

- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## Security

- Input sanitization for all user inputs
- Safe expression evaluation in terminal calculator
- Local storage encryption for sensitive data
- No external API keys exposed in client code
- Content Security Policy headers for XSS protection

## Architecture Highlights

### Window Management
The window management system supports:
- Z-index based window layering
- Window minimize/maximize/restore
- Window drag and resize
- Multi-monitor awareness
- Window state persistence

### File System
Virtual file system with:
- Hierarchical folder structure
- File operations (create, delete, rename, move)
- Undo/redo support
- LocalStorage persistence
- File type icons

### State Management
Zustand-powered state management:
- Centralized app registry
- Window state tracking
- Desktop icons management
- Theme and wallpaper settings
- User preferences

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Pyodide for enabling Python in the browser
- Lucide for beautiful icons
- React team for the component framework
- Vite team for the build tool
- All open source libraries used in this project

---

Built with React, TypeScript, and modern web technologies
