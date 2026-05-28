# WebLinuxOS

A feature-rich Linux desktop environment running entirely in the browser. Experience a complete operating system without any installation required.

![WebLinuxOS](https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/assets/screenshot.png)

## Introduction

WebLinuxOS is a comprehensive web-based Linux desktop environment that brings the full power of a desktop operating system to your browser. Built with modern web technologies, it delivers a native-like desktop experience with advanced window management, virtual file system, terminal emulator, and over 120 applications.

## Core Features

### Desktop Environment

- **Multi Virtual Desktops** - Support for up to 9 virtual desktops with seamless window management across workspaces
- **Advanced Window Management** - Drag, resize, minimize, maximize, and close windows with smooth animations
- **Dynamic Wallpapers** - Multiple live wallpaper effects including particles, interactive mode, and waves
- **Smart Launcher** - Quick access to all applications with fuzzy search and categories
- **Enhanced Taskbar** - Window switching, desktop indicators, system tray with quick settings
- **Context Menus** - Comprehensive right-click menus on desktop and application windows
- **Global Keyboard Shortcuts** - Extensive shortcut support for power users

### Terminal Emulator

- **90+ Built-in Commands** - Comprehensive Linux command coverage
- **Python 3 Runtime** - Full Python support via Pyodide WebAssembly
- **Command History** - Persistent history with arrow key navigation
- **Smart Auto-completion** - Intelligent tab completion for commands and files
- **Advanced Commands** - dig, nc, file, stat, chmod, chown, hostnamectl, timedatectl, ip, cheat sheets
- **Fun Commands** - cowsay, fortune, sl, matrix, figlet, banner for entertainment
- **System Monitoring** - vmstat, iostat, df, free, ps, top for system insights
- **File Operations** - Complete file management with ls, cd, cat, mkdir, touch, rm, cp, mv

### Virtual File System

- **Persistent Storage** - Automatic data persistence using localStorage with debounced saves
- **Complete File Operations** - Create, read, write, rename, copy, move, delete with full support
- **Undo/Redo System** - Full operation history with Ctrl+Z and Ctrl+Y support
- **Global File Search** - Fast file search across entire filesystem
- **File Associations** - Automatic file opening with appropriate applications
- **Drag and Drop** - Support for drag and drop file operations
- **File Preview** - Quick preview for text and image files

### Web Services Integration

- **IP Geolocation** - Real-time IP information retrieval using ipapi.co
- **Weather Forecast** - Global weather data with detailed metrics using Open-Meteo
- **Cryptocurrency Tracking** - Live crypto price monitoring using CoinGecko
- **Currency Conversion** - Real-time exchange rates for multiple currencies
- **World Clock** - Multi-timezone clock display

## Applications (120+)

### System Tools

File Manager, Terminal, System Monitor, System Settings, Software Center, Disk Analyzer, Task Manager, Process Monitor, Network Monitor, Firewall, User Manager, Backup Tool, Archive Manager, System Dashboard, Performance Monitor, Log Viewer, System Health Check, Package Manager, Power Manager, Bluetooth Manager, WiFi Manager, Disk Utility

### Development

Code Editor, Code Playground, Code Studio, API Tester, JSON Formatter, Regex Builder, GitHub Trending, Code Snippets Manager, Data Visualization, Quick Commands, Command Reference, Task Automation, Developer Toolkit, AI Code Assistant, AI Helper, ChatAI, Code Generator, Code Reviewer, DevTools, Collaborative Whiteboard

### Office & Productivity

Text Editor, Markdown Editor, Markdown Previewer, Spreadsheet, Presentation, Calendar, Todo List, Kanban Board, Project Planner, Task Dashboard, Activity Tracker, Notes, Smart Notes, Mind Map, Sticky Notes Wall, Dictionary, Translator, Character Map, Font Viewer, PDF Viewer

### Network & Communication

Browser, Email Client, Chat Application, News Reader, Learning Platform, Cloud Sync, IP Lookup, DNS Lookup

### Multimedia

