# WebLinuxOS

**A fully-functional Linux desktop environment running entirely in your browser**

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) | [Documentation](README_CN.md)

## Overview

WebLinuxOS is a production-grade web-based operating system that provides a complete desktop experience with real functionality. Unlike typical OS simulators, WebLinuxOS integrates live APIs, real hardware data, and practical tools that make it genuinely useful for daily work.

### Key Features

**Real Functionality, Not Simulation**

- Live weather data from Open-Meteo API with real-time updates
- Actual network performance measurements using Performance API
- GitHub API integration for repository browsing and statistics
- Hacker News API for tech news tracking
- Cryptocurrency prices from CoinGecko API
- Python code execution with Pyodide runtime

**Complete Desktop Environment**

- Full window management system with drag, resize, minimize, maximize
- Multi-desktop support with keyboard shortcuts (Ctrl+Alt+1-9)
- Taskbar with app preview and system tray
- Application launcher with category filtering
- Virtual file system with CRUD operations
- Context menus and keyboard shortcuts

**200+ Built-in Applications**

Comprehensive application ecosystem covering:

| Category | Apps |
|----------|------|
| Development | Code Editor with Python execution, REST Client, API Explorer, JSON/YAML tools, Regex tester, Git tools, Code formatter |
| Utilities | Real-time data dashboard, Weather tracker, Calculator, Password generator, QR creator, Color picker, Unit converter, Clipboard manager |
| Office | Markdown editor, Notes with tagging, Task management, Calendar, Kanban board, Mind map, Whiteboard, Presentation creator |
| Internet | Web browser, News reader, GitHub trending, Wikipedia viewer, Translation tool, Crypto tracker |
| Multimedia | Image viewer, Music player with visualizer, Video player, Screen recorder, Camera, Paint tool |
| Games | Snake, Tetris, 2048, Memory game, Breakout |
| System | Terminal (60+ commands), File manager, System monitor, Process viewer, Disk usage analyzer |

**Terminal Emulator**

The terminal isn't just decorative - it's fully functional:

```bash
# File operations (virtual file system)
ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, tree, grep, find

# Real network commands
curl <url>           # Fetch actual web content
fetch <api-url>      # Get JSON from real APIs
ip                   # Your actual public IP and location (ipapi.co)
weather [city]       # Live weather data (Open-Meteo)
ping                 # Real network latency test
news                 # Tech headlines from Hacker News

# Real system data
cpu-info             # Actual CPU cores and usage (navigator.hardwareConcurrency)
memory-info          # Real memory stats (Performance API)
system-info          # Browser performance metrics
netstat              # Connection type detection

# Utilities
calc <expr>          # Math calculator
base64 <text>        # Base64 encoding
hash <text>          # Hash generation
uuid                 # UUID creation
password             # Secure password generation
```

## Technical Architecture

### Technology Stack

- **Framework**: React 19 with TypeScript
- **State Management**: Zustand for global state
- **Build Tool**: Vite 8 with optimized bundle splitting
- **Python Runtime**: Pyodide for in-browser Python execution
- **Icons**: Lucide React icon library
- **Styling**: CSS-in-JS with comprehensive theme system

### Architecture Highlights

**Window Management System**

- GPU-accelerated rendering with will-change optimization
- Window snapping with keyboard shortcuts
- Multi-desktop architecture with window movement
- Focused window glow effects and animations
- Lazy component loading with preloading strategy

**Application Registry**

- Centralized app definition system
- Category-based organization
- Icon and metadata management
- Dynamic component loading
- Duplicate prevention with ID validation

**Virtual File System**

- Tree-based file structure
- Path resolution and normalization
- CRUD operations with validation
- Content storage in localStorage
- Search and navigation features

**Performance Optimizations**

- GPU acceleration for animations (translateZ(0))
- Content containment (contain: layout/paint)
- Lazy loading with dynamic imports
- Bundle splitting for faster initial load
- Performance API integration for real metrics

## Quick Start

### Online Usage

