import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AdminMailbox from "./AdminMailbox.jsx";

describe("AdminMailbox", () => {
  it("renders compose controls and recent send history", () => {
    const html = renderToStaticMarkup(
      <AdminMailbox
        token="token"
        initialLoaded
        initialBatches={[{
          id: "batch-1",
          adminUsername: "admin",
          targetMode: "all_with_future",
          title: "Launch",
          attachment: { type: "coins", quantity: 20 },
          deliveredCount: 10,
          skippedCount: 1,
          includeFutureUsers: true,
          createdAt: "2026-06-22T12:00:00.000Z"
        }]}
        initialDraft={{
          targetMode: "user",
          recipientUserId: "",
          title: "",
          body: "",
          attachmentType: "item",
          attachmentItemId: "",
          attachmentQuantity: "1"
        }}
        shopItems={[{ id: "shop-1", category: "item", targetId: "dream-ticket", name: "Dream Ticket" }]}
        onNotice={() => {}}
      />
    );

    expect(html).toContain("admin-mailbox");
    expect(html).toContain("指定用户");
    expect(html).toContain("当前全体");
    expect(html).toContain("包含未来用户");
    expect(html).toContain("Dream Ticket");
    expect(html).toContain("Launch");
    expect(html).toContain("成功 10");
    expect(html).toContain("跳过 1");
  });
});
