# Generate recruitment poster and radio coupon assets

## Goal

Generate six hand-drawn candidate images for the SigrikaGo recruitment item set: three for the campus recruitment poster and three for the Xianyue Radio broadcast coupon. The images should match the existing Bright School asset language and be ready to review as project assets.

## Requirements

- Create a new git branch before generating assets.
- Use the `gpt-image-2` skill workflow and keep reusable prompts under `garden-gpt-image-2/prompt/`.
- Generate three campus recruitment poster images.
- Generate three Xianyue Radio broadcast coupon images.
- Save finished image candidates under `public/assets/promotional/`.
- Preserve existing runtime item SVGs; this task only adds candidate raster assets.
- Keep the style hand-drawn, light, and close to existing Bright School assets: cream paper, dark brown sketch outline, soft pink, mint, pale blue, and school notice-board stationery cues.
- Keep elements sparse. Each image should have one clear main object plus at most a few supporting motifs.
- Update system design docs for the new shipped asset location and regenerate `docs/system-design.html`.

## Acceptance Criteria

- [ ] Branch `codex/recruitment-radio-assets` exists and is checked out.
- [ ] Six prompt files exist in `garden-gpt-image-2/prompt/`.
- [ ] Three recruitment poster images exist in `public/assets/promotional/`.
- [ ] Three radio coupon images exist in `public/assets/promotional/`.
- [ ] Existing files `public/assets/items/recruitment-poster.svg` and `public/assets/items/radio-recruitment-ticket.svg` remain unchanged.
- [ ] `docs/system-design.md` or the matching system-design split doc records the new promotional candidate asset set.
- [ ] `npm run docs:system-design` has been run.

## Definition of Done

- Prompts and generated images are saved in the repo.
- Documentation has been updated for asset placement.
- Existing unrelated dirty work remains unstaged and untouched.

## Technical Approach

The task uses GPT Image 2 Mode A by temporarily setting `ENABLE_GARDEN_IMAGEGEN=1` for the generation commands, because the environment has `OPENAI_API_KEY` available. Generated candidates are saved directly to `public/assets/promotional/` rather than `outputs/`, because these are user-requested project assets rather than local previews.

## Out of Scope

- Replacing the current runtime item SVG references in `src/shared/recruitment.js`.
- Registering these candidates in preload manifests.
- Editing recruitment UI layout, item behavior, prices, or candidates.
- Creating a final selection UI.

## Technical Notes

- Existing item icon sources:
  - `public/assets/items/recruitment-poster.svg`
  - `public/assets/items/radio-recruitment-ticket.svg`
- Existing runtime item definitions:
  - `src/shared/recruitment.js`
- Existing asset docs:
  - `docs/system-design.md`
  - `docs/system-design/05-assets-audio-preload.md`
  - `docs/system-design/06-ui-theme-mobile.md`
