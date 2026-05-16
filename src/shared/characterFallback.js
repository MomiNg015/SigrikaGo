export const FALLBACK_CHARACTERS = {
  sigrika: {
    id: "sigrika",
    name: "西格莉卡",
    palette: "#ff9b4d",
    portrait: "/assets/sigrika_centered.png",
    skill: {
      id: "erase-point",
      name: "星辉符文",
      uses: 1,
      cost: 3,
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
      cost: 3,
      description: "指定棋盘上的某个棋子，将其反色。"
    }
  },
  aemeath: {
    id: "aemeath",
    name: "爱弥斯",
    palette: "#67d9e8",
    portrait: "/assets/Aemeath_centered.png",
    skill: {
      id: "hidden-hand",
      name: "小爱出击",
      uses: 1,
      cost: 0,
      description: "本轮落子为隐藏手。落下了电子幽灵般的一手，应该不会被发现吧...",
      effectTags: ["隐藏手"]
    }
  }
};

export const fallbackCharacterList = Object.values(FALLBACK_CHARACTERS);