Visit the [GitHub Pages deployment](https://saya-ch.github.io/WebLinuxOS/) for instant access. No installation required.

### Local Development

```bash
# Clone repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to project
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

### Build Configuration

```bash
# Local build (base path = /)
npm run build:local

# GitHub Pages build (configured for deployment)
npm run build:github
```

## Keyboard Shortcuts

### Global System Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+L | Toggle application launcher |
| Ctrl+Shift+K | Global search |
| Ctrl+Shift+P | Command palette |
| Ctrl+Alt+1-9 | Switch to desktop 1-9 |
| Ctrl+Alt+ArrowLeft/Right | Previous/Next desktop |
| Ctrl+Shift+Alt+1-9 | Move window to desktop |
| Alt+Tab | Cycle windows |
| Ctrl+W | Close focused window |
| Ctrl+M | Minimize window |
| F11 | Toggle fullscreen |

### Application Quick Launch

| Shortcut | Application |
|----------|-------------|
| Ctrl+T | Terminal |
| Ctrl+E | File Manager |
| Ctrl+B | Web Browser |
| Ctrl+, | System Settings |
| Ctrl+G | Code Editor |
| Ctrl+D | System Monitor |
| Ctrl+Shift+C | Calculator |
| Ctrl+Shift+N | Notes |
| Ctrl+Shift+W | Weather |
| Ctrl+Shift+M | Music Player |

## Application Categories

### Development Tools

Comprehensive suite for developers:

- **Code Editor**: Python/JS execution, syntax highlighting, multiple tabs
- **REST Client**: Full API testing with headers, body, authentication
- **API Explorer**: Browse 11 public APIs with live data
- **JSON Tools**: Formatter, schema validator, YAML converter
- **Regex Builder**: Visual regex construction and testing
- **Base64/URL Tools**: Encoding/decoding utilities
- **JWT Decoder**: Token parsing and verification
- **Hash Generator**: Multiple algorithm support
- **Code Diff Viewer**: Side-by-side comparison
- **Code Formatter**: Automatic code beautification

### Productivity Applications

Tools for daily work:

- **Markdown Editor**: Live preview with export
- **Notes**: Tagging, search, starred notes
- **Task Manager**: Multiple views, deadlines, priorities
- **Calendar**: Event management with reminders
- **Kanban Board**: Drag-and-drop task organization
- **Mind Map**: Visual brainstorming tool
- **Whiteboard**: Drawing and collaboration
- **Presentation**: Slide creator from Markdown

### Data & Information

Real-time data integration:

- **Real-time Dashboard Pro**: Weather, news, crypto, GitHub stats, network metrics - all live
- **Weather**: 7-day forecast with current conditions (Open-Meteo API)
- **Crypto Tracker**: Top 100 cryptocurrency prices (CoinGecko)
- **Stock Tracker**: Market indices and stock prices
- **News Reader**: RSS feeds and tech news aggregation
- **GitHub Trending**: Repository and developer discovery
- **Wikipedia Viewer**: Encyclopedia article browsing

### System Utilities

System management tools:

- **Terminal**: 60+ commands with real network/system data
- **File Manager**: Virtual file system with full operations
- **System Monitor**: Real CPU, memory, network usage
- **Process Viewer**: Running application management
- **Disk Usage**: Storage visualization
- **Network Speed Test**: Actual connection performance
- **Clipboard Manager**: History and search

### Creative Tools

Design and multimedia:

- **Paint**: Drawing canvas with tools
- **Color Picker**: Palette generation and management
- **Image Viewer**: Photo browsing with editing
- **Music Player**: Audio playback with visualizer
- **Video Player**: Media playback
- **Screen Recorder**: Capture functionality
- **Camera**: Webcam integration

### Entertainment

Games for breaks:

- Snake
- Tetris
- 2048
- Memory Cards
- Breakout
- Virtual Pet

## API Integrations

WebLinuxOS integrates with multiple public APIs for real functionality:

| API | Usage | Application |
|-----|-------|-------------|
| Open-Meteo | Weather data | Weather app, Terminal, Dashboard |
| ipapi.co | IP geolocation | Terminal ip command |
| CoinGecko | Cryptocurrency | Crypto tracker, Dashboard |
| Hacker News | Tech news | News reader, Dashboard |
| GitHub | Repository data | GitHub explorer, Dashboard |
| Wikipedia | Articles | Wikipedia reader |

## Performance Metrics

Real performance data captured from browser APIs:

- **CPU Info**: `navigator.hardwareConcurrency` for actual core count
- **Memory Info**: `navigator.deviceMemory` and JS Heap statistics
- **Network Info**: `navigator.connection` for bandwidth and latency
- **Performance API**: Navigation timing and FPS monitoring

## Deployment

### GitHub Pages

The project is configured for GitHub Pages deployment:

1. Build output goes to root directory (not `/dist`)
2. `.nojekyll` file prevents Jekyll processing
3. Custom 404.html for SPA routing
4. Base path configured for repository URL

### Build Process

```bash
# Clean previous build
npm run clean

# Build for GitHub Pages
npm run deploy

# Output structure:
# /workspace/WebLinuxOS/
#   index.html
#   favicon.svg
#   assets/ (JS/CSS bundles)
#   manifest.json
```

## Browser Compatibility

WebLinuxOS works in all modern browsers:

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

Requires:
- JavaScript enabled
- localStorage available
- WebGL support (for particles)
- Web APIs access

## Contributing

Contributions are welcome! Areas for improvement:

- New applications with real functionality
- Additional API integrations
- UI/UX enhancements
- Performance optimizations
- Bug fixes and error handling
- Documentation improvements

Please read the existing code structure before submitting PRs. The project uses:
- React functional components with hooks
- Zustand for state management
- CSS-in-JS for styling
- TypeScript for type safety

## License

MIT License - open source and free to use.

## Acknowledgments

Built with excellent open-source tools:

- [React](https://react.dev/) - UI framework
- [Vite](https://vitejs.dev/) - Build tool
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [Pyodide](https://pyodide.org/) - Python runtime
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Open-Meteo](https://open-meteo.com/) - Weather API

---

**WebLinuxOS demonstrates that web applications can be more than simple tools - they can provide complete, functional environments for real work.**