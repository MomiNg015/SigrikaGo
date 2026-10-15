# Authentication design samples

## Goal and scope
Review the current login and registration UI and deliver three distinct interactive samples preserving the exact existing hand-painted mascot. User requested samples, not production integration.

## Requirements
- Preserve `/assets/login-sigrika-mascot.webp`, the school identity and existing login/register action wording.
- Explore a refined sign-in sheet, an illustrated split composition and a compact club register.
- Include both login and registration, password visibility, validation and local pending/result feedback.
- Reuse production validation without sending credentials, creating accounts or writing storage.
- Support desktop and portrait phones; keep review controls outside the product surface.
- Preserve all unrelated working tree changes.

## Acceptance
- Three reachable samples and desktop/phone previews.
- Verify illustrations, readable fields, no horizontal overflow and reachable submit actions.
- Record review findings and update system-design index and generated HTML.

## Decision
Use an isolated Vite-served page under docs/design-samples/auth-2026-10-15. No production auth or stylesheet edits. Selection for integration is out of scope.

## References
- src/auth/AuthScreen.jsx
- .trellis/spec/backend/authentication-contract.md
- DESIGN.md and PRODUCT.md
