# Denia chibi expression work package

## Goal
Create eight expressions from the supplied 832 x 1216 transparent chibi sprite for future story guide use, using vn-sprite-expression.

## Confirmed requirements
- User selected original, happy, serious, surprised, worried, sad, angry, embarrassed.
- Deliver native transparent PNGs, layered PSD, face overview and verification report.
- Preserve source pose, body, hair, silhouette and alpha exactly; change only calibrated facial regions.
- Save original, aligned candidates, prompts and rig in an independent workspace package.
- Existing story assets use canonical character ID `denia`, expression IDs and 832 x 1216 native canvas.

## Scope
Asset production and review package. Existing standard story sprites are a different appearance; no replacement or story text changes in this task.

## Acceptance
- [x] Eight native transparent PNGs and PSD available.
- [x] Verification reports zero alpha, outside-mask and protected-hair differences.
- [x] Inspected first expressions before expanding; reviewed final face/full grids and allowed mask.
- [x] Documented package and future expression ID mapping; regenerated system design HTML.

## Delivery evidence
- `output/character-expressions/denia-chibi-v1.zip` (42.2 MiB).
- Eight PNGs, sixteen lossless full/avatar WebPs, one layered PSD.
- Native source-protection, runtime pixel-equivalence and PSD structure checks passed.
- Default source PNG copied exactly; PSD has exactly one visible original expression group.
- Built-in image tool prompts and source candidates retained in the package.
- No runtime code changed. Artistic acceptance is pending user review; Photoshop application round-trip not performed.
- Asset-only quality scope: pipeline verification, script syntax checks and system-design generation; application-wide tests were not rerun.
- Spec review: existing story-sprite contract already covers future explicit appearance/expression registration; no new runtime contract introduced.

## Technical approach
Built-in image editing creates clean-face and expression candidates from a square face crop. Align stable hair landmarks, calibrate local brow/eye/mouth masks, assemble and verify using the installed VN workflow. Default expression retains the supplied original.
