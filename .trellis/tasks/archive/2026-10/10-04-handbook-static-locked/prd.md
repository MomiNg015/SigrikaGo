# Static locked strips and smooth portrait movement

- Unowned ordinary characters show a silhouette and question mark only. On mobile the question mark occupies the opposite name area, matching alternating portrait sides.
- Unowned and missing-data strips expose no character name or tooltip and do not preview or open details through hover, touch, click, focus, keyboard or programmatic activation. Keep their catalog slots and anonymous missing-data artwork. Existing corrupted presentation remains separate.
- Owned strips retain direct details, accessible keyboard preview, guide activation and touch reset behavior.
- Desktop larger portraits keep fixed dimensions/eye lines. Use actual flex width as the sole movement driver, mapping fixed endpoints from the shared strip layout constants. Move the expanded anchor right to reduce left-side clipping; keep the lower-right label usable.
- Validate mixed ownership across desktop/mobile, actual motion samples over multiple frames and original owned detail flows. Sync system design, handbook spec and current screenshots; lint/build/CSS contracts must pass.
