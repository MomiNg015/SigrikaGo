export const FALLBACK_CHARACTERS = {
  sigrika: {
    id: "sigrika",
    name: "西格莉卡",
    palette: "#ff9b4d",
    portrait: "/assets/sigrika_centered.png",
    skill: {
      id: "erase-point",
      name: "星辰符文",
      uses: 1,
      description: "抹除棋盘上指定交叉点。该点不再可落子，也不参与数子。（使用该技能不消耗本次落子）",
      freeTurn: true
    }
  },
  danea: {
    id: "danea",
    name: "达妮娅",
    palette: "#f2a4d8",
    portrait: "/assets/Danea_centered.png",
    skill: {
      id: "flip-stone",
      name: "染秽",
      uses: 1,
      description: "指定棋盘上的某个棋子，将其反色。"
    }
  }
};

export const fallbackCharacterList = Object.values(FALLBACK_CHARACTERS);
