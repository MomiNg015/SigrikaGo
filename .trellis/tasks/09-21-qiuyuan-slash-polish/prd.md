# Qiuyuan slash polish

Preserve teal-white ink sword identity and gameplay. Retreat crossing omens during the main strike; synchronize blade, stone removal, cut particles, and sound. Only removed stones produce fragments. Settle into a restrained thin persistent scar. Verify real Board on desktop and portrait mobile, timing across 9/13/19 boards, and reduced motion. Preserve unrelated work.

Design hook review: rgba(47, 127, 134, 0.18) intentionally reuses the existing Qiuyuan ink color 0x2f7f86 for cut flashes. This is character-specific VFX art, not a new UI palette color; classified as a contextual false positive. No suppression added.

Validation: 118 tests across Board, registry, timing, audio, CSS inventory, and generated docs passed. Full lint passed. Production build and built-CSS contracts passed. Real Board screenshots checked at desktop 1000x850 and portrait 390x844, including reduced motion; no mobile overflow or page errors. Gameplay resolution remains unchanged.

Second visual iteration: user found the final cut too thin. Replace the main blade with a three-layer tapered 2.8-cell ink slash and swept broad tip; hold its completed silhouette until progress 0.50 before contraction. Keep the two thin omens and all contact timings intact.

Third iteration: user rejected the wide solid wedge as an energy cannon. Restore drawRowSlashInkBrush and drawRowSlashLeadingEdge exactly from 4da090f1, preserving the improved shared contact timing, earlier omen retreat, and stone-only fragments.

Final user correction: restore the complete pre-optimization Qiuyuan presentation, not only the blade artwork. All production files and their tests are restored exactly to 4da090f1, including timings, omen persistence, main sweep, scar reveal and appearance, fragments, and audio cues. Remove the added qiuyuanPresentation module. The prior iterations are superseded.

New scoped request: original sword effects are cut off at inner grid bounds. Move only Qiuyuan transient canvas and persistent scar to board-wrap, retaining real grid geometry and original visuals/timing. Cover coordinate margins and clip at wooden surface edges.

Edge fix validation: 118 focused tests passed, including Board, Pixi lifecycle, registry, CSS debt and generated documentation. Additional Board ownership assertions passed. Lint/build passed. Real Board with coordinate margins checked at 1000x850 and 390x844: canvas and scar span the wooden surface while grid is inset; no mobile horizontal overflow or page errors.

Latest request: hold the finishing stroke briefly then disperse its ink before the opponent can move. Retain 4000ms server resolution; complete visual fade at 3728ms. Render only pending slash, never resolved rowEffects. Reduced motion has no particle dispersion.

Design hook reports unchanged color assertions in Board.test.js (#4a3736, #ff75b7, #ff1733). These are pre-existing regression fixtures outside this effect, classified as false positives; no palette edits or suppressions.

Dissolve validation: 112 focused tests, lint and build passed. Real Board at 3400ms shows fading blurred ink; 3800ms opacity is zero; at 4200ms no row scar node exists despite resolved rowEffects. Original 4000ms authority remains unchanged.
