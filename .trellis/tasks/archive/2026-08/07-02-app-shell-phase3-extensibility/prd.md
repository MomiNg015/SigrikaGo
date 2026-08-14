# Phase 3 App Shell Extensibility Refactor

## Goal

Reduce the cost and risk of adding future player-facing features by narrowing the `App.jsx` composition surface and formalizing the route/overlay wiring contracts. This phase should make app-shell additions easier to register and review without changing current visuals, gameplay behavior, matchmaking, room recovery, or modal dismissal semantics.

## What I Already Know

* The user asked to start the previously proposed Phase 3 plan on a new branch.
* Current branch for this work is `codex/app-shell-phase3-extensibility`.
* `App.jsx` still passes large prop sets to `AppRoutes` and `AppOverlays`.
* `src/app/overlayRegistry.js` already owns overlay keys, show prop names, setter prop names, close-all behavior, and modal dismiss order.
* System design docs state that `useOverlayState`, `modalDismissal`, `useOverlayActions`, and `App.jsx` should derive overlay wiring from the registry so future overlay additions do not break matchmaking or room recovery.
* Existing app-shell tests use source-level contracts to prevent regressions around startup preload, overlay closing, mailbox/recruitment polling, tutorial battle fallback, and recovery screens.

## Assumptions

* This phase should be an architectural refactor with no visual redesign.
* The first slice should focus on route/overlay prop grouping and registration contracts, not on CSS cleanup, preload critical/deferred changes, or result persistence fixes.
* Both desktop and mobile behavior must remain unchanged because the app shell controls shared routes and modals across both viewports.

## Requirements

* Keep all current route behavior intact: login, startup preload, home, admin, room, match preload, and tutorial battle.
* Keep all current overlay behavior intact: match lifecycle modals, result modal, toasts, duel banner, story/onboarding, and all lazy business overlays.
* Reduce direct `App.jsx` to `AppRoutes`/`AppOverlays` prop sprawl by introducing focused adapter objects or helper builders that group stable concerns.
* Strengthen overlay registration contracts so new overlays can be checked through one registry-driven path.
* Preserve `closeAllOverlays`, top-modal dismissal, mobile/browser back behavior, and match/resume/replay flows.
* Add or update tests that prove the new app-shell wiring contract is registry-driven and does not reintroduce manual per-overlay close paths.
* Update system-design documentation because this changes frontend architecture/tech-debt facts, then regenerate `docs/system-design.html`.

## Acceptance Criteria

* [ ] `App.jsx` no longer passes every route and overlay primitive as a flat, manually maintained prop list where a focused adapter can own the grouping.
* [ ] `AppRoutes` and `AppOverlays` continue to render the same routes/modals and keep lazy-loading boundaries unchanged.
* [ ] Existing modal dismissal, `closeAllOverlays`, room resume, match-success/preload, and replay entry tests continue to pass.
* [ ] New or updated tests document the intended app-shell extension contract.
* [ ] `docs/system-design.md` or the relevant split docs describe the updated app-shell contract.
* [ ] `npm run docs:system-design` has been run.
* [ ] A focused test set for touched app-shell modules passes.

## Definition of Done

* Tests added or updated for the changed app-shell contract.
* No gameplay, socket protocol, CSS visual, or preload behavior changes unless required to keep the refactor working.
* Architecture docs updated and generated.
* Broad project verification status reported before handoff.

## Out of Scope

* Fixing result record persistence retry behavior from Phase 0.
* Rebalancing startup critical/deferred preload groups from Phase 2.
* CSS cleanup, Tailwind migration, or visual redesign.
* Adding new business overlays, routes, gameplay modes, or admin features.
* Multi-instance runtime or backend API changes.

## Technical Approach

Start with a narrow app-shell adapter layer:

* Group route-facing state/actions in a small module or helper near `src/app/AppRoutes.jsx`.
* Group overlay-facing state/actions in a small module or helper near `src/app/AppOverlays.jsx`.
* Prefer registry-derived overlay state/setter maps over repeated manual setter prop plumbing where practical.
* Keep `AppRoutes` and `AppOverlays` as presentational composition boundaries; do not move feature behavior into them.
* Keep synchronous match/result/toast/duel/story paths synchronous unless existing tests and docs already allow lazy loading.

## Decision (ADR-lite)

**Context**: The app already reduced some root debt through `useOverlayState`, `useRoomSessionState`, `useMatchSessionState`, `useIncomingDuelState`, `useMailboxSummary`, `useRecruitmentReadyState`, and `overlayRegistry`, but new features still require careful manual plumbing through `App.jsx`, `AppRoutes`, and `AppOverlays`.

**Decision**: Continue the existing pattern by adding focused route/overlay adapter contracts instead of introducing a new global state framework or redesigning the UI.

**Consequences**: The change should be lower risk than a broad app-shell rewrite, but it still touches central wiring. Tests must focus on behavior-preserving contracts and registry alignment.

## Technical Notes

* Relevant files inspected: `src/app/App.jsx`, `src/app/AppRoutes.jsx`, `src/app/AppOverlays.jsx`, `src/app/overlayRegistry.js`, `src/app/useOverlayState.js`, `src/app/useOverlayActions.js`, `src/app/useAppActions.js`, `src/app/App.test.js`.
* Relevant docs inspected: `docs/system-design.md`, `docs/system-design/01-project-overview.md`, `docs/system-design/02-frontend-architecture.md`, `docs/system-design/07-performance-tech-debt.md`.
* Relevant frontend spec index: `.trellis/spec/frontend/index.md`.
* Project instruction: architecture or tech-debt updates require updating system-design docs and running `npm run docs:system-design`.
