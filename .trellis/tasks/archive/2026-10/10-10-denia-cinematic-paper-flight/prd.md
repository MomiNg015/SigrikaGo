# Denia cinematic paper flight

## Goal
Rework the existing match transformation from the user's official combat-video reference, preserving the agreed one-second lead, simultaneous portrait swap, and match-long form.

## Reference evidence
- https://www.bilibili.com/video/BV1scL768EPf/ (official combat showcase), inspected frames at 46–52 seconds, with 8 fps inspection at 49–51 seconds.
- Official alternate: https://www.youtube.com/watch?v=aKWE-ON3XSM
- The reference has sparse distant silhouettes, readable middle pieces, and a few much larger foreground pieces passing close to the lens. The foreground briefly occludes the change at about 49.75–50.25 seconds. Paper silhouettes follow a shared flow, with individual banking and perspective; they do not form an even wallpaper grid.
- Source video is temporary research material in .codex-run; do not ship or commit it.

## Requirements
- Apply this depth and staging to the production Canvas renderer, retaining the user's left-to-right direction.
- Thin middle and far layers; stronger size/depth hierarchy, clustered curved streams, staggered near-lens passes.
- Occlusion comes from foreground paper silhouettes, never a tiled texture or solid screen wipe.
- Preserve existing timing, supplied form art, state lifecycle and reduced-motion behavior.
- One canvas with bounded particles and cached depth sprites; no added libraries.

## Acceptance
- [x] Inspect entrance, crossing, occlusion and reveal at desktop and portrait-phone sizes.
- [x] Swap is concealed briefly; silhouettes and negative space remain readable on either side of the swap.
- [x] Bounded draw cost, stable cast lifecycle tests, lint and build pass.
- [x] Update system design and preview notes; regenerate system-design.html.

## Scope
Renderer, focused tests, reference/staging documentation and preview evidence only. No gameplay, server timing, account appearances or unrelated WIP changes.

## Open questions
None: source video and prior accepted behavior determine the scope.

## Validation results
15 focused tests and lint pass; production build succeeds with two public-asset placeholder warnings and the bundle-size warning. No CSS changed. Desktop 1440x900 and portrait 390x844 inspected. Current draw submission P95 is approximately 1 ms in local Chrome (not a GPU or physical-device frame-rate claim). Generated project-only preview video is 423 KB.
