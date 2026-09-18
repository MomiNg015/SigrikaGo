# Login loading hint

## Goal
Show `（首次加载需要1-3分钟，请耐心等待哦~）` below the post-login progress bar.

## Requirements
- Use existing small status text styling.
- Enable the hint only in the `preloading` route.
- Preserve loading logic and existing unrelated work.

## Acceptance Criteria
- The exact hint appears between the progress bar and rotating tips after login.
- Other loading screens retain their current content.
- Focused preload tests and lint pass; system-design documentation is regenerated.

## Scope
Trivial copy addition; no new loading behavior or design pattern.
