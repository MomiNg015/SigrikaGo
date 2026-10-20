# Balanced profile samples: project content, reference composition

## Goal
Create three new interactive desktop/portrait-mobile profile samples that balance the accepted reference-inspired compositions with SigrikaGo's existing Bright School materials and current content. The user says V2 layout is acceptable, but copied non-product fields and literal colors go too far.

## Requirements and decisions already supplied
- Retain the existing left 星炬 / 标准 / 其它 paper bookmarks at desktop and mobile widths.
- Only display fields/actions already present in the current self/social profile: username/identity artwork, achievements and personalization entry points, social actions, gameplay branches, rank/stars, games/wins/losses/draws/win rate, recent results, character records, replay and capture records.
- Remove achievement showcase/光荣之路, medals, join dates, fabricated UID/discriminator, signature, chapter, affiliation and military labels. Do not fill spaces vacated by these with new fields.
- Keep current portrait resolver and complete-head avatars. Never use retired handbook-sprites. Reframe existing Q art instead of substituting a different style.
- Keep useful asymmetry, prominent identity, crisp metric hierarchy, framed character records and selective light/dark contrast from the references.
- Use the project's warm ivory, brown ink, pink active/action, blue information and mint positive/support colors. Avoid neon yellow/cyan, charcoal-as-default and copied industrial scenery.
- Three compositions: mint portrait-left archive (mostly light); warm-ink left identity/rank with ivory records (most contrast); notebook-blue upper identity band with ivory lower records (compact card).
- Match the information and behavior across variants. Keep all character win/loss/draw values visible, not only inside a popup.
- New isolated directory docs/design-samples/profile-balanced-v3-2026-10-19. Comparison supports desktop/390/320, self/social, empty/long name and direct opening. No production UI replacement.

## Acceptance
- [x] Three visibly distinct balanced compositions, with only current product content.
- [x] Current full-body/avatar source resolution; no retired image requests.
- [x] Desktop and portrait mobile rendered and visually inspected.
- [x] Left bookmark geometry/keyboard behavior; all local interactions and content visible at 1440, 768, 390, 320.
- [x] Content guard rejects borrowed metadata/showcase labels; stats remain complete.
- [x] Documentation regenerated; scoped checks pass; unrelated WIP remains untouched.

## Scope and assumptions
The user has asked for all three samples, so no direction-selection question is required before producing them. Existing screenshots remain design references already supplied in this conversation. References inform layout and hierarchy only. Demo numeric values are labeled as such outside the product window. Integration into the live product is a separate decision.

## Source of truth
src/modals/ProfileResumeView.jsx, ResumeModal.jsx, UserProfileCard.jsx; DESIGN.md; profile-folder-contract.md; identity-bust-contract.md; button-colors.md. V2 is an interaction starting point, not the content source of truth.
