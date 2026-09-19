# Validation

- Eight live windows added: Settings, Achievements, Leaderboard, Watch, Friends, home UserProfileCard, Announcements and idle Recruitment. Existing Resume retained.
- Unused ShopTabs/GachaModal are not revived; current two-store shop buttons and in-room/admin controls retain their behavior.
- 125 focused component, lifecycle, document and CSS tests passed. Final two CSS suites passed again after the last row-height correction (77 tests).
- Full suite initially reported 2542 passing and two failures: the CSS budget update was subsequently applied and its suite passed; the pre-existing ShopModal.test.js assertion against `width: calc(100% + 32px) !important` in home-student-id-layout.css remains outside scope.
- `npm run lint`, final `npm run build`, and `npm run check:built-css` passed.
- Browser QA used real components with local fixture data: desktop Settings/Friends/Achievements, 320x568 Settings/Watch/Recruitment/Announcements/Leaderboard/Profile and 390px bookmark rendering. Verified announcement detail-to-category switching, long leaderboard scrolling and readable username/score rows, bounded profile actions, and long recruitment labels with quantities. Temporary viewport override reset.
- System-design entry, UI chapter, generated HTML, CSS inventory and frontend spec updated.
