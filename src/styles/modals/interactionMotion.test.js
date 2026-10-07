import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readCss = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

describe("ordinary interface motion boundaries", () => {
  it("reserves paper lift for enabled actions without replacing artwork rotation", () => {
    const css = readCss("./themes/bright-school/quality-base/sticker-motion.css");
    expect(css).toContain("button.watch-room-row");
    expect(css).toContain("button.owned-decoration-chip");
    expect(css).toContain('.character-card[role="button"]');
    expect(css).toContain("(hover: hover) and (pointer: fine)");
    expect(css).toContain("prefers-reduced-motion: no-preference");
    expect(css).toContain(':hover:not(:disabled, [aria-disabled="true"], [aria-busy="true"])');
    expect(css).toContain(":not(.is-sigrika-corrupted)");
    expect(css).not.toMatch(/\.record-card|\.leaderboard-row|\.friend-row|\.warehouse-item|\.shop-item|\.home-image-entry/);
    expect(css).not.toMatch(/(?:\{|;)\s*(?:transform|box-shadow)\s*:/);
    expect(css).toContain("prefers-reduced-motion: reduce");
    const legacy = readCss("./themes/bright-school/surface-contracts/final-controls-forms.css");
    const hoverPaint = legacy.match(/button:hover,[\s\S]*?\n\}/)?.[0] ?? "";
    expect(hoverPaint).toContain("background: var(--bright-pink)");
    expect(hoverPaint).not.toContain("transform:");
  });

  it("lets ordinary sheet entrances survive transform resets and release after entry", () => {
    for (const file of ["./mobile-adaptive/motion-keyframes.css", "./themes/bright-school/mobile/motion.css"]) {
      const css = readCss(file).split("@media")[0];
      expect(css).toContain("translate:");
      expect(css).toContain("scale:");
      expect(css).not.toMatch(/\btransform:|\b(?:width|height|margin|top|left):/);
    }
    for (const file of ["./modals/window-entry-motion.css", "./mobile-adaptive/phone-interactions.css", "./themes/bright-school/mobile/room/modal-sheets.css"]) {
      const css = readCss(file);
      expect(css).toContain("backwards");
      expect(css).not.toMatch(/animation:[^;]+\b(?:both|forwards)\b/);
    }
    const desktop = readCss("./modals/window-entry-motion.css");
    expect(desktop).toContain(".user-profile-modal");
    expect(desktop).toContain(".profile-report-dialog");
    expect(desktop).toContain(".profile-blacklist-dialog");
    expect(desktop).not.toContain(".room-floating-modal,");
  });

  it("reduces portal feedback locally while retaining anchor transforms", () => {
    for (const file of ["./room/people-floating-replay.css", "./room/players-timers-skills/mobile-tap-tooltip.css"]) {
      const css = readCss(file);
      const reduced = css.match(/@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\n\}/)?.[0] ?? "";
      expect(reduced).toContain("animation: none !important");
      expect(reduced).not.toMatch(/\btransform:|\btranslate:|\b(?:left|top):/);
    }
    for (const file of ["./modals/window-entry-motion.css", "./mobile-adaptive/phone-interactions.css"]) {
      expect(readCss(file)).toMatch(/prefers-reduced-motion: reduce[\s\S]+animation: none !important/);
    }
  });

  it("uses reversible menu feedback and respects unavailable coordinate actions", () => {
    for (const file of ["./mobile-adaptive/bright-school-overrides/home-header-menu.css", "./mobile-adaptive/mobile-room-portrait/shell-header-menu.css"]) {
      const css = readCss(file);
      expect(css).toContain("transition: opacity 160ms");
      expect(css).toContain("translate 160ms");
      expect(css).toContain("prefers-reduced-motion: reduce");
      expect(css).not.toMatch(/animation-delay|transition-delay|transition: all/);
    }
    expect(readCss("./themes/bright-school/quality-base/button-color-states.css"))
      .toContain('&.coordinate-toggle:is([aria-pressed="true"], :active):not(:disabled, [aria-disabled="true"], [aria-busy="true"])');
  });

  it("bounds specialty artwork feedback without removing authored sign and selected-tab geometry", () => {
    const sign = readCss("./themes/bright-school/commerce/shop/signpost-switch.css");
    const player = readCss("./themes/bright-school/component-repairs/character-music-player/player-shell.css");
    const tracks = readCss("./themes/bright-school/component-repairs/character-music-player/track-sheet.css");
    for (const css of [sign, player, tracks]) {
      expect(css).toContain("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
      expect(css).toContain('[aria-disabled="true"], [aria-busy="true"]');
      expect(css).toContain("transform: none !important");
      expect(css).not.toContain("transition: all");
    }
    expect(sign).toContain("transform: scaleX(var(--shop-sign-image-scale-x)) !important");
    expect(tracks).toContain(".is-pending, :focus-visible");
    expect(tracks).toContain("transform: translateY(1px) rotate(-0.5deg)");
    expect(player).toContain("outline-offset: -5px !important");
  });
});
