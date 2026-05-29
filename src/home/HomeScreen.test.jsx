import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomeScreen from "./HomeScreen.jsx";
import { CHARACTERS } from "../shared/characters.js";

describe("HomeScreen", () => {
  it("renders online count outside the player plaque", () => {
    const html = renderToStaticMarkup(createElement(HomeScreen, {
      user: {
        username: "shop-test",
        rank: "2段",
        rating: 1000,
        selectedCharacter: "sigrika",
        role: "player"
      },
      characters: CHARACTERS,
      lobbyStats: { onlineCount: 2 },
      onLogout: () => {},
      onStartMatch: () => {},
      onOpenHouse: () => {},
      onOpenWarehouse: () => {},
      onOpenLeaderboard: () => {},
      onOpenWatch: () => {},
      onOpenShop: () => {},
      onOpenFriends: () => {},
      onOpenSettings: () => {},
      onOpenMessageBoard: () => {},
      onOpenAdmin: () => {}
    }));

    expect(html).toContain("home-player-row");
    expect(html).toContain("home-player-plaque");
    expect(html).toContain("plaque-online-tag");
    expect(html.indexOf("home-player-plaque")).toBeLessThan(html.indexOf("plaque-online-tag"));
    expect(html).toContain("在线人数：2");
  });
});
