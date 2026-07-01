import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { activeCharacterItemEffects, characterCandyPortrait, characterSortieDisabledReason, deriveCharacterRecordStats, selectSortieCharacter } from "./HouseModal.jsx";
import { DENIA_CANDY_PORTRAIT } from "../shared/candyPortraits.js";
import HouseModal from "./HouseModal.jsx";
import ResumeModal from "./ResumeModal.jsx";
import { CharacterDetailDialog, CharacterRecordsDialog } from "./house/HouseNestedDialogs.jsx";
import { sortCharacterStatsByGames, splitRecordSummary, UserProfileCard } from "./UserProfileCard.jsx";
import { readCssWithImports } from "../styles/cssTestUtils.js";

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

  it("splits profile record text into total games and result counts", () => {
    expect(splitRecordSummary("29局 · 15胜10负4和")).toEqual({
      total: "29局",
      breakdown: "15胜10负4和"
    });
    expect(splitRecordSummary("29局15胜10负4和")).toEqual({
      total: "29局",
      breakdown: "15胜10负4和"
    });
  });

  it("sorts profile character stats by total games descending", () => {
    expect(sortCharacterStatsByGames([
      { characterId: "denia", record: "14局 · 4胜10负0和" },
      { characterId: "aemeath", record: "38局 · 23胜14负1和" },
      { characterId: "sigrika", record: "21局 · 9胜12负0和" }
    ]).map((item) => item.characterId)).toEqual(["aemeath", "sigrika", "denia"]);
  });

  it("renders mobile-safe two-line record markup for profile and character records", () => {
    const profileHtml = renderToStaticMarkup(createElement(UserProfileCard, {
      user: {
        id: 1,
        username: "moming",
        rank: "3段",
        rating: 1160,
        record: "29局 · 15胜10负4和",
        characterId: "sigrika",
        characterStats: [],
        likeCount: 3,
        achievementEquipmentAssets: {
          nameplate: { imageUrl: "/assets/nameplate.png", name: "用户名背景" }
        }
      },
      characters: [{ id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp" }],
      token: "token"
    }));
    const recordHtml = renderToStaticMarkup(createElement(CharacterRecordsDialog, {
      characterRecords: [{
        character: { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp" },
        total: 29,
        wins: 15,
        losses: 10,
        draws: 4
      }],
      itemEffects: {},
      onClose: () => {}
    }));

    expect(profileHtml).toContain("profile-record-lines");
    expect(profileHtml).toContain("profile-record-total");
    expect(profileHtml).toContain("profile-record-breakdown");
    expect(profileHtml).toContain("profile-mode-tabs");
    expect(profileHtml).toContain("profile-social-actions");
    expect(profileHtml).toContain("profile-like-button");
    expect(profileHtml).toContain("profile-report-button");
    expect(profileHtml).toContain("text-rating-value");
    expect(profileHtml).toContain(">3</span>");
    expect(profileHtml).toContain("background-image:url(/assets/nameplate.png)");
    expect(profileHtml).toContain(">五子棋</button>");
    expect(profileHtml).not.toContain(">来下五子棋吗？</button>");
    expect(profileHtml).toContain("recent-result-label");
    expect(profileHtml).toContain("最近十盘的战绩");
    expect(profileHtml.indexOf("profile-mode-tabs")).toBeLessThan(profileHtml.indexOf("profile-resume-stats"));
    expect(profileHtml).not.toContain("3段 · 1160分");
    expect(recordHtml).toContain("character-record-total");
    expect(recordHtml).toContain("character-record-wins");
    expect(recordHtml).toContain("character-record-losses");
    expect(recordHtml).toContain("character-record-draws");
    expect(recordHtml).toContain("character-record-rate");
  });

  it("disables profile like and report actions for self and disables repeat daily likes", () => {
    const baseUser = {
      id: 1,
      username: "moming",
      rank: "3段",
      rating: 1160,
      record: "29局 · 15胜10负4和",
      characterId: "sigrika",
      characterStats: [],
      likeCount: 4
    };
    const characters = [{ id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp" }];
    const selfHtml = renderToStaticMarkup(createElement(UserProfileCard, {
      user: { ...baseUser, relation: "self" },
      characters,
      token: "token"
    }));
    const likedHtml = renderToStaticMarkup(createElement(UserProfileCard, {
      user: { ...baseUser, relation: "none", likedToday: true },
      characters,
      token: "token"
    }));

    expect(selfHtml).toMatch(/class="profile-like-button"[^>]*disabled=""/);
    expect(selfHtml).toMatch(/class="profile-report-button"[^>]*disabled=""/);
    expect(likedHtml).toMatch(/class="profile-like-button"[^>]*disabled=""/);
    expect(likedHtml).not.toMatch(/class="profile-report-button"[^>]*disabled=""/);
  });

  it("keeps the profile report dialog submit-only below the textarea", () => {
    const source = readFileSync(new URL("./UserProfileCard.jsx", import.meta.url), "utf8");
    const reportDialogStart = source.indexOf("{showReportDialog && (");
    const reportDialogEnd = source.indexOf("</section>\n  );", reportDialogStart);
    const reportDialogSource = source.slice(reportDialogStart, reportDialogEnd);

    expect(reportDialogStart).toBeGreaterThan(-1);
    expect(reportDialogSource).toContain('className="danger-action"');
    expect(reportDialogSource).toContain("disabled={reportPending || reportContent.trim().length === 0}");
    expect(reportDialogSource).not.toContain(">取消</button>");
  });

  it("marks house character cards with active item effect icons", () => {
    const itemEffects = {
      sigrikaCandyDisabled: true,
      deniaRainbowGlow: true
    };
    const html = renderToStaticMarkup(createElement(HouseModal, {
      user: {
        id: 1,
        username: "moming",
        rank: "1段",
        rating: 1000,
        coins: 0,
        ownedCharacters: ["sigrika", "denia"],
        ownedDecorations: [],
        selectedCharacter: "denia",
        itemEffects
      },
      records: [],
      characterListView: [
        { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp", skill: { name: "技能", description: "", cost: 1 } },
        { id: "denia", name: "达妮娅", portrait: "/assets/Danea_centered.webp", skill: { name: "技能", description: "", cost: 1 } }
      ],
      audioSettings: {},
      onClose: () => {},
      onSelectCharacter: () => {},
      onApplyDecoration: () => {}
    }));

    expect(activeCharacterItemEffects("sigrika", itemEffects)).toEqual([
      expect.objectContaining({
        effectKey: "sigrikaCandyDisabled",
        icon: "/assets/items/rainbow-bean-candy.webp"
      })
    ]);
    expect(activeCharacterItemEffects("denia", itemEffects)).toEqual([
      expect.objectContaining({
        effectKey: "deniaRainbowGlow",
        icon: "/assets/items/rainbow-bean-candy.webp"
      })
    ]);
    expect(activeCharacterItemEffects("aemeath", itemEffects)).toEqual([]);
    expect(html.match(/class="character-item-effect-icon"/g)).toHaveLength(2);
    expect(html).toContain("src=\"/assets/items/rainbow-bean-candy.webp\"");
    expect(html).toContain("alt=\"彩虹豆豆跳跳糖效果中\"");
    expect(html).toContain("title=\"彩虹豆豆跳跳糖效果中\"");
  });

  it("hides character chain badges in the house manual character grid", () => {
    const html = renderToStaticMarkup(createElement(HouseModal, {
      user: {
        id: 1,
        username: "moming",
        rank: "1段",
        rating: 1000,
        coins: 0,
        ownedCharacters: ["sigrika", "denia"],
        ownedDecorations: [],
        selectedCharacter: "denia",
        characterChains: { denia: 3 },
        itemEffects: {}
      },
      records: [],
      characterListView: [
        { id: "sigrika", name: "西格莉卡", portrait: "/assets/sigrika_centered.webp", skill: { name: "技能", description: "", cost: 1 } },
        { id: "denia", name: "达妮娅", portrait: "/assets/Danea_centered.webp", skill: { name: "技能", description: "", cost: 1 } }
      ],
      audioSettings: {},
      onClose: () => {},
      onSelectCharacter: () => {},
      onApplyDecoration: () => {}
    }));

    expect(html).not.toContain("character-chain-badge");
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

  it("stops active character voice playback when house detail surfaces close", () => {
    const source = readFileSync(new URL("./HouseModal.jsx", import.meta.url), "utf8");

    expect(source).toContain("function closeCharacterDetail()");
    expect(source).toContain("function closeHouseModal()");
    expect(source).toContain("function playCharacterDetailVoice(character)");
    expect(source.match(/stopVoicePlayback\(\);/g)).toHaveLength(2);
    expect(source).toContain("onClose={closeCharacterDetail}");
    expect(source).toContain("onPlayDetailVoice={() => playCharacterDetailVoice(detailCharacter)}");
    expect(source).toContain("onClick={closeHouseModal}");
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
    expect(html).toContain("lock-text-title text-display-accent");
    expect(html).toContain("<strong class=\"text-display-accent\">LOADING... (x_x)</strong>");
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
    expect(html.indexOf("mode-tabs")).toBeLessThan(html.indexOf("resume-replay-action"));
    expect(html).toContain(">五子棋</button>");
    expect(html).not.toContain(">来下五子棋吗？</button>");
    expect(html.indexOf("resume-replay-action")).toBeLessThan(html.indexOf("top-stats-bar"));
    expect(html).toContain("top-stats-bar");
    expect(html).toContain("text-rating-value");
    expect(html).toContain("resume-wallet");
    expect(html).toContain("achievement-entry-action");
    expect(html).toContain("personalization-entry-action");
    expect(html).not.toContain("blue-gem-wallet");
    expect(html).toContain("对局回放");
    expect(html).toContain("战绩");
    expect(html).toContain("段位");
    expect(html).toContain("profile-record-lines");
    expect(html).toContain("profile-record-total");
    expect(html).toContain("profile-record-breakdown");
    expect(html).toContain("recent-result-label");
    expect(html).toContain("最近十盘的战绩");
    expect(html).toContain("resume-character-records");
    expect(html).toContain("角色战绩");
    expect(html).toContain("character-record-list");
    expect(html).toContain("character-record-row");
    expect(html).not.toContain("character-record-dialog");
    expect(html).toContain("金币");

    const modalCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/modals.css", import.meta.url));
    const mobileModalCss = readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const resumeSource = readFileSync(new URL("./ResumeModal.jsx", import.meta.url), "utf8");
    expect(modalCss).toContain(".modal-backdrop .resume-header-actions .close-button");
    expect(modalCss).toContain(".modal-backdrop .resume-header-actions .resume-wallet");
    expect(modalCss).toContain("grid-template-columns: max-content minmax(0, 1fr) max-content var(--modal-close-size, 44px);");
    expect(modalCss).toContain(".resume-header-actions {\n  margin-left: 0;\n  position: static;");
    expect(modalCss).toContain("justify-self: end;");
    expect(modalCss).toContain(".resume-modal .resume-header > .resume-header-actions");
    expect(modalCss).toContain("grid-column: 3;");
    expect(modalCss).toContain(".resume-modal .resume-header > .resume-close-button");
    expect(modalCss).toContain("grid-column: 4;");
    expect(brightSchoolCss).toContain(".resume-modal > .resume-header");
    expect(brightSchoolCss).toContain("display: grid !important");
    expect(brightSchoolCss).toContain("grid-template-columns: max-content minmax(0, 1fr) max-content var(--modal-close-size, 44px) !important");
    expect(brightSchoolCss).toContain(".resume-modal > .resume-header > .resume-header-actions");
    expect(brightSchoolCss).toContain("grid-column: 3 !important");
    expect(brightSchoolCss).toContain(".resume-modal > .resume-header > .resume-close-button");
    expect(brightSchoolCss).toContain("grid-column: 4 !important");
    expect(modalCss).toContain(".resume-title-actions .achievement-entry-action");
    expect(modalCss).toContain("background: #ffe4ee;");
    expect(modalCss).toContain(".resume-title-actions .personalization-entry-action");
    expect(modalCss).toContain("background: #e5f4ff;");
    expect(modalCss).toContain("min-height: var(--modal-close-size, 44px);");
    expect(modalCss).toContain("padding-right: 0;");
    expect(modalCss).toContain(".resume-character-records");
    expect(modalCss).toContain(".resume-character-records .character-record-list");
    expect(modalCss).toContain("max-height: none;");
    expect(mobileModalCss).toContain(".resume-header-actions .close-button");
    expect(mobileModalCss).toContain("min-height: var(--modal-close-size, 44px);");
    expect(finalMobileCss).toContain(".resume-character-records");
    expect(finalMobileCss).toContain(".resume-header-actions {\n    position: absolute !important;");
    expect(finalMobileCss).toContain("right: 0 !important");
    expect(finalMobileCss).toContain("justify-self: auto !important");
    expect(finalMobileCss).toContain(".resume-modal > .resume-header");
    expect(finalMobileCss).toContain("grid-template-columns: minmax(0, 1fr) minmax(0, 48%) !important");
    expect(finalMobileCss).toContain(".resume-modal > .resume-header > .resume-header-actions");
    expect(finalMobileCss).toContain("grid-area: wallet !important");
    expect(finalMobileCss).toContain("grid-column: auto !important");
    expect(finalMobileCss).toContain("max-width: 100% !important");
    expect(finalMobileCss).toContain("flex-wrap: nowrap !important");
    expect(finalMobileCss).toContain(".resume-modal > .resume-header > .resume-close-button");
    expect(finalMobileCss).toContain("grid-area: close !important");
    expect(finalMobileCss).toContain("visibility: visible !important");
    expect(resumeSource).not.toContain("showCharacterRecords");
    expect(resumeSource).not.toContain("CharacterRecordsDialog");
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
    const css = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
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
    expect(closeButtonBlock).toContain("position: absolute");
    expect(closeButtonBlock).toContain("top: var(--modal-close-inset, 12px)");
    expect(closeButtonBlock).toContain("right: var(--modal-close-inset, 12px)");
    expect(closeButtonBlock).toContain("width: var(--modal-close-size, 44px)");
    expect(closeButtonBlock).toContain("height: var(--modal-close-size, 44px)");
    expect(closeButtonBlock).toContain("z-index: 20");
    expect(closeButtonBlock).toContain("pointer-events: auto");
  });

  it("renders character descriptions in the character detail dialog", () => {
    const styles = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const brightSchoolStyles = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url))
      + readCssWithImports(new URL("../styles/themes/bright-school/surface-contracts.css", import.meta.url));
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
    expect(html).not.toContain("skill-cost-badge");
    expect(html).not.toMatch(/class="character-description"><strong>/);
    expect(html).toContain("来自星辉社团的棋手。");
    expect(styles).toMatch(/\.character-description\s*\{[^}]*font-style:\s*italic;/s);
    expect(styles).toMatch(/\.character-description\s*\{[^}]*color:\s*#7b3fa0;/s);
    expect(styles).toMatch(/\.character-detail-copy p\s*\{[^}]*text-align:\s*left;/s);
    expect(brightSchoolStyles).toContain(".character-details-modal .character-description");
    expect(brightSchoolStyles).toContain(".character-detail-copy .character-description");
    expect(brightSchoolStyles).toContain("color: #7b3fa0 !important");
    expect(brightSchoolStyles).toContain(".character-detail-copy .character-description");
    expect(brightSchoolStyles).toContain("text-align: left !important");
  });

  it("renders optional character CV labels without default link styling", () => {
    const html = renderToStaticMarkup(createElement(CharacterDetailDialog, {
      character: {
        id: "sigrika",
        name: "西格莉卡",
        cvName: "配音者",
        cvUrl: "https://example.com/cv",
        portrait: "/assets/sigrika_centered.webp",
        skill: { name: "星辉符文", description: "抹除交叉点。", cost: 3 }
      },
      detailOwned: true,
      itemEffects: {},
      onClose: () => {}
    }));
    const noCvHtml = renderToStaticMarkup(createElement(CharacterDetailDialog, {
      character: {
        id: "denia",
        name: "达妮娅",
        portrait: "/assets/Danea_centered.webp",
        skill: { name: "泡影幻梦", description: "翻转棋子。", cost: 4 }
      },
      detailOwned: true,
      itemEffects: {},
      onClose: () => {}
    }));
    const unsafeLinkHtml = renderToStaticMarkup(createElement(CharacterDetailDialog, {
      character: {
        id: "aemeath",
        name: "爱弥斯",
        cvName: "配音者",
        cvUrl: "javascript:alert(1)",
        portrait: "/assets/Aemeath_centered.webp",
        skill: { name: "小爱出击", description: "隐藏手。", cost: 0 }
      },
      detailOwned: true,
      itemEffects: {},
      onClose: () => {}
    }));
    const css = readCssWithImports(new URL("../styles/modals.css", import.meta.url));

    expect(html).toContain("character-detail-title-line");
    expect(html).toContain("class=\"character-cv-label\"");
    expect(html).toContain("CV：配音者");
    expect(html).toContain("href=\"https://example.com/cv\"");
    expect(html).toContain("target=\"_blank\"");
    expect(html).toContain("rel=\"noreferrer\"");
    expect(noCvHtml).not.toContain("character-cv-label");
    expect(unsafeLinkHtml).toContain("<span class=\"character-cv-label\">CV：配音者</span>");
    expect(unsafeLinkHtml).not.toContain("javascript:alert");
    expect(css).toContain(".character-detail-title-line");
    expect(css).toContain("align-items: baseline;");
    expect(css).toMatch(/\.character-cv-label\s*\{[^}]*display:\s*block;[^}]*color:\s*inherit;[^}]*text-decoration:\s*none;[^}]*transform:\s*none;[^}]*white-space:\s*nowrap;/s);
    expect(css).toContain(".character-cv-label:link");
    expect(css).toContain(".character-cv-label:visited");
    expect(css).toMatch(/\.character-cv-label:visited,\s*\.character-cv-label:hover,\s*\.character-cv-label:active\s*\{[^}]*filter:\s*none;[^}]*transform:\s*none;/s);
    expect(css).toContain(".character-cv-label:focus-visible");
    const brightSchoolCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));
    expect(brightSchoolCss).toMatch(/\.character-cv-label\s*\{[^}]*min-height:\s*0\s*!important;/s);
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
    expect(html).toContain("character-music-sketch");
    expect(html).toContain("Sigrika Skill BGM");
    expect(html).not.toContain("character-music-select");
    const css = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    expect(css).toContain(".character-detail-heading");
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) minmax(150px, 188px);");
    expect(css).toContain("padding-right: calc(var(--modal-close-size, 44px) + 12px);");
    expect(css).toContain("background-color: transparent;");
    expect(css).toContain(".character-detail-title-line");
    expect(css).toMatch(/\.character-detail-heading h3\s*\{[^}]*white-space:\s*nowrap;[^}]*word-break:\s*keep-all;[^}]*writing-mode:\s*horizontal-tb;/s);
    expect(css).toContain("width: 188px;");
    expect(css).toContain("height: 38px;");
    expect(css).toContain(".character-music-sketch");
    expect(css).toContain("pointer-events: none;");
    expect(css).toContain("vector-effect: non-scaling-stroke;");
    expect(css).toContain("repeating-linear-gradient(0deg");
    expect(css).toMatch(/\.character-music-player\s*\{[^}]*border:\s*0;/s);
    expect(css).toMatch(/\.character-music-toggle\s*\{[^}]*border:\s*0;/s);
    expect(css).toContain(".character-music-toggle::before");
    expect(css).toContain("font-weight: 950;");
    expect(css).toContain(".character-music-player.is-loading .character-music-toggle");
    expect(css).toContain(".character-music-player.is-playing .character-music-toggle");
    expect(css).toMatch(/\.character-music-toggle:hover:not\(:disabled\),\s*\.character-music-toggle:focus-visible\s*\{[^}]*transform:\s*translateY\(-1px\);/s);

    const phoneCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));
    const brightSchoolDesktopCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));
    const brightSchoolMobileCss = readCssWithImports(new URL("../styles/themes/bright-school/mobile.css", import.meta.url))
      + readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(brightSchoolDesktopCss).toContain("border: 0 !important");
    expect(brightSchoolDesktopCss).toContain(".character-music-toggle::before");
    expect(phoneCss).toContain("grid-template-columns: minmax(0, 1fr) minmax(136px, 164px);");
    expect(phoneCss).toContain("flex-direction: column;");
    expect(phoneCss).toContain("width: min(164px, 48vw);");
    expect(phoneCss).toContain("justify-self: end;");
    expect(finalMobileCss).toContain("grid-template-columns: minmax(0, 1fr) minmax(136px, 164px) !important");
    expect(finalMobileCss).toContain("flex-direction: column !important");
    expect(finalMobileCss).toContain("padding-right: 0 !important");
    expect(finalMobileCss).toContain("width: min(164px, 48vw) !important");
    expect(finalMobileCss).toContain("writing-mode: horizontal-tb !important");
    expect(brightSchoolMobileCss).toContain(".character-detail-heading h3");
    expect(brightSchoolMobileCss).toContain(".character-cv-label");
    expect(brightSchoolMobileCss).toContain("white-space: nowrap !important");
    expect(brightSchoolMobileCss).toContain("text-align: left !important");
  });

  it("keeps the Bright School mobile house manual internally scrollable", () => {
    const css = readCssWithImports(new URL("../styles/themes/bright-school/mobile.css", import.meta.url));
    const brightSchoolEffectsCss = readCssWithImports(new URL("../styles/themes/bright-school/effects.css", import.meta.url));
    const finalMobileCss = readCssWithImports(new URL("../styles/mobile-adaptive.css", import.meta.url));

    expect(css).toContain(".house-modal");
    expect(css).toContain("grid-template-rows: auto auto minmax(0, 1fr) auto !important");
    expect(css).toContain(".resume-modal");
    expect(css).toContain(".house-modal .profile-grid.top-stats-bar");
    const modalCss = readCssWithImports(new URL("../styles/modals.css", import.meta.url));

    expect(modalCss).toContain(".resume-modal .profile-grid.top-stats-bar");
    expect(modalCss).toContain("grid-template-rows: auto auto minmax(0, 1fr);");
    expect(modalCss).toContain("overflow: visible;");
    expect(modalCss).toContain(".resume-modal {\n  width: min(620px, 100%);\n  display: grid;\n  grid-template-rows: auto auto auto minmax(0, 1fr);");
    expect(modalCss).toContain("max-height: calc(100dvh - 32px);");
    expect(modalCss).toContain("overflow: hidden;");
    expect(modalCss).toContain(".resume-character-records {\n  display: grid;\n  grid-template-rows: auto minmax(0, 1fr);");
    expect(modalCss).toContain(".resume-character-records .character-record-list");
    expect(modalCss).toContain("overscroll-behavior: contain;");
    expect(modalCss).toContain("max-height: none;");
    expect(modalCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(modalCss).toContain("white-space: nowrap;");
    expect(modalCss).toContain("word-break: keep-all;");
    expect(modalCss).toContain(".room-floating-modal.user-profile-modal");
    expect(modalCss).toContain("max-height: min(760px, calc(100dvh - 32px));");
    expect(modalCss).toContain(".profile-character-list");
    expect(modalCss).toContain("max-height: min(260px, 34dvh);");
    expect(modalCss).toContain(".profile-resume-hero img");
    expect(modalCss).toContain("filter: none;");
    expect(modalCss).toContain(".profile-identity-block :where(.user-identity, .user-identity-main, .user-identity-name-tag)");
    expect(modalCss).toContain("background-color: transparent;");
    expect(modalCss).toContain("min-height: 38px;");
    expect(modalCss).toContain("min-width: 58px;");
    expect(modalCss).toContain(".profile-replay-button {");
    expect(modalCss).toContain("background: #e4f6f0;");
    expect(modalCss).toContain(".profile-replay-button:disabled");
    expect(modalCss).toContain(".profile-relation-actions button:disabled");
    expect(modalCss).toContain("background: linear-gradient(135deg, #ececef, #d9d9dd);");
    expect(modalCss).toContain(".confirm-inline-modal");
    expect(modalCss).toContain("position: fixed;");
    expect(modalCss).toContain("inset: 50% auto auto 50%;");
    expect(modalCss).toContain("transform: translate(-50%, -50%);");
    expect(modalCss).toContain("max-height: calc(100dvh - 32px);");
    expect(modalCss).toContain(".profile-like-button:active:not(:disabled)");
    expect(modalCss).toContain("transform: translateY(2px);");
    expect(modalCss).toContain("box-shadow: 0 2px 0 rgba(79, 61, 85, 0.12);");
    const brightSchoolModalCss = readCssWithImports(new URL("../styles/themes/bright-school/modals.css", import.meta.url));
    const brightSchoolComponentCss = readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url));
    const finalThemeCss = readCssWithImports(new URL("../styles/themes.css", import.meta.url));
    expect(brightSchoolModalCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .resume-modal {\n  grid-template-rows: auto auto auto minmax(0, 1fr) !important;");
    expect(brightSchoolModalCss).toContain("max-height: calc(100dvh - 32px) !important;");
    expect(brightSchoolModalCss).toContain("overflow: hidden !important;");
    expect(brightSchoolModalCss).toContain(".mode-tabs button[aria-selected=\"true\"]");
    expect(brightSchoolModalCss).toContain("background: #ff9ebb !important");
    expect(brightSchoolComponentCss).toContain(".user-profile-card .profile-identity-block :is(.user-identity, .user-identity-main, .user-identity-name-tag)");
    expect(brightSchoolComponentCss).toContain("background-color: transparent !important");
    expect(brightSchoolComponentCss).toContain(".user-profile-card .profile-chain-portrait > img");
    expect(brightSchoolComponentCss).toContain("border: 0 !important");
    expect(brightSchoolComponentCss).toContain("background: #dff1ff !important");
    expect(brightSchoolComponentCss).toContain("background: #ff6f7d !important");
    expect(brightSchoolComponentCss).toContain("box-shadow: 2px 2px 0 var(--bright-border) !important");
    expect(brightSchoolComponentCss).toContain(":is(.profile-like-button, .profile-report-button):active:not(:disabled)");
    expect(brightSchoolComponentCss).toContain("transform: translateY(2px) !important");
    expect(brightSchoolComponentCss).toContain(".user-profile-card .profile-replay-button");
    expect(brightSchoolComponentCss).toContain("background: #e4f6f0 !important");
    expect(brightSchoolComponentCss).toContain(":is(.profile-replay-button:disabled, .profile-relation-actions button:disabled)");
    expect(brightSchoolComponentCss).toContain("background: linear-gradient(135deg, #ececef, #d9d9dd) !important");
    expect(finalThemeCss.lastIndexOf(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .profile-report-dialog"))
      .toBeGreaterThan(finalThemeCss.lastIndexOf("width: min(1120px, calc(100vw - 32px)) !important"));
    const lobbyCss = readCssWithImports(new URL("../styles/lobby.css", import.meta.url));
    expect(lobbyCss).toContain(".character-item-effect-badges");
    expect(lobbyCss).toContain(".character-item-effect-icon");
    expect(lobbyCss).toContain(".character-card .character-item-effect-icon");
    expect(readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url))).toContain(".house-modal .character-item-effect-icon");
    expect(readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url))).toContain(".house-modal .character-card.portrait-card .character-item-effect-icon");
    expect(readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url))).toContain("width: 24px;");
    expect(readCssWithImports(new URL("../styles/themes/bright-school/component-repairs.css", import.meta.url))).toContain(".character-item-effect-icon");
    expect(css).toContain(".house-modal .character-item-effect-icon");
    expect(css).toContain(".house-modal .stat strong");
    expect(css).toContain("white-space: nowrap !important");
    expect(css).toContain(".house-modal .character-card.portrait-card > strong");
    expect(css).toContain(".house-modal .character-card.portrait-card > strong {");
    expect(css).toContain("display: none !important");
    expect(css).toContain(".house-modal .stat-tip");
    expect(css).toContain("position: fixed !important");
    expect(css).toContain("transform: none !important");
    expect(css).toContain("overflow-wrap: anywhere !important");
    expect(css).toContain(".resume-modal .profile-grid.top-stats-bar");
    expect(css).toContain("grid-template-columns: 1fr !important");
    expect(css).toContain(".resume-modal .profile-resume-stats");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr)) !important");
    expect(css).toContain("grid-template-rows: none !important");
    expect(css).toContain("grid-auto-rows: 88px !important");
    expect(css).toContain("overflow-y: auto !important");
    expect(css).toContain(".character-card.portrait-card .lock-text-title");
    expect(css).toContain("box-sizing: border-box !important");
    expect(css).toContain(".house-modal .owned-decoration-section");
    expect(readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url))).toContain(".resume-modal .profile-grid.top-stats-bar");
    expect(readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url))).toContain("grid-template-columns: 1fr;");
    expect(readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url))).toContain("grid-template-rows: auto auto minmax(0, 1fr);");
    expect(readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url))).toContain(".resume-modal .profile-resume-stats");
    expect(readCssWithImports(new URL("../styles/mobile-modals.css", import.meta.url))).toContain("grid-template-columns: repeat(3, minmax(0, 1fr));");
    expect(css).toContain("grid-template-columns: repeat(auto-fill, minmax(54px, 1fr)) !important");
    expect(css).toContain(".house-modal .owned-decoration-chip strong");
    expect(css).toContain(".character-record-dialog");
    expect(css).toContain("width: min(420px, calc(100vw - 20px)) !important");
    expect(css).toContain(".character-record-row span");
    expect(css).toContain(".character-record-rate");
    expect(css).toContain("word-break: keep-all !important");
    expect(css).toContain(".character-detail-art img");
    expect(css).toContain("filter: none !important");
    expect(css).toContain("max-height: min(128px, 20dvh) !important");
    expect(finalMobileCss).toContain(".profile-grid.top-stats-bar .stat strong");
    expect(finalMobileCss).toContain(".user-profile-card .profile-mode-tabs");
    expect(finalMobileCss).toContain(".user-profile-card .profile-resume-hero");
    expect(finalMobileCss).toContain("grid-template-columns: 86px minmax(0, 1fr) !important");
    expect(finalMobileCss).toContain("justify-items: start !important");
    expect(finalMobileCss).toContain("text-align: left !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-social-actions");
    expect(finalMobileCss).toContain("height: 22px !important");
    expect(finalMobileCss).toContain("min-width: 40px !important");
    expect(finalMobileCss).toContain("width: 22px !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-like-button:disabled");
    expect(finalMobileCss).toContain(".user-profile-card .profile-report-button:disabled");
    expect(finalMobileCss).toContain(".profile-report-dialog");
    expect(finalMobileCss).toContain(".app-shell.player-theme-enabled.theme-bright-school.theme-bright-school .profile-report-dialog");
    expect(finalMobileCss).toContain("width: min(420px, calc(100vw - 44px)) !important");
    expect(finalMobileCss).toContain("transform: translate(-50%, -50%) !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-footer-actions");
    expect(finalMobileCss).toContain("grid-template-columns: max-content minmax(0, max-content) !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-replay-button");
    expect(finalMobileCss).toContain("background: #e4f6f0 !important");
    expect(finalMobileCss).toContain("border-color: #73b79f !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-relation-actions button:disabled");
    expect(finalMobileCss).toContain("background: linear-gradient(135deg, #ececef, #d9d9dd) !important");
    expect(finalMobileCss).toContain("cursor: not-allowed !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-resume-stats > span");
    expect(finalMobileCss).toContain("align-content: center !important");
    expect(finalMobileCss).toContain("justify-items: center !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-record-total");
    expect(finalMobileCss).toContain("font-size: clamp(17px, 5.1vw, 20px) !important");
    expect(finalMobileCss).toContain("font-size: clamp(11px, 3.05vw, 13px) !important");
    expect(finalMobileCss).toContain(".user-profile-card .profile-character-row");
    expect(finalMobileCss).toContain("overflow-x: hidden !important");
    expect(finalMobileCss).toContain("border-radius: 0 !important");
    expect(finalMobileCss).toContain("grid-template-columns: 38px minmax(48px, 0.72fr) repeat(4, minmax(24px, 0.34fr)) minmax(38px, 0.48fr) !important");
    expect(finalMobileCss).toContain(".profile-character-rate");
    expect(finalMobileCss).toContain(".user-profile-card .profile-record-breakdown");
    expect(finalMobileCss).toContain("font-size: clamp(12px, 3.45vw, 16px) !important");
    expect(finalMobileCss).toContain("white-space: nowrap !important");
    expect(finalMobileCss).toContain("word-break: normal !important");
    expect(finalMobileCss).toContain(".resume-header-actions .close-button");
    expect(finalMobileCss).toContain("position: static !important");
    expect(finalMobileCss).toContain(".resume-modal .profile-grid.top-stats-bar");
    expect(finalMobileCss).toContain("grid-template-columns: 1fr !important");
    expect(finalMobileCss).toContain("grid-template-rows: auto auto minmax(0, 1fr) !important");
    expect(finalMobileCss).toContain(".resume-modal .profile-resume-stats");
    expect(finalMobileCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr)) !important");
    expect(finalMobileCss).toContain(".resume-modal .profile-rank-results");
    expect(finalMobileCss).toContain(".resume-character-records");
    expect(finalMobileCss).toContain(".resume-character-records .character-record-list");
    expect(finalMobileCss).toContain("height: 100% !important");
    expect(finalMobileCss).toContain("max-height: none !important");
    expect(finalMobileCss).toContain(".resume-character-records > strong");
    expect(finalMobileCss).toContain("background: transparent !important");
    expect(finalMobileCss).toContain("box-shadow: none !important");
    expect(finalMobileCss).toContain("justify-self: end !important");
    expect(finalMobileCss).toContain("text-align: right !important");
    expect(finalMobileCss).toContain("font-variant-numeric: tabular-nums !important");
    expect(modalCss).toContain(".profile-rank-results::after");
    expect(modalCss).toContain("display: flex;");
    expect(modalCss).toContain("flex-wrap: wrap;");
    expect(modalCss).toContain(".profile-rank-results .recent-result-label");
    expect(modalCss).toContain("flex: 0 0 100%;");
    expect(modalCss).toContain("content: none;");
    expect(modalCss).not.toContain("content: \"显示最近十盘的战绩\";");
    expect(modalCss).toContain("color: #1f1714;");
    expect(modalCss).toContain("z-index: 2;");
    expect(modalCss).toContain("border: 2px solid #3d2b25");
    expect(modalCss).toContain("box-shadow: 4px 5px 0 rgba(61, 43, 37, 0.2)");
    expect(finalMobileCss).toContain(".mode-tabs button[aria-selected=\"true\"]");
    expect(finalMobileCss).toContain("background: #ff9ebb !important");
    expect(finalMobileCss).toContain(".character-card.portrait-card.is-deployed");
    expect(finalMobileCss).toContain("#4f9b69");
    expect(brightSchoolEffectsCss).toContain(".sortie-button.selected");
    expect(brightSchoolEffectsCss).toContain("background: #ff9ebb !important");
    expect(brightSchoolEffectsCss).toContain("border: 2px solid #3d2b25 !important");
    expect(finalMobileCss).toContain(".character-card.portrait-card.is-deployed .sortie-button.selected");
    expect(finalMobileCss).toContain("background: #ff9ebb !important");
    expect(finalMobileCss).toContain(".house-modal .character-list");
    expect(finalMobileCss).toContain("grid-template-columns: repeat(3, minmax(0, 1fr)) !important");
    expect(finalMobileCss).toContain("grid-auto-rows: 88px !important");
    expect(finalMobileCss).toContain("repeat(auto-fill, minmax(58px, 70px)) !important");
    expect(finalMobileCss).toContain(".house-modal .deploy-tag");
    expect(finalMobileCss).toContain("display: none !important");
    expect(finalMobileCss).toContain(".character-record-row");
    expect(finalMobileCss).toContain("grid-template-columns: 42px minmax(52px, 0.82fr) repeat(4, minmax(24px, 0.34fr)) minmax(38px, 0.5fr) !important");
    expect(finalMobileCss).toContain(".resume-character-records .character-record-row");
    expect(finalMobileCss).toContain("grid-template-columns: 38px minmax(48px, 0.58fr) repeat(4, minmax(24px, 0.32fr)) minmax(38px, 0.42fr) !important");
    expect(finalMobileCss).toContain(".resume-character-records .character-record-row :is(.character-record-total, .character-record-wins, .character-record-losses, .character-record-draws, .character-record-rate)");
    expect(finalMobileCss).toContain(".profile-record-lines");
    expect(finalMobileCss).toContain(".profile-record-separator");
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

  it("makes the character description area replay the detail voice", () => {
    const html = renderToStaticMarkup(createElement(CharacterDetailDialog, {
      character: {
        id: "mornye",
        name: "Mornye",
        portrait: "/assets/mornye.png",
        description: "Protocol details.",
        skill: { name: "Skill", description: "Ban a point.", cost: 1 }
      },
      detailOwned: true,
      itemEffects: {},
      user: {},
      audioSettings: {},
      onPlayDetailVoice: () => {},
      onSelectCharacterMusic: () => {},
      onClose: () => {}
    }));

    expect(html).toContain("class=\"character-description\"");
    expect(html).toContain("role=\"button\"");
    expect(html).toContain("tabindex=\"0\"");
  });
});
