# Zhunshibao difficulty dialog preview

## Scope
User approved production integration on 2026-10-14, including the bottom frame painted above the portrait. Preserve the accepted preview as reference and implement the same composition in the real difficulty dialog.

## Requirements
- Replace bottom Return with top-right close, matching the character picker.
- Move character slot to upper-right controls.
- Remove top rules copy.
- Add lower breathing space with the current default Sigrika bust anchored exactly to the window bottom, and a chat bubble to its left.
- Exact bubble text: 随机猜先。吃掉准时宝22个子或数子胜就算胜利！
- Keep three difficulties, independent character choice and explicit start as interactive local previews.
- Reuse existing title sticker, paper/ink/pink/mint styling; validate desktop and portrait phone.

## Asset decision
Current shared default resolver uses handbook-chibi-sprites/sigrika.webp. Crop that existing full image into a bust without generating or editing assets. Clip its lower edge at the dialog's bottom border.

## Acceptance
Production retains difficulty/character selection, real start payloads, focus restoration and Escape. Validate the real component at desktop and 320/360/390px portrait widths. Bottom frame must remain fully visible above the portrait.

## Production verification
- Extracted the real PracticeDifficultyDialog with the approved close/character controls, rule bubble and shared default Sigrika crop. No change to character validation or start payload ownership.
- All 237 home/action/server/style/theme assertions passed after registering the two new theme imports. Lint, production build, built CSS checks and generated system design passed.
- CSS inventory still reports pre-existing contract drift. The scoped commit records the combined focus/confirmation/dialog change as 5667 normalized bytes, two files and 29 important declarations; unrelated debt is not absorbed.
- Browser screenshots at 1440x1000, 390x844, 360x640 and 320x640 show a fully visible window, no horizontal overflow, zero bottom-alignment error and a visible 3px frame above the portrait. Advanced practice starts with the explicitly chosen aemeath character and random color, then dismisses the window.
- The chat-tail border diagnostic is the same confirmed preview arrow, not a side-accent design defect; no suppression added.
