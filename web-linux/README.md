# WebLinuxOS

A feature-rich Linux desktop environment running entirely in the browser. Experience the power of a modern operating system without any installation.

![WebLinuxOS](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/assets/screenshot.png)

## Features

### Desktop Environment
- Multi virtual desktops with smooth transitions
- Advanced window management (drag, resize, minimize, maximize)
- Dynamic wallpapers with particle effects
- Smart launcher with fuzzy search
- Context menus and global keyboard shortcuts

### Applications (120+)

**System Tools**
File Manager, Terminal, System Monitor, Settings, Task Manager, Process Monitor, Network Monitor, Disk Analyzer, Backup Tool, Archive Manager

**Development**
Code Editor, API Tester, JSON Formatter, Regex Builder, GitHub Trending, Command Reference, Task Automation, Developer Toolkit

**Office & Productivity**
Text Editor, Markdown Editor, Spreadsheet, Calendar, Todo List, Kanban Board, Project Planner, Notes, Mind Map

**Network & Communication**
Browser, Email Client, Chat Application, News Reader, Cloud Sync

**Multimedia**
Music Player, Video Player, Paint, Image Viewer, Camera, Sound Recorder, Screen Recorder

**Utilities**
Calculator, Password Manager, Pomodoro Timer, Color Picker, QR Generator, Unit Converter, Currency Converter, Voice Transcriber

**Entertainment**
Weather, World Clock, Snake Game, Tetris, Virtual Pet

### Terminal Emulator
- 90+ built-in commands
- Python 3 runtime via Pyodide
- Command history and auto-completion
- File operations and system monitoring

### Web Services Integration
- Real-time weather data (Open-Meteo)
- IP geolocation (ipapi.co)
- Cryptocurrency prices (CoinGecko)
- Currency conversion
- Air quality index

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

## Technology Stack

- React 19 - UI component framework
- TypeScript 6 - Type-safe development
- Zustand 5 - State management
- Vite 8 - Build tool
- Pyodide - Python in browser

## Keyboard Shortcuts

### System
- `Ctrl+Shift+L` - Open launcher
- `Ctrl+K` - Open global search
- `Ctrl+P` - Command palette
- `Alt+Tab` - Cycle windows
- `F11` - Toggle fullscreen
- `PrintScreen` - Screenshot

### Applications
- `Super+T` - Terminal
- `Super+E` - File Manager
- `Super+,` - Settings
- `Super+A` - Calculator

## Project Structure

```
web-linux/
├── src/
│   ├── apps/           # 120+ applications
│   ├── components/     # Desktop components
│   ├── store.tsx      # Zustand state management
│   ├── apps.tsx       # App registry
│   └── icons.tsx      # Icon registry
├── public/            # Static assets
└── package.json
```

## Performance

WebLinuxOS includes comprehensive performance optimizations:

- Code splitting by application
- Lazy loading for faster initial load
- GPU acceleration for animations
- Memoization to prevent unnecessary re-renders
- Content visibility for long lists

## Browser Compatibility

- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## License

MIT License

## Live Demo

Visit the live demo: https://saya-ch.github.io/WebLinuxOS/

---

Made with React, TypeScript, and modern web technologies.
