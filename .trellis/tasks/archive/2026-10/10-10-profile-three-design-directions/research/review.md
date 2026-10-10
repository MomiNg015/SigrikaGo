# Repository review evidence

## Correction after user review
The initial pass was insufficient: reading the shared profile and mode registry did not establish the current product taxonomy. The three-tab navigation from that component was incorrectly treated as a design requirement. The following verified chain supersedes that assumption.

| Entry / domain | Current evidence | Profile design implication |
| --- | --- | --- |
| Home hierarchy | HomeScreen.jsx: categoryTitle/submodes use Spark → regular/capture/team, standard → regular, other → gomoku | Two levels of navigation, identical across all three samples |
| Rated regular stats | social.js getUserProfile queries gameRecord with mode AND rated:true | Rank, personal win rate and character wins must be labelled ranked (升降级); friendly games are not mixed into these metrics |
| Team relay | roomResultPersistence.js saveTeamGameRecord persists mode:team/rated:false and snapshots; team PRD explicitly excludes ranks/rewards/personal wins | Show match history and ordered three-character lineups; do not invent team rank or contribution statistics |
| Capture challenge | captureChallenge.js stores CaptureChallengeBest and idempotent CaptureChallengeResult; leaderboard returns captures/ranking/recordCharacter | Show best captures/current ranking/record character; no personal win rate or replay button because no GameRecord is created |
| Practice | roomResultPersistence suppresses record for matchSource:practice or recordPolicy:none | No fabricated practice history or statistics section |
| Friendly matches | matchClassification.js distinguishes friendly/rated; persistence and replay include unrated ordinary games | Both kinds appear in regular replay history with explicit labels; only rated contribute to ranked summary |
| Replay filtering | replayPagination.js spark filter currently includes both spark and team; mode:team is accepted explicitly | Team history can use existing team query, while strict regular-only pagination needs a server predicate before pagination; do not filter a loaded page and claim completeness |

Capture data currently comes from the challenge leaderboard and is not included in getUserProfile. Production integration will need an explicit bounded profile summary contract. The visual fixtures are not evidence that this API already exists. Special candy/story matches keep their special persistence/visibility rules; do not aggregate them into ranked performance.

## Scope
Inspected package scripts and dependency stack, PRODUCT.md, DESIGN.md, system design overview/frontend/performance chapters, route/overlay boundaries, home and handbook composition, friends and leaderboard entries, shared profile implementation and mode/cache behavior, social route endpoints, Prisma model names, portrait/title/CSS/mobile contracts, and previous samples. No full security audit or cloud/runtime certification was performed.

## Findings informing design
- PRODUCT.md rejects marketing heroes, generic sci-fi HUDs, redundant helper copy and ornamental cards. DESIGN.md anchors cream paper, brown ink, mint/pink/blue accents, local title font and crisp shadows.
- ProfileResumeView.jsx is already shared by ResumeModal and UserProfileCard. A final implementation should extend this boundary rather than fork self/social content.
- The self header has coins and achievement/personalization actions; social context has likes/friend/blacklist/report. UserProfileCard.jsx currently places all four side by side. Proposed samples give friendship visual priority and keep destructive actions in a labelled More dialog with confirmation.
- Rank and record metrics are mode-dependent, while identity persists. ResumeModal preserves visible previous data while a requested mode loads and retries failures; future integration must keep this behavior.
- Current profile uses rank/record blocks, recent-result markers and a role table. Proposed alternatives reduce repeated boxes, create reliable numeric alignment and vary whether character rows are always visible or progressively disclosed.
- Existing CSS architecture spans base/theme/final mobile owners. Samples stay outside src/styles and do not add runtime overrides or CSS debt.
- Portrait phones require natural body scrolling; nested residual-height tables previously caused reachability issues. All samples use one scroll owner at phone sizes and at least 44px actions.
- Current avatar contracts preserve full heads and support effective costumes/candy/corruption. Fixtures use current default assets only; final integration must retain CharacterBustPortrait and existing resolver behavior.
- Social routes already expose profile, likes, relationships, report and replays. No new statistics/API fields are proposed. Rank rules use rankProgression; old October 9 samples' Chinese rank literals and four-star assumptions must not be copied blindly.
- Previous 2026-10-09 samples explored sidebar/horizontal/two-page arrangements. This round instead differentiates hierarchy, density and a tabbed collection interaction, including social and failure states absent in that round.

## Implementation guardrails
No production UI change this round. Fixtures clearly labelled in preview chrome; social confirmations never transmit data. Any eventual integration should test nameplate/title combinations, failed sources, nine-dan points, mode race behavior, replay privacy, disabled relations and 360x640 reachability.
