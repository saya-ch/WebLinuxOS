# WebLinuxOS

A feature-complete web-based Linux desktop environment running entirely in the browser. No backend required - all functionality runs client-side.

**Live Demo**: https://saya-ch.github.io/WebLinuxOS/

---

## Overview

WebLinuxOS brings the Linux desktop experience to your browser. It features a modern responsive interface with multi-window management, virtual desktops, and over 120 applications. This project demonstrates the possibilities of modern web technology, combining the familiarity of traditional desktop environments with the accessibility of web applications.

## Core Features

### Desktop Environment
- Multiple virtual desktops with customizable wallpapers
- Advanced window management with smooth animations
- Smart launcher with fuzzy search and categorized app list
- System tray with network, volume, and battery indicators
- Global search across applications and files
- Command palette for quick system commands
- Dynamic wallpapers with particle effects
- Dark/light theme support

### Development Tools
- Code editor with syntax highlighting for multiple languages
- REST API tester with request builder
- JSON formatter and validator
- Interactive regex builder
- GitHub trending repository viewer
- Python REPL via Pyodide
- 90+ terminal commands (file operations, system monitoring, network tools)
- Code snippet manager with JSON import/export
- CSS toolbox: gradient, box-shadow, border-radius, flexbox, grid, text-shadow generators
- AI prompt library with categorized presets

### Productivity
- Text/markdown editor with live preview
- Spreadsheet with basic data entry
- Calendar with date and event management
- Todo list with completion tracking
- Kanban board with drag-and-drop
- Smart notes with tags and import/export
- Mind mapping tool
- Presentation creator
- Smart schedule assistant with AI suggestions
- Spaced repetition knowledge cards for learning

### Utilities
- Scientific calculator with advanced functions
- Password manager with encryption
- Pomodoro timer with customizable work sessions
- Color picker supporting multiple formats
- Real-time translation
- Clipboard manager with history
- Weather application
- Online API hub with NASA, news, and crypto data

### Multimedia & Entertainment
- Music player with playlist support
- Paint application with drawing tools
- Camera access for video capture
- Classic games (Snake, Tetris)

### Online Services Integration
- Weather information from wttr.in
- Cryptocurrency prices from CoinGecko
- Daily NASA astronomy picture with historical lookup
- Near-Earth asteroid tracking via NASA NeoWs API
- Real-time ISS (International Space Station) position
- Real-time exchange rates
- Dictionary definitions
- Random quotes and jokes
- IP geolocation information

## Terminal Commands

Over 90 commands supported:

**File Operations**: ls, cd, pwd, cat, mkdir, touch, rm, cp, mv, tree, wc, du  
**System Info**: whoami, hostname, date, uname, uptime, cal, free, df, ps, top, sysinfo  
**Network Tools**: ping, ifconfig, curl, host, nslookup, dig, traceroute, nmap  
**System Monitoring**: vmstat, iostat, netstat, ss, lsof, htop, btop  
**Utilities**: echo, find, grep, env, export, which, file  
**Efficiency**: translate, news, worldtime, todo  
**Security**: base64, hash, openssl, ssh-keygen  
**Math**: calc, bc, expr, seq  
**Fun**: cowsay, fortune, joke, advice, flip, rps

## Getting Started

```bash
# Clone repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+K | Global search |
| Ctrl+P | Command palette |
| Alt+Tab | Window switch |
| Ctrl+Q | Close window |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+Shift+C | Terminal interrupt |
| Ctrl+1-9 | Switch desktop |
| Ctrl+Alt+Arrow | Switch desktop |
| Ctrl+Shift+1-9 | Move window to desktop |

## Technology Stack

- **React 19** - UI framework with latest features
- **TypeScript 6** - Type-safe development
- **Zustand 5** - Lightweight state management
- **Vite 8** - Optimized build tool
- **Pyodide** - Python runtime in browser
- **Lucide React** - Icon library
- **IndexedDB** - Persistent local storage

## Architecture

WebLinuxOS follows a modular architecture:

```
src/
  apps/              # Individual applications
  components/
    desktop/         # Desktop environment components
  store/             # State management utilities
  types.ts           # TypeScript definitions
  icons.tsx          # Icon components
  App.tsx            # Main application component
