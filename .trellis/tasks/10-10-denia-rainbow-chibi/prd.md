# Denia rainbow spray using the current chibi art

Replace the retired candy animation with the current Denia default chibi silhouette and costume. Three rainbow jets must originate from both eyes and the mouth, flow continuously and loop without a flash or whole-character jitter. Reuse the accepted surprised expression rather than generating another face.

- Build deterministic effect overlays separately from the unchanged sprite; retain native frames, source hashes, GIF preview and an animated WebP.
- Update both the special candy story identity and the persistent default candy-effect portrait; keep script IDs, dialogue, rewards and costume-specific overrides.
- The special story identity uses the modern chibi stage and full-body geometry; general portraits retain the 900px normalized / 792px safe-box contract.
- Validate animation timing, source pixels outside the effects, endpoints, loaded browser frames at desktop and portrait phone size, and special story preloads/resolution.
- Update system-design documentation and generated HTML. Preserve unrelated WIP.

## Validation
- 24 native PNG frames verified: zero visible-RGBA/alpha changes outside the independent effect overlays. Runtime native WebP lossless optimization rechecked against decoded source frames.
- 56 related tests pass, including loop/timing, stationary current lower-body art, modern-stage special identity, reduced-motion still and failed-source fallback. Lint, build, portrait contracts, built CSS and generated system-design HTML pass.
- Browser checked actual accepted candy branch at 1440x1000 and 390x844: current art, three correctly anchored jets, frame changes, no page errors, clean final narration. Reduced-motion media selects the static companion.
- Production files, GIF and reproducible source work package delivered. No commit made; unrelated WIP preserved.
