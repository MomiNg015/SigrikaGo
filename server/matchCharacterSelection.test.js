import { describe, expect, it } from "vitest";
import { resolveMatchCharacter } from "./matchCharacterSelection.js";

const user = { selectedCharacter: "sigrika", ownedCharacters: ["sigrika", "aemeath"] };
describe("match character validation", () => {
  it("overrides only the room identity and preserves account defaults", () => {
    expect(resolveMatchCharacter(user, "aemeath").user.selectedCharacter).toBe("aemeath");
    expect(user.selectedCharacter).toBe("sigrika");
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
