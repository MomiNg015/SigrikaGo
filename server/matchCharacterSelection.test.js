import { describe, expect, it } from "vitest";
import { resolveMatchCharacter } from "./matchCharacterSelection.js";
import { CHARACTERS } from "../src/shared/characters.js";

const user = { selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "aemeath"] };
describe("match character validation", () => {
  it("overrides only the room identity and preserves account defaults", () => {
    const account = { ...user, characterConfig: CHARACTERS.sigrika };
    expect(resolveMatchCharacter(account, "aemeath").user).toMatchObject({ selectedCharacter: "aemeath", characterConfig: CHARACTERS.aemeath });
    expect(account.characterConfig).toBe(CHARACTERS.sigrika);
    expect(user.selectedCharacter).toBe("sigrika");
  });
  it("uses the validated catalog configuration including administrator customizations", () => {
    const character = { ...CHARACTERS.aemeath, skill: { ...CHARACTERS.aemeath.skill, name: "定制技能" } };
    const result = resolveMatchCharacter({ ...user, characterConfig: CHARACTERS.sigrika }, "aemeath", { characters: { aemeath: character } });
    expect(result.user.characterConfig).toEqual(character);
  });
  it.each([null, {}, "missing", "nabomo"])("rejects unavailable input %s", (id) => {
    expect(resolveMatchCharacter(user, id).ok).toBe(false);
  });
  it("rejects disabled, item-blocked and corrupted characters", () => {
    expect(resolveMatchCharacter(user, "aemeath", { disabledSlugs: new Set(["aemeath"]) }).ok).toBe(false);
    expect(resolveMatchCharacter({ ...user, itemEffects: { sigrikaCandyDisabled: true } }, "sigrika").ok).toBe(false);
    expect(resolveMatchCharacter({ ...user, sigrikaCandyArc: { corrupted: true } }, "aemeath").ok).toBe(false);
  });
});
