import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import CharacterChainBadge, { chainCountForCharacter } from "./CharacterChainBadge.jsx";

describe("CharacterChainBadge", () => {
  it("renders up to five yellow stars, then switches to multiplier text", () => {
    expect(renderToStaticMarkup(createElement(CharacterChainBadge, {
      user: { characterChains: { denia: 3 } },
      characterId: "denia"
    }))).toContain("★★★");

    expect(renderToStaticMarkup(createElement(CharacterChainBadge, {
      user: { characterChains: { denia: 6 } },
      characterId: "denia"
    }))).toContain("★×6");
  });

  it("normalizes aliased character ids and adds portrait display hooks", () => {
    expect(chainCountForCharacter({ characterChains: { denia: 2 } }, "danea")).toBe(2);
    const homeSource = readFileSync(new URL("../home/components/PlayerPlaque.jsx", import.meta.url), "utf8");
    const houseSource = readFileSync(new URL("../modals/house/HouseCharacterGrid.jsx", import.meta.url), "utf8");
    const roomSource = readFileSync(new URL("../room/PlayerInfo.jsx", import.meta.url), "utf8");
    const css = readFileSync(new URL("../styles/hud-components.css", import.meta.url), "utf8");

    expect(homeSource).toContain("CharacterChainBadge");
    expect(houseSource).toContain("CharacterChainBadge");
    expect(roomSource).toContain("CharacterChainBadge");
    expect(css).toContain(".character-chain-badge");
  });
});
