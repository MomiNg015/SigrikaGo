# Store Game Mode Icons

## Goal

Store the three provided transparent PNG assets as source-controlled match mode icons and wire them into the home player plaque plus match-mode picker surfaces.

## Requirements

- Save the supplied `xingju-go-match-01-black-transparent.png` as the `spark` / `星炬对弈` mode icon.
- Save the supplied `gomoku-black-lines-transparent-final.png` as the `gomoku` / `五子棋对弈` mode icon.
- Save the supplied `standard-go-black-lines-transparent-final.png` as the `standard` / `标准对弈` mode icon.
- Use stable runtime asset paths under the existing `public/assets/match-modes/` directory.
- Add shared mode metadata for icon paths and English picker labels:
  - `spark`: `SIGRIKAGO MODE`
  - `standard`: `STANDARD MODE`
  - `gomoku`: `GOMOKU MODE`
- Update the Bright School home player plaque stats area to a three-column layout: first row shows the spark, standard, and gomoku mode icons in order; second row shows the corresponding ranks. Do not display rating points on the plaque.
- Update the home match-mode picker buttons so each mode option keeps the left-side Chinese title/rules and right-side matchmaking count, while a centered 50%-opacity decorative watermark layer shows the mode icon followed by the WuWa-backed English label.
- Preserve desktop and mobile contracts for the player plaque and match-mode picker.
- Update the system design asset/UI documentation and regenerate `docs/system-design.html` because this adds runtime resources and wires them into UI surfaces.

## Acceptance Criteria

- [x] `public/assets/match-modes/mode-spark.png` exists and matches the supplied spark icon.
- [x] `public/assets/match-modes/mode-gomoku.png` exists and matches the supplied gomoku icon.
- [x] `public/assets/match-modes/mode-standard.png` exists and matches the supplied standard icon.
- [x] Home player plaque shows mode icons plus ranks in three columns and no longer renders rating text.
- [x] Home match-mode picker buttons keep Chinese/rule/count content while centering a 50%-opacity decorative icon plus WuWa English label watermark.
- [x] System design docs mention the mode icon paths.
- [x] System design docs mention the plaque and match-mode picker icon usage.
- [x] `npm run docs:system-design` has been run.

## Definition of Done

- Asset files are copied into source-controlled project asset paths.
- Existing unrelated worktree changes are not reverted or included as part of this task.
- Mode-selection behavior stays unchanged; picker markup changes are limited to a decorative, pointer-transparent watermark layer.

## Technical Approach

Copy the provided PNG files into `public/assets/match-modes/` using mode-id based filenames. Add icon URL and English label metadata to `src/shared/gameModes.js`, then render that shared metadata in `PlayerPlaque` and as a decorative `MatchModeWatermark` layer in the mode picker. Update the focused player-plaque and mode-picker CSS in base, Bright School, and mobile safety layers, then record the UI contract in the system-design docs and regenerate the HTML artifact.

## Out of Scope

- Adding icons to leaderboard/watch/resume/profile tabs or replay/list surfaces.
- Adding the icon assets to startup preload manifests.
- Creating WebP variants or redesigning the supplied imagery.

## Technical Notes

- The repository already has an empty `public/assets/match-modes/` directory.
- `src/shared/gameModes.js` currently owns mode ids, titles, ordering, board size, komi, skill enablement, and time controls; the icon URL and English label belong there so the plaque and mode picker use one source of truth.
- The task runs in an already-dirty worktree; changes from this task should stay scoped to the new icon assets, task files, and necessary system-design doc updates.
