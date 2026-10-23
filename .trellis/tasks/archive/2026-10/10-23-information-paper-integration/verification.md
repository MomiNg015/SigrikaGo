# Verification and acceptance

- Approved visual integrated in production AnnouncementModal, MailboxModal and shared InformationCenterLayout. No API/schema changes or sample fixtures in the app entry.
- Final focused regression: 6 files, 100 tests passed (announcement, recovery, mailbox, shared sizing, style and CSS inventory contracts).
- Production browser suite: 19 tests passed across 1440/800/390/360/320px and short portrait heights. Includes full-row native scroll, state-specific ink shadows, aligned mobile back/close, focus return, long/empty content, reads/categories, attachment preview, claim/delete/close, original motion and theme exclusion.
- Mobile announcement and mail back/close boxes both start at y=58 and measure 36x36 at 390x844. Production captures and machine-readable results live in the sample directory. Production preview loads neither sample CSS nor its sizing adapter and makes no real API requests.
- Lint, production build, built-CSS, portraits and production-config validation passed. System-design Markdown/HTML and frontend contracts updated.
- Full `npm run check` did not go green: 455 test files passed, 3325 tests passed and 2 existing devApiProxy integration cases exceeded the default 5s limit. Isolated default retry retained one timeout; a diagnostic run with `--testTimeout=15000` passed all four proxy cases (one takes about 6.2s). No test timeout or proxy source was changed.
- Separately running the remaining gates found the existing admin snapshot stale in siteSettings/characters. It was not refreshed because that data is unrelated to this UI task.
- Exact scoped CSS delta: +5 files, +12383 normalized bytes, +126 important declarations, +4 important files, +2 media files, +1 reduced-motion file; zero new literal colors or high-z-index files. Preserve unrelated profile CSS and mixed documentation/lint edits when staging.

Visual review caught higher-specificity legacy announcement unread/active rules removing shadows. The paper list owner now matches the actual list ancestry; regressions assert all states retain the 3x4 ink shadow, while hover/press continue to win in their motion owner.
