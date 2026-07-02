import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import HomeScreen from "./HomeScreen.jsx";
import { HomeActionButton } from "./homeComponents.jsx";
import { CHARACTERS } from "../shared/characters.js";

function renderHome(overrides = {}) {
  return renderToStaticMarkup(createElement(HomeScreen, {
    user: {
      username: "phase-five",
      selectedCharacter: "sigrika",
      role: "player",
      ...overrides.user
    },
    characters: CHARACTERS,
    lobbyStats: { onlineCount: 1, matchmakingCount: 0, ...(overrides.lobbyStats ?? {}) },
    matchModePickerOpen: true,
    onLogout: () => {},
    onStartMatch: () => {},
    onOpenHouse: () => {},
    onOpenWarehouse: () => {},
    onOpenLeaderboard: () => {},
    onOpenWatch: () => {},
    onOpenShop: () => {},
    onOpenFriends: () => {},
    onOpenSettings: () => {},
    onOpenAnnouncements: () => {},
    onOpenMailbox: () => {},
    onOpenMessageBoard: () => {},
    onOpenOnboardingStory: () => {},
    onOpenAdmin: () => {},
    ...overrides
  }));
}

describe("HomeActionButton", () => {
  it("keeps home action visuals CSS-owned while routing alignment through the Button primitive", () => {
    const html = renderToStaticMarkup(
      <>
        <HomeActionButton variant="primary" type="submit">确认</HomeActionButton>
        <HomeActionButton variant="secondary" type="button">取消</HomeActionButton>
        <HomeActionButton variant="danger" type="button">放弃</HomeActionButton>
      </>
    );

    expect(html).toContain("primary-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
    expect(html).toContain("secondary-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
    expect(html).toContain("danger-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
  });

  it("routes the match-mode cancel action through the home wrapper without changing its CSS contract", () => {
    const html = renderHome();
    const source = readFileSync(new URL("./HomeScreen.jsx", import.meta.url), "utf8");

    expect(source).toContain("HomeActionButton");
    expect(source).not.toContain('className="secondary-action"');
    expect(html).toContain("match-mode-options");
    expect(html).toContain("secondary-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
  });
});
