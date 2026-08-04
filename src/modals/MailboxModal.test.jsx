// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import { readCssWithImports } from "../styles/cssTestUtils.js";
import MailboxModal, { formatMailboxListTime, mailboxMessageIsDone } from "./MailboxModal.jsx";

vi.mock("../api/client.js", () => ({ api: vi.fn() }));

const giftMessage = {
  id: "mail-1",
  sender: "学生会",
  title: "社团活动奖励",
  body: "请领取本周活动奖励。",
  createdAt: "2026-06-22T12:00:00.000Z",
  isRead: false,
  claimable: true,
  deletable: false,
  attachment: { type: "coins", quantity: 30, claimed: false }
};

const memorialTicketMessage = {
  ...giftMessage,
  id: "mail-ticket",
  sender: "飞行雪绒歌友会",
  title: "飞行雪绒演唱会纪念奖品",
  isRead: true,
  attachment: {
    type: "item",
    itemId: "aemeath-flight-snow-memorial-ticket",
    itemName: "飞行雪绒纪念券",
    itemDescription: "从飞行雪绒歌友会那里收到的特殊的奖品。上面的儿童画是怎么一回事呢？",
    imageUrl: "/assets/items/aemeath-flight-snow-memorial-ticket.webp",
    quantity: 1,
    claimed: false
  }
};

