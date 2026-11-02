# Content card improvement samples

## Goal
Review warehouse, announcement and mailbox content cards and deliver three concrete, comparable interactive samples. Reading status must be independent from reward status. Improve useful density while retaining the established school-paper identity.

## Scope and decisions
- Standalone samples only under docs/design-samples/content-cards-2026-10-30. No production component, API, asset or CSS modifications.
- Three directions: compact directory; correspondence stationery; grouped state trays. Every direction covers all three surfaces with identical labeled fixture content.
- Use existing LXGW Marker Gothic and actual item images. Keep ink, cream, mint and pink palette. Avoid invented inventory categories, rarity or expiration facts.
- Desktop 1440x1000, portrait 390x844 and narrow 320x740. Desktop comparison shows all surfaces; mobile switches surface without horizontal document overflow.
- Provide usable selection/details, read and reward claim simulation, reset, keyboard focus and reduced motion. The prototype never calls application APIs.
- Reading and attachment statuses remain separate: unread with/without reward, read pending reward, read claimed, read without reward. Selected styling must not erase reading status.
- Announcement summaries are conceptual detail-derived excerpts; current list endpoint has no body preview. Any adoption must resolve this explicitly rather than fetch every detail invisibly.
- Audit persisted with source evidence; update docs/system-design.md and regenerate HTML, preserving existing WIP.

## Acceptance
- [x] Three working HTML variants and shared comparison entry.
- [x] All three surfaces inspected at desktop and portrait widths.
- [x] No page errors, missing local art, horizontal overflow; simulated state changes checked.
- [x] Screenshots and concise audit/tradeoffs delivered.

## Verification and handoff
Browser smoke verified all three versions at 1440x1000, 390x844, 320x740, including independent read/claim, reset, dialog keyboard close and focus restoration. Local auxiliary scripts pass ESLint; system-design HTML regenerated. Production untouched. Await user selection before any integration; the comparison artifact itself is complete.

## Out of scope
Production integration, server mutations, changing production navigation/motion, adding batch actions or classification fields.
