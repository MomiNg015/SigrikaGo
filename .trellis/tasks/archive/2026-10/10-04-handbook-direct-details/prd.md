# Handbook direct details and larger portraits

## Goal
Apply the user's three follow-up corrections to the installed handbook strips.

## Requirements
- Remove the separate mobile detail action. Clicking/tapping any character strip opens its existing matching detail dialog immediately, including anonymous unavailable Baconbits.
- Desktop portraits should return to the previous larger bust framing (roughly the scale before the latest head-normalization edit), while retaining fixed image dimensions and eye line during hover. Increase Qiuyuan's perceived head size slightly, decrease Nabomo's slightly; preserve other layout/name/ownership rules.
- Narrow-view pointer preview must collapse promptly once no longer hovered. Touch contacts must not leave a persistent expanded row after release, cancel, scrolling or closing detail. Keyboard focus can preview accessibly, and dialog focus restoration must not simulate a new touch hover.
- Preserve effect actions, guide programmatic activation, original catalog order, mobile alternating sides, title typography, custom/costume priorities, anonymous missing-data treatment and corrupted isolation. Selection remains deferred.

## Implementation assumptions
Use hover-capable pointer preview on both viewport sizes, with transient touch press feedback rather than a latched touch preview. Activate details directly on the native button. Keep keyboard focus feedback distinct from pointer/touch focus, and clear preview on activation/exit/cancel.

## Validation
Update meaningful DOM/helper/browser regressions for direct tap, disappearing hover/press, detail-close focus, larger stable desktop framing and per-character tuning. Visually verify desktop and phone short/tall views. Run relevant suites, actual home-guide browser regression, lint/build/built CSS and generated docs checks. Sync docs/system-design.md and the handbook contract; record current screenshots and known environment limits from the previous full check.
