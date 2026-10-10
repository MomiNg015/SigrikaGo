import { canonicalCharacterId } from "./characterAliases.js";
import { resolveCharacterPortraitPresentation } from "./characterPortraits.js";
import { storySpriteUrl } from "./characterStorySprites.js";

export const RESULT_CHARACTER_EXPRESSIONS = Object.freeze({
  sigrika: { win: "smile", loss: "sad" },
  denia: { win: "playful", loss: "annoyed" },
  aemeath: { win: "closed_smile", loss: "wry" },
  lynae: { win: "playful", loss: "sad" },
  mornye: { win: "smile", loss: "worried" },
  chisa: { win: "closed_smile", loss: "sad" },
  changli: { win: "confident", loss: "serious" },
  qiuyuan: { win: "determined", loss: "wry" },
  nabomo: { win: "wink", loss: "sad" }
});

export function resolveResultCharacterPortrait(character = {}, { outcome, ...options } = {}) {
  const fallback = resolveCharacterPortraitPresentation(character, options);
  const id = canonicalCharacterId(character.id ?? character.slug);
  const expressions = RESULT_CHARACTER_EXPRESSIONS[id];
  const expressionId = expressions && (outcome === "draw" ? "surprised" : expressions[outcome]);
  if (!expressionId) return { ...fallback, expressionId: "", fallback };
  // Result reactions deliberately use the authored default outfit. Account
  // equipment and frozen appearances are retained for same-character recovery.
  return { src: storySpriteUrl(id, expressionId), expressionId, fallback };
}

export function resultCharacterPortraitUrls(character = {}) {
  return [...new Set(["win", "loss", "draw"].map((outcome) => (
    resolveResultCharacterPortrait(character, { outcome }).src
  )).filter(Boolean))];
}
