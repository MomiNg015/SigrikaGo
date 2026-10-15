# Settings window design samples

## Goal
Deliver three interactive settings-window directions. The user moved focus away from authentication samples; do not integrate those designs.

## Requirements
- Preserve the existing settings title artwork and campus paper identity.
- Preserve Audio, Interface, About and all four audio channels.
- Three distinct layouts: paper list, club mixing desk, folded settings book.
- Local state only; no account requests, audio preference persistence or real theme changes.
- Sliders, explicit mute controls, tabs, unavailable themes, close/reopen and keyboard navigation work.
- Desktop and portrait phone layouts; existing production SettingsModal available for comparison.

## Acceptance
- Verify all directions at desktop and 320/390px, including tabs and mute/unmute semantics.
- Keep master/channel volume numbers while muted; slider movement unmutes that channel, matching production.
- Use current default about text and theme options. Do not pretend future themes are available.
- Update system design and generated HTML; preserve unrelated changes.

## Scope
Isolated docs/design-samples/settings-2026-10-15 only; production integration awaits selection.
