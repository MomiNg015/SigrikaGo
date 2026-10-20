import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ConfirmModal, limitToastQueue, duelProgressPercent, secondsUntilDuelRequestExpires } from "./FeedbackModals.jsx";

describe("FeedbackModals helpers", () => {
  it("clamps duel request countdown seconds", () => {
    expect(secondsUntilDuelRequestExpires(21_000, 1_000)).toBe(20);
    expect(secondsUntilDuelRequestExpires(500, 1_000)).toBe(0);
  });

  it("formats duel request progress percent", () => {
    expect(duelProgressPercent(20)).toBe("100%");
    expect(duelProgressPercent(10)).toBe("50%");
    expect(duelProgressPercent(-1)).toBe("0%");
    expect(duelProgressPercent(30)).toBe("100%");
  });

  it("uses semantic rating typography for challenger rating but not the duel countdown", () => {
    const source = readFileSync(new URL("./FeedbackModals.jsx", import.meta.url), "utf8");

    expect(source).toContain('<RankProgress {...request.from} />');
    expect(source).toContain("<b>{seconds}s</b>");
  });

  it("keeps newest toasts at the top of the queue", () => {
    const queued = limitToastQueue([
      { id: 3, text: "third" },
      { id: 2, text: "second" },
      { id: 1, text: "first" }
    ], 2);

    expect(queued).toEqual([
      { id: 3, text: "third" },
      { id: 2, text: "second" }
    ]);
  });

  it("adds the corrupted duel atmosphere layer only when explicitly requested", () => {
    const props = {
      title: "退出房间",
      message: "是否认输并退出房间？",
      confirmText: "认输并退出",
      onConfirm: () => {},
      onCancel: () => {}
    };
    const specialMarkup = renderToStaticMarkup(createElement(ConfirmModal, {
      ...props,
      atmosphere: "sigrika-duel"
    }));
    const ordinaryMarkup = renderToStaticMarkup(createElement(ConfirmModal, props));

    expect(specialMarkup).toContain("sigrika-duel-confirm-modal");
    expect(specialMarkup).toContain("sigrika-duel-modal-atmosphere");
    expect(ordinaryMarkup).not.toContain("sigrika-duel-confirm-modal");
    expect(ordinaryMarkup).not.toContain("sigrika-duel-modal-atmosphere");
  });

  it("uses the selected paper drawer, LXGW font and horizontal motion for every tone", () => {
    const css = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const source = readFileSync(new URL("./FeedbackModals.jsx", import.meta.url), "utf8");
    const reducedMotionCss = readFileSync(
      new URL("../styles/themes/bright-school/effects/reduced-motion.css", import.meta.url),
      "utf8"
    );
    expect(css).toContain(".toast.success,");
    expect(css).toContain(".toast.mail");
    expect(css).toContain("font-family: var(--font-window-title), var(--font-ui-default)");
    expect(css).toContain("left: max(12px, env(safe-area-inset-left))");
    expect(css).not.toContain(".toast.reward");
    expect(css).not.toContain(".toast.penalty");
    expect(css).toContain('.toast[data-exiting="true"]');
    expect(css).toContain("opacity 400ms ease");
    expect(css).toContain("@starting-style");
    expect(css).toContain("translateX(calc(-100% - max(12px, env(safe-area-inset-left))))");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).not.toContain("@keyframes toast-fade");
    expect(source).toContain("data-exiting={exiting || undefined}");
    expect(reducedMotionCss).toContain(":not(.toast-lifetime > span)");
    expect(reducedMotionCss).toContain("transition: opacity 400ms ease");
    expect(reducedMotionCss).toContain("transform: none");
    for (const path of ["../styles/mobile-adaptive/reduced-motion.css", "../styles/themes/bright-school/mobile/motion.css"]) {
      expect(readFileSync(new URL(path, import.meta.url), "utf8")).toContain(":not(.toast):not(.toast-lifetime > span)");
    }
  });
});

function readCssWithImports(url, seen = new Set()) {
  const key = url.href;
  if (seen.has(key)) return "";
  seen.add(key);

  const css = readFileSync(url, "utf8");
  return css.replace(/@import\s+"([^"]+)";/g, (_match, importPath) => {
    return readCssWithImports(new URL(importPath, url), seen);
  });
}
