# Admin Analytics Dashboard

## Goal

Build a desktop-first admin analytics system for cloud deployment operations. The admin console should split fast operational status from slower product analytics so the administrator can see current player activity, daily health, risk signals, and longer-term game growth/engagement trends without relying on manual database inspection.

## What I Already Know

- The existing admin console has an overview page and management modules for users, replays, feedback, audit logs, content, commerce, mailbox, achievements, and recruitment.
- Existing data sources include users, login sessions, game records, persisted rooms, mode stats, progress ledgers, feedback, reports, admin audit logs, gacha, shop, recruitment, and mailbox records.
- Current overview is too shallow for cloud operations: it only shows broad counts such as users, banned users, characters, and game records.
- Admin analytics should support both real-time operational visibility and longer-term operations analysis.
- The dashboard should be understandable to an administrator who is not a data analyst. It should avoid BI-style complexity and explain what changed, whether it matters, and what action is available.
- The admin dashboard is desktop-only for this feature. Mobile admin usability is out of scope except basic non-broken overflow behavior.
- `moming` is the super administrator. Other future admins may see aggregate and masked data, while sensitive details and bulk-sensitive actions should be reserved for `moming`.

## Requirements

### Navigation and Page Model

- Split admin data into two admin menu areas:
  - `概况`: current and today-focused operational dashboard.
  - `运营分析`: historical trends, segmentation, retention, economy, and gameplay health.
- Entering admin management automatically refreshes the relevant dashboard data once.
- Switching into `概况` refreshes overview data.
- Switching into `运营分析` refreshes the current date-range report.
- Provide manual refresh controls and show the last updated time.
- Do not add default short-interval polling in the first version.

### Overview Dashboard

- The default admin landing experience should be `今日简报`, not a dense BI dashboard.
- `今日简报` should answer, in order:
  - `今天是否正常？`
  - `现在有多少人在线？`
  - `今天来了多少人？`
  - `今天玩了多少局？`
  - `有什么必须处理？`
  - `哪些趋势值得注意？`
  - `下一步点哪里处理？`
- `今日简报` should show one overall status:
  - `正常`
  - `需要关注`
  - `需要处理`
- The overall status must include 2 to 5 plain-language reasons when data is available.
- Overall status should use simple, explainable first-version rules rather than complex scoring or opaque algorithms.
- Example first-version status rules:
  - reported users currently online, login failure spikes, preload timeout spikes, or API error spikes can produce `需要处理`
  - lower first-game conversion, unusual mode interruption rate, or economy drift can produce `需要关注`
  - no urgent signals and stable core metrics can produce `正常`
- Thresholds should be easy to adjust in code or configuration.
- Detailed metric cards, rankings, charts, and tables should sit below or behind the brief.
- Show current online summary:
  - online user count
  - registered/guest split if guests exist
  - lobby, matching, playing, watching, and admin state counts
  - active room count
  - matching queue count
- Show online user lists grouped by state:
  - lobby
  - matching
  - playing
  - watching
  - admin
- Online user rows should support search and should display:
  - username
  - rank/mode profile when available
  - current state
  - today active duration
  - current session/connection duration when available
  - last active time
  - masked IP or rough region when available
  - device/browser summary when available
- Default online lists may show a limited top subset per group with expand/search for full lists.
- Highlight risk labels in online lists:
  - long idle connection
  - frequent reconnects
  - same-IP multi-account signal
  - reported user currently online
  - banned or near-ban status when applicable

### Today Metrics

- Show today's unique logged-in users as the primary login metric.
- Also show today's successful login event count and failed login count.
- Split today's login users into new users and returning users where possible.
- Show today's registration count.
- Show registration quality:
  - new users who entered the lobby
  - new users who completed a first game
  - first-game conversion rate
- Show today's completed game count by mode.
- For each mode, separate:
  - completed games
  - created rooms
  - interrupted/unfinished games
  - invalid games
  - average game duration
  - average move count
  - matchmaking success rate when the source data exists
  - preload timeout count
  - reconnect recovery count
- Show today's active-duration leaderboard using active online duration as the default sort.
- Allow duration leaderboard sort modes for:
  - active duration
  - connection/session duration
  - game duration
  - watch duration when available

### Risk, Support, and Alerts

- Put a first-screen `待处理与异常` section on the overview page.
- Include top-level counts and top risk rows for:
  - pending feedback
  - pending reports
  - login failure spikes by account/IP
  - frequent disconnect users
  - mode-level interruption anomalies
  - preload timeout/matchmaking failure counts
  - same-IP multi-account registration/login signals
  - reported users who are currently online
  - banned users attempting login
  - suspicious admin audit activity, such as short-time bulk grants, bans, or config changes
- The overview should link to the relevant detail pages instead of performing heavy actions directly.

### Service Health

- Add a small service-health area focused on game operations rather than full server APM:
  - current Socket connection count
  - active room count
  - matching queue count
  - today's Socket reconnect count
  - today's room recovery count
  - today's preload timeout count
  - today's API error count if available
  - today's admin API error count if available
  - database read/write error count if available
  - latest service start time if available
  - deployed version/commit if available