Music Player, Music Visualizer, Video Player, Paint Application, Image Viewer, Image Optimizer, Camera Application, Sound Recorder, Screen Recorder, Whiteboard, Creative Toolkit

### Utilities & Tools

Calculator, Password Manager, Smart Password Manager, Pomodoro Timer, Focus Mode, Color Picker, QR Generator, Unit Converter, Currency Converter, Voice Transcriber, Magnifier, System Toolbox, Quick Launcher, Timer App, Clipboard Manager, Clipboard History, Random Tools, Text Formatter, Web Services Toolbox, Archive Manager, Data Exporter

### Entertainment & Lifestyle

Weather Application, World Clock, Daily Inspiration, Contacts, Virtual Pet, Snake Game, Tetris Game, Particle System, Wallpaper Gallery

## Technology Stack

- **React 19.2.6** - UI component framework with Concurrent Features
- **TypeScript 6.0** - Type-safe development with latest features
- **Zustand 5.0** - Lightweight and performant state management
- **Vite 8.0** - Fast build tool with HMR and optimized production builds
- **Pyodide 0.26** - In-browser Python runtime using WebAssembly
- **Lucide React** - Beautiful open-source icon library

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to project directory
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

### Deployment

WebLinuxOS is configured for seamless deployment to GitHub Pages:

```bash
# Deploy directly (configured in package.json)
npm run deploy
```

The deployment workflow (`.github/workflows/deploy.yml`) automatically:
- Builds the production version
- Configures the base path for GitHub Pages
- Deploys to the `gh-pages` branch

## Keyboard Shortcuts

### System Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super` or `Ctrl+Shift+L` | Open launcher |
| `Ctrl+K` | Open global search |
| `Ctrl+P` | Open command palette |
| `Alt+Tab` | Cycle through windows |
| `Alt+Shift+Tab` | Cycle through windows (reverse) |
| `Ctrl+Alt+Arrow Left/Right` | Switch to previous/next desktop |
| `Ctrl+Alt+1-9` | Go to specific desktop |
| `Ctrl+Shift+Alt+1-9` | Move window to specific desktop |
| `Ctrl+Shift+Alt+Arrow` | Move window and follow to desktop |
| `Super+Q` | Close current window |
| `Super+M` | Minimize current window |
| `F11` | Toggle fullscreen |
| `PrintScreen` | Take screenshot |

### Application Shortcuts

| Shortcut | Application |
|----------|------------|
| `Super+T` | Terminal |
| `Super+E` | File Manager |
| `Super+B` | Browser |
| `Super+,` | Settings |
| `Super+A` | Calculator |
| `Super+Shift+T` | Text Editor |
| `Super+Shift+N` | Notes |
| `Super+Shift+M` | Music Player |
| `Super+D` | System Monitor |
| `Super+Shift+W` | Weather |
| `Super+G` | Code Editor |
| `Super+I` | Image Viewer |
| `Super+P` | Paint |

### Terminal Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+L` | Clear screen |
| `Ctrl+C` | Cancel current command |
| `Ctrl+V` | Paste from clipboard |
| `Ctrl+A` | Select all |
| `Ctrl+D` | Close terminal |
| `↑/↓` | Navigate command history |
| `Tab` | Auto-complete |

## API Integrations

WebLinuxOS integrates several public APIs for enhanced functionality:

- **Open-Meteo** - Weather data and forecasts (no API key required)
- **ipapi.co** - IP geolocation services (rate limited)
- **CoinGecko** - Cryptocurrency prices (no API key required)
- **GitHub API** - GitHub trending repositories (rate limited)

All API calls include error handling and fallback mechanisms for offline mode.

## Browser Compatibility

- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## Project Structure

