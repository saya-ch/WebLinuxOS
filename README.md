# WebLinuxOS

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<p align="center">
  <strong>A fully functional Web Desktop Operating System</strong>
</p>

<p align="center">
  <a href="https://saya-ch.github.io/WebLinuxOS/">Live Demo</a>
  ·
  <a href="#features">Features</a>
  ·
  <a href="#applications">Applications</a>
  ·
  <a href="#quick-start">Quick Start</a>
  ·
  <a href="#deployment">Deployment</a>
</p>

---

<p align="center">
  <img src="https://raw.githubusercontent.com/saya-ch/WebLinuxOS/main/public/screenshot.png" alt="WebLinuxOS Screenshot" width="100%">
</p>

## Project Introduction

WebLinuxOS is an innovative Web-based desktop operating system that runs entirely in the browser. Built with modern frontend technologies, it delivers a authentic Linux-like desktop experience with complete window management, taskbar, virtual filesystem, and multi-tasking capabilities.

**No installation required - just open and experience the full desktop environment.**

## Features

### Desktop Experience
- **Window Management System** - Drag, resize, minimize, maximize, and close windows with smooth animations
- **Dynamic Taskbar** - Application switching, system tray, real-time clock display
- **Virtual Filesystem** - Complete file browsing and management experience
- **Multi-tasking** - Run multiple applications simultaneously
- **Theme Switching** - Seamless dark/light mode transitions
- **Responsive Design** - Adapts to various screen sizes
- **Live Wallpapers** - 32 beautiful gradient wallpapers with more themes
- **Keyboard Shortcuts** - Comprehensive global hotkey system

### Developer Tools
- **Code Editor** - Full syntax highlighting for JavaScript/TypeScript/HTML/CSS
- **Code Runner** - Execute JavaScript code in real-time
- **API Testing** - REST client for API testing
- **Regex Tester** - Pattern validation and debugging
- **JSON Formatter** - Data format conversion
- **GitHub Explorer** - Browse repositories and trending projects
- **Developer Ecosystem** - Snippets library, project templates, API docs browser

### Smart Applications
- **AI Learning Companion** - Spaced repetition memory system with progress tracking
- **Creative Inspiration Workshop** - Idea generation with keyword association
- **Smart Code Assistant** - Code explanation and generation tool
- **Activity Tracker** - Productivity monitoring and analytics

### Office & Productivity
- **Markdown Editor** - Live preview editing
- **Spreadsheet** - Data entry and calculation
- **Presentation** - Slide creation
- **Calendar** - Date management with reminders
- **Notes** - Quick note-taking application

### Utilities
- **Calculator** - Scientific calculator with currency conversion
- **World Clock** - Multiple timezone display
- **Weather** - Real-time weather information
- **Password Generator** - Secure password creation
- **QR Code Generator** - Create QR codes instantly

### Multimedia
- **Music Player** - Local audio playback
- **Video Player** - Multi-format video support
- **Image Viewer** - Image browsing and editing
- **Drawing Tool** - Simple illustration application

### Entertainment
- **Snake Game** - Classic arcade experience
- **Tetris** - Puzzle gaming
- **2048** - Number merging game
- **Memory Card** - Memory training game

## Applications Overview

The project includes **220+** meticulously designed applications across the following categories:

### System Applications
| App | Description |
|-----|-------------|
| File Manager | Complete file browsing and management |
| Terminal | Command-line simulator |
| System Monitor | Real-time performance monitoring |
| Task Manager | Process and application management |
| Settings Center | System configuration panel |

### Development Tools
| App | Description |
|-----|-------------|
| Code Editor | Syntax highlighting for JS/TS/HTML/CSS |
| REST Client | API testing tool |
| Regex Tester | Pattern validation and debugging |
| JSON Formatter | Data format conversion |
| GitHub Explorer | Repository and trending browsing |
| Code Runner | Instant JavaScript execution |

### Innovation Apps

#### AI Learning Companion
An intelligent learning assistant designed for knowledge management and skill improvement.

**Core Features:**
- Knowledge card system based on spaced repetition algorithm
- Learning path planning with systematic knowledge mastery routes
- AI-powered Q&A for instant answers
- Progress tracking with data visualization
- Personalized learning plans customized to goals

#### Creative Inspiration Workshop
A creative generation tool to inspire designers and creators.

**Core Features:**
- Inspiration board for visual creative combinations
- Smart keyword association engine
- 10启发式创意方法
- Random creative combinations: keywords + colors + shapes
- Favorites management for saving premium ideas

#### Developer Ecosystem
Developer tools aggregation center, one-stop development resource platform.