- CPU, memory, disk, and full slow-query monitoring are out of scope for the first version.

### Operations Analytics

- Support date ranges:
  - today
  - yesterday
  - last 7 days
  - last 30 days
  - custom range
- Default to a guided interpretation mode before charts and tables.
- The top of `运营分析` should show plain-language insight cards, for example:
  - today's active users compared with the recent 7-day average
  - today's registration and first-game conversion status
  - mode interruption or preload anomaly warnings
  - currently online reported users
  - economy net-change status
- Insight cards should use concise labels and action links so the admin can decide what to inspect next.
- Insight cards should be grouped by priority:
  - `需要处理`: urgent operational or moderation items, such as reported users online, login failure spikes, preload timeout spikes, or suspicious admin actions.
  - `值得关注`: meaningful trend shifts, such as lower first-game conversion, unusual mode interruption rate, or economy drift.
  - `正常记录`: healthy metrics and routine status summaries.
- Insight cards should include a recommended next action when action is useful, such as `查看用户`, `查看登录记录`, `查看异常对局`, `查看新用户列表`, `查看经济流水`, or `查看审计日志`.
- Healthy routine records may omit action buttons when there is no useful next step.
- The first screen should visually prioritize `需要处理` items and avoid making all metrics look equally urgent.
- Include charts on the `运营分析` page. This page should not be only cards and tables.
- User growth and retention are first-priority analytics:
  - DAU
  - WAU
  - MAU
  - new users
  - first-game conversion
  - D1/D7/D30 retention when the necessary data exists
  - average games per active user
  - average active duration per active user
  - returning users
  - dormant high-history users
- Add player segmentation:
  - registered but no first game
  - new users with first game
  - active users
  - core users
  - returning users
  - churn-risk users
  - silent users
  - high-value users based on activity, interaction, economy, or feedback contribution
- Gameplay health is second-priority analytics:
  - game volume trend by mode
  - completion/interruption rate by mode
  - average duration and move count by mode
  - new-user first-mode choice
  - mode replay rate
  - black/white and first/second player win rates when meaningful
  - character pick rate
  - character win rate
  - character average game duration
  - skill use count, success rate, and win association where source data exists
  - separate rated/matchmaking games from friendly/private games where possible
- Economy analytics should be included in `运营分析`, while overview only shows anomalies:
  - coin production
  - coin spending
  - net coin increase
  - average user balance
  - production sources
  - spending sinks
  - gacha participation and draw count
  - pool-level draw counts and rare reward output
  - shop purchase counts and popular items
  - recruitment task starts/completions/misses
  - admin manual grants

### Permissions and Privacy

- Treat username `moming` as the super administrator.
- Aggregate data and masked online data can be visible to normal future admins.
- Sensitive details should be reserved for `moming`, including:
  - full IP
  - detailed device/session security data
  - exports
  - sensitive security records
  - bulk rewards
  - bulk mailbox sends
  - bulk bans or other high-impact actions
- Implement or reserve a clear server-side helper such as `isSuperAdmin(user)`.
- Mask IP addresses by default in dashboard UI.
- Viewing full sensitive details should be audit-logged.
- Data collection should be limited to fields needed for safety, operations, and troubleshooting.

### Data and Storage

- First version may combine real-time aggregation with daily snapshots.
- Today's overview can aggregate live from existing domain tables and runtime state.
- Historical analytics should use existing tables where reasonable, plus new summary tables where repeated computation would be slow or unstable.
- New statistic tables are allowed when necessary, especially:
  - daily metric snapshots
  - per-user daily activity
  - security or analytics events, if needed for first-version metrics
- A full external BI system, ClickHouse, Elastic, and complete event warehouse are out of scope for the first version.
- Some deep metrics may initially be shown as estimated or pending integration, but the UI must clearly label data state.

### Desktop UI

- Admin analytics first version targets desktop only.
- The existing admin UI is considered hard to read; this feature should improve clarity even if it is not visually elaborate.
- The target is not "beautiful marketing UI"; the target is direct, readable, high-visibility operational UI.
- Use a calm utilitarian dashboard style with strong information hierarchy.
- Prefer plain-language cards, short explanations, trend labels, and action links over complex tables.
- Each major metric should answer one of three questions where possible:
  - `现在是否正常？`
  - `今天哪里变多/变少了？`
  - `我需要处理什么？`
- Use table views for drill-down details, not as the primary first impression.
- Use simple status labels such as `正常`, `偏高`, `偏低`, `需要关注`, and `待接入` instead of requiring the admin to interpret raw numbers alone.
- Prioritize readable typography, sufficient contrast, clear spacing, stable alignment, and obvious grouping.
- Use icon + text labels for actions and states where useful; do not rely on color alone to communicate status.
- Keep chart density low: charts should show the main trend or comparison with a text takeaway, not every possible series.
- Use loading, empty, and error states that explain what is happening and what the admin can do next.
- Use restrained interaction feedback: hover/focus/pressed states, refresh loading state, and expandable detail transitions should clarify state changes without decorative motion.
- Avoid mobile-specific admin work for this task.
- Preserve basic window-resize resilience through scrollable tables or stable containers.
- Charts should be used in `运营分析`, with a lightweight charting approach selected after checking project dependencies.

