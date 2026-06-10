import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { characterCandyPortrait, characterSortieDisabledReason, deriveCharacterRecordStats, selectSortieCharacter } from "./HouseModal.jsx";
import { DENIA_CANDY_PORTRAIT } from "../shared/candyPortraits.js";
import HouseModal from "./HouseModal.jsx";
import ResumeModal from "./ResumeModal.jsx";
import { CharacterDetailDialog } from "./house/HouseNestedDialogs.jsx";

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

  it("keeps the house manual focused on character and decoration management", () => {
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
    expect(html).not.toContain("deploy-tag");
    expect(html).toContain("lock-character-card");
    expect(html).toContain("lock-text-title");
    expect(html).toContain("character-grid-container");
    expect(html).not.toContain("top-stats-bar");
    expect(html).not.toContain("对局回放");
    expect(html).not.toContain("战绩");
    expect(html).not.toContain("金币");
    expect(html).toContain("LOADING... (x_x)");
    expect(html).toContain("LOCK / LOADING... (x_x)");
  });

  it("renders replay access and profile stats in the resume modal", () => {
    const html = renderToStaticMarkup(createElement(ResumeModal, {
      user: {
        id: 1,
        username: "moming",
        rank: "3段",
        rating: 1160,
        coins: 1070,
        ownedCharacters: ["sigrika"],
        itemEffects: {}
      },
      records: [
        { blackUserId: 1, blackCharacter: "sigrika", winnerColor: "black" },
        { whiteUserId: 1, whiteCharacter: "sigrika", winnerColor: "black" }
      ],
      characterListView: [{ id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp", skill: { name: "技能", description: "", cost: 1 } }],
      onClose: () => {},
      onOpenReplay: () => {}
    }));

    expect(html).toContain("<h2>履历</h2>");
    expect(html).toContain("top-stats-bar");
    expect(html).toContain("对局回放");
    expect(html).toContain("战绩");
    expect(html).toContain("段位");
    expect(html).toContain("金币");
  });

  it("renders Baconbits as owned and sortie-capable when public user owns it", () => {
    const html = renderToStaticMarkup(createElement(HouseModal, {
      user: {
        id: 1,
        username: "moming",
        rank: "3段",
        rating: 1160,
        coins: 1070,
        ownedCharacters: ["sigrika", "denia", "aemeath", "baconbits"],
        ownedDecorations: [],
        selectedCharacter: "aemeath"
      },
      records: [],
      characterListView: [{
        id: "baconbits",
        name: "猪小仙",
        portrait: "/assets/baconbits.webp",
        skill: { name: "猪小仙爆炸", description: "", cost: 0 }
      }],
      audioSettings: {},
      onClose: () => {},
      onSelectCharacter: () => {},
      onApplyDecoration: () => {},
      onOpenReplay: () => {}
    }));

    expect(html).toContain("猪小仙");
    expect(html).not.toContain("unowned");
    expect(html).toContain("title=\"设为出战\"");
    expect(html).not.toContain("disabled=\"\"");
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

  it("renders character descriptions in the character detail dialog", () => {
    const styles = readFileSync(new URL("../styles/modals.css", import.meta.url), "utf8");
    const html = renderToStaticMarkup(createElement(CharacterDetailDialog, {
      character: {
        id: "sigrika",
        name: "西格莉卡",
        portrait: "/assets/sigrika_centered.webp",
        acquisitionMethod: "初始获得",
        description: "来自星辉社团的棋手。",
        skill: { name: "星辉符文", description: "抹除交叉点。", cost: 3 }
      },
      detailOwned: true,
      itemEffects: {},
      onClose: () => {}
    }));

    expect(html).toContain("character-description");
    expect(html).not.toMatch(/class="character-description"><strong>/);
    expect(html).toContain("来自星辉社团的棋手。");
    expect(styles).toMatch(/\.character-description\s*\{[^}]*font-style:\s*italic;/s);
  });
  it("renders the character skill BGM player in the detail heading", () => {
    const html = renderToStaticMarkup(createElement(CharacterDetailDialog, {
      character: {
        id: "sigrika",
        name: "Sigrika",
        portrait: "/assets/sigrika_centered.webp",
        skill: { name: "Skill", description: "Erase a point.", cost: 3 }
      },
      detailOwned: true,
      itemEffects: {},
      user: { ownedMusicIds: ["sigrika-skill-default"], musicSelections: { skill: {} } },
      audioSettings: {},
      onSelectCharacterMusic: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("character-detail-heading");
    expect(html).toContain("character-music-player");
    expect(html).toContain("Sigrika Skill BGM");
    expect(html).not.toContain("character-music-select");
  });

  it("keeps the Bright School mobile house manual internally scrollable", () => {
    const css = readFileSync(new URL("../styles/themes/bright-school/mobile.css", import.meta.url), "utf8");
    const finalMobileCss = readFileSync(new URL("../styles/mobile-adaptive.css", import.meta.url), "utf8");

    expect(css).toContain(".house-modal");
    expect(css).toContain("grid-template-rows: auto auto minmax(0, 1fr) auto !important");
    expect(css).toContain(".resume-modal");
    expect(css).toContain(".house-modal .profile-grid.top-stats-bar");
    expect(css).toContain(".house-modal .stat strong");
    expect(css).toContain("white-space: nowrap !important");
    expect(css).toContain(".house-modal .character-card.portrait-card > strong");
    expect(css).toContain(".house-modal .character-card.portrait-card > strong {");
    expect(css).toContain("display: none !important");
    expect(css).toContain(".house-modal .stat-tip");
    expect(css).toContain("position: fixed !important");
    expect(css).toContain("transform: none !important");
    expect(css).toContain("overflow-wrap: anywhere !important");
    expect(css).toContain("grid-template-rows: none !important");
    expect(css).toContain("grid-auto-rows: 112px !important");
    expect(css).toContain("overflow-y: auto !important");
    expect(css).toContain(".character-card.portrait-card .lock-text-title");
    expect(css).toContain("box-sizing: border-box !important");
    expect(css).toContain(".house-modal .owned-decoration-section");
    expect(css).toContain("grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)) !important");
    expect(css).toContain(".house-modal .owned-decoration-chip strong");
    expect(css).toContain(".character-record-dialog");
    expect(css).toContain("width: min(420px, calc(100vw - 20px)) !important");
    expect(css).toContain(".character-record-row span");
    expect(css).toContain("word-break: keep-all !important");
    expect(css).toContain(".character-detail-art img");
    expect(css).toContain("filter: none !important");
    expect(css).toContain("max-height: min(128px, 20dvh) !important");
    expect(finalMobileCss).toContain(".profile-grid.top-stats-bar .stat strong");
    expect(finalMobileCss).toContain("white-space: nowrap !important");
    expect(finalMobileCss).toContain("word-break: normal !important");
    expect(finalMobileCss).toContain(".character-card.portrait-card.is-deployed");
    expect(finalMobileCss).toContain("#4f9b69");
    expect(finalMobileCss).toContain("repeat(auto-fill, minmax(58px, 70px)) !important");
    expect(finalMobileCss).toContain(".house-modal .deploy-tag");
    expect(finalMobileCss).toContain("display: none !important");
    expect(finalMobileCss).toContain(".character-record-row");
    expect(finalMobileCss).toContain("grid-template-columns: 46px minmax(58px, 0.82fr) max-content minmax(48px, auto) !important");
    expect(finalMobileCss).toContain("overflow-wrap: normal !important");
  });

  it("shows a selector when the user owns multiple skill BGM tracks for the character", () => {
    const html = renderToStaticMarkup(createElement(CharacterDetailDialog, {
      character: {
        id: "sigrika",
        name: "Sigrika",
        portrait: "/assets/sigrika_centered.webp",
        skill: { name: "Skill", description: "Erase a point.", cost: 3 }
      },
      detailOwned: true,
      itemEffects: {},
      user: {
        ownedMusicIds: ["sigrika-skill-default", "sigrika-skill-dream"],
        musicSelections: { skill: { sigrika: "sigrika-skill-dream" } }
      },
      audioSettings: {},
      onSelectCharacterMusic: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("character-music-select");
    expect(html).toContain("Sigrika Skill BGM");
    expect(html).toContain("Sigrika Dream BGM");
  });
});
