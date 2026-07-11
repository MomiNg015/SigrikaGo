// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import { readCssWithImports } from "../styles/cssTestUtils.js";
import AnnouncementModal from "./AnnouncementModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

const announcementItem = {
  id: "announcement-1",
  kind: "announcement",
  title: "欢迎来到星炬学院",
  firstPublishedAt: "2026-06-28T03:32:00.000Z",
  pinned: true,
  isUnread: true
};

const changelogItem = {
  ...announcementItem,
  id: "changelog-1",
  kind: "changelog",
  title: "版本更新笔记",
  pinned: false
};

describe("AnnouncementModal information center", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    api.mockReset();
    api.mockImplementation((path, options) => {
      if (path === "/api/announcements?kind=announcement&offset=0&limit=20") {
        return Promise.resolve({ items: [announcementItem], nextOffset: 1, hasMore: false });
      }
      if (path === "/api/announcements?kind=changelog&offset=0&limit=20") {
        return Promise.resolve({ items: [changelogItem], nextOffset: 1, hasMore: false });
      }
      if (path === "/api/announcements/announcement-1" && !options?.method) {
        return Promise.resolve({ entry: { ...announcementItem, body: "完整公告正文", updatedAt: "2026-06-28T04:00:00.000Z" } });
      }
      if (path === "/api/announcements/changelog-1" && !options?.method) {
        return Promise.resolve({ entry: { ...changelogItem, body: "完整更新正文", updatedAt: "2026-06-28T04:00:00.000Z" } });
      }
      if (path === "/api/announcements/announcement-1/read" || path === "/api/announcements/changelog-1/read") {
        return Promise.resolve({ summary: { announcement: false, changelog: false } });
      }
      throw new Error(`Unexpected api call: ${path}`);
    });
  });

  it("automatically opens and marks the newest announcement as read", async () => {
    const onSummaryChange = vi.fn();
    render(<AnnouncementModal token="token" onClose={() => {}} onSummaryChange={onSummaryChange} />);

    expect(screen.getByRole("dialog", { name: "公告中心" })).toBeTruthy();
    const row = await screen.findByRole("button", { name: /欢迎来到星炬学院/ });
    expect(row.closest("li")).toBeTruthy();
    expect(await screen.findByText("完整公告正文")).toBeTruthy();
    await waitFor(() => expect(api).toHaveBeenCalledWith(
      "/api/announcements/announcement-1/read",
      { method: "POST", token: "token" }
    ));
    expect(onSummaryChange).toHaveBeenCalledWith({ announcement: false, changelog: false });
    expect(screen.getByRole("button", { name: /欢迎来到星炬学院/ }).getAttribute("aria-current")).toBe("true");
  });

  it("supports roving keyboard navigation and opens the newest changelog", async () => {
    const user = userEvent.setup();
    render(<AnnouncementModal token="token" onClose={() => {}} />);

    const tabs = await screen.findByRole("tablist", { name: "公告中心" });
    const announcementTab = within(tabs).getByRole("tab", { name: "公告" });
    announcementTab.focus();
    await user.keyboard("{ArrowRight}");

    expect(within(tabs).getByRole("tab", { name: "更新日志" }).getAttribute("aria-selected")).toBe("true");
    expect(await screen.findByText("完整更新正文")).toBeTruthy();
    expect(api).toHaveBeenCalledWith(
      "/api/announcements/changelog-1/read",
      { method: "POST", token: "token" }
    );
  });

  it("uses the shared friendly empty state when a kind has no entries", async () => {
    api.mockImplementation((path) => {
      if (path === "/api/announcements?kind=announcement&offset=0&limit=20") {
        return Promise.resolve({ items: [], nextOffset: 0, hasMore: false });
      }
      throw new Error(`Unexpected api call: ${path}`);
    });
    render(<AnnouncementModal token="token" onClose={() => {}} />);

    expect((await screen.findAllByText("这里空空如也~")).length).toBeGreaterThan(0);
  });

  it("keeps mobile list-first and does not auto-open the newest announcement", async () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })));
    render(<AnnouncementModal token="token" onClose={() => {}} />);

    expect(await screen.findByRole("button", { name: /欢迎来到星炬学院/ })).toBeTruthy();
    expect(screen.queryByText("完整公告正文")).toBeNull();
    expect(api.mock.calls.some(([path]) => path.endsWith("/read"))).toBe(false);
  });

  it("uses shared master-detail CSS instead of a nested detail modal contract", () => {
    const css = readCssWithImports(pathToFileURL(resolve("src/styles/modals.css")));
    const themedCss = readCssWithImports(pathToFileURL(resolve("src/styles/themes.css")));
    const source = AnnouncementModal.toString();

    expect(css).toContain("grid-template-columns: minmax(288px, 312px) minmax(0, 1fr)");
    expect(themedCss).toContain('.information-center-modal[data-mobile-view="detail"] .information-center-reader');
    expect(themedCss).toContain("opacity 260ms cubic-bezier(0.22, 1, 0.36, 1)");
    expect(themedCss).toContain("transform 260ms cubic-bezier(0.22, 1, 0.36, 1)");
    expect(themedCss).toContain("transform: translateX(10px)");
    expect(themedCss).toContain("transform: translateX(-8px)");
    expect(themedCss).toContain(".announcement-modal .information-center-empty-reader");
    expect(themedCss).toContain("visibility: hidden !important");
    expect(themedCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).not.toContain(".announcement-detail-backdrop");
    expect(source).not.toContain('role: "listitem"');
  });
});
