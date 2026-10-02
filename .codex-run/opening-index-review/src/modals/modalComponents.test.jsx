import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ModalDialog } from "./modalComponents.jsx";

describe("ModalDialog", () => {
  it("provides consistent dialog semantics without changing the surface element", () => {
    const html = renderToStaticMarkup(createElement(ModalDialog, {
      className: "existing-modal",
      ariaLabel: "测试窗口",
      onClose: () => {}
    }, createElement("button", { type: "button" }, "关闭")));

    expect(html).toContain("<section");
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="测试窗口"');
    expect(html).toContain('tabindex="-1"');
  });
});
