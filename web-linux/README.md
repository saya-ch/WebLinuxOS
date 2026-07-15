# WebLinuxOS

A production-grade Linux desktop environment running entirely in the browser. Built with modern web technologies, featuring 240+ applications, complete window management system, virtual file system, terminal emulator with 100+ commands, and Python runtime support - all running client-side with persistent storage.

**Live Demo**: https://saya-ch.github.io/WebLinuxOS/

## Overview

WebLinuxOS delivers a comprehensive Linux desktop experience through modern web technologies. It features a complete windowing system with drag, resize, minimize, maximize, and multi-desktop support, along with 240+ applications spanning development tools, productivity suites, multimedia applications, system utilities, and internet tools.

## Key Features

### Desktop Environment

- Multi-window management with full drag, resize, minimize, maximize controls
- Virtual desktops (up to 9) with custom wallpaper support per desktop
- Smart app launcher with fuzzy search and keyboard navigation
- System tray with real-time network, volume, and battery indicators
- Global search across all applications and files
- Command palette for quick system operations (Ctrl+P)
- Dark/light theme switching with smooth transitions
- Dynamic particle and nebula wallpaper effects with mouse interaction
- Notification center with persistent alerts and action support
- Desktop widgets: clock, system monitor, weather, sticky notes, focus timer
- Quantum Interface Theme - Futuristic design inspired by quantum physics

### Utilities

- Quantum Calculator - Advanced scientific calculator with quantum-inspired design
- Standard calculator with history and scientific functions
- Password manager with encryption and strength checker
- Unit converter supporting multiple measurement types

### Development Tools

- Code editor with syntax highlighting for 20+ languages
- AI code assistant with multiple modes (generation, explanation, refactoring)
- AI智能助手 Ultra - Advanced AI assistant with chat, code, and analysis modes
- REST API tester with request builder and JSON preview
- JSON formatter, validator, and YAML converter
- Interactive regex builder and tester with pattern library
- GitHub trending repositories viewer and profile explorer
- Python REPL (via Pyodide) with package support
- Full-featured terminal with 100+ commands including:
  - File operations (ls, cd, cat, mkdir, rm, cp, mv, grep, find, etc.)
  - System monitoring (top, ps, neofetch, free, df, uptime)
  - Network tools (ping, curl, weather, news, crypto, translate)
  - Development utilities (calc, hash, base64, uuid, regex, jwt)
- Code snippet manager with import/export and syntax highlighting
- CSS toolbox with gradient, shadow, and layout generators
- Online code runner supporting JavaScript, TypeScript, SQL, Bash, HTML, and Markdown
- WebIDE - Full-featured online development environment
- API playground and health monitor
- Code collaboration platform with real-time sync

### Productivity Suite

- Markdown editor with live preview and export to HTML
- Smart notes with tag-based organization, search, and Markdown rendering
- Spreadsheet with formula support and chart generation
- Calendar and event manager with reminders
- Todo list with completion tracking and priority levels
- Kanban board with drag-and-drop task management
- Mind map tool with export capabilities
- Presentation creator with slide templates
- Smart schedule assistant with AI-powered suggestions
- Project planner with Gantt charts
- Time management master with Pomodoro integration
- Habit tracker with streak visualization

### Utilities

- Scientific calculator with advanced functions and history
- Password manager with encryption and strength checker
- Pomodoro timer with customizable sessions
- Color picker supporting multiple formats (HEX, RGB, HSL)
- Real-time translation supporting 100+ languages
- Clipboard manager with history and search
- Weather app (real-time data from Open-Meteo)
- Online API hub (NASA, news, cryptocurrency, Wikipedia)
- Real-time dashboard with weather, news, and crypto data
- Disk usage analyzer with visual charts
- Task manager with process monitoring and resource usage
- Network monitor with connection details and speed test
- System health dashboard with performance metrics
- Unit converter (length, weight, temperature, etc.)
- Base64/URL/Hash tools
- QR code generator and scanner

### Multimedia & Entertainment

- Music player with playlist support and visualizer
- Drawing application with layers and filters
- Camera access for video capture and screenshots
- Classic games (Snake, Tetris, 2048, Memory, Breakout)
- Photo viewer with slideshow support
- Video player with format support
- Music studio with beat maker
- Virtual pet with interactive features

### Innovation & Advanced Features

- WorldPulse - Real-time global intelligence dashboard
- Intelligent dashboard - Comprehensive system and data overview
- Smart project hub - AI-powered project management
- AI learning companion - Personalized education assistant
- Creative inspiration workshop - Idea generation and brainstorming
- Knowledge explorer - Wikipedia-powered research tool
- Smart notes Pro - Advanced note-taking with AI features
- Productivity center - Unified productivity workspace

## Technology Stack

- **Frontend Framework**: React 19 with Hooks and Suspense
- **Language**: TypeScript 6 for type-safe development
- **State Management**: Zustand 5 for lightweight, performant state
- **Build Tool**: Vite 8 for optimized production builds
- **Runtime**: Pyodide for Python execution in browser
- **Icons**: Lucide React icon library
- **Storage**: IndexedDB with localStorage fallback
- **Architecture**: Modular design with code splitting and lazy loading

