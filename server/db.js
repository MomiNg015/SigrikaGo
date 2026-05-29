import { PrismaClient } from "@prisma/client";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { rankFromRating } from "../src/shared/ratingRank.js";
import { parseItemEffects } from "./itemEffects.js";

export const prisma = new PrismaClient();

const AVAILABLE_CHARACTER_IDS = ["sigrika", "denia", "aemeath"];
const RATING_UNLOCKS = [
  { characterId: "nabomo", rating: 1400 }
];

export function publicUser(user) {
  const ownedCharacters = new Set(user.ownedCharacters.split(",").filter(Boolean).map(canonicalCharacterId));
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
    coins: user.coins,
    selectedCharacter: canonicalCharacterId(user.selectedCharacter),
    selectedStoneDecoration: user.selectedStoneDecoration ?? "",
    ownedCharacters: [...ownedCharacters],
    ownedItems: publicOwnedItems(user.ownedItems),
    itemEffects: parseItemEffects(user.itemEffects),
    ownedDecorations: user.ownedDecorations.split(",").filter(Boolean)
  };
}

function publicOwnedItems(value) {
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
