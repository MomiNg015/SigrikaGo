// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AnnouncementModal from "./AnnouncementModal.jsx";
import { useAnnouncementSummary } from "../app/useAnnouncementSummary.js";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const fixtureUser = { id: "fixture-user" };

function AnnouncementHarness({ onNotice }) {
  const { announcementSummary } = useAnnouncementSummary({
    announcementOpen: true, token: "fixture-token", user: fixtureUser, view: "home"
  });
  return <AnnouncementModal token="fixture-token" unreadByKind={announcementSummary.unreadByKind}
    onNotice={onNotice} onClose={() => {}} />;
}

describe("announcement first-open real client flow", () => {
  it.each(["none", "list", "detail", "summary"])("loads first open and reopen with %s outage", async (outage) => {
    const counts = { list: 0, detail: 0, summary: 0, read: 0 };
    const item = { id: "notice-1", kind: "announcement", title: "本地公告", isUnread: true };
    vi.stubGlobal("fetch", vi.fn(async (path, options) => {
      const type = path.includes("/summary") ? "summary" : path.endsWith("/read") ? "read"
        : path.includes("?") ? "list" : "detail";
      counts[type] += 1;
      expect(options.headers.Authorization).toBe("Bearer fixture-token");
      if (type === outage && counts[type] === 1) {
        return Response.json({ error: "本地后端服务正在启动或重启，请稍后重试。", code: "dev_backend_unavailable" }, { status: 503 });
      }
      if (type === "list") return Response.json({ items: [item] });
      if (type === "detail") return Response.json({ entry: { ...item, body: "本地公告正文" } });
      if (type === "read") return Response.json({ summary: { hasUnread: false } });
      return Response.json({ hasUnread: true });
    }));
    const onNotice = vi.fn();
    const first = render(<AnnouncementHarness onNotice={onNotice} />);
    expect(await screen.findByText("本地公告正文")).toBeTruthy();
    await waitFor(() => expect(counts.read).toBe(1));
    await waitFor(() => expect(counts.summary).toBe(outage === "summary" ? 2 : 1));
    expect(onNotice).not.toHaveBeenCalled();
    first.unmount();
    render(<AnnouncementHarness onNotice={onNotice} />);
    expect(await screen.findByText("本地公告正文")).toBeTruthy();
    await waitFor(() => expect(counts.read).toBe(2));
    expect(counts.list).toBe(outage === "list" ? 3 : 2);
    expect(counts.detail).toBe(outage === "detail" ? 3 : 2);
    expect(onNotice).not.toHaveBeenCalled();
  });
});
