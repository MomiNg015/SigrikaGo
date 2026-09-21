import { describe, expect, test } from "vitest";
import { qiuyuanContactProgress, qiuyuanCutPointIds, qiuyuanSlashTravel, QIUYUAN_SLASH_START } from "./qiuyuanPresentation.js";
import { skillEffectSoundCues } from "./skillEffectCatalog.js";

describe("Qiuyuan blade contact", () => {
  test.each([9, 13, 19])("hits every intersection on a %i-line board at its removal time", (size) => {
    let previous = 0;
    for (let column = 0; column < size; column += 1) {
      const contact = qiuyuanContactProgress(column, size);
      const bladeX = -0.75 + (size + 1.5) * qiuyuanSlashTravel(contact);
      expect(bladeX).toBeCloseTo(column + 0.5, 8);
      expect(contact).toBeGreaterThan(previous);
      previous = contact;
    }
  });

  test("clamps the sweep and starts the impact cue with the main blade", () => {
    expect(qiuyuanSlashTravel(0)).toBe(0);
    expect(qiuyuanSlashTravel(1)).toBe(1);
    expect(skillEffectSoundCues("row-slash").impactAt).toBe(QIUYUAN_SLASH_START);
  });

  test("cuts only recorded stones, not empty affected intersections", () => {
    expect(qiuyuanCutPointIds({ affectedPointIds: ["0,6", "1,6", "2,6"], removedStones: [{ id: "1,6" }, { id: "1,6" }] })).toEqual(["1,6"]);
    expect(qiuyuanCutPointIds({ affectedPointIds: ["0,6"] })).toEqual([]);
  });
});
