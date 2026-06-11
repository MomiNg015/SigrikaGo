import { PrismaClient } from "@prisma/client";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { rankFromRating } from "../src/shared/ratingRank.js";
import { parseItemEffects } from "./itemEffects.js";
import { parseAssetList, parseCharacterAssetList } from "./userAssets.js";
import { ownedMusicIdsWithDefaults, parseMusicSelections } from "../src/shared/musicLibrary.js";

export const prisma = new PrismaClient();

export const USER_ASSET_RELATION_INCLUDE = {
  userCharacters: true,
  userDecorations: true,
  userItems: true,
  userItemEffects: true,
  modeStats: true
};

export const USER_ASSET_RELATION_SELECT = {
  userCharacters: { select: { characterSlug: true } },
  userDecorations: { select: { decorationSlug: true } },
  userItems: { select: { itemId: true, quantity: true } },
  userItemEffects: { select: { effectKey: true, effectValue: true } },
  modeStats: { select: { mode: true, rating: true, wins: true, losses: true, draws: true } }
};

const AVAILABLE_CHARACTER_IDS = ["sigrika", "denia", "aemeath"];
const RATING_UNLOCKS = [
  { characterId: "nabomo", rating: 1400 }
];

export function publicUser(user) {
  const ownedCharacters = new Set(publicOwnedCharacters(user));
  for (const characterId of AVAILABLE_CHARACTER_IDS) ownedCharacters.add(characterId);
  for (const unlock of RATING_UNLOCKS) {
    if ((user.rating ?? 0) >= unlock.rating) ownedCharacters.add(unlock.characterId);
  }
  return {
    id: user.id,
    username: user.username,
    role: user.role ?? "player",
    status: user.status ?? "active",
    rank: rankFromRating(user.rating),
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    modeStats: publicModeStats(user),
    coins: user.coins,
    selectedCharacter: canonicalCharacterId(user.selectedCharacter),
    selectedStoneDecoration: user.selectedStoneDecoration ?? "",
    ownedCharacters: [...ownedCharacters],
    ownedItems: publicOwnedItems(user),
    itemEffects: publicItemEffects(user),
    ownedDecorations: publicOwnedDecorations(user),
    ownedMusicIds: ownedMusicIdsWithDefaults(user.ownedMusicIds),
    musicSelections: parseMusicSelections(user.musicSelections)
  };
}

function publicModeStats(user) {
  const rows = Array.isArray(user.modeStats) ? user.modeStats : [];
  const stats = {
    spark: {
      rating: Number(user.rating ?? 1000),
      wins: Number(user.wins ?? 0),
      losses: Number(user.losses ?? 0),
      draws: 0
    },
    standard: {
      rating: 1000,
      wins: 0,
      losses: 0,
      draws: 0
    }
  };
  for (const row of rows) {
    if (!stats[row.mode]) continue;
    stats[row.mode] = {
      rating: Number(row.rating ?? stats[row.mode].rating),
      wins: Number(row.wins ?? 0),
      losses: Number(row.losses ?? 0),
      draws: Number(row.draws ?? 0)
    };
  }
  return stats;
}

function publicOwnedCharacters(user) {
  const owned = new Set(parseCharacterAssetList(user.ownedCharacters));
  if (Array.isArray(user.userCharacters)) {
    for (const entry of user.userCharacters) {
      const characterId = canonicalCharacterId(entry.characterSlug);
      if (characterId) owned.add(characterId);
    }
  }
  return [...owned];
}

function publicOwnedDecorations(user) {
  const owned = new Set(parseAssetList(user.ownedDecorations));
  if (Array.isArray(user.userDecorations)) {
    for (const entry of user.userDecorations) {
      const decorationId = String(entry.decorationSlug ?? "").trim();
      if (decorationId) owned.add(decorationId);
    }
  }
  return [...owned];
}

function publicOwnedItems(user) {
  const counts = Object.fromEntries(
    publicOwnedItemsFromLegacy(user.ownedItems).map((item) => [item.itemId, item.quantity])
  );
  if (Array.isArray(user.userItems)) {
    for (const entry of user.userItems) {
      const itemId = String(entry.itemId ?? "").trim();
      const quantity = Number(entry.quantity) || 0;
      if (itemId && quantity > 0) counts[itemId] = Math.max(counts[itemId] ?? 0, quantity);
    }
  }
  return Object.entries(counts).map(([itemId, quantity]) => ({ itemId, quantity }));
}

function publicItemEffects(user) {
  const effects = parseItemEffects(user.itemEffects);
  if (Array.isArray(user.userItemEffects)) {
    for (const entry of user.userItemEffects) {
      const key = String(entry.effectKey ?? "").trim();
      const value = parseStructuredEffectValue(entry.effectValue);
      if (key && value !== false && value != null) effects[key] = value;
    }
  }
  return effects;
}

function publicOwnedItemsFromLegacy(value) {
  const text = String(value ?? "").trim();
  if (!text) return [];
  if (text.startsWith("{")) {
    try {
      return Object.entries(JSON.parse(text))
        .map(([itemId, quantity]) => ({ itemId, quantity: Number(quantity) || 0 }))
        .filter((item) => item.itemId && item.quantity > 0);
    } catch {
      return [];
    }
  }
  const counts = {};
  for (const itemId of text.split(",").map((item) => item.trim()).filter(Boolean)) {
    counts[itemId] = (counts[itemId] ?? 0) + 1;
  }
  return Object.entries(counts).map(([itemId, quantity]) => ({ itemId, quantity }));
}

function parseStructuredEffectValue(value) {
  if (value === "true") return true;
  if (value === "false") return false;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
