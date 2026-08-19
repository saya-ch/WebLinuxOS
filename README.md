<div align="center">

# WebLinuxOS

**A fully functional Linux desktop that runs in your browser. Real tools, real APIs, real work.**

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Report Issue](https://github.com/saya-ch/WebLinuxOS/issues) · [Contributing](CONTRIBUTING.md)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=flat-square&logo=github)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![Forks](https://img.shields.io/github/forks/saya-ch/WebLinuxOS?style=flat-square)](https://github.com/saya-ch/WebLinuxOS/forks)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=flat-square&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v113.0.0-blue?style=flat-square)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen?style=flat-square&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)

</div>

---

## Why WebLinuxOS?

Most "web desktop" projects are eye candy — windows you can drag around, but nothing inside works. WebLinuxOS is different:

- The **terminal** executes 200+ real commands with a virtual filesystem
- The **code editor** uses Monaco (the same engine as VS Code) with syntax highlighting
- The **AI chat** connects to Pollinations.ai for real AI conversations
- The **weather app** pulls live data from Open-Meteo
- The **browser** searches the web via DuckDuckGo's API
- The **system monitor** reads real Performance API data from your browser

Every application does real work. No mock data. No placeholder UI.

## What's New in v113

This release adds the Global Travel Assistant, a comprehensive travel companion application that integrates world clocks, weather queries, currency conversion, and timezone tools.

- **GlobalTravelAssistant (全球旅行助手)** — A professional travel toolkit with four main modules:
  - **World Clock** — Real-time clocks for 16 major cities (Beijing, Tokyo, New York, London, Sydney, etc.) with live weather overlays
  - **Weather Query** — Detailed weather information powered by Open-Meteo API including temperature, wind speed, humidity
  - **Currency Converter** — Real-time exchange rates from ExchangeRate-API with 8 popular currency pairs (CNY/USD/EUR/JPY/GBP/KRW)
  - **Timezone Converter** — Intuitive timezone comparison with visual day/night indicators and UTC offset display
  - Favorites management with localStorage persistence
  - Beautiful glassmorphism UI design with gradient backgrounds

## What's New in v112

This release introduces three innovative applications that bring real-world utility to WebLinuxOS.

- **AIWritingStudio (AI智能写作工作台)** — AI-powered professional writing workstation with 8 writing modes (Article/Rewrite/Summary/Translate/Polish/Expand/Outline/Email), 6 writing styles, 8 languages, word count, local project saving, and quick templates. Powered by Pollinations.ai for real AI content generation.
- **CryptoDashboard (加密货币仪表盘)** — Real-time cryptocurrency market dashboard using CoinGecko API. Monitors 15 major cryptocurrencies with live price updates, multi-period K-line charts, favorites management, market statistics, and data export.
- **WeatherDashboard (天气环境监测中心)** — Weather and environment monitoring center using Open-Meteo API. Features current weather details, 7-day forecasts, 24-hour temperature trends, AQI air quality monitoring, and pollutant analysis for 12 cities.

## What's New in v110

This release introduces three professional-grade applications that transform WebLinuxOS from a desktop simulation into a practical daily productivity environment.

- **DataPulse Pro (数据脉搏仪表盘)** — One-stop real-time data dashboard aggregating 7+ public APIs: Open-Meteo weather, Open-Meteo AQI (PM2.5/PM10/O3), Frankfurter FX rates, CoinGecko crypto prices (BTC/ETH/SOL/ADA/XRP/DOGE with 7-day sparklines), Hacker News top stories, NASA Astronomy Picture of the Day, and locally computed holiday countdowns. Includes smart caching, error fallbacks, city switching, and a tabbed interface (Overview / Finance / News / Space).
- **AICodeMentor Pro (AI代码导师)** — A full developer mentorship workspace built on the free Pollinations.ai LLM API. Six dedicated modes: Code Explainer, Code Reviewer, Optimizer (performance + readability), Bug Finder & Fixer, Test Case Generator, and Algorithm Explainer. Supports JavaScript/TypeScript/Python/Go/Rust/Java/C++ with prompt templates, one-click import/export, and session history.
- **DevFlow Pro (开发者工作流中心)** — Integrated developer workflow hub combining four modules: Pomodoro timer (focus/short/long break with audio cues, Web Audio API), Kanban task board (today/todo/blocked/done with drag-drop and priorities), code snippet manager (language-aware, tagged, searchable, copy to clipboard, preset snippets), and daily standup journal with mood tracking and focus-hour logging. All data persists in localStorage across sessions, plus a built-in GitHub Trending browser.

Additional improvements in v110:
- **Build reliability fixes** — resolved TypeScript strict-mode violations across LiveCollabBoard, MarkdownWriter, WebBrowser, WebContainerIDE, and terminalEnhancedCommands (unused imports, incorrect types, missing properties).
- **Improved null-safety in network layers** — DataPulse and other API-driven apps now fully guard against empty payloads with per-field optional chaining and safe fallbacks instead of throwing.

## What's New in v109

- **WebContainer IDE** — browser-based full-stack development environment with JavaScript execution (iframe sandbox), HTML/CSS live preview, 5 code templates (React/Algorithms/API calls), multi-file tabs, console output capture, code sharing, and auto-save.
- **Markdown Writer** — purpose-built Markdown writing tool with split-pane live preview, multi-document management, local persistence, HTML/Markdown export, word count & reading time, and keyboard shortcuts (Ctrl+B bold, Ctrl+I italic).
- **Terminal API service layer** — unified `terminalApiService.ts` consolidates duplicated `fetchWithTimeout`, `handleApiError`, fallback data, and utility functions across 15+ command files, eliminating code redundancy.
- **Enhanced terminal commands** — new `edit` (in-terminal file editor), `write -a` (append mode), `wc` (line/word/char stats), `run` (execute .sh scripts), `whereis`, and improved `diff`/`tee`/`tree` commands for a more authentic Linux terminal experience.

## Previous Release (v108)

- **AI Chat goes real** — the AI assistant now uses Pollinations.ai for actual AI-powered conversations, not scripted responses. Toggle between online AI and offline mode.
- **DuckDuckGo search** — the built-in browser now searches the web using DuckDuckGo's Instant Answer API, with formatted results and click-through navigation.
- **Real system monitoring** — the System Monitor now reads actual browser Performance API data: real FPS, JS heap memory, device memory, network connection info, and localStorage usage.
- **Live Collaborative Board** — cross-tab collaborative whiteboard using BroadcastChannel API. Supports pen, eraser, shapes, cursor sharing, and PNG export.

## Features

### Desktop Environment

- Full window management — drag, resize, minimize, maximize, snap, tile
- Up to 9 virtual desktops with independent wallpapers
- Taskbar, start menu, and command palette (Ctrl+Shift+P)
- 30+ global keyboard shortcuts
- Animated aurora and particle wallpapers
- Cross-tab synchronization for themes and files

### 560+ Integrated Applications

| Category | Highlights |
|----------|-----------|
| **Development** | Code editor (Monaco), terminal (200+ commands), JSON tools, regex tester, API client, Git visualizer, online code runner |
| **AI & Creative** | AI chat (Pollinations.ai), AI image generation, code analyzer, translation, prompt engineering lab |
| **Internet** | Web browser (DuckDuckGo search), weather (Open-Meteo), crypto tracker (CoinGecko), news (Hacker News), Wikipedia, GitHub trending |
| **Office** | Markdown editor, spreadsheet, PDF viewer, presentation mode, smart notes with wiki-links |
| **System** | File manager, settings, system monitor (real data), password vault, app marketplace, system optimizer |
| **Multimedia** | Music studio, audio visualizer, paint, screen recorder, camera |
| **Collaboration** | Real-time collaborative whiteboard, document editor, code collaboration |
| **Games** | Tetris, Snake, 2048, Breakout, dice roller |

### Real API Integrations

Every data source is a real, public API — no fake data:

- **Open-Meteo** — global weather forecasts and air quality
- **Pollinations.ai** — AI chat and image generation (free, no key)
- **DuckDuckGo** — web search (free, no key)
- **CoinGecko** — cryptocurrency market data
- **Hacker News** — tech news via Firebase API
- **Wikipedia** — encyclopedia articles
- **REST Countries** — country data for 250+ nations
- **Frankfurter** — ECB exchange rates
- **GitHub API** — repository exploration
- **Open Library** — book discovery
- **NASA APOD** — astronomy imagery
- **MyMemory** — translation service
- **Web Speech API** — speech synthesis and recognition

## Quick Start

### Online

Visit **[https://saya-ch.github.io/WebLinuxOS/](https://saya-ch.github.io/WebLinuxOS/)** — no installation needed.

### Local Development

```bash
git clone https://github.com/saya-ch/WebLinuxOS.git
cd WebLinuxOS/web-linux
npm install
npm run dev
```

The dev server starts at `http://localhost:5173/WebLinuxOS/`.

### Production Build

```bash
cd web-linux
npm run build
```

Type checking (`tsc -b`) runs first — zero type errors are required.

## Architecture

```
WebLinuxOS/
├── web-linux/
│   ├── src/
│   │   ├── apps/               # 560+ application implementations
│   │   │   └── terminal/       # Terminal command system (200+ commands)
│   │   ├── components/         # Core UI (Desktop, Window, Taskbar, StartMenu)
│   │   ├── store/              # Zustand state management, virtual filesystem
│   │   ├── config/             # API endpoint configuration
│   │   ├── apps.tsx            # Application registry
│   │   └── icons.tsx           # Icon components
│   ├── public/                 # Static assets, PWA manifest, service worker
│   └── vite.config.ts          # Build config with code splitting
├── .github/workflows/          # CI/CD: auto-deploy to GitHub Pages
└── README.md
```

**Tech stack:** React 19 + TypeScript 6 + Vite 8 + Zustand 5 + Monaco Editor

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Smart Search | `Ctrl/Cmd + Shift + K` |
| Terminal | `Ctrl/Cmd + T` |
| File Manager | `Ctrl/Cmd + E` |
| Browser | `Ctrl/Cmd + B` |
| Command Palette | `Ctrl/Cmd + Shift + P` |
| Quick Note | `Alt + N` |
| Switch Desktop | `Ctrl/Cmd + Alt + 1-9` |
| Close Window | `Ctrl/Cmd + Q` |
| AI Command Center | `Ctrl/Cmd + Space` |

## Deployment

GitHub Pages deployment is automated via GitHub Actions. Push to `main` and the CI/CD pipeline handles the rest.

For custom deployments, modify the `base` config in `web-linux/vite.config.ts` and run `npm run build`.

## Contributing

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Before submitting, ensure the build passes:

```bash
cd web-linux && npm run build
```

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with React, TypeScript, and Vite. Deployed on GitHub Pages.

If this project is useful to you, consider giving it a star.

</div>
