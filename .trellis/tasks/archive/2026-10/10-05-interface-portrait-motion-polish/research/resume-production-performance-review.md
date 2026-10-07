# Production Resume performance follow-up

## Preflight and dataset contract

This review ran against the final production build on 2026-10-05, after root reported the successful project check/build and a quiet host at 11:34 Asia/Shanghai. Scripts use isolated port 5322 and `full-system-helpers` for a real registered player, authenticated home navigation, and the isolated runner database; they cannot fall back to the development database. The server serves `dist` through the existing local-production test environment. Only temporary probes and this research note were written; no production code or CSS changed.

The actual record selector is `.profile-character-table tbody > tr`, because `ProfileResumeView.jsx` renders unclassed `tr` elements. The former draft `.character-record-row` selector was incorrect and is removed before any performance runtime. Actual row count is asserted after warm loading and again for every measured sample.

Two datasets are bounded to 48 samples total over desktop1440, coarse390 and coarse360, each at CPU1×/4× with normal/reduced motion:

- Empty account: one repeat per preference/CPU condition, 12 samples.
- Dense account: three repeats per condition, 36 samples. The isolated DB receives thirty rated spark `GameRecord` rows: one black win, one white win, and one agreed draw for each of the ten builtin character IDs. A second real registered user supplies the opposing identity. No game outcome or server route is changed.

Records use the real Prisma black/white participant/name/character fields, `winnerColor`, `resultReason`, `resultText`, `mode: spark`, `rated: true`, and `matchSource: matchmaking`. The real profile API is then queried, rather than intercepted: it must report ten distinct character rows, three games per row, and total30/wins10/losses10/draws10 before any measurement starts. `server/social.js` aggregates profile records by participant, mode, and rated state; profile display does not read snapshots or require current ownership of every historical character. Each fixture snapshot is `{}` because this review does not open or validate replays. Recent-result chips belong to `UserModeStats` independently and are not synthesized by this factory.

The native-input sampler warms the real modal/profile API and visible images/fonts, then closes and remounts the window. It records asset completion counts for record portraits. Coordinates are resolved before timing; CDP mouse/touch dispatch avoids Playwright selector/stability polling in the measurement window. There are no screenshots in that window. A DOM observer records first mount, and an initial bounded rAF probe records visible content and enabled-close availability; subsequent rAF frames do not force geometry/style reads. The sampler records frame gaps, long tasks, and CDP layout/style/script totals. Retrieval is scheduled 1000ms after direct input; an already blocked main thread can extend the observation before that retrieval executes. These are host/browser timings, not physical-phone or universal FPS guarantees.

Script preflight: `node --check` and Playwright `--list` pass, listing three viewport cases. The final runtime command was `E2E_CLIENT_PORT=5322 node scripts/run-playwright-suite.mjs e2e -c .tmp/interface-polish/resume-production.config.js` (set through PowerShell environment assignment). It completed **3/3 cases in 2.4 minutes**, with **48 samples**, before the host gate was released for root's remaining functional suites. All samples asserted the expected 0/10 actual rows, a mounted/visible Resume and an enabled close button. Each dense warm-up had ten complete valid record images. There were zero page errors, and every sample subsequently closed successfully.

## Production results

Numbers are milliseconds. Dense groups have three repeats; ranges are observed minima–maxima, not confidence intervals. "Close ready" records the first initial frame with an enabled close control; it is availability after commit, not a guarantee that an input dispatched during a main-thread long task executes immediately. "Visible" is the first nonzero, opacity >0.01 rendered window, not animation completion.

| Dense profile, 1× CPU | Normal: mount / close ready / visible | Normal: maximum rAF gap | Reduced: mount / close ready / visible | Reduced: maximum rAF gap | Reduced delayed long task |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | 26.8–34.8 / 28.8–37.5 / 55.8–70.1 | 24.3–36.3 | 37.5–43.6 / 44.1–50.6 / 44.1–50.6 | 97.1–109 | 87–100 |
| 390×844 | 37.8–46.3 / 39.9–48.8 / 72.2–88.2 | 36.3–42.4 | 51.7–59.5 / 58.5–65.9 / 58.5–65.9 | 115.2–139.4 | 108–124 |
| 360×640 | 37.1–41.3 / 39.3–43.5 / 71.7–79.4 | 36.4 | 50.5–55.2 / 56.9–61.8 / 56.8–61.8 | 109–115.1 | 106–108 |

All **12 normal-motion 1× samples**, including the three empty-account samples, had **zero >=50ms long tasks**. Their largest rAF gap was **42.4ms**. Normal dense profiles used 6–7 layout updates with **2.61–3.95ms** total layout time; reduced dense profiles used 6–8 with **3.11–5.08ms**. Reduced-mode animation name was `none` throughout.

Reduced dense profiles have a distinct later task, starting **52.9–72.7ms after click**, after initial window/close availability. Each phone sample also had a 51–60ms initial task; desktop did not. This later cost exists despite the entrance animation being disabled. Empty reduced accounts had only a 55–64ms initial task at 1×, with no later >=50ms task. Empty normal mount/close timings were 35.8–38.9 / 38.2–41.3ms, and maximum gaps were 36.3ms. Empty-account conditions have one repeat, so they are a bounded contrast rather than a statistically established baseline.

