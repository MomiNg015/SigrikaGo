# Input and visual-language contract

## Minimum input

Resolve these fields from the user request and repository before asking questions:

| Field | Required | Resolution |
|---|---:|---|
| Character id/name | Yes | User request, character registry, or existing asset id |
| Character sources | Yes | Supplied official page/files; otherwise primary project sources |
| Achievement/reward meaning | Yes | Existing seed/data or user statement |
| Mode | Yes | `new` or `refine` |
| Asset id and URL | For integration | Existing payload/seed; ask only if genuinely absent |
| Runtime slot and canvas | Yes | Existing exact owner or default bespoke contract |
| User-liked references | Optional | Inspect supplied images before generation/editing |
| Forbidden motifs | Yes | User statements plus contradictions found during research |

Do not infer authorization to create or change achievement conditions from a visual request.

## Research order

1. Inspect repository character metadata, portraits, skill presentation, story copy, audio labels, existing reward semantics, and prior task research.
2. Open supplied character pages. Prefer official/primary sources and separate sourced facts from visual inference.
3. Record a short source-backed research note under the current Trellis task.
4. Distill, rather than copy, official imagery. Do not reproduce brand marks, UI chrome, portraits, or copyrighted composition.

## Visual-language card

Write one card before prompting image generation:

```markdown
# <Character> nameplate visual language

## Emotional target
- Three adjectives:
- Energy level:
- What the nameplate should make the player feel:

## Narrative anchors
- Primary anchor:
- Supporting motif family:
- Tail/closure language:

## Palette and material
- Base/carrier:
- Primary light:
- Secondary accent:
- Hand-painted/material treatment:

## Motion verbs
- Persistent light:
- Local narrative motion:
- Secondary accent:

## Exclusions
- User-rejected motifs:
- Misleading character signals:
- Generic visual shortcuts to avoid:

## Geometry
- Delivery canvas:
- Runtime slot:
- Username safe area:
- Minimum Alpha margins:
```

Prefer objects/actions with strong evidence and readable silhouettes at 32px height. Avoid decorative guesses that resemble hair, ribbons, weapons, flora, technology, or symbols the character does not own.

## Four-direction exploration

All four concepts share the target ratio and safe-zone position, but differ in structural idea:

- Direction A: primary identity object leads the composition.
- Direction B: environment/hobby leads the composition.
- Direction C: power/action trace leads the composition.
- Direction D: achievement meaning leads the composition.

Adapt the categories to the character; never force weak evidence. A valid set changes at least two of these between directions: core silhouette, carrier framing, motif placement, tail behavior, negative-space strategy, or material emphasis.

Color-only variants are not four directions.

## Image prompt structure

Use this structure, replacing every role-specific field:

```text
Create one production-oriented concept for a very wide, short username nameplate.
Canvas ratio: <ratio>. Intended display: <runtime size>.
Character visual language: <emotional target, anchors, palette, material>.
Composition: left identity anchor + quiet central username carrier + right closure, but make this direction structurally distinct: <direction idea>.
The central safe area from <x%> to <x%> must remain low-detail and high-contrast for dynamic DOM text.
Hand-painted edges and material: <treatment>.
Do not draw usernames, character names, letters, logos, brand elements, UI labels, portraits, or <forbidden motifs>.
Use a removable flat key background if transparent output is unreliable.
Keep every essential motif inside the canvas with deliberate transparent safety margin.
```

Review source-scale art and a runtime-size reduction. Reject concepts whose identity disappears at runtime size, whose safe area is decorative noise, or whose silhouette already touches the canvas.

## Human selection gate

Present the four individual concepts in one response with short neutral labels describing their structural differences. Do not rank one as the winner unless the user asks. Then stop.

Accepted continuation signals include a clear concept number, an attached selected image, or an explicit instruction to revise one direction. Ambiguous approval such as “可以” after multiple images requires identifying which concept was selected before production integration.

In `refine` mode, when the user explicitly says to keep the current/attached art and only repair motion, clipping, or layout, record the art as locked and skip concept generation.
