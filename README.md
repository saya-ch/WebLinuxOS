<div align="center">

# WebLinuxOS

A fully functional Linux-style desktop environment in the browser

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-live-222222?style=flat-square&logo=githubpages)](https://saya-ch.github.io/WebLinuxOS/)

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Features](#features) · [Getting Started](#getting-started) · [Tech Stack](#tech-stack)

</div>

---

## About

WebLinuxOS brings a complete Linux-style desktop experience to your browser. Built with React 19 and TypeScript, it delivers a feature-rich operating system interface without any installation required. The project combines the familiarity of a traditional desktop environment with the flexibility of web technology, offering real utility for developers and power users alike.

**What makes WebLinuxOS different:**

- No setup needed - open the page and start working immediately
- Data persistence through browser localStorage
- Terminal with over 150 commands for power users
- Integrated development tools and real-time data dashboards
- True window management with snapping, resizing, and workspace support

---

## Features

### Core Desktop Environment

| Feature | Description |
|---------|-------------|
| **Window Management** | Drag, resize, minimize, maximize, snap-to-edge, multi-window layering |
| **Virtual File System** | Full file operations with localStorage persistence |
| **Terminal** | 150+ commands with history, auto-completion, and aliases |
| **Multi-workspace** | Up to 9 virtual desktops with keyboard navigation |
| **Global Search** | Instant search across applications, files, and commands |
| **Theme System** | Dark/light mode with smooth transitions |

### Built-in Applications

| Application | Capabilities |
|-------------|--------------|
| **File Manager** | Tree view, file preview, drag operations, context menus |
| **Terminal** | Full command-line with virtual file system integration |
| **DevConsole** | JSON formatter, Base64/URL encoding, hash generation, regex testing, JWT decode, UUID generation, color conversion, text diff - all local |
| **REST Client** | HTTP request testing with response inspection |
| **LiveDashboard** | Real-time cryptocurrency, weather, news, system metrics |
| **WorldPulse** | Global data dashboard with weather, air quality, ISS tracking, exchange rates |
| **Code Snippet Library** | Multi-language snippet management |
| **Notes** | Markdown editor with sticky notes and to-do lists |
| **Workspace Hub** | Unified access to applications, system status, quick notes |
| **Games** | Snake, Tetris, 2048, Memory Game |

### Real-time Data Integration

| Service | Provider | Usage |
|---------|----------|-------|
| Weather | Open-Meteo | Current conditions and forecasts |
| Air Quality | Open-Meteo | AQI and pollutant data |
| Cryptocurrency | CoinGecko | Market prices and trends |
| Exchange Rates | open.er-api.com | Currency conversion |
| ISS Tracking | wheretheiss.at | Real-time space station position |
| Hacker News | Firebase API | Top technology stories |
| GitHub | GitHub API | Repository and user information |
| Translation | MyMemory | Multi-language translation |

---

## Getting Started

### Quick Start

Visit the [live demo](https://saya-ch.github.io/WebLinuxOS/) to experience WebLinuxOS immediately in your browser.

**Keyboard Shortcuts:**

- `Ctrl + K` - Global search
- `Ctrl + T` - Open terminal
- `Ctrl + E` - Open file manager
- `Ctrl + W` - Close window
- `Ctrl + M` - Minimize window
- `Ctrl + Shift + M` - Maximize window
- `Ctrl + Alt + 1-9` - Switch workspace

### Local Development

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:5173/WebLinuxOS/ in your browser
```

### Build for Production

```bash
npm run build        # Build to ../dist directory
npm run preview      # Preview production build locally
```

---

## Terminal Commands

WebLinuxOS includes over 150 terminal commands. Here are some highlights:

```bash
# System Information
whoami   # Current user
hostname # System hostname
uname    # System details
date     # Current date and time
uptime   # System uptime

# File Operations
ls       # List directory contents
cd       # Change directory
pwd      # Print working directory
cat      # Display file contents
touch    # Create empty file
mkdir    # Create directory
rm       # Remove file/directory
cp       # Copy files
mv       # Move files
find     # Search for files
grep     # Search text in files

# Network and APIs
weather [city]        # Get real-time weather
crypto                # Cryptocurrency prices
news                  # Hacker News top stories
translate <lang> <text> # Translate text
github <repo>         # GitHub repository info

# Development Tools
json                  # JSON formatter
base64                # Base64 encode/decode
hash                  # Generate SHA hashes
uuid                  # Generate UUIDs
regex                 # Test regular expressions
calc                  # Calculator
timestamp             # Convert timestamps
jwt                   # JWT decoder

# System
open <app>            # Open application
launch [app-id]       # Launch specific app
worldpulse            # Open global dashboard
system-status         # System metrics

# Help
help                  # View complete command list
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 + TypeScript 5 |
| Build Tool | Vite 8 |
| State Management | Zustand 5 |
| Icons | Lucide React |
| Markdown | Marked |
| Styling | CSS Variables + Global Styles |

---

## Project Structure

```
web-linux/
├── src/
│   ├── apps/              # Application components
│   │   ├── terminal/      # Terminal command system
│   │   ├── Terminal.tsx   # Terminal UI
│   │   ├── FileManager.tsx
│   │   └── ...
│   ├── components/
│   │   ├── desktop/       # Core desktop components
│   │   │   ├── Window.tsx
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Desktop.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── StartMenu.tsx
│   │   └── ...
│   ├── store.tsx          # Zustand global state
│   ├── store/
│   │   ├── fileUtils.ts   # File system utilities
│   │   └── storageUtils.ts # Local storage utilities
│   ├── apps.tsx           # Application registry
│   ├── App.tsx            # Application entry
│   └── utils/
│       └── apiCache.ts    # API caching
├── public/                # Static assets
├── index.html
├── vite.config.ts
└── package.json
```

---

## Core Design Principles

- **Performance First**: Component lazy loading and code splitting reduce initial load time
- **Data Privacy**: Most tools operate locally in the browser with zero network requests
- **Persistence**: User data persists across sessions via localStorage
- **Extensible**: Easy to add new applications and terminal commands
- **Themeable**: CSS variable-driven theming for dark/light modes

---

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 110+ |
| Firefox | 115+ |
| Safari | 16+ |
| Edge | 110+ |

---

## Contributing

We welcome contributions from the community. Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes with descriptive messages
4. Push to your fork: `git push origin feature/your-feature`
5. Open a Pull Request

Before submitting, run these checks:

```bash
npm run typecheck   # TypeScript type checking
npm run lint        # ESLint checking
npm run build       # Production build verification
```

### Adding Applications

1. Create your component in `src/apps/`
2. Register it in `src/apps.tsx` with a unique ID
3. Add lazy loading mapping in `src/components/desktop/WindowManager.tsx`

### Adding Terminal Commands

1. Create or modify command files in `src/apps/terminal/`
2. Register using the `registerCommand` function
3. Import in `src/apps/terminal/index.ts`

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

## Acknowledgments

Thanks to the following open source projects and services:

- React, TypeScript, Vite, Zustand
- Lucide Icons, Marked
- Open-Meteo, CoinGecko, Hacker News API, GitHub API
- wheretheiss.at, open.er-api.com, MyMemory

---

## Changelog

### v33.1.0 (2026-07-12)

- Enhanced terminal API commands: Added `news`, `currency`, `crypto`, `translate`, `timezone`, `ipinfo`, `qr`, `password`, `uuid`, `timestamp` commands with real-time data integration
- News API integration: Fetch top headlines from NewsAPI across multiple categories (general, business, technology, science, health, entertainment, sports)
- Currency exchange API: Real-time exchange rates from exchangerate-api.com supporting USD, CNY, EUR, JPY, GBP and more
- Cryptocurrency tracking: Real-time Bitcoin, Ethereum, Solana prices from CoinGecko with 24h change, high/low, market cap data
- Multi-language translation: Powered by MyMemory API supporting English, Chinese, Japanese, Korean, French, German, Spanish, Russian, Portuguese, Italian
- Timezone lookup: WorldTimeAPI integration for accurate time across 50+ global cities
- IP information: Automatic IP detection and geolocation from ipapi.co
- QR code generation: Instant QR code creation via qrserver.com API
- Password generator: Secure random password generation with customizable length and special character options
- UUID generator: RFC-compliant UUID v4 generation
- Timestamp converter: Convert between Unix timestamps and human-readable dates
- Vite configuration optimization: Fixed development mode console.log stripping, improved HMR WebSocket configuration, optimized build settings for development vs production environments

### v32.1.0 (2026-07-12)

- Enhanced Web Browser: Added page zoom (50%-200%), favicon display, extended quick access site list (added CodePen, CodeSandbox)
- Fixed icon import issues: Unified RocketIcon management, removed duplicate definitions, ensured correct application registration
- Optimized file system utilities: Improved path parsing and caching mechanism, enhanced file operation performance
- Improved terminal command system: Optimized command processing logic, added more utility commands
- Enhanced system monitoring: Improved process management and resource monitoring interface
- Code quality improvements: Fixed TypeScript type errors, removed unused variables and imports
- Improved user experience: Optimized window management, taskbar and start menu interactions

### v31.0.0 (2026-07-11)

- Added intelligent developer workbench: Integrated code template library, API Mock service, knowledge graph, and intelligent code analysis
- Code template library: 5 high-quality TypeScript templates, with search, category filtering, one-click copy
- API Mock service: Visual API simulator supporting GET/POST/PUT/DELETE/PATCH methods, configurable status codes and delays
- Knowledge graph: 7 interconnected technical knowledge points with category tags and connection visualization
- Intelligent code analysis: Auto-evaluate code quality with complexity, maintainability, performance, security metrics and improvement suggestions
- Cyberpunk tech-style UI design: Neon color scheme and modern interaction design
- Responsive layout optimization: Support for multiple screen sizes

### v30.0.0 (2026-07-11)

- Added real-time collaborative document editor: Markdown real-time editing, version history, multi-user collaboration simulation, auto-save
- Optimized icon system: Unified icon management, fixed Lucide React icon import errors
- Enhanced terminal network commands: Added ping, ifconfig, netstat, curl, dig, hostnamectl, nslookup
- Fixed build configuration: Ensured correct GitHub Pages deployment path
- Code quality improvements: Fixed TypeScript type errors, optimized command handler functions

### v29.0.0 (2026-06-15)

- Added intelligent code assistant with AI-assisted programming
- Enhanced workspace hub with improved layout and interaction
- Added network speed test tool
- Improved system monitoring dashboard

### v28.0.0 (2026-05-25)

- Added intelligent development workbench
- Enhanced terminal command system to 150+ commands
