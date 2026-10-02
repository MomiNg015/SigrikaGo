# PRD: Hide Number Input Spinners

## Goal

Remove the browser-provided `+1/-1` spinner controls from numeric input boxes so admin numeric fields look cleaner and do not invite accidental step changes.

## Requirements

- Hide native number input spinner controls across the app, including admin gacha numeric fields.
- Keep `type="number"` fields numeric so existing validation, mobile numeric keyboards, min/max values, and form behavior continue to work.
- Do not change the values, labels, units, validation, or save payloads for gacha/admin forms.
- Keep `docs/system-design.md` synchronized.

## Acceptance Criteria

- Number inputs no longer show WebKit inner/outer spin buttons.
- Firefox number inputs use textfield appearance rather than native number spinner appearance.
- Existing admin and gacha tests still pass.
- Project check gate passes.

## Out of Scope

- Replacing number inputs with custom steppers.
- Changing numeric validation rules or backend payloads.
