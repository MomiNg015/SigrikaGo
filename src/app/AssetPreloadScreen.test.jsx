import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AssetPreloadScreen, { preloadTipList } from "./AssetPreloadScreen.jsx";

describe("AssetPreloadScreen", () => {
  it("clamps progress and exposes the displayed percent to assistive labels", () => {
    const html = renderToStaticMarkup(createElement(AssetPreloadScreen, { progress: 1.4, tipsText: "加载提示" }));

    expect(html).toContain("asset-preload-screen");
    expect(html).toContain("界面加载中");
    expect(html).toContain("资源加载 100%");
    expect(html).toContain("width:100%");
    expect(html).toContain("加载提示");
  });

  it("parses admin-configured preload tips from newline text", () => {
    expect(preloadTipList("  第一句  \n\n第二句\r\n  ")).toEqual(["第一句", "第二句"]);
  });
});
