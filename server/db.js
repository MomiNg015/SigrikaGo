import { PrismaClient } from "@prisma/client";
import { canonicalCharacterId } from "../src/shared/characterAliases.js";
import { rankFromRating } from "../src/shared/ratingRank.js";

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
    ownedItems: user.ownedItems.split(",").filter(Boolean),
    ownedDecorations: user.ownedDecorations.split(",").filter(Boolean)
  };
}
