## Bug Analysis: Memoized HomeRoute silently dropped home actions

### 1. Root Cause Category

- **Category**: C + D - Change Propagation Failure and Test Coverage Gap
- **Specific Cause**: The `HomeScreen` extraction into memoized `HomeRoute` kept `onStartMatch`, `onStartPractice`, `onLogout`, and `onSelectCharacter` at the call site, but the wrapper destructured differently named props. React permits missing optional callbacks, so rendering and picker-close behavior survived while the authoritative actions became silent no-ops.

### 2. Why Fixes Failed

1. The original performance change tested only render counts at the memo boundary. That proved unrelated room state did not rerender `HomeScreen`, but did not prove the wrapper preserved action props.
2. The existing practice DOM test rendered `HomeScreen` directly. It proved the button called the callback it received, but could not catch `AppRoutes` failing to deliver that callback.
3. Static rendering and the full test suite stayed green because JavaScript offered no compile-time prop contract and the affected callbacks were optional at runtime.

### 3. Prevention Mechanisms

| Priority | Mechanism | Specific Action | Status |
|----------|-----------|-----------------|--------|
| P0 | Test coverage | Assert callback identity and invoke logout, character selection, every match mode, and practice through the `AppRoutes -> HomeRoute -> HomeScreen` boundary. | DONE |
| P0 | Project convention | Require thin memo wrappers to preserve the wrapped component's public action-prop names end to end. | DONE |
| P1 | Review | When introducing a memo boundary, review both render suppression and all behavior-bearing props. | DONE |
| P2 | Compile-time | Consider typed prop objects if this app later adopts TypeScript for route composition. | OUT OF SCOPE |

### 4. Systematic Expansion

- **Similar Issues**: The same mismatch affected logout and character selection, not only match/practice. All four home action callbacks are covered by the new boundary test.
- **Design Improvement**: Keep `HomeRoute` a transparent render boundary; it may compose sound/open handlers, but it must not invent aliases for callbacks already owned by `HomeScreen`.
- **Process Improvement**: Performance regression tests must verify behavioral transparency in addition to render counts.

### 5. Knowledge Capture

- [x] Added the seven-section memoized home route callback contract to `.trellis/spec/frontend/quality-guidelines.md`.
- [x] Updated system design summaries describing the `HomeRoute` boundary.
- [x] Added focused route-boundary regression coverage.
- [x] Confirmed the project has no `src/templates/markdown/spec/` mirror to synchronize.
