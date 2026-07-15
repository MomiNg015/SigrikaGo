// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import RoomPeopleList from "./RoomPeopleList.jsx";

const social = vi.hoisted(() => ({
  blacklistIds: new Set(),
  friendIds: new Set(),
  loadProfile: vi.fn(),
  refreshSocial: vi.fn(),
  updateBlacklist: vi.fn(),
  updateFriend: vi.fn()
}));

vi.mock("../social/useSocialRelations.js", () => ({
  useSocialRelations: () => social
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RoomPeopleList floating actions", () => {
  it("portals member actions outside the clipped mobile dock", () => {
    render(
      <main className="app-shell player-theme-enabled theme-bright-school">
        <section className="mobile-room-dock" style={{ overflow: "hidden" }}>
          <div className="mobile-tab-panel" style={{ overflowY: "auto" }}>
            <RoomPeopleList
              room={roomWithOpponent()}
              user={{ id: "self-user" }}
              characters={[]}
              token="token"
              onOpenReplay={() => {}}
              floatingLayerZ={141}
              onFloatingLayerRequest={() => {}}
            />
          </div>
        </section>
      </main>
    );

    const memberButton = screen.getByText("对手").closest("button");
    expect(memberButton).toBeTruthy();

    fireEvent.click(memberButton, { clientX: 180, clientY: 560 });

    const appShell = document.querySelector(".app-shell");
    const dock = document.querySelector(".mobile-room-dock");
    const popover = document.querySelector(".room-person-popover");
    expect(popover).toBeTruthy();
    expect(appShell?.contains(popover)).toBe(true);
    expect(dock?.contains(popover)).toBe(false);
    expect(memberButton?.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("button", { name: "详细信息" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "加好友" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "加入黑名单" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "密谈" }).disabled).toBe(true);

    fireEvent.pointerDown(screen.getByRole("button", { name: "详细信息" }));
    expect(document.querySelector(".room-person-popover")).toBeTruthy();

    fireEvent.pointerDown(document.body);
    expect(document.querySelector(".room-person-popover")).toBeNull();
    expect(memberButton?.getAttribute("aria-expanded")).toBe("false");
  });
});

function roomWithOpponent() {
  return {
    code: "12345",
    players: [
      {
        color: "white",
        connected: true,
        user: {
          id: "opponent-user",
          username: "对手",
          rank: "2段",
          rating: 1500,
          achievementEquipment: null,
          achievementEquipmentAssets: null
        }
      }
    ],
    spectators: []
  };
}
