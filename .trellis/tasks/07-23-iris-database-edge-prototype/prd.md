# IRIS Database Home Integration

## Goal

Integrate the IRIS Database entry and window into the real React home screen on desktop and portrait mobile. Both the viewport-edge entry and the database window must keep their character-art regions empty until the user approves final artwork.

## What I already know

- The entry belongs on the right edge of the home viewport and should remain viewport-relative on desktop and mobile.
- The visual metaphor is an edge bookmark / file-index tab rather than a generic floating circle.
- Activating the entry opens an IRIS Database window.
- The database window reserves an Iris character-art region on the left and places Go-related friendly links on the right on desktop.
- The project already has a Bright School classroom visual language and existing home-screen assets.
- The standalone prototype already established the intended placement, layout, and interaction direction.

## Confirmed Decisions

- The feature is production React behavior, not only a standalone prototype.
- The entry is fixed to the right side of the real home viewport on desktop and portrait mobile.
- The entry retains the prototype's Q-version half-body silhouette as a transparent blank hit region; only the lower-right archive plaque remains visible, and it must not render the generated chibi asset.
- The database window retains a stable blank character-art reservation; it must not render the generated normal-proportion asset.
- Existing generated Iris assets remain unused candidates and are not requested by the runtime.
- Friendly links are static frontend data for this iteration.
- The database opens as an accessible modal window over the home screen.

## Open Questions

- None currently blocking.

## Requirements (evolving)

- Integrate the entry into the real `HomeScreen`.
- Keep the IRIS entry fixed to the right viewport edge on desktop and portrait mobile.
- Avoid covering the top-right home controls and bottom mobile safe area.
- Keep the entry artwork reservation transparent so the approved edge-character composition survives without turning into a visible portrait card, broken image, generated artwork, or generic silhouette.
- Use the shared `ModalDialog` behavior for dialog semantics, focus trapping, Escape handling, and focus restoration.
- Use a desktop left-reserved-portrait/right-links window and a portrait-mobile top-reserved-portrait/bottom-links window.
- Keep close and entry controls at least 44px.
- Open external links in a new tab with safe `rel` attributes.
- Preserve the existing Bright School home composition and avoid horizontal overflow.
- Keep the standalone prototype as a design artifact; production behavior lives in React components and owned CSS.

## Acceptance Criteria (evolving)

- [x] The real home screen renders one right-edge IRIS Database entry.
- [x] The entry renders no character image and requests no Iris character asset.
- [x] Activating the entry opens the production IRIS Database modal.
- [x] The modal renders no character image and keeps a stable reserved art region.
- [x] Desktop uses the left-reservation/right-links composition.
- [x] Portrait mobile uses the top-reservation/bottom-links composition without horizontal overflow.
- [x] Entry and close controls meet a 44px minimum touch target.
- [x] Escape, backdrop click, and close button close the modal; focus returns to the entry.
- [x] External friendly links are keyboard reachable and safely open in a new tab.
- [x] Focused tests, lint, build, and browser QA pass.

## Definition of Done

- Production React components, owned styles, and focused regression tests are added.
- Desktop and portrait-mobile behavior are visually checked in the real app.
- The project documentation entry is updated and `docs/system-design.html` is regenerated.
- API routes, data models, admin editing, and link persistence remain unchanged.

## Out of Scope

- Persisting friendly-link data.
- Admin editing for friendly links.
- Using either generated Iris character asset in runtime UI.
- Removing the existing standalone prototype or candidate assets.
- Claiming the generated illustration is official Wuthering Waves artwork.

## Technical Notes

- Candidate reference files inspected:
  - `src/home/components/HomeStage.jsx`
  - `public/hotspot-prototype.html`
  - `public/assets/home/`
  - `public/assets/prototypes/classroom-bg1.webp`
- Production entry uses viewport `position: fixed` with safe-area-aware offsets.
- Mobile portrait is the primary mobile orientation.
- Character research is recorded in `research/wuthering-waves-iris.md`.
- Current production direction: the edge entry preserves the prototype's transparent Q-version art region and lower-right blue archive plaque; the window keeps its art region blank.
- Final prototype: `public/iris-database-prototype.html`.
- Retained but unused candidate assets:
  - `public/assets/iris-database/iris-edge-chibi-v1.png`
  - `public/assets/iris-database/iris-modal-portrait-v1.png`
- The shared modal shell is `src/modals/modalComponents.jsx`.
