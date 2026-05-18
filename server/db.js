import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const AVAILABLE_CHARACTER_IDS = ["sigrika", "danea", "aemeath"];
const RATING_UNLOCKS = [
  { characterId: "nabomo", rating: 1400 }
];

export function publicUser(user) {
  const ownedCharacters = new Set(user.ownedCharacters.split(",").filter(Boolean));
  for (const characterId of AVAILABLE_CHARACTER_IDS) ownedCharacters.add(characterId);
  for (const unlock of RATING_UNLOCKS) {
    if ((user.rating ?? 0) >= unlock.rating) ownedCharacters.add(unlock.characterId);
  }
  return {
    id: user.id,
    username: user.username,
    role: user.role ?? "player",
    status: user.status ?? "active",
    rank: user.rank,
    rating: user.rating,
    wins: user.wins,
    losses: user.losses,
    coins: user.coins,
    selectedCharacter: user.selectedCharacter,
    ownedCharacters: [...ownedCharacters],
    ownedItems: user.ownedItems.split(",").filter(Boolean),
    ownedDecorations: user.ownedDecorations.split(",").filter(Boolean)
  };
}
