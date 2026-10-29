# Prevent accidental browser selection in player UI

## Scope
- Disable native drag text/image selection across the player application, including tutorial, battle, home and player windows.
- Preserve native selection, copy and editing in input, textarea and editable content.
- Suppress native image drag ghosts in the player UI without changing pointer handlers, scrolling, keyboard focus or game actions.
- Keep admin selection unchanged and preserve unrelated loading/settings/audio work.

## Implementation
Use the existing foundation CSS owner and player-theme-enabled shell; avoid global document event interception or transparent selection colors. Register only the exact scoped CSS byte delta. Update system-design entry and UI chapter.

## Acceptance
- [x] Actual mouse sweeps produce no selection across tutorial header, player information or portraits.
- [x] Native image drag does not start; normal guide button/board input still works.
- [x] Input and textarea selection/editing work; admin retains native selection.
- [x] Browser and existing CSS/document checks pass; documentation and scoped commit complete.

## Validation
- Real browser reproduced native blue selection with the old inherited text setting, then confirmed zero selected text with the new CSS at 1440x900 and 390x844. Native image dragstart stayed at zero; skill-to-board and completion callbacks still worked.
- Input, textarea and contenteditable native selection/replacement passed under full player CSS; isolated admin text remained selectable. No browser errors.
- npm run lint, four existing CSS suites (144 assertions), production build, built CSS contracts and system-design generation passed.
- Design-hook palette findings refer to existing foundation declarations outside this diff; no colors, layout or animation were changed and no hook suppression was added.
