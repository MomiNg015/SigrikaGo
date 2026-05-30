export const STONE_DECORATIONS = {
  "paw-stone": {
    id: "paw-stone",
    name: "爪印棋子",
    description: "圆润棋面上带有爪印图案的黑白棋子。",
    category: "stone",
    priceCoins: 500,
    previewImageUrl: "/assets/decorations/paw-stone-preview.png",
    images: {
      black: "/assets/decorations/paw-stone-black.png",
      white: "/assets/decorations/paw-stone-white.png"
    }
  },
  "papagan-peach-stone": {
    id: "papagan-peach-stone",
    name: "耙耙柑和水蜜桃",
    description: "黑子使用耙耙柑造型，白子使用水蜜桃造型的果味棋子套装。",
    category: "stone",
    priceCoins: 1000,
    previewImageUrl: "/assets/decorations/papagan-peach-stone-preview.png",
    images: {
      black: "/assets/decorations/papagan-peach-stone-black.png",
      white: "/assets/decorations/papagan-peach-stone-white.png"
    }
  }
};

export function getStoneDecoration(decorationId) {
  return STONE_DECORATIONS[decorationId] ?? null;
}

export function stoneDecorationImage(decorationId, color) {
  return getStoneDecoration(decorationId)?.images?.[color] ?? null;
}
