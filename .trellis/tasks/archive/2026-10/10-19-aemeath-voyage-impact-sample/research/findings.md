# Research and decisions

Production effect ownership: `src/room/boardSkillEffectRegistry.js`, `playVoyageStar`, `drawVoyageStarSword`, `drawVoyageStarEarthquake`. White geometry, particle-only quake transform and ring/circle ground response explain weak mass; sample moves the whole projected board and adds fracture geometry.

Official reference: https://www.bilibili.com/video/BV1qZ6yBXEVv and https://www.youtube.com/watch?v=psq5Izh9GHM. Official pages and public storyboard previews were inspected; full motion was not reliably available for shot-by-shot reconstruction. Research downloads remain ignored, outside retained artifacts.

Latest user sword decision is authoritative: exact Exostrider replica or deliberately abstract lightblade. Implemented abstract lightblade and removed the intermediate mechanical asset.

Music uses `MUSIC_TRACKS['aemeath-voyage-star-default']`, not ordinary Aemeath music. The shared resolver returns the voyage cast voice. Original SkillBanner owns wall-clock form changes, so full sequence is 1x; board-only segment owns seeking and slow playback. One AudioContext clock schedules music, voice and synthesized impact, while the banner's internal audio is muted.

Production timing remains 3200 ms banner, 1800 ms board effect and 4136 ms resolution. The ~8 s exploratory sample is not a production timing change. Original renderer, authoritative game state and deployment configuration are untouched.

Retained implementation and full QA notes: `docs/design-samples/aemeath-voyage-2026-10-19/README.md`.
