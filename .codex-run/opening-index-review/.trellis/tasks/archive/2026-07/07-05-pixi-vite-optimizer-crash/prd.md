# Fix Pixi Vite Optimizer Skill Effect Crash

## Goal

Prevent local Vite development sessions from serving stale Pixi renderer optimized-dependency chunks that can break board skill effects and push the app into the error boundary.

## What I Already Know

- The reported dev-client error requests `node_modules/.vite/deps/WebGLRenderer-SC4YJILH.js?v=26ada6a4`, but the active dev server metadata and generated `pixi__js.js` reference `WebGLRenderer-FYWZGGWA.js?v=26ada6a4`.
- Manual requests to the running dev server return 404 for the stale `SC4YJILH` renderer chunk and 200 for the current `FYWZGGWA` renderer chunk.
- Pixi-backed skill effects are loaded through `src/room/pixiPrewarm.js` and `src/room/BoardSkillEffects.jsx`.
- Production build output uses the Rollup `pixi-vendor` chunk and does not request `node_modules/.vite/deps/WebGLRenderer-*.js`.
- The existing `scripts/viteBuildConfig.test.js` owns Vite build and dev-server config contracts.
- After excluding Pixi entries, live dev-room reproduction no longer crashes but the board effect layer can fail while preparing because Pixi source modules load raw nested dependencies such as `eventemitter3` or `@xmldom/xmldom`; those CommonJS/conditional-export dependencies need to remain optimized for ESM interop.

## Requirements

- Exclude Pixi's runtime entry points from Vite dev dependency optimization so renderer dynamic imports are served from source modules rather than stale immutable `.vite/deps` chunks.
- Explicitly include Pixi's nested runtime dependencies in Vite dev dependency optimization so the excluded Pixi source path does not load raw CommonJS without the default or named exports Pixi imports.
- Keep existing production manual chunking for React, Socket.IO, and Pixi unchanged.
- Keep the `/socket.io` dev proxy quiet-error handling unchanged.
- Update system-design docs because this changes local development runtime behavior for Pixi skill effects.

## Acceptance Criteria

- [ ] `scripts/viteBuildConfig.test.js` fails before the config change when expecting Pixi optimizer exclusions.
- [ ] `vite.config.js` declares optimizer exclusions for `pixi.js` and `pixi.js/unsafe-eval`.
- [ ] `vite.config.js` declares optimizer inclusion for Pixi nested runtime dependencies including `pixi.js > eventemitter3` and `pixi.js > @xmldom/xmldom`.
- [ ] Existing Vite manual chunk tests still pass.
- [ ] `npm run build` still succeeds.
- [ ] `npm run docs:system-design` regenerates `docs/system-design.html`.

## Definition of Done

- Tests added or updated for the changed Vite contract.
- Targeted tests pass.
- Production build passes.
- System-design Markdown and generated HTML are synchronized.

## Technical Approach

Add a focused config contract test in `scripts/viteBuildConfig.test.js`, then update `vite.config.js` with `optimizeDeps.exclude` for Pixi entries and `optimizeDeps.include` for Pixi nested runtime dependencies. Document that Pixi skill effects are intentionally not pre-optimized in dev because Pixi lazily imports renderer modules whose optimized chunk filenames can drift across dev-server/browser-cache state, while its nested CommonJS/conditional-export dependencies still need pre-bundling.

## Decision

Context: The failing URL is a Vite dev-only optimized dependency file for Pixi's WebGL renderer. The app's Pixi effect error handling already keeps ordinary renderer failures inside the effect layer, but a stale dev optimized module can fail before the live Pixi renderer module graph is coherent.

Decision: Exclude Pixi runtime entries from Vite dependency optimization instead of changing skill-effect presentation logic, but keep Pixi nested runtime dependencies in the optimizer because Pixi's source ESM imports default and named exports from CommonJS/conditional-export packages.

Consequences: Dev startup may do a little more native-module transform work for Pixi on first use, but it avoids long-lived immutable optimized renderer URLs. Production chunking remains unchanged.

## Out of Scope

- Redesigning skill animations.
- Adding DOM/CSS fallbacks for Pixi skill effects.
- Changing game skill resolution, target rules, or server room timing.
- Changing production cache headers.

## Technical Notes

- Relevant spec: `.trellis/spec/frontend/quality-guidelines.md`, "Startup preload, build chunking, and handoff check contracts".
- Relevant tests: `scripts/viteBuildConfig.test.js`, `src/room/pixiPrewarm.test.js`, `src/room/BoardSkillEffects.test.js`.
- Relevant docs: `docs/system-design.md`, `docs/system-design/02-frontend-architecture.md`, and generated `docs/system-design.html`.
