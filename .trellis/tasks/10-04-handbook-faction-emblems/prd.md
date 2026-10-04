# 部员手册官方阵营纹章替换

## Goal

Remove the garment-detail watermarks from the memento handbook and replace them with the three actual faction emblems matching the user's attached screenshots, locating clearer public source images online as explicitly requested.

## Requirements

- User-directed mapping: Sigrika -> Roya Tribe; Denia, Aemeath, Lynae, Mornye, Chisa, Nabomo -> Startorch Academy; Changli, Qiuyuan -> Huanglong. Baconbits/unknown additions have no inferred faction.
- Use existing actual game/public official artwork matching the three references, never draw/generate an approximate emblem or claim an enlarged small thumbnail is a higher-detail source.
- Download verified assets locally; retain exact source URLs, original dimensions, attribution and hashes in an asset manifest and research notes. No remote runtime loading.
- Remove the previous three garment PNGs, their manifest and the garment-extraction script from the current production assets/code. Historical design screenshots are retained as history.
- Owned characters show their faction emblem as an aria-hidden pointer-transparent ink watermark, preserving the current paper/color fade. Use a roughly square contained frame so the dragon, wheel/rays and DNA-triangle shapes are not squeezed into the old garment band slot. Desktop fit in the opposite blank area with room for lower-right names; mobile place opposite the portrait without covering the large name, adjust compact/expanded size independently.
- No character name/faction decoration/identity metadata or activation is added to unowned/missing-intel states. Maintain direct detail activation, portrait source precedence, fixed desktop size/crop/eye lines, one-way hover travel, alternating mobile layout, touch reset and reduced motion.
- Scope changes to handbook presentation; update system-design, relevant spec and measured CSS inventory, then verify representative desktop/mobile states and current checks.

## Acceptance Criteria

- [x] Three downloaded source emblems match the user's references and are visually inspected before shipping.
- [x] All nine owned characters use the user's faction mapping and the owned mascot has no inferred emblem.
- [x] Previous garment decorations and orphaned generation files are removed.
- [x] Desktop/phone background emblems remain recognizable, properly scaled and do not obstruct faces or names.
- [x] Locked slots remain anonymous, achromatic and static, with no faction asset references.
- [x] Existing focused DOM/helper/CSS tests and15 browser cases, lint, build and built CSS checks pass; document source limitations honestly.
- [x] Synchronize docs/system-design.md+HTML, source manifest, current screenshots and spec.

## References

- User reference images: `codex-clipboard-9f50d78b-0453-4769-a678-d8b1343c0b46.png` (Huanglong), `codex-clipboard-826796be-5138-4be6-af71-b02df7e5f9ff.png` (Roya), `codex-clipboard-7ccf975a-56e8-466f-ae9a-7cb404039f78.png` (Startorch), all in user Temp.
- Research: research/huanglong.md, research/roya.md, research/startorch.md as sources are verified.

## Open Questions

None: the user has supplied the desired symbols, exact mapping and authorized searching and implementation. Preserve existing ownership privacy rules.

## Verification

- Three official same-package native422×344 transparent originals visually match references, preserve bytes and manifest hashes.
- Scoped implementation6suites/122checks passed; reviewed GridDOM17 + CSS3 passed; final CSS5suites/146checks passed; lint passed.
- Playwright handbook15/15 passed; fresh actualcomponent screenshots on1440×1024,1440×768,390×844,360×640 plus partialownership: no overflow/pageerrors; desktop and mobile three-faction composition reviewed.
- Production build and builtCSS contracts passed. Inherited asset-resolution/chunk-size warnings remain unchanged.
- Independent trellis-check: research/check.md no blockers. System-design Markdown/HTML, frontend spec, gallery, source manifest and measured CSS inventory synchronized.
