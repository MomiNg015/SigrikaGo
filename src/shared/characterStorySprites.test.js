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
    expect(resolveStoryPortraitPresentation(loaded.nodes[0]).standard).toBe(false);
  });

  it("uses distinct full and avatar assets, resets narration, and preserves special forms", () => {
    const node = { characterId: "denia", appearanceId: "denia-standard-v1", expressionId: "playful" };
    const full = resolveStoryPortraitPresentation(node);
    expect(full.src).toBe(storySpriteUrl("denia", "playful"));
    expect(resolveStoryPortraitPresentation(node, { variant: "avatar" }).src).toContain("playful-avatar.webp");
    expect(resolveStoryPortraitPresentation({}).src).toBe("");
    expect(resolveStoryPortraitPresentation({ characterId: "denia-rainbow-glow" }).standard).toBe(false);
    expect(resolveStoryPortraitPresentation(node, { user: { itemEffects: { deniaRainbowGlow: true } } }).standard).toBe(false);
    expect(resolveStoryPortraitPresentation({ characterId: "sigrika", appearanceId: "sigrika-standard-v1", expressionId: "smile" }, { user: { sigrikaCandyArc: { corrupted: true } } }).standard).toBe(false);
    expect(full.style).toBeUndefined();
    const costumeUser = { equippedCostumes: { denia: { portraitUrl: "/costume.webp", portraitScale: 2 } } };
    expect(resolveStoryPortraitPresentation(node, { user: costumeUser }).src).toBe(full.src);
    expect(storyAvatarUrls([{ id: "implicit-npc", characterId: "" }], { user: costumeUser, fallbackCharacterIds: ["denia"] })).toEqual(["/costume.webp"]);
    expect(storyAvatarUrls([node])).toEqual([storySpriteUrl("denia", "playful", "avatar")]);
    expect(storyGuidePortraitUrls([node, node, { ...node, characterId: "" }], { fallbackCharacterIds: ["denia"] })).toEqual([full.src]);
    expect(storyGuidePortraitUrls([{ id: "implicit-npc", characterId: "" }], { user: costumeUser, fallbackCharacterIds: ["denia"] })).toEqual(["/costume.webp"]);
    expect(storyPortraitUrls([node, node, { ...node, expressionId: "thinking" }, {}])).toEqual([storySpriteUrl("denia", "playful"), storySpriteUrl("denia", "thinking")]);
  });

  it("ships all 27 full transparent images and all 27 small fixed-frame avatars", async () => {
    const manifest = JSON.parse(readFileSync("public/assets/characters/story-sprites/manifest.json", "utf8"));
    expect(manifest.files).toHaveLength(27);
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
    }
  });
});
