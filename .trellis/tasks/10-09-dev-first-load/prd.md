# Fix slow development first page load

## Goal
Remove the reported 1–2 minute stall after npm run dev without changing player behavior.

## Requirements
- Keep temporary build, test, release and agent artifacts out of Vite file watching.
- Scan index.html as the application dependency entry instead of all workspace HTML files.
- Preserve source/public hot reload, development proxy recovery and Pixi optimization boundaries.
- Preserve unrelated work in the dirty checkout and update system design documentation.

## Acceptance Criteria
- [x] A newly started Vite server displays the login page without the minute-long stall.
- [x] Regression coverage proves artifact directories are unwatched and source edits still trigger change events.
- [x] Relevant config/proxy tests, lint and production build pass.

## Scope
Development configuration only; no asset compression, preload behavior redesign or backend database changes.

## Evidence
- Warm localhost:5173 login: 1,084 ms, 300 requests, no pending requests.
- Fresh unmodified Vite on 5174 stalled and crashed with UNKNOWN watch error inside .codex-run/practice-local/gnugo-3.8.
- .codex-run: 30,248 files; .tmp: 78,016 files; src: 1,331 files.
- Explicit entry plus artifact watch exclusions: login in 8,938 ms, using a fresh temporary optimizer cache.
- Final configuration with a fresh optimizer cache under node_modules: login in 6,795 ms, repeat navigation in 1,068 ms; 290 watched directories and zero directories inside .tmp or .codex-run.
- Validation: 10 targeted tests pass; full lint passes; production build and system-design HTML generation pass. Build reports existing public-asset placeholders and the ExcelJS chunk-size warning.
- Installed Vite 6 computeEntries defaults to **/*.html and does not exclude these artifact directories.

## Decision
Apply narrow development scan/watch boundaries. The user reported the bug; this implementation preserves all current UI and runtime contracts.
