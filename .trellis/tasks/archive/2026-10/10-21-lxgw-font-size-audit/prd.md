# 霞鹜字体全界面字号审查

## Goal
Review the rendered production UI after the LXGW font switch and prose readability pass. Identify text that still needs larger sizes, with current values, recommended values and actual screen evidence.

## Scope
- Read-only review of runtime styling; no production font/layout edits in this audit.
- Desktop and portrait mobile player surfaces; desktop administration only.
- Cover entry/auth/loading, home/matching, windows, gameplay/result and story/tutorial surfaces where fixtures support them. Inspect CSS owners for states not rendered.
- Preserve existing WuWa and all IRIS typography exceptions in any recommendation.
- Prioritize dense Chinese at small sizes; distinguish nominal font size from ancestor scale and simulated bold/contrast problems.

## Deliverable
Durable report with coverage, verified findings by priority, current/recommended sizes, evidence paths and stated coverage limits. Avoid universal zoom or blindly increasing every label.

## Acceptance
- Findings grounded in computed browser styles and screenshots, with relevant owner files.
- Practical size tiers and space constraints for compact controls, tables and battle HUD.
- No unrelated WIP altered. Inline Trellis workflow, no subagents needed.

## Outcome
- Report: `docs/ui-reviews/2026-10-21-lxgw-font-size.md`, with six retained production-component screenshots.
- Scanned all 749 CSS files; 409 fixed declarations under 14px are candidates, not automatically findings.
- Captured 97 distinct successful computed-style states across 36 player surface/state types and 21 admin pages; additional 320px screenshots cover battle, records, replay and registration. Mocked API data; browser scale 100%.
- Highest priority: full shop-card scaling reduces nominal 14px item names to approximately 9.48px at 390px and 7.51px at 320px; badges reach 7.45/5.90px. Mobile battle action labels are 9.5px at weight900; header identity is 9-10px. Other verified groups include profile metrics, podium names, practice, auth rules, details, friends, dates/results, inventory/team phase tags and admin hints.
- Findings distinguish CSS font size, ancestor scale and responsive clamp. Previous prose weight/spacing fix does not cover every small-label size.
- No product code or runtime styling changed. Proposed tier/space changes remain recommendations. WuWa and IRIS stay excluded; special corruption and all editor child states are explicit coverage limits.
- Initial selector misses on replay/practice were corrected in later successful captures; mobile mode tooltip did not yield an effective sample and is not reported as a verified mobile finding.
- System-design entry points to the review and generated HTML is synchronized. Only audit docs/screenshots are committed; unrelated WIP preserved.
