import { describe, expect, it } from "vitest";
import { AEMEATH_SKILL_FORM, AEMEATH_SKILL_FORM_ASSET, hasAemeathSkillForm, isAemeathVoyageBanner } from "./aemeathSkillForm.js";
import { battleFormBeforeCast } from "./battleSkillForm.js";
import { characterPortraitImageProps } from "./characterPortraits.js";
import { resolveHandbookPortrait } from "./handbookPortraits.js";
import { CHARACTERS } from "./characters.js";
import { buildPendingSkillPreview } from "../../server/roomSkillResolution.js";
import { skillBannerDurationMs, skillPreviewResolutionDelay } from "./skillPresentation.js";

const cast = { type: "skill", color: "black", effectType: "voyage-star" };
describe("Aemeath match appearance", () => {
  it("requires the specific effect and isolates caster and team round", () => {
    expect(isAemeathVoyageBanner({ id: "1", characterId: "aemeath", effectType: "hidden-hand" })).toBe(false);
    expect(isAemeathVoyageBanner({ id: "1", characterId: "denia", effectType: "voyage-star" })).toBe(false);
    expect(hasAemeathSkillForm({ history: [{ ...cast, effectType: "hidden-hand" }] }, "black")).toBe(false);
    const game = JSON.parse(JSON.stringify({ phase: "finished", history: [cast] }));
    expect(hasAemeathSkillForm(game, "black")).toBe(true);
    expect(hasAemeathSkillForm(game, "white")).toBe(false);
    expect(hasAemeathSkillForm({ history: [] }, "black")).toBe(false);
    game.history.push({ type: "team-round", round: 2 });
    expect(hasAemeathSkillForm(game, "black")).toBe(false);
    expect(hasAemeathSkillForm(game, "black", 1)).toBe(true);
  });
  it("keeps the first cast normal and serializes the form for later server banners", () => {
    expect(battleFormBeforeCast({ history: [cast] }, "aemeath", "black")).toBe(null);
    const resolvedGame = { history: [cast, { ...cast, effectType: "hidden-hand" }] };
    expect(battleFormBeforeCast(resolvedGame, "aemeath", "black")).toBe(AEMEATH_SKILL_FORM);
    const preview = buildPendingSkillPreview({ pendingSkillId: "later", player: { color: "black", characterId: "aemeath", user: { username: "test" } }, character: CHARACTERS.aemeath, skill: CHARACTERS.aemeath.skill, resolvedGame, resolvesAt: 4000 });
    expect(preview.battleFormBeforeCast).toBe(AEMEATH_SKILL_FORM);
    expect(preview.bannerDurationMs).toBe(2000);
  });
  it("overrides battle costume art without changing identity art or other characters", () => {
    const options = { battleForm: AEMEATH_SKILL_FORM, costumeSnapshot: { portraitUrl: "/frozen.png", portraitScale: 130 } };
    expect(characterPortraitImageProps(CHARACTERS.aemeath, options).src).toBe(AEMEATH_SKILL_FORM_ASSET);
    expect(resolveHandbookPortrait(CHARACTERS.aemeath, options)).toMatchObject({ src: AEMEATH_SKILL_FORM_ASSET, isStandard: true, width: 832, height: 1216 });
    expect(characterPortraitImageProps(CHARACTERS.denia, options).src).toBe("/frozen.png");
    expect(characterPortraitImageProps(CHARACTERS.aemeath).src).not.toBe(AEMEATH_SKILL_FORM_ASSET);
    expect(skillBannerDurationMs({ characterId: "aemeath" })).toBe(2000);
    expect(skillBannerDurationMs({ characterId: "aemeath", effectType: "voyage-star" })).toBe(3600);
    expect(skillBannerDurationMs({ characterId: "aemeath", effectType: "hidden-hand" })).toBe(2000);
    expect(skillBannerDurationMs({ characterId: "aemeath", effectType: "voyage-star", effectsEnabled: false })).toBe(2000);
    expect(skillPreviewResolutionDelay({ characterId: "aemeath", effectType: "voyage-star", effectsEnabled: false })).toBe(2000);
    expect(skillPreviewResolutionDelay({ characterId: "aemeath", effectType: "voyage-star" })).toBe(4536);
  });
});
