# Verification

Real HomeScreen, HomeHeader, PlayerPlaque and HomeStage rendered with the complete global CSS in the local Vite fixture; only user/catalog props are supplied locally.

- 2542x1180: ID x moved from 252.08 to 577, aligning with the utility group; handbook x moved from 692.94 to 855.40. Match x remains 1201.16.
- 1920x1080: ID and utility left x=266; match unchanged.
- 1440x900: ID and utility left x=181.91; match unchanged.
- 390x844: all measured component bounds unchanged from before.
- Screenshots: `.codex-run/wide-home-after-{2542,1920,1440,390}.png`.
- 26 focused tests passed, including observer repeatability, narrower desktop fallback, mobile cleanup, and unmount cleanup.
- Full quality gate: `.codex-run/wide-home-check.log`.
