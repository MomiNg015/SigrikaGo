# Replay screenshot lifecycle diagnosis — 2026-10-05

## Conclusion

The observed replay disappearance is a timing-dependent Chrome full-page screenshot artifact that triggers the application's deliberate viewport gate. The first isolated instrumented run captured a transient `innerWidth=1, innerHeight=1` during an immediate `fullPage:true, animations:"disabled"` screenshot. `DesktopViewportGate` then unmounted all its children; once Chrome restored 1440×900, the still-open parent overlay flag mounted a fresh `ResumeModal`, whose local replay state starts false. This explains the apparent parent reload, new profile request and missing replay-close control without a replay handler firing.

Do not change production replay state, audio focus or viewport policy based on this artifact. Use viewport captures for fixed overlays and wait for the actual owned entrance animations to settle before screenshotting. Production UI tests should preserve their normal viewport throughout these interactions.

## Evidence

Temporary diagnosis only: `.tmp/interface-polish/replay-debug.{config,spec}.mjs`. The spec uses the existing isolated E2E runner and an isolated database, not the ordinary development server. Root's live audit spec was not edited.

Instrumentation records main-frame navigation, Vite console/WS updates, profile/replay API calls, `resize`/orientation/visibility events and persistent DOM identities for Resume/Replay. It also observes gate mounting and overlay node removal. All home images and fonts were decoded before the test cases.

First run, four cases:

| Capture | Delay after visible | Replay retained | Resume identity |
| --- | --- | --- | --- |
| viewport, animations disabled | 300ms | yes | 1 |
| full page, animations allowed | 300ms | yes | 1 |
| full page, animations disabled | 300ms | yes | 1 |
| full page, animations disabled | immediate | **no** | **1 → 6** |

The failing sequence was captured in the first run's tool output:

| performance time | Observation |
| --- | --- |
| 10599.4ms | Resume node 1; replay node 5; viewport 1440×900; gate absent |
| 10682.4ms | resize: viewport **1×1**; Resume 1 and Replay 5 still present |
| 10690.0ms | DOM change: gate present; Resume/Replay both removed; viewport still 1×1 |
| 10697.7ms | resize: viewport restored to 1440×900; gate still present |
| 10765.9ms | DOM change: gate absent; **fresh Resume node 6**; Replay absent |

This is the exact state-loss boundary, not an inference from screenshot appearance. The screenshot operation did not emit main-frame navigation or HMR. No production file was changed during the probe.

The expanded second run added immediate viewport/disabled and immediate full-page/allowed captures. All six cases passed, including the immediate full-page/disabled case this time. Thus the bad resize is intermittent; a test failure may depend on whether Chrome samples the transient dimensions before the gate's React update. Both settled full-page cases and viewport cases stayed stable across both runs. Latest second-run artifacts are:

- `.tmp/interface-polish/replay-debug/evidence.json`
- `.tmp/interface-polish/replay-debug/run-output.log`
- `.tmp/interface-polish/.tmp/interface-polish/replay-debug-results/replay-debug-isolated-replay-screenshot-lifecycle-at-1440-chromium/trace.zip`

The second run replaces the first trace/output directory; the first run's precise observed sequence is preserved above and in `.tmp/interface-polish/replay-debug/first-run-reproduction-excerpt.json`. Latest evidence correctly shows the passing second run, not the earlier failure.

## Why the alternatives are unsupported

- Vite output writes: `scripts/start-e2e-client.mjs` explicitly ignores `**/.tmp/**`, `**/.codex-run/**` and `**/.worktrees/**`; screenshot files live under `.tmp`. No update/full-reload frame occurred during either probe.
- Animation handlers: `ResumeModal`, `HouseReplayDialog` and `ModalDialog` have no animation-end handler that closes the replay. Playwright's local screenshot implementation finishes finite animations when `animations:"disabled"` is used, but that event alone does not change replay state.
- BGM window focus: `requestBackgroundFocus` notifies the audio controller and adjusts audio filter/gain nodes. It has no parent React-state reset or navigation path.
- True replay re-render: ordinary profile/pagination updates retained Resume node 1 through the successful cases. Only the gate's viewport branch removes the component tree. The gate intentionally returns a different root when blocked; its existing DOM tests already prove child removal/recovery across size changes.

## Parent audit recommendation

For these fixed modal overlays, capture the current viewport (`fullPage:false`). If a full document capture is useful for the home page, perform it independently after layout/entrance stabilization. Wait for finite owned modal/backdrop animations to finish and decode relevant imagery before taking artifact screenshots; do not add an interaction-blocking timer to production UI. Keep a replay-visible assertion after the capture to detect future screenshot-induced state loss clearly.

One unrelated audit fact: at 1440×900, the underlying home document is 1136px tall. Full-page captures are therefore larger than the browser viewport and exercise Chrome's `captureBeyondViewport` path. This document height predates the replay opening and is not evidence that the modal itself needs to scroll the document.
