import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AdminReports from "./AdminReports.jsx";
import AdminOperations from "./AdminOperations.jsx";
import AdminOverview from "./AdminOverview.jsx";
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
    expect(ADMIN_TABS).toContain("operations");
    expect(ADMIN_TABS).toContain("reports");
    expect(html).toContain("admin");
    expect(html).toContain("商城管理");
    expect(html).toContain("音乐管理");
    expect(html).toContain("邮箱管理");
    expect(html).toContain("运营分析");
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
    const usersButton = tabButtons[2];
    const backButton = aside.props.children[2];

    usersButton.props.onClick();
    backButton.props.onClick();

    expect(setTab).toHaveBeenCalledWith("users");
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("renders readable admin overview brief instead of a dense first table", () => {
    const html = renderToStaticMarkup(
      <AdminOverview
        data={{
          generatedAt: "2026-06-23T00:00:00.000Z",
          brief: {
            status: "需要关注",
            reasons: ["今日活跃正常"],
            sections: {
              needsAction: [],
              watch: [{ title: "首局转化偏低", body: "需要查看新用户", actionLabel: "查看用户", actionTab: "users" }],
              normal: [{ title: "在线与对局概况", body: "当前 2 人在线" }]
            }
          },
          realtime: { onlineCount: 2, activeRooms: 1, matchmakingCount: 0, onlineUsers: [] },
          today: {
            logins: { uniqueUsers: 2 },
            registrations: { users: 1, firstGameConversionRate: 0 },
            games: { completed: 3, byMode: [{ mode: "spark", label: "星炬", completed: 3, invalid: 0, averageMoveCount: 40, interruptedStatus: "待接入" }] },
            durationLeaders: []
          },
          alerts: { reportsPending: 0, feedbackPending: 0 },
          serviceHealth: {
            socketConnections: 2,
            activeRooms: 1,
            matchingQueue: 0,
            persistedActiveRooms: 1,
            reconnectsToday: 4,
            preloadTimeoutsToday: 1,
            apiErrorsToday: 0
          }
        }}
      />
    );

    expect(html).toContain("今日简报");
    expect(html).toContain("今日状态：需要关注");
    expect(html).toContain("现在在线");
    expect(html).toContain("首局转化偏低");
    expect(html).toContain("重连恢复请求");
    expect(html).toContain("预加载超时");
    expect(html).toContain("运行错误计数");
    expect(html).not.toContain("admin-table");
  });

  it("renders operations analysis with insight-first chart support", () => {
    const html = renderToStaticMarkup(
      <AdminOperations
        range="7d"
        onRangeChange={vi.fn()}
        data={{
          insights: {
            needsAction: [],
            watch: [],
            normal: [{ title: "活跃趋势正常", body: "今日活跃正常" }]
          },
          charts: {
            activeUsers: [{ key: "2026-06-23", label: "06-23", value: 2 }],
            registrations: [{ key: "2026-06-23", label: "06-23", value: 1 }],
            games: [{ key: "2026-06-23", label: "06-23", value: 3 }],
            modeTotals: [{ mode: "spark", label: "星炬", completed: 3, averageMoveCount: 40, invalid: 0 }]
          },
          segments: [{ key: "active", label: "活跃玩家", count: 2 }],
          economy: { coinDelta: 20, gachaDraws: 1, recruitmentStarted: 1, status: "可用" }
        }}
      />
    );

    expect(html).toContain("先看结论，再看图表");
    expect(html).toContain("活跃趋势正常");
    expect(html).toContain("活跃用户");
    expect(html).toContain("玩家分层");
  });
});
