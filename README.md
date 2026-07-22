# WebLinuxOS

A complete Linux desktop environment running in the browser — not a simulator, but a real toolkit for getting work done.

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Changelog](CHANGELOG.md) · [Report Issues](https://github.com/saya-ch/WebLinuxOS/issues)

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://saya-ch.github.io/WebLinuxOS/)
[![Version](https://img.shields.io/badge/version-v45.0.0-blue)](https://github.com/saya-ch/WebLinuxOS/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=social)](https://github.com/saya-ch/WebLinuxOS)

## Overview

WebLinuxOS is an out-of-the-box Linux desktop environment in the browser, integrating over 240 native-grade applications into a single web application. Unlike "OS simulators", every application here provides real value — the terminal runs actual commands, the editor writes real code, the API testing tool makes real API calls, and privacy tools detect real sensitive information.

**Use cases:**

- Work on iPad / Chromebook / any device with only a browser
- Give students a sandbox to learn command line without installing Linux
- Quickly demo tools to clients without configuring local environments
- Host a pure static personal workspace on GitHub Pages

## Core Features

### Desktop & Window System

- Multi-window with virtual desktops (4 workspaces), draggable, resizable, minimizable/maximizable
- Taskbar, start menu, command palette (Ctrl+P), global search (Ctrl+K)
- Multiple themes: Cyberpunk / Quantum / Glass Morphism / Classic Light
- Smooth animations and transitions with GPU acceleration
- Boot animation for polished startup experience

### 240+ Built-in Applications

Covering development, productivity, networking, media, system, tools, and games. Complete application list available in [APPS.md](web-linux/CHANGELOG_APPS.md) or via the "App Store" within the system.

### Real-World Functionality (Not Just Simulation)

**Development Tools:**
- Terminal with 70+ commands including file system browsing, text processing, network diagnostics, Cron simulation, Git simulation
- Code editor with Monaco kernel, syntax highlighting, multi-language support, auto-completion
- Markdown editor with real-time bidirectional preview, tables, formulas, code blocks, HTML export
- API Testing Tool with real API calls, preset templates for GitHub/NASA/exchange rates and other public APIs, request history, favorites management, response formatting
- Developer Shortcuts Reference covering VS Code/Chrome/macOS/Terminal/Git/Vim shortcuts with search, categories, one-click copy, custom additions
- **DevLab**: One-stop developer toolbox with 12+ tools — JSON formatter, Base64 encoder/decoder, hash generator (MD5/SHA-1/SHA-256/SHA-512), UUID generator, password generator, color tools, timestamp converter, URL encoder/decoder, and more

**Productivity:**
- **Smart Dashboard**: All-in-one dashboard with real-time weather, system monitoring, quick tool access, daily motivational quotes, and todo list management — glass morphism design
- JSONForge: Formatting / Compression / YAML / CSV / Schema / Diff in one tool
- CronLab: Visual Cron expression builder with next 5 execution predictions
- PrivacyGuard: Local PII detection identifying 17 categories of sensitive information (email/phone/ID/API Key/JWT, etc.)
- WorldPulse: Global weather, exchange rates, earthquakes, news aggregation based on public APIs

**Network & Development Tools:**
- **Network Toolkit Pro**: Professional network toolkit — IP info lookup, DNS lookup, URL encode/decode, network status monitoring, HTTP status code reference, port scanner
- **Pro Terminal Commands**: 12+ new utility commands — quote (motivational quotes), joke (programmer jokes), ipinfo (IP geolocation), uuidgen (batch UUID), timestamp (time conversion), base64-encode/decode, url-encode/decode, random number generator, password generator, color converter, dictionary, tech news

**Online Services:**
- Weather, news, cryptocurrency, exchange rates, IP info, translation, dictionary
- Wikipedia search, space news, random quotes, jokes
- NASA APOD, Pokemon database, Star Wars database
- DuckDuckGo search integration

**System Tools:**
- Performance monitoring panel with real-time FPS/memory/CPU/storage analysis
- Battery status, hardware information, network monitoring
- File system with undo/redo support, favorites, recent files tracking

### Privacy First

All local data is stored in browser localStorage. Nothing is uploaded to any server unless users explicitly enable online APIs (like WorldPulse / WebSnapshot). All other applications run completely offline.

## Quick Start

No installation required — open in browser:
https://saya-ch.github.io/WebLinuxOS/

Local development:

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev      # http://localhost:5173
```

Build for production:

```bash
npm run build
npm run preview
```

## Technology Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **State Management**: Zustand
- **Styling**: CSS Variables (no Tailwind) + Theme System
- **UI Icons**: Lucide React
- **Code Editor**: Monaco Editor
- **Markdown**: marked + DOMPurify
- **Python Runtime**: Pyodide (optional application)
- **Deployment**: GitHub Pages (auto-built via GitHub Actions)

## Project Structure

```
WebLinuxOS/
├── web-linux/                # Frontend application
│   ├── src/
│   │   ├── apps/             # 200+ application implementations
│   │   ├── components/       # Core components: desktop, windows, taskbar
│   │   ├── store/            # Zustand state management + default data
│   │   ├── styles/           # Theme styles
│   │   ├── config/           # API configuration
│   │   └── types/            # TypeScript type definitions
│   ├── public/               # Static assets
│   └── vite.config.ts
├── .github/workflows/        # GitHub Actions auto-deployment
├── dist/                     # Build output (generated by Actions)
└── CHANGELOG.md              # Detailed changelog
```

## Key Terminal Commands

| Category | Commands |
|----------|----------|
| File Operations | ls, cd, pwd, mkdir, rm, cp, mv, cat, touch, grep, find, diff, chmod, history |
| System | whoami, hostname, date, uname, uptime, ps, top, neofetch, sysinfo, clear, which |
| Network/API | weather, news, crypto, ipinfo, search, wiki, space, curl, ping, dig, nslookup, dnslookup, iplookup, ifconfig, netstat, github-trending, timezone |
| Utilities | translate, dictionary, calculator, calendar, time, battery, cpu, hash, base64, uuid, regex, jwt-decode |
| Fun | quote, joke, chuck, advice, pokemon, numbers, nasa, cat-fact, dog-image, random-user, starwars, trivia, holiday |
| Management | version, about, credits, shortcuts, help, help-all |

## Keyboard Shortcuts

- **Ctrl/Cmd + T**: Open terminal
- **Ctrl/Cmd + E**: Open file manager
- **Ctrl/Cmd + B**: Open browser
- **Ctrl/Cmd + K**: Global search
- **Ctrl/Cmd + P**: Command palette
- **Ctrl/Cmd + Q**: Close window
- **Ctrl/Cmd + M**: Minimize window
- **Alt + Tab**: Switch windows
- **Ctrl + Alt + [1-9]**: Switch desktops
- **PrintScreen**: Screenshot
- **Ctrl/Cmd + Space**: Smart command center

## Contributing

Contributions are welcome — code, bug reports, or feature suggestions.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/awesome-thing`)
3. Commit changes (`git commit -m 'feat: add awesome thing'`)
4. Push to branch (`git push origin feature/awesome-thing`)
5. Open a Pull Request

For new applications: Add components in `web-linux/src/apps/`, register in `apps.tsx`, and add lazy loading entry in `WindowManager.tsx`.

## Roadmap

- [ ] PWA support (installable as local app)
- [ ] File system sync across devices (optional WebDAV / GitHub Gist)
- [ ] Collaboration mode (CRDT multi-user shared workspace)
- [ ] Mobile optimization
- [ ] Plugin system (third-party app hot loading)

## License

This project is open source under the MIT license. See [LICENSE](LICENSE) for details.

## Acknowledgements

- [Lucide](https://lucide.dev/) — Icon library
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) — Code editor
- [Pyodide](https://pyodide.org/) — Browser Python runtime
- [microlink.io](https://microlink.io/) — Web page metadata scraping
- All contributors and users

---

If this project helps you, please give it a star.
