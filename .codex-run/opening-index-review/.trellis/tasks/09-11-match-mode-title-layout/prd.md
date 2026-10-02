# Match mode title layout

## Final requirements
- Cards show prominent single-line mode titles and counts; English background labels stay complete and background icons are hidden.
- Rules are absent from buttons. Desktop fine-pointer hover above 768px shows a cursor-following portal tooltip, clamped to the viewport.
- Leave, pointer down, Escape, scroll and resize dismiss the tooltip; mobile and touch do not show hover tooltips. A separate absolutely positioned 22px info button with a 16px icon toggles tap rules without changing layout or triggering matching. Outside pointer input dismisses it.
- Mode selection, prewarming and practice entry are preserved.
- User owns visual acceptance. 81 relevant tests pass, including desktop hover dismissal and mobile suppression; design HTML regenerated.
