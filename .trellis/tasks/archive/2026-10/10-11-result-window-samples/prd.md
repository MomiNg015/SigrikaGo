# 对局结果窗口三套响应式样板

## Goal
Review the current result window and provide three working visual alternatives before choosing a production layout.

## Approved production direction
User selected direction 1. Integrate the compact side layout, center the portrait vertically within the window (breakout optional), remove usernames, preserve victory/defeat effects. Place Return to board and Leave room in one row; leaving uses existing room-leave and home navigation. Show authoritative rank deltas beside the rank label, prioritizing rank changes over reset stars; nine-dan uses points. Preserve special candy-duel continuation.

## Requirements
- No usernames in any result sample.
- Compact content-driven window; prominent full-body artwork may extend beyond its paper surface.
- Preserve the existing 1.05s victory hop, result expression resolver and defeat rain GIF with grayscale treatment.
- Distinct directions: side breakout, top portrait, diagonal report.
- Desktop and portrait phone support, win/loss/draw and reward/mode previews.
- Isolated docs/design-samples page; no production result, reward, sound or navigation changes in this exploration.

## Findings
The Bright School owner in result-room-popovers.css forces 50vw/40vh, caps the portrait at 152px and clips overflow. ResultModal also adds a username beneath the artwork. These conflict with the requested density and portrait emphasis.

## Acceptance
- All three directions usable at 1440x900, 390x844, 360x640 and 320x568.
- Win/loss art and rain load; portrait and action bounds stay within viewport.
- Preview controls, closing/reopening, keyboard focus and reduced motion work.
- Browser screenshots and scoped lint pass; system-design entry and HTML updated.

## Scope decisions
The user requested three samples, so the deliverable is a local interactive comparison. Direction selection happens after review. Existing production components remain the reference. Additional modes are demonstration fixtures, not backend integration.

## Delivery
Three samples completed under docs/design-samples/result-window-2026-10-11. All 36 viewport/outcome checks, preview controls, reduced-motion checks and scoped ESLint passed. Desktop/mobile screenshots and verification.json saved. System-design Markdown and generated HTML updated. No production component or global stylesheet modified; task stays available for the user's direction selection. No new production contract warrants a spec change at this stage.
