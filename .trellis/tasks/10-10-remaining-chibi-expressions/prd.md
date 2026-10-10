# Seven default chibi expression packages

## Goal
Use vn-sprite-expression for aemeath, lynae, mornye, chisa, changli, qiuyuan and nabomo. Exclude sigrika, denia and baconbits.

## Requirements
- Correction follow-up: modern stage for narration; audit all nine runtime sets and repair the seven new sets' duplicated original brow/eye ink. Update native/runtime art and layered masters together; final visual checks after all source restores are mandatory.
- Follow-up: apply line-specific expressions to the four implemented candy stories (Sigrika, Denia, Aemeath, Lynae), including existing published defaults; retain dialogue, branches, special rainbow portrait, corruption placeholders and explicit admin overrides.
- Use the current 832x1216 default sprites from docs/design-samples/handbook-chibi/assets/characters.
- User selected additional closed-eye smiles, thinking and role-specific emotions. Final set per role: original, smile, serious, surprised, worried, sad, angry, embarrassed, closed_smile, thinking and two distinctive emotions.
- Preserve alpha, body, silhouette and pixels outside individually measured facial feature masks.
- Retain source, face reference, image-tool prompts/candidates and rig; export transparent PNGs, layered PSD, face overview and verification.
- Register completed sets in the existing story sprite catalog, preserving old authored expression IDs where applicable. No dialogue rewriting.
- Update system-design documentation and generate HTML.

## Acceptance
- [x] Seven calibrated packages, twelve distinct expressions per character (84 PNGs and seven PSDs).
- [x] Source-protection and alpha verification pass for every output.
- [x] Face grids, full sprites and allowed masks inspected.
- [x] Runtime full/avatar exports and catalog validation pass; 85 selected manifest entries include the historical Aemeath annoyed alias.

## Delivery and validation
- Follow-up complete: 39 ordinary dialogue expressions across four candy scripts (5 Sigrika, 5 Denia, 14 Aemeath, 15 Lynae). Exact-source sidecar applies to existing published/admin payloads before interpolation; three Denia special portraits and corruption placeholders preserved. Six focused test files / 59 tests and targeted ESLint pass; system-design HTML regenerated.
- `output/character-expressions/seven-default-chibi-expressions.zip`: complete source packages, PNGs, PSDs, prompts, rigs and QA; archive CRC verified.
- Runtime catalog exposes all nine default Q sprite roles; excluded Sigrika/Denia resources and Baconbits remain untouched by this task.
- Five focused test files / 46 tests pass. Lint, production build, portrait contracts, built CSS contracts and system-design rendering pass.
- Full `npm run check` found two unrelated existing CSS inventory failures: 719 files against baseline 718; undeclared 360px breakpoint in match-mode-title-layout.css. Its initial source-art test failure was corrected to compare visible RGB plus alpha, and the focused suite rerun passed.
- Native verification rechecked after PSD/source protection finalization. Photoshop application round-trip was not performed.
- Shared files were already dirty at session start. No commit made; unrelated WIP preserved.

## Scope and edge cases

## Correction follow-up validation
- Narration now uses the modern classroom stage, clears actor art/name and removes the dialogue's reserved portrait column. Verified desktop 1440x1000 and portrait phone 390x844 transitions into/out of narration.
- Audited nine runtime expression sets; rebuilt all seven new sets (84 native PNGs, seven PSDs, full WebPs and avatars) against corrected cleanup/protection masks. Inspected all final facial grids and full-body grids after source restoration.
- All native source-protection and PSD checks pass; runtime import verifies visible RGB and Alpha; 66 focused tests across seven files pass, including original-brow landmark regression. Lint, build, portrait contracts, built CSS and documentation generation pass.
- Updated delivery package excludes local repair rollback backups. Existing unrelated CSS inventory failures remain documented above. Unrelated WIP preserved; no commit made.

Mornye has one eye covered by hair: retain the covered eye and bangs. Existing Aemeath story IDs remain supported via meaningful expression mappings. Costumes and excluded characters stay as they are. Expression preloads remain script scoped.

## Technical approach
Host image editor produces face candidates; the installed VN workflow extracts calibrated local facial parts and assembles against immutable native sprites. First verify one character before extending. Avoid reuse of another character's coordinates.
