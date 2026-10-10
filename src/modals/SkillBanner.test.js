import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SkillBanner, { shouldPlaySkillBannerVoice } from "./SkillBanner.jsx";
import { CHARACTERS } from "../shared/characters.js";
import { DENIA_CANDY_PORTRAIT } from "../shared/candyPortraits.js";

function renderBanner(banner) {
  return renderToStaticMarkup(createElement(SkillBanner, { banner: { id: "cast", characterId: "sigrika", ...banner }, characters: CHARACTERS }));
}

describe("SkillBanner helpers", () => {
  it("plays only when a new banner has voice content", () => {
    expect(shouldPlaySkillBannerVoice({ id: "a" }, "", { type: "audio" })).toBe(true);
    expect(shouldPlaySkillBannerVoice({ id: "a" }, "a", { type: "audio" })).toBe(false);
    expect(shouldPlaySkillBannerVoice({ id: "b" }, "", { text: "发动技能" })).toBe(true);
    expect(shouldPlaySkillBannerVoice({ id: "c" }, "", {})).toBe(false);
    expect(shouldPlaySkillBannerVoice(null, "", { type: "audio" })).toBe(false);
  });

  it.each(["sigrika", "denia", "aemeath", "lynae", "mornye", "chisa", "changli", "qiuyuan", "nabomo"])("uses current full-body art for %s", (characterId) => {
    const html = renderBanner({ characterId });
    expect(html).toContain(`/assets/characters/handbook-chibi-sprites/${characterId}.webp`);
    expect(html).not.toContain(`${characterId}-avatar.webp`);
    expect(html).toContain("skill-cutin-scene");
    expect(html).not.toContain('class="skill-burst"');
    expect(html).not.toContain("技能发动");
  });

  it("keeps frozen costumes ahead of live equipment and preserves their framing", () => {
    const html = renderBanner({
      costumeSnapshot: { portraitUrl: "/frozen.webp", portraitScalePercent: 110, portraitOffsetXPercent: 4 },
      equippedCostumes: { sigrika: { portraitUrl: "/live.webp" } }
    });
    expect(html).toContain('/frozen.webp');
    expect(html).not.toContain('/live.webp');
    expect(html).toContain('scale:1.1');
    expect(html).toContain('translate:4% 0%');
  });

  it("preserves candy appearances and costume-specific candy art", () => {
    expect(renderBanner({ characterId: "denia", itemEffects: { deniaRainbowGlow: true } })).toContain(DENIA_CANDY_PORTRAIT);
    const html = renderBanner({ characterId: "denia", itemEffects: { deniaRainbowGlow: true }, costumeSnapshot: { portraitUrl: "/costume.webp", candyEffectPortraitUrl: "/costume-candy.webp" } });
    expect(html).toContain('/costume-candy.webp');
    expect(html).not.toContain('src="/costume.webp"');
  });

  it("keeps authored portraits and skill snapshot names", () => {
    const html = renderBanner({ character: { id: "custom", portraitUrl: "/authored.webp", name: "自定义" }, characterName: "快照角色", skillName: "很长的派生技能名称" });
    expect(html).toContain('/authored.webp');
    expect(html).toContain('快照角色');
    expect(html).toContain('很长的派生技能名称');
  });

  it("uses the authoritative banner duration with a safe default", () => {
    expect(renderBanner({ bannerDurationMs: 2400 })).toContain('--cutin-duration:2400ms');
    for (const bannerDurationMs of [undefined, 0, -1, "invalid", Infinity]) {
      expect(renderBanner({ bannerDurationMs })).toContain('--cutin-duration:2000ms');
    }
  });
});
