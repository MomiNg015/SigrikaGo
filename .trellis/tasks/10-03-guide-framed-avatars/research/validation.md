# Fixed guide avatar validation

2026-10-03. User-selected reference: fixed left speaker portrait, independent right paper with immediate name and progressively typed body. Body height remains dynamic.

## Implementation
- NpcDialogue keeps one portrait frame at the grid top; 88px desktop / 76px phone, separate text paper, 12px / 10px gap.
- Teaching/home selection and preloads use existing 256px expression avatars. Full story illustrations are unchanged.
- Home retains detached decoration outside scrolling copy, removing dialogueHeight and bottom coupling. Existing target avoidance continues using panel height.
- Image failure keeps the same fixed frame and legacy fallback; source changes retry the standard expression. Missing portrait uses a full-width text column.

## Verified
- Production-built story/teaching suite: 10 passed, including real typing at 1280x900, 390x844 and 360x640. Avatar rectangles remain identical while copy grows.
- Production-built complete home tours: 3 passed (1440x1000, 390x844, 360x640), including target clearance, input interception and completion.
- Additional real-typing home tests: 3 passed at the same widths; copy grows on phones and avatar stays fixed.
- Focused initial DOM/resource checks: 53 passed (includes one historical test mirror inadvertently discovered by the direct Vitest command; final project check excludes those mirrors).
- Extended lint comparison to HEAD: 11 pre-existing findings, zero new findings. Standard project lint follows the existing maintained-file configuration.
- Visual inspection of actual desktop and phone screenshots passed: fixed avatar, separate paper, immediate speaker name, readable text and no horizontal overflow.

## Evidence and limits
- Browser artifacts: `.tmp/guide-avatar-story-final`, `.tmp/guide-avatar-home`, `.tmp/guide-avatar-home-typing`.
- Review copies: `C:/Users/莫名/.codex/visualizations/2026/10/03/01a10096-6ecf-7742-ad47-eb100067cf86/guide-avatars/`.
- Browser suites use real production components with local fixtures; no live database or deployment validation is claimed.
- Initial browser failures exposed test timing: the animated entrance must finish before rectangle comparisons, first image decode needs a bounded longer wait, and the short Denia line must be held to avoid automatic progression during assertions. These were corrected without changing playback timing.
- The first CSS inventory attempt detected added hexadecimal fallback literals. Owners now use existing paper/ink tokens and system-color fallbacks; no CSS budget expansion is required.

## Full project gate
Project lint passed. Full Vitest sweep: 405 files / 2,894 tests, with 2,893 initially passing and one stale generated-HTML failure. After regenerating design HTML, all four tests in that failing file passed. Resource/portrait checks, default snapshot check, production build, built-CSS contracts and production sample configuration then passed. The remaining check stages were completed separately after this targeted repair; no second full Vitest sweep was needed. CSS inventory, style and theme contracts passed in the full sweep without budget changes.
