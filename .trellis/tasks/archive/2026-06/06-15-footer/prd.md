# Configurable Desktop Footer

## Goal

Make the desktop home footer stay fixed to the viewport bottom-right and allow admins to edit the footer content from system settings, including links.

## What I Already Know

* The home footer is rendered by `src/home/components/HomeFooter.jsx` and currently hard-codes the site title, copyright text, and ICP text.
* Public site settings live in `src/shared/siteSettings.js`, are persisted through `server/siteSettings.js`, and are loaded by `src/app/siteSettingsCatalog.js`.
* Admin system settings are edited in `src/admin/AdminSiteSettings.jsx` via `PATCH /admin/site-settings`.
* Existing tests already assert a desktop footer fixed-position safety layer in `src/styles/mobile-adaptive/desktop-home-footer.css`, but the current product behavior still reports the footer moving with the view.

## Assumptions

* Footer content should be public site configuration, not a separate admin-only resource.
* Hyperlinks should be supported without allowing arbitrary unsafe HTML.
* Mobile footer behavior should remain in normal document flow unless the existing mobile design already overrides it.

## Requirements

* Keep the desktop home footer fixed at the page viewport's lower-right corner while the home stage scrolls.
* Add a long-text footer editor to the admin system settings page.
* Persist and expose the footer text through the existing site settings flow.
* Render configured footer content on the home footer.
* Allow hyperlinks in the footer content.
* Update system design documentation and regenerate `docs/system-design.html`.

## Decisions

* Footer links use Markdown-style syntax: `[label](https://example.com)`.
* Rendering converts only `http://` and `https://` markdown links into anchors. Other content remains plain text.

## Acceptance Criteria

* [ ] On desktop, the footer uses a viewport-fixed bottom-right position and is not tied to the home screen scroll position.
* [ ] Admin system settings include a long-text footer field.
* [ ] Saving system settings persists the footer field and refreshes the home footer.
* [ ] Footer links render as clickable anchors using Markdown-style `[label](https://example.com)` syntax.
* [ ] Existing site settings defaults still seed missing keys.
* [ ] Relevant tests pass.
* [ ] `npm run docs:system-design` has been run after Markdown updates.

## Definition of Done

* Tests added or updated where appropriate.
* Lint/type/build-relevant checks run for the touched area.
* Docs updated for behavior/configuration changes.

## Technical Notes

* Relevant files inspected: `src/home/components/HomeFooter.jsx`, `src/styles/base/home-stage-artboard.css`, `src/styles/mobile-adaptive/desktop-home-footer.css`, `src/admin/AdminSiteSettings.jsx`, `src/shared/siteSettings.js`, `server/siteSettings.js`, `src/home/HomeScreen.test.jsx`, `server/siteSettings.test.js`.
* Project instruction requires updating `docs/system-design.md` for every update; architecture/runtime/config changes should also update a relevant split document under `docs/system-design/`.
