WebLinuxOS
==========

A fully functional Linux-style desktop environment running entirely in the browser.

![WebLinuxOS Desktop](web-linux/screenshots/06-final-desktop.png)

**[Live Demo](https://saya-ch.github.io/WebLinuxOS/)**

---

About
-----

WebLinuxOS brings a complete Linux desktop experience to your browser. It features a windowed desktop environment with multi-workspace support, a virtual file system, and a powerful terminal with over 150 commands. The project combines the familiarity of Linux with the accessibility of web technology, creating a platform that is both functional and extensible.

Features
--------

### Desktop Environment

- Window management with drag, resize, minimize, maximize, and snap-to-edge capabilities
- Multi-workspace system supporting up to 9 virtual desktops with keyboard navigation
- Global search across applications, files, and commands
- Dark/light theme system with smooth transitions
- Desktop widgets including clock, weather, system monitor, and focus timer
- Virtual file system with full CRUD operations and localStorage persistence

### Terminal

- Over 150 commands covering system operations, file management, and API integrations
- Command history and auto-completion
- ANSI color support
- Built-in development tools (JSON formatter, regex tester, base64 encoder)
- Real-time API commands (weather, cryptocurrency, news, translation)

### Built-in Applications

Development tools: Terminal, Code Editor, Code Runner, JSON Formatter, Regex Tester, JWT Decoder, Hash Generator, API Tester
Productivity: File Manager, Text Editor, Notes, Calendar, Calculator, Date Calculator, Todo List, Pomodoro, Clipboard Manager
Utilities: Weather, System Monitor, Password Manager, QR Generator, Unit Converter, Currency Converter, URL Tools, Base64 Tools
Multimedia: Music Player, Video Player, Image Viewer, Paint
Data: Cryptocurrency Tracker, News Reader, GitHub Explorer, Live Dashboard

### Real-time API Integration

- Weather forecasts from Open-Meteo
- Cryptocurrency prices from CoinGecko
- Exchange rates from open.er-api.com
- Hacker News stories
- GitHub repository information
- Multi-language translation via MyMemory
- ISS tracking from wheretheiss.at

Getting Started
---------------

### Quick Start

Visit the [live demo](https://saya-ch.github.io/WebLinuxOS/) to start using WebLinuxOS immediately.

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl + K | Global search |
| Ctrl + T | Open terminal |
| Ctrl + E | Open file manager |
| Ctrl + B | Open browser |
| Ctrl + Q | Close window |
| Ctrl + M | Minimize window |
| Alt + Tab | Cycle windows |
| Ctrl + Alt + 1-9 | Switch workspace |
| F11 | Fullscreen |

### Local Development

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

Open http://localhost:5173/WebLinuxOS/ in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

Terminal Commands
-----------------

Here are some of the available terminal commands:

```bash
# System
whoami          # Display current user
hostname        # Display system hostname
uname -a        # Display system details
date            # Display current date and time
uptime          # Display system uptime
top             # Display process list
clear           # Clear terminal screen

# File Operations
ls              # List directory contents
cd <path>       # Change directory
pwd             # Print working directory
cat <file>      # Display file contents
touch <file>    # Create empty file
mkdir <dir>     # Create directory
rm <path>       # Remove file or directory
cp <src> <dest> # Copy files
mv <src> <dest> # Move files

# Network & APIs
weather [city]          # Get real-time weather
crypto                  # Cryptocurrency prices
news                    # Top technology stories
translate <lang> <text> # Translate text
github <repo>           # GitHub repository info
ipinfo                  # IP information

# Development Tools
json                    # JSON formatter
base64                  # Base64 encode/decode
hash                    # Generate SHA hashes
uuid                    # Generate UUIDs
regex                   # Test regular expressions
jwt                     # JWT decoder
calc <expression>       # Calculator

# Help
help                    # View complete command list
man <command>           # Command manual
```

Tech Stack
----------

- React 19 - UI framework
- TypeScript - Type safety
- Vite 8 - Build tool
- Zustand 5 - State management
- Lucide React - Icons
- Marked - Markdown parsing
- Pyodide - Python runtime (optional)

Project Structure
-----------------

```
web-linux/
├── src/
│   ├── apps/              # Application components
│   │   ├── terminal/      # Terminal command system
│   │   └── ...            # Individual app components
│   ├── components/
│   │   ├── desktop/       # Core desktop components
│   │   │   ├── Window.tsx
│   │   │   ├── WindowManager.tsx
│   │   │   ├── Desktop.tsx
│   │   │   ├── Taskbar.tsx
│   │   │   └── StartMenu.tsx
│   │   └── ...
│   ├── store.tsx          # Zustand global state
│   ├── apps.tsx           # Application registry
│   ├── App.tsx            # Application entry
│   └── utils/
│       └── apiCache.ts    # API caching utilities
├── public/                # Static assets
├── index.html
├── vite.config.ts
└── package.json
```

Design Principles
-----------------

1. Performance First: Component lazy loading, code splitting, and efficient rendering
2. Data Privacy: Most tools operate locally with zero network requests
3. Persistence: User data persists across sessions via localStorage
4. Extensible: Easy to add new applications and terminal commands
5. Themeable: CSS variable-driven theming for dark/light modes
6. Accessibility: Keyboard navigation and screen reader support

Browser Support
---------------

- Chrome 110+
- Firefox 115+
- Safari 16+
- Edge 110+

Contributing
------------

Contributions are welcome. Follow these steps:

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

License
-------

This project is licensed under the MIT License.

Acknowledgements
----------------

Thanks to the following open source projects and services:

- React, TypeScript, Vite, Zustand
- Lucide Icons, Marked
- Open-Meteo, CoinGecko, Hacker News API, GitHub API
- wheretheiss.at, open.er-api.com, MyMemory

Changelog
---------

### v34.0.0

- Enhanced System Monitor with real-time browser performance API integration
- Added toggle between real and simulated data modes
- Improved chart visualization with SVG-based graphs and gradient fills
- Enhanced hover effects and animations throughout the UI
- Code quality improvements with useMemo and useCallback optimizations
- Fixed potential memory leaks with proper cleanup in useEffect hooks
- Updated README with improved structure and documentation
- Enhanced terminal with better ANSI color support
- Improved window management with smoother animations
- Added Date Calculator application

### v33.1.0

- Enhanced terminal API commands: Added news, currency, crypto, translate, timezone, ipinfo, qr, password, uuid, timestamp commands
- News API integration with multiple categories
- Currency exchange API with real-time rates
- Cryptocurrency tracking from CoinGecko
- Multi-language translation via MyMemory API
- Timezone lookup with WorldTimeAPI
- IP information from ipapi.co
- QR code generation via qrserver.com
- Password and UUID generation utilities
- Timestamp converter

### v32.1.0

- Enhanced Web Browser with page zoom and favicon display
- Fixed icon import issues with unified management
- Optimized file system utilities with improved caching
- Improved terminal command system
- Enhanced system monitoring interface
- Code quality improvements with TypeScript fixes

### v31.0.0

- Added intelligent developer workbench
- Code template library with search and filtering
- API Mock service with visual simulator
- Knowledge graph with connection visualization
- Intelligent code analysis with quality metrics
- Cyberpunk tech-style UI design
- Responsive layout optimization
