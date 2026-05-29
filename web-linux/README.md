# WebLinuxOS

A fully functional web-based Linux desktop environment that runs entirely in the browser. Built with React, TypeScript, and modern web technologies, it provides a complete desktop experience without any installation required.

## Live Demo

Visit the live demo at: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Overview

WebLinuxOS brings the power of a Linux desktop to your browser. It features a modern, responsive interface with multi-window management, virtual desktops, and over 120 applications - all running client-side with no backend dependencies.

## Key Features

### Desktop Environment

- **Multi Virtual Desktops**: Create and switch between multiple workspaces with customizable wallpapers
- **Advanced Window Management**: Drag, resize, minimize, maximize, and close windows with smooth animations
- **Smart Launcher**: Application launcher with fuzzy search and categorized app listing
- **System Tray**: Quick access to network, volume, battery, and notification indicators
- **Global Search**: Fast app launcher and file search powered by fuzzy matching
- **Command Palette**: Keyboard-driven command execution for power users
- **Context Menus**: Right-click menus with file operations and quick actions
- **Dynamic Wallpapers**: Animated particle effects and interactive backgrounds

### Applications

The system includes 120+ pre-installed applications across multiple categories:

**System Tools**
- Terminal emulator with 90+ built-in commands
- File Manager with tree navigation and file operations
- System Monitor displaying resource usage in real-time
- Task Manager and Process Monitor
- Network Monitor and Disk Analyzer
- Backup Tool and Archive Manager

**Development Tools**
- **API Tester**: Full-featured REST API testing with request builder, headers editor, and response viewer
- **Smart Notes**: Note-taking app with Markdown support, categories, tags, and export functionality
- Code Editor with syntax highlighting
- JSON Formatter and Validator
- Regex Builder with real-time testing
- GitHub Trending repository viewer
- Command Reference documentation
- Task Automation workflow builder

**Office & Productivity**
- Text Editor with formatting options
- Markdown Editor with live preview
- Spreadsheet application
- Calendar with event management
- Todo List and Kanban Board
- Project Planner with timeline views
- Notes and Mind Map tools
- Presentation creator

**Utilities**
- Calculator with scientific functions
- Password Manager with encryption
- Pomodoro Timer for productivity
- Color Picker with palette generation
- QR Code Generator
- Unit and Currency Converter
- Online Toolkit (JSON, Base64, URL encoding/decoding, hash calculation)

**Multimedia**
- Music Player with playlist support
- Video Player with controls
- Paint application with drawing tools
- Image Viewer with zoom
- Camera and Screen Recorder
- Sound Recorder

**Entertainment**
- Weather application with forecasts
- World Clock with multiple time zones
- Classic games (Snake, Tetris)
- Virtual Pet companion

### Terminal Features

- 90+ built-in shell commands
- Python 3 runtime via Pyodide
- Command history and auto-completion
- File system navigation and operations
- System information commands
- Calculator and utility functions
- API integration commands (weather, crypto, etc.)

### Web Services Integration

The application integrates with multiple public APIs:

- **Open-Meteo**: Real-time weather data
- **CoinGecko**: Cryptocurrency prices
- **GitHub API**: Repository information
- **HTTPBin**: API testing endpoints
- **JSONPlaceholder**: Mock REST API
- **Dog CEO API**: Random dog images
- **ipapi.co**: IP geolocation

## Quick Start

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to the project directory
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

## Technology Stack

- **React 19** - UI component framework
- **TypeScript 6** - Type-safe development
- **Zustand 5** - Lightweight state management
- **Vite 8** - Fast build tool
- **Pyodide** - Python runtime in browser
- **Lucide React** - Icon library
- **Marked** - Markdown parsing

## Keyboard Shortcuts

### System
| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+K | Open global search |
| Ctrl+P | Command palette |
| Alt+Tab | Cycle windows |
| F11 | Toggle fullscreen |
| PrintScreen | Screenshot |
| Ctrl+Q | Close window |
| Ctrl+M | Minimize window |

### Application Launch
| Shortcut | Application |
|----------|-------------|
| Super+T | Terminal |
| Super+E | File Manager |
| Super+, | Settings |
| Super+B | Browser |
| Super+A | Calculator |

### Virtual Desktops
| Shortcut | Action |
|----------|--------|
| Ctrl+Alt+[1-9] | Switch to desktop |
| Ctrl+Alt+Arrow Left/Right | Switch workspace |

## Project Structure

```
web-linux/
├── src/
│   ├── apps/           # Application components (120+ apps)
│   │   ├── Terminal.tsx
│   │   ├── FileManager.tsx
│   │   ├── ApiTester.tsx      # Enhanced API testing tool
│   │   ├── SmartNotes.tsx     # Markdown notes with categories
│   │   └── ... (120+ more)
│   ├── components/     # Desktop UI components
│   │   ├── desktop/
│   │   │   ├── Desktop.tsx
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── StartMenu.tsx
│   │   ├── CommandPalette.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── NotificationSystem.tsx
│   ├── store.tsx       # Zustand state management
│   ├── apps.tsx        # Application registry
│   ├── icons.tsx       # Icon definitions
│   └── types.ts        # TypeScript type definitions
├── public/             # Static assets
├── index.html          # Entry HTML
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## Performance Optimizations

WebLinuxOS includes several performance optimizations:

- **Code Splitting**: Applications are split into separate chunks
- **Lazy Loading**: Components load on demand
- **GPU Acceleration**: CSS animations leverage hardware acceleration
- **Memoization**: React memo prevents unnecessary re-renders
- **Content Visibility**: Optimized rendering for long lists
- **Tree Shaking**: Unused code is eliminated during build

## Browser Compatibility

- Chrome 90+ (Recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

## Security

- Input sanitization for all user inputs
- Safe expression evaluation in terminal calculator
- Local storage encryption for sensitive data
- No external API keys exposed in client code
- CSP headers for XSS protection

## Notable Applications

### API Tester
A powerful REST API testing tool featuring:
- Support for GET, POST, PUT, PATCH, DELETE methods
- Custom headers editor with enable/disable toggles
- Query parameters builder
- Request body editor with JSON formatting
- Response viewer with syntax highlighting
- Request history tracking
- Pre-built API templates for common services

### Smart Notes
A feature-rich note-taking application:
- Markdown editing with live preview
- Category-based organization
- Tag system for quick filtering
- Full-text search across all notes
- Pin important notes
- Export notes as Markdown files
- Local storage persistence

### Terminal
A fully-featured terminal emulator:
- 90+ built-in commands
- Python 3 runtime via Pyodide
- Command history with persistence
- Alias system
- Auto-completion for commands and files
- ANSI color support
- Real-time API integration

## Contributing

Contributions are welcome. Please ensure:

1. Code follows the existing style conventions
2. All TypeScript types are properly defined
3. Components use React.memo for performance
4. State management follows Zustand patterns
5. UI follows the design system variables

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Pyodide for enabling Python in the browser
- Lucide for beautiful icons
- All open source libraries used in this project
- The React, TypeScript, and Vite teams

---

Built with React, TypeScript, and modern web technologies
