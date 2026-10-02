# Strengthen Character Archive Text Research

## Goal

Repair the repository-local character-nameplate Skill so a supplied character archive link is researched as a textual character dossier, not treated mainly as an image reference. Concept art must be grounded in the character's personality, biography, dialogue, plot development, relationships, and meaningful objects before image generation begins.

## Requirements

- Add a mandatory text-first research gate before the visual-language card and concept generation.
- Require a source-backed evidence matrix covering personality, biography/formative events, goals/values/conflicts, relationships, representative dialogue and speaking style, major plot beats/development, powers/abilities, meaningful objects/places/hobbies/foods, and achievement relevance.
- Require the agent to inspect the supplied page's readable body text plus relevant tabs, accordions, anchors, and linked dossier sections instead of stopping after image inspection.
- Mark every evidence category as `found`, `absent`, or `inaccessible`; never fill missing categories with visual guesses.
- Treat images as secondary corroboration. Image-only research is insufficient and must block concept generation.
- Require traceability from textual evidence through interpretation to each selected visual motif, palette/material choice, and motion verb.
- When a dynamic or blocked page cannot be fully read, exhaust available browser/DOM navigation first, then report exactly what is inaccessible and request the missing text instead of generating from images alone.
- Preserve the existing four-concept human gate, asset workflow, integration boundary, and `new`/`refine` behavior.
- Add regression tests for the textual coverage gate and update the frontend quality contract and system-design documentation.

## Acceptance Criteria

- [ ] `SKILL.md` explicitly forbids concept generation before textual evidence coverage is recorded.
- [ ] The input/research reference contains a reusable evidence-matrix template with source locators and coverage statuses.
- [ ] The reference requires `evidence -> interpretation -> visual decision` traceability and rejects image-only justification.
- [ ] Inaccessible or absent dossier material is reported rather than invented.
- [ ] Skill regression tests assert the gate, categories, status vocabulary, traceability, and image-secondary rule.
- [ ] Official Skill validation, focused tests, documentation generation, and `npm run check` pass.
- [ ] Pre-existing Denia task assets and documentation changes remain excluded from this task's commit.

## Definition of Done

- Skill instructions, reusable reference, tests, Trellis quality spec, and system-design docs are consistent.
- Generated `docs/system-design.html` is refreshed without absorbing unrelated Denia work into this task's commit.
- Work is committed as one coherent fix after quality checks.

## Technical Approach

Keep the hard gate concise in `SKILL.md`, and place the detailed evidence schema, coverage rules, page traversal checklist, synthesis template, and failure behavior in `references/input-and-visual-language.md`. Contract tests will use stable phrases and category assertions so future edits cannot silently weaken the gate.

## Decision (ADR-lite)

**Context**: The existing Skill names several text categories but allows an agent to jump from images directly to a visual-language card.

**Decision**: Use a blocking, text-first evidence matrix with explicit coverage statuses and visual-decision traceability. Images may confirm silhouette, color, or costume but cannot establish character identity alone.

**Consequences**: Some archive pages will require more navigation or a concise request for inaccessible text, but generated nameplates will be substantially more character-faithful and unsupported motifs will be easier to detect.

## Out of Scope

- Reworking the current Sigrika or Denia artwork.
- Changing achievement conditions, reward data, runtime APIs, or CSS motion architecture.
- Building a general-purpose web scraper or storing copyrighted dossier text verbatim.

## Technical Notes

- Primary owners: `.agents/skills/create-character-nameplate/SKILL.md` and `references/input-and-visual-language.md`.
- Regression owner: `scripts/characterNameplateSkill.test.js`.
- Durable contracts: `.trellis/spec/frontend/quality-guidelines.md` and `docs/system-design.md`.
- Existing unrelated dirty paths were present before this task: Denia asset/task plus its system-design paragraph/generated HTML.
