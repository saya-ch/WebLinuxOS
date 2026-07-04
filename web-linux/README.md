# WebLinuxOS

A fully functional Linux desktop environment running entirely in the browser. No backend required, all functionality runs client-side with persistent storage.

**Live Demo**: https://saya-ch.github.io/WebLinuxOS/

## Overview

WebLinuxOS brings the complete Linux desktop experience to your browser. It includes a full windowing system, file management, terminal with 100+ commands, and hundreds of applications - all running locally without server dependencies.

## Features

### Desktop Environment

- Multi-window management with minimize, maximize, and close controls
- Virtual desktops with custom wallpaper support
- Smart app launcher with fuzzy search
- System tray with network, volume, and battery indicators
- Global search across all apps and files
- Command palette for quick system operations
- Dark/light theme switching
- Dynamic particle and nebula wallpaper effects
- Notification center with persistent alerts

### Development Tools

- Code editor with syntax highlighting for 20+ languages
- AI code assistant with multiple modes (code generation, explanation, chat)
- REST API tester with request builder and JSON preview
- JSON formatter and validator
- Interactive regex builder and tester
- GitHub trending repositories viewer
- Python REPL (via Pyodide)
- Full-featured terminal with 100+ commands
- Code snippet manager with import/export
- CSS toolbox with gradient, shadow, and layout generators
- Online code runner supporting JavaScript, TypeScript, SQL, Bash, HTML, and Markdown

### Productivity Suite

- Markdown editor with live preview
- Smart notes with tag-based organization, search, and Markdown rendering
- Spreadsheet with formula support
- Calendar and event manager
- Todo list with completion tracking
- Kanban board with drag-and-drop
- Mind map tool
- Presentation creator
- Smart schedule assistant

### Utilities

- Scientific calculator with advanced functions
- Password manager with encryption
- Pomodoro timer
- Color picker supporting multiple formats
- Real-time translation
- Clipboard manager with history
- Weather app (real-time data from Open-Meteo)
- Online API hub (NASA, news, cryptocurrency)
- Real-time dashboard with weather, news, and crypto data
- Disk usage analyzer with visual charts
- Task manager with process monitoring
- Network monitor with connection details

### Multimedia & Entertainment

- Music player with playlist support
- Drawing application
- Camera access for video capture
- Classic games (Snake, Tetris, 2048, Memory)
- Photo viewer with slideshow support
- Video player with basic controls

## Terminal Commands

### File Operations

`ls`, `cd`, `pwd`, `cat`, `head`, `tail`, `mkdir`, `touch`, `rm`, `cp`, `mv`, `tree`, `wc`, `write`, `tee`, `append`, `grep`, `find`, `chmod`, `gzip`, `gunzip`, `file`, `sort`, `uniq`, `cut`, `paste`, `nl`, `expand`, `tr`, `split`

### System Info

`whoami`, `hostname`, `date`, `uname`, `uptime`, `cal`, `free`, `df`, `ps`, `neofetch`, `version`, `time`, `worldtime`

### System Monitoring

`top`, `cpu-info`, `memory-info`, `disk-usage`, `network-stats`, `process-list`

### Network Tools

`ping`, `weather`, `news`, `crypto`, `crypto2`, `translate`, `ipinfo`, `ip`, `dns`, `dnslookup`, `iplookup`, `whois`, `curl`, `fetch`

### API Commands

`github`, `ghuser`, `stock`, `timezone`, `dict`, `trivia`, `funfact`, `catfact`, `quote`, `shorten`

### Utilities

`echo`, `calc`, `prime`, `factor`, `roman`, `base64`, `unbase64`, `hash`, `hash-verify`, `rev`, `json`, `yaml`, `urlencode`, `urldecode`, `uuid`, `password`, `jwt`, `regex`, `unit`, `color`, `binary`, `random`

### Fun Commands

