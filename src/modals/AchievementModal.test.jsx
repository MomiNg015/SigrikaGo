import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import AchievementModal, { achievementTimePopoverPosition } from "./AchievementModal.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

describe("AchievementModal", () => {
  it("selects unfinished achievements by default and uses the pink active tab style", () => {
    const html = renderToStaticMarkup(
      <AchievementModal token="token" onClose={vi.fn()} onNotice={vi.fn()} />
    );
    const modalCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/modals.css", import.meta.url));
    const mobileAdaptiveCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(html).toContain("未完成");
    expect(html).toContain("class=\"active\"");
    expect(html).toContain("aria-selected=\"true\"");
    expect(html).toContain("成就名");
    expect(html).toContain("成就内容");
    expect(html).toContain("成就奖励");
    expect(html).not.toContain("达成时间</span></div>");
    expect(modalCss).toContain(".achievement-tabs button[aria-selected=\"true\"]");
    expect(modalCss).toContain("background: #ff9ebb;");
    expect(modalCss).toContain("margin-bottom: 10px;");
    expect(modalCss).toContain("grid-template-columns: minmax(120px, 0.95fr) minmax(210px, 1.6fr) minmax(150px, 1fr);");
    expect(modalCss).toContain(".achievement-time-popover");
    expect(modalCss).toContain("position: fixed;");
    expect(modalCss).toContain("animation: achievement-time-pop 150ms ease-out;");
    expect(brightSchoolCss).toContain(".achievement-tabs button[aria-selected=\"true\"]");
    expect(brightSchoolCss).toContain("background: #ff9ebb !important");
    expect(modalCss).toContain(".achievement-modal > .achievement-header");
    expect(modalCss).toContain(".personalization-modal > .achievement-header");
    expect(modalCss).toContain("grid-template-columns: minmax(0, 1fr) var(--modal-close-size, 44px);");
    expect(modalCss).toContain("position: static;");
    expect(modalCss).toContain("inset: auto;");
    expect(brightSchoolCss).toContain(".achievement-modal > .achievement-header .close-button");
    expect(brightSchoolCss).toContain("position: static !important");
    expect(brightSchoolCss).toContain("inset: auto !important");
    expect(mobileAdaptiveCss).toContain(".achievement-modal > .achievement-header");
    expect(mobileAdaptiveCss).toContain(".personalization-modal > .achievement-header");
    expect(mobileAdaptiveCss).toContain("grid-template-columns: minmax(0, 1fr) var(--modal-close-size, 44px) !important");
  });

  it("anchors the achieved-time popover to viewport coordinates without crossing the screen edge", () => {
    expect(achievementTimePopoverPosition({
      clientX: 6,
      clientY: 6,
      viewportWidth: 393,
      viewportHeight: 852
    })).toEqual({ left: 144, top: 58 });

    expect(achievementTimePopoverPosition({
      clientX: 390,
      clientY: 850,
      viewportWidth: 393,
      viewportHeight: 852
    })).toEqual({ left: 249, top: 838 });
  });
});