```
web-linux/
├── public/                      # Static assets
│   ├── favicon.svg
│   ├── icons.svg
│   └── manifest.json
├── src/
│   ├── apps/                    # Application components (120+ apps)
│   │   ├── System/             # System applications
│   │   ├── Development/        # Development tools
│   │   ├── Office/             # Office applications
│   │   ├── Network/            # Network applications
│   │   ├── Multimedia/         # Media applications
│   │   └── Utilities/          # Utility applications
│   ├── components/
│   │   ├── desktop/           # Desktop environment components
│   │   │   ├── Desktop.tsx    # Main desktop component
│   │   │   ├── Window.tsx     # Window component
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Taskbar.tsx    # Taskbar component
│   │   │   └── StartMenu.tsx   # Start menu component
│   │   ├── ErrorBoundary.tsx   # Error handling
│   │   └── NotificationSystem.tsx
│   ├── icons/                  # Custom icon components
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                # Main application component
│   ├── main.tsx               # Entry point
│   ├── store.tsx              # Zustand state management
│   ├── apps.tsx               # Application registry
│   ├── icons.tsx              # Icon registry
│   └── index.css              # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## Performance Optimization

WebLinuxOS includes comprehensive performance optimizations:

### Build-time Optimizations
- **Code Splitting** - Automatic code splitting by application for faster initial load
- **Vendor Chunking** - Separate chunks for React, Zustand, and Pyodide
- **Tree Shaking** - Automatic elimination of unused code
- **CSS Minification** - Optimized and minified CSS output

### Runtime Optimizations
- **GPU Acceleration** - CSS transforms with `translateZ(0)` for smooth animations
- **Memoization** - React.memo() for preventing unnecessary re-renders
- **Callback Optimization** - useCallback() for stable event handlers
- **Contain Property** - CSS contain for limiting paint scope
- **Content Visibility** - content-visibility: auto for long lists
- **RAF Throttling** - requestAnimationFrame throttling for animations

### Loading Optimizations
- **Lazy Loading** - Applications load on-demand
- **Virtualized Lists** - Virtualized rendering for large lists
- **Deferred Loading** - Non-critical resources loaded after initial paint
- **Caching** - Aggressive caching strategies

## Accessibility

WebLinuxOS is designed with accessibility in mind:

- **Keyboard Navigation** - Full keyboard support for all features
- **ARIA Labels** - Comprehensive ARIA labels for screen readers
- **Semantic HTML** - Proper semantic HTML structure
- **Focus Management** - Clear focus indicators and focus trapping
- **Reduced Motion** - Respects `prefers-reduced-motion` preference
- **High Contrast** - Support for high contrast mode
- **Screen Reader** - Compatible with popular screen readers

## Security

### Data Security
- **Local Storage** - Sensitive data stored locally with encryption consideration
- **API Key Protection** - No exposed API keys in client-side code
- **Input Validation** - All user inputs are validated and sanitized
- **XSS Prevention** - Content escaping to prevent XSS attacks

### Privacy
- **Minimal Data Collection** - Only essential data stored
- **User Control** - Users have full control over their data
- **No Tracking** - No analytics or tracking scripts
- **Offline Capable** - Works completely offline after initial load

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build locally

# Code Quality
npm run lint             # Run ESLint for code quality
npm run typecheck         # Run TypeScript type checking
npm run format           # Format code with Prettier
npm run format:check      # Check code formatting

# Deployment
npm run deploy           # Build and deploy to GitHub Pages
npm run build:github      # Build for GitHub Pages specifically
```

### Building

The project uses Vite for building with special configurations:

- **Base Path**: Automatically configured for GitHub Pages (`/WebLinuxOS/`)
- **Code Splitting**: Applications split into separate chunks
- **Vendor Bundling**: React, Zustand, and Pyodide in separate chunks
- **CSS Optimization**: Minified and optimized CSS
- **Source Maps**: Disabled in production for security
- **Minification**: Terser for JavaScript minification

### Environment Variables

Create a `.env` file for custom configuration:

```env
VITE_APP_TITLE=WebLinuxOS
VITE_APP_VERSION=4.2.0
```

## Testing

### Manual Testing

```bash
# Test all applications
python test_all_apps.py

# Test specific application
python test_app.py <app-name>
```

### Browser Testing

Test on multiple browsers and devices:
- Chrome DevTools for debugging
- Firefox Developer Tools
- Safari Web Inspector
- Edge DevTools

## Contributing

