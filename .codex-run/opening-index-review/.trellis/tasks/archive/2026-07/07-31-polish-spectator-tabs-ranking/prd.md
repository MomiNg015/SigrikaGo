# Polish spectator tabs and ranking numbers

## Goal

Refine the existing Bright School player-facing modal styling so the watch-list mode tabs read as a clean, aligned control row and leaderboard rank numbers no longer carry their own colored fill.

## Requirements

- Keep the watch-list mode buttons, selected state, room counts, labels, and interaction behavior unchanged.
- Center each watch-list mode label and room-count element horizontally and vertically inside its button.
- Make only the watch-list mode-tab wrapper transparent by removing its background and border.
- Remove the colored background from leaderboard rank-number elements on desktop and portrait mobile, including current-user and pinned-current rows.
- Preserve leaderboard row-level current-user, gold, silver, and bronze treatments.
- Preserve existing desktop and portrait-mobile layouts and touch targets.

## Acceptance Criteria

- [x] `.watch-list-modal .mode-tabs` has no visible background or border.
- [x] `.watch-list-modal .mode-tabs button` explicitly centers its child elements on both axes.
- [x] Watch mode labels and room-count badges remain present and selected-state styling remains unchanged.
- [x] Every Bright School current-user leaderboard rank-number rule uses a transparent background.
- [x] Current-user row surfaces and top-three row artwork remain unchanged.
- [x] Targeted WatchModal and LeaderboardModal tests pass.
- [x] System-design Markdown and generated HTML stay synchronized.

## Definition of Done

- CSS contract tests cover the transparent wrapper, centered tab contents, and transparent leaderboard rank numbers.
- Relevant lint/tests and documentation generation pass.
- No unrelated visual, interaction, or data behavior changes.

## Technical Approach

Use the existing feature-owner CSS rather than component markup changes. Update `src/styles/lobby/watch-list.css` for the watch-list-only wrapper and button alignment. Remove current-user rank-number fills from every existing Bright School desktop/mobile winner so cascade order cannot restore them. Update focused modal tests and the existing UI/theme system-design notes.

## Decision (ADR-lite)

**Context**: The shared `.mode-tabs` class is used by several player surfaces, while current-user leaderboard styling is repeated in multiple Bright School cascade layers.

**Decision**: Scope tab-wrapper transparency to `.watch-list-modal .mode-tabs`, retain the individual button visuals and interaction states, and synchronize all existing Bright School rank-number overrides to `background: transparent`.

**Consequences**: The requested two surfaces change without altering other mode-tab consumers, leaderboard row emphasis, component markup, or animation behavior.

## Out of Scope

- Redesigning the individual tab buttons or count badges.
- Changing mode order, labels, counts, keyboard semantics, hover/press motion, or loading behavior.
- Removing current-user row highlighting or top-three leaderboard artwork.
- Restyling profile/resume mode tabs or other segmented controls.

## Technical Notes

- Screenshot reviewed: `C:\Users\Moming\AppData\Local\Temp\codex-clipboard-d60fb901-fcba-4cf7-b28b-99378472a3a3.png`.
- Frontend trio applied: `frontend-design`, `ui-ux-pro-max`, and `interaction-design`.
- `ui-ux-pro-max`'s optional design-search script is absent from the installed skill directory, so its loaded layout, accessibility, consistency, and interaction checklists are used directly.
- Primary files: `src/styles/lobby/watch-list.css`, Bright School leaderboard winner CSS, `src/modals/WatchModal.test.js`, `src/modals/LeaderboardModal.test.jsx`, `docs/system-design.md`, and `docs/system-design/06-ui-theme-mobile.md`.
