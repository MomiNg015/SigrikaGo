# Excel library choice

## Context

The story guidance export/import MVP requires true `.xlsx` read/write support in the admin UI. The current project has no spreadsheet dependency.

## Current project

* `package.json` is a private ESM project using Vite + React for the admin UI and Express for the server.
* No existing `xlsx`, `exceljs`, SheetJS, CSV, or spreadsheet helper was found in `package.json`, `package-lock.json`, or `src/**`.

## Options checked on 2026-07-06

### `xlsx`

* npm package: `xlsx`
* Current npm version checked: `0.18.5`
* License: `Apache-2.0`
* Description: `SheetJS Spreadsheet data parser and writer`
* Unpacked size reported by npm: `7,499,035`
* Dependencies reported by npm: `cfb`, `ssf`, `wmf`, `word`, `crc-32`, `adler-32`, `codepage`
* Fit: Good for structured workbook read/write from arrays or JSON-like rows. The task needs deterministic sheets and import parsing more than advanced workbook styling.

### `exceljs`

* npm package: `exceljs`
* Current npm version checked: `4.4.0`
* License: `MIT`
* Description: `Excel Workbook Manager - Read and Write xlsx and csv Files.`
* Unpacked size reported by npm: `21,825,509`
* Dependencies reported by npm include `jszip`, `archiver`, `fast-csv`, `unzipper`, `readable-stream`, `dayjs`, `uuid`, and others.
* Fit: More feature-rich for styled workbooks and complex workbook manipulation, but heavier than needed for this MVP.

## Recommendation and decision

Initial technical recommendation was `xlsx` because it is enough for multi-sheet export/import and has a smaller dependency footprint than `exceljs`.

User decision on 2026-07-06: use `exceljs`.

Rationale to preserve for implementation: `exceljs` is heavier, but gives a richer workbook API for a more administrator-friendly `.xlsx` file, including clearer worksheet management and room for freezing headers, setting column widths, and styling guidance cells.

## Implementation notes

* Keep workbook mapping code isolated in a small utility module so changing libraries later does not affect `AdminOnboardingStory.jsx`.
* Treat the workbook as a versioned interchange format: include an export format version in the metadata sheet and validate it on import.
* Tests should cover data mapping without requiring browser download APIs.
