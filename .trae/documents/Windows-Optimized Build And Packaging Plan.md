## Overview
- Make the Electron/Vite app compile reliably on Windows and produce an installer and portable exe.
- Reduce disk usage to avoid ENOSPC errors and scope tooling to project sources only.
- Keep existing working executables usable, while enabling a clean, reproducible build path.

## Issues Found
- Build fails with ENOSPC (no space left) during Vite/Rollup output.
- Lint previously scanned non-source files; current config now scopes to `src` but build scripts still risk heavy writes.
- Electron loads frontend via local HTTP server, includes Python/Go sidecars; packaging must unpack `backend/` correctly.

## Proposed Changes
- Build scripts: add Windows-safe clean and minimal build scripts to reduce writes; add Windows-specific build.
- Vite config: add `vite.config.windows.js` for smaller bundles, no source maps, chunk splitting, Chrome target.
- Electron main: keep URL load micro-server, but add a Windows main (`main-windows.cjs`) without devtools for production.
- Electron-builder: ensure `asar` with `asarUnpack` for `backend/**`, exclude temp/extracted folders, output to `dist_electron`, Windows targets `nsis` and `portable`.
- Reuse existing executables: provide launcher/optimizer scripts; optional portable packaging if build space remains tight.

## Implementation Steps
1. Scripts
- Update `package.json` scripts:
  - `build:windows`: `vite build --config vite.config.windows.js && electron-builder --win`
  - `clean`: Windows-safe removal of `dist`, `dist_electron`, `node_modules/.cache`
  - `electron:pack`: `electron-builder --win --portable`
- Add batch helpers: `build-simple.bat`, `build-windows.bat`, `launch-study-buddy.bat`, `optimize-windows.bat`.

2. Vite
- Add `vite.config.windows.js`:
  - `base: './'`, `sourcemap: false`, `minify: 'terser'` with `drop_console`, split vendor chunks, `target: 'chrome88'`.

3. Electron
- Add `electron/main-windows.cjs`:
  - Preload, `contextIsolation: true`, `webSecurity: true`, serve `dist` via local HTTP server in production, no DevTools.
- Keep sidecars but guard starts; packaged path uses `app.asar.unpacked`.

4. Electron-builder
- Ensure config includes:
  - `directories.output: 'dist_electron'`
  - `files`: include `dist/**/*`, `electron/**/*`, `backend/**/*` and exclude temp/extracted folders
  - `asarUnpack`: `backend/**/*`, `electron/**/*`
  - `win.target`: `nsis`, `portable`, `icon: public/icon.png`

5. Disk Space Mitigation
- Run `clean` before builds; purge npm cache.
- If ENOSPC persists, skip full rebuild and use existing `Nabster_Study_Buddy_Portable` or `StudyBuddy_EXE_Release` executables with optimizer launcher.

## Verification
- Development: `npm run dev` launches Vite + Electron.
- Production build: `npm run build:windows` creates `dist` and `dist_electron` installer/exe.
- Portable: `npm run electron:pack` or use existing portable folder; run `launch-study-buddy.bat`.
- Manual test: open generated exe, confirm window loads, tray works, sidecars don’t crash; check backend paths resolved.

## Deliverables
- Updated `package.json` scripts.
- New `vite.config.windows.js`.
- New `electron/main-windows.cjs` (production use).
- Batch scripts for cleaning/building/launching.
- Build artifacts in `dist_electron` and a ready-to-run portable exe.

Please confirm and I will apply these changes and execute the build, or fall back to the existing portable exe if disk space is insufficient.