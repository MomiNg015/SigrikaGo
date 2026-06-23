import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminReports from "./AdminReports.jsx";
import AdminShell, { ADMIN_TABS, ADMIN_TAB_LABELS } from "./AdminShell.jsx";

describe("AdminShell", () => {
  it("renders all admin tabs with the active tab title", () => {
    const html = renderToStaticMarkup(
      <AdminShell user={{ username: "admin" }} tab="shop" setTab={vi.fn()} onBack={vi.fn()}>
        <p>content</p>
      </AdminShell>
    );

    for (const tab of ADMIN_TABS) {
      expect(html).toContain(ADMIN_TAB_LABELS[tab]);
    }
    expect(ADMIN_TABS).toContain("music");
    expect(ADMIN_TABS).toContain("mailbox");
    expect(ADMIN_TABS).toContain("reports");
    expect(html).toContain("admin");
    expect(html).toContain("商城管理");
    expect(html).toContain("音乐管理");
    expect(html).toContain("邮箱管理");
    expect(html).toContain("用户举报");
    expect(html).toContain("content");
  });

  it("renders user reports for admins", () => {
    const html = renderToStaticMarkup(
      <AdminReports reports={[{
        id: "report-1",
        reporterUsername: "alice",
        reportedUsername: "bob",
        content: "bad behavior",
        createdAt: "2026-06-19T00:00:00.000Z"
      }]} />
    );

    expect(html).toContain("用户举报");
    expect(html).toContain("alice");
    expect(html).toContain("bob");
    expect(html).toContain("bad behavior");
  });

  it("calls setTab and onBack from shell controls", () => {
    const setTab = vi.fn();
    const onBack = vi.fn();
    const element = AdminShell({
      user: { username: "admin" },
      tab: "overview",
      setTab,
      onBack,
      children: null
    });
    const aside = element.props.children[0];
    const tabButtons = aside.props.children[1];
    const usersButton = tabButtons[1];
    const backButton = aside.props.children[2];

    usersButton.props.onClick();
    backButton.props.onClick();

    expect(setTab).toHaveBeenCalledWith("users");
    expect(onBack).toHaveBeenCalledOnce();
  });
});
