import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("InteractionFeedback", () => {
  it("listens for available interactions and unavailable controls", () => {
    const source = readFileSync(new URL("./InteractionFeedback.jsx", import.meta.url), "utf8");

    expect(source).toContain("document.addEventListener(\"pointerdown\", handlePointerDown, true)");
    expect(source).toContain("document.addEventListener(\"click\", handleClick, true)");
    expect(source).toContain("button:disabled");
    expect(source).toContain(".terminal-locked-slot");
    expect(source).toContain("playUiCloseWindowSound(audioSettings)");
    expect(source).toContain("playUiConfirmSound(audioSettings)");
    expect(source).toContain("playUiUnavailableSound(audioSettings)");
    expect(source).toContain(".close-button");
    expect(source).toContain("[data-ui-sound='close']");
    expect(source).toContain("UI_UNAVAILABLE_SHAKE_MS");
    expect(source).toContain(".room-screen .board-wrap");
    expect(source).toContain(".room-screen .player-info");
    expect(source).toContain(".room-screen .room-title-stack");
    expect(source).toContain(".room-screen .replay-bar");
    expect(source).toContain("shouldSuppressUnavailableSound(target)");
    expect(source).toContain("shouldSuppressConfirmSound(target)");
  });

  it("marks specialized interactions so they do not double-play the generic confirm sound", () => {
    const appRoutesSource = readFileSync(new URL("./AppRoutes.jsx", import.meta.url), "utf8");
    const houseModalSource = readFileSync(new URL("../modals/HouseModal.jsx", import.meta.url), "utf8");
    const homeImageEntriesSource = readFileSync(new URL("../home/components/HomeImageEntries.jsx", import.meta.url), "utf8");
    const houseGridSource = readFileSync(new URL("../modals/house/HouseCharacterGrid.jsx", import.meta.url), "utf8");
    const homeDockSource = readFileSync(new URL("../home/components/HomeUtilityDock.jsx", import.meta.url), "utf8");

    expect(appRoutesSource).toContain("playUiHouseOpenSound(audioSettings)");
    expect(appRoutesSource).toContain("playUiMatchOpenSound(audioSettings)");
    expect(appRoutesSource).toContain("playUiRecruitmentOpenSound(audioSettings)");
    expect(appRoutesSource).toContain("playUiShopOpenSound(audioSettings)");
    expect(houseModalSource).toContain("playUiDetailOpenSound(audioSettings)");
    expect(homeImageEntriesSource).toContain("data-ui-sound=\"none\"");
    expect(houseGridSource).toContain("data-ui-sound=\"none\"");
    expect(houseGridSource).toContain("data-ui-sound=\"confirm\"");
    expect(homeDockSource).toContain("data-ui-sound=\"none\"");
  });

  it("restarts unavailable feedback without forcing synchronous layout", () => {
    const source = readFileSync(new URL("./InteractionFeedback.jsx", import.meta.url), "utf8");

    expect(source).not.toContain("offsetWidth");
    expect(source).toContain("requestAnimationFrame");
  });
});
