# Top Announcement Contract

## Scope and ownership

- `TopAnnouncement` renders before the main element in `HomeScreen`, not as a third child of the existing home grid and not inside `HomeHeader`. It is only shown in the home view.
- The selected style is the ink sample with the fixed label 校园播报 and existing LXGW font. The owner is `styles/home-terminal/campus-broadcast.css`; preserve full width, a 40px single text row plus top safe area, and the original header gutters.

## Data flow

- `DEFAULT_SITE_SETTINGS`: `topAnnouncementEnabled: false`, `topAnnouncementText: ""`.
- `AdminSiteSettings` -> existing authorized PATCH `/api/admin/site-settings` -> `sanitizeSiteSettings` -> SiteSetting string values -> public `/api/site-settings` -> `useSiteSettingsState` -> `HomeScreen` -> `TopAnnouncement`.
- `normalizeTopAnnouncementText` is the shared text boundary: strings only, whitespace collapsed and trimmed, max 500 UTF-16 units. Do not interpret HTML or Markdown. Empty content remains empty.
- Store the switch as `"true"`/`"false"`, project it as a boolean. Disabling must preserve text. Startup defaults create missing values only; no migration or live example announcement is needed. Admin-edited deployment defaults follow the existing snapshot export contract.

## Refresh and motion

- Public configuration refresh runs on home entry, visible 30s intervals, focus and visibility return. Outside home or in hidden tabs, do not poll. Failures retain last successful state.
- A direct admin save invalidates earlier reads and their deduplication loader, so neither an old response nor a new refresh joining that old request can replace the save.
- Measure both text and viewport with ResizeObserver, including font/viewport changes. Only overflow scrolls: 36px/s, 1.6s initial delay, a duplicated visual copy. Pause on hover/focus or persistent pause; replacement text resets state.
- Reduced motion disables automatic movement and exposes one keyboard/touch-scrollable line. A single accessible status contains the complete message; visual copies are aria-hidden. Clean up observers and preference listeners.

## Verification and failure cases

- Server tests: fresh default seeds, save/read/disable/clear, 500-unit bound, whitespace normalization, plain text, existing values surviving startup, route PATCH/GET and audit.
- Admin DOM: load current draft, edit toggle/text, send correct PATCH and propagate returned settings.
- Hook DOM: visible/hidden polling, focus, off-home cleanup, error retention and pre-save read race.
- Component DOM: hidden blank/disabled, overflow resize, pause reset, reduced motion and cleanup. Home SSR verifies placement before main.
- Real browser with full HomeScreen/theme at desktop and 390/320px: loaded LXGW, light body text on dark ink, mint label/icons, quiet pause button, one line, no horizontal page overflow, close collapse and manual reduced-motion reading.
- Owner selectors must beat the repeated Bright School important text/button rules. In a `:is()` list, a `track > span` arm adds type specificity to every arm; use `:where(span)` when later label-specific colors should win.
