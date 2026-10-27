# Unavailable profile feature toast

## Goal
Clicking either 成就 or 个性化 shows the exact ordinary toast 暂未开放，敬请期待w while the beta feature flag is off. Keep both feature windows and server awards closed. Retain normal opening behavior if the flag is enabled.

## Acceptance
- [x] Both buttons accept activation and show the requested toast through the shared application queue.
- [x] Unavailable windows remain unmounted; enabled behavior remains covered.
- [x] Focused tests, lint and synchronized design documentation pass; preserve unrelated WIP.
