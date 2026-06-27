# Install frontend visual dependencies

## Goal

Install frontend visual dependencies so the project can later add hand-drawn notebook decoration with Rough.js and low-intrusion Tailwind utility classes that fit the Bright School visual direction.

## Requirements

* Add `roughjs` as a runtime dependency in the existing npm project.
* Add Tailwind CSS and the official Vite integration as development dependencies.
* Configure Tailwind without preflight/global resets so it does not override existing Bright School CSS contracts.
* Use a `tw:` prefix for Tailwind utility classes to avoid collisions with existing class names.
* Preserve existing uncommitted `package.json` changes.
* Do not add UI usage, demo components, or visible behavior in this task.
* Verify the package can be imported by the current Vite/Node module setup.

## Acceptance Criteria

* [x] `package.json` lists `roughjs` under `dependencies`.
* [x] `package-lock.json` is updated consistently.
* [x] A Node ESM import check for `roughjs` succeeds.
* [x] `package.json` lists `tailwindcss` and `@tailwindcss/vite` under `devDependencies`.
* [x] Vite is configured with the Tailwind plugin.
* [x] Tailwind utilities are available through a prefixed no-preflight CSS entry.
* [x] Production build succeeds.

## Definition of Done

* Dependency install succeeds.
* Tailwind Vite integration is wired without preflight.
* Minimal import verification succeeds.
* Existing unrelated dirty files are left untouched.

## Technical Approach

Use `npm install roughjs` for the runtime drawing dependency and `npm install -D tailwindcss @tailwindcss/vite` for the build-time Tailwind integration. Wire Tailwind through Vite and an import-only CSS entry that imports Tailwind theme/utilities with `prefix(tw)` and omits preflight.

## Out of Scope

* Building Rough.js UI wrappers.
* Applying Rough.js to desktop or mobile screens.
* Using Tailwind classes in production UI.
* Replacing the existing Bright School CSS architecture.

## Technical Notes

* Project uses React 19, Vite, regular CSS theme layers, and an existing `package-lock.json`.
* `package.json` already has unrelated uncommitted script changes; this task must preserve them.
