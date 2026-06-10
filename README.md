# WebLinuxOS

[English](README.md) | [中文](README_CN.md)

A fully functional web-based Linux desktop environment running entirely in the browser. No backend required - all features run client-side.

## Live Demo

Visit the live demo: [https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)

## Overview

WebLinuxOS brings the Linux desktop experience to your browser. It features a modern responsive interface with multi-window management, virtual desktops, and 120+ applications - all running entirely client-side without backend dependencies.

This project demonstrates the possibilities of modern web technologies, combining the familiarity of traditional desktop environments with the accessibility of web applications.

## Innovation Highlights

### Real-World Utility
Unlike traditional OS simulations, WebLinuxOS is designed for practical everyday use:

- **Cloud-Native Development**: Write, test, and debug code directly in the browser with full Python support
- **Productivity Suite**: Complete office tools including spreadsheets, presentations, and document editing
- **System Administration**: Familiar terminal with 90+ commands for practicing Linux skills
- **Data Management**: Advanced file management with virtual filesystem, search, and organization tools
- **Learning Platform**: Interactive tutorials, flashcards, and habit tracking for personal growth

### Advanced Features
- **Persistent Storage**: All your files, settings, and data are saved locally using IndexedDB
- **Offline-First**: Works completely offline after initial load - no internet required
- **Multi-Window Productivity**: Open multiple applications simultaneously with advanced window management
- **Virtual Workspaces**: Organize your work across multiple virtual desktops
- **Privacy-Focused**: All data stays in your browser - complete privacy and security

## Key Features

### Desktop Environment
- **Multiple Virtual Desktops**: Switch between workspaces with customizable wallpapers
- **Advanced Window Management**: Smooth animations for opening, closing, minimizing, and maximizing windows
- **Smart Launcher**: Fuzzy search and categorized app list
- **System Tray**: Network, volume, and battery indicators with quick controls
- **Global Search**: Cross-app and file search
- **Command Palette**: Quick access to system commands
- **Context Menus**: Right-click menus for files and desktop
- **Dynamic Wallpapers**: Particle and interactive wallpaper effects
- **Boot Screen**: Elegant startup animation
- **Dark/Light Theme**: Customizable theme switching

### Development Tools
- **Code Editor**: Syntax highlighting and code editing for multiple languages
- **API Tester**: Built-in REST API client supporting various HTTP methods
- **JSON Formatter**: Beautify, validate, and format JSON data
- **Regex Builder**: Interactive regex testing and building tools
- **GitHub Trending**: View trending repositories directly in the OS
- **Python REPL**: Full Python 3 runtime via Pyodide - run Python code in the browser
- **90+ Terminal Commands**: File operations, system monitoring, network tools, and utilities
- **Code Snippet Manager**: Save and organize code snippets for quick access
- **Component Sandbox**: Test and preview React components

### Office & Productivity
- **Text/Markdown Editor**: Rich text editing with live preview
- **Spreadsheet**: Basic spreadsheet functionality for data entry
- **Calendar**: Date and event management with calendar view
- **Todo List**: Task management with completion tracking
- **Kanban Board**: Visual task organization with drag-and-drop
- **Project Planner**: Timeline and milestone tracking
- **Smart Notes**: Smart notes with tags, colors, archiving, and import/export
- **Mind Map**: Idea visualization with node-based editing
- **Presentation Creator**: Slide-based presentations
- **Flashcards**: Learning and memorization tool
- **Habit Tracker**: Track daily habits and progress
- **Smart Dashboard**: Real-time data dashboard with weather, crypto, and system stats

### Utilities
- **Calculator**: Scientific calculator with advanced functions and history
- **Password Manager**: Secure password storage with encryption
- **Pomodoro**: Productivity timer with customizable work sessions
- **Color Picker**: Color selection in various formats with clipboard copy
- **QR Code Generator**: Create QR codes for text, URLs, and contacts
- **Unit Converter**: Conversion between measurement units
- **Real-time Translator**: Multi-language translation
- **Online Toolkit**: JSON parsing, Base64 encoding, URL encoding
- **Clipboard Manager**: Advanced clipboard history and management
- **Screenshot Tool**: Desktop screenshots
- **Screen Recorder**: Record screen activity as video

