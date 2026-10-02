import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SigrikaDuelPresentation from "./SigrikaDuelPresentation.jsx";
import { SIGRIKA_CORRUPTED_PORTRAIT_ASSET } from "../shared/characterPortraitAssetCatalog.js";

describe("SigrikaDuelPresentation", () => {
  it("renders an assertive visible dialogue without any voice playback dependency", () => {
    const source = readFileSync(new URL("./SigrikaDuelPresentation.jsx", import.meta.url), "utf8");
    const markup = renderToStaticMarkup(
      <SigrikaDuelPresentation presentation={{
        sequence: 1,
        type: "dialogue",
        speaker: "西格莉卡？",
        text: "那么，让你看看才能的差距吧。"
      }} />
    );

    expect(markup).toContain("sigrika-duel-dialogue");
    expect(markup).toContain("sigrika-duel-dialogue-copy");
    expect(markup).toContain(`src="${SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url}"`);
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).toContain('aria-live="assertive"');
    expect(markup).toContain("西格莉卡？");
    expect(markup).toContain("那么，让你看看才能的差距吧。");
    expect(source).not.toContain("playSystemVoice");
    expect(source).not.toContain("resolveSystemVoice");
  });

  it("renders the named fake skill as a visual-only burst", () => {
    const markup = renderToStaticMarkup(
      <SigrikaDuelPresentation presentation={{
        sequence: 4,
        type: "skill",
        speaker: "西格莉卡？",
        skillName: "七宗罪"
      }} />
    );

    expect(markup).toContain("skill-burst");
    expect(markup).toContain("sigrika-duel-skill-burst");
    expect(markup).toContain("sigrika-duel-skill-copy");
    expect(markup).toContain(`src="${SIGRIKA_CORRUPTED_PORTRAIT_ASSET.url}"`);
    expect(markup).toContain("西格莉卡？发动技能");
    expect(markup).toContain("七宗罪");
    expect(markup).not.toContain("audio");
    expect(markup).not.toContain(">?</span>");
  });
});
