# 履历与详细窗口：方舟融合三版响应式样板

## Goal
Research Arknights and Arknights: Endfield personal profile screens and build three genuinely distinct interactive, responsive SigrikaGo profile prototypes. The user requests careful visual design and desktop/portrait-phone compatibility; selection and production integration are subsequent work.

## User correction / authoritative second brief
The user rejected the first warm-paper layout samples as visually unrelated to the references. Supplied two concrete screenshots and explicitly requires retaining the existing left bookmark tabs. The earlier direction approval assumptions are invalid.

Build a fresh V2 in docs/design-samples/profile-reference-v2-2026-10-19/:
- 方舟档案 directly matches reference 1: edge-to-edge charcoal canvas, full-height current character on the left, black identity and information modules stacked on the right, cyan annotation accents, framed portrait showcase.
- 终末地名片 directly matches reference 2: charcoal upper / white lower continuous canvas, left avatar and identity/progression, right light achievement plate and dark four-character showcase, yellow accents and subtle grayscale relief terrain.
- 融合档案 combines the large left character composition with a dark/light split and the reference's right module order. It must remain recognizably within the same supplied visual family.
- All three retain the EXACT existing paper bookmark silhouettes, labels 星炬/标准/其它, desktop left rail and mobile vertical left rail. Use existing bookmark CSS and the same SVG paths; preserve Up/Down, Home/End and tab selection semantics.
- Use the CURRENT production portrait resolver for full-body and complete-head avatar variants. User explicitly rejected the retired handbook-sprites accidentally used during V2. Current builtin presentation is handbook-chibi-sprites; source existence is not authorization to reuse retired art. Adapt reference composition to the current artwork.
- No warm-paper content cards, notebook copy, pastel reinterpretation or replacement top family tabs. Only the retained existing bookmark rail stays campus-styled by explicit user instruction.
- V2 comparison includes the two supplied references, desktop/phone controls, self/social/empty/long-name interaction coverage and full screenshots. Source images copied locally with attribution as user-supplied layout references.
- Render and inspect the composition early; judge fidelity against both source images before polishing.

The first deliverable below is historical and was rejected visually. Its technical checks are not acceptance of V2.

## Requirements
- Preserve the existing profile information model: identity; 星炬/标准/其它; regular/capture/team branches; rank, aggregate record, last ten results, per-character records and replay entry.
- Provide self and social contexts. Self exposes achievements and personalization; social exposes likes, friendship, block and report with safe local demonstrations.
- Use the project's actual Q character art, avatar art and local fonts. Fixture metrics are explicitly demo data, never account claims.
- Direction A 学院档案: warm paper archive, a vertical identity page and dense ruled record page; portrait phones compact the identity horizontally.
- Direction B 战术终端: industrial split light/dark surface, a compact identity header, prominent rank and modular operator record cards; phones use stacked summaries and two-column character cards.
- Direction C 青春名片: character-first composition, paper record leaf, softer campus colors; phones become a portrait cover followed by one natural record scroll.
- All three expose the same data and actions. No production CSS/component/API changes. Prototype CSS is isolated under docs/design-samples/profile-fusion-2026-10-19/.
- Desktop preview and a genuine 390px iframe preview; direct sample URLs remain naturally responsive. 320/390/768/1440 viewport checks and keyboard/reduced-motion support.
- Include an evidence-based Chinese research/design note, clear tradeoffs, screenshots and a working comparison page.

## Assumptions and scope
The user authorized three samples and supplied explicit visual references, so build all three without requiring a direction choice in advance. Warm paper, ink outlines, the campus accent palette and current character assets are the continuity anchors. More radical geometry and darker surfaces are confined to samples. No new server fields, game functionality, remote requests or stored account writes are implied.

## Research references
- research/profile-references.md
- DESIGN.md
- src/modals/ProfileResumeView.jsx, ResumeModal.jsx, UserProfileCard.jsx
- .trellis/spec/backend/profile-folder-contract.md
- .trellis/spec/frontend/identity-bust-contract.md

## Acceptance criteria
- [x] Three complete and different desktop/mobile designs with full real artwork.
- [x] Self/social, mode/play tabs, empty/long-name, social actions and local auxiliary dialogs work.
- [x] Images decode, no console errors or horizontal page overflow; last content reachable at narrow/short widths.
- [x] All main variants visually inspected in desktop and portrait-phone screenshots.
- [x] README contains source links, fusion reasoning, tradeoffs and actual verification results.
- [x] docs/system-design.md updated and npm run docs:system-design completed.

## Definition of done
Validated standalone samples delivered for comparison. No production integration requested. Preserve existing unrelated dirty files.

## Delivery / verification
- Twelve direction/viewport combinations passed the browser matrix, including all local interactions and reduced-motion behavior. No account API requests, no page errors, no resource errors.
- All six desktop/phone primary screenshots inspected; long-name 320px portraits inspected and fixed.
- Targeted ESLint and full npm run lint passed.
- npm run docs:system-design passed. Direct npx vitest initially matched stale copies inside .codex-run/.tmp; the intended root doc tests passed there. Use the project's npm test wrapper to preserve its exclusions.
- Design colors and comparison numbering are intentional prototype explorations, documented in README and quality-review; no ignore rules added.
- Production specs are unchanged because no production contract changed. User selection and integration remain future work, separate from the completed three-sample deliverable.


## Current-asset correction and V2 acceptance
The user caught retired art being reused. This was an implementation error, not a user-authorized direction. All V2 character sources now call src/shared/characterPortraits.js resolveCharacterPortrait; full hero art and complete-head avatars follow production. The browser matrix fails if any request accesses retired handbook-sprites and checks both full and avatar variants explicitly. Old V1 files are outside the V2 deliverable.

- [x] Three reference-based compositions retain the production left paper bookmarks at desktop and portrait widths.
- [x] Current art source verified from ProfileResumeView -> CharacterBustPortrait -> characterPortraits/characterChibiPortraits; no manually inferred legacy URLs.
- [x] Full-body and complete-head assets use proportion-preserving geometry adapted to current Q artwork.
- [x] Final browser screenshots and regression matrix rerun after the source correction (12 combinations; zero retired-art requests).
- [x] Docs regenerated, lint passed, scoped doc tests passed 4/4.
