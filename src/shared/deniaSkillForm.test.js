import { describe, expect, it } from "vitest";
import { DENIA_SKILL_FORM, DENIA_SKILL_FORM_ASSET, deniaFormBeforeCast, hasDeniaSkillForm } from "./deniaSkillForm.js";
import { skillBannerDurationMs, skillPreviewResolutionDelay } from "./skillPresentation.js";
import { characterPortraitImageProps } from "./characterPortraits.js";
import { resolveHandbookPortrait } from "./handbookPortraits.js";
import { CHARACTERS } from "./characters.js";
import { createGameState, getPoint, useSkill } from "./game.js";
import { replayGameAt } from "../room/roomView.js";

const cast = { type: "skill", color: "black", effectType: "flip-stone" };
describe("Denia battle form", () => {
  it("belongs to the caster, survives a serialized result, and resets in a new game", () => {
    const game = JSON.parse(JSON.stringify({ history: [cast], phase: "finished" }));
    expect(hasDeniaSkillForm(game, "black")).toBe(true);
    expect(hasDeniaSkillForm(game, "white")).toBe(false);
    expect(hasDeniaSkillForm({ history: [] }, "black")).toBe(false);
    expect(deniaFormBeforeCast(game, "black")).toBe(null);
    expect(deniaFormBeforeCast({ history: [cast, cast] }, "black")).toBe(DENIA_SKILL_FORM);
  });
  it("keeps finished team members transformed without changing the next member", () => {
    const game = { history: [cast, { type: "team-round", round: 2 }] };
    expect(hasDeniaSkillForm(game, "black")).toBe(false);
    expect(hasDeniaSkillForm(game, "black", 1)).toBe(true);
    expect(hasDeniaSkillForm(game, "black", 3)).toBe(false);
  });
  it("reconstructs the form only after the recorded skill in a real replay", () => {
    const players = ["black", "white"].map((color) => ({ color, characterId: "denia", character: CHARACTERS.denia }));
    const game = createGameState(players);
    // Replay starts empty, so record the stone via a real move before the cast.
    const room = { players, game: { ...game, history: [
      { type: "move", color: "black", id: "4,4" },
      { ...cast, color: "white", id: "4,4" }
    ] } };
    expect(hasDeniaSkillForm(replayGameAt(room, 1), "white")).toBe(false);
    expect(hasDeniaSkillForm(replayGameAt(room, 2), "white")).toBe(true);
    getPoint(game, "4,4").stone = "white";
    expect(hasDeniaSkillForm(useSkill(game, "black", "denia", "4,4").state, "black")).toBe(true);
  });
  it("uses the supplied art for battle only, including over frozen costumes/candy", () => {
    const options = { battleForm: DENIA_SKILL_FORM, itemEffects: { deniaRainbowGlow: true }, costumeSnapshot: { portraitUrl: "/costume.webp", portraitScale: 140 } };
    expect(characterPortraitImageProps(CHARACTERS.denia, options)).toMatchObject({ src: DENIA_SKILL_FORM_ASSET });
    expect(resolveHandbookPortrait(CHARACTERS.denia, { ...options, chibi: true })).toMatchObject({ src: DENIA_SKILL_FORM_ASSET, isStandard: true, width: 832, height: 1216 });
    expect(characterPortraitImageProps(CHARACTERS.sigrika, options).src).toBe("/costume.webp");
    expect(characterPortraitImageProps(CHARACTERS.denia).src).not.toBe(DENIA_SKILL_FORM_ASSET);
  });
  it("extends only Denia and shifts board resolution by exactly the banner extension", () => {
    expect(skillBannerDurationMs({ characterId: "denia" })).toBe(3200);
    expect(skillBannerDurationMs({ characterId: "sigrika" })).toBe(2000);
    expect(skillBannerDurationMs({ characterId: "denia", effectsEnabled: false })).toBe(2000);
    for (const effectType of ["flip-stone", "spray-stone", "liberty-purge"]) {
      expect(skillPreviewResolutionDelay({ characterId: "denia", effectType }) - skillPreviewResolutionDelay({ effectType })).toBe(1200);
    }
    expect(skillPreviewResolutionDelay({ characterId: "denia", effectsEnabled: false })).toBe(2000);
  });
});
