# Character selection stamps

## Goal
Replace extra selection borders with imagegen transparent red distressed stamps anchored at the painted card's top-right corner.

## Requirements
- Generate four transparent assets: solid flag and solid Roman I, II, III inside a red circular stamp.
- Ordinary selection uses the flag; team selection uses the fixed slot's numeral.
- Stamp center is inset left/down by 30% of its size from the card top-right; it follows card rotation.
- Each stamp has a stable random local rotation from -15 to 15 degrees while mounted.
- Preserve selection semantics, voice, fixed slots and keyboard focus.
- Reserve scrolling gutters for stamps on desktop and portrait phones.
- Update system design and generate HTML.

## Acceptance criteria
- Selected cards render the correct asset; unselected cards have none.
- Clearing a middle team slot preserves the third stamp, and filling the vacancy uses II.
- Transparent backgrounds and large missing-ink chips survive export.
- Focused DOM tests, lint and build pass.

## Scope
Only selection presentation and generated assets; no matching or lineup logic changes. User request supplies the complete requirements.

## Verification
- All four PNGs have real alpha; corner samples are transparent (solid numeral III may cover its center).
- 44 focused selection/preload tests pass, including stable random angle and fixed-slot stamp behavior.
- Project lint, production build and built CSS contracts pass.
- Real Chrome checks at 1440x900, 390x844 and 360x640 pass for team and ordinary selection; team stamps load without clipping and have no selection pseudo-border.
- Screenshots and measurements: `.codex-run/selection-stamps/`.
- System design markdown and generated HTML updated; exact built-in generation prompts saved in `imagegen-prompts.md`.
- Existing unrelated work remains in the checkout; changes are not committed.

## Revision
User requests solid center symbols, thicker red rings, larger and more numerous missing-ink chips and a left/down inset. Runtime uses v2 assets to refresh cached images.

Revision verified: four v2 PNGs retain real alpha; 44 focused tests, lint, build and desktop/portrait Chrome checks pass. Updated screenshots show solid distressed stamp artwork at the inset anchor. Prompts recorded in imagegen-prompts-v2.md.

## Team lineup presentation follow-up
- Production heading restored to Round 1/2/3; removed click-to-remove captions and dedicated hint row.
- Three isolated interactive samples: compact roster, character stage, round timeline.
- User picks the visual direction before production promotion.
- Samples verified at 1440x1000, 390x844 and 360x640: switching, fixed slots, vacancy refill, confirm, close/reopen, stable dialog geometry, no horizontal overflow and visible bottom action. Source and screenshots under docs/design-samples/team-lineup-2026-10-09/.
- 14 focused selection tests, lint, production build, built CSS contracts and system-design rendering pass.

## Selected direction promoted
User selected variant 3. Round timeline is now production presentation: connected round headings, open portraits without enclosing card frames, dashed empty portrait slots, visible focus, reduced-motion support and fixed desktop/portrait rows. Its CSS is owned by team-lineup-timeline.css and registered after match-character-cards.css; both remain below the 6000-byte concrete stylesheet guard. Production browser checks pass at 1440x900, 390x844 and 360x640 for 0-3 selections, middle vacancy, stable dialog dimensions and visible bottom action. 14 selection tests and 57 CSS contract tests pass. Visual records: .codex-run/lineup-timeline/.

## Selection shadow follow-up
Default selectable character frame shadow deepened to 4px 6px 1px at 65% ink. aria-pressed=true reduces it to 1px 1px 0 at 20% ink for a pressed-paper appearance, retaining the red stamp. Shared owner covers ordinary and team pickers. Real desktop/portrait checks assert computed raised/pressed shadows differ and deselection restores the original shadow. 57 CSS contracts pass and system design is synchronized.

Corrected after user feedback: shadow moved from the foreground frame to a backing pseudo-element below the composite. Selected whole card translates 4px right / 6px down and clears its added shadow, following battle-clock feedback. Portrait, frame and name bounds move by identical deltas in real desktop and portrait checks; stamp shares that parent. Foreground frame has no filter, preventing inward shadow falling over the photo. Ordinary/team browser verification, 57 CSS contracts, build and built CSS checks pass.
