# WebLinuxOS

A feature-rich Linux desktop environment running entirely in the browser. Experience a complete operating system without any installation.

![WebLinuxOS Screenshot](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/assets/screenshot.png)

## Introduction

WebLinuxOS is a comprehensive web-based Linux desktop environment that brings the full power of a desktop operating system to your browser. Built with modern web technologies, it delivers a native-like desktop experience with window management, file system, terminal emulator, and over 90 applications.

## Core Features

### Desktop Environment
- **Multi Virtual Desktops** - Up to 9 virtual desktops with seamless window management across workspaces
- **Advanced Window Management** - Drag, resize, minimize, maximize, and close with smooth animations
- **Dynamic Wallpapers** - Live wallpaper effects including particles, interactive mode, and waves
- **Start Menu** - Quick access to all applications via Super key or mouse click
- **Taskbar** - Window switching, desktop indicators, system tray with quick settings
- **Context Menus** - Right-click menus on desktop and application windows
- **Global Keyboard Shortcuts** - Comprehensive shortcut support for power users

### Terminal Emulator
- **90+ Built-in Commands** - Comprehensive Linux command coverage
- **Python 3 Runtime** - Full Python support via Pyodide
- **Command History** - Persistent history with arrow key navigation
- **Auto-completion** - Smart tab completion for commands and files
- **Advanced Commands** - dig, nc, file, stat, chmod, chown, hostnamectl, timedatectl, ip, cheat sheets
- **Fun Commands** - cowsay, fortune, sl, matrix, figlet, banner for entertainment
- **System Monitoring** - vmstat, iostat, df, free, ps, top for system insights

### Virtual File System
- **Persistent Storage** - Automatic data persistence using localStorage
- **Complete File Operations** - Create, read, write, rename, copy, move, delete with full support
- **Undo/Redo** - Full operation history with Ctrl+Z and Ctrl+Y support
- **File Search** - Global file search functionality
- **File Associations** - Automatic file opening with appropriate applications

### Web Services Integration
- **IP Geolocation** - Real-time IP information retrieval
- **Weather Forecast** - Global weather data with detailed metrics
- **World Clock** - Multi-timezone clock display
- **Currency Conversion** - Real-time exchange rates
- **Cryptocurrency Tracking** - Live crypto price monitoring

## Applications (90+)

**System Tools**: File Manager, Terminal, System Monitor, Settings, Software Center, Disk Analyzer, Task Manager, Process Monitor, Network Monitor, Firewall, User Manager, Backup Tool, Archive Manager, System Dashboard, Performance Monitor, Log Viewer, System Health Check

**Development**: Code Editor, Code Playground, Code Studio, API Tester, JSON Formatter, Regex Builder, GitHub Trending, Code Snippets Manager, Data Visualization, Quick Commands, Command Reference, Task Automation, Developer Toolkit, AI Code Assistant, Code Generator, Code Reviewer

**Office**: Text Editor, Markdown Editor, Spreadsheet, Presentation, Calendar, Todo List, Notes, Smart Notes, Mind Map, Sticky Notes Wall, Kanban Board, Project Planner, Task Dashboard, Activity Tracker, Dictionary, Translator, Character Map, Font Viewer

**Network**: Browser, IP & DNS Lookup, Weather, News Reader, Cryptocurrency Tracker, Cloud Sync, Email Client, Chat, AI Helper, ChatAI, Learning Platform

**Multimedia**: Music Player, Video Player, Paint, Image Viewer, Music Visualizer, Camera, Sound Recorder, Screen Recorder, PDF Viewer, Whiteboard, Creative Toolkit

**Utilities**: Calculator, Password Manager, Smart Password Manager, Pomodoro Timer, Color Picker, QR Generator, Unit Converter, Currency Converter, Voice Transcriber, Magnifier, System Toolbox, Focus Mode, Quick Launcher, Timer App, Clipboard Manager, Clipboard History, Random Tools, Text Formatter, Web Services Toolbox

**Games**: Snake, Tetris, Virtual Pet, Particle System

## Technology Stack

- **React 19** - UI component framework with Concurrent Features
- **TypeScript 6** - Type-safe development with latest features
- **Zustand 5** - Lightweight state management
- **Vite 8** - Fast build tool with HMR
- **Pyodide 0.26** - In-browser Python runtime
- **Lucide React** - Beautiful icon library

## New Features

### Recently Added Applications

- **Quick Markdown Preview** - Fast markdown preview with live rendering
- **Notes App** - Full-featured note-taking with tags and search
- **Clipboard Manager** - Automatic clipboard history with search and organization

### Productivity Enhancements

- **Advanced Terminal** - 90+ commands including Python 3 runtime support
- **Smart Search** - Global search across all applications and files
- **Cloud Integration** - Real-time data synchronization

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

## What's New in Latest Update

- Added markdown preview functionality with `marked` library integration
- Enhanced notes application with tags and search
- Improved clipboard manager with auto-tracking
- Performance optimizations for faster application loading
- Bug fixes and stability improvements

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
| `Super + A` | Open calculator |
| `Super + Shift + T` | Open text editor |
| `Super + Shift + M` | Open music player |
| `Super + D` | Open system monitor |
| `Super + W` | Open weather |

## API Integrations

WebLinuxOS integrates several public APIs for enhanced functionality:

- **Open-Meteo** - Weather data and forecasts
- **ipapi.co** - IP geolocation services
- **Cloudflare DNS** - DNS query resolution
- **GitHub API** - GitHub trending repositories
- **ExchangeRate-API** - Currency exchange rates
- **CoinGecko** - Cryptocurrency prices

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
- Tree-shaking for unused code elimination

## Accessibility

- Keyboard navigation support
- ARIA labels for screen readers
- High contrast mode support
- Reduced motion preference respected
- Focus indicators for all interactive elements
- Semantic HTML structure

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
- Environment-specific configuration

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
- [CoinGecko](https://coingecko.com/) - Cryptocurrency API
- All open source contributors

## Live Demo

Visit the live demo at: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

---

**Status**: Production Ready | **Version**: 4.1.0 | **License**: MIT