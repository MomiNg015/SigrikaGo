# Verification

- Removed the full-screen dark DOM surface and cover keyframes, rather than replacing black with a full-screen flash.
- Scene pixels remain visible during peak distortion; two additional signal steps coincide with the form change. Timing and authoritative resolution unchanged.
- Recorded uninterrupted 390x844 playback, inspected a 12-frame sequence spanning the former blackout. Checked 1650ms peak on 1440x900 desktop and 390x844 phone; scene remains visible and no blackout node exists.
- Eighty related behavior/banner/style tests pass after correcting timer cleanup callback argument forwarding. Full lint, build, built CSS contracts and system-design generation completed. Direct single-JSX ESLint command is ignored by the existing project config; the full project lint command passed.
- Updated sample recording, peak screenshots, design documentation and spec. Scoped CSS budget decreases 492 bytes; unrelated docs and inventory edits remain in the working tree.
