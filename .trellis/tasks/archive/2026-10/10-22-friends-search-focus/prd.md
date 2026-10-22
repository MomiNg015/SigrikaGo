# Remove the friends search focus outline

The user explicitly requests no focus border effect on the search input. Remove only the search form's focus-within outline; retain its resting ink border/shadow, keyboard focus, typing and Enter submission. This precise visual correction requires no design questions.

Scope: existing search CSS owner, current design contract/summary and CSS byte inventory. Preserve unrelated WIP. Verify computed input/form styles before and after focus at desktop and portrait width; reuse the existing CSS inventory and generated-doc checks. No new permanent tests for this one-rule visual removal.

Results: browser verified identical input/form paint before and after focus at 1440/390/320px, with typing and Enter submission intact. CSS inventory and generated-document checks passed (24 tests). CSS decreases by 90 normalized bytes. The hook's existing side-border finding is the deliberate input/submit separator, not a decorative accent; it remains unchanged and unsuppressed.
