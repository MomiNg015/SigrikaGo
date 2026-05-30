import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import AssetPreloadScreen from "./AssetPreloadScreen.jsx";

describe("AssetPreloadScreen", () => {
  it("clamps progress and exposes the displayed percent to assistive labels", () => {
    const html = renderToStaticMarkup(createElement(AssetPreloadScreen, { progress: 1.4 }));

    expect(html).toContain("asset-preload-screen");
    expect(html).toContain("资源准备中");
    expect(html).toContain("资源加载 100%");
    expect(html).toContain("width:100%");
  });
});
