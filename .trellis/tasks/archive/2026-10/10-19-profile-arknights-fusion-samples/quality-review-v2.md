# V2 reference-based prototypes: review and corrections

The initial warm-paper proposals were rejected for not following the supplied reference compositions. V2 now uses the two exact user screenshots and retains the production left bookmarks. User visual acceptance is still separate from technical verification.

## Critical asset mistake and correction

An early V2 draft manually chose retired handbook-sprites because its proportions resembled the references. The user correctly rejected this. The existing identity-bust-contract already documents the migration; no new production rule was needed. The samples now import resolveCharacterPortrait from the live project. Heroes use current full-body Q art; all avatar/card crops use the current complete-head variant and contain geometry. Network tests fail if a retired handbook-sprites image is requested. Four-character personalization and every viewport use the same resolver. No production files were changed.

## Technical evidence

- Three variants at 1440×900, 768×1024, 390×844, 320×568 passed after the asset correction.
- Exact bookmark SVG and shared production CSS retained, including mobile vertical writing. Up/Down/Home/End, role tab state and focus verified.
- Current full-body/complete-head source assertions; loaded-image checks; no retired-image requests, missing resources, console errors or account API requests.
- Self/social contexts, all play branches, empty state, long name, local social confirmations, character selection, dialog Escape/focus restoration, tail reachability and reduced motion verified.
- All three desktop compositions and mobile captures inspected; desktop Q art shifted so crown/ears are not obscured by the right modules. Mobile data horizon no longer passes through metric numbers. Main player identity moved ahead of stats in portrait layouts A/C.
- Full npm run lint passed; scoped ESLint rerun after resolver/test changes passed. npm test -- docs/systemDesignHtml.test.js passed 4 tests. docs:system-design regenerated the HTML.

## Impeccable audit

The static scan produced 108 advisory/warning findings: 97 color, 5 radius, 3 side-border, 1 rounded accent, 1 font, 1 numbered variant label. Contextual classification:

- Color/radius: intentional supplied-reference gray/cyan/yellow material palette, isolated in docs. Keep rather than reverting to the rejected warm-paper direction. No rule suppression added.
- Side borders: the sparse yellow chapter marker, gray metric separators and striped edge of the achievement plate correspond to the screenshot language; retained intentionally. Existing paper tab appearance is an explicit user constraint.
- Rounded accent: applies to the thin striped edge inside the Endfield achievement plate; not a generic colored card accent. Retained as a direct visual reference.
- Font: Arial is in the project's existing number/UI stack; tabular, unambiguous game statistics take precedence over choosing a novelty typeface. The existing title font remains on bookmarks.
- Numbered labels: 01/02/03 identifies three actual alternatives for feedback. Not content-section decoration.

Real issues fixed: unnecessary iframe width transition, unused pastel fixtures, identity too late on mobile, horizon crossing metric numbers, narrow rank-help target, retired asset selection and obsolete face-crop geometry.

| Dimension | Score / 4 | Evidence / limits |
| --- | --- | --- |
| Accessibility | 3 | Named controls, keyboard tabs, dialogs, long names; ornamental microtype is not primary information. Not a full WCAG certification. |
| Performance | 3 | Static terrain, local art, no animation loop or new dependencies; samples rerender their small DOM on state changes. |
| Responsive | 3 | Four sizes and portrait reflow verified. Real production bounded-window scrolling remains an integration check. |
| Theming | 2 | Deliberate isolated color experiments. Selected design still needs production theme-token integration. |
| Reference fidelity | 3 | Actual reference compositions and materials retained, adapted to current project art and existing left tabs. Placeholder medals are not finished achievement artwork. |
| Total | 14 / 20 | Suitable for choosing among prototypes; not a claim of production integration or user approval. |

## Spec update decision

No production contract changes: the existing identity-bust-contract and profile-folder contract continue to apply. Updated system-design entry records the standalone V2 samples and actual resolver dependency, plus the boundary that achievements/replay/social state are mock-only. Source checks now verify the rule already present in the spec.
