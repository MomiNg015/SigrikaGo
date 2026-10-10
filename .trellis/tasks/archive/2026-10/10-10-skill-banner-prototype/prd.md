# Skill banner full-body prototype

## Goal
Create one reviewable interactive sample of the accepted manga cut-in direction, using current chibi full-body character art protruding above and below a narrow banner.

## Confirmed scope
- User requested a sample after reviewing the proposed direction.
- Standalone preview; no production SkillBanner or gameplay changes.
- Current chibi full-body art, character color, ink outlines, separated motion layers.
- Desktop and portrait-phone compositions; replay, freeze and character selection controls.
- Keep a two-second cinematic with reduced-motion support.

## Acceptance
- [x] Full body visible across both edges on desktop and 390/360px phone.
- [x] Character switch, replay and freeze work; no missing assets or horizontal page overflow.
- [x] Preview prepared for user with desktop and phone screenshots.
- [x] System design entry records sample boundary and HTML generated.

## Implementation
Use docs/design-samples/skill-banner-2026-10-10/ as isolated static files served by existing Vite. Reuse public/assets/characters/handbook-chibi-sprites and local fonts. No backend, appearance resolver or runtime timing changes. Visual checks replace unnecessary production tests for this isolated sample. No new shared spec contract is introduced.

## User revision
Use the current new portraits, remove the cast label, and keep phone text entirely clear of the diagonal divider in both actual and simulated phone views.

## Approved production integration
User requested applying the corrected sample to the project. Replace ordinary SkillBanner in room/tutorial consumers with isolated cut-in styles; retain authoritative duration, voice deduplication, full-body runtime costume/candy precedence and the separate corrupted duel. Validate actual production component with all theme CSS on desktop and portrait phones, long names, sequential casts, and reduced motion. Update system design and CSS inventory for the bounded new owners.
