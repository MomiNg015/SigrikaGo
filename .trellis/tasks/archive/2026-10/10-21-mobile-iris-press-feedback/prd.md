# Subtle mobile IRIS press feedback

## Goal and scope
Restore a small mobile press displacement similar to desktop, while retaining the viewport anchor fixed in the previous bug fix.

## Acceptance
- At widths up to 768px, pressing moves the entry 5px left and 1px down from its centered rest position; releasing returns it to rest.
- Hover/focus alone stays at rest on mobile, preventing sticky touch hover from leaving the entry displaced.
- Preserve button dimensions, first-tap activation, desktop behavior and existing reduced-motion timing.
- Update the existing browser regression and system-design/spec contract, preserving unrelated WIP.

## Verification
- All five IRIS browser checks pass at 320/390px and desktop, including normal/reduced motion, exact 5px/1px press displacement, release restoration, upper-edge touch and reopening.
- 123 existing targeted tests, changed-file lint, production build, built CSS contract and system-design rendering pass.
- Palette hook findings remain intentional existing IRIS colors, already documented in the previous fix; this change adds no color or suppression.
