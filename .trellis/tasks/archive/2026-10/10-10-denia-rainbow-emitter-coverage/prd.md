# Denia rainbow emitter coverage

## Goal
Expand and intensify the rainbow emission areas to cover both complete eyes and the mouth with colored light, as explicitly requested. Keep the accepted rolling spectrum, 480ms color cycle, current sprite, beam endpoints, runtime paths and reduced-motion companion.

## Approach
Add soft-edged, near-opaque spectral source cores centered on the full facial features, phased together with the beam color bands. Enlarge the beam roots to connect continuously to these cores while retaining translucent distal light. Preserve underlying source art and all pixels outside effect coverage.

## Acceptance
- [x] Both eye interiors/contours and the mouth are obscured by colored source light in every frame.
- [x] Spectrum still rolls continuously through all three beams and cores.
- [x] Review exported face close-up and actual story playback.
- [x] Regenerate runtime assets, still, preview, design docs and HTML; focused checks pass.

## Scope
Only the existing exporter, generated rainbow assets, relevant regression test and corresponding documentation. Preserve unrelated WIP. No outstanding requirement questions; the user's follow-up provides authorization.

## Validation
All 24 source-protection checks pass; 21 focused tests pass, including six fixed-position spectral rolls and twelve facial-contour coverage samples across all frames. Lint and scoped whitespace checks pass. All 39 portrait bounds remain valid. Actual story playback at 1440x1000 and 390x844 animates without page errors and selects the matching still for reduced motion. Reviewed the final full sprite and desktop story screenshot. System-design HTML regenerated; documentation and spec staging preserve unrelated changes.
