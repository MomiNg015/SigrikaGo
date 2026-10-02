import React from "react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ModalActionButton } from "./modalComponents.jsx";

describe("ModalActionButton", () => {
  it("maps semantic modal variants onto existing visual action classes", () => {
    const html = renderToStaticMarkup(
      <>
        <ModalActionButton variant="primary" type="submit">确认</ModalActionButton>
        <ModalActionButton variant="secondary" type="button">取消</ModalActionButton>
        <ModalActionButton variant="danger" type="button">删除</ModalActionButton>
      </>
    );

    expect(html).toContain("primary-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
    expect(html).toContain("secondary-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
    expect(html).toContain("danger-action tw:inline-flex tw:items-center tw:justify-center tw:gap-2");
  });

  it("keeps FeedbackModals confirm actions off raw action class strings", () => {
    const source = readFileSync(new URL("./FeedbackModals.jsx", import.meta.url), "utf8");

    expect(source).toContain("ModalActionButton");
    expect(source).not.toContain('className="danger-action"');
    expect(source).not.toContain('className="secondary-action"');
  });

  it("keeps MessageBoardModal submit action on the modal action wrapper", () => {
    const source = readFileSync(new URL("./MessageBoardModal.jsx", import.meta.url), "utf8");

    expect(source).toContain("ModalActionButton");
    expect(source).not.toContain('className="primary-action"');
  });

  it("keeps AnnouncementModal simple secondary actions on the modal action wrapper", () => {
    const source = readFileSync(new URL("./AnnouncementModal.jsx", import.meta.url), "utf8");

    expect(source).toContain("ModalActionButton");
    expect(source).toContain('variant="secondary"');
    expect(source).toContain('className="announcement-load-more"');
    expect(source).not.toContain('className="secondary-action"');
    expect(source).not.toContain('className="secondary-action announcement-load-more"');
  });

  it("keeps PersonalizationModal save action on the modal action wrapper", () => {
    const source = readFileSync(new URL("./PersonalizationModal.jsx", import.meta.url), "utf8");

    expect(source).toContain("ModalActionButton");
    expect(source).toContain('variant="primary"');
    expect(source).not.toContain('className="primary-action"');
  });

  it("keeps MailboxModal attachment claim action on the modal action wrapper", () => {
    const source = readFileSync(new URL("./MailboxModal.jsx", import.meta.url), "utf8");

    expect(source).toContain("ModalActionButton");
    expect(source).toContain('variant="primary"');
    expect(source).not.toContain('className="primary-action"');
  });

  it("keeps FriendsOverlays duel-mode cancel action on the modal action wrapper", () => {
    const source = readFileSync(new URL("./friends/FriendsOverlays.jsx", import.meta.url), "utf8");

    expect(source).toContain("ModalActionButton");
    expect(source).toContain('variant="secondary"');
    expect(source).not.toContain('className="secondary-action"');
  });

  it("keeps UserProfileCard report submit action on the modal action wrapper", () => {
    const source = readFileSync(new URL("./UserProfileCard.jsx", import.meta.url), "utf8");

    expect(source).toContain("ModalActionButton");
    expect(source).toContain('variant="danger"');
    expect(source).not.toContain('<button className="danger-action" type="submit"');
  });
});
