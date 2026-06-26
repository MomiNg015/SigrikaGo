# Match Mode Backgrounds

## Goal

Design four visual sets of match-mode background images so Spark, Standard, and Gomoku entries/tabs can be distinguished while staying compatible with the project's Bright School academy UI.

## Requirements

- Produce four sets of backgrounds.
- Each set includes one background for each mode: Spark battle, Standard battle, and Gomoku.
- Backgrounds must have strong mode differentiation but remain simple enough for tab buttons and match-entry buttons.
- Images must avoid embedded readable UI text so DOM labels can be layered by the app.
- Visual direction must fit Bright School: light academy paper, classroom stationery, soft color, simple game motifs, and restrained fantasy/terminal accents.
- Save final project-bound assets under `public/assets/match-modes/`.
- Save reusable prompts under `garden-gpt-image-2/prompt/`.

## Acceptance Criteria

- [ ] 12 generated backgrounds exist, grouped into 4 sets x 3 modes.
- [ ] Each mode is visually distinct within every set.
- [ ] Outputs are simple enough to crop for both desktop entrance buttons and mobile/tab buttons.
- [ ] Prompt record is available for regeneration.
- [ ] System design docs are updated if the asset/theme contract changes.

## Definition of Done

- Generated images are copied into the workspace asset directory.
- Prompt/design notes are recorded.
- Relevant docs are updated and `npm run docs:system-design` is run if docs changed.

## Technical Notes

- Existing Bright School visual cues include paper surfaces, grid lines, soft mint/pink accents, dark brown linework, and pressed physical button states.
- Existing match-mode tabs are in `src/styles/modals/replay-mode-resume/match-mode-tabs.css`.
- Existing home match art uses `public/assets/home/fantasy-match-entry.webp`.
- Current gpt-image-2 mode is host-native: prompts are executed through the built-in image tool, not the Garden CLI.
