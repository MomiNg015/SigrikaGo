# Denia original rainbow light

## Goal and requirements
Match the earliest rainbow animation's translucent soft light on the current accepted Denia surprised sprite. Preserve three emitters at both eyes and mouth, current identity, face and body, runtime paths, reduced-motion still and normalized portrait contracts.

## User correction: spectral rolling
The user rejected v2 because its rainbow was visually stationary. Review the actual original GIF, not only its first frame. Extracted `fdc5f813:public/assets/characters/denia_color.gif` into `output/denia-rainbow-rolling-v3/original.gif`: 16 frames at 70ms. Contact sheet and fixed-position color samples show approximately one rainbow band of forward phase advance per frame (roughly 0.5s per full color cycle), with a nearly stationary beam silhouette. V3 translates the spectral bands across the beam width, wrapping continuously, three full rolls per 1.44s loop (480ms per roll). Retain the current sprite and transparent soft-light style.

Additional acceptance: fixed points within all three beams must visibly cycle through red, green and blue; minor shimmer or changing image bytes alone is insufficient proof. Review actual original and new animated images side by side.

V3 validation completed: three fixed sample points advance continuously through three full hue cycles; all 20 focused tests pass, script/test lint passes, 39 portrait visible bounds remain valid. Actual desktop and portrait-phone story playback moves, loads the matching reduced-motion still and reports no page errors. All 24 source-protection checks pass. Original and final animations are available side by side in `output/denia-rainbow-rolling-v3/preview.html`.

## Research and decision
The original reference is `output/denia-rainbow-chibi-v1/old-rainbow-first.png`; history starts at `fdc5f813` for `public/assets/characters/denia_color.gif`. The current exporter draws opaque pastel bands with dark outlines, hard ends and large waves. Revise the editable SVG effect source into saturated translucent blended bands, feathered ends and soft bloom. Retain deterministic frame generation and unchanged source pixels outside effect coverage. No image model or repaint is needed for these existing code-native effects.

## Scope and edge cases
Only the rainbow effect generator and its generated assets/documentation change. Preserve other WIP. Keep frame timing and seamless periodic motion, avoid clipped bloom and full-character movement. Keep reproducible source and old reference available for future adjustments.

## Acceptance criteria
- [x] Soft transparent rainbow light matches the original direction instead of solid outlined ribbons.
- [x] Current character and three emitter origins are retained.
- [x] Review preview on light and dark backgrounds; verify animation, alpha and source protection.
- [x] Related checks and normalized portrait validation pass.
- [x] System-design source and HTML updated.

## Authorization
User requests implementation according to the original light effect; no unresolved scope questions.

## Review notes
- Native decoded frames exactly match PNG visible RGB and alpha. Loop seam mean delta is 0.1138 versus max interior 0.1158; no additional seam jump.
- Standalone `preview.html` neutral light/dark backgrounds and 12px panel radius are intentional comparison-fixture styling, not product theme additions. The five design-hook findings are contextual false positives; no suppression or shared theme changes were made.
- Initial direct Vitest invocation accidentally included temporary release copies. Re-ran via the repository `npm test` command with its intended exclusions: all 38 relevant tests passed. Final asset checks follow export completion.
- Spec review: existing portrait dimensions, timing, paths, source preservation and reduced-motion contracts are unchanged; no new cross-layer contract.
- Final runtime export completed with zero outside-effect source differences. Native WebP is 10,766,546 bytes; normalized portrait is 1,443,612 bytes. Browser checks on the final assets passed at 1440×1000 and 390×844 with animation movement, no page errors, reduced-motion still, and empty final narration. All 39 visible-bound entries remain valid. The 12 normalization tests passed again after export. Script lint and scoped whitespace checks pass. System-design HTML regenerated.
- Changes remain uncommitted for visual review. Unrelated existing WIP is preserved.
