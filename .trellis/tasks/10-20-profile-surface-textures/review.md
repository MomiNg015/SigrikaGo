# Surface sample review

## Result
Three paint-only variants render the existing production ResumeModal/UserProfileCard, full stylesheet cascade, current portrait resolution and original bookmarks. No production code or CSS changed.

## Evidence
- `verify.mjs`: 24 variant/context/viewport combinations match the production baseline's measured geometry and visible text exactly. All current images loaded; no retired portrait or real API requests; no console/resource errors.
- Paint declaration whitelist rejects dimensions, spacing, typography, display and positioning in surfaces.css.
- Actual computed text contrast checked against base surface colors; desktop, mobile, scrolled records and long-name/social screenshots visually inspected. Texture layers reviewed separately.
- Dark summary SVG child paths, table headings, recent labels, rates and empty stars needed explicit paint overrides because existing owner declarations persisted under inherited text changes. Fixed locally without changing geometry.
- Browser interactions cover tabs/keys, separate regular/capture/team flows, replay, entry panels, local social actions, empty/long fixtures, close/reopen and texture toggle.
- Confirmed on baseline: capture -> team -> regular restores the stored capture sub-selection. Existing production behavior is documented, not silently changed in this paint-only task.
- Scoped ESLint uses the project's maintained-source rules through a local adapter because the root maintained list does not include new docs JSX. No changes to unrelated root ESLint work.
- Scoped lint passed; `npm run docs:system-design` passed; systemDesignHtml 4 tests passed; impeccable detector returned no findings.

## Spec decision
The existing profile, portrait and bookmark contracts remain the source of truth. No API, data or production theme contract changed. The unselected palette candidates belong in the sample README and system-design history, not as new mandatory production tokens.

## Scope preservation
Other Aemeath sample/task work and its system-design entry stay in the working tree. Stage only the new surface sample/task and the new system-design entry; generate the staged HTML from staged markdown plus HEAD split documents.
