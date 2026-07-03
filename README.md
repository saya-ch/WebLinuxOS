# WebLinuxOS

A fully featured web-based Linux desktop environment running entirely in the browser. Built with React 19 and TypeScript, this project provides a complete operating system experience with window management, file system, terminal, and over 100 applications.

## Live Demo

[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Features

### Core System

- Window management with drag, resize, minimize, maximize, and close
- Virtual file system with full CRUD operations
- Terminal emulator with over 100+ commands
- Desktop icons and application launcher
- Taskbar with system tray and notifications
- Multiple workspace support (up to 9 desktops)
- Dark/light theme support
- Live wallpapers (particles, gradients)
- Global search and command palette

### Applications

**Development Tools**
- Code editor with syntax highlighting
- Terminal with command history and autocomplete
- Git client for version control
- Code snippets manager
- JSON formatter and validator
- Base64 encoding/decoding
- Hash generator (MD5, SHA-1, SHA-256)
- UUID generator
- Regex tester

**Productivity**
- Text editor
- Calculator
- Calendar
- Todo list manager
- Pomodoro timer
- Notes management
- Project management
- Countdown timer
- Unit converter

**Media**
- Image viewer
- Audio player
- Video player
- Paint application
- Wallpaper gallery
- Emoji browser

**Network & Information**
- Web browser
- Weather (Open-Meteo API)
- News (Hacker News)
- Cryptocurrency tracker (CoinGecko)
- Stock market tracker
- IP lookup
- DNS query
- WHOIS lookup
- Network speed test
- Ping and route tracing

**System**
- File manager
- System monitor (CPU, memory)
- System settings
- Disk usage analyzer
- Process monitor
- Clipboard manager

### Terminal Commands

The terminal supports a comprehensive set of commands:

**System**: `whoami`, `hostname`, `date`, `datetime`, `uname`, `top`, `ps`, `kill`, `reboot`, `shutdown`

**File**: `ls`, `cd`, `pwd`, `cat`, `touch`, `mkdir`, `rm`, `rmdir`, `cp`, `mv`, `grep`, `find`, `du`, `df`, `head`, `tail`, `wc`, `sort`, `uniq`

**Network**: `ping`, `speedtest`, `bandwidth`, `trace`, `dig`, `dns`, `ip`, `ipinfo`, `whois`, `curl`

**Productivity**: `todo`, `note`, `project`, `calendar`, `countdown`, `pomodoro`

**Developer**: `json`, `base64`, `hash`, `uuid`, `regex`, `urlencode`, `converter`, `git`, `code-review`, `challenge`

**API**: `weather`, `news`, `crypto`, `crypto2`, `stock`, `dict`, `translate`, `github`, `ghuser`, `quote`, `trivia`, `funfact`, `catfact`

**Fun**: `joke`, `flip`, `rps`, `random`

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

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

### Deployment

The project is configured for GitHub Pages deployment. Push to the `main` branch and GitHub Actions will automatically build and deploy.

## Architecture

```
web-linux/
├── src/
│   ├── apps/           # Application components
│   │   ├── terminal/   # Terminal commands
│   │   └── *.tsx       # Individual applications
│   ├── components/     # UI components
│   │   └── desktop/    # Desktop components
│   ├── store/          # Zustand state management
│   ├── utils/          # Utility functions
│   ├── App.tsx         # Main application
│   ├── apps.tsx        # Application registry
│   ├── store.tsx       # Global state
│   └── index.css       # Global styles
├── public/             # Static assets
├── index.html          # Entry point
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies
```

## Technologies

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 8
- **State Management**: Zustand 5
- **Styling**: CSS Modules with CSS Variables
- **Icons**: Lucide React
- **Markdown**: Marked
- **Python Runtime**: Pyodide (optional)
- **Deployment**: GitHub Pages via GitHub Actions

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

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

Create a new file in `src/apps/terminal/` with your command definitions, then import it in `src/apps/terminal/index.ts`.

### Adding a New Application

Add your application component in `src/apps/`, then register it in `src/apps.tsx`.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

This project was inspired by various web-based operating systems and built with modern web technologies. Special thanks to the open source community for the APIs and libraries used.

---

Built for developers, by developers.