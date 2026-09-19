# Left bookmark tabs preview

## Goal
Deliver an isolated interactive settings-window sample of the user's requested left-edge hand-drawn bookmark tabs using the actual LXGW font. User accepted the preceding proposal by asking for a sample; no additional requirements questions are necessary.

## Scope
- Desktop horizontal labels and portrait mobile upright vertical labels.
- Audio, appearance, and about tabs; selected paper pulls out slightly.
- Existing settings title artwork and LXGWMarkerGothic-Regular.ttf.
- Standalone HTML preview under .codex-run/bookmark-sample; no production imports or behavior changes.
- Semantic tabs, keyboard navigation, reduced motion, functional local preview controls.

## Acceptance
- [x] Open the preview in Codex and inspect both layouts.
- [x] Verify tab switching and keyboard navigation.
- [x] Font and title assets resolve locally.

## Design
Existing cream grid paper, brown ink and short paper shadows. Mint selected audio bookmark, pale blue appearance bookmark, pale pink about bookmark. Irregular vector UI contours, subtle inner pencil line; no illustration scenes or decorative clusters. Body content remains conventional.

## Exclusions
No application source changes, production rollout, backend requests, or unrelated WIP edits. This artifact documents a proposed direction rather than a new system-design fact.

## Validation
Opened http://127.0.0.1:8769/ in Codex browser; visually inspected desktop and 390px portrait compositions. Desktop click then ArrowDown selected About and changed the panel; mobile Appearance selected and displayed its panel. JavaScript syntax checked with Node vm.Script. Design hook's font alias finding resolved by using the existing Sigrika Window Title family name. Broad application tests are not applicable to this isolated HTML artifact.
