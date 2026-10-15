# Settings design exploration

The isolated `docs/design-samples/settings-2026-10-15` page contains three unselected proposals and a production-component comparison. It is not the production settings owner.

- Use `DEFAULT_AUDIO_SETTINGS`, `VISUAL_THEME_OPTIONS`, `DEFAULT_SITE_SETTINGS` and the existing `WindowTitleSticker` rather than duplicating these contracts.
- State is local React state. Never call audio persistence, authentication or theme storage helpers from a preview.
- Mute preserves the numeric channel value; moving a slider clears only that channel's mute flag. Master mute has a separate visible status and does not rewrite channel values.
- Native vertical ranges use `writing-mode: vertical-lr` and `direction: rtl`; verify Home/End and keyboard value changes after styling their rails and thumbs.
- Keep category IDs separate from design IDs, and namespace styles to the preview root. A category name must not accidentally activate a different design's CSS.
- Preserve the title asset outside the content scroller. Validate all three categories at 320px, 390px and desktop widths, plus close/reopen and keyboard tab navigation.
- Unavailable themes remain unavailable; illustrative swatches are not previews of implemented themes.
