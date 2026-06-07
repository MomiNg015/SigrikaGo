import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { characterCandyPortrait, characterSortieDisabledReason, deriveCharacterRecordStats, selectSortieCharacter } from "./HouseModal.jsx";
import { DENIA_CANDY_PORTRAIT } from "../shared/candyPortraits.js";
import HouseModal from "./HouseModal.jsx";

describe("deriveCharacterRecordStats", () => {
  const user = {
    id: 1,
    username: "moming",
    ownedCharacters: ["sigrika", "aemeath"]
  };
  const characters = [
    { id: "sigrika", name: "西格莉卡" },
    { id: "aemeath", name: "爱弥斯" },
    { id: "baconbits", name: "猪小仙" }
  ];

  it("counts only owned character records for the viewed player", () => {
    const records = [
      { blackUserId: 1, blackCharacter: "sigrika", winnerColor: "black" },
      { whiteUserId: 1, whiteCharacter: "aemeath", winnerColor: "black" },
      { blackName: "moming", blackCharacter: "baconbits", winnerColor: "black" },
      { whiteUserId: 2, whiteCharacter: "sigrika", winnerColor: "white" }
    ];

    expect(deriveCharacterRecordStats(user, records, characters)).toEqual([
      { character: characters[0], total: 1, wins: 1, losses: 0, draws: 0 },
      { character: characters[1], total: 1, wins: 0, losses: 1, draws: 0 }
    ]);
  });

  it("disables Sigrika sortie and swaps Denia portrait from candy effects", () => {
    const itemEffects = {
      sigrikaCandyDisabled: true,
      deniaRainbowGlow: true
    };

    expect(characterSortieDisabledReason("sigrika", itemEffects)).toBe("糖果效果中，暂时无法出战");
    expect(characterSortieDisabledReason("denia", itemEffects)).toBe("");
    expect(characterCandyPortrait({ id: "denia", portrait: "/assets/Danea_centered.webp" }, itemEffects)).toBe(DENIA_CANDY_PORTRAIT);
    expect(characterCandyPortrait({ id: "sigrika", portrait: "/assets/sigrika_centered.webp" }, itemEffects)).toBe("/assets/sigrika_centered.webp");
  });

  it("plays the selected character sortie voice before selecting the character", () => {
    const calls = [];
    const character = {
      id: "sigrika",
      systemVoices: {
        sortie: "/assets/voice/sigrika_sortie.ogg"
      }
    };

    selectSortieCharacter({
      character,
      disabled: false,
      audioSettings: { voiceVolume: 0.8 },
      playVoice: (event, options) => calls.push(["voice", event, options]),
      onSelectCharacter: (characterId) => calls.push(["select", characterId])
    });

    expect(calls).toEqual([
      ["voice", "sortie", { character, audioSettings: { voiceVolume: 0.8 } }],
      ["select", "sigrika"]
    ]);
  });

  it("does not play sortie voice or select when the sortie button is disabled", () => {
    const calls = [];

    selectSortieCharacter({
      character: { id: "sigrika" },
      disabled: true,
      playVoice: (event, options) => calls.push(["voice", event, options]),
      onSelectCharacter: (characterId) => calls.push(["select", characterId])
    });

    expect(calls).toEqual([]);
  });

  it("renders owned decorations with icon and application status in the house manual", () => {
    const html = renderToStaticMarkup(createElement(HouseModal, {
      user: {
        id: 1,
        username: "moming",
        rank: "1段",
        rating: 1000,
        coins: 0,
        ownedCharacters: ["sigrika"],
        ownedDecorations: ["paw-stone"],
        selectedCharacter: "sigrika"
      },
      records: [],
      characterListView: [{ id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp", skill: { name: "技能", description: "", cost: 1 } }],
      audioSettings: {},
      onClose: () => {},
      onSelectCharacter: () => {},
      onApplyDecoration: () => {},
      onOpenReplay: () => {}
    }));

    expect(html).toContain("owned-decoration-chip");
    expect(html).toContain("decoration-applied-box");
    expect(html).toContain("decorations-section");
    expect(html).toContain("aria-label=\"爪印棋子\"");
    expect(html).not.toContain(">爪印棋子</span>");
    expect(html).toContain(">应用</strong>");
    expect(html).not.toContain(">使用中</strong>");
  });

  it("marks the selected sortie character and locked slots for tactical terminal styling", () => {
    const html = renderToStaticMarkup(createElement(HouseModal, {
      user: {
        id: 1,
        username: "moming",
        rank: "1段",
        rating: 1000,
        coins: 0,
        ownedCharacters: ["sigrika"],
        ownedDecorations: [],
        selectedCharacter: "sigrika"
      },
      records: [],
      characterListView: [{
        id: "sigrika",
        name: "西格莉卡",
        portrait: "/assets/sigrika_centered.webp",
        skill: { name: "技能", description: "", cost: 1 }
      }],
      audioSettings: {},
      onClose: () => {},
      onSelectCharacter: () => {},
      onApplyDecoration: () => {},
      onOpenReplay: () => {}
    }));

    expect(html).toContain("is-deployed");
    expect(html).toContain("class=\"deploy-tag\"");
    expect(html).toContain("[出战中]");
    expect(html).toContain("lock-character-card");
    expect(html).toContain("lock-text-title");
    expect(html).toContain("character-grid-container");
    expect(html).toContain("top-stats-bar");
    expect(html).toContain("LOADING... (x_x)");
    expect(html).toContain("LOCK / LOADING... (x_x)");
  });

  it("keeps nested character detail dialogs as viewport overlays above the house manual", () => {
    const css = readFileSync(new URL("../styles/modals.css", import.meta.url), "utf8");
    const nestedSource = readFileSync(new URL("./house/HouseNestedDialogs.jsx", import.meta.url), "utf8");
    const nestedBackdropBlock = css.match(/\.nested-modal-backdrop\s*\{[^}]+\}/g)?.at(-1) ?? "";
    const nestedModalBlock = css.match(/\.nested-modal-backdrop \.nested-modal\s*\{[^}]+\}/)?.[0] ?? "";
    const closeButtonBlock = css.match(/\.modal-backdrop \.close-button,\s*\.nested-modal-backdrop \.close-button\s*\{[^}]+\}/)?.[0] ?? "";

    expect(nestedSource).toContain("character-details-modal");
    expect(nestedBackdropBlock).toContain("position: fixed");
    expect(nestedBackdropBlock).toContain("inset: 0");
    expect(nestedBackdropBlock).toContain("z-index: 80");
    expect(nestedBackdropBlock).toContain("place-items: center");
    expect(nestedModalBlock).toContain("position: relative");
    expect(nestedModalBlock).toContain("max-height: min(760px, calc(100dvh - 32px))");
    expect(closeButtonBlock).toContain("z-index: 20");
    expect(closeButtonBlock).toContain("pointer-events: auto");
  });
});
