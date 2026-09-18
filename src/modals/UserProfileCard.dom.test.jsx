// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import { UserProfileCard } from "./UserProfileCard.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

const characters = [
  { id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" },
  { id: "aemeath", name: "爱弥斯", portrait: "/aemeath.webp" }
];

function profileUser(overrides = {}) {
  return {
    id: "user-2",
    username: "visitor",
    mode: "spark",
    rank: "3段",
    rating: 1180,
    relation: "none",
    characterId: "sigrika",
    likeCount: 5,
    likedToday: false,
    recentResults: ["win", "loss"],
    recordStats: { totalGames: 10, wins: 6, losses: 3, draws: 1 },
    characterStats: [{ characterId: "sigrika", total: 10, wins: 6, losses: 3, draws: 1 }],
    ...overrides
  };
}

function renderProfile(overrides = {}, props = {}) {
  return render(
    <UserProfileCard
      user={profileUser(overrides)}
      characters={characters}
      token="token"
      onClose={() => {}}
      onAddFriend={vi.fn()}
      onAddBlacklist={vi.fn()}
      onOpenReplay={() => {}}
      {...props}
    />
  );
}

describe("UserProfileCard dossier interactions", () => {
  afterEach(cleanup);

  beforeEach(() => {
    api.mockReset();
  });

  it.each([false, true])("opts report titles in explicitly and restores focus (stickers: %s)", (titleStickers) => {
    const { container } = renderProfile({}, { titleStickers });
    expect(Boolean(container.querySelector(".window-title-sticker"))).toBe(titleStickers);
    const trigger = screen.getByRole("button", { name: "举报", exact: true });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "举报用户" });
    const title = within(dialog).getByRole("heading", { name: "举报用户" });
    expect(title.classList.contains("window-title-sticker")).toBe(titleStickers);
    expect(Boolean(title.closest("form"))).toBe(!titleStickers);
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "举报用户" })).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("keeps social actions in the identity area and locks the mode tab order", async () => {
    const onAddBlacklist = vi.fn().mockResolvedValue(undefined);
    renderProfile({}, { onAddBlacklist });

    expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual(["星炬", "标准", "五子棋"]);
    const actions = screen.getByLabelText("用户互动");
    expect(within(actions).getByRole("button", { name: "点赞 5" })).toBeTruthy();
    expect(within(actions).getByRole("button", { name: "加好友" })).toBeTruthy();
    expect(within(actions).getByRole("button", { name: "加入黑名单" })).toBeTruthy();
    expect(within(actions).getByRole("button", { name: "举报" })).toBeTruthy();
    expect([...actions.children].map((button) => button.className)).toEqual([
      "profile-like-button",
      "profile-friend-button",
      "profile-blacklist-button",
      "profile-report-button"
    ]);
    expect([...actions.children].map((button) => button.textContent)).toEqual(["5", "", "", ""]);
    expect([...actions.children].map((button) => button.querySelector("svg")?.getAttribute("width"))).toEqual(["18", "18", "18", "18"]);
    expect([...actions.children].map((button) => button.querySelector("svg")?.getAttribute("height"))).toEqual(["18", "18", "18", "18"]);
    expect(within(actions).queryByRole("button", { name: "个性化" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "最近十盘" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "角色战绩" })).toBeNull();
    const totalSummary = screen.getByText("总对局").closest(".profile-summary-item");
    const replayButton = within(totalSummary).getByRole("button", { name: "对局回放" });
    expect(replayButton.textContent).toBe("");
    expect(screen.getByLabelText("最近十盘").querySelector(".profile-rank-results")).toBeTruthy();
    expect(document.querySelector(".profile-secondary-actions")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "加入黑名单" }));
    expect(screen.getByRole("dialog", { name: "加入黑名单" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "确认加入" }));
    await waitFor(() => expect(onAddBlacklist).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "已在黑名单" }).disabled).toBe(true);
  });

  it("disables self, friend, and already-liked actions with explicit labels", () => {
    const { rerender } = renderProfile({ relation: "self" });
    expect(screen.getByRole("button", { name: "点赞 5" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "加好友" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "举报" }).disabled).toBe(true);

    rerender(
      <UserProfileCard
        user={profileUser({ relation: "friend", likedToday: true })}
        characters={characters}
        token="token"
        onClose={() => {}}
        onAddFriend={vi.fn()}
        onAddBlacklist={vi.fn()}
      />
    );
    expect(screen.getByRole("button", { name: "已点赞 5" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "已是好友" }).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "举报" }).disabled).toBe(false);
  });

  it("locks duplicate likes while the request is pending", async () => {
    const request = deferred();
    api.mockReturnValueOnce(request.promise);
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: "点赞 5" }));
    expect(screen.getByRole("button", { name: "点赞中 5" }).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "点赞中 5" }));
    expect(api).toHaveBeenCalledTimes(1);

    request.resolve({ likeCount: 6, likedToday: true });
    await waitFor(() => expect(screen.getByRole("button", { name: "已点赞 6" }).disabled).toBe(true));
  });

  it("keeps report submission disabled and labelled while it is pending", async () => {
    const request = deferred();
    api.mockReturnValueOnce(request.promise);
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: "举报" }));
    fireEvent.change(screen.getByLabelText("举报内容"), { target: { value: "不当内容" } });
    fireEvent.click(screen.getByRole("button", { name: "提交举报" }));
    expect(screen.getByRole("button", { name: "提交中…" }).disabled).toBe(true);
    expect(api).toHaveBeenCalledTimes(1);

    request.resolve({ ok: true });
    await waitFor(() => expect(screen.queryByRole("heading", { name: "举报用户" })).toBeNull());
  });

  it("shows report failures inside the report dialog and preserves the draft", async () => {
    api.mockRejectedValueOnce(new Error("举报提交失败"));
    renderProfile();

    fireEvent.click(screen.getByRole("button", { name: "举报" }));
    const reportDialog = screen.getByRole("dialog", { name: "举报用户" });
    const textarea = within(reportDialog).getByLabelText("举报内容");
    fireEvent.change(textarea, { target: { value: "需要保留的举报内容" } });
    fireEvent.click(within(reportDialog).getByRole("button", { name: "提交举报" }));

    await waitFor(() => expect(within(reportDialog).getByRole("alert").textContent).toBe("举报提交失败"));
    expect(textarea.value).toBe("需要保留的举报内容");
    expect(screen.getByRole("dialog", { name: "举报用户" })).toBeTruthy();
  });

  it("keeps the previous data visible, blocks duplicate mode requests, and restores the tab after failure", async () => {
    const request = deferred();
    api.mockReturnValueOnce(request.promise);
    renderProfile();

    fireEvent.click(screen.getByRole("tab", { name: "标准" }));
    expect(screen.getByText("10局")).toBeTruthy();
    expect(screen.getByText("正在载入标准战绩，当前仍显示星炬。")).toBeTruthy();
    expect(screen.getAllByRole("tab").every((tab) => tab.getAttribute("aria-disabled") === "true")).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "五子棋" }));
    expect(api).toHaveBeenCalledTimes(1);

    request.reject(new Error("模式资料加载失败"));
    await waitFor(() => expect(screen.getByText("模式资料加载失败")).toBeTruthy());
    expect(screen.getByRole("tab", { name: "星炬" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("10局")).toBeTruthy();
    expect(screen.getByRole("button", { name: "重新加载" })).toBeTruthy();
  });

  it("ignores an old mode response after the viewed user changes", async () => {
    const request = deferred();
    api.mockReturnValueOnce(request.promise);
    const view = renderProfile();

    fireEvent.click(screen.getByRole("tab", { name: "标准" }));
    view.rerender(
      <UserProfileCard
        user={profileUser({ id: "user-3", username: "new-user", rating: 1330 })}
        characters={characters}
        token="token"
        onClose={() => {}}
        onAddFriend={vi.fn()}
        onAddBlacklist={vi.fn()}
        onOpenReplay={() => {}}
      />
    );

    expect(screen.getByText("new-user")).toBeTruthy();
    request.resolve({
      profile: {
        id: "user-2",
        username: "stale-user",
        rating: 9999,
        mode: "standard",
        recordStats: { totalGames: 99, wins: 99, losses: 0, draws: 0 }
      }
    });

    await waitFor(() => expect(screen.queryByText("stale-user")).toBeNull());
    expect(screen.queryByText("9999分")).toBeNull();
    expect(screen.getByRole("tab", { name: "星炬" }).getAttribute("aria-selected")).toBe("true");
  });

  it("ignores an old social mutation after the viewed user changes", async () => {
    const request = deferred();
    api.mockReturnValueOnce(request.promise);
    const view = renderProfile();

    fireEvent.click(screen.getByRole("button", { name: "点赞 5" }));
    view.rerender(
      <UserProfileCard
        user={profileUser({ id: "user-3", username: "new-user", likeCount: 20 })}
        characters={characters}
        token="token"
        onClose={() => {}}
        onAddFriend={vi.fn()}
        onAddBlacklist={vi.fn()}
        onOpenReplay={() => {}}
      />
    );

    expect(screen.getByRole("button", { name: "点赞 20" }).disabled).toBe(false);
    request.resolve({ likeCount: 99, likedToday: true });

    await waitFor(() => expect(screen.queryByRole("button", { name: "已点赞 99" })).toBeNull());
    expect(screen.getByRole("button", { name: "点赞 20" }).disabled).toBe(false);
  });

  it("renders long identities and zero-data states without inventing records", () => {
    renderProfile({
      username: "一位名字非常非常长的学院成员",
      achievementEquipmentAssets: {
        nameplate: { imageUrl: "/assets/nameplate-long.png", name: "长用户名牌" }
      },
      recordStats: { totalGames: 0, wins: 0, losses: 0, draws: 0 },
      recentResults: [],
      characterStats: []
    });

    expect(screen.getByText("一位名字非常非常长的学院成员")).toBeTruthy();
    expect(document.querySelector(".user-identity-nameplate-background").getAttribute("style")).toContain("nameplate-long.png");
    expect(screen.getByText("0局")).toBeTruthy();
    expect(screen.getByText("0.0%")).toBeTruthy();
    expect(within(screen.getByLabelText("最近胜负")).getByText("暂无")).toBeTruthy();
    expect(screen.getByLabelText("角色战绩").textContent).toBe("暂无");
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("sorts multiple character rows while preserving the fixed semantic headers", () => {
    renderProfile({
      characterStats: [
        { characterId: "sigrika", total: 2, wins: 1, losses: 1, draws: 0 },
        { characterId: "aemeath", total: 8, wins: 6, losses: 1, draws: 1 }
      ]
    });

    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((header) => header.textContent)).toEqual(["", "对局", "胜", "负", "和", "胜率"]);
    expect(headers[0].getAttribute("aria-label")).toBe("角色");
    expect(screen.getAllByRole("rowheader").map((header) => header.textContent)).toEqual(["爱弥斯", "西格莉卡"]);
    expect(document.querySelectorAll(".profile-portrait-mask")).toHaveLength(3);
    expect(document.querySelectorAll(".profile-chain-portrait.small > .profile-portrait-mask > img")).toHaveLength(2);
  });

  it("opens the shared replay dialog as a standalone portal outside detailed profile", async () => {
    api.mockResolvedValueOnce({ records: [], nextCursor: null });
    renderProfile();

    const profileDialog = screen.getByRole("dialog", { name: "详细资料" });
    const replayTrigger = within(profileDialog).getByRole("button", { name: "对局回放" });
    replayTrigger.focus();
    fireEvent.click(replayTrigger);

    const replayDialog = await screen.findByRole("dialog", { name: "对局回放" });
    expect(replayDialog.classList.contains("nested-modal")).toBe(true);
    const replayPortalParent = document.querySelector(".standalone-replay-backdrop")?.parentElement;
    expect(replayPortalParent === document.body || replayPortalParent?.classList.contains("app-shell")).toBe(true);
    expect(profileDialog.contains(replayDialog)).toBe(false);

    fireEvent.click(within(replayDialog).getByRole("button", { name: "关闭对局回放" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "对局回放" })).toBeNull());
    expect(screen.getByRole("dialog", { name: "详细资料" })).toBeTruthy();
    expect(document.activeElement).toBe(replayTrigger);
  });
});

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
