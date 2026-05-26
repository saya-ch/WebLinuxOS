# WebLinuxOS

A complete Linux desktop environment running in the browser. Experience a fully functional web-based operating system with 80+ applications, window management, virtual file system, terminal emulator, and more.

## Features

### Desktop Environment
- Multi-window management with drag, resize, minimize, maximize
- Virtual desktops (up to 4 workspaces)
- Context menus and global shortcuts
- Dynamic and animated wallpapers
- Dark/Light theme switching
- Activity tracking and usage insights

### Terminal Emulator
- 80+ built-in commands
- Python 3 runtime support (Pyodide)
- Command history and auto-completion
- Text processing tools
- System monitoring commands

### Applications

**System Tools**
- System Monitor, Performance Monitor
- System Dashboard, Health Check
- File Manager, Task Manager
- Disk Analyzer, Network Monitor
- Power Manager, Firewall

**Development Tools**
- Code Editor, Code Playground
- API Tester, Regex Tester
- JSON Formatter
- GitHub Trending
- Code Snippets Manager

**Office Tools**
- Text Editor, Markdown Editor
- Spreadsheet, Presentation
- Todo List, Kanban Board
- Notes, Mind Map

**Network & Utilities**
- Web Browser, Weather
- News Reader, Email
- Calculator, Color Picker
- QR Generator, Unit Converter
- Password Manager, Clipboard History
- System Toolbox (UUID, Hash, JWT, etc.)

**Multimedia**
- Music Player, Video Player
- Image Viewer, Paint
- Camera, Sound Recorder

### API Integrations
- Open-Meteo - Weather data
- ipapi.co - IP geolocation
- Cloudflare DNS - DNS lookup
- GitHub API - Trending repositories
- NewsAPI - News feed

## Quick Start

```bash
# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Technology Stack

- React 19 - UI framework
- TypeScript - Type safety
- Zustand 5 - State management
- Vite 8 - Build tool
- Pyodide 0.26 - Python runtime

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super + T` | Terminal |
| `Super + E` | File Manager |
| `Super + B` | Browser |
| `Super + ,` | Settings |
| `Super + Shift + K` | Smart Search |
| `Super + Shift + L` | Launcher |
| `Alt + Tab` | Cycle Windows |
| `Ctrl + Alt + 1-4` | Switch Desktop |
| `Ctrl + W` | Close Window |
| `Ctrl + M` | Minimize Window |
| `Ctrl + Shift + M` | Maximize Window |
| `F11` | Fullscreen |

## Browser Compatibility

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License
