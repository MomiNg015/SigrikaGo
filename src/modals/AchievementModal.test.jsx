import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AchievementModal from "./AchievementModal.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("AchievementModal", () => {
  it("selects unfinished achievements by default and uses the pink active tab style", () => {
    const html = renderToStaticMarkup(
      <AchievementModal token="token" onClose={vi.fn()} onNotice={vi.fn()} />
    );
    const modalCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/modals.css", import.meta.url));

    expect(html).toContain("未完成");
    expect(html).toContain("class=\"active\"");
    expect(html).toContain("aria-selected=\"true\"");
    expect(modalCss).toContain(".achievement-tabs button[aria-selected=\"true\"]");
    expect(modalCss).toContain("background: #ff9ebb;");
    expect(brightSchoolCss).toContain(".achievement-tabs button[aria-selected=\"true\"]");
    expect(brightSchoolCss).toContain("background: #ff9ebb !important");
  });
});
