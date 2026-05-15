import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export function publicUser(user) {
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
    ownedCharacters: user.ownedCharacters.split(",").filter(Boolean),
    ownedItems: user.ownedItems.split(",").filter(Boolean),
    ownedDecorations: user.ownedDecorations.split(",").filter(Boolean)
  };
}
