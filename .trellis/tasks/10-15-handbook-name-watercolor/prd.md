# Desktop handbook name watercolor emphasis

## Latest user correction

No separate name area or extra card height. Restore original portrait framing; only right-align four-character-or-longer names inside the existing lower-right area. This supersedes the rejected footer approach below.

## Goal and accepted design

Implement the final user-approved name treatment in the ordinary desktop handbook. Keep the lower-right placement, inset it left by 20% of the card width, enlarge the former 30px name to 45px and strengthen its weight. Use the project's actual LXGW Marker Gothic font, with a rounded translucent character-theme watercolor marker stroke behind the bottom quarter of the lettering.

## Scope

- Desktop only (769px and above), existing hover and keyboard preview.
- Reuse character theme color and the existing name pseudo-element; no generated screenshot or additional font asset.
- Preserve portrait geometry, animation, ownership, detail activation, mobile and corruption presentation.
- Keep long catalog names readable and within the expanded strip.
- Superseding the original inset: reserve a 64px desktop name footer while preserving the original portrait stage dimensions; center the text in the right-bottom region (`left: 48%; right: 30px`). Desktop type ranges from 30px to 45px. Validate at least 8px clearance from real portrait alpha pixels for every catalog member.

## Acceptance and QA

- Verify actual loaded LXGW font, 45px/700 name on a 1440px desktop, right-bottom alignment and colored short marker stroke.
- Visually inspect Chisa and longer names at 1440x900 and a narrower desktop; keyboard preview and reduced motion remain usable.
- Check 390x844 and 360x640 retain existing label placement, font size and signature rule.
- Run existing handbook and CSS checks, lint/build checks as applicable; update system design and generate HTML.

## Technical approach

`src/styles/mobile-adaptive/handbook-strip-labels.css` is the final owner. The actual existing `--font-window-title` points to `LXGWMarkerGothic-Regular.ttf`. Use scoped variables for desktop name typography and a desktop-only pseudo-element override. Update the existing handbook contract's superseded no-text-background rule to allow this requested underline.

## Out of scope

No new interaction, mobile redesign, portrait resources, backend, account mutations or unrelated working-tree changes. Existing user WIP is preserved. No further preference decisions are required after the accepted mockup.