### Multimedia
- **Music Player**: Audio playback with playlist support
- **Video Player**: Video playback with controls
- **Paint**: Basic drawing application with tools
- **Image Viewer**: View and zoom images
- **Camera**: Webcam access for video capture
- **Sound Recorder**: Audio recording with playback
- **Music Visualizer**: Audio visualization effects

### Entertainment
- **Weather App**: Current weather and forecast based on location data
- **World Clock**: Multiple timezone display
- **News Reader**: Latest news updates
- **Games**: Snake, Tetris, and other classic games
- **Virtual Pet**: Interactive pet simulation
- **Particle System**: Visual effect demonstrations

## Quick Start

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

| Shortcut | Action |
|----------|--------|
| Ctrl+Shift+L | Open launcher |
| Ctrl+K | Global search |
| Ctrl+P | Command palette |
| Alt+Tab | Switch windows |
| Ctrl+Q | Close window |
| Ctrl+C | Copy |
| Ctrl+V | Paste |
| Ctrl+Shift+C | Terminal interrupt |
| Ctrl+1-9 | Switch to desktop |
| Ctrl+Alt+Arrow | Switch desktop |
| Ctrl+Shift+1-9 | Move window to desktop |

## Tech Stack

- **React 19**: UI framework with latest features
- **TypeScript 6**: Type-safe development
- **Zustand 5**: Lightweight state management
- **Vite 8**: Optimized build tool
- **Pyodide**: Python runtime running entirely in the browser
- **Lucide React**: Beautiful icon library
- **Tailwind CSS**: Utility-first styling (used in some components)
- **IndexedDB**: Local storage for persistent data

## Architecture

WebLinuxOS follows a modular architecture:

```
src/
  apps/              # Individual applications
  components/
    desktop/         # Desktop environment components
  store/             # State management utilities
  types.ts           # TypeScript type definitions
  icons.tsx          # Icon components
  App.tsx            # Main application component
```

## Performance Optimization

WebLinuxOS is optimized for performance:

- **Code Splitting**: Each application loads on demand
- **Lazy Loading**: Applications only load when opened
- **Memoization**: React components optimized with memo
- **Efficient Rendering**: Virtual lists and optimized updates
- **GPU Acceleration**: Animations using transform and opacity
- **Throttle Optimization**: Drag and resize using requestAnimationFrame

## Design System

### Color System
- Primary: `#8b7cf0` (Purple gradient)
- Success: `#00d084`
- Warning: `#ffb400`
- Error: `#ff4757`
- Info: `#3498db`

### Shadow Elevation
- Elevation 1: `0 2px 8px rgba(0, 0, 0, 0.15)`
- Elevation 2: `0 4px 16px rgba(0, 0, 0, 0.2)`
- Elevation 3: `0 8px 32px rgba(0, 0, 0, 0.25)`

### Animation System
- Window open/close: 0.25s cubic-bezier
- Hover effects: 0.15s ease
- Bounce animation: 0.3s cubic-bezier
- Glass blur: 20px blur

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Note: Some features may require modern browser capabilities.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create your feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm run test`
5. Build: `npm run build`
6. Submit a pull request

## License

MIT License - Free for personal or commercial use.

## Statistics

- **120+ Applications**: Rich built-in applications covering development, productivity, and entertainment
- **90+ Terminal Commands**: Comprehensive command-line interface for system administration practice
- **150+ Source Files**: Modular and maintainable codebase built with modern best practices
- **50+ Keyboard Shortcuts**: Efficient workflow with extensive keyboard navigation support

## Use Cases

WebLinuxOS is perfect for:

- **Learning**: Explore desktop environment concepts
- **Demonstration**: Showcase web application capabilities
- **Development**: Test web technologies
- **Accessibility**: Access your files from any device
- **Productivity**: Lightweight online workspace
- **Education**: Teaching programming and system concepts
- **Prototyping**: Rapid desktop-class app prototyping

## Roadmap

Planned future improvements:

- Enhanced mobile responsive design
- More applications and features
- Performance improvements
- Additional language support
- Cloud sync
- PWA installation support
- Plugin system architecture
- Real-time collaboration features

---

**Version**: 5.2.0
**Last Updated**: 2026-05-31

---

## 🏆 Badges

[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
