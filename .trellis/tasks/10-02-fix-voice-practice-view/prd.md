# Fix opening voice and practice bot board

## Requirements
- Opening voices must not replay when resizing causes the viewport gate to remount the room; new games and new team rounds still play once.
- Zhunshibao searches actual stone colors despite Nabomo color illusions, for browser and legacy engines and every difficulty. Preserve hidden-hand visibility and human projections.
- Preserve unrelated working changes, add regression tests and synchronize system design.
## Scope decisions
User request authorizes both fixes. Include resume/replay and team-round boundaries. Exclude broader AI strength tuning and other skill changes.
