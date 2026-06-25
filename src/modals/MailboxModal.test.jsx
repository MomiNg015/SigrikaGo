import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MailboxModal from "./MailboxModal.jsx";

describe("MailboxModal", () => {
  it("renders mail details with sent time and disables delete for unclaimed attachments", () => {
    const html = renderToStaticMarkup(createElement(MailboxModal, {
      token: "token",
      initialMessages: [{
        id: "mail-1",
        title: "Gift",
        body: "Please claim it.",
        createdAt: "2026-06-22T12:00:00.000Z",
        isRead: false,
        claimable: true,
        deletable: false,
        attachment: { type: "coins", quantity: 30, claimed: false }
      }],
      initialLoaded: true,
      onClose: () => {},
      onNotice: () => {},
      onUserChange: () => {},
      onSummaryChange: () => {}
    }));

    expect(html).toContain("mailbox-modal");
    expect(html).not.toContain("MAILBOX");
    expect(html).toContain("Gift");
    expect(html).toContain("Please claim it.");
    expect(html).not.toContain("mailbox-body-card");
    expect(html).toContain("mailbox-detail-topline");
    expect(html).toContain("mailbox-delete-button");
    expect(html).not.toContain("secondary-action");
    expect(html).toContain("2026");
    expect(html).toContain("30 金币");
    expect(html).toContain("领取附件");
    expect(html).toContain("disabled=\"\"");
  });

  it("marks mail list rows by read and claim state", () => {
    const html = renderToStaticMarkup(createElement(MailboxModal, {
      token: "token",
      initialMessages: [
        {
          id: "mail-new",
          title: "New gift",
          body: "Unread",
          createdAt: "2026-06-22T12:00:00.000Z",
          isRead: false,
          claimable: true,
          deletable: false,
          attachment: { type: "coins", quantity: 30, claimed: false }
        },
        {
          id: "mail-claimable",
          title: "Read gift",
          body: "Read and claimable",
          createdAt: "2026-06-22T12:10:00.000Z",
          isRead: true,
          claimable: true,
          deletable: false,
          attachment: { type: "coins", quantity: 40, claimed: false }
        },
        {
          id: "mail-done",
          title: "Done gift",
          body: "Read and claimed",
          createdAt: "2026-06-22T12:20:00.000Z",
          isRead: true,
          claimable: false,
          deletable: true,
          attachment: { type: "coins", quantity: 50, claimed: true }
        }
      ],
      initialLoaded: true,
      onClose: () => {}
    }));

    expect(html).toContain("state-new");
    expect(html).toContain("state-claimable");
    expect(html).toContain("state-done");
    expect(html).toContain("已完成");
  });

  it("orders messages newest first for the horizontal mobile strip", () => {
    const html = renderToStaticMarkup(createElement(MailboxModal, {
      token: "token",
      initialMessages: [
        {
          id: "old",
          title: "old mail",
          body: "old",
          createdAt: "2026-06-22T12:00:00.000Z",
          isRead: true,
          claimable: false,
          deletable: true
        },
        {
          id: "new",
          title: "new mail",
          body: "new",
          createdAt: "2026-06-23T12:00:00.000Z",
          isRead: false,
          claimable: false,
          deletable: true
        }
      ],
      initialLoaded: true,
      onClose: () => {}
    }));

    expect(html.indexOf("new mail")).toBeLessThan(html.indexOf("old mail"));
    expect(html).toContain("<h3>new mail</h3>");
  });

  it("keeps mailbox status colors above Bright School button surfaces", () => {
    const css = readFileSync(new URL("../styles/modals/mailbox.css", import.meta.url), "utf8");

    expect(css).toContain(".mailbox-list-item.state-new");
    expect(css).toContain(".app-shell.player-theme-enabled.theme-bright-school .mailbox-modal .mailbox-list .mailbox-list-item.state-new");
    expect(css).toContain("background-color: #ffd4e5 !important");
    expect(css).toContain("background-color: #d3efcd !important");
    expect(css).toContain("background-color: #dfdddd !important");
  });

  it("keeps the mailbox close button in the title row", () => {
    const css = readFileSync(new URL("../styles/modals/mailbox.css", import.meta.url), "utf8");
    const mobileEntryCss = readFileSync(new URL("../styles/mobile-adaptive/bright-school-portrait.css", import.meta.url), "utf8");
    const mobileCss = readFileSync(new URL("../styles/mobile-adaptive/bright-school-portrait/mailbox-modal.css", import.meta.url), "utf8");

    expect(css).toContain(".mailbox-modal .mailbox-header .close-button");
    expect(css).toContain("position: static !important");
    expect(css).toContain("margin-left: auto");
    expect(mobileEntryCss).toContain('@import "./bright-school-portrait/mailbox-modal.css"');
    expect(mobileCss).toContain(".mailbox-modal .mailbox-header .close-button");
    expect(mobileCss).toContain("grid-template-columns: minmax(0, 1fr) var(--modal-close-size, 44px) !important");
    expect(mobileCss).toContain("inset: auto !important");
  });

  it("uses a covered paper background for the mail detail panel", () => {
    const css = readFileSync(new URL("../styles/modals/mailbox.css", import.meta.url), "utf8");

    expect(css).toContain(".mailbox-detail {");
    expect(css).toContain('background-image: url("/assets/mailbox/mail-body-paper.png")');
    expect(css).toContain("background-size: cover");
    expect(css).toContain("background-repeat: no-repeat");
    expect(css).toContain("border: 2px solid #6a4a3f");
    expect(css).toContain("height: min(720px, calc(100dvh - 40px))");
    expect(css).toContain("flex: 1 1 auto");
    expect(css).toContain("height: 100%");
    expect(css).toContain("overflow-y: auto");
    expect(css).toContain("overflow-x: hidden");
    expect(css).toContain(".mailbox-detail::before");
    expect(css).toContain("radial-gradient(ellipse at center, rgba(255, 250, 238, 0.3)");
    expect(css).toContain("-webkit-backdrop-filter: blur(2px) saturate(0.96)");
    expect(css).toContain("backdrop-filter: blur(2px) saturate(0.96)");
    expect(css).toContain("-webkit-mask-image: radial-gradient(ellipse at center");
    expect(css).toContain("mask-image: radial-gradient(ellipse at center");
    expect(css).toContain(".mailbox-detail > *");
    expect(css).toContain("box-shadow: 4px 5px 0 rgba(61, 43, 37, 0.24)");
    expect(css).toContain("box-shadow: 3px 4px 0 rgba(61, 43, 37, 0.22)");
    expect(css).toContain(".mailbox-delete-button");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 24px");
    expect(css).toContain("background-color: transparent");
    expect(css).toContain("width: 24px");
    expect(css).toContain("height: 24px");
    expect(css).toContain("width: 14px");
    expect(css).toContain("border-radius: 999px");
    expect(css).toContain("background: #ff6f9f !important");
    expect(css).toContain("background-image: none !important");
    expect(css).toContain(".mailbox-delete-button::before");
  });

  it("keeps the mobile mailbox as a horizontal list above the detail panel", () => {
    const css = readFileSync(new URL("../styles/modals/mailbox.css", import.meta.url), "utf8");
    const mobileCss = readFileSync(new URL("../styles/mobile-adaptive/bright-school-portrait/mailbox-modal.css", import.meta.url), "utf8");

    expect(css).toContain("grid-template-columns: minmax(0, 1fr)");
    expect(css).toContain("overflow-x: auto");
    expect(css).toContain("overflow-y: hidden");
    expect(css).toContain("scroll-snap-type: x proximity");
    expect(css).toContain("flex: 0 0 clamp(142px, 44vw, 190px)");
    expect(css).toContain("grid-template-rows: auto minmax(0, 1fr)");
    expect(css).toContain("max-height: none");
    expect(css).toContain(".mailbox-list-time");
    expect(css).toContain("white-space: nowrap");
    expect(mobileCss).toContain("grid-template-rows: auto minmax(0, 1fr) !important");
    expect(mobileCss).toContain("grid-template-columns: minmax(0, 1fr) !important");
    expect(mobileCss).toContain("overflow-x: auto !important");
    expect(mobileCss).toContain("flex: 0 0 clamp(142px, 44vw, 190px) !important");
    expect(mobileCss).toContain(".mailbox-modal .mailbox-list-time");
    expect(mobileCss).toContain("height: 100% !important");
    expect(mobileCss).toContain("max-height: none !important");
  });

  it("keeps the two-pane mailbox layout when there are no messages", () => {
    const html = renderToStaticMarkup(createElement(MailboxModal, {
      token: "token",
      initialMessages: [],
      initialLoaded: true,
      onClose: () => {}
    }));

    expect(html).toContain("mailbox-layout");
    expect(html).toContain("mailbox-list");
    expect(html).toContain("mailbox-list-empty");
    expect(html).toContain("暂无邮件");
    expect(html).toContain("mailbox-detail mailbox-detail-empty");
    expect(html).not.toContain("mailbox-empty");
  });
});
