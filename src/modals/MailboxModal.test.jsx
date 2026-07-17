// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/client.js";
import { readCssWithImports } from "../styles/cssTestUtils.js";
import MailboxModal from "./MailboxModal.jsx";

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
    render(<MailboxModal token="token" initialLoaded initialMessages={[giftMessage]} onClose={() => {}} />);

    expect(screen.getByRole("dialog", { name: "邮箱" })).toBeTruthy();
    const row = screen.getByRole("button", { name: /社团活动奖励/ });
    expect(row.closest("li")).toBeTruthy();
    expect(screen.getAllByText("发件人：学生会")).toHaveLength(2);
    expect(screen.getByText("请领取本周活动奖励。")).toBeTruthy();
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

  it("renders item attachments as item art, a player-facing name, and quantity", () => {
    const { container } = render(
      <MailboxModal token="token" initialLoaded initialMessages={[memorialTicketMessage]} onClose={() => {}} />
    );

    expect(screen.getByText("飞行雪绒纪念券")).toBeTruthy();
    expect(screen.getByText("x1")).toBeTruthy();
    expect(screen.queryByText(/aemeath-flight-snow-memorial-ticket/)).toBeNull();
    expect(container.querySelector(".mailbox-attachment-item-art img")?.getAttribute("src")).toBe(
      "/assets/items/aemeath-flight-snow-memorial-ticket.webp"
    );
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

  it("keeps the paper reader, compact status markers, 44px delete target, and vertical mobile list", () => {
    const css = readCssWithImports(pathToFileURL(resolve("src/styles/modals/mailbox.css")));
    const themedCss = readCssWithImports(pathToFileURL(resolve("src/styles/themes.css")));

    expect(css).toContain('background-image: url("/assets/mailbox/mail-body-paper.png")');
    expect(css).toContain("box-shadow: inset 4px 0 0 #ff6f9f");
    expect(css).toContain("width: 44px");
    expect(css).toContain("height: 44px");
    expect(css).toContain("overflow-x: hidden");
    expect(css).toContain("overflow-y: auto");
    expect(css).not.toContain("scroll-snap-type: x proximity");
    expect(css).not.toContain("flex: 0 0 clamp(142px, 44vw, 190px)");
    expect(css).toContain(".mailbox-modal .information-center-reader");
    expect(css).toContain("border: 0 !important");
    expect(css).toContain("box-shadow: none !important");
    expect(themedCss).toContain(".information-center-modal.mailbox-modal .information-center-header .information-center-close-button");
    expect(themedCss).toContain("position: static !important");
    expect(themedCss).toContain("inset: auto !important");
    expect(themedCss).toContain("align-self: center !important");
  });
});
