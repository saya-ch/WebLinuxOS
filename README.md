# WebLinuxOS

A complete web-based Linux operating system simulator built with React and TypeScript, delivering a genuine desktop experience and a rich ecosystem of applications.

## Features

### Desktop Environment
- **Window Management**: Full window system with drag, resize, minimize, maximize, and close operations
- **Taskbar**: Quick launch, window switching, system tray, and clock display
- **Start Menu**: Application categorization, search functionality, and quick access
- **Multi-theme Support**: Light/dark themes with multiple wallpaper options
- **Keyboard Shortcuts**: Global shortcut support for efficient navigation

### Applications (200+)

**System Tools**
- File Manager: Complete file tree browsing, search, drag-and-drop upload, batch operations
- Terminal: Real terminal simulation with 50+ commands including file operations, system info, and network tools
- System Monitor: Real-time CPU, memory, and network monitoring
- Code Editor: Syntax highlighting, Python/JS code execution, multi-tab support

**Development Tools**
- REST Client: Complete API testing tool
- JSON/YAML formatting and conversion
- Regular expression tester and builder
- Base64/URL encoding/decoding tools
- JWT decoder and validator
- Hash generator (MD5, SHA-1, SHA-256, SHA-512)
- Cron expression generator
- API Explorer: Browse and test 11 free public APIs

**Utilities**
- Calculator: Scientific calculation, currency conversion, base conversion
- Weather: Real-time weather data (Open-Meteo API), 7-day forecast, temperature trend chart
- Pomodoro: Focus work timer
- Password generator and strength analyzer
- QR code generator
- Color picker and palette generator
- Unit converter
- World clock

**Office**
- Markdown editor and previewer
- Notes application with tags, search, and star functionality
- Todo list and task board
- Calendar
- Mind map
- Whiteboard for drawing and collaboration

**Multimedia**
- Image viewer and optimizer
- Music player with visualization
- Video player
- Screenshot tool
- Screen recorder

**Network & Information**
- Web browser with built-in browsing
- News reader with RSS support
- GitHub trending and profile viewer
- Hacker News reader
- Translator
- Wikipedia reader

**Games**
- Snake, Tetris, 2048, Memory Match, Breakout

**AI Features**
- AI chat assistant integration
- Intelligent code generator
- AI prompt library

### Technical Highlights

- **Real File System Simulation**: Complete file tree structure with create, delete, copy, move, and rename operations
- **Terminal Command System**: 50+ commands including `ls`, `cd`, `cat`, `grep`, `mkdir`, `rm`, `curl`, `weather`, `news`, and more
- **Real-time API Integration**: Weather data, exchange rates, news subscription
- **Python Code Execution**: Integrated Pyodide for running Python in the browser
- **Local Storage Persistence**: Application state, file contents, and user settings automatically saved

## Quick Start

### Online Experience

Visit [GitHub Pages](https://saya-ch.github.io/WebLinuxOS/) to experience immediately.

### Local Development

```bash
# Clone the repository
git clone https://github.com/saya-ch/WebLinuxOS.git

# Navigate to project directory
cd WebLinuxOS/web-linux

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build and Deploy

```bash
# Build production version
npm run build

# Preview build result
npm run preview
```

## Project Structure

```
WebLinuxOS/
├── web-linux/                 # Main application directory
│   ├── src/
│   │   ├── apps/              # Application components (200+)
│   │   ├── components/        # Desktop components
│   │   │   ├── desktop/       # Desktop, window management, taskbar
│   │   │   └── system/        # System components
│   │   ├── store/             # Zustand state management
│   │   ├── types/             # TypeScript type definitions
│   │   ├── apps.tsx           # Application registry
│   │   ├── App.tsx            # Main application entry
│   │   └── icons.tsx          # Icon components
│   ├── public/                # Static assets
│   └── package.json           # Project configuration
└── .github/workflows/         # GitHub Actions workflows
    └── deploy.yml             # GitHub Pages deployment workflow
```

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **State Management**: Zustand
- **Styling**: CSS-in-JS (inline styles)
- **Build Tool**: Vite
- **Code Execution**: Pyodide (Python in Browser)
- **API Integration**: Open-Meteo (weather), Open Exchange Rates (currency)

## Terminal Command Reference

### File Operations
| Command | Description |
|---------|-------------|
| `ls` | List directory contents |
| `cd` | Change directory |
| `pwd` | Print working directory |
| `cat` | View file contents |
| `mkdir` | Create directory |
| `touch` | Create file |
| `rm` | Remove file |
| `cp` | Copy file |
| `mv` | Move file |
| `tree` | Show directory tree |

### System Information
| Command | Description |
|---------|-------------|
| `whoami` | Display username |
| `hostname` | Display hostname |
| `date` | Display date and time |
| `uptime` | Display system uptime |
| `neofetch` | System information display |
| `ps` | Process list |
| `top` | System monitoring |

### Network Tools
| Command | Description |
|---------|-------------|
| `weather [city]` | Get weather information |
| `news` | Get news headlines |
| `crypto` | Cryptocurrency prices |
| `ipinfo` | IP address information |
| `translate <text>` | Translate text |

### Utilities
| Command | Description |
|---------|-------------|
| `calc <expression>` | Calculator |
| `base64 <text>` | Base64 encoding |
| `hash <text>` | Generate hash |
| `uuid` | Generate UUID |
| `password` | Generate password |

### Fun Commands
| Command | Description |
|---------|-------------|
| `cowsay <text>` | ASCII art cow |
| `fortune` | Random quote |
| `matrix` | Matrix effect |
| `joke` | Random joke |

## Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `Ctrl + Shift + L` | Toggle application launcher |
| `Ctrl + Shift + S` | Open settings |
| `Ctrl + Shift + F` | Open file manager |
| `Ctrl + Shift + T` | Open terminal |
| `Ctrl + N` | New terminal window |
| `Ctrl + W` | Close current window |
| `Ctrl + M` | Minimize window |
| `F11` | Fullscreen/toggle |

## Development Roadmap

- [ ] More public API integrations
- [ ] Real-time collaboration features
- [ ] More game applications
- [ ] Enhanced AI functionality
- [ ] Mobile adaptation optimization

## Contributing

Contributions are welcome. Please submit issues and pull requests. Ensure:

1. Code follows project style guidelines
2. New applications must be registered in `apps.tsx`
3. Component files placed in `src/apps/` directory

## License

MIT License

## Acknowledgments

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Zustand](https://github.com/pmndrs/zustand)
- [Pyodide](https://pyodide.org/)
- [Open-Meteo](https://open-meteo.com/)
- [Lucide Icons](https://lucide.dev/)