# WebLinuxOS

An open-source, browser-based Linux desktop environment that runs entirely in a single tab. 100% client-side, zero installation, 200+ ready-to-use applications.

## Table of Contents

- [Features](#features)
- [Live Demo](#live-demo)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [API Integrations](#api-integrations)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Features

### Desktop Environment

- Full window manager with drag, resize, minimize, maximize, and multi-monitor-style tiling
- Virtual filesystem with localStorage persistence
- Real terminal shell with 180+ commands, pipes, redirections, and scripting support
- Multiple desktop workspaces (up to 9 virtual desktops)
- Customizable wallpapers and themes (light/dark mode)
- Dynamic particle effects and animated backgrounds

### Applications (200+)

**Development Tools**
- Web IDE Pro - Full-featured online programming environment
- Code Editor with Monaco Editor integration
- Intelligent Code Assistant - AI-powered coding helper
- Code Playground, Sandbox, and Studio
- Code Formatter, Diff Viewer, and Reviewer
- Online Code Runner supporting multiple languages

**AI & Productivity**
- Ultimate AI Assistant - Multi-modal intelligent assistant
- Online Collaborative Notebook - Block-based note-taking
- Pomodoro Studio and Time Management
- Task Manager and Kanban Board
- Calendar and World Clock
- Password Manager and Generator

**System Utilities**
- File Manager with virtual filesystem
- System Monitor Dashboard
- Network Tools and Monitor
- Process Manager
- Disk Usage Analyzer
- Settings and Theme Customizer

**Knowledge & Information**
- Wikipedia Reader
- GitHub Trending Explorer
- Hacker News Reader
- Real-time Weather
- Currency and Crypto Tracker
- Dictionary and Translation

**Media & Creative**
- Music Player with Web Audio
- Video Player
- Image Viewer and Editor
- Paint and Drawing App
- Screen Recorder
- Music Studio and Visualizer

**Games**
- 2048, Tetris, Snake, Memory
- Minesweeper and more

### Terminal Features

- 180+ built-in commands
- Pipes (`|`), redirects (`>`, `>>`, `<`), chaining (`;`, `&&`, `||`)
- Background processes (`&`), `jobs`, `kill`
- Tab completion, command history, reverse search
- Live API commands: `weather`, `crypto`, `news`, `stock`, `translate`, `ipinfo`, `quote`, `time`

### API Integrations

The project integrates with 20+ public APIs:

- Open-Meteo / OpenWeatherMap (Weather)
- CoinGecko (Crypto prices)
- GitHub REST API (Trending repos)
- Wikipedia REST API
- NewsAPI (News headlines)
- NASA APOD (Astronomy)
- Frankfurter (Currency exchange)
- IP Geolocation
- And many more

All integrations use key-less public endpoints where possible, running entirely on GitHub Pages without environment configuration.

## Live Demo

**Production:** https://saya-ch.github.io/WebLinuxOS/

**Local Development:**

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

## Architecture

```
WebLinuxOS/
├── web-linux/                  # Main application
│   ├── src/
│   │   ├── App.tsx             # Root component, keyboard shortcuts
│   │   ├── apps.tsx            # Application registry (200+ apps)
│   │   ├── store.tsx           # Zustand state management
│   │   ├── components/         # UI components
│   │   │   ├── desktop/        # Window manager, Taskbar, Dock
│   │   │   └── ...
│   │   ├── apps/               # Application implementations
│   │   ├── services/           # External API clients
│   │   ├── store/              # Virtual filesystem, persistence
│   │   └── utils/              # Helper functions
│   └── vite.config.ts
└── README.md
```

### State Management

- Zustand store manages window state, filesystem, theme, and app preferences
- Virtual filesystem stored in localStorage with hierarchical JSON structure
- Lazy loading for all application components to optimize bundle size

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + Shift + L` | Open application launcher |
| `Ctrl + Shift + T` | Open terminal |
| `Ctrl + E` | Open file manager |
| `Ctrl + ,` | Open settings |
| `Ctrl + K` | Open global search |
| `Ctrl + Shift + C` | Open calculator |
| `Ctrl + Q` | Close focused window |
| `Ctrl + M` | Minimize focused window |
| `Alt + Tab` | Cycle windows |
| `F11` | Toggle fullscreen |

Terminal shortcuts:
- `Ctrl + L` - Clear screen
- `Ctrl + C` - Cancel process
- `Ctrl + R` - Reverse search history
- `Tab` - Autocomplete

## Deployment

### GitHub Pages (Automated)

1. Push to `main` branch
2. GitHub Actions automatically builds and deploys
3. Access at `https://<username>.github.io/WebLinuxOS/`

### Static Hosting

Upload contents of `web-linux/dist/` to any static host (Netlify, Vercel, Cloudflare Pages, S3, nginx).

## Version History

### v37.4

- Enhanced terminal with new online commands (weather, news, crypto, translate, ipinfo, quote, time)
- Improved dynamic wallpaper performance with device-aware particle rendering
- Fixed TypeScript build errors
- Enhanced AI Ultimate Assistant with multi-modal support
- Improved system performance and stability

### v37.3

- Added Ultimate AI Assistant with multi-modal support
- Added Online Collaborative Notebook with block-based editing
- Enhanced system performance and stability
- Improved UI/UX across all applications

### v37.0

- Added Quantum Calculator
- Added Welcome Hub
- Enhanced desktop widgets

### v36.0

- Web IDE Pro - Full-featured online programming environment
- Enhanced code editor capabilities

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run `npm run typecheck && npm run build`
5. Submit a pull request

When adding new apps:
- Add component in `web-linux/src/apps/`
- Register in `web-linux/src/apps.tsx`
- Add lazy import in `web-linux/src/components/desktop/WindowManager.tsx`

## Technology Stack

- React 19 + TypeScript 5.7
- Vite 6 for build tooling
- Zustand for state management
- Monaco Editor for code editing
- Web Audio API for music
- Canvas API for graphics
- Multiple public APIs for data

## License

MIT License - see [LICENSE](LICENSE)

Free to use, modify, and distribute, including for commercial purposes.

## Acknowledgments

- Window manager, terminal, and virtual filesystem are original work
- Inspired by [linux.js](https://github.com/hrtowii/linux.js), [WebSH](https://github.com/nicedoc/web-sh)
- Wallpapers from Unsplash and Pexels (CC0)
