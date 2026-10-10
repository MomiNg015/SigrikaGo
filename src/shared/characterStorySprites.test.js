import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { ADMIN_DEFAULT_CONFIG } from "../../server/adminDefaultSnapshot.js";
import { toAdminStoryScriptPayload, toPlayerStoryScriptPayload, validateStoryContent, interpolateStoryScript } from "../../server/storyScripts.js";
import { applyAuthoredGuideExpressions } from "./authoredGuideExpressions.js";
import { CHARACTER_STORY_SPRITES, resolveStoryPortraitPresentation, storySpriteUrl, storyAvatarUrls, storyGuidePortraitUrls } from "./characterStorySprites.js";
import { HOME_ONBOARDING_STEPS } from "../home/onboarding/homeOnboardingScript.js";
import { storyPortraitUrls } from "../modals/StoryPlayerModal.jsx";

const record = ADMIN_DEFAULT_CONFIG.storyScripts.find((entry) => entry.key === "onboarding.default");
const original = validateStoryContent({ startNodeId: record.publishedStartNodeId, nodes: JSON.parse(record.publishedNodesJson) }).nodes;

describe("authored guide sprite integration", () => {
  it("does not restore original brow strokes over closed-eye expressions", async () => {
    // Source brow landmarks above the replacement eyes. These caught the old
    // hair-protection mask copying original ink back over the finished faces.
    const landmarks = {
      aemeath: [369, 357], lynae: [274, 336], mornye: [453, 442],
      chisa: [260, 318], changli: [209, 383], qiuyuan: [217, 448], nabomo: [215, 402]
    };
    for (const [characterId, [left, top]] of Object.entries(landmarks)) {
      const pixel = async (expression) => sharp(`public${storySpriteUrl(characterId, expression)}`)
        .extract({ left, top, width: 1, height: 1 }).ensureAlpha().raw().toBuffer();
      const source = await pixel("original");
      const closed = await pixel("closed_smile");
      const brightness = (rgba) => (rgba[0] + rgba[1] + rgba[2]) / 3;
      expect(brightness(source), characterId).toBeLessThan(150);
      expect(brightness(closed), characterId).toBeGreaterThan(brightness(source) + 25);
      expect(closed[3], characterId).toBe(source[3]);
    }
  });
  it("uses chibi art with explicit compatibility aliases and newly available emotions", () => {
    for (const id of Object.keys(CHARACTER_STORY_SPRITES)) {
      const entry = CHARACTER_STORY_SPRITES[id];
      expect(resolveStoryPortraitPresentation({ characterId: id, appearanceId: entry.appearanceId, expressionId: "sad" })).toMatchObject({ standard: true, presentation: "chibi", expressionId: "sad" });
      expect(entry.expressions).toEqual(expect.arrayContaining(["original", "smile", "serious", "surprised", "worried", "sad", "angry", "embarrassed"]));
      for (const [alias, source] of Object.entries(entry.sourceExpressions)) {
        expect(readFileSync(`public${storySpriteUrl(id, alias)}`).equals(readFileSync(`public${storySpriteUrl(id, source)}`))).toBe(true);
      }
    }
    expect(CHARACTER_STORY_SPRITES).not.toHaveProperty("baconbits");
    for (const id of ["aemeath", "lynae", "mornye", "chisa", "changli", "qiuyuan", "nabomo"]) {
      const entry = CHARACTER_STORY_SPRITES[id];
      expect(entry.expressions).toEqual(expect.arrayContaining(["closed_smile", "thinking"]));
      expect(entry.sourceExpressions).not.toHaveProperty("closed_smile");
      expect(entry.sourceExpressions).not.toHaveProperty("thinking");
      const content = validateStoryContent({ startNodeId: "new", nodes: [{ id: "new", characterId: entry.name, text: "测试", appearanceId: entry.appearanceId, expressionId: "thinking" }] }, { publishing: true });
      expect(resolveStoryPortraitPresentation(content.nodes[0]).src).toBe(storySpriteUrl(id, "thinking"));
    }
  });
  it("assigns every current character line without changing text, graph, timing or actions", () => {
    const player = toPlayerStoryScriptPayload(record);
    expect(player.nodes.map(({ appearanceId: _appearance, expressionId: _expression, ...node }) => node)).toEqual(original);
    expect(player.nodes.filter((node) => node.text && node.appearanceId)).toHaveLength(169);
    expect(player.nodes.every((node) => !node.characterId || !node.text || node.appearanceId)).toBe(true);
    expect(new Set(player.nodes.map((node) => node.expressionId).filter(Boolean)).size).toBeGreaterThan(2);
    expect(toAdminStoryScriptPayload(record).draft.nodes).toEqual(player.nodes);
    expect(interpolateStoryScript(player, { username: "小莫" }).nodes[0]).toMatchObject({ text: "哇，是新同学！你就是小莫吧？", expressionId: "surprised" });
    expect(HOME_ONBOARDING_STEPS.filter((node) => node.text && node.appearanceId)).toHaveLength(22);
  });

  it("does not guess an expression after text or character changes, and respects explicit opt-out", () => {
    const first = original[0];
    expect(applyAuthoredGuideExpressions([{ ...first, text: "已经修改的台词" }], record.key)[0]).not.toHaveProperty("appearanceId");
    expect(applyAuthoredGuideExpressions([{ ...first, characterId: "denia" }], record.key)[0]).not.toHaveProperty("appearanceId");
    expect(applyAuthoredGuideExpressions([{ ...first, appearanceId: "" }], record.key)[0].appearanceId).toBe("");
    expect(applyAuthoredGuideExpressions([first], "another.story")[0]).not.toHaveProperty("appearanceId");
  });

  it("round-trips explicit selections, rejects invalid publishing, and safely reads unknown historical metadata", () => {
    const node = { id: "test", characterId: "西格莉卡", text: "原台词", appearanceId: " sigrika-standard-v1 ", expressionId: " thinking " };
    const content = validateStoryContent({ startNodeId: "test", nodes: [node] }, { publishing: true });
    expect(content.nodes[0]).toMatchObject({ appearanceId: "sigrika-standard-v1", expressionId: "thinking" });
    const explicit = { ...record, publishedStartNodeId: "test", publishedNodesJson: JSON.stringify(content.nodes) };
    expect(toPlayerStoryScriptPayload(explicit).nodes).toEqual(content.nodes);
    expect(() => validateStoryContent({ ...content, nodes: [{ ...content.nodes[0], expressionId: "wink" }] }, { publishing: true })).toThrow("该角色没有此表情");
    const future = { ...explicit, publishedNodesJson: JSON.stringify([{ ...node, appearanceId: "future-version", expressionId: "unknown" }]) };
    const loaded = toPlayerStoryScriptPayload(future);
    expect(loaded.nodes).toHaveLength(1);
    expect(resolveStoryPortraitPresentation(loaded.nodes[0])).toMatchObject({ presentation: "chibi", appearanceId: "", expressionId: "" });
  });

  it("uses distinct full and avatar assets, resets narration, and preserves special forms", () => {
    const node = { characterId: "denia", appearanceId: "denia-standard-v1", expressionId: "playful" };
    const full = resolveStoryPortraitPresentation(node);
    expect(full.src).toBe(storySpriteUrl("denia", "playful"));
    expect(resolveStoryPortraitPresentation(node, { variant: "avatar" }).src).toContain("playful-avatar.webp");
    expect(resolveStoryPortraitPresentation({}).src).toBe("");
    expect(resolveStoryPortraitPresentation({ characterId: "denia-rainbow-glow" })).toMatchObject({
      standard: true, presentation: "chibi",
      src: "/assets/characters/story-sprites/denia/rainbow-spray.webp",
      stillSrc: "/assets/characters/story-sprites/denia/rainbow-spray-still.webp",
      fallbackSrc: "/assets/characters/handbook-chibi-sprites/denia.webp"
    });
    expect(resolveStoryPortraitPresentation(node, { user: { itemEffects: { deniaRainbowGlow: true } } }).src).toBe(full.src);
    expect(resolveStoryPortraitPresentation({ characterId: "sigrika", appearanceId: "sigrika-standard-v1", expressionId: "smile" }, { user: { sigrikaCandyArc: { corrupted: true } } }).standard).toBe(true);
    expect(full.style).toBeUndefined();
    expect(resolveStoryPortraitPresentation({ characterId: "denia" }, { user: { equippedCostumes: { denia: { portraitUrl: "/skin.webp" } } } }).src)
      .toBe("/assets/characters/handbook-chibi-sprites/denia.webp");
    const costumeUser = { equippedCostumes: { denia: { portraitUrl: "/costume.webp", portraitScale: 2 } } };
    expect(resolveStoryPortraitPresentation(node, { user: costumeUser }).src).toBe(full.src);
    expect(storyAvatarUrls([{ id: "implicit-npc", characterId: "" }], { user: costumeUser, fallbackCharacterIds: ["denia"] })).toEqual(["/assets/characters/handbook-chibi-sprites/denia-avatar.webp"]);
    expect(storyAvatarUrls([node])).toEqual([storySpriteUrl("denia", "playful", "avatar")]);
    expect(storyGuidePortraitUrls([node, node, { ...node, characterId: "" }], { fallbackCharacterIds: ["denia"] })).toEqual([full.src]);
    expect(storyGuidePortraitUrls([{ id: "implicit-npc", characterId: "" }], { user: costumeUser, fallbackCharacterIds: ["denia"] })).toEqual(["/assets/characters/handbook-chibi-sprites/denia.webp"]);
    expect(storyPortraitUrls([node, node, { ...node, expressionId: "thinking" }, {}])).toEqual([storySpriteUrl("denia", "playful"), storySpriteUrl("denia", "thinking")]);
  });

  it("ships every catalog expression with transparent full art and fixed-frame avatars", async () => {
    const manifest = JSON.parse(readFileSync("public/assets/characters/story-sprites/manifest.json", "utf8"));
    expect(manifest.files).toHaveLength(Object.values(CHARACTER_STORY_SPRITES).reduce((sum, entry) => sum + entry.expressions.length, 0));
    for (const entry of Object.values(CHARACTER_STORY_SPRITES)) {
      let alpha = null;
      for (const expression of entry.expressions) {
        const file = `public${storySpriteUrl(entry.characterId, expression)}`;
        expect(await sharp(file).metadata()).toMatchObject({ width: 832, height: 1216, hasAlpha: true });
        expect(await sharp(`public${storySpriteUrl(entry.characterId, expression, "avatar")}`).metadata()).toMatchObject({ width: 256, height: 256, hasAlpha: true });
        const current = await sharp(file).extractChannel("alpha").raw().toBuffer();
        if (alpha) expect(current.equals(alpha)).toBe(true);
        alpha = current;
      }
      const original = await sharp(`public${storySpriteUrl(entry.characterId, "original")}`).ensureAlpha().raw().toBuffer();
      const defaultArt = await sharp(`public/assets/characters/handbook-chibi-sprites/${entry.characterId}.webp`).ensureAlpha().raw().toBuffer();
      // Lossless WebP may discard RGB under fully transparent pixels.
      for (let i = 0; i < original.length; i += 4) {
        if (!original[i + 3]) original.fill(0, i, i + 3);
        if (!defaultArt[i + 3]) defaultArt.fill(0, i, i + 3);
      }
      expect(original.equals(defaultArt)).toBe(true);
    }
  }, 30000);
});
