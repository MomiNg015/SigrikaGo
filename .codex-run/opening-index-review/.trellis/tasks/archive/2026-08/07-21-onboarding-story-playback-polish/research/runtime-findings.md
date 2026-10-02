# Runtime findings

- `TutorialBattleScreen` waits for NPC typewriter completion before applying `autoContinueDelaySeconds`, but several readable lines use only `0.35–0.5s` after typing, which explains the perceived disappearance.
- `showNpcBubble()` marks the previous bubble as closing and delays replacement by `BUBBLE_EXIT_MS`; during that interval the current node has changed while the old speaker portrait remains visible.
- `StoryPlayerModal` currently keys portraits with `activeNodeId`, forcing a fresh image element for every line even when the character and asset are unchanged.
- Only `.onboarding-story-text-button` currently completes typing on click. The modal panel already owns a click boundary that can finish typing without changing backdrop dismissal behavior.
- The target “目瞪口呆” line is `doc-story-152`, currently a `story` node pointing to `doc-story-153`. Because standalone `player-choice` is battle-only, the safe normal-story representation is an option on `doc-story-151`, followed by removal of `doc-story-152`.
