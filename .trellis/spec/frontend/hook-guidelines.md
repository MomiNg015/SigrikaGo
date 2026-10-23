# Hook Guidelines

> How hooks are used in this project.

---

## Overview

<!--
Document your project's hook conventions here.

Questions to answer:
- What custom hooks do you have?
- How do you handle data fetching?
- What are the naming conventions?
- How do you share stateful logic?
-->

(To be filled by the team)

---

## Custom Hook Patterns

### Mobile modal scroll ownership

`App` mounts one `useModalScrollLock(shellRef)` on its stable application-shell ref. Ordinary and nested dialogs must use `.modal-backdrop` / `.nested-modal-backdrop` and mount within that shell (including portals). Do not infer modal presence only from `overlayState`: room-local, confirmation and nested dialogs also own scroll isolation.

While the mobile media query matches and a backdrop exists, lock document, shell and backdrop ancestor scrollers with temporary inline `overflow-y: hidden !important`, preserving the prior value and priority. Never reset scrollTop or fix body position. Keep the lock until the final backdrop disappears, restore individually when a nested backdrop closes, and clean up on media changes and Strict Mode unmounts. Observe only backdrop-bearing child-list changes, not every text/style mutation during a battle.

Non-passive touchmove/wheel guards may consume movement only when the nearest backdrop contains no scroll region with remaining capacity in that direction. Never walk into an underlying parent dialog. Preserve ordinary internal scrolling, tall scrollable backdrops, horizontal lists, range drags, multi-touch and Ctrl+wheel zoom; install listeners only during the lock. CSS containment alone does not protect non-scrollable headings, short dialogs or independent home scrollers.

Regression coverage belongs in `src/app/useModalScrollLock.dom.test.jsx` and `tests/e2e/modal-scroll.spec.js`. Test top/bottom boundaries, short content, nested portals, exact style/scroll restoration and real native touch input at portrait 320/390px. Desktop mouse-only scrolling must remain unchanged.

<!-- How to create and structure custom hooks -->

(To be filled by the team)

---

## Data Fetching

<!-- How data fetching is handled (React Query, SWR, etc.) -->

(To be filled by the team)

---

## Naming Conventions

<!-- Hook naming rules (use*, etc.) -->

(To be filled by the team)

---

## Common Mistakes

<!-- Hook-related mistakes your team has made -->

(To be filled by the team)
