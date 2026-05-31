# WebLinuxOS

A fully functional web-based Linux desktop environment that runs entirely in the browser. No backend required - everything runs client-side.

## Live Demo

Visit the live demo at: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Overview

WebLinuxOS brings the power of a Linux desktop experience to your browser. It features a modern, responsive interface with multi-window management, virtual desktops, and 120+ applications - all running entirely client-side with no backend dependencies.

This project demonstrates what's possible with modern web technologies, combining the familiarity of a traditional desktop environment with the accessibility of web applications.

## Key Features

### Desktop Environment

- **Multi Virtual Desktops**: Switch between multiple workspaces with customizable wallpapers
- **Advanced Window Management**: Smooth animations for opening, closing, minimizing, and maximizing windows
- **Smart Launcher**: Fuzzy search and categorized application listing
- **System Tray**: Network, volume, and battery indicators with quick controls
- **Global Search**: Search across all applications and files
- **Command Palette**: Quick access to system commands
- **Context Menus**: Right-click menus for files and desktop
- **Live Wallpapers**: Dynamic wallpaper effects with particles and interactive elements
- **Boot Splash**: Elegant startup animation

### Development Tools

- **Code Editor**: Syntax highlighting for multiple languages with code editing capabilities
- **API Tester**: Test REST APIs with built-in client supporting various HTTP methods
- **JSON Formatter**: Pretty-print, validate and format JSON data
- **Regex Builder**: Interactive regex testing and building tools
- **GitHub Trending**: View trending repositories directly in the OS
- **Python REPL**: Full Python 3 runtime via Pyodide - run Python code in browser
- **90+ Terminal Commands**: File operations, system monitoring, network tools, and utilities
- **Code Snippets Manager**: Save and organize code snippets for quick access
- **Component Sandbox**: Test and preview React components

### Office & Productivity

- **Text/Markdown Editors**: Rich text editing with live preview
- **Spreadsheet**: Basic spreadsheet functionality for data entry
- **Calendar**: Date and event management with calendar views
- **Todo List**: Task management with completion tracking
- **Kanban Board**: Visual task organization with drag-and-drop
- **Project Planner**: Timeline and milestone tracking
- **Notes**: Smart notes with tags, colors, archiving, and import/export
- **Mind Map**: Idea visualization with node-based editing
- **Presentation Creator**: Slide-based presentations
- **Flashcards**: Study and memorization tool
- **Habit Tracker**: Track daily habits and progress
- **Smart Dashboard**: Real-time data dashboard with weather, crypto, and system stats

### Utilities

- **Calculator**: Scientific calculator with advanced functions and history
- **Password Manager**: Secure password storage with encryption
- **Pomodoro Timer**: Productivity timer with customizable sessions
- **Color Picker**: Color selection with various formats and copy-to-clipboard
- **QR Generator**: Create QR codes for text, URLs, and contacts
- **Unit Converter**: Convert between units of measurement
- **Real-time Translator**: Multi-language translation
- **Online Toolkit**: JSON parsing, Base64 encoding, URL encoding
- **Clipboard Manager**: Advanced clipboard history and management
- **Screenshot Tool**: Capture screenshots of the desktop
- **Screen Recorder**: Record screen activity as video

### Multimedia

- **Music Player**: Audio playback with playlist support
- **Video Player**: Video playback with controls
- **Paint**: Basic drawing application with tools
- **Image Viewer**: View and zoom images
- **Camera**: Access webcam for video capture
- **Sound Recorder**: Audio recording with playback
- **Music Visualizer**: Audio visualization effects

### Entertainment

- **Weather App**: Current weather and forecasts with location-based data
- **World Clock**: Multiple time zones display
- **News Reader**: Latest news updates
- **Games**: Snake, Tetris, and other classic games
- **Virtual Pet**: Interactive pet simulation
- **Particle System**: Visual effects demonstration

## Terminal Commands

The terminal supports over 90 commands, including:

### File Operations
- `ls`, `cd`, `pwd`, `cat`, `mkdir`, `touch`, `rm`, `cp`, `mv`, `tree`, `wc`, `du`

### System Info
- `whoami`, `hostname`, `date`, `uname`, `uptime`, `cal`, `free`, `df`, `ps`, `top`, `sysinfo`

### Network Tools
- `ping`, `ifconfig`, `curl`, `host`, `nslookup`, `dig`, `traceroute`, `nmap`

### System Monitoring
- `vmstat`, `iostat`, `netstat`, `ss`, `lsof`, `htop`, `btop`

### Utilities
- `echo`, `find`, `grep`, `env`, `export`, `which`, `file`

### Productivity
- `translate`, `news`, `worldtime`, `todo`