## Quick Start

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git
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
| Ctrl+Shift+L | Open launcher |
| Ctrl+K | Global search |
| Ctrl+P | Command palette |
| Alt+Tab | Window switch |
| Ctrl+Q | Close window |
| Ctrl+M | Minimize window |
| Ctrl+1-9 | Quick app launch |
| Ctrl+Shift+T | Open terminal |
| Ctrl+Shift+E | Open text editor |
| Ctrl+Shift+C | Open calculator |
| Ctrl+Shift+W | Open weather |
| Ctrl+Alt+1-9 | Switch desktop |
| Ctrl+Shift+Alt+Arrow | Move window between desktops |
| F11 | Fullscreen |
| PrintScreen | Screenshot |

## Architecture

```
src/
  apps/              # Individual applications (240+)
    terminal/        # Terminal commands and utilities
      commands.ts    # Core command system
      apiCommands.ts # API-based commands
      fileCommands.ts # File system commands
      networkCommands.ts # Network commands
      toolCommands.ts # Utility commands
  components/
    desktop/         # Desktop environment components
      Desktop.tsx    # Main desktop component
      Window.tsx     # Window component with drag/resize
      Taskbar.tsx    # System taskbar
      LiveWallpaper.tsx # Dynamic wallpaper effects
    common/          # Shared UI components
  store/             # Zustand state management
  utils/             # Utility functions
    apiCache.ts      # API caching with retry logic
  types.ts           # TypeScript definitions
  icons.tsx          # Icon exports
```

## Performance Optimizations

- Code splitting with dynamic imports for each application
- Lazy loading of components with React.lazy and Suspense
- Memoization for expensive computations with useMemo and useCallback
- GPU-accelerated animations with transform and will-change
- Virtual scrolling for large lists and data sets
- Persistent state caching with IndexedDB
- API response caching with configurable TTL
- Retry mechanisms for flaky API calls
- Performance guardrails with contain and content-visibility

## API Integrations

WebLinuxOS integrates with numerous public APIs:

- Open-Meteo - Weather data
- CoinGecko - Cryptocurrency prices
- ipapi.co - IP address information
- GitHub API - Repository and user information
- Hacker News (Algolia) - News articles
- LibreTranslate / MyMemory - Translation services
- Wikipedia API - Knowledge base
- NASA APIs - Astronomy data
- Cat Fact Ninja - Fun facts
- Quotable.io - Inspirational quotes
- Open Trivia Database - Quiz questions

## Statistics

- 240+ applications
- 100+ terminal commands
- 250+ source files
- 60+ keyboard shortcuts
- 15+ integrated APIs
- 9 virtual desktops
- Multi-language support

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Use Cases

- Learning programming concepts in a safe environment
- Demonstrating modern web application capabilities
- Cross-platform tool access without installation
- Lightweight online workspace for developers
- Teaching Linux concepts and system administration
- Rapid prototyping and proof-of-concept development
- API testing and development
- Code experimentation with multiple languages
- Browser-based productivity suite

## Roadmap

- Enhanced mobile responsive design with touch support
- PWA installation support with offline capabilities
- Cloud synchronization for cross-device sync
- Plugin system architecture for extensibility
- Real-time collaboration features
- Advanced window tiling and snapping
- Multi-user support with authentication
- Voice commands and accessibility improvements

## Recent Updates

### Version 37.0 - Quantum Interface Release

- Added Quantum Interface Theme with futuristic quantum-inspired design
- Implemented Quantum Calculator with scientific functions and history
- Enhanced visual design with unique fonts: Michroma, Exo 2, Chakra Petch, Rajdhani
- Improved UI components with quantum superposition and entanglement visual effects
- Added new color scheme based on quantum physics concepts
- Enhanced performance monitoring and system visualization

### Version 24.0 - AI Enhancement Release

- Added AI智能助手 Ultra with multi-mode AI assistant
- Enhanced LiveWallpaper with particle connections and glow effects
- Improved typography with Cabinet Grotesk and Space Grotesk fonts
- Optimized preload screen with progress indicator
- Enhanced color scheme and visual polish
- Performance improvements for wallpaper rendering

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes following the existing code style
4. Build and test: `npm run build && npm run dev`
5. Submit a Pull Request with a detailed description

## Creating New Apps

To add a new application:

1. Create a file in `src/apps/` (e.g., `MyApp.tsx`)
2. Export a default React component
3. Register it in `src/apps.tsx` with proper metadata
4. Add to `src/components/desktop/WindowManager.tsx` for dynamic import
5. Add appropriate icons and keyboard shortcuts
6. Test thoroughly across themes

## Creating New Terminal Commands

To add a new terminal command:

1. Choose an appropriate command file (apiCommands.ts, fileCommands.ts, toolCommands.ts, etc.)
2. Use `registerCommand(name, definition)` to register your command
3. Define handler function, description, usage, and examples
4. Add to help command listing
5. Test with various inputs and edge cases

## License

MIT License - Free for personal or commercial use.

---

**Version**: 37.0 | **Last Updated**: July 2026 | **Maintainer**: Saya Ch