| Dense profile, 4× synthetic CPU slowdown | Normal: mount / close ready / maximum rAF gap | Reduced: mount / close ready / maximum rAF gap | Normal initial / later long task | Reduced initial / largest later long task |
| --- | --- | --- | --- | --- |
| 1440×900 | 140.4–255.3 / 151–268.7 / 157.6–278.7 | 186.1–201.4 / 218.7–233.2 / 460.6–497 | 143–259 / 117–188 | 188–203 / 400–426 |
| 390×844 | 196–198 / 207.2–210.7 / 212.1–218.2 | 256.6–352 / 289–399.3 / 593.9–806 | 203–205 / 144–166 | 264–361 / 538–747 |
| 360×640 | 178.3–194.5 / 189.6–206.5 / 193.9–212.2 | 264.2–294.6 / 297–328 / 606–648.5 | 182–201 / 150–162 | 272–303 / 542–585 |

At 4×, normal dense samples have two long tasks; reduced dense samples have four, including two later 56–71ms tasks after the largest one. Empty 4× samples also have two tasks; their largest later task is 67–97ms normal and 96–134ms reduced. The dense data/state update is therefore a materially larger measured cost under slowdown, especially with reduced motion.

## Cost attribution and limits

The real `ResumeModal.jsx` starts with `characterStats = []` and performs the profile request in an effect. A successful response updates `profilesByKey`; `ProfileResumeView.jsx` then replaces its empty record state with the character table. `profileCacheRef` belongs to the mounted component: closing and remounting recreates it, so warm-up removes cold assets/font work but does not suppress the measured real API fetch. The initial close-ready timestamp consequently precedes the final populated table. Actual ten-row presence is asserted at the end of each dense observation, rather than being equated with first window mount.

Production metrics locate substantially more style/script work than layout work. Under reduced 4× dense conditions, total layout time is **14.32–32.15ms** over **6–8 layout updates**, compared with **501.5–964.94ms style** and **184.98–236.89ms script** totals. At reduced 1×, layout is 3.11–5.08ms, versus 107.36–163.64ms style and 36.85–50.74ms script. These totals include the full page and the bounded initial visibility probe; they are not costs assigned exclusively to the new profile rows. Normal mode includes ongoing authored home effects: its approximately 191–196 style recalculations at 1× are distributed through the observation, while reduced mode has only 12–14. Counts and totals cannot be used interchangeably to claim an individual selector is slow.

Offline analysis of the **earlier development fixture**, kept separate from these production timings, supports the response/commit relationship. In `entry-390-4x-reduce.trace.json`, `/api/users/interface-review/profile?mode=spark` finishes at **+295.87ms**, then React `performWorkUntilDeadline` starts at **+307.99ms**, taking **104.42ms** with nested `UpdateLayoutTree` events of **42.60ms** and **37.07ms**. The 1× counterpart finishes the resource at +71.62ms and starts React work at +71.97ms (25.16ms). These are development traces with deterministic fixture data, not event-level measurements of the final dense production account. The final production sampler records long-task/aggregate metrics without network or CPU stack timestamps. Attribution of its larger delayed task to data commit and style matching is therefore an **inference consistent with the real source flow, dense-versus-empty result and earlier trace**, not a precise production stack split.

Existing entry traces concentrate layout/paint at creation and response commits; they do not show a per-frame layout sequence from the new opacity/individual translate/scale entrance. Final production layout counts are also bounded. The evidence supports preserving the composited motion and following up on Resume creation/data-commit style matching. It does not justify shortening motion, removing authored artwork, a general selector rewrite, or attributing all data creation cost to this task's new animation. No source change is proposed from this review.

This is a warmed desktop Chrome production build on an approximately 165Hz host, with phone viewport/touch/coarse-media emulation and CDP 4× CPU slowdown. It does not simulate a physical phone's GPU, memory bandwidth, thermals, battery behavior or Safari. Normal/reduced conditions run in a fixed order, and empty conditions have one sample; the three dense repeats reduce but do not eliminate host/cache/order variance. The initial style/geometry probe can add a small forced style cost, and full-page metrics include background home effects. Under a blocking task the nominal 1000ms retrieval can execute later; comparisons emphasize input-relative availability and individual task/max-gap duration rather than a claimed universal P95/FPS budget. Further optimization should first capture a production CPU/style trace on a representative low-end device and isolate the data-commit selectors.

## Evidence and handoff

- `.tmp/interface-polish/resume-production.config.js` and `resume-production/resume-performance.spec.js`: isolated production environment and actual native-input matrix.
- `resume-production/results-1440.json`, `results-390.json`, `results-360.json`: all 48 raw result rows and empty page-error lists.
- `resume-production/summarize-results.mjs` and `summary.json`: offline aggregate and saved development-trace attribution.
- `motion-performance/entry-390-1x-reduce.trace.json` and `entry-390-4x-reduce.trace.json`: explicitly earlier development evidence.

Root owns the synchronous `docs/system-design.md` update. Suggested delta: the final production Resume matrix verified 48 warmed native-input samples over desktop/390/360, empty and ten-character records, normal/reduced preferences and 1×/4× CPU. Normal 1× had no >=50ms tasks; reduced dense data commits and synthetic slowdown reveal a measured style/creation bottleneck that merits device-level profiling. No per-frame layout from the new entrance was evidenced, and desktop emulation does not establish physical-phone FPS.