**Core Features:**
- Code snippets library: save, search, run code snippets
- Project templates: quick generation of React/Node/CLI project structures
- API documentation browser: GitHub/Open-Meteo/CoinGecko public APIs
- Toolchain configurator: frontend/backend/DevOps tool solutions
- Code runner: instant JavaScript code execution

## Quick Start

### Prerequisites
- Node.js 18+
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

Open `http://localhost:5173` to view the application.

### Production Build

```bash
npm run build
```

Build artifacts are located in the `dist/` directory.

## Deployment

### GitHub Pages (Recommended)

The project supports GitHub Actions automatic deployment:

1. Push the project to your GitHub repository
2. Go to repository Settings > Pages
3. Select Source as "GitHub Actions"
4. The project will automatically build and deploy

### Manual Deployment

```bash
# Build the project
npm run build

# Deploy to gh-pages branch
git subtree push --prefix dist origin gh-pages
```

### Configuration

Ensure `vite.config.ts` has the correct `base` path:

```typescript
export default defineConfig({
  base: '/WebLinuxOS/', // Replace with your repository name
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
```

## Technical Architecture

### Tech Stack
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe development
- **Vite 5** - Fast build tool
- **Lucide React** - Modern icon library

### Project Structure

```
web-linux/
├── src/
│   ├── apps/                    # Application components (220+ apps)
│   │   ├── AILearningCompanion.tsx
│   │   ├── CreativeInspirationWorkshop.tsx
│   │   ├── DevEcosystem.tsx
│   │   └── ...
│   ├── components/              # System components
│   │   ├── Window.tsx           # Window management
│   │   ├── Taskbar.tsx          # Taskbar
│   │   ├── Desktop.tsx          # Desktop environment
│   │   └── FileManager.tsx      # File management
│   ├── store.tsx                # Global state management
│   ├── apps.tsx                 # Application registry
│   ├── types.ts                 # Type definitions
│   ├── icons.tsx                # Icon system
│   └── index.css                # Global styles
├── public/                      # Static assets
├── vite.config.ts              # Build configuration
└── package.json                # Dependencies
```

### State Management

Using Zustand-like pattern for global state management:
- Window state: position, size, activation status
- Application state: running list, focus management
- Theme state: dark/light mode
- Filesystem: virtual directory structure

## Usage Examples

### Starting Applications
1. Double-click desktop icons to launch applications
2. Browse all applications through the taskbar "App Menu"
3. Use the search function to quickly locate applications

### Window Operations
- **Drag**: Click the title bar to move the window
- **Resize**: Drag the window corners to adjust size
- **Minimize**: Click the minimize button to hide the window
- **Maximize**: Click the maximize button to fullscreen the window
- **Close**: Click the close button to terminate the application

### File Management
- Create folders and files
- Copy, move, delete operations
- File search and sorting

### Theme Switching
Quickly switch between dark/light themes through the Settings Center or system tray.

## Performance Optimization

- Lazy loading of application components
- Virtual scrolling for long lists
- CSS animations instead of JavaScript animations
- On-demand state updates
- Optimized bundle size with code splitting

## Development Guide

### Adding New Applications

1. Create component file in `src/apps/`
2. Register application definition in `src/apps.tsx`
3. Implement application icon component
4. Add to appropriate category

### Application Specification

```typescript
interface AppDefinition {
  id: string              // Unique identifier
  name: string            // Display name
  icon: ReactNode         // Icon component
  component: string       // Component name
  category: string        // Application category
  defaultWidth: number    // Default width
  defaultHeight: number   // Default height
  minWidth: number       // Minimum width
  minHeight: number       // Minimum height
  resizable: boolean      // Resizable or not
  multiple: boolean      // Allow multiple instances
}
```

### Categories

- `system` - System tools
- `development` - Development tools
- `office` - Office applications
- `utilities` - Utility tools
- `multimedia` - Multimedia
- `internet` - Network applications
- `games` - Games and entertainment

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

1. Fork the project repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT License - Free to use, modify, and distribute.

## Changelog

### v11.0.0
- Added AI Learning Companion application
- Added Creative Inspiration Workshop application
- Added Developer Ecosystem application
- Optimized README documentation structure
- Expanded wallpaper collection to 32 themes

### v10.0.0
- Added real-time Markdown collaborative editor
- Added API health monitoring center
- Added code snippet sharing center

### v9.0.0
- Added AI code analyzer
- Added network status dashboard
- Added system resource optimizer

---

**WebLinuxOS** - Experience a complete desktop operating system in your browser.

<p align="center">
  <sub>Built with passion and modern web technologies</sub>
</p>