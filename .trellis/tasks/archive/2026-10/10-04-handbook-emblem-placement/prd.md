# 部员手册大纹章布局调整

## Goal
Implement the user's follow-up layout: desktop expanded emblem large at upper-right, deliberately cropping at strip boundaries; mobile large emblem behind/opposite-side character name, with slight vertical crop permitted.

## Requirements
- Desktop expanded composition: right/top anchoring, roughly260–340px square frame based on viewport height; partial right/top crop is intentional. Keep quiet ink opacity, portrait dimensions and lower-right name unchanged.
- Mobile: interpret 名底下 as the decorative background layer under the name. Use roughly160px frame centered on the opposite name zone (rest50%, expanded30%); modest vertical clipping in96px rest strips is allowed. Larger expanded frame optional within clear name contrast. Mirror with portrait side.
- Preserve original3official assets, mapping/alpha compensation, owned-only privacy, input behavior, details, geometry and reduced motion.
- Reuse existing paper stylesheet only; synchronize measured CSS inventory, frontend spec and system-design md/html. Capture actual desktop/mobile states at1440×1024/768 and390×844/360×640. No external asset research needed.

## Acceptance
- [x] Desktop large upper-right faction emblems and mobile name-background large emblems reviewed in actual source UI.
- [x] Names readable; background cropping remains inside tile/window; no horizontal overflow or change to art/input geometry.
- [x] Focused CSS/DOM checks, lint and production build/built CSS pass.
- [x] Source docs and CSS inventory updated; commit and archive.

## Open questions
None. User specifies placement/scale and authorizes partial cropping; resolve exact pixel choices visually.

## Verification

163 scopedDOM/CSS assertions,5 responsive expansion/recovery browser cases,lint,build,builtCSS passed. Actual sourcecomponent screenshots at4 viewports incl partialownership:overflow0,10strips,allportraitsloaded,lockednames/emblems0,errors0. Independentcheck research/check.md no blockers. Paper2108 normalized bytes(+158), totalCSS1595138; remainingmetricsunchanged. Spec/designMarkdownHTML and freshscreens synchronized. Existingbuildwarningsunchanged.
