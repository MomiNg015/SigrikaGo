import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const battleScript = readFileSync(new URL("./verify-battle-fixes.mjs", import.meta.url), "utf8");

describe("verification script contracts", () => {
  it("wires the battle fixes verifier as an npm script", () => {
    expect(packageJson.scripts["verify:battle-fixes"]).toBe("node scripts/verify-battle-fixes.mjs");
  });

  it("covers the battle board, skill, capture, chat, and docs regressions", () => {
    [
      "src/styles/cssLayerInventory.test.js",
      "src/styles/styleContract.test.js",
      "src/styles/themeContract.test.js",
      "src/shared/game.test.js",
      "src/shared/gameSkills.test.js",
      "src/shared/characters.test.js",
      "src/shared/boardView.test.js",
      "src/shared/boardAudio.test.js",
      "src/shared/skillEffectCatalog.test.js",
      "src/shared/skillPresentation.test.js",
      "src/room/Board.test.js",
      "src/room/BoardAmbientEffects.test.js",
      "src/room/BoardSkillEffects.test.js",
      "src/room/boardSkillEffectRegistry.test.js",
      "src/room/boardSkillEffectSoundScheduler.test.js",
      "src/room/ChatBox.test.js",
      "src/room/RoomScreen.test.js",
      "src/room/actions/useRoomPointActions.test.js",
      "src/room/mobilePointConfirmation.test.js",
      "src/room/roomView.test.js",
      "server/adminDefaultSeed.test.js",
      "scripts/verificationScripts.test.js"
    ].forEach((target) => {
      expect(battleScript).toContain(target);
    });

    expect(battleScript).toContain("docs:system-design");
    expect(battleScript).toContain("docs/systemDesignHtml.test.js");
  });
});
