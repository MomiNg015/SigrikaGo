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
    expect(html).toContain("--preload-mask-size:100%");
    expect(html).toContain("--preload-mascot-rotation:720deg");
    expect(html).toContain("preload-paper-fill");
    expect(html).toContain("preload-mascot-roll");
    expect(html).toContain("preload-mascot-motion");
    expect(html).toContain("preload-progress-mascot");
    expect(html).toContain("/assets/preload/orange-mascot.png");
    expect(html).toContain("role=\"progressbar\"");
    expect(html).toContain("aria-valuenow=\"100\"");
    expect(html).toContain("加载提示");
    expect(html).not.toContain("preload-mark");
  });

  it.each([
    [0, "--preload-progress:0", "--preload-mask-size:0%", "--preload-mascot-rotation:0deg", "aria-valuenow=\"0\""],
    [0.5, "--preload-progress:0.5", "--preload-mask-size:50%", "--preload-mascot-rotation:360deg", "aria-valuenow=\"50\""],
    [1, "--preload-progress:1", "--preload-mask-size:100%", "--preload-mascot-rotation:720deg", "aria-valuenow=\"100\""]
  ])("keeps the reveal and two-turn mascot roll on real progress at %s", (progress, progressStyle, maskStyle, rotationStyle, ariaValue) => {
    const html = renderToStaticMarkup(createElement(AssetPreloadScreen, {
      character: { id: "sigrika", name: "西格莉卡", portrait: "/sigrika.webp" },
      progress,
      showTips: false
    }));

    expect(html).toContain(progressStyle);
    expect(html).toContain(maskStyle);
    expect(html).toContain(rotationStyle);
    expect(html).toContain(ariaValue);
  });

  it("reveals a fixed crayon paper strip without stretching its texture or mascot", () => {
    const css = readFileSync(new URL("../styles/base/asset-preload.css", import.meta.url), "utf8");
    const themeCss = readFileSync(new URL("../styles/themes/shared/player-theme-wiring.css", import.meta.url), "utf8");
    const brightBaseCss = readFileSync(new URL("../styles/themes/bright-school/base/preload-scrollbars.css", import.meta.url), "utf8");
    const brightMetersCss = readFileSync(new URL("../styles/themes/bright-school/surface-contracts/meters-friend-scroll.css", import.meta.url), "utf8");
    const brightCss = readFileSync(new URL("../styles/themes/bright-school/surface-contracts/final-semantic-badges.css", import.meta.url), "utf8");
    const brightFoundationCss = readFileSync(new URL("../styles/themes/bright-school/quality-base/audit-foundation.css", import.meta.url), "utf8");

    expect(css).toContain("--bar-h: 20px");
    expect(css).toContain("--bar-h: 18px");
    expect(css).toContain("--mascot-h: calc(var(--bar-h) * 3)");
    expect(css).toContain("height: var(--mascot-h)");
    expect(css).toContain("width: auto");
    expect(css).toContain("linear-gradient(90deg, rgb(255 214 109) 0%, rgb(247 169 61) 50%, rgb(233 120 39) 100%)");
    expect(css).toContain("-webkit-mask-size: var(--preload-mask-size) 100%");
    expect(css).toContain("mask-size: var(--preload-mask-size) 100%");
    expect(css).toContain("clip-path: inset(0 calc(100% - var(--preload-mask-size)) 0 0)");
    expect(css).toContain("23px 13px");
    expect(css).toContain("17px 17px");
    expect(css).not.toContain("scaleX(var(--preload-progress))");
    expect(css).toContain(".preload-mascot-anchor");
    expect(css).toContain("left: calc(var(--preload-progress) * 100%)");
    expect(css).toContain(".preload-mascot-roll");
    expect(css).toContain("transform: rotate(var(--preload-mascot-rotation))");
    expect(css).toContain(".preload-mascot-motion");
    expect(css).toContain(".preload-progress.is-idle .preload-mascot-motion");
    expect(css).toContain("animation: preload-mascot-breathe");
    expect(css).toContain(".preload-progress-track::before");
    expect(css).toContain("filter: blur(6px)");
    expect(css).toContain(".preload-paper-fill::before");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain("transform: translate(-50%, -50%);");
    expect(css).toContain(".preload-mascot-roll { transform: none; }");
    expect(css).toContain(".preload-progress.is-idle .preload-mascot-motion { animation: none; }");
    expect(themeCss).not.toContain(".preload-bar span");
    expect(themeCss).not.toContain(".preload-bar {");
    expect(brightBaseCss).not.toContain(".preload-bar");
    expect(brightMetersCss).not.toContain(".preload-bar");
    expect(brightCss).not.toContain(".preload-bar span");
    expect(brightCss).not.toContain(".preload-bar {");
    expect(themeCss).toContain("var(--timer-track-fill");
    expect(brightCss).toContain("var(--timer-track-fill, var(--bright-pink))");
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

  it("never exposes the excluded Baconbits loading line", () => {
    expect(characterLoadingLine(
      { id: "baconbits", name: "猪小仙" },
      "baconbits=猪小仙正在点燃炸弹"
    )).toBe("资源正在加载中");
  });

  it("selects a random preload character from the catalog", () => {
    expect(randomPreloadCharacter({
      sigrika: { id: "sigrika", portrait: "/sigrika.webp" },
      mornye: { id: "mornye", portrait: "/mornye.webp" }
    }, () => 0.75).id).toBe("mornye");
  });

  it("excludes Baconbits from random and fixed-character loading screens", () => {
    const characters = {
      baconbits: { id: "baconbits", name: "猪小仙", portrait: "/baconbits.webp" },
      mornye: { id: "mornye", name: "莫宁", portrait: "/mornye.webp" }
    };

    expect(randomPreloadCharacter(characters, () => 0).id).toBe("mornye");

    const html = renderToStaticMarkup(createElement(AssetPreloadScreen, {
      character: characters.baconbits,
      characters,
      loadingLinesText: "baconbits=猪小仙正在点燃炸弹\nmornye=莫宁正在校准协议",
      progress: 0.5,
      showTips: false
    }));

    expect(html).toContain("莫宁正在校准协议");
    expect(html).toContain("/mornye.webp");
    expect(html).not.toContain("猪小仙");
    expect(html).not.toContain("/baconbits.webp");
    expect(html).not.toContain("猪小仙正在点燃炸弹");
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
