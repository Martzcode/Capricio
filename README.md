# Capricio — Fast Offline Decision Helper

Capricio is a fast, offline-first desktop decision helper built with Tauri, Angular & Rust. Make instant choices (coin flip, random number, lottery draw, wheel) or structured decisions (weighted pros/cons, multi-criteria matrix). Lightweight, private, local-only with history.

## Features

**Instant decisions (< 3 clicks):**
- Coin flip — customizable labels, <1s animation
- Random number — min/max range, no-repeat option
- List draw — pick 1 or N winners, with or without replacement
- Fortune wheel *(V2)* — visual draw with weighted segments

**Thoughtful decisions:**
- Weighted pros & cons — 3-level weights (V1), 1-10 scale (V2)
- Multi-criteria decision matrix *(V2)* — compare up to 8 options

**Transverse:**
- History — local chronological log, search & filters (V2)
- Light / dark theme with system detection
- Full keyboard navigation (Enter to redraw, Esc for home)
- 100% offline, no account, no telemetry, no ads

## Tech Stack

- **Frontend:** Angular 22 + TypeScript (strict), Signals, minimal CSS design system
- **Desktop shell:** Tauri 2.x (typed `invoke()` IPC, least-privilege permissions)
- **Core logic:** Rust (`rand`, unit-tested scoring & draw modules)
- **Storage:** Local SQLite (`rusqlite`, versioned migrations, JSON payloads)

Architecture: `Angular → Tauri IPC → Rust → SQLite`. All sensitive logic lives in Rust; Angular handles presentation only.

## Getting Started

Prerequisites: Node.js LTS, Rust stable, Tauri CLI prerequisites for your OS.

```bash
npm install
npm run start      # Angular dev server (http://localhost:1420)
npm run tauri dev  # Full desktop app in dev
npm run build      # Frontend production build
npm run tauri build # Native installers (.msi/.exe, .dmg/.app, .deb, .rpm, AppImage, .msix)
```

> Cold start < 1.5s, idle memory < 150MB, installer < 15MB (excl. native WebView).

## Roadmap

- **V1 MVP:** coin, random number, list draw, simplified pros/cons, light history
- **V2:** wheel, decision matrix, fine-grained weights, favorites/templates, advanced history
- **V3:** export (PNG/PDF/text), decision timer, personal stats
- **V4+:** same-device multiplayer, accessibility (screen readers), optional E2E-encrypted sync

See `docs/CDC – Application d'aide à la décision.md` for the full spec (French).

## Privacy by Design

Local-only storage. No cloud sync, no account, no tracking in V1. Future sync will be strictly opt-in and end-to-end encrypted.

## Platforms

Windows (MSI/NSIS/MSIX) · macOS (DMG, Intel + Apple Silicon) · Linux (DEB, RPM, AppImage for Fedora / Debian / Manjaro-Arch)

## Contributing

Lints: `clippy` / `rustfmt` (Rust), ESLint / Prettier (Angular). Rust logic must stay unit-tested (100% coverage on scoring & random). Keep UI sober per design principles in `docs/`.

## License

GPL-3.0 — see [LICENSE](LICENSE).