```

### Core Components
- Desktop - Main workspace with icons and wallpaper
- WindowManager - Handles window positioning and z-index
- Taskbar - System tray and window list
- StartMenu - Categorized application launcher
- CommandPalette - Quick command execution
- GlobalSearch - Cross-application search

## Performance Optimizations

- Code splitting - Each application loaded on demand
- Lazy loading - Applications load only when opened
- Memoization - React components optimized with memo
- Efficient rendering - Virtual lists and optimized updates
- GPU acceleration - Animations using transform and opacity
- Throttling - Drag and resize optimized with requestAnimationFrame

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Note: Some features require modern browser capabilities.

## Contributing

Contributions welcome! Follow these steps:

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Make changes
4. Run tests: `npm run test`
5. Build: `npm run build`
6. Submit pull request

### Development Guidelines
- All new code in TypeScript
- Follow existing code patterns
- Add appropriate comments for complex logic
- Test thoroughly before committing
- Update documentation as needed

### Creating New Applications

To add a new application:
1. Create new file in `src/apps/` (e.g., `MyApp.tsx`)
2. Export default React component
3. Register in `src/apps.tsx`
4. Add app icon and metadata
5. Test the application

## License

MIT License - Free for personal or commercial use.

## Acknowledgments

- Inspired by various web-based operating systems and desktop environments
- Built using modern web technologies and best practices
- Community contributions and feedback welcome

## Statistics

- 150+ applications
- 90+ terminal commands
- 180+ source files
- 50+ keyboard shortcuts

## Use Cases

WebLinuxOS is ideal for:
- Learning desktop environment concepts
- Demonstrating web application capabilities
- Testing web technologies
- Accessing files from any device
- Lightweight online workspace
- Teaching programming and system concepts
- Rapid prototyping desktop-like applications

## Support

If you encounter issues or have suggestions:
- Submit an issue on GitHub
- Review documentation
- Check existing issues and solutions

## Roadmap

Planned future improvements:
- Enhanced mobile responsive design
- Additional applications and features
- Performance improvements
- Multilingual support
- Cloud synchronization
- PWA installation support
- Plugin system architecture
- Real-time collaboration features

## Changelog

### v6.2.0
- Fixed duplicate app IDs in apps registry
- Resolved CSS animation naming conflicts (aurora animation)
- Improved code quality and bug fixes
- Enhanced build configuration for GitHub Pages deployment

### v6.0.0
- Major release with significant improvements
- Enhanced desktop environment features
- New applications and utilities
- Performance optimizations

### v5.3.0
- Added online code runner supporting JavaScript, Python, TypeScript, HTML, Markdown, JSON, SQL, Bash
- Improved README documentation with badges and formatting
- Enhanced desktop visual effects with dynamic wallpapers and particles
- UI/UX improvements with better visual hierarchy and interaction feedback
- Code quality improvements with optimized component structure and type safety

### v5.2.0
- Added color scheme generator with random, analogous, complementary, triadic, monochromatic modes
- Added color lock feature to preserve favorite colors while generating others
- Added color scheme local storage management (save, load, delete)
- One-click color code copying
- Automatic contrast calculation for optimal text display

### v5.1.0
- Design system optimization with CSS variables, gradients, and shadow hierarchy
- Animation enhancements with slideDown, scaleIn, breathe, aurora effects
- Visual effects including glassmorphism, gradient borders, neon text
- Performance optimizations using requestAnimationFrame for window drag and resize
- Improved user experience with better interaction feedback and visual hierarchy

### v5.0.0
- Enhanced smart notes with tags, colors, archive, and import/export
- New smart dashboard with real-time weather, cryptocurrency, and system monitoring
- Improved error handling and user feedback
- Better documentation and developer guides
- Performance optimizations
- Bug fixes and UI improvements

---

Version: 6.2.0 | Last Updated: 2026-06-18