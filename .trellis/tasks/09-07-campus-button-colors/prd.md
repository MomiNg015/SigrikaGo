# Campus button colors

## Goal
Review button colors across the project and improve the ordinary Bright School player UI using the light paper/blue direction the user liked in the reverted trial.

## Accepted constraints
- Color changes only: background, text/icon color and border color. Preserve layout, size, radius, borders, shadows, typography, motion, button order, copy and behavior.
- Do not add explanatory copy, counters, labels or other interface content.
- Keep illustrated image buttons, character-specific skill effects, corruption scenes and the admin visual system intact; review their current color ownership before deciding what is appropriate to change.
- Keep the original homepage and handbook layout restored by the previous rollback.
- Preserve unrelated dirty work. Use the existing branch; no push.

## Direction
- Paper white for secondary/back/close controls.
- Light notebook blue for ordinary navigation and tools; stronger blue for selected tabs.
- Campus pink for confirmation and primary actions.
- Mint for existing affirmative/accepted states; muted red for destructive actions.
- Hover/focus color follows the button role; disabled controls do not turn into active pink controls.
- Retain already deliberate semantic colors in special components.

## Verification
- Inspect actual component rendering on desktop and portrait mobile; compare geometry and content before/after.
- Verify normal, hover, selected and disabled states plus dark-ink contrast.
- Run relevant contracts and the project check; keep every new CSS owner under 6000 bytes.
- Update system-design docs and capture the no-extra-content constraint in PRODUCT.md.

## Open questions
None blocking. Scope and visual constraints follow the user's approval of button colors and rejection of the earlier layout/content changes.

## Implementation and verification result
- Applied two color-only Bright School owners and semantic logout/draw hooks. Audited admin, storefront, dossier and character-specific surfaces and retained their deliberate palettes.
- Actual-component browser fixtures at 1440px desktop and 390px portrait cover home, settings, handbook, confirmation and a shared-controls showcase. Before/after checks found identical visible button text, geometry, borders, shadows, font sizes and transforms across all ten surface/viewport combinations.
- Normal/hover roles and portrait gameplay controls exceed 4.5:1 text contrast; disabled colors stay stable on hover. Active skill styling still changes with its existing state.
- Computed appearance is unchanged for corrupted controls, handbook sortie flags, illustrated home entries, special duel controls, and special confirmations nested inside the home screen.
- `npm run check` passed: 352 test files / 2506 tests, lint, portraits, admin snapshot, production build, built CSS, production config and generated system-design HTML. A transient worker-channel exit cleared on rerun; no test or check was skipped.
- Preview screenshots and browser scripts are local ignored artifacts under `.tmp/button-colors-*`; fixtures use synthetic account data and actual components.
- CSS inventory records the isolated change against HEAD, so it does not rely on unrelated working-tree reductions. Existing unrelated edits are excluded from the commit.

## Follow-up: handbook decoration cards
- User requested a dashed divider between characters and decorations, plus character-card shadows, hover and click presentation on decoration cards.
- Updated the existing section owner, restored 3px card hard shadows, and reused the existing sticker transition/hover owner. Portrait press feedback already covers both card types and remains shared.
- Browser comparison at 1440px and 390px confirms identical normal/hover/pressed shadows, transforms, filters and transition values for enabled character and decoration cards; no document overflow. Preserve existing selected/disabled behavior and all copy, art and layout.
- Design-hook palette findings concern unchanged legacy colors in the existing owner; this follow-up adds no literal colors and does not suppress those findings.
- Validation: 352 test files / 2506 tests, lint, portraits, admin snapshot, production build, built CSS and production configuration passed. The final docs write returned a transient Windows `UNKNOWN` error; rerunning `npm run docs:system-design` succeeded. No new architecture or component convention was introduced, so existing CSS guidance remains applicable.
