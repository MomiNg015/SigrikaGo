# 角色详情 CV 标签

## Goal

Add optional character voice-actor metadata that admins can manage and players can see on character detail cards without disrupting the existing title, BGM, desktop, or mobile layouts.

## Requirements

- Add `cvName` and `cvUrl` to the character persistence and API payload contract.
- Admin character management can fill a CV name and optional link URL.
- Empty CV name hides the player-facing CV label.
- Non-empty CV URL is valid only with a non-empty CV name and must be `http://`, `https://`, or a site-root `/...` path.
- Character detail cards render `CV：{cvName}` next to the name on desktop and under the name on mobile.
- When `cvUrl` is valid, the CV label renders as a link opening in a new tab; link styling inherits text color and has no underline or visited/hover color shift.
- Keep the compact character BGM player in the right side of the heading row and prevent overlap on mobile and desktop.

## Acceptance Criteria

- [ ] Admin create/update/list and public character payloads preserve `cvName` and `cvUrl`.
- [ ] Existing characters default to blank CV fields.
- [ ] Invalid URL or URL-without-name is rejected server-side and by draft serialization where applicable.
- [ ] Character detail UI shows no CV label when blank, text when only `cvName` exists, and an accessible link when both fields are present.
- [ ] Desktop and mobile CSS contracts keep title, CV, close button, and BGM controls stable.
- [ ] System design markdown and generated HTML are updated.

## Technical Approach

Use the existing character data pipeline: Prisma `Character` fields, startup compatibility guard, server validation/payload helpers, admin draft helpers, admin form fields, shared fallback/merge behavior, and `CharacterDetailDialog` heading markup/CSS. Keep validation centralized in the backend boundary and mirror basic client draft rejection for immediate admin feedback.

## Definition of Done

- Focused unit and style tests updated.
- Related Vitest suites, `npm run build`, and `npm run docs:system-design` pass.
- No unrelated dirty worktree changes are reverted.

## Out of Scope

- Filling default CV names for existing built-in characters.
- New CV search/list pages or rich voice actor profiles.
- Changing character music preview behavior beyond layout compatibility.

## Technical Notes

- Relevant project specs read: frontend component/state/quality guidelines, backend database guidelines, and cross-layer/code-reuse guides.
- Existing character heading CSS already has separate desktop, phone, Bright School, and final mobile safety layers that must stay aligned.
