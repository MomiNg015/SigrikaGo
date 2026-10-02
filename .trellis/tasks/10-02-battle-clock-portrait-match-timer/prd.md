# Battle clock, portraits and matchmaking timer

## Requirements
- Restore mobile clock raised/pressed depth on active/inactive turns, matching the established desktop behavior without changing card geometry.
- Remove clipped top/bottom dark border fragments from team portrait slices; preserve artwork, order, hidden states and diagonal composition.
- Convert match waiting timestamps to the client clock using server elapsed time. Fresh matches start at zero despite device clock skew; actual queue age and 15-second expansion remain accurate.
- Preserve unrelated WIP; update design docs and run focused regression plus browser style checks.

## Root causes
Mobile clock shadow overrides flatten inactive depth. Team slots have border-block clipped by polygons. match:waiting overwrites the local start with an unadjusted server timestamp.
