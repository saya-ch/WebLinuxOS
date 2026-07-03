# WebLinuxOS

A feature-rich web-based Linux desktop environment that runs entirely in your browser. Experience a complete operating system interface with window management, file system, terminal, and a wide range of applications.

## Features

### Core System
- Window management with drag, resize, minimize, maximize, and close
- Virtual file system with CRUD operations
- Terminal emulator with over 50+ commands
- Desktop icons and launcher
- Taskbar with system tray
- Multiple workspace support

### Applications
- **Development Tools**: Code editor, terminal, Git client, code snippets manager
- **Productivity**: Text editor, calculator, calendar, reminders, todo list
- **Media**: Image viewer, audio player, video player, paint
- **Network**: Web browser, weather, news, world clock
- **System**: File manager, system monitor, settings

### Innovative Features
- Real-time system monitoring (CPU, memory)
- API integration for weather, news, cryptocurrency
- Code review checklists
- Programming challenges and tips
- Brainstorming tool
- Health and productivity suggestions

## Quick Start

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
```

### Development

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173/WebLinuxOS/`

### Build

```bash
npm run build
```

The build output will be in the `dist` directory.

### Deployment

The project is configured for GitHub Pages deployment. Push to the `main` branch and GitHub Actions will automatically deploy.

## Terminal Commands

### System Commands
- `whoami` - Display current user
- `hostname` - Display hostname
- `date` - Display current date and time
- `uname` - Display system information
- `top` - System monitoring
- `ps` - Process list
- `kill` - Terminate process

### File Commands
- `ls` - List directory contents
- `cd` - Change directory
- `pwd` - Print working directory
- `cat` - Display file content
- `touch` - Create file
- `mkdir` - Create directory
- `rm` - Remove file
- `cp` - Copy file
- `mv` - Move file
- `grep` - Search in files
- `find` - Find files
- `du` - Display directory size

### Network Commands
- `ping` - Test network connectivity
- `curl` - Fetch URL content
- `dig` - DNS lookup
- `netstat` - Network statistics

### Productivity Commands
- `calendar` - Display calendar
- `reminder` - Set reminders
- `todo` - Manage todo list
- `health` - Health tips
- `productivity` - Productivity suggestions

### Developer Commands
- `git` - Git client
- `code-review` - Code review checklist
- `challenge` - Programming challenges
- `code-tip` - Random coding tips
- `story` - Programming stories

### API Commands
- `weather` - Get current weather
- `news-summary` - Get news summary
- `crypto-news` - Cryptocurrency news
- `quote-of-the-day` - Daily quotes
- `world-clock` - World clock

## Architecture

```
web-linux/
├── src/
│   ├── apps/           # Application components
│   ├── components/     # UI components
│   ├── hooks/          # Custom hooks
│   ├── store/          # Zustand state management
│   ├── utils/          # Utility functions
│   └── App.tsx         # Main application
├── public/             # Static assets
├── index.html          # Entry point
├── vite.config.ts      # Vite configuration
└── package.json        # Dependencies
```

## Technologies

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: CSS Modules
- **Icons**: Lucide React
- **Deployment**: GitHub Pages

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests if available
5. Submit a Pull Request

## License

MIT License

## Acknowledgments

- Inspired by various web-based operating systems
- Built with modern web technologies
- Designed for developers and enthusiasts

---

Made with passion for web development