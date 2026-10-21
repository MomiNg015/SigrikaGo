# Entry surface corrections

## Goal
Apply the user's three screenshot corrections to the entry loader and login/registration form.

## Requirements
- Center the complete loading Tip and place `（第一次加载需要2-3分钟，请耐心等待）` immediately below the progress bar.
- Make login/register cards opaque; add 50% opacity black/white stones with center-crossing lines at the top right.
- Move registration field errors to the label's right edge in place of idle notes. Restore notes after correction. Keep card width/height unchanged on local and server errors.
- Preserve validation, authentication requests, mascot/title composition, and unrelated profile/design WIP.

## Implementation
- Existing loader gets an optional progressNote used only by LoginAssetPreloadScreen.
- Existing form feedback component switches between note and error; registration rows reserve two text lines, and form-level errors have a fixed scrollable area.
- Existing theme CSS owner paints opaque cards and the pointer-transparent decorative SVG. Repeated password-control state prefixes are nested without changing selector specificity or order.

## Validation
- Browser coverage at 1440/390/360/320px: 8 cases passed; desktop and 320px screenshots inspected.
- Existing design-hook color/radius findings refer to unchanged palette and control values; no suppressions added. New card fill reuses the theme token; black/white stones follow the requested decoration.
- Focused unit/DOM, CSS and documentation suites: 167 tests passed across the final targeted runs. Maintained-file ESLint, production build and built-CSS contracts passed. CSS size budgets passed without a baseline increase.
- Shared AssetPreloadScreen has pre-existing hook dependency lint debt and remains outside the maintained-file lint list; its two-line prop/render change is covered by loader tests and the build. Existing unrelated admin snapshot drift remains outside this task.