describe("MailboxModal information center", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    api.mockReset();
  });

  it("automatically opens the newest mail, marks it read, and keeps list buttons semantic", async () => {
    const readMessage = { ...giftMessage, isRead: true };
    api.mockImplementation((path) => {
      if (path === "/api/mailbox/mail-1/read") return Promise.resolve({});
      if (path === "/api/mailbox") return Promise.resolve({ messages: [readMessage] });
      throw new Error(`Unexpected api call: ${path}`);
    });
    const { container } = render(<MailboxModal token="token" initialLoaded initialMessages={[giftMessage]} onClose={() => {}} />);

    expect(screen.getByRole("dialog", { name: "邮箱" })).toBeTruthy();
    expect(container.querySelector(".information-center-header p")).toBeNull();
    const row = screen.getByRole("button", { name: /社团活动奖励/ });
    expect(row.closest("li")).toBeTruthy();
    expect(screen.getAllByText("学生会")).toHaveLength(2);
    expect(screen.getByText("请领取本周活动奖励。")).toBeTruthy();
    expect(screen.queryByText("纯文本邮件")).toBeNull();
    await waitFor(() => expect(api).toHaveBeenCalledWith(
      "/api/mailbox/mail-1/read",
      { method: "POST", token: "token" }
    ));
  });

  it("opens an explicitly selected mail, marks it read, and preserves its detail after refresh", async () => {
    const user = userEvent.setup();
    const readMessage = { ...giftMessage, isRead: true };
    api.mockImplementation((path) => {
      if (path === "/api/mailbox/mail-1/read") return Promise.resolve({});
      if (path === "/api/mailbox") return Promise.resolve({ messages: [readMessage] });
      throw new Error(`Unexpected api call: ${path}`);
    });
    render(<MailboxModal token="token" initialLoaded initialMessages={[giftMessage]} onClose={() => {}} />);

    expect(screen.getByText("请领取本周活动奖励。")).toBeTruthy();
    await waitFor(() => expect(api).toHaveBeenCalledWith(
      "/api/mailbox/mail-1/read",
      { method: "POST", token: "token" }
    ));
    expect(screen.getByRole("button", { name: /社团活动奖励/ }).getAttribute("aria-current")).toBe("true");
  });

  it("claims an attachment, then deletes the updated mail and clears the reader", async () => {
    const user = userEvent.setup();
    const claimedMessage = {
      ...giftMessage,
      isRead: true,
      claimable: false,
      deletable: true,
      attachment: { ...giftMessage.attachment, claimed: true }
    };
    let refreshCount = 0;
    api.mockImplementation((path) => {
      if (path === "/api/mailbox/mail-1/read") return Promise.resolve({});
      if (path === "/api/mailbox/mail-1/claim") return Promise.resolve({ user: { id: "user-1" } });
      if (path === "/api/mailbox/mail-1") return Promise.resolve({});
      if (path === "/api/mailbox") {
        refreshCount += 1;
        return Promise.resolve({ messages: refreshCount < 2 ? [claimedMessage] : [] });
      }
      throw new Error(`Unexpected api call: ${path}`);
    });
    render(<MailboxModal token="token" initialLoaded initialMessages={[{ ...giftMessage, isRead: true }]} onClose={() => {}} />);

    await user.click(screen.getByRole("button", { name: "领取附件" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "删除邮件" }).disabled).toBe(false));
    await user.click(screen.getByRole("button", { name: "删除邮件" }));
    await waitFor(() => expect(screen.getAllByText("这里空空如也~").length).toBeGreaterThan(0));
  });

  it("keeps the list text-only and dims only messages that are fully handled", () => {
    const plainRead = {
      ...giftMessage,
      id: "plain-read",
      title: "已阅读通知",
      createdAt: "2026-06-24T12:00:00.000Z",
      isRead: true,
      claimable: false,
      deletable: true,
      attachment: { type: "none" }
    };
    const readClaimable = {
      ...giftMessage,
      id: "read-claimable",
      title: "仍待领取",
      createdAt: "2026-06-23T12:00:00.000Z",
      isRead: true
    };
    const { container } = render(
      <MailboxModal token="" initialLoaded initialMessages={[plainRead, readClaimable]} onClose={() => {}} />
    );

    expect(mailboxMessageIsDone(plainRead)).toBe(true);
    expect(mailboxMessageIsDone(readClaimable)).toBe(false);
    expect(screen.getByRole("button", { name: /已阅读通知.*已完成/ }).classList.contains("state-done")).toBe(true);
    expect(screen.getByRole("button", { name: /仍待领取.*待领取/ }).classList.contains("state-done")).toBe(false);
    expect(container.querySelector(".mailbox-unread-dot")).toBeNull();
    expect(container.querySelector(".mailbox-list-status")).toBeNull();
    expect(container.querySelector(".mailbox-list-item img")).toBeNull();
  });

  it("formats recent list dates relatively and older mail as a compact local date", () => {
    const now = new Date("2026-08-04T12:00:00.000Z");

    expect(formatMailboxListTime("2026-08-04T11:59:40.000Z", now)).toBe("刚刚");
    expect(formatMailboxListTime("2026-08-04T11:42:00.000Z", now)).toBe("18分钟前");
    expect(formatMailboxListTime("2026-08-04T08:00:00.000Z", now)).toBe("4小时前");
    expect(formatMailboxListTime("2026-08-02T12:00:00.000Z", now)).toBe("2天前");
    expect(formatMailboxListTime("2026-07-20T12:00:00.000Z", now)).toMatch(/^2026\/07\/20$/);
    expect(formatMailboxListTime("not-a-date", now)).toBe("not-a-date");
  });

  it("opens a shop-style item detail dialog and restores focus after nested Escape", async () => {
    const user = userEvent.setup();
    const message = {
      ...memorialTicketMessage,
      attachment: { ...memorialTicketMessage.attachment, quantity: 2 }
    };
    const { container } = render(
      <MailboxModal
        token=""
        user={{ ownedItems: [{ itemId: "aemeath-flight-snow-memorial-ticket", quantity: 4 }] }}
        initialLoaded
        initialMessages={[message]}
        onClose={() => {}}
      />
    );

    const attachmentButton = screen.getByRole("button", { name: /查看道具详情：飞行雪绒纪念券.*数量 2/ });
    expect(container.querySelector(".mailbox-attachment-quantity-badge")?.textContent).toBe("2");
    expect(screen.queryByText(/aemeath-flight-snow-memorial-ticket/)).toBeNull();
    expect(container.querySelector(".mailbox-attachment-icon img")?.getAttribute("src")).toBe(
      "/assets/items/aemeath-flight-snow-memorial-ticket.webp"
    );

    await user.click(attachmentButton);
    expect(screen.getByRole("dialog", { name: "道具详情：飞行雪绒纪念券" })).toBeTruthy();
    expect(screen.getByText("从飞行雪绒歌友会那里收到的特殊的奖品。上面的儿童画是怎么一回事呢？")).toBeTruthy();
    expect(screen.getByText("拥有 4")).toBeTruthy();
    expect(screen.getByText("本封附件 ×2")).toBeTruthy();
    expect(screen.getByText("待领取")).toBeTruthy();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "道具详情：飞行雪绒纪念券" })).toBeNull();
    expect(screen.getByRole("dialog", { name: "邮箱" })).toBeTruthy();
    await waitFor(() => expect(document.activeElement).toBe(attachmentButton));
  });

  it("renders coin attachments as non-interactive tiles", () => {
    render(<MailboxModal token="" initialLoaded initialMessages={[giftMessage]} onClose={() => {}} />);

    expect(screen.getByRole("img", { name: "金币附件，数量 30，待领取" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /金币附件/ })).toBeNull();
  });

  it("keeps a claimed attachment action visibly gray in every interaction state", () => {
    const css = readCssWithImports(pathToFileURL(resolve("src/styles/modals/mailbox.css")));
    const claimedMessage = {
      ...memorialTicketMessage,
      claimable: false,
      deletable: true,
      attachment: { ...memorialTicketMessage.attachment, claimed: true }
    };
    render(<MailboxModal token="token" initialLoaded initialMessages={[claimedMessage]} onClose={() => {}} />);

    expect(screen.getByRole("button", { name: "已领取" }).disabled).toBe(true);
    expect(document.querySelector(".mailbox-attachment-claimed-mark")).toBeTruthy();
    expect(css).toContain(".mailbox-detail .mailbox-claim-button:disabled");
    expect(css).toContain("cursor: not-allowed");
  });

  it("keeps mobile list-first and does not auto-open or mark the newest mail read", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })));
    render(<MailboxModal token="token" initialLoaded initialMessages={[giftMessage]} onClose={() => {}} />);

    expect(screen.getByRole("button", { name: /社团活动奖励/ })).toBeTruthy();
    expect(screen.queryByText("请领取本周活动奖励。")).toBeNull();
    expect(api).not.toHaveBeenCalled();
  });

  it("keeps the quiet paper reader, text-only list, stable attachment stage, and mobile safety", () => {
    const css = readCssWithImports(pathToFileURL(resolve("src/styles/modals/mailbox.css")));
    const themedCss = readCssWithImports(pathToFileURL(resolve("src/styles/themes.css")));

    expect(css).not.toContain('url("/assets/mailbox/mail-body-paper.png")');
    expect(css).toContain('url("/assets/mailbox/mail-body-paper-natural.webp")');
    expect(css).toContain("var(--theme-bg)");
    expect(css).toContain(".mailbox-detail-header");
    expect(css).toContain(".mailbox-detail-meta");
    expect(css).toContain(".mailbox-attachment-shelf");
    expect(css).not.toContain("backdrop-filter: blur(2px)");
    expect(css).not.toContain("inset 4px 0 0");
    expect(css).not.toContain(".mailbox-list-status");
    expect(css).toContain(".mailbox-list-item.active");
    expect(css).toContain("border: 1px solid");
    expect(css).toContain(".mailbox-attachment-quantity-badge");
    expect(css).toContain(".mailbox-attachment-claimed-mark");
    expect(css).toContain("width: 44px");
    expect(css).toContain("height: 44px");
    expect(css).toContain("overflow-x: hidden");
    expect(css).toContain("overflow-y: auto");
    expect(css).not.toContain("scroll-snap-type: x proximity");
    expect(css).not.toContain("flex: 0 0 clamp(142px, 44vw, 190px)");
    expect(css).toContain(".mailbox-modal .information-center-reader");
    expect(css).toContain("border: 0 !important");
    expect(css).toContain("box-shadow: none !important");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(themedCss).toContain(".information-center-modal.mailbox-modal .information-center-header .information-center-close-button");
    expect(themedCss).toContain("position: static !important");
    expect(themedCss).toContain("inset: auto !important");
    expect(themedCss).toContain("align-self: center !important");
  });
});
