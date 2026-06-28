import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readCssWithImports } from "../styles/cssTestUtils.js";
import { DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID, storyPortraitOptions } from "../shared/storyPortraits.js";

const adminCss = readCssWithImports(new URL("../styles/admin.css", import.meta.url));
const adminSource = readFileSync(new URL("./AdminOnboardingStory.jsx", import.meta.url), "utf8");

describe("AdminOnboardingStory", () => {
  it("keeps long node editing inside an independent scroll region", () => {
    expect(adminCss).toContain(".admin-onboarding-editor");
    expect(adminCss).toContain("grid-template-rows: auto auto minmax(0, 1fr) auto");
    expect(adminCss).not.toContain("grid-template-rows: auto minmax(0, 1fr) auto auto");
    expect(adminCss).toContain("max-height: calc(100dvh - 164px)");
    expect(adminCss).toContain(".admin-onboarding-node-list");
    expect(adminCss).toContain("min-height: 0");
    expect(adminCss).toContain("overflow-y: auto");
    expect(adminCss).toContain("overscroll-behavior: contain");
    expect(adminCss).toContain("scrollbar-gutter: stable");
    expect(adminCss).toContain(".admin-onboarding-preview .onboarding-story-backdrop");
    expect(adminCss).toContain("z-index: auto");
  });

  it("keeps node cards clear of the editor scrollbar on desktop and mobile", () => {
    expect(adminCss).toContain("grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr)");
    expect(adminCss).toContain("padding-right: 16px");
    expect(adminCss).toContain("scrollbar-gutter: stable both-edges");
    expect(adminCss).toContain(".admin-onboarding-node {\n  min-width: 0");
    expect(adminCss).toContain(".admin-onboarding-node header {\n  min-width: 0");
    expect(adminCss).toContain(".admin-onboarding-node strong {\n  min-width: 0");
    expect(adminCss).toContain("overflow-wrap: anywhere");
    expect(adminCss).toContain(".admin-onboarding-node .icon-only {\n  flex: 0 0 auto");
  });

  it("adds story-only portrait options to the node portrait selector", () => {
    expect(storyPortraitOptions([{ slug: "denia", name: "达妮娅" }])).toEqual(expect.arrayContaining([
      expect.objectContaining({
        slug: DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID,
        name: "发彩虹光的达妮娅",
        portraitUrl: "/assets/characters/denia_color.webp"
      })
    ]));
    expect(adminSource).toContain("const portraitOptions = useMemo(() => storyPortraitOptions(characters), [characters]);");
    expect(adminSource).toContain("portraitOptions.map((character)");
  });
});
