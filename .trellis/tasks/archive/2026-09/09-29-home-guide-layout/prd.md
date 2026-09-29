# Home guide dialogue layout

## Requirements
- Remove the normal continue/skip button row. Keep click-to-reveal and background click-to-advance.
- Put an accessible icon-only skip button in the viewport top-right.
- Ordinary dialogue stays at the top. Action-step dialogue sits above or below its live target without covering it.
- Hide NPC dialogue during the player reply; center the reply independently.
- Preserve save/retry feedback and input blocking, desktop and portrait support.

## Validation
Focused DOM tests and serial one-worker browser checks. Update system design and generated HTML. Preserve unrelated dirty files; no server changes.
