# Beginner engine restoration

## Evidence

- Commit `8a221237` replaced all three public practice tiers with GNU Go.
- Its parent version of `server/practiceBotDecision.js` contains the complete local heuristic entrypoint `choosePracticeAction(gameView, botColor, difficulty, { random })`.
- The original public beginner configuration used:
  - `delayMs: [1200, 1800]`
  - `topChoices: 8`
  - `randomMoveChance: 0.25`
- The heuristic evaluates only moves accepted by the shared `playMove(..., { colorIllusion: null })` boundary, so it remains compatible with Spark invalid points, ko, suicide, occupied points, and other project legality.

## Integration boundary

- Restore the heuristic code in `server/practiceBotDecision.js`; this file already owns `obviousDeadBotGroups()` for counting.
- Branch in `server/practiceRoomAutomation.js` by the configured difficulty `strategy`.
- Keep GNU Go failure handling exclusive to GNU Go tiers. The beginner heuristic must not become a fallback when GNU Go fails.
- Branch the `practice:start` readiness probe by the same strategy so a missing GNU Go executable does not block beginner room creation.
- Preserve the legacy `basic` alias as GNU Go to avoid silently changing restored-room behavior that the current contract already established.

## Test impact

- Restore focused decision tests for heuristic legality, deterministic selection, and pass behavior.
- Update automation tests to assert beginner avoids `practiceEngine.search`, while intermediate/advanced still use it.
- Update socket tests to assert unavailable GNU Go permits beginner and rejects intermediate/advanced.
