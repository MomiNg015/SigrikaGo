# Specialty interaction review

## Real component evidence

Used the actual `ShopModal`, `CharacterDetailDialog`, `CharacterMusicPreview`, and `InteractionFeedback` with full `src/styles.css`. Temporary fixture provides normal user ownership, deterministic empty shop/costume catalog responses, an owned long alternate music title, a held selection request, and a held audio fetch so real pending/loading states can be examined. No backend data was changed. Separate Vite **5299** uses a unique optimizer cache and disabled HMR; production fixtures/root live port5317 remain independent.

Checked Chrome1440×900 fine pointer and 390×844 /360×640 touch contexts, each with normal and reduced motion. Input uses CDP mouse/touch events. Native disabled, ARIA disabled and ARIA busy stress attributes on the real shop sign are explicitly **defensive stress cases**: current store-switch JSX does not set these states. Real music pending selection and native loading-disabled playback states come from the component's own logic. Keyboard focus is separately exercised.

Confirmed before repair:

- Shop sign still computed `translateY(-1px) rotate(-1deg)` and brightness1.04 under native disabled, ARIA disabled and ARIA busy hover. Its own hover owner was ungated.
- Music playback hover still moved -1px under ARIA busy stress and desktop reduced motion.
- Music options remained -1px up after a real phone tap, while pending and after selection; this persisted under reduced motion because theme-specific important transforms won over generic duration reduction.
- A mounted, overflowing title kept a running WAAPI marquee after system media changed from normal to reduced. Initial reduced motion already skipped animation and allowed horizontal text scrolling; only runtime changes were missing.

No specialized art/cinematic redesign was needed.

## Scoped repairs

- `src/styles/themes/bright-school/commerce/shop/signpost-switch.css`: neutral default control transform; hover paint limited to available fine-pointer controls; motion additionally requires no reduced preference. Keyboard focus keeps brightness/outline without moving. Press retains existing2px/0.5deg relation when available; reduced motion removes it. Preserves sign image, scaleX mirror, label offset, hard shadow, layout and switch behavior.
- `src/styles/themes/bright-school/component-repairs/character-music-player/player-shell.css`: neutral playback transform; fine-pointer/no-preference lift; native/ARIA unavailable guards; local reduced transform/transition bypass. Retains radio art, loading/playing/error colors, pressed response, focus outline, title/chevron geometry, and loading glyph owner. Removed one redundant focus color declaration while keeping the effective state colors.
- `src/styles/themes/bright-school/component-repairs/character-music-player/track-sheet.css`: neutral option transform; fine-pointer/no-preference available hover, excluding `.is-pending` and keyboard focus. Reduced option transition bypass. Preserves selection colors/checkmark, authored selected/even tab rotations and existing tab/error reduced fallback.
- `src/audio/CharacterMusicPreview.jsx`: only `MarqueeText` animation effect now listens to media-query changes, cancels immediately on reduce, restarts only active overflowing content when normal motion returns, and removes the listener/cancels on dependency change or unmount. Travel distance, start/end pauses and speed remain the same. Audio scheduling/player/tab code is unchanged.
- Enabling lint for this source exposed a pre-existing identity-reset effect dependency warning. Kept its intentional character-ID-only lifecycle with a documented, narrow `react-hooks/exhaustive-deps` exception; adding the normalized slot payload or a render-created invalidation function would reset current audio/selection on same-character updates. A regression now exercises fresh same-character slot arrays while preserving selected override/open sheet.

Test updates: added specialty boundaries to `src/styles/modals/interactionMotion.test.js`, replaced the old ungated sign hover/focus assertion in `src/modals/ShopModal.test.js`, and added dynamic reduce/restoration/inactivity/unmount plus same-character slot-payload regressions in `src/audio/CharacterMusicPreview.dom.test.jsx`.

## Verified after repair

The final probe produces **90 computed-state observations across six contexts**, checked by `.tmp/interface-polish/specialty-check.mjs`:

- Sign unavailable hover: `transform:none`, original hard drop-shadow retained, pseudo sign mirror remains `matrix(-1,0,0,1,0,0)`.
- Keyboard-focused sign, playback and pending option: no motion, visible2–3px outline.
- Enabled fine-pointer normal playback/options retain the intentional1px lift; real loading disables playback and settles motion to none.
- Phone selected option retains `:hover` after native touch release but computes `transform:none`, including reduce. Normal press can leave a sub-pixel transition tail at the220ms observation (≈0.007px), which is gone in the later selected snapshot; no persistent lifted state.
- Reduced playback/options: no transforms, own transitions disabled. Reduced loading glyph remains non-spinning. Normal spinner stays operational feedback.
- Selected music-tab matrices exactly match the pre-repair matrices in all six contexts; sign mirror and authored geometry remain intact.
- Runtime title marquee **1 running→0** on reduce, with text viewport `overflow-x:auto`; restoration returns **1 running** with clipped viewport. Initial reduced contexts have0 marquee animations.
- No browser page errors in any context.

The six screenshots are `.tmp/interface-polish/specialty/music-<width>-<normal|reduce>-final.png`. Evidence files: `evidence.json` before repair, `evidence-final.json` final, and `metrics.json`. Temporary fixture/probes/server config stay under `.tmp/interface-polish/`. Server5299 is stopped after final review.

## Unavailable-action feedback assessment

Reviewed `InteractionFeedback.jsx`, `base/message-feedback.css`, `effectPlayback.js`, and their existing tests. The1063ms visual rejection cue follows `UI_UNAVAILABLE_SHAKE_MS` and the unavailable sound. It does not lock input, delay valid actions or hold a window open; native/ARIA disabled controls remain unavailable for their own reason. Repeated attempts restart the acknowledgement. Normal full-CSS browser captures compute `ui-unavailable-shake` at1.063s; reduced contexts compute the displacement-free `ui-unavailable-pulse`, with the project's existing global duration reduction yielding1ms.

The5px shake is noticeable for routine unavailable attempts, but there is no measured gameplay or input-flow defect here. A future product decision could make the visual rejection shorter while keeping audio timing separate. **No shake or audio duration change was made** during this task; it would be arbitrary polish without stronger product evidence.

## Checks, inventory and integration wording

`npm run lint` passes after root registers the two audio files in `maintainedFiles`. Relevant style/import/theme, shop and music unit/DOM checks pass: **142 tests in7 files**. Final browser state assertion script passes90 observations. No CSS imports or file count were added.

Additional specialty CSS delta against clean HEAD versions of the three owners (separate from earlier12-file motion delta):

| Metric | Delta |
| --- | --- |
| Normalized source bytes | +950 |
| `!important` declarations | +9 |
| Important files | 0 |
| Hardcoded hex occurrences | +1 (existing option hover color repeated for separated focus/hover paint) |
| Media files | +1 |
| Reduced-motion files | +1 |
| CSS file count / high z-index / breakpoints | 0 |

Final normalized bytes: signpost2894; player-shell5872; track-sheet3612. Each remains below6000. Root owns consolidated inventory and system-design edits; no production registry/document edit was made by this subagent.

Suggested addition to the current motion paragraph in `docs/system-design.md`:

> 商店招牌及角色音乐播放器的专用状态规则同步限制为可用的细指针悬停，并为忙碌曲目、键盘焦点和减少动态设置保留静止反馈；招牌镜像、收音机造型和选中页签角度保持原样。滚动曲名实时响应系统减少动态偏好，停止后允许横向查看完整文本，恢复偏好时仅活动且被截断的曲名继续滚动；监听与动画随控件失活或卸载清理。不可用操作的既有声音与1063ms反馈时长保持。

This is desktop Chrome with emulated touch/media behavior, rather than iOS Safari or a physical phone. Cosmetic attribute stress cases do not add disabled/busy business semantics to store switches. Pending music selections remain governed by the existing serialized request/override logic.