`cowsay`, `cowthink`, `dog`, `fortune`, `sl`, `banner`, `lolcat`, `starwars`, `matrix`, `asciiart`, `joke`, `advice`, `flip`, `rps`, `lorem`, `morse`, `ascii`, `leet`, `age`, `shortid`, `timer`, `motd`

## Quick Start

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

npm install

npm run dev

npm run build

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
| Ctrl+1-9 | Switch to app |
| Ctrl+Shift+T | Open terminal |
| Ctrl+Shift+E | Open text editor |
| Ctrl+Shift+C | Open calculator |
| Ctrl+Shift+W | Open weather |
| Ctrl+Shift+N | New terminal |
| F11 | Fullscreen |
| PrintScreen | Screenshot |

## Tech Stack

- React 19 - UI framework with Hooks and Suspense
- TypeScript 6 - Type-safe development
- Zustand 5 - Lightweight state management
- Vite 8 - Optimized build tool
- Pyodide - Python runtime in browser
- Lucide React - Icon library
- IndexedDB - Persistent local storage

## Architecture

WebLinuxOS uses a modular architecture with separation of concerns:

```
src/
  apps/              # Individual applications (200+)
    terminal/        # Terminal commands and utilities
      commands.ts    # Command registration system
      apiCommands.ts # API-based commands
      fileCommands.ts # File system commands
      toolCommands.ts # Utility commands
      networkCommands.ts # Network commands
  components/
    desktop/         # Desktop environment components
      Desktop.tsx    # Main desktop component
      Window.tsx     # Window component
      Taskbar.tsx    # Taskbar component
    common/          # Shared UI components
  store/             # Zustand state management
  utils/             # Utility functions
    apiCache.ts      # API caching and retry utilities
  types.ts           # TypeScript definitions
  icons.tsx          # Icon exports
```

## Performance Optimizations

- Code splitting with dynamic imports
- Lazy loading of applications
- Memoization for expensive computations
- GPU-accelerated animations
- Efficient drag and resize handling
- Virtual scrolling for large lists
- Persistent state caching
- API response caching with configurable TTL
- Retry mechanisms for flaky API calls

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Build and test: `npm run build`
5. Submit a Pull Request

## Creating New Apps

To add a new application:

1. Create a file in `src/apps/` (e.g., `MyApp.tsx`)
2. Export a default React component
3. Register it in `src/apps.tsx`
4. Add to `src/components/desktop/WindowManager.tsx` for dynamic import
5. Add icons and metadata
6. Test thoroughly

## Creating New Terminal Commands

To add a new terminal command:

1. Choose an appropriate command file (apiCommands.ts, fileCommands.ts, toolCommands.ts, etc.)
2. Use `registerCommand(name, definition)` to register your command
3. Define handler function, description, usage, and examples
4. Add to help command listing

## API Integration

WebLinuxOS integrates with several public APIs:

- Open-Meteo - Weather data
- CoinGecko - Cryptocurrency prices
- ipapi.co - IP address information
- GitHub API - Repository and user information
- Hacker News (Algolia) - News articles
- LibreTranslate / MyMemory - Translation services
- Cat Fact Ninja - Cat facts
- Quotable.io - Quotes
- Open Trivia Database - Trivia questions

## Statistics

- 200+ applications
- 100+ terminal commands
- 200+ source files
- 50+ keyboard shortcuts
- 15+ integrated APIs

## Use Cases

- Learning programming concepts
- Demonstrating web capabilities
- Cross-platform tool access
- Lightweight online workspace
- Teaching system administration
- Rapid prototyping
- API testing and development
- Code experimentation
- Browser-based productivity suite

## Roadmap

- Enhanced mobile responsive design
- PWA installation support
- Cloud synchronization
- Plugin system architecture
- Real-time collaboration
- Advanced window tiling
- Multi-user support

## License

MIT License - Free for personal or commercial use.

Version: 15.3.0 | Last Updated: 2026