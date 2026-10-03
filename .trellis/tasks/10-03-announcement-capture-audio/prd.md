# Announcement first-open and capture completion audio

## Goal
Fix the first announcement opening reporting a JSON format error; play character victory voice and victory system sound whenever a capture challenge completes all 100 moves and produces a result.

## Requirements
- Identify and fix the announcement first-request cause, preserving real errors and retry behavior.
- Completed capture challenges celebrate regardless of the normal game winner or score, only after an authoritative result exists.
- Incomplete/aborted challenges must not celebrate; preserve audio settings and duplicate-playback prevention.

## Acceptance Criteria
- Regression coverage for first announcement open and subsequent normal opens.
- Capture completion triggers both requested audio channels; incomplete challenges do not.
- Relevant tests, lint, build pass; system design is updated and rendered.

## Verification Status
- [x] Capture completion audio implemented and checked in prior commit `c547b922`.
- [x] Controlled local proxy outage reproduces empty non-JSON first response; fixed JSON 503 and bounded announcement GET recovery verified with real HTTP fixtures.
- [x] Announcement modal/summary with real client verifies first-open and reopen under stable service and list/detail/summary transient failure fixtures.
- [x] Unexpected announcement format diagnostics retain path/status/Content-Type without token or response contents.
- [ ] Original frequent announcement-only failure remains unobserved; user retest or captured first-response diagnostics needed to establish whether the proxy fix resolves that exact occurrence. Keep task in progress.

## Out of Scope
UI redesign, rule/scoring/reward changes, deployment.
