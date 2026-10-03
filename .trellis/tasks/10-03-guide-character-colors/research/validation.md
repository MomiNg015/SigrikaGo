# Guide character color accents

Use the existing speaker palette for avatar and text-frame gradients (22% color to paper), border (65% color mixed with ink), hard shadow and restrained 18% halo. Names mix color with ink; body retains dark text. No geometry, crop, motion or typewriter changes. Home now reads palette before legacy color and detached portrait slots explicitly receive the palette.

Validation: 123 focused DOM/CSS/theme tests passed. Four production story/teaching browser cases passed at desktop/390/360px, including typing stability and matching frame colors. Extended lint has zero new findings (11 existing at HEAD). Screenshots inspected on phone and desktop. CSS debt baseline passes unchanged. Three home real-typing browser checks passed at 1440/390/360px, including matching avatar/text palette and borders. Four generated-design checks, project lint, production build and built-CSS contracts passed. Total: 127 focused tests and seven browser checks. No full project sweep was repeated for this bounded color change.

Evidence: `.tmp/guide-color-story`, `.tmp/guide-color-home`. Production component fixtures; no live account or deployment validation.
