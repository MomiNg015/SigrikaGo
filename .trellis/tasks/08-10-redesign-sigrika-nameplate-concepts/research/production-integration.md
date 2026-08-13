# A「辉星符印」正式接入记录

## Selected direction and scope

- 用户选择 A「辉星符印」并授权应用到游戏。
- 正式资源继续使用既有 URL `/assets/achievements/semantic-nameplate.png` 与资产 ID `reward-sigrika-spark-100-wins-nameplate`。
- 不修改成就条件、奖励数据、通用 `UserIdentity` DOM、标题或独立徽章逻辑。
- 用户明确由其自行完成游戏内最终视觉验收；本轮负责确定性的资产、CSS、减少动态效果、测试和文档合同。

## Built-in image edit prompt

The built-in image generation tool was used in `background-extraction` mode. Image 1 was the selected A candidate and the only edit target. The requested edit was to replace only the outer dark-navy presentation backdrop with one flat `#00ff00` chroma field while preserving the large warm-white/gold four-point sigil, deep-plum username carrier, gold rune curls, purple tail, mint-cyan star points, composition, scale, colors, quiet center, and all painterly edges. The prompt explicitly prohibited text, usernames, letters, numbers, logos, Go imagery, mechanical frames, armor, hard-metal borders, and rank badges.

Generated chroma source:

- `production/a-open-starlight-sigil-chroma.png`

Local chroma removal used the installed ImageGen helper with border auto-key sampling, soft matte, thresholds `12 / 220`, and despill:

- `production/a-open-starlight-sigil-alpha.png`

The visible subject was uniformly scaled and centered into the final canvas without independent stretching:

- `production/a-open-starlight-sigil-1125x240.png`
- production copy: `public/assets/achievements/semantic-nameplate.png`

## Deterministic asset result

- encoding: 8-bit RGBA PNG
- canvas: `1125 x 240`
- alpha subject: `904 x 224`
- alpha bounds: left `110`, top `8`, right `1013`, bottom `231`
- margins: left `110`, right `111`, top `8`, bottom `8`
- declared username safe area: `315..990` (`60%` of canvas width)
- transparent corners: pass
- validator report: `production/asset-validation.json`

## Runtime owner

- slot remains `150 x 32`
- username padding remains `39px / 18px`, preserving the user-approved DOM text position
- username keeps warm-white text, deep-plum shadow, ellipsis fallback, and now uses an exact-ID italic UI treatment matching the selected preview
- old citrus/sun/wind-tail effects are removed
- new effects: persistent alpha-following rim, localized open-sigil breathing, rune-core pulse, three restrained edge-rune traces, and sparse secondary star points
- continuous keyframes change only `transform` and `opacity`; reduced motion freezes a readable static state

## Impeccable hook classification

- The detector flags the exact asset owner's warm-gold, deep-plum, violet, and cyan RGBA literals because they are outside the global Bright School control palette. These are contextually intentional character-art colors already used by the previous exact-ID owner, not reusable control or surface tokens; replacing them with campus pink/notebook blue would break the selected artwork's character contract. No global ignore or value suppression was added because the user did not approve individual literal values.
- Detector findings in `src/styles/hudComponents.test.js` concern pre-existing CSS fixture literals asserted by tests, not new rendered UI colors. They are treated as test-fixture false positives and are not suppressed.

## Deterministic verification

- task preview generated at `nameplate-preview/`; it imports the real `src/styles.css` and renders short English, four CJK characters, a legacy overlong name, desktop, compact, phone, decorated, and reduced-motion states
- production asset validator: pass (`1125 x 240`, RGBA, transparent corners, declared `315..990` safe area)
- focused Vitest: 6 files / 137 tests passed
- full test phase reached by `npm run check`: 348 files / 2474 tests passed; portrait validation also passed
- `npm run build`: pass
- `npm run check:built-css`: pass
- production configuration validation: pass
- `npm run docs:system-design`: pass
- semantic nameplate motion audit: all six keyframes modify only `transform` and `opacity`
- `git diff --check`: pass (only the checkout's existing LF-to-CRLF notices)
- full `npm run check` stops at the pre-existing stale admin snapshot categories `siteSettings`, `shopItems`, and `storyScripts`; this nameplate task does not regenerate or absorb that unrelated snapshot drift
- subjective in-game visual approval remains assigned to the user