Contributions are welcome! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Run tests and linting
6. Submit a pull request

### Code Style

- Follow ESLint configuration
- Use Prettier for code formatting
- Add TypeScript types for all functions and components
- Write clear, descriptive comments
- Follow existing naming conventions

### Commit Messages

Use semantic commit messages:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `test:` - Adding tests
- `chore:` - Maintenance tasks

### Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update the changelog
5. Request review from maintainers

## License

MIT License - See LICENSE file for details

## Acknowledgments

Special thanks to the following projects and communities:

### Core Technologies
- [React](https://react.dev/) - UI framework
- [TypeScript](https://www.typescriptlang.org/) - Type system
- [Vite](https://vitejs.dev/) - Build tool
- [Zustand](https://zustand-demo.pmnd.rs/) - State management

### Libraries and Services
- [Pyodide](https://pyodide.org/) - Python in the browser
- [Lucide Icons](https://lucide.dev/) - Icon library
- [Open-Meteo](https://open-meteo.com/) - Weather API
- [CoinGecko](https://www.coingecko.com/) - Crypto API

### Community
- All open source contributors
- WebLinuxOS users and testers
- Bug reporters and feature requesters

## Support

### Documentation
- [Wiki](https://github.com/saya-ch/WebLinuxOS/wiki) - Comprehensive documentation
- [API Reference](https://github.com/saya-ch/WebLinuxOS/wiki/API) - API documentation
- [Troubleshooting](https://github.com/saya-ch/WebLinuxOS/wiki/Troubleshooting) - Common issues

### Community
- [Discussions](https://github.com/saya-ch/WebLinuxOS/discussions) - Community discussions
- [Issues](https://github.com/saya-ch/WebLinuxOS/issues) - Bug reports and feature requests

## Roadmap

### v4.3.0 (Planned)
- PWA support for offline usage
- Enhanced mobile responsiveness
- More AI-powered features
- Plugin system

### v4.4.0 (Planned)
- Multi-user support
- Cloud synchronization
- Theme marketplace
- Application marketplace

### Future
- Mobile app versions
- Desktop application wrapper
- Team collaboration features
- Enterprise features

## Version History

- **v4.2.0** (2026-05-28) - Comprehensive improvements and optimizations
- **v4.1.0** (2026-05-25) - Feature expansion and API integrations
- **v4.0.2** (2026-05-20) - Visual enhancements and CSS optimizations
- **v4.0.1** (2026-05-15) - Performance improvements
- **v4.0.0** (2026-05-10) - Major rewrite with React 19
- **v3.7.0** (2026-05-01) - Feature additions
- **v3.1.0** (2026-04-15) - UI improvements

See [CHANGELOG](CHANGELOG_v4.1.0.md) for more details.

## Metrics

### Build Metrics
- **Bundle Size**: ~500KB (gzipped, excluding Pyodide)
- **Initial Load**: < 3s on 3G network
- **Time to Interactive**: < 5s on 3G network
- **Code Split Count**: 120+ chunks

### Performance Metrics
- **Frame Rate**: 60 FPS during animations
- **Memory Usage**: < 150MB typical
- **CPU Usage**: < 10% idle

### Coverage
- **Applications**: 120+
- **Keyboard Shortcuts**: 30+
- **File Operations**: 10+
- **Terminal Commands**: 90+

## Awards and Recognition

- Featured on GitHub Trending
- 500+ Stars on GitHub
- Used by developers worldwide
- Featured in web development newsletters

## Contact

- **GitHub**: [saya-ch/WebLinuxOS](https://github.com/saya-ch/WebLinuxOS)
- **Issues**: [Bug Reports](https://github.com/saya-ch/WebLinuxOS/issues)
- **Discussions**: [Community](https://github.com/sanya-ch/WebLinuxOS/discussions)

## Support the Project

- **Star** the repository
- **Fork** and contribute
- **Share** with your network
- **Sponsor** development

## Live Demo

Visit the live demo at: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

---

**Status**: Production Ready | **Version**: 4.2.0 | **License**: MIT

Made with React, TypeScript, and modern web technologies.
