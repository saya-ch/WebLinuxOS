# WebLinuxOS

A fully functional web-based desktop operating system that runs entirely in the browser.

<p align="center">
  <img src="https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/public/screenshot.png" alt="WebLinuxOS" width="100%">
</p>

<p align="center">
  <a href="https://saya-ch.github.io/WebLinuxOS/">Live Demo</a>
  ·
  <a href="#features">Features</a>
  ·
  <a href="#applications">Applications</a>
  ·
  <a href="#getting-started">Getting Started</a>
</p>

---

## About

WebLinuxOS is a web-based desktop environment that brings a complete Linux-like experience to your browser. It provides window management, file system, taskbar, and over 250 applications - all without installation.

Built with React 18, TypeScript, and Vite, WebLinuxOS delivers smooth animations, responsive design, and a rich feature set that rivals native desktop environments. All applications feature real functionality with live API integrations - not just mockups.

## Features

### Core Desktop
- **Window System**: Drag, resize, minimize, maximize, and close with smooth animations
- **Taskbar**: Application switching, system tray, real-time clock
- **Virtual Filesystem**: Complete file browsing and management
- **Multi-tasking**: Run multiple applications simultaneously
- **Theme Support**: Dark/light mode with customizable colors
- **Multiple Desktops**: Organize windows across virtual workspaces
- **Keyboard Shortcuts**: Comprehensive hotkey system (Ctrl+Shift+? for reference)

### Developer Tools
- **Code Editor**: Enhanced syntax highlighting for JavaScript, TypeScript, Python, HTML, CSS with auto-completion, find/replace, and multi-tab support
- **REST Client**: API testing with request/response inspection
- **Regex Tester**: Pattern validation and debugging
- **JSON Formatter**: Pretty-print and validation
- **GitHub Explorer**: Browse repositories and trending projects with real-time data
- **Code Runner**: Execute JavaScript and Python in real-time
- **Code Diff Viewer**: Compare code changes side-by-side

### Office & Productivity
- **Markdown Editor**: Live preview with formatting support
- **Spreadsheet**: Data entry and basic calculations
- **Presentation**: Slide creation and presentation tools
- **Calendar**: Date management with reminders
- **Notes**: Quick note-taking with categorization

### Utilities
- **Calculator**: Scientific calculator with unit conversion
- **Weather**: Real-time weather information with Open-Meteo API integration
- **Password Manager**: Secure password storage and generation
- **System Monitor**: Real-time CPU, memory, and network monitoring
- **Screenshot**: Capture screen regions and windows
- **Character Map**: Unicode character reference
- **Crypto Tracker**: Live cryptocurrency prices from CoinGecko with portfolio management
- **Country Info**: Explore 250+ countries with REST Countries API (population, currency, languages, flags)
- **Astro Daily**: NASA Astronomy Picture of the Day with history browsing and favorites
- **Currency Converter**: Real-time exchange rates from Frankfurter API
- **IP Lookup**: Network geolocation with multiple fallback APIs

### Multimedia
- **Music Player**: Audio playback with playlist management
- **Video Player**: Multi-format video support
- **Image Viewer**: Browse and preview images
- **Drawing Tool**: Canvas-based illustration

### Entertainment
- Snake, Tetris, 2048, Memory Card, and more

## Applications

WebLinuxOS includes applications across seven categories:

| Category | Applications |
|----------|-------------|
| System | File Manager, Terminal (60+ commands), System Monitor, Task Manager, Settings, Software Center |
| Development | Code Editor, REST Client, Regex Tester, JSON Formatter, GitHub Explorer, Code Runner, Code Diff Viewer |
| Office | Text Editor, Markdown Editor, Spreadsheet, Presentation, Calendar, Notes |
| Utilities | Calculator, Weather, Password Manager, Screenshot, Character Map, Clock, Crypto Tracker, Country Info, Astro Daily, Currency Converter, IP Lookup |
| Multimedia | Music Player, Video Player, Image Viewer, Drawing Tool, Camera |
| Internet | Browser, Email Client, Chat, Hacker News Reader, Wikipedia Explorer, GitHub Profile |
| Games | Snake, Tetris, 2048, Memory Card |

### Live API Integrations

All network-enabled applications use real, free public APIs:

- **Weather**: Open-Meteo API (no key required)
- **Crypto Tracker**: CoinGecko API (no key required)
- **Currency Converter**: Frankfurter API (no key required)
- **Country Info**: REST Countries API (no key required)
- **Astro Daily**: NASA APOD API (demo key)
- **Hacker News**: Algolia HN API (no key required)
- **Wikipedia**: MediaWiki API (no key required)
- **GitHub**: GitHub REST API (rate limit: 60/hour anonymous)

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

Open `http://localhost:5173` in your browser.

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
3. Access at `https://<username>.github.io/WebLinuxOS/`

### Manual Deployment

```bash
npm run build
git subtree push --prefix dist origin gh-pages
```

## Technical Details

### Tech Stack
- React 18 with Concurrent Features
- TypeScript 5
- Vite 8
- Zustand (state management)
- Lucide React (icons)

### Project Structure

```
web-linux/
├── src/
│   ├── apps/              # Application components
│   ├── components/        # System components (Window, Taskbar, Desktop)
│   ├── store.tsx          # Global state management
│   ├── types.ts           # TypeScript definitions
│   └── index.css          # Global styles
├── public/                # Static assets
├── vite.config.ts         # Build configuration
└── package.json           # Dependencies
```

### Key Components

- **Window Management**: Custom implementation with drag, resize, and snap-to-edge
- **Virtual File System**: Tree-based file structure with CRUD operations
- **Application Registry**: Centralized app registration with lazy loading
- **Command System**: Extensible terminal command framework

## Usage

### Basic Operations
- **Launch Apps**: Click desktop icons or use the start menu
- **Switch Windows**: Alt+Tab or click taskbar icons
- **Manage Files**: Use File Manager for all file operations
- **Search**: Ctrl+K for global search

### Keyboard Shortcuts
Press Ctrl+Shift+? to open the full shortcut reference panel.

### File Preview
Double-click files to preview:
- Images: JPG, PNG, GIF, SVG, WebP
- Text: TXT, Markdown, JSON, code files
- Audio: MP3, WAV, FLAC
- Video: MP4, WebM, OGG

## Performance

- Lazy loading for applications
- Code splitting for reduced bundle size
- Virtual scrolling for long lists
- CSS animations for smooth transitions
- Optimized re-renders with React memo

## Contributing

Contributions are welcome. Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) for details.

## Changelog

### v12.0.0
- Added Country Info application with REST Countries API integration (250+ countries)
- Enhanced Astro Daily with NASA APOD API (random dates, favorites, download)
- Improved Code Editor with auto-completion, find/replace, multi-tab support
- Enhanced Crypto Tracker with portfolio management and coin converter
- Updated GitHub Explorer with real-time trending repos and search
- Added comprehensive API integration documentation
- Performance optimizations for large file handling
- Improved error handling and loading states across apps

### v11.1.0
- Enhanced file preview with audio/video support
- Added global shortcut reference panel (Ctrl+Shift+?)
- Improved window snapping with alignment guides
- Enhanced System Monitor with real-time metrics
- Fixed file manager cut operation bug
- Added terminal Git commands

### v11.0.0
- Added AI Learning Companion
- Added Creative Inspiration Workshop
- Added Developer Ecosystem
- Expanded wallpaper collection to 32 themes

### v10.0.0
- Real-time Markdown collaborative editor
- API health monitoring center
- Code snippet sharing center

---

Built with modern web technologies for a seamless desktop experience.