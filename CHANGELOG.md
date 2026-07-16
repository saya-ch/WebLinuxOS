# Changelog

All notable changes to WebLinuxOS are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **HTTP Status Explorer** — searchable reference of 60+ HTTP status codes with
  request examples and JavaScript error-checking snippets.
- **CSS Gradient Studio** — visual editor for linear/radial/conic gradients
  with 10 preset palettes and one-click CSS copy.
- **Git Cheatsheet** — 60+ Git commands across 8 categories with examples,
  usage notes, and a personal favorite system.
- **Pomodoro Studio** — focus timer with task list, daily/weekly statistics,
  streak tracking, browser notifications, and Web Audio cues.
- **API Health Monitor** — real-time availability and latency probing for
  16 public APIs with 30-second auto-refresh.
- **Activity Heatmap** — GitHub-style contribution graph that visualizes the
  user's WebLinuxOS activity over the last 26 weeks.
- **Regex Visualizer** — live regex testing with capture group inspection,
  flag toggling, 12 common presets, and click-to-navigate matches.

### Changed
- **`apiConfig.ts`** — replaced hardcoded API keys with environment variables
  (`VITE_*`) and a `demo_key` fallback. All third-party APIs that do not
  require authentication continue to work out of the box; paid services
  can be configured by the deployer without touching the source.
- **README.md** — rewritten to follow the conventions of high-star open
  source projects: clear highlights, architecture diagram, featured
  application matrix, complete keyboard shortcut tables, public API
  inventory, deployment guide, and contributor guidelines.
- **`WindowManager.tsx`** — registered the lazy imports for the new
  applications so they appear in the dock, launcher, and `ls /apps`.

### Security
- Removed hardcoded API tokens from `apiConfig.ts`. The previous
  configuration would have leaked keys to anyone running a production
  build. The new approach prefers key-less public APIs and exposes keys
  only through environment variables, never through the client bundle.

### Documentation
- Added `LICENSE` (MIT).
- Added `CHANGELOG.md` to track user-visible changes.
- Clarified the public API integrations table in `README.md`, including
  which services require keys and which are anonymous.
- Added a "Contributing" section with concrete guidance for adding a new
  app or terminal command.

## [Earlier releases]

Earlier changes are summarised in the git history. See
`git log --oneline` for the full timeline.
