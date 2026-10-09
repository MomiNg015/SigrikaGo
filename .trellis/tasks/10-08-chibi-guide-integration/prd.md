# Chibi guide integration

## Confirmed scope
Apply the produced Denia and Sigrika chibi expression packages to story and battle guides, with desktop and portrait-mobile visual review. Preserve story text, graph, timing, actions, special appearances and legacy fallback.

## Implementation
- Retain standard-v1 identifiers so existing explicit published selections switch alongside authored defaults.
- Retain all historical expression IDs via explicit source aliases; expose the newly available expressions.
- Import selected characters from the local work packages into committed public runtime assets, preserving full-image alpha and visible pixels and fixed avatar crops.
- Add a profile-controlled chibi presentation marker. Full-body story art uses contain-like native proportions at the existing stage anchor; teaching/home avatars keep existing fixed frame geometry.
- Update importer, tests, layout spec and system design; regenerate HTML.

## Acceptance
Both characters appear with chibi art in the production story and teaching components. Expression switches retain image geometry, long text/options remain reachable, 360x640 and 390x844 phones have no horizontal overflow, fallbacks and special forms continue working. Run targeted DOM/data/browser tests and the full check gate.

## Verification result
Implementation and visual review complete. Browser 15/15, related tests 95/95 and production build gates pass. Full check remains limited by four unrelated localhost:5173 EACCES proxy tests; see review/verification.md. No commit or task archive performed.
