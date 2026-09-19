# Bookmark window corrections

## Requirements
- Friends and blacklist rows use natural height even when the shell reserves room for bookmark tabs.
- Watch tabs show mode names without room counts; mode loading remains intact.
- Bookmark text does not wrap: horizontal desktop labels and single-column portrait labels, with independently scrollable rails for long items.
- Sticker header dividers leave clearance for control shadows and the following content.

## Verification
Inspect real components with one and many friends, Watch mode changes, long Recruitment tabs, and header geometry at desktop and portrait sizes. Run affected tests, lint, build and generated documentation checks. Preserve theme opt-outs and nested modal behavior.
