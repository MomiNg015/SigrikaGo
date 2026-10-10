import { DENIA_CANDY_PORTRAIT_ASSET } from "./characterPortraitAssetCatalog.js";
import { CHARACTERS } from "./characters.js";

export const DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID = "denia-rainbow-glow";

export const EXTRA_STORY_PORTRAITS = Object.freeze({
  [DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID]: Object.freeze({
    id: DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID,
    slug: DENIA_RAINBOW_GLOW_STORY_PORTRAIT_ID,
    name: "发彩虹光的达妮娅",
    portrait: DENIA_CANDY_PORTRAIT_ASSET.storyUrl,
    portraitUrl: DENIA_CANDY_PORTRAIT_ASSET.storyUrl,
    stillPortraitUrl: DENIA_CANDY_PORTRAIT_ASSET.storyStillUrl,
    avatarPortraitUrl: DENIA_CANDY_PORTRAIT_ASSET.avatarUrl,
    avatarStillPortraitUrl: DENIA_CANDY_PORTRAIT_ASSET.avatarStillUrl,
    fallbackAvatarPortraitUrl: "/assets/characters/handbook-chibi-sprites/denia-avatar.webp",
    fallbackPortraitUrl: "/assets/characters/handbook-chibi-sprites/denia.webp",
    presentation: "chibi"
  })
});

export function storyPortraitCatalog(characters = {}) {
  return {
    ...CHARACTERS,
    ...characterCatalogFromInput(characters),
    ...EXTRA_STORY_PORTRAITS
  };
}

export function storyPortraitOptions(characters = []) {
  const baseOptions = Array.isArray(characters)
    ? characters.map((character) => ({
      ...character,
      id: character.slug ?? character.id,
      slug: character.slug ?? character.id
    })).filter((character) => character.id)
    : Object.values(characterCatalogFromInput(characters));
  return [...baseOptions, ...Object.values(EXTRA_STORY_PORTRAITS)];
}

function characterCatalogFromInput(characters) {
  if (Array.isArray(characters)) {
    return Object.fromEntries(
      characters
        .map((character) => [character?.slug ?? character?.id, character])
        .filter(([id, character]) => id && character)
    );
  }
  return characters && typeof characters === "object" ? characters : {};
}
