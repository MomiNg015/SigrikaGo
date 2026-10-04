# Ordered handbook portrait strips research

## Catalog order and scope

- `src/app/App.jsx` supplies `characterListFromCatalog(characters)` to the handbook. `src/shared/characters.js` sorts finite backend `sortOrder` first, then numeric order, then fallback order, then ID. `LegacyHouseCharacterGrid` renders its `characters` input directly. The normal strip must likewise preserve the incoming array; do not copy the puzzle-only `PORTRAIT_ORDER`.
- Fallback sequence is Sigrika, Denia, Aemeath, Baconbits, Lynae, Qiuyuan, Mornye, Changli, Chisa, Nabomo. This is only fallback; the live public catalog may carry a different explicit sort order.
- `handbookPuzzle.js` owns the rejected custom order and fixed convex partitions. It can be replaced/retired with the obsolete geometry tests; tests must assert source order and ownership-independent positions instead.
- Keep ten-per-page pagination, empty/extra/custom roster support, and the `sigrikaCorrupted` early branch to `LegacyHouseCharacterGrid`. Normal presentation stays a direct HouseModal child, preserving book scrolling and tab cleanup selectors.

## Existing team reference

- `src/room/PlayerInfo.jsx:96` maps the three lineup entries in input order into `.team-portrait-slot` masks.
- `src/styles/room/team-portraits.css` owns separate upright portraits inside diagonal paper masks, fine gaps, subdued paper mixtures, mystery `?`, and finished-only grayscale. Its masks are three fixed full-board percentage partitions and cannot be copied verbatim to ten expandable slots.
- Keep the visual vocabulary (upright artwork, parallel angled seams, restrained paper color), but give handbook strips their own local geometry and interactions. Do not alter team-match runtime or styles.

## Recommended stable geometry

- Desktop: one continuous row with a fixed board height, equal resting shares, an active share of roughly 3-4 resting widths, and nonzero neighboring shares. Animate the layout widths, not skew/rotate the art. Keep the first/last outside edges vertical; all internal seam boundaries share one slant direction.
- Mobile: one column in the existing handbook scroller, fixed comfortable resting row heights and a larger active height. Allow total board height to grow rather than squeezing nine inactive rows to unusable heights. Align the internal joins to the same slant direction; outer top/bottom edges remain straight.
- A clean helper can derive quadrilateral slices from cumulative normalized shares, with pixel slant offsets and pixel paper gaps. At the desktop boundaries use topX = cumulativeX + slant/2 and bottomX = cumulativeX - slant/2, clamping only the outer boundaries to 0/width. Mobile rotates that construction using leftY/rightY. Local bounding boxes plus native clipped button masks preserve actual hit areas. Alternatively flex wrappers with extended clipped surfaces work, but all overlap hit areas must be verified.
- Bound the diagonal offset by the smallest resting share. Huge diagonal shifts consume the narrow face area and make the first/last character hard to reach.
- Expansion belongs to the current slice and compresses its neighbors smoothly; omit old lift, rotation, glow and outer heavy shadows. Scope hover/focus background and transform repairs with at least the global button-pseudo specificity.
- Fine pointer hover and keyboard focus preview the same slice. Escape/collapse may restore the resting composition. Under reduced motion change the same active geometry immediately.

## Portrait treatment

- Reuse `resolveHandbookPortrait` as presentation adapter. Nine normal built-ins are 832x1216 transparent full-body sprites; existing focal points identify the face center and `cropWidth` can normalize face size. Baconbits keeps its current 900x900 source and visibleTop/focal metadata.
- Prefer a coherent bust reveal for narrow inactive desktop strips: anchor the face, use an artwork scale independent of the changing slice width, and reveal more shoulders/arms as the mask widens. Scaling the image to every new width defeats the reveal and makes faces jump. Full-body contain is valid for sufficiently wide active strips but requires separately tuned resting/active placement.
- Mobile needs independent framing: the short resting row shows face/eyes; expanded height reveals shoulders/bust. Keep actual image aspect ratio and upright orientation; avoid scaling X/Y independently. Show complete headwear in the expanded state, particularly Aemeath/Mornye/Nabomo.
- Costume/candy/custom priority remains shared: Sigrika corruption, Denia candy (including costume candy), costume portrait, custom portraitUrl, portrait. The standard handbook sprite is only substituted for a built-in default. Preserve the costume `scale` and `translate` style props. Nonstandard sources have unknown real aspect ratios; render through a contain frame or measured natural dimensions rather than stretching the adapter's nominal 900x900 assumption.
- Locked characters retain alpha-mask gray silhouette plus `?`; unowned Baconbits remains anonymous in accessible labels and detail modal. Keep backgrounds light neutral rather than dark gray. Do not recolor owned original character art.

## Interaction constraints

- Desktop primary slice activation opens the existing detail and never selects a sortie character. Existing selected account character stays authoritative; selection was explicitly deferred.
- Touch has no hover. First tap should expand, then use a distinct visible detail action (or second activation) to open details. Avoid nested buttons: the preview button and detail action need sibling/native interactive semantics. On desktop keyboard focus may preview and Enter/Space opens details consistently.
- Candy effect cancellation buttons stay separate from the main slice hit target, stop appropriate propagation, and preserve click/Enter/Space isolation. Current DOM tests cover this.
- Reset active preview safely when changing page or roster; preserve detail dialog focus restoration. Ensure the active row, detail action and last row remain reachable at 360x640 via the handbook scroller.
- Leave the existing portaled full-body detail carrier, copy, voice/music, wardrobe and corruption isolation intact. Its close X has a separate old pseudo-element cyan style bug, but that is not required to redesign the strip.

## Theme cascade pitfall and verification

- Global final-controls-forms.css applies important pink background, border/shadow and translateY(-1px) to buttons on hover/focus-visible. The current puzzle background rule loses by specificity. New owner must explicitly cover native slice `:hover`, `:focus-visible`, `:active` states (including gray locked state), preserving its matte character-color fill.
- The same owner resets direct button child transform and clip-path; retain an art wrapper to shield costume/art frame transformations.
- Verify 1440x1024, 1440x768, 390x844, 360x640, first/last expansion, locked and anonymous slots, narrow custom sources, page changes, pointer/keyboard/touch, reduced motion, effect cancellation and detail focus return. Compare document scroll width to viewport and confirm masks have no dead seams/overlapping neighbor activation.