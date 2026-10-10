# Restore accepted rolling rainbow and crop avatar uses

## Requirements
Restore v3 (commit 0a2afd54) translucent rolling rainbow, before opaque eye/mouth coverage. Apply it to runtime assets and preserve 24x60ms timing. Where the project uses cropped avatars, use an identically framed animated candy avatar: Denia's default avatar manifest specifies [0,0,832,832] resized to 512x512. Full-body uses retain native/normalized presentation. Preserve costume overrides and unrelated WIP.

## Findings and approach
`characterPortraits` ignores avatar variant in its default candy branch. `CharacterBustPortrait` derives `rainbow-spray-avatar.webp` for the profile variant, but this asset is missing. Generate that companion from every native frame, register it, resolve avatar requests to it, and keep the existing chibi crop geometry. Special story-avatar presentation should also use this companion and a same-crop still/fallback. Include the new asset in effect preloads.

## Acceptance
- [x] Restored native animation equals v3, with no opaque feature coverage.
- [x] Dynamic avatar pixels equal the ordinary Denia crop operation frame by frame; preserve timing.
- [x] Shared normal/avatar, profile identity and story resolvers use the right asset; costumes unaffected.
- [x] Runtime desktop/phone visual checks, regressions, docs and generated HTML pass.

Scope is explicit in the user's follow-up; no unresolved questions. Reuse loaded Trellis brainstorm/before-dev/check specs from this session.

## Validation
Runtime native and normalized assets exactly match v3 bytes. Every avatar frame matches the ordinary avatar-manifest crop with zero visible RGBA differences. 138 focused tests passed during UI verification; finalized the new regression file to three resolver/geometry contracts rather than duplicating pre-existing uncommitted component tests, all three pass (135 tests in the final combined set). Desktop 1440x1000 and portrait 390x844 browser checks pass for friends, leaderboard, watch, skill and warehouse targets, with matching 512px natural sizes and unchanged displayed dimensions. Existing handbook desktop/portrait geometry checks pass; all 39 visible bounds remain valid. Full lint and production build pass; build emits existing public-asset-placeholder and chunk-size warnings outside this change. System-design HTML regenerated.
