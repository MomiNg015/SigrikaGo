import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const AVAILABLE_CHARACTER_IDS = ["sigrika", "danea", "aemeath"];

export function publicUser(user) {
  const ownedCharacters = new Set(user.ownedCharacters.split(",").filter(Boolean));
  for (const characterId of AVAILABLE_CHARACTER_IDS) ownedCharacters.add(characterId);
  return {
    id: user.id,
    username: user.username,
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
