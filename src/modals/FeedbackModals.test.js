import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { limitToastQueue, duelProgressPercent, secondsUntilDuelRequestExpires } from "./FeedbackModals.jsx";

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

    expect(source).toContain('<span className="text-rating-value">{request.from.rating}分</span>');
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

  it("keeps toast styling focused on general notices and success feedback", () => {
    const css = readCssWithImports(new URL("../styles/commerce-settings.css", import.meta.url));
    const successBlock = css.match(/\.toast\.success\s*\{[^}]+\}/)?.[0] ?? "";

    expect(successBlock).toContain("background: linear-gradient(135deg, #48b978, #23985f)");
    expect(css).not.toContain(".toast.reward");
    expect(css).not.toContain(".toast.penalty");
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
