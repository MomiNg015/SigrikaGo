# remove-report-dialog-cancel-button

## Goal

Remove the explicit Cancel button from the user profile report dialog while preserving the existing close affordances.

## Requirements

- Remove only the form-level Cancel button from the profile report dialog.
- Keep the submit button, empty-content disabled state, top-right close button, and backdrop dismissal unchanged.
- Do not change like/report API behavior, admin report delivery, or dialog positioning.

## Acceptance Criteria

- [ ] The profile report dialog no longer renders a text Cancel button next to Submit.
- [ ] The Submit button still exists and remains disabled for empty trimmed content.
- [ ] The dialog can still be dismissed through the existing close affordances.
- [ ] Relevant tests pass.

## Out of Scope

- Backend report handling.
- Admin report management.
- Additional profile dialog layout or visual redesign.