### Encryption & Security
- `base64`, `hash`, `openssl`, `ssh-keygen`

### Math Tools
- `calc`, `bc`, `expr`, `seq`

### Fun Commands
- `cowsay`, `fortune`, `joke`, `advice`, `flip`, `rps`

## Quick Start

```bash
# Clone repository
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+K | Global search |
| Ctrl+P | Command palette |
| Alt+Tab | Cycle windows |
| Ctrl+Q | Close window |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+Shift+C | Terminal interrupt |
| Ctrl+1-9 | Switch to desktop |
| Ctrl+Alt+Arrow | Switch desktop |
| Ctrl+Shift+1-9 | Move window to desktop |

## Technology Stack

- **React 19**: UI framework with latest features
- **TypeScript 6**: Type-safe development
- **Zustand 5**: Lightweight state management
- **Vite 8**: Fast build tool with optimized bundling
- **Pyodide**: Python runtime running entirely in the browser
- **Lucide React**: Beautiful icon library
- **Tailwind CSS**: Utility-first styling
- **IndexedDB**: Local storage for persistent data

## Architecture

WebLinuxOS follows a modular architecture:

```
src/
  apps/              # Individual applications
  components/
    desktop/         # Desktop environment components
  store/            # State management utilities
  types.ts           # TypeScript type definitions
  icons.tsx          # Icon components
  App.tsx           # Main application component
```

### Key Components

- **Desktop**: Main workspace with icons and wallpaper
- **WindowManager**: Handles window positioning and z-index
- **Taskbar**: System tray and window list
- **StartMenu**: Application launcher with categories
- **CommandPalette**: Quick command execution
- **GlobalSearch**: Cross-application search

### State Management

The application uses Zustand for state management with:
- Window state tracking
- File system management
- Desktop configuration
- Theme and wallpaper settings
- User preferences

## Performance

WebLinuxOS is optimized for performance:

- **Code Splitting**: Each application is loaded on-demand
- **Lazy Loading**: Applications load only when opened
- **Memoization**: React components use memo for optimization
- **Efficient Rendering**: Virtual lists and optimized updates
- **Caching**: localStorage for persistent data

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Note: Some features may require modern browser capabilities.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm run test`
5. Build: `npm run build`
6. Submit a pull request

### Development Guidelines

- Use TypeScript for all new code
- Follow existing code patterns
- Add appropriate comments for complex logic
- Test thoroughly before submitting
- Update documentation as needed

### Creating New Applications

To add a new application:

1. Create a new file in `src/apps/` (e.g., `MyApp.tsx`)
2. Export a default React component
3. Register the app in `src/apps.tsx`
4. Add app icon and metadata
5. Test the application

Example:

```typescript
import { memo } from 'react'

export default memo(function MyApp() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>My Application</h1>
      <p>Welcome to my new app!</p>
    </div>
  )
})
```

## License

MIT License - feel free to use this project for personal or commercial purposes.

## Acknowledgments

- Inspired by various web-based operating systems and desktop environments
- Built with modern web technologies and best practices
- Community contributions and feedback are welcome
- Special thanks to all contributors

## Statistics

- **120+ Applications**: Rich set of built-in applications
- **90+ Terminal Commands**: Comprehensive command-line interface
- **150+ Source Files**: Modular and maintainable codebase
- **50+ Keyboard Shortcuts**: Efficient workflow

## Use Cases

WebLinuxOS is perfect for:

- **Learning**: Explore desktop environment concepts
- **Demos**: Showcase web application capabilities
- **Development**: Test web technologies
- **Accessibility**: Access your files from any device
- **Productivity**: Lightweight online workspace
- **Education**: Teach programming and system concepts
- **Prototyping**: Rapidly prototype desktop-like applications

## Support

If you encounter any issues or have suggestions:

- Open an issue on GitHub
- Check the documentation
- Review existing issues and solutions

## Roadmap

Future improvements planned:

- Enhanced mobile responsiveness
- More applications and features
- Improved performance
- Additional language support
- Cloud synchronization
- PWA installation support
- Plugin system architecture
- Real-time collaboration features

## Changelog

### v5.0.0 (2026-05-31)
- Enhanced Smart Notes with tags, colors, archiving, and import/export
- New Smart Dashboard with real-time weather, crypto, and system monitoring
- Improved error handling and user feedback
- Better documentation and developer guide
- Performance optimizations
- Bug fixes and UI improvements

### v4.9.1 (Previous)
- 120+ applications
- Enhanced terminal with 90+ commands
- Improved window management
- New development tools
- Better multimedia support

---

**Version**: 5.0.0
**Last Updated**: 2026-05-31
