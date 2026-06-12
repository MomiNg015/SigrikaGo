# Gacha System

## Goal

Add a full gacha system to SigrikaGo that lets players enter a distinctive but project-native gacha window from the home screen, draw from currently open pools, receive owned rewards, and review results. Admins can manage pools, opening windows, custom draw prices, featured prizes, and reward probability tables.

## Requirements

* Home screen adds a gacha entry button with a gacha icon and label, consistent with existing lobby utility entries.
* Player-facing gacha tabs show only enabled pools that are currently open. Pools outside their open window do not appear in the tab list.
* Each pool tab shows the pool name, featured prize image, and concrete open-date range as `YYYY/MM/DD-YYYY/MM/DD`; permanent pools show a permanent-open label.
* Each pool has admin-configurable single-draw and ten-draw coin prices, defaulting to 50 and 500.
* The selected pool view shows featured prize art, remaining open time, round icon buttons for prize list and draw history, coin and blue-gem wallet values, and single/ten draw buttons.
* Prize-list button opens a modal with all pool prizes, quantities, and probabilities.
* Draw-history button opens a modal with the current user's gacha records.
* Drawing plays a short gacha animation before showing a result modal for the current draw.
* Admin gacha management can create, update, and disable pools; set open window or permanent-open mode; set custom draw prices; set a featured prize; and manage pool prizes.
* Pool prizes can be existing characters, decorations, items, music tracks, or coins. The pool stock is infinite; prize quantity means how many units are granted when that prize is hit.
* Enabled drawable pools must have enabled prize probabilities totaling exactly 100%.
* Reward settlement:
  * Coins add the configured coin quantity.
  * Items add the configured item quantity.
  * A new character, decoration, or music prize unlocks the asset; extra units in the same hit settle as duplicates.
  * Duplicate decorations and music convert to 1 blue gem per unit.
  * Duplicate characters add 1 character chain per unit.
* Blue gems are exposed as account currency and displayed in shop and resume surfaces.
* Character chain counts are shown anywhere character portrait art is displayed: 1-5 chains show yellow stars; over 5 shows a yellow star icon with `*n`.
* Gacha draws and draw rewards are persisted for player history and admin traceability.
* `docs/system-design.md` must be updated with the new system model, APIs, UI flow, and reward-settlement contracts.

## Design Requirements

* Use the project style rather than a generic casino/gambling skin: the concept is a "school-club capsule machine" with paper, sticker, coin-slot, capsule-window, and soft arcade details.
* Keep the Bright School/home modal personality: compact, tactile, readable, playful, and not dominated by purple gradients, dark slate, beige, or one-color palettes.
* Use Lucide icons for entry, wallet, list, history, close, and admin controls.
* Round icon buttons must have 44px or larger hit areas, visible focus state, tooltip/title text, and aria labels.
* Motion must be meaningful:
  * draw button press feeds a coin/capsule cause-effect sequence;
  * gacha animation uses transform/opacity only;
  * result modal appears after animation completion;
  * reduced-motion users skip to a short static reveal.
* Animation should last long enough to feel special but not block the user unnecessarily; target 900-1400ms for normal draw reveal, shorter for reduced motion.
* Admin UI remains utilitarian and dense, following existing admin table plus drawer patterns.

## Acceptance Criteria

* [ ] Home users can open the gacha window from the lobby.
* [ ] Only currently open pools appear in player tabs.
* [ ] Pool tabs display name, featured image, and concrete date range.
* [ ] Selected pool displays featured art, remaining time, prize-list/history buttons, wallets, and draw buttons.
* [ ] Single/ten draw prices come from pool configuration.
* [ ] Draw attempts fail cleanly for insufficient coins, missing pool, closed pool, disabled pool, or invalid probability table.
* [ ] Successful draws deduct coins, settle rewards, update public user fields, and persist draw history.
* [ ] Duplicate decoration/music rewards convert to blue gems.
* [ ] Duplicate character rewards increase chain count.
* [ ] Shop and resume show blue gem balance.
* [ ] Character portrait surfaces show chain badges.
* [ ] Admins can manage pools, prices, featured prize, open times, and prizes.
* [ ] `docs/system-design.md` is updated.
* [ ] Targeted tests and `npm run check` pass before handoff.

## Technical Approach

* Add gacha database models in Prisma plus a migration and any local SQLite startup guard needed by current project conventions.
* Add focused backend domain modules for gacha validation, pool listing, draw execution, reward settlement, and history projection.
* Mount authenticated player gacha routes behind `/api` and admin gacha routes behind `/api/admin`, following existing route-boundary patterns.
* Reuse existing asset parsing/sync utilities for owned characters, decorations, items, and music; extend public user projection for blue gems and character chain counts.
* Add gacha overlay state through the existing app shell and `AppOverlays`, keeping current-user updates centralized through `updateUser`.
* Build frontend gacha components as a focused modal family with CSS in the existing style layer structure.
* Add admin gacha management beside existing admin catalog tools, following table plus CRUD drawer conventions.

## Decision (ADR-lite)

Context: The feature spans account currency, admin catalog management, player-facing draw UX, reward persistence, and existing asset ownership models.

Decision: Implement gacha as a first-class catalog/reward subsystem, not as shop items. Player APIs expose only currently open pools. Admin APIs manage all pools. The UI uses a distinctive school-club capsule-machine treatment while preserving existing modal, admin, wallet, and asset-display conventions.

Consequences: The feature has more upfront model/API work than a purely frontend modal, but it preserves auditability, supports future pity/limited-event extensions, and keeps the player UI simple by hiding closed pools.

## Out of Scope

* Pity counters, guarantees, banners by rarity, paid currency, refunds, trading, or blue-gem spending.
* Consuming pool inventory; all pool prize stock is infinite.
* External video animation assets. The first implementation uses CSS/React animation.
* Showing closed or upcoming pools in the player gacha UI.

## Technical Notes

* Trellis task created at `.trellis/tasks/06-12-gacha-system`.
* User explicitly requested Trellis workflow and the `frontend-design`, `ui-ux-pro-max`, and `interaction-design` skills for window, interaction, and animation design.
* `ui-ux-pro-max` script files are unavailable as executable scripts in this local install; the rules from `SKILL.md` were applied manually.
* Relevant existing patterns: shop purchase/domain modules, commerce route boundary, admin table/drawer CRUD, public user projection, user asset sync helpers, home overlays, modal wallet display, and Bright School responsive modal rules.
