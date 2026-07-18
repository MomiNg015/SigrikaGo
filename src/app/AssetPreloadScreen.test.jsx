import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import AssetPreloadScreen, {
  characterLoadingLine,
  characterLoadingLineMap,
  isMeaningfulPreloadProgressMovement,
  preloadTipList,
  randomPreloadCharacter
} from "./AssetPreloadScreen.jsx";

describe("AssetPreloadScreen", () => {
  it("clamps progress and exposes the displayed percent to assistive labels", () => {
    const html = renderToStaticMarkup(createElement(AssetPreloadScreen, {
      character: { id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" },
      loadingLinesText: "sigrika=西格莉卡正在戳棋盘",
      progress: 1.4,
      tipsText: "加载提示"
    }));

    expect(html).toContain("asset-preload-screen");
    expect(html).toContain("西格莉卡正在戳棋盘");
    expect(html).toContain("资源加载 100%");
    expect(html).toContain("--preload-progress:1");
    expect(html).toContain("preload-mascot-motion");
    expect(html).toContain("preload-progress-mascot");
    expect(html).toContain("/assets/preload/orange-mascot.png");
    expect(html).toContain("role=\"progressbar\"");
    expect(html).toContain("aria-valuenow=\"100\"");
    expect(html).toContain("加载提示");
    expect(html).not.toContain("preload-mark");
  });

  it.each([
    [0, "--preload-progress:0", "aria-valuenow=\"0\""],
    [0.5, "--preload-progress:0.5", "aria-valuenow=\"50\""],
    [1, "--preload-progress:1", "aria-valuenow=\"100\""]
  ])("keeps fill and mascot position on the same normalized progress at %s", (progress, progressStyle, ariaValue) => {
    const html = renderToStaticMarkup(createElement(AssetPreloadScreen, {
      character: { id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" },
      progress,
      showTips: false
    }));

    expect(html).toContain(progressStyle);
    expect(html).toContain(ariaValue);
  });

  it("keeps the orange mascot three times the gradient progress bar without stretching it", () => {
    const css = readFileSync(new URL("../styles/base/asset-preload.css", import.meta.url), "utf8");
    const themeCss = readFileSync(new URL("../styles/themes/shared/player-theme-wiring.css", import.meta.url), "utf8");
    const brightCss = readFileSync(new URL("../styles/themes/bright-school/surface-contracts/final-semantic-badges.css", import.meta.url), "utf8");
    const brightFoundationCss = readFileSync(new URL("../styles/themes/bright-school/quality-base/audit-foundation.css", import.meta.url), "utf8");

    expect(css).toContain("--bar-h: 16px");
    expect(css).toContain("--mascot-h: calc(var(--bar-h) * 3)");
    expect(css).toContain("height: var(--mascot-h)");
    expect(css).toContain("width: auto");
    expect(css).toContain("linear-gradient(90deg, #ffd36a 0%, #f5a135 48%, #e96c20 100%)");
    expect(css).toContain(".preload-mascot-anchor");
    expect(css).toContain("left: calc(var(--preload-progress) * 100%)");
    expect(css).toContain(".preload-mascot-motion");
    expect(css).not.toContain("rotate(calc(var(--preload-progress) * 720deg))");
    expect(css).toContain(".preload-progress:not(.is-idle) .preload-mascot-motion");
    expect(css).toContain("animation: preload-mascot-glide");
    expect(css).toContain(".preload-progress.is-idle .preload-mascot-motion");
    expect(css).toContain("animation: preload-mascot-idle");
    expect(css).toContain("transform: scaleX(var(--preload-progress))");
    expect(css).toContain(".preload-progress-track::before");
    expect(css).toContain("filter: blur(7px)");
    expect(css).toContain(".preload-bar > span::before");
    expect(css).toContain("animation: preload-fill-glide");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transform: translate(-50%, -50%);");
    expect(css).toContain(".preload-bar > span::before, .preload-progress:not(.is-idle) .preload-mascot-motion");
    expect(themeCss).toContain("var(--preload-progress-fill, var(--timer-track-fill");
    expect(brightCss).toContain("var(--preload-progress-fill, var(--bright-pink))");
    expect(brightFoundationCss).toContain("img:not(.preload-progress-mascot)");
  });

  it("treats one-percent progress changes as near-idle movement", () => {
    expect(isMeaningfulPreloadProgressMovement(20, 21)).toBe(false);
    expect(isMeaningfulPreloadProgressMovement(20, 22)).toBe(true);
  });

  it("parses admin-configured preload tips from newline text", () => {
    expect(preloadTipList("  第一句  \n\n第二句\r\n  ")).toEqual(["第一句", "第二句"]);
  });

  it("parses per-character loading lines from admin text", () => {
    expect(characterLoadingLineMap("sigrika=西格莉卡正在戳棋盘\nmornye：莫宁正在校准协议")).toEqual({
      sigrika: "西格莉卡正在戳棋盘",
      mornye: "莫宁正在校准协议"
    });
  });

  it("falls back to the character name when no configured loading line exists", () => {
    expect(characterLoadingLine({ id: "unknown", name: "新角色" }, "sigrika=西格莉卡正在戳棋盘")).toBe("新角色正在加载中");
  });

  it("selects a random preload character from the catalog", () => {
    expect(randomPreloadCharacter({
      sigrika: { id: "sigrika", portrait: "/sigrika.webp" },
      mornye: { id: "mornye", portrait: "/mornye.webp" }
    }, () => 0.75).id).toBe("mornye");
  });

  it("can hide random tips while reusing the shared loading template", () => {
    const html = renderToStaticMarkup(createElement(AssetPreloadScreen, {
      character: { id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" },
      label: "正在激烈对局中...",
      progress: 0.5,
      tipsText: "不应显示",
      showTips: false
    }));

    expect(html).toContain("asset-preload-screen");
    expect(html).toContain("正在激烈对局中...");
    expect(html).toContain("资源加载 50%");
    expect(html).not.toContain("preload-tip");
    expect(html).not.toContain("不应显示");
  });

  it("advances to a different random character when rotating the login preload display", () => {
    expect(randomPreloadCharacter({
      sigrika: { id: "sigrika", portrait: "/sigrika.webp" },
      mornye: { id: "mornye", portrait: "/mornye.webp" }
    }, () => 0, { id: "sigrika" }).id).toBe("mornye");
  });
});
