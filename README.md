# WebLinuxOS

A fully functional web-based desktop operating system that runs entirely in the browser. No installation required.

![WebLinuxOS screenshot](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/public/screenshot.png)

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)** | **[Features](#features)** | **[Applications](#applications)** | **[Getting Started](#getting-started)**

---

## Overview

WebLinuxOS brings a complete Linux-like desktop experience to your browser. It includes window management, a virtual file system, taskbar, system tray, and over 250 applications--all running entirely client-side without any backend server.

The system is built with React 19, TypeScript, and Vite, delivering smooth animations, responsive design, and a feature set that rivals native desktop environments. Unlike many demo projects, WebLinuxOS features real functionality with live API integrations throughout.

## Features

### Desktop Environment

- **Window System**: Drag, resize, minimize, maximize, and close windows with smooth animations
- **Taskbar**: Application switching, system tray, real-time clock, and workspace management
- **Virtual Filesystem**: Complete file browsing, creation, editing, and organization
- **Multi-workspace**: Organize windows across multiple virtual desktops (up to 9)
- **Theme System**: Dark/light mode with custom accent colors
- **Keyboard Shortcuts**: Comprehensive hotkey support (Ctrl+Shift+? for reference)

### Terminal

- 80+ built-in commands covering file operations, system information, networking, and utilities
- Real API integrations for weather, news, crypto prices, DNS lookup, dictionary, and IP lookup
- Command history and auto-completion with Tab
- Syntax highlighting and colored output (ANSI escape codes)
- Alias support (persisted to localStorage)
- Smart caching for API responses to reduce network requests

### Development Tools

- **Code Editor**: Syntax highlighting for JavaScript, TypeScript, Python, HTML, CSS with auto-completion
- **Code Runner**: Execute JavaScript and Python in real-time
- **REST Client**: API testing with request/response inspection
- **Regex Tester**: Pattern validation and debugging
- **JSON Formatter**: Pretty-print and validation
- **GitHub Explorer**: Browse repositories and trending projects
- **Code Diff Viewer**: Compare code changes side-by-side

### Productivity

- **Markdown Editor**: Live preview with formatting support
- **Spreadsheet**: Data entry and calculations
- **Presentation**: Slide creation tools
- **Calendar**: Date management with reminders
- **Notes**: Quick note-taking with categorization

### Live API Integrations

All network-enabled applications use real, free public APIs:

| Service | API | Purpose |
|---------|-----|---------|
| Weather | Open-Meteo | Current conditions and forecasts (150+ cities) |
| Crypto | CoinGecko | Real-time cryptocurrency prices and detailed info |
| Currency | Frankfurter | Currency conversion rates |
| Countries | REST Countries | Country information (250+ countries) |
| Astronomy | NASA APOD | Daily space imagery |
| News | Hacker News | Tech news via Algolia API |
| Wikipedia | MediaWiki | Article search and summaries |
| DNS | Google DNS | Domain name system record lookup |
| Dictionary | Dictionary API | English word definitions and phonetics |
| Translation | MyMemory | Multi-language text translation |
| IP Geolocation | ipapi.co | IP address location and ISP info |
| QR Code | QR Server | QR code generation |
| Stocks | Alpha Vantage | Stock market quotes and prices |
| GitHub | GitHub API | Repository and user profile information |
| Trivia | OpenTDB | Random knowledge quiz questions |
| Fun Facts | FreeAPI | Random fun facts |
| Cat Facts | Cat Fact Ninja | Random cat-related facts |
| Quotes | Quotable.io | Inspirational quotes |

## Applications

WebLinuxOS includes applications across seven categories:

| Category | Applications |
|----------|-------------|
| System | File Manager, Terminal, System Monitor, Task Manager, Settings, Software Center, Smart Overview |
| Development | Code Editor, REST Client, Regex Tester, JSON Formatter, GitHub Explorer, Code Runner, Dev Toolkit |
| Office | Text Editor, Markdown Editor, Spreadsheet, Presentation, Calendar, Notes |
| Utilities | Calculator, Weather, Password Manager, Screenshot, Character Map, Clock, Crypto Tracker, Real-Time Translator, QR Code Generator |
| Multimedia | Music Player, Video Player, Image Viewer, Drawing Tool, Camera |
| Internet | Browser, Email Client, Chat, Hacker News Reader, Wikipedia Explorer |
| Games | Snake, Tetris, 2048, Memory Card |

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173/WebLinuxOS/` in your browser.

### Build for Production

```bash
npm run build
```

Build artifacts are output to the `dist/` directory.

## Deployment

### GitHub Pages

The project uses GitHub Actions for automatic deployment:

1. Push changes to the main branch
2. GitHub Actions automatically builds and deploys to GitHub Pages
3. Access at `https://saya-ch.github.io/WebLinuxOS/`

### Manual Deployment

```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

## Technical Details

### Tech Stack

- React 19 with Concurrent Features
- TypeScript 5
- Vite 8
- Zustand (state management)
- Lucide React (icons)

### Project Structure

```
web-linux/
├── src/
│   ├── apps/              # Application components
│   │   ├── terminal/      # Terminal command system
│   │   └── *.tsx         # Individual applications
│   ├── components/        # System components (Window, Taskbar, Desktop)
│   ├── store/             # State management utilities
│   │   ├── fileUtils.ts   # File system operations
│   │   ├── storageUtils.ts # localStorage persistence
│   │   └── defaults.ts    # Default state values
│   ├── utils/             # Utility functions
│   │   └── apiCache.ts    # API caching and fetch utilities
│   ├── store.tsx          # Global state management (Zustand)
│   ├── types.ts           # TypeScript definitions
│   ├── apps.tsx           # Application registry
│   └── index.css          # Global styles
├── public/                # Static assets
├── vite.config.ts         # Build configuration
└── package.json           # Dependencies
```

## Usage

### Basic Operations

- **Launch Apps**: Click desktop icons or use the start menu (click the penguin icon)
- **Switch Windows**: Alt+Tab or click taskbar icons
- **Manage Files**: Use File Manager for all file operations
- **Search**: Ctrl+K for global search
- **Multiple Desktops**: Switch with taskbar buttons or Ctrl+Arrow keys

### Terminal Commands

The terminal supports 80+ commands. Type `help` in the terminal for the full list. Key categories:

**File Operations**: `ls`, `cd`, `pwd`, `cat`, `mkdir`, `touch`, `rm`, `cp`, `mv`, `grep`, `find`, `tree`

**System Info**: `whoami`, `hostname`, `date`, `uname`, `uptime`, `neofetch`, `ps`, `top`

**Network**: `ping`, `curl`, `fetch`, `weather`, `weather-search`, `news`, `news-summary`, `crypto`, `crypto2`, `crypto-news`, `translate`, `ip`, `ipinfo`, `dns`, `dict`, `qr`, `stock`, `timezone`, `github`, `ghuser`, `shorten`, `whois`

**Utilities**: `calc`, `password`, `uuid`, `hash`, `base64`, `json`, `urlencode`, `datetime`, `calendar`, `reminder`, `health`, `productivity`, `code-review`, `todo`, `code-tip`, `challenge`, `world-clock`, `quote-of-the-day`, `brainstorm`, `random`

**Fun**: `cowsay`, `fortune`, `starwars`, `matrix`, `joke`, `advice`, `trivia`, `funfact`, `catfact`, `quote`, `story`, `flip`, `rps`

### File Preview

Double-click files to preview:
- Images: JPG, PNG, GIF, SVG, WebP
- Text: TXT, Markdown, JSON, code files
- Audio: MP3, WAV, FLAC
- Video: MP4, WebM, OGG

## Keyboard Shortcuts

Press Ctrl+Shift+? to open the full shortcut reference panel.

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+Shift+S | Open settings |
| Ctrl+Shift+F | Open file manager |
| Ctrl+Shift+T | Open terminal |
| Ctrl+N | New terminal window |
| Ctrl+W | Close current window |
| Ctrl+M | Minimize current window |
| F11 | Toggle fullscreen/maximize |
| Alt+Tab | Switch windows |
| Ctrl+K | Global search |
| Ctrl+, | Open settings |
| Ctrl+Arrow | Switch desktop |

## Performance

- Lazy loading for applications via dynamic imports
- Code splitting for reduced bundle size (vendor chunks + per-app chunks)
- Virtual scrolling for long lists
- CSS animations for smooth 60fps transitions
- GPU-accelerated transforms for window dragging
- Content-visibility for off-screen content
- Smart API caching to reduce network requests (configurable TTL)
- Request timeout and retry mechanism for improved reliability
- Debounced and throttled event handlers for responsive UI

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Recent Improvements

### v15.1.0 (Current Iteration)

**New Terminal Commands:**
- `uuid` - Generate random UUID (v4)
- `hash` - Calculate MD5/SHA1/SHA256/SHA512 hash values
- `base64` - Base64 encode/decode text
- `urlencode` - URL encode/decode text
- `datetime` - Display current date/time with timestamp
- `ping` - Network connectivity test with latency measurement
- `shorten` - URL shortener with shrtcode API integration
- `news-summary` - Daily news digest with fallback data
- `brainstorm` - Creative idea generation for any topic
- `calendar` - Interactive calendar with month/year navigation
- `reminder` - Set and manage reminders
- `health` - Time-based health tips and daily advice
- `productivity` - Random productivity improvement tips
- `code-review` - Language-specific code review checklists
- `todo` - Todo list management
- `story` - Programming motivational stories
- `code-tip` - Random programming tips across languages
- `challenge` - Random coding challenges with difficulty levels
- `crypto-news` - Latest cryptocurrency news
- `world-clock` - Real-time world clock for 14+ cities
- `quote-of-the-day` - Inspirational quotes from Quotable.io
- `weather-search` - Search weather by city name globally
- `whois` - Domain registration information lookup
- `ipinfo` - IP address detailed information
- `random` - Random number generator with range support
- `flip` - Coin flip game
- `rps` - Rock-paper-scissors game

**Bug Fixes:**
- Fixed CSS duplicate animation definitions (gradientShift, starTwinkle, cursorBlink)
- Resolved keyboard shortcut conflicts (paint vs command-palette, notes vs new-terminal, camera vs image-viewer)
- Fixed ping command CORS issues with fallback API (ping.pe)

**Key Improvements:**
- Added smart API caching system with configurable TTL for reduced network requests
- Implemented request timeout (10s default) and exponential backoff retry mechanism
- Enhanced error handling across all API-integrated features with user-friendly messages
- Added utility library with debounce, throttle, formatNumber, formatBytes functions
- Expanded city support for weather (150+ cities worldwide including major cities in Asia, Europe, Americas, Africa, and Oceania)
- Extended language support for translation (12+ languages)
- Improved type safety with proper TypeScript type definitions
- Enhanced GitHub integration with both repository and user profile lookup
- Added comprehensive productivity and developer tools to terminal
- Implemented fallback data for all API-dependent commands
- Enhanced terminal output formatting with consistent styling

**Performance Optimizations:**
- API response caching with TTL-based invalidation
- Request deduplication and retry with exponential backoff
- Memory-efficient cache management
- Optimized re-renders with useMemo and useCallback
- Lazy-loaded terminal commands for faster initial load

### v15.0.0

**New Applications:**
- **Dev Toolkit**: Comprehensive developer toolkit with 14+ tools including Base64/URL encoding, hash generation, UUID generation, JSON formatting, timestamp conversion, QR code generation, translation, weather, crypto prices, news, IP lookup, DNS query, and English dictionary
- **Smart Overview**: Intelligent dashboard with system status, weather information, quick notes, and fast app launch

**New Terminal Commands:**
- `weather` - Real-time weather with 3-day forecast (Open-Meteo API, 10-min cache)
- `crypto` - Top 10 cryptocurrency prices (CoinGecko API)
- `news` - Hacker News top stories (Algolia API, 5-min cache)
- `joke` - Random programming jokes with fallback library
- `translate` - Multi-language text translation (MyMemory API)
- `qr` - QR code generation
- `dns` - DNS record lookup (Google DNS, 5-min cache)
- `ip` - IP address geolocation (ipapi.co)
- `dict` - English dictionary with definitions and phonetics (Dictionary API, 30-min cache)
- `stock` - Stock market quotes (Alpha Vantage API)
- `timezone` - Current time in any city with timezone info
- `github` - GitHub repository information (GitHub API, 5-min cache)
- `ghuser` - GitHub user profile details (GitHub API, 5-min cache)
- `trivia` - Random knowledge quiz with multiple-choice questions
- `funfact` - Random fun facts from FreeAPI
- `catfact` - Random cat facts (Cat Fact Ninja)
- `quote` - Random inspirational quotes (Quotable.io)
- `crypto2` - Detailed cryptocurrency information with ATH/ATL and description

### v14.0.0

**New Applications:**
- **Real-Time Translator Enhanced**: Professional translation tool with MyMemory API integration, supporting 15+ languages, automatic translation, history tracking, and text-to-speech functionality
- **QR Code Generator Pro**: Advanced QR code generator with goQR.me API integration, custom colors, size control, error correction levels, and batch history

**Key Improvements:**
- Converted simulation applications to production-grade tools with real API integrations
- Extended dynamic application registration system (APP_REGISTRY_EXTRAS)
- Unified modern UI design across all new applications
- Enhanced error handling and user notification systems
- Added localStorage persistence for user history and preferences

**API Integrations:**
- MyMemory Translation API (free, no key required) - supports 15+ languages
- goQR.me QR Code API (free, no key required) - custom styling and error correction
- Web Speech API - text-to-speech for translation results

### v13.0.0

**New Applications:**
- **Code Collaboration Platform**: Real-time collaborative coding environment with session sharing, multi-language support, and live code execution
- Enhanced developer tools with practical real-world functionality

**Key Improvements:**
- Strengthened application functionality from simulation shells to practical tools
- Optimized UI/UX with refined interactions and visual feedback
- Enhanced code quality and error handling across core components
- Improved GitHub Pages deployment configuration
- Added comprehensive keyboard shortcuts documentation

### v12.0.0

- Added CountryInfo application with REST Countries API integration (250+ countries)
- Enhanced Astro Daily with NASA APOD API (random dates, favorites, download)
- Improved Code Editor with auto-completion, find/replace, multi-tab support
- Enhanced Crypto Tracker with portfolio management and coin converter
- Updated GitHub Explorer with real-time trending repos and search

### v11.1.0

- Enhanced file preview with audio/video support
- Added global shortcut reference panel (Ctrl+Shift+?)
- Improved window snapping with alignment guides
- Enhanced System Monitor with real-time metrics
- Fixed file manager cut operation bug
- Added terminal Git commands

### v10.0.0

- Major UI/UX overhaul with new theme system
- Added live wallpaper support (particles, aurora, nebula)
- Enhanced window management with snap hints
- Improved performance with GPU acceleration

---

## Future Roadmap

- Integration with more public APIs for enhanced functionality
- Real-time collaborative features across multiple applications
- Enhanced AI-powered tools and assistants
- Mobile-responsive optimizations
- Offline capability with localStorage persistence
- Plugin system for third-party extensions

---

Built with modern web technologies for a seamless desktop experience.
