import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { readCssWithImports } from "../styles/cssTestUtils.js";
import CharacterChainBadge, { chainCountForCharacter } from "./CharacterChainBadge.jsx";
import { CHARACTERS } from "./characters.js";
import HouseCharacterGrid from "../modals/house/HouseCharacterGrid.jsx";

describe("CharacterChainBadge", () => {
  it("keeps chain counts hidden even when a character has duplicate-chain data", () => {
    expect(renderToStaticMarkup(createElement(CharacterChainBadge, {
      user: { characterChains: { denia: 3 } },
      characterId: "denia"
    }))).toBe("");

    expect(renderToStaticMarkup(createElement(CharacterChainBadge, {
      user: { characterChains: { denia: 6 } },
      characterId: "denia"
    }))).toBe("");
  });

  it("reads canonical character ids and adds portrait display hooks", () => {
    expect(chainCountForCharacter({ characterChains: { denia: 2 } }, "denia")).toBe(2);
    const homeSource = readFileSync(new URL("../home/components/PlayerPlaque.jsx", import.meta.url), "utf8");
    const houseSource = readFileSync(new URL("../modals/house/HouseCharacterGrid.jsx", import.meta.url), "utf8");
    const legacyHouseSource = readFileSync(new URL("../modals/house/LegacyHouseCharacterGrid.jsx", import.meta.url), "utf8");
    const roomSource = readFileSync(new URL("../room/PlayerInfo.jsx", import.meta.url), "utf8");
    const css = readCssWithImports(new URL("../styles/hud-components.css", import.meta.url));

    expect(homeSource).not.toContain("CharacterChainBadge");
    expect(houseSource).not.toContain("CharacterChainBadge");
    expect(houseSource).toContain("LegacyHouseCharacterGrid");
    expect(legacyHouseSource).toContain("<CharacterChainBadge");
    expect(roomSource).toContain("CharacterChainBadge");
    expect(css).toContain(".character-chain-badge");
  });

  it("hides duplicate-chain badges in both the normal puzzle and the legacy corrupted archive", () => {
    for (const sigrikaCorrupted of [false, true]) {
      const html = renderToStaticMarkup(createElement(HouseCharacterGrid, {
        characters: [CHARACTERS.sigrika, CHARACTERS.denia],
        owned: new Set(["sigrika", "denia"]),
        selectedCharacter: "sigrika",
        user: { characterChains: { sigrika: 6, denia: 3 }, sigrikaCandyArc: { corrupted: sigrikaCorrupted } },
        itemEffects: {}, audioSettings: {}, sigrikaCorrupted,
        onOpenCharacterDetail: () => {}, onSelectCharacter: () => {}
      }));
      expect(html).toContain(sigrikaCorrupted ? "is-corruption-focus" : "handbook-puzzle-board");
      expect(html).not.toContain("character-chain-badge");
    }
  });
});
