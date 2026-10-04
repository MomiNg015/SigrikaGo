# Desktop larger bust restoration

Read-only comparison: `git show e0869013:src/modals/house/handbookStrips.js`, current helper, old 1440x768 resting screenshot `.tmp/handbook-strips/1440-768-rest.png`, and current 1440x1024 screenshot `docs/design-samples/handbook-strips/desktop.png`. Both screenshots were visually inspected.

Old e086 resting standard image height was `min(boardHeight*1.65, boardWidth/count*6.2)`. Its hovered frame deliberately shrank toward full-body fit, which must not be restored: current requirement preserves constant image dimensions and common eye line through hover.

Current normalized resting height is `min(boardWidth/count*.88, boardHeight*.25)/headWidth*1216`. At the measured board width ~1052px, height460px and count10, Sigrika has target head width92.6px and art height417px. The old same-board formula gives652px art height (head width144.8px). A fixed target `boardWidth/count*1.35` gives142.0px head width and640px art height, closely matching the old large bust composition while preserving the new alignment.

Important: also relax the existing `boardHeight*.25` head-width cap. Leaving it in place limits the new target to115px (518px art), not a meaningful restoration. Recommended cap: `boardHeight*.45`. At1440x768, board height346px, the cap155.7px permits142px target. At minimum board330px, cap148.5px also permits the target. More-than-10 pagination and sparse pages retain a sensible height cap.

Root's proposed local image scale adjustments are coherent with perceived face/head proportions: Qiuyuan face/head ratio118/232=.509 versus Sigrika146/270=.541 and Nabomo160/282=.567. Qiuyuan*1.08 gives.549 and Nabomo*.92 gives.522, bringing them around the central face size. Apply these only to standard built-ins and recompute the eye-line top from their final scale. Do not modify source pixels or reuse these factors for costumes/custom art.

Recommendation: standard target factor1.35, height cap.45, Qiuyuan1.08 and Nabomo.92, with width/height/top unchanged between resting and expanded state. Keep common eye Y=boardHeight*.25; QA top headwear and first/last slice at1440x1024 and1440x768. Old short-board busts were smaller than the tall-board version; restoring the visual target is preferable to literally reusing old per-height image formulas.