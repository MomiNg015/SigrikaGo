# Campus refresh concept

Open `campus-refresh.html` through a repository-root static server, for example:

```powershell
py -3 -m http.server 8767 --bind 127.0.0.1
```

Then visit `http://127.0.0.1:8767/docs/design-samples/campus-refresh.html`.

The prototype needs the existing installed `node_modules/roughjs` and local public assets. It uses no external services, API calls, account data or production mutations.

## Approved scope

One coherent visual exploration of home, profile, friends and inventory. Home preserves the original student ID, match art, handbook, mascot, practice art and six illustrated utility buttons. Windows do not reuse the home frame/background art. Restrained paper and pencil outlines support the original artwork. No added dialogue, slogans, decorative notes or invented item descriptions.

Use the preview bar or original home illustrations to open a window. The three windows have shared navigation. Profile modes, friend search/filter/details and inventory categories/item selection work locally. Remaining game actions show explicit demo feedback. Escape closes the native dialog; focus returns to the original opener. Portrait home stacks the identity/handbook, match illustration and two-column utility entries. Dialog headers stay visible while the body scrolls; inventory uses two columns with selected-item details above the grid.

## Design-hook review

The palette and the `Hand` alias (the existing LXGW font) intentionally explore the newly authorized design system. These are not production design-token changes. The reported missing image on a partial `<img` replacement string is a static-analysis false positive: all rendered image elements have real local sources, checked in browser. The selected item uses a thin, hand-drawn outline rather than a thick accent card border. No hook settings or suppression rules were changed.

## Compact profile revision

The profile alone has an 850px desktop sheet with a larger portrait, continuous ruled metrics and denser record rows. At portrait widths the identity block is 116px tall; the header remains outside the body scroller. Verified at 1440x1000, 390x844 and 360x640, including reaching the last record on a short screen.
