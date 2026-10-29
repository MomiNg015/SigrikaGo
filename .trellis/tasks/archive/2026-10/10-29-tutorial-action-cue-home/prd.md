# A 方案补充主界面引导样板

## Goal and scope
User selected A (contracting focus corners) and requests home onboarding in the existing sample. Keep this as sample refinement, with actual HomeScreen, HomeOnboarding and windows. Default to A plus the new handbook preview; retain battle scenarios and B/C for comparison. No production rollout yet.

## Requirements
- Five direct home entry scenarios: handbook/card selection, member details, match-mode expansion, mailbox (including phone menu), resume.
- Reuse real guide proxy clicks and step progression. Every highlighted component/window stays bright and carries A focus markers, including narration.
- Follow real target geometry and existing home dimming; cue never owns input, resizes targets or clips at viewport edges.
- User refinement: highlight the window/component's actual painted silhouette (rounding, transparent art, shadows), not a rectangular region cut out of the scrim. All highlighted surfaces, including member details and resume, retain full brightness with A corners. No selected surface means no marker.
- Navigation to a preview step uses real guide controls within an isolated local fixture. All API responses stay local; no actual rewards, purchases or matchmaking.
- Existing pause/replay, viewport selection and reduced motion work in both home and battle scenes.

## Acceptance
- [x] New home entries available in existing sample, default A.
- [x] Actual target clicks advance; every target/surface, including narration windows, stays bright and marked.
- [x] Desktop and portrait phone positioning and animated bounds verified.
- [x] Existing battle sample still works; docs, screenshots and checks updated.

## Checks
Scoped ESLint, browser interaction/geometry checks at 1440/390/320 widths, reduced-motion and pause/replay. System-design HTML regeneration and its tests.

Results: 15 home entry/viewport cases and 50 highlighted steps across complete phone/desktop tours passed. Every highlighted surface has a full-opacity, correctly aligned paint copy and A markers; original rectangular scrim path is absent. Proxy clicks, entry-opacity recovery, pause/replay, home/battle switching and reduced motion passed. No API network traffic or page errors. Existing 27 battle combinations passed, scoped ESLint and 4 system-design HTML tests passed. Screenshots inspected for handbook transparency, mode card, member details and resume; source components remain untouched.
