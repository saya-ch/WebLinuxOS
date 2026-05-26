# WebLinuxOS

A comprehensive web-based Linux desktop environment that runs entirely in your browser. No installation required - just open and experience a full-featured operating system in your web browser.

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) | [English Documentation](#overview)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Applications](#applications)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Technology Stack](#technology-stack)
- [API Integrations](#api-integrations)
- [Project Structure](#project-structure)
- [Browser Compatibility](#browser-compatibility)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

WebLinuxOS is a feature-rich web-based Linux desktop environment that provides a realistic window management system, virtual file system, terminal emulator, and a rich ecosystem of **80+ applications**. It runs completely in the browser without requiring any backend services.

### Key Highlights

- **Complete Desktop Experience**: Multi-window management, virtual desktops, taskbar, start menu, and system tray
- **Virtual File System**: Persistent storage with full file operations support
- **Powerful Terminal**: 80+ commands with Python 3 runtime (Pyodide)
- **Rich Application Ecosystem**: 80+ pre-installed applications across development, office, entertainment, and utilities
- **Real API Integrations**: Live weather, IP geolocation, news, cryptocurrency tracking
- **Modern UI/UX**: Dark/Light themes, smooth animations, responsive design
- **Activity Tracking**: Monitor usage patterns and productivity insights

---

## Features

### Desktop Environment

| Feature | Description |
|---------|-------------|
| **Multi Virtual Desktops** | Support for up to 4 virtual desktops with window management |
| **Window Management** | Drag, resize, minimize, maximize, and close windows with smooth animations |
| **Right-click Context Menu** | Quick access to common actions and settings |
| **Dynamic Wallpapers** | Support for static and animated wallpapers |
| **Theme Support** | Dark and light themes with smooth transitions |
| **Global Shortcuts** | Comprehensive keyboard shortcuts for power users |
| **Activity Tracking** | Monitor application usage patterns and productivity |

### Terminal Emulator

The built-in terminal provides a full-featured command-line interface:

- **80+ Built-in Commands**: `ls`, `cd`, `cat`, `mkdir`, `rm`, `cp`, `mv`, `neofetch`, `weather`, etc.
- **Python 3 Runtime**: Based on Pyodide for in-browser Python execution
- **Command History**: Auto-completion and command history with persistence
- **Fun Commands**: `cowsay`, `fortune`, `sl`, `matrix`, `figlet`, `asciiart`
- **Text Processing**: `base64`, `hash`, `calc`, `prime`, `factor`
- **System Monitoring**: `top`, `ps`, `df`, `free`, `ping`, `ifconfig`
- **Custom Aliases**: Define your own command shortcuts

### Applications

#### System Tools
- File Manager, Terminal, System Monitor, Settings
- Disk Analyzer, Task Manager, Process Monitor, Network Monitor
- Firewall, User Manager, Backup Tool, Archive Manager
- System Dashboard, Performance Monitor, Log Viewer
- Power Manager, Bluetooth Manager, Wi-Fi Manager

#### Development Tools
- Code Editor, Code Playground, Code Studio, API Tester
- JSON Formatter, Regex Tester, GitHub Trending
- Code Snippets Manager, Data Visualization, Quick Commands
- Command Reference, Task Automation
- **NEW** Code Diff Viewer for comparing code versions

#### Office Tools
- Text Editor, Markdown Editor, Spreadsheet, Presentation
- Calendar, Todo List, Notes, Mind Map, Sticky Notes Wall
- Kanban Board, Project Manager, Task Dashboard, Activity Tracker
- Dictionary, Translator, Character Map

#### Network Tools
- Web Browser, IP & DNS Lookup, Weather, News Reader
- Cryptocurrency Tracker, Cloud Sync, Email Client, Chat
- Learning Platform, Command Reference

#### Multimedia
- Music Player, Video Player, Paint, Image Viewer
- Music Visualizer, Camera, Sound Recorder, Screen Recorder
- PDF Viewer, Whiteboard
- **NEW** Image Optimizer for compressing and converting images

#### Utilities
- Calculator, Password Manager, Pomodoro Timer, Color Picker
- QR Generator, Unit Converter, Currency Converter, Voice Transcriber
- Magnifier, Font Viewer, System Toolbox
- **NEW** Network Speed Test for measuring connection quality

#### Games
- Snake Game, Tetris, Virtual Pet, Particle System

---

## Quick Start

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

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

# Access at http://localhost:5173
```

### Build and Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

### Docker Deployment

```bash
# Build Docker image
docker build -t weblinuxos .

# Run container
docker run -p 8080:80 weblinuxos

# Access at http://localhost:8080
```

---

## Applications

### Development Workflow

**Code Editor & Studio**
```javascript
// Use the Code Editor for quick editing
// Code Studio for multi-file projects
// Code Playground for testing snippets
```

**API Testing**
```bash
# Test REST APIs directly in the browser
# Support for GET, POST, PUT, DELETE
# Custom headers and request body
```

**Code Diff Viewer**
Compare code versions side-by-side with syntax highlighting and line-by-line diff visualization.

### Office Productivity

**Document Editing**
- Rich text editing with Markdown support
- Spreadsheet with formulas and charts
- Presentation mode with export options

**Project Management**
- Kanban boards for task tracking
- Mind maps for brainstorming
- Sticky notes wall for quick notes

### Utilities

**Image Optimizer**
- Compress images in multiple formats (JPEG, PNG, WebP)
- Adjust quality and resolution
- Batch processing support

**Network Speed Test**
- Measure download and upload speeds
- Latency testing
- Historical data tracking

---

## Keyboard Shortcuts

### Application Shortcuts

| Shortcut | Action |
|----------|--------|
| `Super + T` | Open Terminal |
| `Super + E` | Open File Manager |
| `Super + B` | Open Browser |
| `Super + ,` | Open Settings |
| `Super + K` | Smart Search |
| `Super + Shift + L` | Open Launcher |
| `Super + A` | Calculator |
| `Super + P` | Paint |
| `Super + G` | Code Editor |
| `Super + 1-9` | Quick access to pinned apps |

### Window Management

| Shortcut | Action |
|----------|--------|
| `Alt + Tab` | Cycle Windows |
| `Alt + Shift + Tab` | Cycle Windows (Reverse) |
| `Ctrl + W` | Close Window |
| `Ctrl + M` | Minimize Window |
| `F11` | Toggle Fullscreen |
| `PrintScreen` | Screenshot Tool |

### Virtual Desktop

| Shortcut | Action |
|----------|--------|
| `Ctrl + Alt + 1-4` | Switch to Desktop |
| `Ctrl + Alt + Left/Right` | Previous/Next Desktop |
| `Ctrl + Shift + Alt + 1-4` | Move Window to Desktop |
| `Ctrl + Shift + Alt + Arrow` | Move Window to Adjacent Desktop |

### Terminal

| Shortcut | Action |
|----------|--------|
| `Up/Down` | Command history |
| `Tab` | Auto-complete |
| `Ctrl + L` | Clear screen |
| `Ctrl + C` | Cancel current command |

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI component framework |
| TypeScript | 6.x | Type-safe development |
| Zustand | 5.x | Lightweight state management |
| Vite | 8.x | Fast build tool |
| Pyodide | 0.26.x | In-browser Python runtime |
| Lucide React | 1.16.x | Icon library |

### Additional Libraries

- **terser**: JavaScript minification
- **eslint**: Code linting
- **prettier**: Code formatting

---

## API Integrations

WebLinuxOS integrates the following public APIs for real-time data:

| API | Purpose | Rate Limits |
|-----|---------|-------------|
| **Open-Meteo** | Weather data and forecasts | No API key required |
| **ipapi.co** | IP geolocation services | Limited requests |
| **Cloudflare DNS** | DNS lookup | No restrictions |
| **GitHub API** | Trending repositories | Requires token for higher limits |
| **NewsAPI** | News data and headlines | Limited free tier |

### API Usage Examples

**Weather Data**
```javascript
const weather = await fetch(
  `https://api.open-meteo.com/v1/forecast?latitude=39.9&longitude=116.4&current=temperature_2m`
)
```

**IP Geolocation**
```javascript
const ipInfo = await fetch('https://ipapi.co/json/')
```

---

## Project Structure

```
web-linux/
├── src/
│   ├── apps/                 # Application components (80+ apps)
│   │   ├── FileManager.tsx   # Virtual file system UI
│   │   ├── Terminal.tsx       # Command-line interface
│   │   ├── Calculator.tsx     # Basic calculations
│   │   ├── CodeEditor.tsx     # Code editing
│   │   ├── CodeDiffViewer.tsx # Code comparison
│   │   ├── ImageOptimizer.tsx # Image compression
│   │   ├── NetworkSpeedTest.tsx # Speed testing
│   │   └── ...                # 80+ more applications
│   ├── components/
│   │   └── desktop/          # Desktop environment
│   │       ├── Desktop.tsx    # Main desktop component
│   │       ├── Window.tsx     # Window management
│   │       ├── WindowManager.tsx # Window state management
│   │       ├── Taskbar.tsx    # Bottom taskbar
│   │       └── StartMenu.tsx  # Application launcher
│   ├── store.tsx              # Zustand global state
│   ├── apps.tsx               # Application registry
│   ├── types.ts               # TypeScript definitions
│   ├── icons.tsx              # Custom SVG icons
│   └── index.css              # Global styles & themes
├── public/                    # Static assets
├── package.json               # Project configuration
├── vite.config.ts            # Build configuration
└── tsconfig.json             # TypeScript configuration
```

### Key Files

- **store.tsx**: Centralized state management for windows, files, theme, etc.
- **apps.tsx**: Registry of all available applications
- **types.ts**: TypeScript interfaces and type definitions
- **Desktop.tsx**: Main desktop rendering logic

---

## Browser Compatibility

| Browser | Minimum Version | Status |
|---------|----------------|--------|
| Chrome/Chromium | 90+ | Fully Supported |
| Firefox | 88+ | Fully Supported |
| Safari | 14+ | Fully Supported |
| Edge | 90+ | Fully Supported |
| Opera | 76+ | Fully Supported |

### Mobile Support

- iOS Safari 14+
- Chrome for Android 90+
- Responsive design for tablets

### Required Features

- ES6+ JavaScript
- CSS Grid and Flexbox
- Web Storage (localStorage)
- Canvas API (for Paint and other apps)
- MediaDevices API (for Camera)

---

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

### Development Workflow

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/WebLinuxOS.git
   cd WebLinuxOS/web-linux
   ```

2. **Create your feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Make your changes**
   - Follow existing code conventions
   - Add tests if applicable
   - Update documentation

5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```

6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```

7. **Open a Pull Request**

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add comments for complex logic

### Reporting Issues

Please include:
- Browser and version
- Operating system
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## Performance Tips

1. **Close unused windows** to free memory
2. **Use virtual desktops** to organize workflows
3. **Enable hardware acceleration** in browser settings
4. **Clear clipboard history** periodically
5. **Use the Terminal** for batch file operations

---

## Security Considerations

- All data stored in browser localStorage
- No server-side execution
- Clipboard access requires user permission
- Camera/microphone access requires HTTPS
- No tracking or analytics

---

## License

MIT License - feel free to use this project for personal or commercial purposes.

Copyright (c) 2024 WebLinuxOS Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## Acknowledgments

- Inspired by modern Linux desktop environments (GNOME, KDE)
- Built with modern web technologies
- Special thanks to all contributors and the open-source community
- Weather data provided by [Open-Meteo](https://open-meteo.com/)
- Icons from [Lucide](https://lucide.dev/)

---

## Version History

### v3.7.0 (Current)
- Added Code Diff Viewer application
- Added Image Optimizer with multiple format support
- Added Network Speed Test tool
- Improved Weather app with Lucide icons
- Enhanced terminal performance
- Fixed various bugs and improved stability

### v3.6.0
- Added 10+ new applications
- Improved dark mode contrast
- Enhanced mobile responsiveness
- Added more keyboard shortcuts
- Performance optimizations

### v3.5.0
- Initial major release
- 80+ applications
- Multi-window management
- Virtual file system
- Terminal emulator with Python support

---

## Support

For questions, issues, or feature requests:
- [GitHub Issues](https://github.com/saya-ch/WebLinuxOS/issues)
- [GitHub Discussions](https://github.com/saya-ch/WebLinuxOS/discussions)

---

**Version**: 3.7.0 | **Last Updated**: 2026-05-26 | **Build**: Production-ready
