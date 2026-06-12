import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { ReplayList, replayOutcomeForUser } from "./ReplayList.jsx";

describe("ReplayList", () => {
  const characters = {
    sigrika: { id: "sigrika", name: "Sigrika", portrait: "/sigrika.webp" },
    denia: { id: "denia", name: "Denia", portrait: "/denia.webp" }
  };

  it("marks replay rows as win loss or draw for the viewed user", () => {
    expect(replayOutcomeForUser({
      blackUserId: "user-1",
      whiteUserId: "user-2",
      winnerColor: "black"
    }, { id: "user-1" })).toBe("win");

    expect(replayOutcomeForUser({
      blackUserId: "user-1",
      whiteUserId: "user-2",
      winnerColor: "black"
    }, { id: "user-2" })).toBe("loss");

    expect(replayOutcomeForUser({
      blackUserId: "user-1",
      whiteUserId: "user-2",
      resultText: "和棋"
    }, { id: "user-2" })).toBe("draw");
  });

  it("renders outcome classes on replay rows", () => {
    const html = renderToStaticMarkup(createElement(ReplayList, {
      characters,
      currentUser: { id: "user-1", username: "moming" },
      records: [
        {
          id: "record-1",
          createdAt: "2026-06-06T00:31:00.000Z",
          blackUserId: "user-2",
          whiteUserId: "user-1",
          blackName: "other",
          whiteName: "moming",
          blackCharacter: "sigrika",
          whiteCharacter: "denia",
          winnerColor: "white",
          resultText: "白中盘胜",
          moveCount: 50
        },
        {
          id: "record-2",
          createdAt: "2026-06-06T00:32:00.000Z",
          blackUserId: "user-1",
          whiteUserId: "user-2",
          blackName: "moming",
          whiteName: "other",
          blackCharacter: "sigrika",
          whiteCharacter: "denia",
          winnerColor: "white",
          resultText: "白中盘胜",
          moveCount: 51
        }
      ]
    }));

    expect(html).toContain("replay-table-row outcome-win");
    expect(html).toContain("replay-table-row outcome-loss");
  });

  it("keeps replay outcome row colors in the final modal style layer", () => {
    const css = readFileSync(new URL("../styles/modals.css", import.meta.url), "utf8");
    const finalWinRule = css.lastIndexOf(".replay-table-row.outcome-win");
    const terminalRowRule = css.lastIndexOf(".replay-item,\n.replay-table-row");

    expect(finalWinRule).toBeGreaterThan(terminalRowRule);
    expect(css).toContain(".replay-table-row.outcome-loss");
    expect(css).toContain(".replay-table-row.outcome-win span");
    expect(css).toContain("background: linear-gradient(135deg, #dff9e7, #f2fff5) !important");
    expect(css).toContain("background: linear-gradient(135deg, #ececef, #f8f8f8) !important");
    expect(css).toContain("background: linear-gradient(135deg, #fff4bd, #fffbe7) !important");
  });

  it("keeps outcome colors above theme button hover and focus states", () => {
    const css = readFileSync(new URL("../styles/themes/theme-components.css", import.meta.url), "utf8");
    const finalLossFocusRule = css.lastIndexOf(".app-shell.player-theme-enabled .replay-table-row.outcome-loss:focus-visible");
    const finalDrawRule = css.lastIndexOf(".app-shell.player-theme-enabled .replay-table-row.outcome-draw");
    const brightSchoolLossRule = css.lastIndexOf(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .replay-table .replay-table-row.outcome-loss");
    const brightSchoolDrawSpanRule = css.lastIndexOf(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .replay-table .replay-table-row.outcome-draw span");
    const finalSkillRule = css.lastIndexOf(".app-shell.player-theme-enabled .skill-chip");

    expect(finalLossFocusRule).toBeGreaterThan(finalSkillRule);
    expect(finalDrawRule).toBeGreaterThan(finalSkillRule);
    expect(brightSchoolLossRule).toBeGreaterThan(finalLossFocusRule);
    expect(brightSchoolDrawSpanRule).toBeGreaterThan(finalDrawRule);
    expect(css).toContain(".app-shell.player-theme-enabled .replay-table-row.outcome-win:hover");
    expect(css).toContain(".app-shell.player-theme-enabled .replay-table-row.outcome-loss:focus-visible");
    expect(css).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .replay-table .replay-table-row.outcome-win");
    expect(css).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .replay-table .replay-table-row.outcome-loss");
    expect(css).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .replay-table .replay-table-row.outcome-draw");
    expect(css).toContain("background: linear-gradient(135deg, #dff9e7, #f2fff5) !important");
    expect(css).toContain("background: linear-gradient(135deg, #ececef, #f8f8f8) !important");
    expect(css).toContain("background: linear-gradient(135deg, #fff4bd, #fffbe7) !important");
  });

  it("uses mobile replay cards instead of relying on a bottom horizontal scrollbar", () => {
    const css = readFileSync(new URL("../styles/mobile-modals.css", import.meta.url), "utf8");
    const phoneModalMedia = mediaBlock(css, "@media (max-width: 560px)");
    const finalMobileCss = readFileSync(new URL("../styles/mobile-adaptive.css", import.meta.url), "utf8");

    expect(phoneModalMedia).toContain(".replay-table");
    expect(phoneModalMedia).toContain("overflow-x: hidden");
    expect(phoneModalMedia).toContain("grid-auto-rows: auto");
    expect(phoneModalMedia).toContain("align-content: start");
    expect(phoneModalMedia).toContain(".replay-table-heading");
    expect(phoneModalMedia).toContain("display: none");
    expect(phoneModalMedia).toContain("min-width: 0");
    expect(phoneModalMedia).toContain(".replay-table-row");
    expect(phoneModalMedia).toContain("grid-template-areas:");
    expect(phoneModalMedia).toContain(".replay-table-row > span:nth-child");
    expect(phoneModalMedia).toContain(".replay-player-cell");
    expect(finalMobileCss).toContain(".nested-modal.replay-dialog");
    expect(finalMobileCss).toContain("grid-template-rows: auto minmax(0, 1fr) !important");
    expect(finalMobileCss).toContain(".nested-modal.replay-dialog .replay-table");
    expect(finalMobileCss).toContain(".profile-replay-dialog .replay-table");
    expect(finalMobileCss).toContain("grid-template-rows: none !important");
    expect(finalMobileCss).toContain("grid-auto-rows: auto !important");
    expect(finalMobileCss).toContain("align-content: start !important");
    expect(finalMobileCss).toContain("overflow-y: auto !important");
    expect(finalMobileCss).toContain(".nested-modal.replay-dialog .replay-table-heading");
    expect(finalMobileCss).toContain(".profile-replay-dialog .replay-table-heading");
    expect(finalMobileCss).toContain("display: none !important");
    expect(finalMobileCss).toContain(".nested-modal.replay-dialog .replay-table-row");
    expect(finalMobileCss).toContain("min-height: 94px !important");
    expect(finalMobileCss).toContain('"time moves result"');
    expect(finalMobileCss).toContain('"black black white" !important');
    expect(finalMobileCss).toContain("grid-template-rows: auto minmax(26px, auto) !important");
    expect(finalMobileCss).toContain("justify-self: center !important");
    expect(finalMobileCss).toContain(".nested-modal.replay-dialog .replay-player-cell img");
    expect(finalMobileCss).toContain("height: 22px !important");
    expect(finalMobileCss).toContain(".nested-modal.replay-dialog .replay-player-cell b");
  });
});

function mediaBlock(css, marker) {
  const start = css.indexOf(marker);
  if (start < 0) return "";
  const next = css.indexOf("\n@media", start + 1);
  return css.slice(start, next >= 0 ? next : undefined);
}
