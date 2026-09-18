# Verification

## Confirmed causes and fixes
- Audio and theme settings: the final surface-cleanup selector forced padding to zero on an actual clipping scroller. Restore 6px/12px/14px/6px gutters at that owner; preserve native scrolling and existing shadows.
- Animated shop/costume product layout: old margins covered the card body but not maximum rotation, bobbing and cast shadow. Budget safe desktop/mobile margins before scaling; preserve stage paint containment and animation behavior.

## Evidence
- Browser fixtures built from real components at 1440x900, 390x844 and 320x568. Checked 15 views/tabs at both scroll endpoints (90 states); no detected hard-shadow clipping in fully visible controls after fixes. Views: shop, friends, leaderboard, house, warehouse, watch, recruitment, settings audio/theme/about, mailbox, announcements, message board, personalization and achievements. Fixture data is synthetic; some network-dependent views use empty states, so this is not an exhaustive claim about every live-data variant.
- Inspected desktop/mobile settings screenshots; right and bottom shadows remain complete. Shop snapshots and geometry tests cover clipping under movement.
- Added regression test covering 1-5 cards, desktop/mobile, three stage dimensions and maximum motion/shadow extents. Updated old size assertion to preserve readability with required gutters.
- Full project check: 359 test files, 2529 tests; lint, build, built CSS, portrait, admin snapshot, production config and documentation generation.
- Existing asset-reference/chunk warnings unchanged. Design-hook color findings reference unchanged legacy declarations and existing assertions; no new colors or suppressions.
- Browser fixtures and screenshots stay in untracked `.codex-run/`; no real-user data or account mutations.
