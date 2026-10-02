import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sources = ["button-color-roles.css", "button-color-states.css"].map((file) =>
  readFileSync(new URL(`./quality-base/${file}`, import.meta.url), "utf8")
);

describe("campus button color boundary", () => {
  it("limits the color owners to paint and color tokens", () => {
    const allowed = new Set(["background", "color", "border-color"]);
    for (const source of [sources[0]]) {
      const properties = [...source.matchAll(/(?:\{|;)\s*([\w-]+)\s*:/g)].map((match) => match[1]);
      expect(properties.length).toBeGreaterThan(0);
      expect(properties.filter((property) => !property.startsWith("--campus-") && !allowed.has(property))).toEqual([]);
      expect(source).not.toMatch(/url\(|@keyframes|@media/);
    }
  });

  it("excludes special scenes and uses explicit ordinary controls", () => {
    const states = sources[1];
    expect(states).toContain(":not(.is-sigrika-corrupted)");
    expect(states).toContain(".room-screen:not(.sigrika-candy-duel-room)");
    expect(states).toContain(".confirm-modal:not(.sigrika-duel-confirm-modal)");
    expect(states).toContain(".sigrika-duel-confirm-modal *, .sigrika-candy-duel-room *, .window-bookmark-tab");
    expect(states).toContain(".profile-dossier-modal *, .shop-modal *, .recruitment-modal *");
    expect(states).toContain(".action-bar:not(.tutorial-choice-actions) > button:not(.skill-action)");
    expect(states).not.toMatch(/\[class\*|\.admin-screen|\.home-image-entry|\.utility-entry/);
  });
  it("requires explicit roles before painting specialty-window actions", () => {
    expect(sources[0]).not.toContain(":is(");
    expect(sources[1]).toContain('.recruitment-modal) button[data-button-role]');
    expect(sources[1]).toContain('.profile-dossier-modal *, .shop-modal *, .recruitment-modal *');
    const recruitment = readFileSync(new URL('../../../modals/RecruitmentModal.jsx', import.meta.url), 'utf8');
    expect(recruitment).toContain('data-button-role="success" className="primary-action"');
    expect(recruitment).not.toMatch(/data-button-role="[^"]+"\s+className=\{?[^\n]*recruitment-item-button/);
  });

  it("owns complete input states without changing control layout", () => {
    const states = sources[1];
    expect(states).toContain("(hover: hover) and (pointer: fine)");
    expect(states).toContain(':active:not(:disabled, [aria-disabled="true"], [aria-busy="true"])');
    expect(states).toContain(':is(:disabled, [aria-disabled="true"], [aria-busy="true"])');
    expect(states).toContain(":focus-visible");
    expect(states).toContain("prefers-reduced-motion: reduce");
    expect(states).not.toMatch(/(?:\{|;)\s*(?:width|height|padding|margin|display|position|font-size|border-radius)\s*:/);
    expect(states).not.toMatch(/url\(|@keyframes/);
  });
});
