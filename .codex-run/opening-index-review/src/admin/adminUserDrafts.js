export function buildUserDraft(user) {
  return {
    id: user.id,
    role: user.role ?? "player",
    rank: user.rank ?? "3段",
    rating: user.rating ?? 0,
    coins: user.coins ?? 0,
    ownedCharactersText: (user.ownedCharacters ?? []).join(", "),
    ownedItemsText: (user.ownedItems ?? []).map((item) => `${item.itemId}:${item.quantity}`).join("\n"),
    selectedCharacter: user.selectedCharacter ?? ""
  };
}

export function parseOwnedItemsText(value = "") {
  return String(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [itemId, quantity = "1"] = line.split(":");
      return { itemId: itemId.trim(), quantity: Number(quantity) || 0 };
    })
    .filter((item) => item.itemId && item.quantity > 0);
}