## Acceptance Criteria

- [ ] Admin navigation contains separate `概况` and `运营分析` entry points or equivalent clearly separated tabs.
- [ ] Entering admin management refreshes admin dashboard data once.
- [ ] Switching to `概况` and `运营分析` refreshes that page's current data.
- [ ] Overview shows online state summary, grouped online user list, today login/register/game metrics, active-duration ranking, alerts, and service-health summary.
- [ ] Today login metrics distinguish unique users from login event counts.
- [ ] Today registration metrics include first-game conversion or clearly label it as unavailable/pending if source data is not implemented yet.
- [ ] Today game metrics are broken down by mode and separate completed games from interrupted/invalid/created room counts where data exists.
- [ ] Overview rows link to appropriate detail pages for user, replay/game, feedback/report, audit, or risk investigation.
- [ ] `运营分析` supports date range presets and custom date range.
- [ ] `运营分析` includes charts for growth, engagement, gameplay health, and economy where data exists.
- [ ] Player segmentation is shown as counts and can link to filtered user lists when implemented.
- [ ] `moming` is treated as the super administrator for sensitive analytics details.
- [ ] Sensitive fields such as IP are masked by default and full-detail access is protected and audited.
- [ ] UI clearly marks metrics that are estimated or pending integration.
- [ ] The first screen is understandable without data-analysis background: key cards include plain-language status, short context, and a next action or detail link.
- [ ] The analytics UI is visibly more readable than the current admin overview: clear hierarchy, high contrast, obvious grouping, and no dense table as the first impression.
- [ ] Recommended insights are grouped into `需要处理`, `值得关注`, and `正常记录`.
- [ ] Recommended insight cards include practical next-action links for actionable findings.
- [ ] The `今日简报` overall status is generated by simple, explainable rules and shows the reasons behind the status.
- [ ] The feature updates system design documentation because it changes admin architecture, data model expectations, permissions, and operational behavior.

## Definition of Done

- Tests added or updated for backend analytics aggregation, permission gates, and key frontend rendering logic.
- Lint/typecheck/test commands pass for the touched areas.
- System design documentation is updated, and `npm run docs:system-design` is run.
- Any added data tables have migrations and schema integrity coverage.
- Existing user/admin functionality remains compatible.
- No mobile admin acceptance work is required beyond avoiding catastrophic desktop layout breakage.

## Technical Approach

- Use a phased implementation.
- Phase 1 should prioritize real, high-confidence overview metrics and navigation scaffolding.
- Phase 1 may label advanced analytics as unavailable/pending rather than inventing unreliable numbers.
- Phase 1 should prioritize "answer cards" and guided drill-down over table-heavy BI surfaces.
- Use existing admin API patterns and domain modules.
- Add a backend analytics module rather than overloading route handlers.
- Keep overview aggregation efficient and bounded.
- Add daily/user activity snapshots only where existing tables cannot support stable historical analytics.
- Add super-admin permission helpers server-side and pass only safe fields to normal admins.
- Select charting implementation after checking current dependencies; avoid adding heavy visualization infrastructure without need.

## Decision (ADR-lite)

**Context**: Cloud deployment requires administrators to inspect live site activity and long-term game health from the admin console. The existing overview only shows basic counts.

**Decision**: Build a desktop-first two-level analytics experience: `概况` for current/today operational health and `运营分析` for historical product analytics. Refresh on admin entry and page switching, not through default polling. Permit necessary summary/statistic tables. Treat `moming` as super administrator for sensitive details.

**Consequences**: The first version can be useful without building a full data warehouse. Some deep metrics require future event capture and must be marked clearly. Backend permissions, audit behavior, data model documentation, and system design docs need updates.

## Out of Scope

- Mobile admin dashboard optimization.
- Default real-time polling.
- Full external BI/data warehouse integration.
- CPU/memory/disk/APM-level server monitoring.
- CSV/export support in the first implementation pass unless explicitly added later.
- Automatic balance recommendations or automatic economy/gameplay tuning.
- Heavy actions directly from overview cards, such as one-click bulk ban, bulk rewards, or bulk mailbox sends.

## Open Questions

- Which exact metrics belong in the first implementation PR versus later follow-up PRs after code inspection?
- Which charting library or local chart component should be used?
- Which new tables are strictly required for first-version accepted metrics?
- What existing runtime state can reliably provide online state, queue counts, reconnect counts, and preload timeout counts?

## Technical Notes

- Relevant frontend files discovered during exploration:
  - `src/admin/AdminOverview.jsx`
  - `src/admin/AdminShell.jsx`
  - `src/styles/admin.css`
  - `src/styles/admin/`
- Relevant backend/data files discovered during exploration:
  - `server/adminRoutes.js`
  - `server/adminUserManagement.js`
  - `server/adminAudit.js`
  - `prisma/schema.prisma`
- Relevant docs:
  - `docs/system-design.md`
  - `docs/system-design/`
- Project instruction: every project update must update `docs/system-design.md`; architecture/data/runtime changes must also update the relevant system design sections and run `npm run docs:system-design`.
