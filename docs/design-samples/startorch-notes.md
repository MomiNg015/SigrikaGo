# Startorch technology theme exploration

Run a repository-root static server (`py -3 -m http.server 8768 --bind 127.0.0.1`) and open http://127.0.0.1:8768/docs/design-samples/startorch.html.

## Directions

- Daylight academy: ceramic white, academy green, an open three-column lobby and restrained architectural rings. Closest to the bright research-campus reference.
- Deep-space terminal: dark blue-black, luminous mint controls, compact framed modules and a technical grid. Strongest contrast with the existing campus theme.
- Orbital observatory: silver-blue, curved stage geometry, profile at the right and a continuous rounded utility dock. More expressive use of the academy's circular architecture.

Each has lobby, battle, handbook and settings pages. Mobile portrait has a dedicated stacked layout. All artwork comes from existing public character portraits. No remote assets or API calls are required.

## References and interpretation

- Official geography article: https://www.taptap.cn/moment/750669356542725016
- Official themed website announcement: https://www.taptap.cn/moment/748580829894018223
- The website itself returned a fetch error during research; the official article and its image-search previews supplied the references.
- White architecture, green signage, large circular structures and research-campus space are interpreted into original interface shapes, rather than claiming to reproduce the official game UI.

## Integration boundary

Production `src/app/visualTheme.js` currently exposes Bright School and has unavailable `club-standard` / `motari-luxury` placeholders. This preview demonstrates technology in the second slot without changing production options. The first preview option links to the existing campus sample, not the live app. Admin is excluded. User selection of a direction precedes runtime integration.

The board permits alternating demo stones but does not implement capture, legality, clocks or multiplayer. Mode and practice choices explicitly disclose simulation. Remaining utility windows are shell previews, not completed business screens.

## Design review

The new colors and Consolas numeric face are intentional isolated exploration of the user-requested technology theme. The design hook compares them to the current Bright School DESIGN.md; those palette/font findings are contextual false positives for this sample, not changes to the production design system. No hook suppression or shared palette changes were made. A stale design sidecar reported by the hook is pre-existing and left outside this sample's scope.

## Verification inventory

- All three directions × four pages at 1440×1000 and 390×844: overflow, image loads, screenshots and console errors.
- Board placement/reset, character selection persisting into the lobby, and Escape dismissal of mode selection.
- Local syntax validation and system-design HTML regeneration.
