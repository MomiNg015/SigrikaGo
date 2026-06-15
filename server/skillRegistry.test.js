import { describe, expect, test } from "vitest";
import { skillConfigForCharacter } from "./skillRegistry.js";

describe("server skill registry", () => {
  test("derives fallback target rules from the shared skill effect catalog", () => {
    expect(skillConfigForCharacter("sigrika").targetRule).toBe("empty-point");
    expect(skillConfigForCharacter("denia").targetRule).toBe("stone");
    expect(skillConfigForCharacter("baconbits").targetRule).toBe("none");
    expect(skillConfigForCharacter("nabomo").targetRule).toBe("none");
  });
});
