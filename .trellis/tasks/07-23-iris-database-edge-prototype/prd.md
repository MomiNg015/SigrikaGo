# IRIS Database Edge-Entry Static Prototype

## Goal

Create a standalone static HTML design example that lets the user review how the proposed IRIS Database viewport-edge entry and database window would look on both desktop and portrait mobile home screens before any production implementation begins.

## What I already know

- The entry belongs on the right edge of the home viewport and should remain viewport-relative on desktop and mobile.
- The visual metaphor is an edge bookmark / file-index tab rather than a generic floating circle.
- Activating the entry opens an IRIS Database window.
- The database window places an Iris character illustration on the left and Go-related friendly links on the right on desktop.
- The project already has a Bright School classroom visual language and existing home-screen assets.
- The current repository contains no asset whose filename or character configuration clearly identifies it as Iris.

## Assumptions (temporary)

- The deliverable will be a standalone local HTML prototype under `public/`, not production React behavior.
- One comparison page will show a desktop mockup and a portrait-mobile mockup together.
- The HTML may use small local interactions to preview opening and closing the database window while remaining a static, backend-free prototype.
- Existing project home backgrounds and visual tokens should be reused where practical.
- The prototype will use a newly generated, clearly non-official I.R.I.S. concept illustration informed by public character references rather than copying an in-game screenshot.
- The database window and viewport-edge entry use separate character assets:
  - the window uses the approved normal-proportion full-body concept;
  - the edge entry uses a dedicated chibi half-body portrait.

## Open Questions

- None currently blocking.

## Requirements (evolving)

- Provide both desktop and portrait-mobile examples.
- Keep the IRIS entry fixed to the right viewport edge in both examples.
- Avoid covering the top-right home controls and bottom mobile safe area.
- Show the entry in context on a Bright School-style home screen.
- Show the database window layout, including the illustration region and friendly-link region.
- Research Wuthering Waves I.R.I.S. identity, appearance, and personality before generating the prototype illustration.
- Generate one original portrait-oriented I.R.I.S. concept illustration suited to the left side of the database window.
- Generate a second I.R.I.S. asset for the viewport-edge entry: chibi proportions, head-to-waist framing, readable at small sizes, and posed as if peeking in from beyond the right edge.
- Reuse the same chibi half-body entry asset on desktop and mobile, changing only scale and visible crop.
- Keep the generated illustration free of game UI, logos, captions, and watermarks.
- Keep the prototype isolated from production home-screen code.

## Acceptance Criteria (evolving)

- [x] A standalone HTML file can be served locally without a build step.
- [x] Desktop and mobile examples are visible and clearly labelled.
- [x] Both examples show a right-edge IRIS Database entry.
- [x] The desktop window uses a left-illustration/right-links composition.
- [x] The mobile window adapts to a vertical composition without horizontal overflow.
- [x] The generated I.R.I.S. illustration reflects the researched cyan bob, covered eye, power-button pupil, retro academy uniform, and holographic retrieval identity.
- [x] The edge entry uses a distinct chibi half-body asset rather than shrinking the normal-proportion full-body illustration.
- [x] The chibi entry remains recognizable and legible at both desktop and mobile sizes.
- [x] Mobile controls meet a 44px minimum touch target.
- [x] Screenshots are captured at representative desktop and mobile sizes.
- [x] Browser console reports no errors.

## Definition of Done

- Prototype HTML and only directly required local assets are added.
- Desktop and mobile renderings are visually checked.
- The project documentation entry is updated as required by repository instructions.
- Production React behavior, API routes, data models, and link persistence remain unchanged.

## Out of Scope

- Wiring the entry into `HomeScreen`.
- Persisting friendly-link data.
- Admin editing for friendly links.
- Final production accessibility and regression tests.
- Claiming the generated illustration is official Wuthering Waves artwork.

## Technical Notes

- Candidate reference files inspected:
  - `src/home/components/HomeStage.jsx`
  - `public/hotspot-prototype.html`
  - `public/assets/home/`
  - `public/assets/prototypes/classroom-bg1.webp`
- The static prototype should prefer `position: fixed` semantics for the viewport-edge entry.
- Mobile portrait is the primary mobile orientation.
- Character research is recorded in `research/wuthering-waves-iris.md`.
- Approved art direction: normal-proportion illustration inside the window; chibi half-body illustration on the viewport edge.
- Final prototype: `public/iris-database-prototype.html`.
- Final generated assets:
  - `public/assets/iris-database/iris-edge-chibi-v1.png`
  - `public/assets/iris-database/iris-modal-portrait-v1.png`
- Browser QA covered desktop click/Escape/backdrop/close flows, focus wrapping, a 390×844 touch-open flow, 44px controls, modal bounds, broken images, console errors, and horizontal overflow.
