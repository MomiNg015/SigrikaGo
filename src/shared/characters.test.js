import { describe, expect, it } from "vitest";
import { CHARACTERS, characterList, characterListFromCatalog, mergeCharacters } from "./characters.js";

describe("character fallback", () => {
  it("keeps built-in characters available before API load", () => {
    expect(characterList.map((character) => character.id)).toContain("sigrika");
    expect(characterList.map((character) => character.id)).toContain("denia");
    expect(CHARACTERS.qiuyuan).toMatchObject({
      id: "qiuyuan",
      name: "仇远",
      portrait: "/assets/characters/qiuyuan.png",
      acquisitionMethod: "部员招募获得",
      skill: {
        id: "row-slash",
        name: "一斩足矣",
        costValue: "0",
        description: expect.stringContaining("超频+1")
      }
    });
    expect(CHARACTERS.lynae).toMatchObject({
      id: "lynae",
      name: "琳奈",
      portrait: "/assets/characters/lynae_centered.webp",
      skill: {
        id: "spray-stone",
        name: "流光溢彩",
        costValue: "4"
      }
    });
  });

  it("includes Mornye as a built-in recruitable admin-open character", () => {
    expect(CHARACTERS.mornye).toMatchObject({
      id: "mornye",
      name: "莫宁",
      portrait: "/assets/characters/mornye.png",
      acquisitionMethod: "招募获得",
      skill: {
        id: "protocol-takeover",
        name: "协议接管",
        costValue: "2",
        freeTurn: true
      }
    });
  });

  it("includes ChangLi as a built-in recruitable admin-open character", () => {
    expect(CHARACTERS.changli).toMatchObject({
      id: "changli",
      name: "长离",
      englishName: "ChangLi",
      portrait: "/assets/characters/changli.png",
      acquisitionMethod: "招募获得",
      skill: {
        id: "double-move",
        name: "谋定后动",
        costValue: "3",
        freeTurn: true,
        params: { moves: 2 }
      }
    });
  });

  it("includes Chisa as a built-in recruitable admin-open character", () => {
    expect(CHARACTERS.chisa).toMatchObject({
      id: "chisa",
      name: "千咲",
      englishName: "Chisa",
      portrait: "/assets/characters/chisa.png",
      acquisitionMethod: "招募获得",
      skill: {
        id: "liberty-purge",
        name: "虚湮解弦",
        costValue: "0",
        freeTurn: false
      }
    });
  });

  it("merges API characters over fallback fields without losing required display data", () => {
    const merged = mergeCharacters([
      { id: "sigrika", name: "", description: "API character description", skill: { name: "API Skill" } },
      { id: "custom", name: "Custom", skill: null },
      null,
      { name: "missing id" }
    ]);

    expect(Object.keys(merged)).toEqual(expect.arrayContaining(["sigrika", "denia", "custom"]));
    expect(merged.sigrika.name).toBe(CHARACTERS.sigrika.name);
    expect(merged.sigrika.description).toBe("API character description");
    expect(merged.sigrika.portrait).toBe(CHARACTERS.sigrika.portrait);
    expect(merged.sigrika.skill.name).toBe("API Skill");
    expect(merged.sigrika.skill.description).toBe(CHARACTERS.sigrika.skill.description);
    expect(merged.custom.portrait).toBe(CHARACTERS.sigrika.portrait);
    expect(merged.custom.skill.name).toBe(CHARACTERS.sigrika.skill.name);
  });

  it("falls back to built-in characters for empty or malformed API payloads", () => {
    expect(Object.keys(mergeCharacters([]))).toEqual(expect.arrayContaining(["sigrika", "denia"]));
    expect(Object.keys(mergeCharacters("bad payload"))).toEqual(expect.arrayContaining(["sigrika", "denia"]));
  });

  it("removes disabled built-in characters from merged fallback data", () => {
    const merged = mergeCharacters([{ id: "denia", name: "Danea" }], ["sigrika"]);

    expect(merged.sigrika).toBeUndefined();
    expect(merged.denia).toBeDefined();
  });

  it("keeps legacy character ids separate from the canonical built-in slot", () => {
    const merged = mergeCharacters([
      { id: "danea", name: "旧达妮娅", skill: { name: "Old Skill" } },
      { id: "denia", name: "达妮娅", skill: { name: "Canonical Skill" } }
    ]);

    expect(Object.keys(merged)).toContain("danea");
    expect(merged.denia.name).toBe("达妮娅");
    expect(merged.denia.skill.name).toBe("Canonical Skill");
  });

  it("sorts merged character catalogs by admin sort order", () => {
    const merged = mergeCharacters([
      { id: "denia", name: "Denia", sortOrder: 20 },
      { id: "sigrika", name: "Sigrika", sortOrder: 10 }
    ]);

    expect(characterListFromCatalog(merged).slice(0, 2).map((character) => character.id)).toEqual(["sigrika", "denia"]);
  });
});
