# WebLinuxOS

A fully featured web-based Linux desktop environment running entirely in the browser. Built with React 19 and TypeScript, this project provides a complete operating system experience with window management, file system, terminal, and a comprehensive suite of applications.

## Live Demo

[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Features

### Core System

- **Window Management**: Drag, resize, minimize, maximize, and close windows with smooth animations
- **Virtual File System**: Full CRUD operations with persistent storage using localStorage
- **Terminal Emulator**: Over 150 commands with history, autocomplete, and syntax highlighting
- **Desktop Environment**: Desktop icons, application launcher, taskbar, and system tray
- **Multiple Workspaces**: Up to 9 virtual desktops for organized multitasking
- **Theme Support**: Dark and light themes with customizable accent colors
- **Live Wallpapers**: Particles, gradients, and dynamic background effects
- **Global Search**: Command palette for quick access to applications and files
- **Desktop Widgets**: A live widget system that turns the desktop into an information dashboard:
  - **Clock** — analog clock face with digital readout and date
  - **System Pulse** — real-time JS heap memory, CPU cores, battery and online status with a rolling graph
  - **Weather** — real-time conditions via the public Open-Meteo API (no API key required), with automatic geolocation and graceful fallback
  - **Focus Timer** — Pomodoro-style countdown ring with audio chime and 15/25/45 minute presets
  - **Quick Note** — a persistent sticky note that autosaves to localStorage
  - Widgets are draggable, individually toggleable from the desktop right-click menu, and their layout is persisted across sessions

### Applications

**Development Tools**
- Code editor with syntax highlighting for multiple languages
- Terminal with command history and autocomplete
- Git client for version control operations
- JSON formatter and validator
- Base64 encoding/decoding
- Hash generator (MD5, SHA-1, SHA-256, SHA-512)
- UUID generator
- Regex tester with real-time validation
- API testing tools with REST client
- Code sandbox for running JavaScript/TypeScript

**Productivity**
- Text editor with formatting options
- Calculator with basic, scientific, and programming modes
- Calendar with event management
- Todo list manager with priority levels
- Pomodoro timer for focused work sessions
- Notes management with Markdown support
- Project management board (Kanban)
- Countdown timer
- Unit converter (length, weight, area, volume, temperature)
- Password manager
- Clipboard history manager

**Media**
- Image viewer with zoom and rotation
- Audio player with playlist support
- Video player with playback controls
- Paint application with drawing tools
- Wallpaper gallery with live previews
- Emoji browser with search and copy functionality
- Music visualizer

**Network & Information**
- Web browser with tab management
- Weather dashboard using Open-Meteo API
- News aggregator from Hacker News
- Cryptocurrency tracker with CoinGecko API
- Stock market tracker
- IP geolocation lookup
- DNS query tool
- WHOIS lookup
- Network speed test and latency measurement
- System monitor with real-time network metrics
- Real-time translator (multi-language)
- Wikipedia explorer
- GitHub repository explorer

**System Utilities**
- File manager with directory tree navigation
- System monitor (CPU, memory, disk, network, FPS)
- System settings with theme and display options
- Disk usage analyzer
- Process monitor with kill capability
- Clipboard manager with history
- System health dashboard

### Terminal Commands

The terminal supports a comprehensive set of commands:

| Category | Commands |
|----------|----------|
| **System** | `whoami`, `hostname`, `date`, `datetime`, `uname`, `top`, `ps`, `kill`, `reboot`, `shutdown`, `env`, `history`, `alias`, `clear`, `echo`, `motd`, `uptime` |
| **File** | `ls`, `cd`, `pwd`, `cat`, `touch`, `mkdir`, `rm`, `rmdir`, `cp`, `mv`, `grep`, `find`, `du`, `df`, `head`, `tail`, `wc`, `sort`, `uniq`, `diff`, `stat`, `less`, `ln`, `chmod`, `tree`, `write`, `tee`, `append` |
| **Network** | `ping`, `speedtest`, `bandwidth`, `trace`, `dig`, `dns`, `ip`, `ipinfo`, `whois`, `curl`, `fetch`, `dnslookup`, `netstat` |
| **Productivity** | `todo`, `note`, `project`, `calendar`, `countdown`, `pomodoro`, `timer`, `calc` |
| **Developer** | `json`, `base64`, `hash`, `uuid`, `regex`, `urlencode`, `converter`, `git`, `code-review`, `challenge` |
| **API** | `weather`, `weather-forecast`, `weather-search`, `news`, `newsapi`, `crypto`, `crypto2`, `crypto-news`, `bitcoin`, `stock`, `dict`, `translate`, `github`, `ghuser`, `quote`, `quote-of-the-day`, `trivia`, `funfact`, `catfact`, `covid`, `geocode`, `timezone`, `timezone-info`, `world-clock`, `convert`, `currency`, `shorten`, `shorturl`, `time-convert` |
| **Tools** | `base64`, `hash`, `urlencode`, `json-pretty`, `uuid`, `qrcode`, `password`, `unicode`, `regex-test`, `hash`, `base64`, `urlencode`, `datetime`, `random`, `flip`, `rps` |
| **Fun** | `joke`, `flip`, `rps`, `random`, `prime`, `factor`, `roman`, `binary`, `rev`, `ascii`, `lorem`, `morse`, `leet` |

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm, yarn, or pnpm

### Installation

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
```

### Development

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173/WebLinuxOS/`

### Build

```bash
npm run build
```

The build output will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

### Deployment

The project is configured for GitHub Pages deployment. Push to the `main` branch and GitHub Actions will automatically build and deploy.

## Architecture

```
web-linux/
├── src/
│   ├── apps/           # Application components
│   │   ├── terminal/   # Terminal command implementations
│   │   │   ├── commands.ts          # Command framework
│   │   │   ├── fileCommands.ts      # File system commands
│   │   │   ├── systemCommands.ts    # System commands
│   │   │   ├── toolCommands.ts      # Utility tools
│   │   │   ├── apiCommands.ts       # API integration commands
│   │   │   ├── extendedCommands.ts  # Extended commands
│   │   │   └── ...                  # Other command files
│   │   └── *.tsx       # Individual applications (Calculator, Weather, etc.)
│   ├── components/     # Reusable UI components
│   │   ├── desktop/    # Desktop-specific components (Window, Taskbar, etc.)
│   │   └── common/     # Shared components
│   ├── store/          # Zustand state management stores
│   ├── utils/          # Utility functions and helpers
│   │   └── apiCache.ts # API caching utilities
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main application entry
│   ├── apps.tsx        # Application registry
│   ├── store.ts        # Global state store
│   └── index.css       # Global styles and CSS variables
├── public/             # Static assets (icons, wallpapers, etc.)
├── index.html          # HTML entry point
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Technologies

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **State Management**: Zustand 5
- **Styling**: CSS Modules with CSS Variables
- **Icons**: Lucide React
- **Markdown**: Marked
- **Python Runtime**: Pyodide 0.26 (optional)
- **Deployment**: GitHub Pages via GitHub Actions

## Browser Support

- Chrome 110+ (recommended)
- Firefox 115+
- Safari 16+
- Edge 110+

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run linting (`npm run lint`)
5. Run type checking (`npm run typecheck`)
6. Build the project (`npm run build`)
7. Submit a Pull Request

### Adding a New Terminal Command

Create a new file in `src/apps/terminal/` with your command definitions following the existing pattern, then import it in `src/apps/terminal/index.ts`.

### Adding a New Application

1. Create your application component in `src/apps/`
2. Register it in `src/apps.tsx` with a unique ID, name, icon, and category
3. Add any necessary state management or utility functions

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

This project was inspired by various web-based operating systems and built with modern web technologies. Special thanks to the open source community for the APIs and libraries used.