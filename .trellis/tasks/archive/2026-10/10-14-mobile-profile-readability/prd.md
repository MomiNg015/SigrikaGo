# Mobile profile readability

## Goal and requirements
- Keep the username beside the avatar, on its right, on portrait phones.
- Inset play tabs, rank and recent-ten content from both paper edges.
- Enlarge character portraits, names, column labels and data without horizontal overflow.
- Preserve desktop layout, existing actions, equipped nameplates and one body scroller.

## Approach
Adjust the existing final mobile folder owner after inspecting computed styles. Share the fix across self and social profiles. Existing user instructions settle scope; no blocking questions.

## Acceptance and QA
- Check 320, 360, 390, 412px portrait and 1440px desktop with real components and fixture data.
- Verify name/avatar alignment, content gutters, character sizing, last-row reachability, long names and nameplates.
- Run focused profile and CSS suites, build, built-CSS checks and regenerate system design HTML.

## Out of scope
Data, API, gameplay and desktop redesign. Preserve unrelated workspace edits.

## Sources
src/styles/mobile-adaptive/profile-folder-mobile.css; ProfileResumeView.jsx; frontend CSS architecture and backend profile-folder contract.

## Follow-up requirements
- Use the desktop 24px portrait/name gap on mobile and explicitly align both centers, including the visible nameplate.
- Mobile replay cards follow the watch scoreboard: time/result at top, black/white player rows at left, move placard at right. Keep whole-card replay opening, pagination, historical portraits, friendly/team/special markers and desktop layout.
- Verify long names/results, 0/three/four-digit move counts, narrow screens and keyboard activation.
