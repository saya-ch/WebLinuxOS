<div align="center">

# WebLinuxOS

**A fully functional Linux desktop that runs in your browser. Real tools, real APIs, real work.**

[Live Demo](https://saya-ch.github.io/WebLinuxOS/) · [Report Issue](https://github.com/saya-ch/WebLinuxOS/issues) · [Contributing](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)

[![GitHub Stars](https://img.shields.io/github/stars/saya-ch/WebLinuxOS?style=flat-square&logo=github)](https://github.com/saya-ch/WebLinuxOS/stargazers)
[![Forks](https://img.shields.io/github/forks/saya-ch/WebLinuxOS?style=flat-square)](https://github.com/saya-ch/WebLinuxOS/forks)
[![License](https://img.shields.io/github/license/saya-ch/WebLinuxOS?style=flat-square&color=blue)](LICENSE)
[![Version](https://img.shields.io/badge/version-v124.0.0-blue?style=flat-square)](https://github.com/saya-ch/WebLinuxOS/releases)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-brightgreen?style=flat-square&logo=github)](https://saya-ch.github.io/WebLinuxOS/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/saya-ch/WebLinuxOS/deploy.yml?branch=main&style=flat-square&logo=github-actions)](https://github.com/saya-ch/WebLinuxOS/actions)

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
- **MindSync Pro** unifies pomodoro, tasks, habits, reflection, and analytics into one productivity system
- **LexiconForge** mines the Datamuse corpus for rhymes, synonyms, antonyms, associations, homophones, and spelling patterns — a real writing companion for poets, students, and language learners

Every application does real work. No mock data. No placeholder UI.

## What's New in v124

This release introduces **three specialized, API-backed applications** that extend WebLinuxOS into three new domains: shell-learning productivity, DevOps site-reliability diagnostics, and nutritional-environmental impact tracking. They share the common thread of turning browser-side computation and public APIs into standalone tools you would otherwise need a separate tab or a paid service to use.

- **AICommandPro · AI智能命令中心** — A bidirectional natural-language ↔ shell-command translator with risk scoring, a curated command-template library, persistent history, and favorited bookmarks. Designed for Linux learners who think in Chinese and need to understand what a command actually does before pasting it into a terminal.
  - **Natural language → command** translator with 500+ hand-written rule mapping: `查看80端口占用` → `lsof -i :80`, `解压 package.tar.gz` → `tar -zxvf package.tar.gz`, `搜索包含关键字的文件` → `grep -r "关键字" .`, etc. Every produced command includes a sentence-length explanation, an estimated risk level (safe / warning / danger), and a copy button.
  - **Command → explanation & risk** reverse engine: paste a shell pipeline and the parser tokenizes operators (`| ; && || `), identifies destructive verbs (`rm -rf dd chmod chown`), scores overall risk, and renders a point-by-point explanation of each redirection, option flag, and input/output file. Handles compound commands with `&&` chains and warns specifically about the `-r -f` combination and unescaped glob targets under `/`.
  - **Command template library** with 30+ categorized entries (File, Dev, Git, Network, System): quick-search by Chinese description or command substring, category filters, one-click use, and persistent favorites list with localStorage. Templates include things like "show top-10 largest directories under /var", "batch rename jpg to png", and "tar + gzip a folder with timestamp".
  - **History & Favorites** sidebar with millisecond timestamps, mode badges (NL→CMD / CMD→NL), exportable to clipboard. Everything is saved locally; nothing is sent to a server.
  - Risk metadata uses explicit icons for each level: shield-check for safe operations, shield for cautious (sudo, curl), warning-triangle for destructive (rm, dd, format). All state is namespaced to the AICommandPro key family.
- **DevOpsHealthCheck · 网站健康诊断** — A one-window DevOps site-reliability auditor. Type in a domain and the window composes **eight independent probe modules** into a single composite grade (A+ through F). Nothing sensitive is computed off-device; cryptographic fingerprinting and parsing all run in the browser.
  - **Reachability** — layered HTTPS probe: fetch with no-cors, followed by XHR + explicit 8 s timeout, followed by favicon `<img>` tag fallback as a last-resort "is the host even up" signal. HTTP status code, response headers when available, download timing, and request phases are captured.
  - **DNS health over Cloudflare 1.1.1.1 JSON DoH** — A / AAAA / CNAME / MX / NS / TXT / SOA records pulled via `?name=&type=` JSON endpoint. Answers are grouped by record type and rendered with TTLs and byte sizes; the grade contribution distinguishes between "A OK + NS OK" (pass, full score), "A OK / NS missing" (warn, half score) and "unable to resolve A" (fail).
  - **SSL/TLS health** — Certificate Transparency log search via crt.sh (public JSON endpoint) showing issuer CN, SAN count, and days-to-expiry from `not_before` / `not_after`. Warns explicitly under 14 days remaining, fails under 3 days, shows the raw Subject Alternative Name list if the endpoint returned any.
  - **RDAP / WHOIS domain information** — RDAP JSON (rdap.org) for registration date, expiry, registrar, and WHOIS-server fallback.
  - **Performance heuristics** — First-byte timing, favicon download size as a proxy for page weight, response headers (Server, X-Powered-By, strict-transport-security, content-security-policy) with explicit security scoring.
  - **Headers security checklist** — 11 critical headers (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection, Expect-CT, Feature-Policy, Cross-Origin-Opener-Policy, Cross-Origin-Resource-Policy) with per-header explanations and fix suggestions for the missing ones.
  - **Global grade computation** — Weighted (DNS / SSL / HTTP / Headers / Performance / RDAP / Security / Reachability) percent-to-grade mapping from `A+` (95–100) through `F` (< 40). Summary card shows grade ring, total score out of 100, and an expandable per-item list with inline detail rows.
- **EcoFoodPrint · 饮食碳足迹计算器** — A food-specific environmental-impact tracker backed by **IPCC AR5, FAO 2017, and Poore & Nemecek (Science 2018) emission factors**. 87 foods across 10 categories with kg CO₂e per kg of product plus water footprints. Designed to turn "what did I eat today" into a concrete number with useful equivalents and 7-day / 30-day trend analysis.
  - **Meal entries** — Breakfast / Lunch / Dinner / Snack meal buckets. Select any food, dial in grams via +/- steppers, press Add. Each entry shows name-en + name-zh, meal-type tag, per-serving CO₂e (g), per-serving water (L), total line, and delete button.
  - **Emission-factor database** — 10 categories (Meat / Dairy / Seafood / Grain / Vegetable / Fruit / Beverage / Snack-Food / Processed / Plant-Protein) with representative 2024 IPCC / FAO median values, e.g. Beef (grain-finished) = 27.0 kg CO₂e / kg, Lentils = 0.9, Tofu = 2.0, Farmed Salmon = 11.87, Cow milk = 3.2, Rice (white) = 2.7. Water footprints for each item too (L/kg), so the app can also track embedded water.
  - **Today summary KPIs** — Daily CO₂e total (g), water footprint (L), serving count, meal breakdown. Benchmarked against "China adult daily recommendation: < 3 kg CO₂e" and the 5–7 kg global average.
  - **Equivalency widgets** — Translate today's CO₂e into: number of mature trees required to absorb it for one year, km driven in an average gasoline passenger car, kWh of grid electricity (China 2024 grid mix), and liters of produced water (including agricultural / processing / transport).
  - **Category analysis** — Donut chart of which food groups are driving today's footprint.
  - **7-day / 30-day history view** — Date-sorted meal log, stacked area SVG trend line with per-category colors, 7-day rolling average, month-over-month comparison. All data persists to localStorage.
  - **Low-carbon suggestion engine** — If today's diet is heavy in red meat or processed food or single-use beverages, in-line cards suggest concrete substitutions (e.g. "chicken breast instead of beef saves ~X kg CO₂e per meal", "one oat-milk day per week saves ~Y kg / year", etc.) with verified numbers from the same factor database.
- **Type safety pass across the codebase** — Added explicit `BatteryManager` / `NavigatorWithBattery` interfaces to `enhancedSystemCommands.ts` replacing a `@ts-ignore` on the Battery API; `Pyodide` global declaration on `Window` with `loadPyodide(options?) -> Promise<...>` instead of `any`; `TextDecoder`-first JWT payload decoding in DeveloperToolkitPro with UTF-8 safe fallback instead of raw `decodeURIComponent(escape(...))`; removed duplicate tail `declare global` block in `WebIDEPro.tsx` that conflicted on `pyodide`/`loadPyodide` property types.
- **Registration** — All three new applications are registered in `APP_REGISTRY_EXTRAS` inside `src/apps.tsx` and lazy-loaded through `WindowManager.componentMap` in `src/components/desktop/WindowManager.tsx`, resulting in three independent code-split chunks (roughly 46–48 kB each) that do not inflate the boot bundle.
- **Version metadata aligned to v124.0.0** across `package.json`, `index.html` meta description, Open Graph / Twitter cards, the boot animation banner, and the README badge.

## What's New in v123

This release introduces **three flagship applications** designed to turn WebLinuxOS into a single-window productivity cockpit for data, code, and behavior. They are intentionally built around composable, independent cards and modules rather than tabbed silos, so the workspace you shape stays under your control.

- **DataVerse Live · 多源实时数据画布** — A free-form live dashboard where every piece of data is a draggable, resizable card. Instead of switching between tabs, you build your own information cockpit.
  - Nine card types backed by public APIs: Open-Meteo multi-city weather, Open-Meteo air quality (PM2.5 / PM10 / O3 / NO2 / SO2 / CO), Frankfurter exchange rates, CoinGecko crypto markets, Hacker News front-page stories, NASA APOD astronomy imagery, SpaceX latest launch, programmer jokes, daily quotes, random recipe of the day, and a multi-city world clock
  - Cards are rendered with per-type visual layouts (thermal rings, currency grids, market sparklines, scrollable story lists, large image frames, punchlines with reveal)
  - Custom card adder, one-shot refresh per card, **refresh-all across the canvas**, and per-card caching with 4-minute TTL so repeated visits and reloads don't hammer rate limits
  - Automatic graceful fallbacks for CORS-restricted endpoints (Frankfurter, SpaceX, CoinGecko rate limits, etc.) — every card degrades to a sensible local dataset with an inline notice instead of going blank
  - Entire layout persists to localStorage per-user: positions, sizes, card configuration, and even refresh timestamps
  - Lazy-loaded chunk of roughly 63 kB so it doesn't touch the initial boot bundle
- **NebulaDev Pro · 开发者超级工具箱** — A seven-module developer utility window built around the Web Crypto API and browser-native fetch, so nothing sensitive leaves the tab and you can safely paste production JWTs and secrets.
  - **JWT Workbench** — decode (Header / Payload / Signature with millisecond-expiry diff), HMAC generate (HS256 / HS384 / HS512), and HMAC verify against the token's embedded algorithm field; rejects unsupported `alg` values explicitly rather than accepting `none`
  - **CORS Probe** — sends OPTIONS + GET requests, reconstructs Access-Control-Allow-Origin/Credentials/Headers/Methods verbatim, and reports the exact failure mode (preflight missing, credentials mismatch, origin mismatch, etc.)
  - **Cloudflare DoH DNS Query** — A / AAAA / CNAME / MX / NS / TXT / SRV / CERT / PTR record lookup via the 1.1.1.1 public JSON DoH endpoint, no browser DNS
  - **Web Crypto toolbox** — SHA-1 / 256 / 384 / 512, HMAC with any string secret, AES-GCM 256-bit encrypt & decrypt with PBKDF2 key derivation + salt iteration counter, output hex and base64 side-by-side with copy buttons
  - **HTTP timing** — named fetch phases (DNS / TCP / TLS / TTFB / Download / Total) derived from PerformanceResourceTiming, plus server certificate check and final HTTP status
  - **URL parser / encoder** — structured breakdown with copyable fields and an encodeURIComponent / decodeURIComponent scratchpad
  - **Password strength evaluator & generator** — Shannon entropy bits, length penalty, character-class checks, crack-time estimate, and a cryptographically secure passphrase generator that honors custom length, case, digits, and symbol rules
- **QuantumHabit OS · 科学习惯操作系统** — A behavior-science-backed habit operating system, not another checkbox list. Organized around James Clear's Four Laws (cue / craving / response / reward) for every habit card, with 66-day addiction curves and yearly growth reporting.
  - Habit editor with user-visible Cue / Craving / Response / Reward template fields per habit, custom emoji and color swatches, weekday toggle, weekly target (days/week), and a preset library (Meditation, Daily Reading, Journaling, Exercise, Deep Work, Water, Sleep, French Practice etc.)
  - **Today View** — today's checkboxes with progress ring, completion %, best-streak, current-streak, and per-habit reminders of the Cue/Reward you wrote for yourself (behavioral anchoring, not gamification badges)
  - **Month heatmap calendar** — single-stroke SVG rendering with density-driven color stops; empty-state hint for the 66-day threshold
  - **Focus session integration** — Pomodoro-style 25/5 focus timer that can optionally credit the associated habit upon session completion
  - **Statistics dashboard** — weekly completion bar chart, month-over-month line chart, category-level donut, "days since I started", and YTD annual report card with top/bottom performers
  - All data persisted to localStorage with import/export JSON for backup and cross-device migration
- **Graceful degradation overhaul across all API-driven apps** — GlobalPulse exchange / crypto / HN endpoints, DataVerse Live nine card types, NebulaDev Pro network probes, and several other tabs now ship with curated local fallback datasets. Network failures and CORS blocks surface as a subtle inline notice rather than an empty state that looks like broken UI.
- Version metadata aligned to **v123.0.0** across `package.json`, README, and boot banners. All three new applications are registered in `APP_REGISTRY_EXTRAS` and `WindowManager.componentMap` as Vite lazy-loaded chunks.

## What's New in v122

This release ships **three new production-grade applications** that expand WebLinuxOS into education, culinary, and environmental domains. Each is backed by real public APIs, ships with smart local caching, and is designed to replace standalone web apps you'd keep open in separate tabs.

- **LanguageLab Pro · 语言实验室 Pro** — A real four-module language workspace that brings dictionary lookup, multi-language translation, spaced-repetition flashcards, and vocabulary management into one window.
  - **English Dictionary** via the Free Dictionary API — phonetic pronunciation with playable audio (Web Speech API fallback), part-of-speech grouping, definition lists with examples, synonym/antonym blocks, and source attribution
  - **Machine Translation** via MyMemory's public translation endpoint — 100+ language pairs with auto-detect, bidirectional swap, 5000-char capacity guard, and copy-to-clipboard
  - **Flashcards** — four-box spaced-repetition system (New / Learning / Review / Mastered) with Leitner-style auto-promotion and demotion, per-card pronunciation, quick-add from dictionary results, 30-deck limit
  - **Saved Words** — persistent vocabulary book across dictionary + translation + flashcard modules, with search, per-entry notes, and date-sorted history of the last 50 lookups and 50 translations
  - 24-hour response cache layer (in-memory + localStorage) for dictionary and translation queries to stay under public API rate limits and keep repeated lookups instant; CORS proxy-aware error messages when the direct endpoint is blocked
- **RecipeForge · 智能菜谱工坊** — A real cooking companion backed by the public TheMealDB API. Designed to replace the ad-ridden recipe sites you'd normally visit in a separate tab.
  - **Search** by keyword with smart empty-state fallback; **Categories** grid (14 classic TheMealDB categories with emoji icons and per-card counts); **Regions** selector with 25+ country cuisines; **Surprise Me** button that pulls a genuinely random recipe
  - Recipe detail view: full-resolution thumbnail, category + region + tags metadata, scrollable ingredient list with measures, numbered step-by-step instructions, direct YouTube link, and direct source link
  - **Favorites** system: star recipes from any view, dedicated favorites tab, instant add/remove with optimistic UI
  - **Smart Shopping List**: one-click "add recipe to list" from the detail view, automatic ingredient **deduplication and merge-by-name** (e.g. two recipes adding "1 cup Olive Oil" combine into a single line), manual check-off, clear-all, and serving-scaler that multiplies/divides ingredients by a custom ratio before import
  - TheMealDB quota-aware: empty-state guidance when the free tier is exhausted rather than a cryptic error
- **EcoTrack Pro · 碳足迹追踪 Pro** — A real personal carbon-management tool built on IPCC public emission factors and the Open-Meteo climate API. Six activity categories, two dedicated chart views, and actionable offset suggestions rather than a gimmicky score card.
  - **Six activity categories** with sensible IPCC-derived default factors that users can override: Transport (petrol/diesel/EV car, bus, subway, rail, domestic/intl flight with RFI), Diet (red meat, poultry, fish, dairy, vegan days), Home Electricity, Home Gas, Shopping (clothing, electronics, goods), Waste (recycled/landfill/incinerated)
  - **Custom activity** form that lets users type any name, quantity, and CO2e factor directly — for edge cases the presets don't cover
  - **Analytics** view: 30-day stacked trend chart (SVG, category-colored), category breakdown donut chart (SVG), 7-day / 30-day / all-time totals cards, and the most useful part — **equivalency widgets** that translate kilograms of CO2 into "number of mature trees absorbed in one year," "liters of gasoline burned," and "km driven in an average car"
  - **Climate** tab: Open-Meteo current conditions (temperature, humidity, wind, pressure, condition code) + 7-day forecast with daily min/max (latitude/longitude auto-default to Beijing, overridable), 24-hour local-cache so the app is still useful on flaky networks
  - **Goal** tab: monthly reduction target (kg) with adjustable slider, YTD bar chart (each month vs. target), and an offset-suggestions list (bike commute one day/week, meat-free one day/week, LED bulbs, line-dry laundry, shorter showers) with kg/year savings per action
  - All records persist to localStorage under namespaced keys; import/export JSON for backup and cross-device transfer
- Version metadata aligned to v122.0.0 across `package.json`, README badge, and boot banners. The three new applications are registered in `APP_REGISTRY_EXTRAS` and `WindowManager.componentMap` as Vite lazy-loaded chunks, so they do not increase the initial page-load bundle size.

## What's New in v120

This release ships **two focused production-grade tools** — an everyday dashboard that actually replaces three separate tabs, and a pre-launch checklist that every web developer should walk through before shipping. They share the same philosophy as the rest of WebLinuxOS: real APIs, local persistence, no placeholder UI.

- **SmartDailyHub · 智能每日中心** — A morning dashboard that brings together everything you check before sitting down to work, in one window and with graceful offline fallback.
  - **Live weather** via Open-Meteo (geolocation auto-detect, optional manual city search, 7-day forecast, 24-hour temperature curve, per-card cache with stale-while-revalidate)
  - **Hacker News front page** via the Algolia HN Search API — real-time, sortable by points/date, click-through to comments and original article, with per-story opening-state persistence
  - **Daily quote** via ZenQuotes — rotating inspirational quotes with author attribution, previous/next navigation, copy to clipboard
  - **Personal utilities**: todo list with priorities, water-intake tracker with daily goal and progress ring, pomodoro-style focus timer with keyboard shortcuts, next-holiday countdown for major dates, and a developer-efficiency score computed from the daily todo + focus data
  - Everything that can be saved is saved to localStorage under a single key, and every API fetch has a cached offline fallback so the dashboard is still useful on an airplane Wi-Fi that drops the weather endpoint
- **WebDevChecklist · 开发者发布检查清单** — 100+ concrete, non-negotiable checks every site should pass before it goes live, organized into ten groups and built for real audits, not demos.
  - Ten top-level groups: **Performance, SEO, Accessibility (a11y), Security, Responsive, Cross-Browser, Code Quality, DevOps, Content Compliance, Technical SEO**. Every item is actionable, not vague — e.g. not "check images" but "Serve images in next-gen formats (WebP/AVIF) with `<picture>` fallback for older browsers".
  - Progress analytics: overall completion percentage, per-category ring charts, a four-tier rating (Perfect / Strong / Fair / Needs Work) with copyable summary, and category-level pass/fail counts
  - Operable by humans doing real audits: free-text search across item titles and descriptions, filter chips (All / Remaining / Critical-only), collapsible group sections with smart collapse/expand all, critical items highlighted with a severity indicator
  - Export your work in two formats: **Markdown** (ready to paste into a PR description or Notion page, with `- [x]` / `- [ ]` checkboxes and per-category headings) and **JSON** (for archiving, diffing between audits, or feeding into a CI bot)
  - Checklist state is persisted across sessions; one-click Reset All returns the sheet to a clean slate
- Bumped app version metadata to v120.0.0 across `package.json`, `index.html`, the boot-animation banner, and the README badge. Both new apps are registered in `APP_REGISTRY_EXTRAS` and the `WindowManager` component map as lazy-loaded chunks, so they do not inflate the initial page-load bundle.

## What's New in v118

This release ships **LexiconForge**, a single focused tool that turns the browser into a real, API-backed writing companion — for poets who need a rhyme, students hunting synonyms, language learners drilling homophones, or crossword players stuck on `?oat`.

- **LexiconForge · 词语锻造坊** — A multi-mode word toolkit backed by the free Datamuse corpus API (no key, CORS-friendly, with a proxy fallback for restricted networks)
  - Seven modes in one window: perfect rhymes (`rel_rhy`), near rhymes / slant rhymes (`rel_nry`), synonyms (`rel_syn`), antonyms (`rel_ant`), associated/triggers (`rel_trg`), homophones (`rel_hmg`), and spelling-pattern matches (`sp=` — supports `*` and `?` wildcards for Scrabble and crossword puzzles)
  - Each result shows the word, syllable count, frequency score, and an expandable in-line definition pulled from the same Datamuse `md=fdp` metadata payload — no second API call needed
  - Syllable-count filter chips, word-frequency ordering, one-click copy to clipboard, a 200-item favorites wordbook, and a 50-entry searchable history
  - 24-hour in-memory + localStorage cache so repeated queries are instant and the API stays well under Datamuse's soft rate limit
  - Editorial ink-and-parchment aesthetic: serif display type for words, monospace accents for metadata, warm amber on deep indigo (dark) / ink-brown on cream (light) — theme-aware via `resolvedTheme` so `auto` users get the correct palette
- Bumped app version metadata to v118.0.0 across `package.json` and the README badge; LexiconForge is registered in `APP_REGISTRY_EXTRAS` and the `WindowManager` component map as a lazy-loaded chunk.

## What's New in v117

This release ships **three purpose-built productivity applications** that turn WebLinuxOS into a genuinely useful daily workstation — a meme studio you can actually use in group chats, an interview prep trainer with real runnable code, and a scientifically grounded motivational dashboard with live public APIs.

- **MemeGenerator · 表情包工坊** — Local meme generation studio with zero server dependency
  - 8 preset classic templates (Drake Hotline Bling, Distracted Boyfriend, Two Buttons, Change My Mind, Woman Yelling at Cat, Is This a Pigeon, Expanding Brain, American Chopper)
  - Canvas-based realtime rendering with auto word-wrap and CJK character-aware line breaking
  - Per-textarea styling: font size, fill color, stroke color, font family, uppercase toggle, global stroke-width control
  - Local image upload with automatic dual text-area positioning
  - One-click **copy to clipboard as PNG** (compatible with WeChat / Feishu / DingTalk / email paste) and PNG download
  - Favorites system, last-used history, custom-template library (persisted to localStorage, 50-item cap)
  - CORS fallback chain (external template → picsum seeded placeholder → generated gradient) so the app never blank-screens on restricted networks
- **TechInterviewPrep · 技术面试刷题助手** — Interview training tool with real JavaScript execution inside the app
  - 30+ curated real questions across 8 categories: algorithms & data structures, frontend, backend, databases, computer networking, operating systems, behavioral, and system design
  - Difficulty triage (easy / medium / hard) with LeetCode source links and tags
  - Three dedicated views: Practice mode (with hints and graded reveal), Question library (filterable/searchable grid), Statistics dashboard (streak tracking, correct rate, progress KPIs)
  - Inline **sandboxed JavaScript executor** (captures console.log/warn/error with millisecond timing) so you can run Two Sum, reverse list, and event-loop code samples without leaving the app
  - Full filter engine: by category, by difficulty, by attempt status (unsolved / correct / wrong / attempted / bookmarked), full-text search across title/tags/body
  - Custom question importer, user bookmark library, streak calendar with per-day activity, all data persisted to localStorage
- **MotivationalDashboard · 励志仪表盘** — Five-module mental-wellness and focus tool grounded in positive psychology research
  - **Daily Quote tab** — Real quote APIs (ZenQuotes.io + Stoic.themotivate365.com fallback) with 34-entry local quote bank (Chinese classics + English) for offline resilience, Lorem Picsum inspirational imagery, copy/share/save to collection, and 15-entry history browser
  - **Breathwork tab** — Four guided breathing patterns (4-7-8 Dr. Weil sleep, Box square-breathing, 5-5 balanced, rapid-energy) with Web Audio Solfeggio chimes on phase transitions and a cumulative cycle counter
  - **Today's Goals tab** — Goal tracker with percentage ring, quick-add preset chips (read 30m / meditate 5m / drink 8 cups etc.), and completion-delight gold gradient
  - **Gratitude Journal** and **Small Wins Wall** — Both backed by Seligman's three-good-things methodology with in-app explanation of the 6-month 36%-depression-reduction study result; both support template chips, Ctrl/Cmd+Enter quick-submit, and custom templates
  - Eight theme gradients (Aurora / Sunset / Ocean / Forest / Starry Night / Peach / Warm Sun / Calm) with glassmorphism overlays, motivational quote, programmer-joke side panel, and all-state persistence
- Aligned version metadata across package.json, index.html meta tags, Open Graph/Twitter cards, and boot-loader banners to v117.
- Three new entries registered in `APP_REGISTRY_EXTRAS` and `WindowManager.componentMap`; all three are lazy-loaded chunks in the Vite build.

## What's New in v116

This release introduces **two real, useful applications** — a Pomodoro timer that broadcasts SomaFM public radio streams, and a public API utility toolkit.

- **PomodoroFocus · 番茄电台** — 番茄钟 + SomaFM 公开电台 + 任务看板 + 专注统计
  - Three-phase Pomodoro timer (focus / short break / long break) with custom durations
  - 8 real SomaFM MP3 streams (Drift Zone, Indie Pop, DEF CON Radio, Secret Agent, …)
  - Web-Audio-based end-chime (no external sound files needed)
  - Task kanban with Pomodoro allocation
  - 7-day focus bar chart with daily totals
  - All data persisted in `localStorage`
- **UtilityStack · 公共API工具集** — A five-tab toolkit of free public APIs, no keys required
  - IP geolocation (ipapi.co) with custom IP lookup + OpenStreetMap link
  - Random advice / quotes with favorites (Advice Slip API)
  - LoremFlickr image inspiration generator
  - Random craft beer explorer (Punk API)
  - Chuck Norris jokes (ChuckNorris.io)
- Build: 2 new lazy-loaded chunks registered in `APP_REGISTRY_EXTRAS`, Vite code-split automatically

## What's New in v115

This release introduces **DevRadar**, a developer-focused real-time tech news aggregator, along with boot performance improvements.

- **DevRadar (开发者技术雷达)** — A unified real-time information stream that aggregates three major developer data sources:
  - **Hacker News** — Fetches front-page stories via the Algolia HN API with scores and comment counts
  - **GitHub Trending** — Surfaces the fastest-growing new repositories from the past 7 days via GitHub Search API
  - **GitHub Releases** — Tracks the latest releases from 8 popular open-source projects (VS Code, React, Next.js, TypeScript, Tailwind, Vite, Prisma, shadcn/ui)
  - Features: multi-source filtering, popular/latest/trending sort modes, full-text search, local favorites with persistence, auto-refresh (5-min interval), detail panel, and language-colored tags
- **Boot animation optimization** — Increased progress increment rate for faster startup, especially in low-frame-rate environments

## What's New in v114

This release introduces **MindSync Pro**, a comprehensive five-module productivity center designed for daily use — not a mock-up, but a real tool you can actually rely on.

- **MindSync Pro · 效率中心** — An integrated personal productivity system with five dedicated modules:
  - **Pomodoro Timer** — Customizable focus/short-break/long-break intervals, optional audio cues (Web Audio API tones), auto-advance between sessions, task association that tracks pomodoros per task, animated progress ring, and today's session counter.
  - **Task Kanban** — Three-column board (To-do / Doing / Done), priority labels (high/mid/low), tag system, pomodoro estimate tracking, filtering by today and priority, inline state transitions and deletion.
  - **Habit Tracker** — 21-day visual heatmap grid, daily check-in buttons, auto-calculated streak and best-streak tracking, custom emoji and color coding per habit, completion-rate based stats.
  - **Daily Reflection** — Five-question journal template (mood selector, today's win, tomorrow's focus, gratitude, lessons learned), 7-day history sidebar, auto-save on blur, on-screen toast confirmations.
  - **Productivity Stats** — Aggregated 7-day bar charts (focus minutes + completed tasks), four KPI stat cards (today, total focus hours, tasks done, habit completion rate), and adaptive AI-style suggestions based on real user data.
  - All data persists via `localStorage` across browser sessions. No server required.

Version, metadata, and boot-message banners throughout the site have been aligned to v114 (previously split across v107/v109/v113).

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

### 600+ Integrated Applications

| Category | Highlights |
|----------|-----------|
| **Development** | Code editor (Monaco), terminal (200+ commands), JSON tools, regex tester, API client, Git visualizer, online code runner, code review bot, API hub, **TechInterviewPrep 面试刷题 (30+ real questions + sandbox executor, 8 categories)**, **NebulaDev Pro (JWT/CORS/DoH/Web Crypto/HTTP timing/URL/password — 全部本地计算或公开DNS)**, **AICommandPro · AI智能命令中心 (自然语言↔命令双向转换 + 风险评估 + 30项模板库)** |
| **Productivity** | **MindSync Pro (番茄钟/任务/习惯/反思/统计)**, DevFlow Pro, Pomodoro Studio, Kanban, TimeCapsule, Daily Dashboard, **PomodoroFocus 番茄电台 (SomaFM streams)**, **MotivationalDashboard (5-in-1 励志/呼吸/目标/感恩/成就)**, **QuantumHabit OS (原子习惯4法则 / 66天曲线 / 热力图 / 专注番茄钟整合 / 年度报告)** |
| **AI & Creative** | AI chat (Pollinations.ai), AI image generation, code analyzer, translation, prompt engineering lab, AI writing studio, AI code mentor, **MemeGenerator 表情包工坊 (Canvas realtime render + clipboard export)** |
| **Internet** | Web browser (DuckDuckGo search), weather (Open-Meteo), crypto tracker (CoinGecko), news (Hacker News), Wikipedia, GitHub trending, Global Travel Assistant, NexusHub, DataPulse Pro, **DevRadar (HN + GitHub Trending + Releases)**, **UtilityStack (IP+Quote+Image+Beer+Joke public API hub)**, **GlobalPulse · 全球脉动 (全球天气 / 汇率 / 加密 / HN / 世界时钟，带CORS兜底)**, **DevOpsHealthCheck · 网站健康诊断 (8类探测 / A+-F评分 / HTTPS / DoH DNS / CT日志 / RDAP / 安全头)** |
| **Data & Analytics** | **DataVerse Live · 多源实时数据画布 (9类卡片 / 拖拽缩放 / 布局持久化 / 9+公开API)** |
| **Office** | Markdown editor, spreadsheet, PDF viewer, presentation mode, smart notes with wiki-links, ResumeForge, MarkdownPublisher, SmartNotes Pro, **LanguageLab Pro (词典/翻译/闪卡/生词本)** |
| **Lifestyle** | **RecipeForge · 智能菜谱工坊 (TheMealDB + 购物清单合并)**, **EcoTrack Pro · 碳足迹追踪 (IPCC排放因子 / Open-Meteo / 目标与抵消)**, **EcoFoodPrint · 饮食碳足迹 (IPCC AR5 / FAO / Poore-Nemecek 87食物 · 水足迹 · 低碳替换建议)** |
| **System** | File manager, settings, system monitor (real data), password vault, app marketplace, system optimizer, CloudDrive, WebSSH, Workspace layout manager |
| **Multimedia** | Music studio, audio visualizer, paint, screen recorder, camera, AI image studio, ImageForge |
| **Collaboration** | Real-time collaborative whiteboard, document editor, code collaboration |
| **Games** | Tetris, Snake, 2048, Breakout, dice roller, Regex Golf challenge |

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
- **SpaceX-API (r/SpaceX)** — launch history and live telemetry metadata
- **MyMemory** — translation service
- **Web Speech API** — speech synthesis and recognition
- **ZenQuotes.io** — daily motivational quotes (no key)
- **Official Joke API (appspot)** — programming jokes feed
- **TheMealDB** — structured recipe database with ingredients and instructions
- **Free Dictionary API** — phonetic pronunciation, POS, definitions, synonym/antonym payloads
- **Datamuse** — rhymes / near rhymes / synonyms / antonyms / homophones / spelling patterns
- **Cloudflare 1.1.1.1 DoH (JSON)** — public DNS over HTTPS for A/AAAA/MX/TXT/CNAME/NS/SRV/PTR lookups (CORS-enabled)
- **Stoic.themotivate365.com** — stoic philosophy quotes (backup)
- **SomaFM** — public internet radio MP3 streams (8 channels)
- **Picsum Photos (Lorem Picsum)** — inspirational imagery
- **Punk API (Brewdog)** — craft beer explorer
- **ChuckNorris.io** — jokes feed
- **Advice Slip** — random advice API
- **ipapi.co** — IP geolocation
- **Web Crypto API** — SHA/HMAC/AES-GCM/PBKDF2 (native to the browser, fully local; used for NebulaDev Pro crypto tools and JWT verification)
- **crt.sh (Sectigo Certificate Transparency log)** — public JSON endpoint used by DevOpsHealthCheck to retrieve SSL/TLS certificate issuer, SAN list, and not_before / not_after dates
- **RDAP (rdap.org) + IANA WHOIS** — registration / registrar / nameserver and expiry data for domain names; used in DevOpsHealthCheck with a JSON fallback
- **IPCC AR5 / FAO 2017 / Poore & Nemecek 2018 food emission factors** — compiled kg CO₂e per kg of food product + water footprints for 87 foods across 10 categories; powering the EcoFoodPrint calculator

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
