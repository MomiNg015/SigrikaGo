# Entry surface corrections

## Goal
Apply the user's three screenshot corrections to the entry loader and login/registration form.

## Requirements
- Center the complete loading Tip and place `（第一次加载需要2-3分钟，请耐心等待）` immediately below the progress bar.
- Keep login/register cards opaque. Remove the added stone/cross-line corner decoration per follow-up feedback.
- Move registration field errors to the label's right edge in place of idle notes. Restore notes after correction. Keep card width/height unchanged on local and server errors.
- Preserve validation, authentication requests, mascot/title composition, and unrelated profile/design WIP.

## Implementation
- Existing loader gets an optional progressNote used only by LoginAssetPreloadScreen.
- Existing form feedback component switches between note and error; only the username row reserves two text lines; the password rows are compact. Form-level errors use the bottom padding without adding an empty grid row.
- Existing theme CSS owner paints opaque cards; the rejected decorative SVG and its CSS are removed. Repeated password-control state prefixes are nested without changing selector specificity or order.

## Validation
- Browser coverage at 1440/390/360/320px: 8 cases passed; desktop and 320px screenshots inspected.
- Existing design-hook color/radius findings refer to unchanged palette and control values; no suppressions added. New card fill reuses the theme token; black/white stones follow the requested decoration.
- Focused unit/DOM, CSS and documentation suites: 167 tests passed across the final targeted runs. Maintained-file ESLint, production build and built-CSS contracts passed. CSS size budgets passed without a baseline increase.
- Shared AssetPreloadScreen has pre-existing hook dependency lint debt and remains outside the maintained-file lint list; its two-line prop/render change is covered by loader tests and the build. Existing unrelated admin snapshot drift remains outside this task.

## Compact-layout follow-up
- Removed all added stone/cross-line markup and styles.
- Registration uses 10px form gaps, 30px username labels and 24px password labels. Server errors sit in the bottom padding with 10px extra bottom space to clear the submit shadow.
- Browser regression checks enforce compact submit spacing, no decoration, unchanged card geometry through errors, and unobstructed server feedback at 1440/390/360/320px.
- Design-hook findings for #6b5d5a, #d8507a and the existing 10px password-toggle radius are unchanged intentional owner styles, not introduced by this correction; no suppression added.
- Follow-up verification: 4 browser cases at desktop/390/360/320px passed, along with 108 relevant auth/CSS/document tests across targeted runs and changed-file ESLint. Registration height falls by about 68px desktop and 48px phone; errors preserve those dimensions.

## Approved audit corrections
- Apply the same compact label feedback and stable card geometry to login and registration.
- Place duplicate-username server errors beside the username, preserve them through blur, and clear them on username edits. Clear stale form errors when credentials change.
- Reserve two readable lines in the card's bottom padding, preserving full longer server explanations in a named keyboard-scrollable region.
- Give the mobile scroll shell enough width and safe-area-aware inline clearance for the full card and its 6px shadow, preserving the title composition.
- Extend regression coverage to both modes, common two-line API errors, unusually long server explanations, and painted shadow bounds.
- Browser verification also exposed a reduced-motion specificity failure: the semantic button-color hover owner overrode auth's no-transform rule and oscillated by 1px at a scrolled button edge. Strengthened the existing auth owner and nested its two reduced-motion declarations without increasing CSS debt limits.
- Verification: 174 related unit/DOM/CSS tests, 8 entry-surface browser cases, changed-file ESLint, production build, built-CSS contracts and system-design rendering passed. Desktop and 320px idle/error screenshots were inspected. The prior 390px instability is covered by computed hover transforms and the short-viewport flow.
- Full `npm run check` reached tests after lint passed, but encountered proxy/leaderboard test timeouts and an IPC channel closure. Isolated rerun passed leaderboard coverage; the unrelated `scripts/devApiProxy.integration.test.js` first-case 5s timeout persists. No unrelated proxy code or timeout limit was changed.
- Design-hook radius/color findings are existing password-toggle and theme-owner values, including the 10px toggle radius; this correction leaves them intact and adds no suppression.
