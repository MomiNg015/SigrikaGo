import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AssetPreloadScreen, {
  characterLoadingLine,
  characterLoadingLineMap,
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
    expect(html).toContain("width:100%");
    expect(html).toContain("加载提示");
    expect(html).not.toContain("preload-mark");
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

  it("advances to a different random character when rotating the login preload display", () => {
    expect(randomPreloadCharacter({
      sigrika: { id: "sigrika", portrait: "/sigrika.webp" },
      mornye: { id: "mornye", portrait: "/mornye.webp" }
    }, () => 0, { id: "sigrika" }).id).toBe("mornye");
  });
});
