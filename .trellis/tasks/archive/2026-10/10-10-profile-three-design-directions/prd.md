# 履历与详细信息三方向设计探索

## Goal
Review the repository's product, UI architecture, feature boundaries and current profile surfaces, then deliver three distinct interactive redesign samples for selection.

## Requirements
- Use Bright School paper/ink colors, local LXGW title font and current character assets.
- Preserve self/social actions and model the current homepage hierarchy: Spark (regular/capture/team), standard (regular), other (gomoku). Regular rated records show rank/metrics; capture shows captures/ranking; team shows unranked match records and lineup replay entries.
- Explore club dossier, compact score sheet and character collection folio; vary hierarchy and interaction, not only color.
- Support self/social views, empty/error/loading demonstrations, portrait phones and keyboard use.
- All displayed user statistics are explicitly fictional fixtures. No API mutations.
- Isolated files under docs/design-samples/profile-directions-2026-10-10; do not replace production UI or prior samples.
- Record review evidence and regenerate the system-design HTML.

## Scope and decisions
User requests three reviewable samples before final integration; no blocking preference questions. Existing repository assets and DESIGN.md resolve visual context. Main implementation remains unchanged. Existing unrelated working changes are preserved.

## Acceptance criteria
- [x] Three distinct usable layouts, each with self/social and mode switching.
- [x] Desktop and 390/360 portrait render without horizontal overflow; all records reachable.
- [x] Actual image/font decoding and interaction checks, screenshots visually inspected.
- [x] Review report and documentation update delivered.

## Research
See research/review.md. This is a design-focused whole-project structural review, not a claim of exhaustive security or runtime verification.

## User correction and revised acceptance
The user identified that the initial samples copied the obsolete three-tab profile framing. Initial review did not trace homepage entry classification through persistence and replay queries; the initial completion claim was too broad. Correct all three samples with the current functional hierarchy and branch-specific data. Practice is not assigned fictional persistent stats. Explicitly document missing API aggregation required for eventual production integration.

## Validation and handoff
18 browser combinations passed with zero console errors; scoped ESLint and system-design generation passed. Desktop and portrait screenshots visually inspected after finishing entrance animations. Design-hook observations classified in sample README without ignoring rules. No new production contracts were introduced, so no spec edits were needed. Samples are ready for selection; production integration and commit are outside this round.

## Approved production integration — 2026-10-10
The user selected the club dossier and challenged the rank placement. Integrate that direction in the shared ResumeModal/UserProfileCard surface. Rank belongs on the right record page below play navigation, adjacent to ordinary rated stats on desktop and above them on portrait phones. Identity art, nameplates and account actions remain in the identity section. Challenge/team views must not show ordinary rank or personal win rate.

- Preserve current rated profile aggregates, callbacks, confirmation dialogs, and stale-request guards.
- Add a bounded authenticated challenge-summary read with empty/error/retry states; reuse best-result costume snapshots and the leaderboard's tied ranking.
- Add explicit regular replay scope before pagination, retaining matchmaking and friend duels. Preserve legacy default replay queries. Team summaries project completed lineup identities/appearances only, with replay callbacks.
- Cover desktop and 320/360/390 portrait, short viewport, last-row reachability, both profile contexts and all play families.
- Update runtime contracts/system design, run checks, and commit only this task's delta while preserving unrelated WIP.
