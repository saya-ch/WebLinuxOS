# WebLinuxOS

A fully functional web-based Linux desktop environment running entirely in the browser. No backend required - all functionality runs client-side with persistent storage.

**Live Demo**: https://saya-ch.github.io/WebLinuxOS/

---

## Introduction

WebLinuxOS brings a complete Linux desktop experience to your browser. Unlike traditional operating systems, everything runs in your browser tab - no installation, no setup, just instant access to a feature-rich desktop environment with over 150 applications and 90+ terminal commands.

## Core Features

### Desktop Environment
- Multi-window management with minimize, maximize, and close controls
- Virtual desktops with customizable wallpapers
- Smart application launcher with fuzzy search
- System tray with network, volume, and battery indicators
- Global search across all applications and files
- Command palette for quick system operations
- Dark/light theme switching
- Dynamic particle wallpaper effects

### Development Tools
- Code editor with syntax highlighting for 20+ languages
- REST API tester with request builder
- JSON formatter and validator
- Interactive regex builder and tester
- GitHub trending repository viewer
- Python REPL via Pyodide
- Comprehensive terminal with 90+ commands
- Code snippet manager with import/export
- CSS toolbox with gradient, shadow, and layout generators

### Productivity Suite
- Markdown editor with live preview
- Spreadsheet with formula support
- Calendar and event manager
- Todo list with completion tracking
- Kanban board with drag-and-drop
- Mind mapping tool
- Presentation creator
- Smart schedule assistant

### Utilities
- Scientific calculator with advanced functions
- Password manager with encryption
- Pomodoro timer
- Color picker supporting multiple formats
- Real-time translation
- Clipboard manager with history
- Weather application
- Online API hub (NASA, news, crypto)

### Multimedia & Entertainment
- Music player with playlist support
- Paint application
- Camera access for video capture
- Classic games (Snake, Tetris, 2048, Memory)

## Terminal Commands

**File Operations**: ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, tree, wc, du  
**System Info**: whoami, hostname, date, uname, uptime, cal, free, df, ps  
**Network Tools**: ping, curl, host, nslookup  
**Utilities**: echo, find, grep, env, export, which  
**Math**: calc, prime, factor, roman  
**Security**: base64, hash, password, uuid  
**Fun**: quote, weather, joke, fortune  

## Getting Started

```bash
# Clone repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+K | Global search |
| Ctrl+P | Command palette |
| Alt+Tab | Window switch |
| Ctrl+Q | Close window |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+1-9 | Switch desktop |
| Ctrl+Alt+Arrow | Switch desktop |

## Technology Stack

- **React 19** - UI framework with Hooks and Suspense
- **TypeScript 6** - Type-safe development
- **Zustand 5** - Lightweight state management
- **Vite 8** - Optimized build tool
- **Pyodide** - Python runtime in browser
- **Lucide React** - Icon library
- **IndexedDB** - Persistent local storage

## Architecture

WebLinuxOS follows a modular architecture with separation of concerns:

```
src/
  apps/              # Individual applications (150+)
  components/
    desktop/         # Desktop environment components
    common/          # Shared UI components
  store/             # Zustand state management
  utils/             # Utility functions
  types.ts           # TypeScript definitions
  icons.tsx          # Icon exports
```

## Performance

- Code splitting with dynamic imports
- Lazy loading for applications
- Memoization for expensive computations
- GPU-accelerated animations
- Efficient drag and resize handling

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome. Follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes
4. Build: `npm run build`
5. Submit pull request

## Creating New Applications

To add a new application:
1. Create file in `src/apps/` (e.g., `MyApp.tsx`)
2. Export default React component
3. Register in `src/apps.tsx`
4. Add icon and metadata
5. Test thoroughly

## License

MIT License - Free for personal or commercial use.

## Statistics

- 150+ applications
- 90+ terminal commands
- 180+ source files
- 50+ keyboard shortcuts

## Use Cases

- Learning programming concepts
- Demonstrating web capabilities
- Cross-platform access to tools
- Lightweight online workspace
- Teaching system administration
- Rapid prototyping

## Roadmap

- Enhanced mobile responsive design
- PWA installation support
- Cloud synchronization
- Plugin system architecture
- Real-time collaboration

## Changelog

### v7.0.0
- Enhanced terminal with new commands (weather, quote, timer, motd)
- Improved icon consistency across applications
- Code quality improvements
- Performance optimizations

### v6.2.0
- Fixed duplicate app IDs
- Resolved CSS animation conflicts
- Enhanced build configuration

### v6.0.0
- Major release with significant improvements
- New applications and utilities
- Performance optimizations

---

Version: 7.0.0 | Last Updated: 2026