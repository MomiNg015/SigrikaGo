# Handbook detail and wardrobe design samples

## Goal
Review the existing character detail and wardrobe windows and deliver three interactive design directions, as requested. Production integration is a separate decision.

## Scope and decisions
- Three complete flows: paper dossier, portrait stage, pocket notebook.
- Reuse current character/costume art and copy from the committed catalog; label account ownership as sample data.
- Include the existing production components as a comparison, using isolated props.
- Desktop and portrait phones, including 320px width. Full figures remain contained.
- Expose wardrobe entry, preview versus equipped state, owned versus locked state, and explicit equip confirmation.
- Keep skills, derived skills, CV, acquisition, voice and music accessible. Never add sortie behavior to detail.
- Local state only; no account writes or purchase requests.
- Update system-design entry and generate HTML.

## Acceptance
- All three detail/wardrobe pairs can be compared in one preview.
- Existing two characters (Denia and Sigrika) exercise different names, skills and costume counts.
- Preview, equip, locked preview, close/reopen, keyboard containment and phone layouts are checked in browser.
- Save screenshots and a concise evidence-based review with tradeoffs.

## Out of scope
Production component/style changes, backend changes, new art, real ownership changes.

## Sources
`src/modals/house/HouseNestedDialogs.jsx`, `CharacterCostumeDialog.jsx`, wardrobe CSS, handbook portrait contract, costume contract, committed admin snapshot.
