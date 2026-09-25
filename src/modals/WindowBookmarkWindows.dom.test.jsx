// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import SettingsModal from "./SettingsModal.jsx";
import AchievementModal from "./AchievementModal.jsx";
import LeaderboardModal from "./LeaderboardModal.jsx";
import WatchModal from "./WatchModal.jsx";
import FriendsModal from "./FriendsModal.jsx";
import AnnouncementModal from "./AnnouncementModal.jsx";
import RecruitmentModal from "./RecruitmentModal.jsx";
import { UserProfileCard } from "./UserProfileCard.jsx";
import { RECRUITMENT_ITEMS, RECRUITMENT_ITEM_TYPES } from "../shared/recruitment.js";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));
const user = { id: 1, username: "测试玩家", selectedCharacter: "sigrika", relation: "self" };
const noop = () => {};
const shared = { token: "test", user, characters: {}, onClose: noop, onNotice: noop };
const cases = [
  ["设置", SettingsModal, { audioSettings: { master: 80, bgm: 60, sfx: 60, voice: 80 }, setAudioSettings: noop }, "关于"],
  ["成就", AchievementModal, {}, "已达成"],
  ["排行榜", LeaderboardModal, {}, "标准"],
  ["观战", WatchModal, {}, "标准"],
  ["好友", FriendsModal, {}, "黑名单"],
  ["公告", AnnouncementModal, { unreadByKind: { changelog: true } }, "日志"],
  ["详细资料", UserProfileCard, { titleStickers: true }, "标准"]
];

beforeEach(() => {
  api.mockImplementation(async (path) => {
    if (path === "/api/recruitment") return { items: [
      { ...RECRUITMENT_ITEMS[RECRUITMENT_ITEM_TYPES.campusPoster], quantity: 2 },
      { ...RECRUITMENT_ITEMS[RECRUITMENT_ITEM_TYPES.radioTicket], quantity: 2 }
    ] };
    return { profile: user, achievements: [], friends: [], blacklist: [], players: [], rooms: [], items: [], roomCounts: { standard: 2 } };
  });
});
afterEach(cleanup);

describe("player window bookmark rollout", () => {
  it.each(cases)("moves %s tabs outside the content and keeps selection working", async (_name, Component, extra, targetName) => {
    const { container } = render(<div className="app-shell player-theme-enabled theme-bright-school">
      <Component {...shared} {...extra} />
    </div>);
    const target = await screen.findByRole("tab", { name: targetName });
    const rail = target.closest('[role="tablist"]');
    expect(rail.className).toBe("window-bookmark-rail");
    expect(rail.parentElement.classList.contains("window-bookmark-host")).toBe(true);
    fireEvent.click(target);
    await waitFor(() => expect(target.getAttribute("aria-selected")).toBe("true"));
    expect(container.querySelectorAll('.window-bookmark-tab[aria-selected="true"]')).toHaveLength(1);
    expect(target.querySelector(".window-bookmark-paper")).not.toBeNull();
  });

  it("keeps recruitment items inside the action footer and preserves selection", async () => {
    const { container } = render(<div className="app-shell player-theme-enabled theme-bright-school">
      <RecruitmentModal {...shared} />
    </div>);
    const target = await screen.findByRole("button", { name: new RegExp(RECRUITMENT_ITEMS[RECRUITMENT_ITEM_TYPES.radioTicket].name) });
    expect(container.querySelector(".window-bookmark-rail")).toBeNull();
    expect(target.closest(".recruitment-actions")).not.toBeNull();
    expect(screen.getByRole("group", { name: "招募道具" })).toBeTruthy();
    fireEvent.click(target);
    await waitFor(() => expect(target.getAttribute("aria-pressed")).toBe("true"));
    expect(container.querySelectorAll('.recruitment-item-button[aria-pressed="true"]')).toHaveLength(1);
    expect(screen.getByRole("button", { name: "使用", exact: true }).disabled).toBe(false);
  });

  it("keeps in-room profile tabs inline without the home window opt-in", () => {
    const { container } = render(<div className="app-shell player-theme-enabled theme-bright-school">
      <UserProfileCard {...shared} />
    </div>);
    expect(container.querySelector(".window-bookmark-rail")).toBeNull();
    expect(screen.getByRole("tablist").className).toContain("profile-mode-tabs");
  });
});
