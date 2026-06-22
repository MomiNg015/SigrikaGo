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
    expect(html).toContain("Gift");
    expect(html).toContain("Please claim it.");
    expect(html).toContain("2026");
    expect(html).toContain("30 金币");
    expect(html).toContain("领取附件");
    expect(html).toContain("disabled=\"\"");
  });
});
