# Ensemble puzzle prototype QA

final result: passed

Source visual truth: `../visual-reference.png`, the supplied nine original PNGs in `../assets/characters/`, the existing baconbits portrait, and the user decisions in `AGENTS.md`. The generated image is a composition reference, not a literal replacement for original character art. Its illustrated ownership count is inconsistent; the specified eight-owned/two-locked state takes precedence.

Implementation: http://127.0.0.1:5188/ . Desktop capture `../desktop.png` at 1440×1024, partial ownership, no modal. Mobile capture `../mobile.png` at 390×844, same state; `../mobile-all.png` at 360×800, all owned with keyboard focus visible; `../mobile-detail.png` at 390×844, Sigrika modal open.

Full-view combined comparison evidence: `../comparison.png`, source and final implementation normalized to 1440×1024 and placed together. Focused combined comparison: `../comparison-detail.png`, Mornye's head/halo and polygon seam. Initial combined comparison: `../comparison-first.png`.

## Findings and fixes

- [P2, resolved] Optional name badges were cut by angled seams on Sigrika and the bottom pieces. Initial desktop comparison shows partial text. Removed badges to match the portrait-first composition; full names remain in native hover titles, accessible button names, and detail headings. Final desktop/mobile captures show uninterrupted portrait compositions.
- [P2, resolved] The top boundary cut Mornye's halo and the top of several hairstyles. Initial comparison and mobile-first capture show it. Added a minimum top clearance based on the actual source focal point. Final focused comparison and 390/360 captures show the complete halo and clear faces.
- No remaining actionable P0/P1/P2 issue in this prototype's scoped portrait-board and detail journey.

## Fidelity surfaces

- Typography: the actual project LXGW Marker Gothic font loads for paper title and headings, with familiar Chinese UI sans for body text. The 38px/27px title remains complete; desktop/mobile detail text wraps within the panel. No clipped labels or action text.
- Spacing/layout: one continuous board occupies the main window, ten pieces fill its bounds. Desktop uses 1000:600; mobile recomposes at 360:550. Each layout has ten near-equal areas, no holes/overlaps or tiny shards. Window/footer/control margins remain visible at 1440×1024, 390×844 and 360×800. The modal has its own scroll area and fixed return action.
- Colors/tokens: warm paper #fffbf2, ink #3d2b25, mint section label, actual per-character theme colors, flat neutral locked states. The original Aemeath cyan theme takes precedence over the generated reference's incidental pink tint. Focus is indicated by a dark dashed outline, rather than by color alone.
- Image quality: all nine original PNG hashes match the user's files; no face regeneration, stretching or source-pixel changes. Existing transparent baconbits art loads. CSS Alpha masks make flat gray silhouettes, hiding all facial/clothing color. SVG polygons define actual UI hit regions and border geometry; they do not replace an illustration/icon asset. Halo/head clearance is verified in focused evidence.
- Copy/content: title, count and portrait navigation are concise. The eight-owned/two-locked count, all/none counts, true catalog descriptions/CV/skills/acquisition and locked detail text are checked. No invented statistics or deployment controls. The separate sample toolbar is outside the product window.

## Interaction and responsive verification

- Clicked Sigrika on mobile, checked the actual full portrait and catalog skill copy, returned through the visible action, and confirmed focus restored to Sigrika with scrollY=0.
- Clicked a locked piece, checked locked detail, closed with Escape, and confirmed the originating piece regained focus.
- Switched to all-owned and confirmed ten loaded images: nine 832px sources plus the 900px existing pig; switched to none and confirmed ten masks/questions with zero portrait image nodes.
- Read-only DOM hit sampling at 360×800 reached all ten character buttons with zero uncovered samples. All piece bounds exceed 44px in each axis; actual safe portrait squares in geometry are at least 89.8px at the canonical mobile board size.
- Opened the pig's desktop detail, checked real image and skill text, closed with Escape, then restored the default partial scenario.
- Document horizontal overflow: 0 at desktop, 390 and 360. Mobile document heights equal 844/800 respectively. Console errors/warnings: none.
- Prototype lint and Vite build pass. Source assets and geometry are separate from production character configuration and game flows.

## Intentional scope differences and follow-up polish

The generated reference adds decorative flowers, mascots, stationery and a decoration tab. They are not implemented as new assets or product controls; the user request focuses on the portrait puzzle, exact original character art and ownership/detail states. The standalone sample uses the existing classroom background and a section label. Production decoration, costumes, voice/music and deployment/mode selection are outside this sample.

P3: the eventual production modal may reuse the real external bookmark tabs and title sticker, and may refine the paper finish after the user reviews the composition. This does not block the current clickable portrait-board sample.

Implementation checklist: source preservation, equal-area partition, owned/locked states, faithful portraits, modal open/return, mobile recomposition, browser QA, lint/build and documentation are complete. Formal HouseModal integration remains a later task.
