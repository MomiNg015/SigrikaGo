# Authentication label baseline correction

## Goal
Align field names and their smaller right-side notes/errors on the first text baseline, as requested in the user's screenshot follow-up.

## Requirements
- Fix the existing desktop and mobile owner rules; preserve current typography, compact form spacing and error-state stability.
- Verify both single-line notes and wrapped username feedback at 1440/390/360/320px with real fonts.
- Preserve unrelated profile and design work.

## Acceptance
- Field names and the first note/error line share a baseline.
- Wrapped feedback stays clear of the input and does not change card geometry when errors appear.
- Existing auth browser regression and CSS contracts pass; synchronize the existing design summary and auth contract.

## Scope
Two existing auth CSS owners, their focused browser assertions and corresponding documentation. No auth logic or broader redesign.

## Verification
- Both desktop and the final mobile owner now use baseline alignment; font sizes, label heights and form spacing remain unchanged.
- Four browser cases cover both modes at 1440/390/360/320px, including wrapped feedback clearance and stable card geometry. Desktop idle and 320px error screenshots were inspected.
- 160 focused auth/CSS tests, test-file ESLint, production build, built-CSS checks and system-design rendering passed. No CSS debt baseline increase.
