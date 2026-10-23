# Scroll ownership research

- Production dialogs share `.modal-backdrop` / `.nested-modal-backdrop`, but many are local state or portals rather than entries in `overlayRegistry`.
- Bright School mobile sets both application shell and home scrolling to `overflow-y: auto !important`; locking only body cannot protect these independent containers.
- Existing `overscroll-behavior` belongs to individual list/content owners, so headings and non-scrollable content have no universal guard.
- Chosen approach: one shell-level observer and temporary background ancestor locks, with directional touch/wheel boundary handling. Rejected: per-window hook calls (many local/portal paths to miss) and blanket `touch-action: none` (breaks internal scrolling and pinch zoom).
- Browser references: [MDN overscroll-behavior](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/overscroll-behavior) explains scroll-container boundaries; [MDN addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener) documents explicit passive false for cancellation.
