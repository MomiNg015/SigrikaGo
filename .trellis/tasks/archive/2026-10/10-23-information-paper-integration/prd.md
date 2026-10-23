# Production announcement and mailbox paper cards

## Confirmed brief

The user approved the interactive information-paper-2026-10-22 sample and requested production integration. Explicit correction: the mobile announcement back button must align horizontally with the close button. No further design questions are needed.

## Requirements

- Integrate the approved hard shadows, stacked reader, announcement pink heading, mail mint heading/shelf, reading screenprints and completed-mail gray state in ordinary Bright School only.
- Preserve real announcement load/read/retry/pagination/category and mailbox read/claim/delete/attachment flows, modal focus and all existing entrance/content/mobile transition behavior.
- Use component refs and a shared information-list hook for integer row sizing and native snap. Handle async loads, updated messages, changing categories, long titles, resize and empty lists without global DOM observers.
- Keep mobile portrait single-column navigation. Give announcement back and close identical 36px geometry in a shared header grid row; hide the unavailable back control.
- Reuse the existing final information-center CSS entry with bounded owners. No sample CSS, fixture state or mocked APIs may enter the app.
- Provide a production-only preview and meaningful DOM/browser regression coverage at desktop, 390px and 320px, including header alignment, actual state transitions, full-row scroll and motion.
- Update UI system-design facts and HTML, capture the production contract and scoped CSS debt delta. Preserve unrelated checkout WIP.

## Scope

AnnouncementModal, MailboxModal, InformationCenterLayout, the information-center style entry and bounded child owners, a list hook, related tests, sample preview/docs, and system-design documentation. No backend/API/schema changes. Existing approved theme assets are reused. Main session implements inline without delegation.
